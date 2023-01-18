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

import decideAuthorIdentity from './decideAuthorIdentity.mjs';
import parseSubmittedAnno from './parseSubmittedAnno.mjs';

const {
  badRequest,
} = httpErrors.throwable;

const errDuplicateRandomUuid = httpErrors.fubar.explain(
  'ID assignment failed: Duplicate generated random UUID.').throwable;


const EX = async function postNewAnno(srv, req) {
  const origInput = await parseRequestBody('json', req);

  const anno = parseSubmittedAnno.fallible(req, origInput, badRequest);
  const tgtCateg = categorizeTargets(srv, anno);
  const {
    subjTgtUrls,
    replyTgtVersIds,
  } = tgtCateg;

  req.logCkp('postNewAnno input', { origInput, subjTgtUrls, replyTgtVersIds });
  await Promise.all(subjTgtUrls.map(url => srv.acl.requirePerm(req, {
    targetUrl: url,
    privilegeName: 'create',
  })));

  const who = await detectUserIdentity.andDetails(req);
  // console.debug('postNewAnno who:', who);

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

  const baseId = (anno.id || randomUuid());
  const versNum = 1;
  const idParts = { baseId, versNum };
  anno.creator = await decideAuthorIdentity({ srv, req, who, anno });
  anno.created = (new Date()).toISOString();
  const fullAnno = redundantGenericAnnoMeta.add(srv, idParts, anno);
  const ftrOpt = {
    type: 'annoLD',
  };
  if (previewMode) {
    return sendFinalTextResponse.json(req, fullAnno, ftrOpt);
  }

  const recIdParts = { base_id: baseId, version_num: versNum };
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


export default EX;
