// -*- coding: utf-8, tab-width: 2 -*-

import compareTargetLists from 'webanno-compare-target-lists-pmb';
import getOwn from 'getown';
import objPop from 'objpop';
import sortedJson from 'safe-sortedjson';

import httpErrors from '../../../httpErrors.mjs';
import idGetHnd from '../idGet/index.mjs';
import miscMetaFieldInfos from '../miscMetaFieldInfos.mjs';
import parseVersId from '../parseVersionIdentifier.mjs';


const {
  badRequest,
  fubar,
} = httpErrors.throwable;


// function jsonDeepCopy(x) { return JSON.parse(JSON.stringify(x)); }

function commaList(x) { return Array.from(x).sort().join(', '); }


const EX = async function checkVersionModifications(ctx) {
  const { anno, idParts, req } = ctx;
  await EX.validateAnnoIdParts(ctx);
  if (!idParts.baseId) { return; }
  const lookup = await idGetHnd.lookupExactVersion(ctx);
  ctx.oldAnnoDetails = lookup.annoDetails;
  idParts.versNum += 1;

  ctx.annoChanges = EX.findAndPluckAllChanges(ctx.oldAnnoDetails, anno);
  req.logCkp('postNewAnno anno diff:', ctx.annoChanges);
  const nUpdates = Object.keys(ctx.annoChanges).length;
  if (nUpdates < 1) { throw badRequest('Found no modifications.'); }
  await EX.validateModificationPermissions(ctx);
  Object.assign(anno, ctx.oldAnnoDetails, ctx.annoChanges);
};


Object.assign(EX, {

  async validateAnnoIdParts(ctx) {
    const { srv, anno, idParts } = ctx;
    const pluckProp = objPop.d(anno);
    const dcReplaces = pluckProp('dc:replaces');
    const versOf = pluckProp('dc:isVersionOf');
    if (!versOf) {
      if (!dcReplaces) { return; } // <- not a version request.
      throw badRequest('Required field dc:isVersionOf is missing.');
    }

    const oldAnnoIdParts = parseVersId.fromLocalUrl(srv, fubar, versOf);
    if (oldAnnoIdParts.versNum !== 0) {
      /*
        We can only accept the exact dc:isVersionOf URL that we will use
        for delivery, because Anno Protocol forbids us from modifying
        submitted fields.
      */
      const msg = ('Unacceptable version number '
        + oldAnnoIdParts.versNum + ' in dc:isVersionOf');
      throw badRequest(msg);
    }
    idParts.baseId = oldAnnoIdParts.baseId;
    idParts.versNum = await idGetHnd.lookupLatestVersionNum(ctx);
    if (dcReplaces) { await EX.validateDcReplaces(dcReplaces, ctx); }
  },


  validateDcReplaces(dcReplaces, ctx) {
    if (!dcReplaces) { return; }
    const submissionIdParts = parseVersId.fromLocalUrl(ctx.srv,
      badRequest, dcReplaces);
    const latestReviIdParts = ctx.idParts;
    if (submissionIdParts.baseId !== latestReviIdParts.baseId) {
      throw badRequest('Fields dc:isVersionOf and dc:replaces do not match.');
    }

    /*
      We have to restrict dc:replaces to the latest version because we use
      a version number counting strategy and other parts of the server rely
      on it to use calculation rather than database lookups.
      Which makes sense because users will expect that the latest version
      replaces all prior versions. Thus, when delivering the latest version,
      it needs to express the fact that it replaces the previous version.
      Anno Protocol forbids modifying fields that have been explicitly
      submitted, so we must instead require the author to either omit the
      dc:replaces field, or to at least include the currently-latest version.
      However, when including the currently-latest version, it's redundant
      to include any prior versions, because their replacement is already
      stated in the chain, one step at a time.
      In summary, the only dc:replaces value that is useful AND acceptable
      AND efficient, is the URL of the currently-latest version.
    */
    if (submissionIdParts.versNum !== latestReviIdParts.versNum) {
      const msg = ('Field dc:replaces must be omitted'
        + ' or must point to the latest version'
        + ', which currently is ' + latestReviIdParts.versNum + '.');
      throw badRequest(msg);
    }
  },


  findAndPluckAllChanges(oldAnno, newAnno) {
    const updates = {};
    const omissions = new Set(Object.keys(oldAnno));
    Object.entries(newAnno).forEach(function decide(updPair) {
      const [updKey, updVal] = updPair;
      delete newAnno[updKey]; // eslint-disable-line no-param-reassign
      omissions.delete(updKey);
      if (updVal === undefined) {
        throw new Error('Exotic failure in input parsing');
      }
      const oldVal = getOwn(oldAnno, updKey);
      // if (oldVal === undefined) // … don't care, safe-sortedjson can cope.
      if (sortedJson(updVal) === sortedJson(oldVal)) { return; }
      updates[updKey] = updVal;
    });
    if (Object.keys(newAnno).length !== 0) {
      throw new Error('Exotic fail: Some input managed to evade comparison.');
    }

    miscMetaFieldInfos.nonInheritableFields.forEach(k => omissions.delete(k));

    if (omissions.size) {
      const msg = ('Omissions are not currently supported in versions.'
        + ' The missing fields are: ' + commaList(omissions.keys()));
      throw badRequest(msg);
    }
    return updates;
  },


  async validateModificationPermissions(ctx) {
    const { annoChanges } = ctx;
    const updKeys = new Set(Object.keys(annoChanges));

    async function chkPerm(key, how, customPerm) {
      if (!updKeys.has(key)) { return; }
      const perm = (ctx.postActionPrivName + '_'
        + (customPerm || key.replace(/^\S+:/, '')));
      await how(key, perm);
      updKeys.delete(key);
    }
    function opaque(key, perm) { return ctx.requirePermForAllSubjTgts(perm); }

    await chkPerm('body', opaque);
    await chkPerm('creator', opaque);
    await chkPerm('dc:title', opaque, 'body');

    // At this point of control flow we know the submitter has permission
    // to modify dc:title AND body, so they should probably also be allowed
    // to modify metadata about those.
    updKeys.delete('dc:language');

    if (updKeys.has('target')) {
      await EX.validateTargetModifications(ctx);
      updKeys.delete('target');
    }

    if (updKeys.size) {
      const msg = ('Cannot validate permission to modify these fields: '
        + commaList(updKeys.keys()));
      throw badRequest(msg);
    }
  },


  guessSingleTargetUrl(tgt) {
    return (tgt.scope
      || tgt.id
      || tgt.source
      || tgt);
  },


  async validateTargetModifications(ctx) {
    const diff = compareTargetLists(ctx.oldAnnoDetails, ctx.annoChanges);
    const permPrefix = ctx.postActionPrivName + '_';

    function chkList(perm, list) {
      return ctx.requirePermForAllTheseUrls(permPrefix + perm,
        list.map(EX.guessSingleTargetUrl));
    }

    await chkList('target_del', diff.removed);
    await chkList('target_add', diff.added);

    /*  Re-ordering currently doesn't matter because we only allow one
        subject target anyway. Once we decide to check it, we need to
        allow users who lack explicit reorder permission, but have
        permission to remove and add targets, to subsitute them instead
        of the reorder permission.

    if (!diff.commonSameOrder) {
      // ^-- We use this negation to fail safely if the API changes.
      await chkList('target_reorder', diff.commonInOld);
    }
    */
  },


});


export default EX;
