// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import sortedJson from 'safe-sortedjson';
import compareTargetLists from 'webanno-compare-target-lists-pmb';

import httpErrors from '../../../httpErrors.mjs';
import idGetHnd from '../idGet.mjs';
import parseVersId from '../parseVersionIdentifier.mjs';


const {
  badRequest,
} = httpErrors.throwable;


// function jsonDeepCopy(x) { return JSON.parse(JSON.stringify(x)); }

const versOfKey = 'dc:isVersionOf';

function commaList(x) { return Array.from(x).sort().join(', '); }


const EX = async function checkVersionModifications(ctx) {
  const {
    anno,
    idParts,
    req,
    srv,
  } = ctx;
  const versOf = anno[versOfKey];
  delete anno[versOfKey]; // Always delete. No later step should use this.
  if (!versOf) { return; }

  const { baseId } = parseVersId.fromLocalUrl(srv, versOf);
  idParts.baseId = baseId;
  idParts.versNum = await idGetHnd.lookupLatestVersionNum(srv, req, idParts);
  ctx.oldAnnoDetails = await idGetHnd.lookupExactVersion(srv, req, idParts);
  idParts.versNum += 1;

  ctx.annoChanges = EX.findAndPluckAllChanges(ctx.oldAnnoDetails, anno);
  req.logCkp('postNewAnno anno diff:', ctx.annoChanges);
  await EX.validateModificationPermissions(ctx);
  Object.assign(anno, ctx.oldAnnoDetails, ctx.annoChanges);
};


Object.assign(EX, {

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
    omissions.delete('created');
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
