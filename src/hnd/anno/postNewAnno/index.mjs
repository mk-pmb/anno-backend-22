// -*- coding: utf-8, tab-width: 2 -*-

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

const errDuplicateRandomUuid = httpErrors.fubar.explain(
  'ID assignment failed: Duplicate generated random UUID.').throwable;


function panic(msg) { throw new Error(msg); }


const EX = async function postNewAnno(srv, req) {
  const anno = await parseRequestBody.fancy('json', req,
  ).then(ctx => ctx.catchBadInput(parseSubmittedAnno));
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
      const opt = (origOpt || false);
      const urlsList = (opt.customUrlsList || subjTgtUrls);
      const spy = opt.aclMetaSpyEach;
      await pEachSeries(urlsList, async function checkUrl(url) {
        const aclMetaSpy = spy && {};
        await srv.acl.requirePerm(req,
          { targetUrl: url, privilegeName, aclMetaSpy });
        await (spy && spy(aclMetaSpy, url));
      });
    },

  };
  ctx.author = await decideAuthorIdentity(ctx);

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

  req.logCkp('postNewAnno input', { subjTgtUrls, replyTgtVersIds });

  if (replyTgtVersIds.length > 1) {
    const msg = ('Cross-posting (reply to multiple annotations)'
      + ' is not supported yet.');
    // There's not really a strong reason. We'd just have to remove
    // the uniqueness restraint from the database structure.
    // A weak reason is that limiting the server capabilities to what
    // our frontend can do will prevent some accidents.
    throw badRequest(msg);
  }

  const servicesInvolved = new Set();
  await ctx.requirePermForSubjTgtUrls(ctx.postActionPrivName, {
    aclMetaSpyEach(meta) { servicesInvolved.add(meta.serviceId); },
  });
  if (servicesInvolved.size > 1) {
    await ctx.requirePermForSubjTgtUrls('create_across_services');
  }

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
  if (!ctx.idParts.baseId) { ctx.idParts.baseId = randomUuid(); }
  const fullAnno = redundantGenericAnnoMeta.add(srv, ctx.idParts, anno);
  const ftrOpt = {
    type: 'annoLD',
  };
  if (previewMode) {
    return sendFinalTextResponse.json(req, fullAnno, ftrOpt);
  }

  const dbRec = {
    base_id: ctx.idParts.baseId,
    version_num: ctx.idParts.versNum,
    time_created: fullAnno.created,
    author_local_userid: (who.userId || ''),
    details: sortedJson(anno),
  };
  // At this point we don't yet have confirmation that our base_id will
  // be accepted. We optimistically pre-generate the relation records anyway,
  // to catch potential errors therein before touching the database.
  const relRecs = fmtRelRecs({ srv, anno, ...ctx.idParts, tgtCateg });

  // Now that all data has been validated, we can actually write to the DB.
  await srv.db.postgresInsertOneRecord('anno_data', dbRec, {
    customDupeError: errDuplicateRandomUuid,
  });
  // At this point, our idParts have been accepted, so we can insert the
  // relation records as well.
  await pEachSeries(relRecs,
    rr => srv.db.postgresInsertOneRecord('anno_links', rr));

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


});



export default EX;
