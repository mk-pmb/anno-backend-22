// -*- coding: utf-8, tab-width: 2 -*-

import mapMergeDefaults from 'map-merge-defaults-pmb';
import pEachSeries from 'p-each-series';
import randomUuid from 'uuid-random';
import sortedJson from 'safe-sortedjson';

import detectUserIdentity from '../../../acl/detectUserIdentity.mjs';
import httpErrors from '../../../httpErrors.mjs';
import parseRequestBody from '../../util/parseRequestBody.mjs';
import redundantGenericAnnoMeta from '../redundantGenericAnnoMeta.mjs';
import sendFinalTextResponse from '../../../finalTextResponse.mjs';

import categorizeTargets from '../categorizeTargets.mjs';
import miscMetaFieldInfos from '../miscMetaFieldInfos.mjs';

import checkVersionModifications from './checkVersionModifications.mjs';
import decideAuthorIdentity from './decideAuthorIdentity.mjs';
import fmtRelRecs from './fmtRelRecs.mjs';
import parseSubmittedAnno from './parseSubmittedAnno.mjs';


const {
  authorIdentityNotConfigured,
  badRequest,
} = httpErrors.throwable;

const errDuplicateRandomBaseId = httpErrors.fubar.explain(
  'ID assignment failed: Duplicate generated random UUID.').throwable;


function generateRandomBaseId() {
  // NB: For easy use in DOIs, the generated IDs need to be case-independent
  // because DOIS have to be case-independent.
  //  * The DataCite API lists the DOIs in lower case.
  //  * The UUID namespace defined in RFC 4122 (chapter 3) wants lower case.
  //  * Our UUID module generates lower case by default.
  return randomUuid();
}


function orf(x) { return x || false; }
function panic(msg) { throw new Error(msg); }
// function jsonDebug(x) { throw badRequest(JSON.stringify(x, null, 2)); }


const EX = async function postNewAnno(srv, req) {
  const parseCfg = {
    publicBaseUrlNoSlash: srv.publicBaseUrlNoSlash,
  };
  const anno = await parseRequestBody.fancy('json', req,
  ).then(ctx => ctx.catchBadInput(parseSubmittedAnno, parseCfg));
  const tgtCateg = categorizeTargets(srv, anno,
    { errInvalidAnno: badRequest });
  const {
    subjTgtUrls,
    replyTgtVersIds,
  } = tgtCateg;

  const who = await detectUserIdentity.andDetails(req);
  const ctx = {
    anno,
    idParts: { baseId: '', versNum: 1 },
    req,
    srv,
    who,

    async requirePermForSubjTgtUrls(privilegeName, origOpt) {
      const opt = orf(origOpt);
      const urlsList = (opt.customUrlsList || subjTgtUrls);
      const { aclMetaSpyEach } = opt;
      const aclMetaSpy = orf(opt.aclMetaSpy || (aclMetaSpyEach && {}));
      await pEachSeries(urlsList, async function checkUrl(url) {
        await srv.acl.requirePerm(req,
          { targetUrl: url, privilegeName, aclMetaSpy });
        await (aclMetaSpyEach && aclMetaSpyEach(aclMetaSpy, url));
      });
    },

  };
  ctx.author = await decideAuthorIdentity(ctx);

  if (anno['dc:isVersionOf'] && (!anno['dc:replaces'])) {
    const msg = ('On this server, '
      + 'revision requests must include a full "dc:replaces" URL.');
    throw badRequest(msg);
  }
  ctx.isRevisedVersion = Boolean(anno['dc:isVersionOf']
    || anno['dc:replaces']);
  ctx.postActionPrivName = (function decidePriv() {
    if (ctx.isRevisedVersion) {
      if (ctx.author.authorized) { return 'revise_own'; }
      return 'revise_any';
    }
    if (replyTgtVersIds.length) { return 'reply'; }
    return 'create';
  }());

  // req.logCkp('postNewAnno input', { subjTgtUrls, replyTgtVersIds });

  if (replyTgtVersIds.length > 1) {
    const msg = ('Cross-posting (reply to multiple annotations)'
      + ' is not supported yet.');
    // There's not really a strong reason. We'd just have to remove
    // the uniqueness restraint from the database structure.
    // A weak reason is that limiting the server capabilities to what
    // our frontend can do will prevent some accidents.
    throw badRequest(msg);
  }

  await EX.checkServiceConfigStuff(ctx);

  const previewMode = (anno.id === 'about:preview');
  if (!previewMode) {
    // Web Annotation Protocol, ch. 5.1 "Create a New Annotation":
    // "[…] the server […] MUST assign an IRI to the Annotation resource
    // in the id property, even if it already has one provided."
    // => Always act as if there was no "ID" field submitted.
    delete anno.id;
  }
  // req.logCkp('postNewAnno parsed:', { previewMode }, anno);

  miscMetaFieldInfos.nonInheritableFields.forEach(k => delete anno[k]);

  if (!previewMode) { await EX.intenseValidations(ctx); }

  anno.creator = (ctx.author.agent
    || panic('Author lookup failed without refusal.'));
  anno.created = (new Date()).toISOString();
  if (!ctx.idParts.baseId) { ctx.idParts.baseId = generateRandomBaseId(); }
  const fullAnno = redundantGenericAnnoMeta.add(srv, ctx.idParts, anno);
  const ftrOpt = {
    type: 'annoLD',
  };
  if (previewMode) {
    return sendFinalTextResponse.json(req, fullAnno, ftrOpt);
  }

  const dbAddr = {
    base_id: ctx.idParts.baseId,
    version_num: ctx.idParts.versNum,
  };
  const annoUserId = (who.userId || '');
  const dataRec = {
    ...dbAddr,
    time_created: fullAnno.created,
    author_local_userid: annoUserId,
    details: sortedJson(anno),
  };
  // At this point we don't yet have confirmation that our base_id will
  // be accepted. We optimistically pre-generate the stamp and relation
  // records anyway, to catch potential errors therein before touching
  // the database.
  const bareStamps = EX.decideBareStamps(ctx);
  const relRecs = fmtRelRecs({ srv, anno, ...ctx.idParts, tgtCateg });
  const stampRecs = mapMergeDefaults({
    ...dbAddr,
    st_at: fullAnno.created,
    st_by: annoUserId,
    st_effts: null,
    st_detail: null,
  }, 'st_type', bareStamps);

  // Now that all data has been validated, we can actually write to the DB.
  await srv.db.postgresInsertOneRecord('anno_data', dataRec, {
    customDupeError: errDuplicateRandomBaseId,
  });
  // At this point, our idParts have been accepted, so we can insert the
  // stamp and relation records as well.
  await pEachSeries(stampRecs,
    rec => srv.db.postgresInsertOneRecord('anno_stamps', rec));
  await pEachSeries(relRecs,
    rec => srv.db.postgresInsertOneRecord('anno_links', rec));

  ftrOpt.code = 201;
  req.res.header('Location', fullAnno.id);
  return sendFinalTextResponse.json(req, fullAnno, ftrOpt);
};


Object.assign(EX, {

  async intenseValidations(ctx) {
    await checkVersionModifications(ctx);

    (function verifyAuthorIdentityPermission() {
      if (ctx.author.authorized) { return true; }
      if (ctx.isRevisedVersion) {
        // Submission survived the ACL checks in checkVersionModifications()
        return true;
      }
      throw authorIdentityNotConfigured();
    }());
  },

  async checkServiceConfigStuff(ctx) {
    const servicesInvolved = new Set();
    const aclMetaSpy = {};
    await ctx.requirePermForSubjTgtUrls(ctx.postActionPrivName, {
      aclMetaSpy,
      aclMetaSpyEach(meta) { servicesInvolved.add(meta.serviceId); },
    });
    if (servicesInvolved.size > 1) {
      await ctx.requirePermForSubjTgtUrls('create_across_services');
    }
    ctx.anySvcCfgFlag = flag => !!aclMetaSpy['nServicesWith:' + flag];
    // ^-- :TODO: Why does eslint allow this param reassignment?
  },


  decideBareStamps(ctx) {
    const bs = [];
    const mfi = miscMetaFieldInfos;
    const flag = ctx.anySvcCfgFlag;
    if (flag('approvalRequired')) { bs.push(mfi.unapprovedStampName); }

    const old = orf(ctx.oldAnnoDetails);
    if (old[mfi.doiStampName] && flag('autoRequestNextVersionDoi')) {
      bs.push(mfi.doiRequestStampName);
    }

    return bs;
  },


});



export default EX;
