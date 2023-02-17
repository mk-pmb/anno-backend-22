// -*- coding: utf-8, tab-width: 2 -*-

import pMap from 'p-map';
import randomUuid from 'uuid-random';
import sortedJson from 'safe-sortedjson';

import detectUserIdentity from '../../../acl/detectUserIdentity.mjs';
import httpErrors from '../../../httpErrors.mjs';
import parseRequestBody from '../../util/parseRequestBody.mjs';
import redundantGenericAnnoMeta from '../redundantGenericAnnoMeta.mjs';
import sendFinalTextResponse from '../../../finalTextResponse.mjs';

import categorizeTargets from '../categorizeTargets.mjs';

import checkVersionModifications from './checkVersionModifications.mjs';
import decideAuthorIdentity from './decideAuthorIdentity.mjs';
import parseSubmittedAnno from './parseSubmittedAnno.mjs';

const {
  badRequest,
  authorIdentityNotConfigured,
} = httpErrors.throwable;

const errDuplicateRandomUuid = httpErrors.fubar.explain(
  'ID assignment failed: Duplicate generated random UUID.').throwable;


function panic(msg) { throw new Error(msg); }


const EX = async function postNewAnno(srv, req) {
  const origInput = await parseRequestBody('json', req);

  const anno = parseSubmittedAnno.fallible(req, origInput, badRequest);
  const tgtCateg = categorizeTargets(srv, anno);
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

    async requirePermForAllSubjTgts(privilegeName) {
      await Promise.all(subjTgtUrls.map(url => srv.acl.requirePerm(req,
        { targetUrl: url, privilegeName })));
    },

  };
  ctx.author = await decideAuthorIdentity(ctx);

  ctx.postActionPrivName = (function decidePriv() {
    if (anno['dc:isVersionOf']) {
      if (ctx.author.authorized) { return 'revise_own'; }
      return 'revise_global';
    }
    if (replyTgtVersIds.length) { return 'reply'; }
    return 'create';
  }());

  req.logCkp('postNewAnno input', { subjTgtUrls, replyTgtVersIds });

  await ctx.requirePermForAllSubjTgts(ctx.postActionPrivName);

  if (replyTgtVersIds.length > 1) {
    const msg = ('Cross-posting (reply to multiple annotations)'
      + ' is not supported yet.');
    // There's not really a strong reason. We'd just have to remove
    // the uniqueness restraint from the database structure.
    // A weak reason is that limiting the server capabilities to what
    // our frontend can do will prevent some accidents.
    throw badRequest(msg);
  }

  const previewMode = (anno.id === 'about:preview');
  if ((!previewMode) && (anno.id !== undefined)) {
    const msg = ('Please omit the "id" field from your submission,'
      + ' as it will be assigned by the server.');
    throw badRequest(msg);
    // We consider an ID submission as bad request rather than a mere
    // policy-based denial, because the anno-protocol doesn't even
    // consider this way of conveying the IRI suggestion. Instead,
    // it explicitly describes another mechanism for suggesting an IRI:
    // The "Slug" header. (Which we "may" just ignore.)
  }
  // req.logCkp('postNewAnno parsed:', { previewMode }, anno);

  if (!previewMode) { await EX.intenseValidations(ctx); }

  if (!ctx.author.authorized) { throw authorIdentityNotConfigured(); }
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

  const recIdParts = {
    base_id: ctx.idParts.baseId,
    version_num: ctx.idParts.versNum,
  };
  const dbRec = {
    ...recIdParts,
    time_created: fullAnno.created,
    author_local_userid: (who.userId || ''),
    details: sortedJson(anno),
  };
  await srv.db.postgresInsertOneRecord('anno_data', dbRec, {
    customDupeError: errDuplicateRandomUuid,
  });

  // Now that the idParts are successfully assigned, we can register
  // the anno's relations:
  async function regRels(rel, urlsList) {
    await pMap(urlsList, async function regOneRel(url) {
      const relRec = { ...recIdParts, rel, url };
      await srv.db.postgresInsertOneRecord('anno_links', relRec);
    });
  }
  await regRels('subject', subjTgtUrls);
  await regRels('inReplyTo', replyTgtVersIds);

  ftrOpt.code = 201;
  req.res.header('Location', fullAnno.id);
  return sendFinalTextResponse.json(req, fullAnno, ftrOpt);
};


Object.assign(EX, {

  async intenseValidations(ctx) {
    await checkVersionModifications(ctx);
  },


});



export default EX;
