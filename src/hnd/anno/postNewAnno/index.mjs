// -*- coding: utf-8, tab-width: 2 -*-

import guessAndParseSubjectTargetUrl
  from 'webanno-guess-subject-target-url-pmb/extra/parse.mjs';

import pProps from 'p-props';
import randomUuid from 'uuid-random';
import sortedJson from 'safe-sortedjson';

import detectUserIdentity from '../../../acl/detectUserIdentity.mjs';
import httpErrors from '../../../httpErrors.mjs';
import parseRequestBody from '../../util/parseRequestBody.mjs';
import redundantGenericAnnoMeta from '../redundantGenericAnnoMeta.mjs';
import sendFinalTextResponse from '../../../finalTextResponse.mjs';

import decideAuthorIdentity from './decideAuthorIdentity.mjs';
import parseSubmittedAnno from './parseSubmittedAnno.mjs';

const {
  badRequest,
} = httpErrors.throwable;

const errDuplicateRandomUuid = httpErrors.fubar.explain(
  'ID assignment failed: Duplicate generated random UUID.').throwable;


function findTargetOrBail(anno) {
  try {
    return guessAndParseSubjectTargetUrl(anno);
    // ^-- Using parse because it includes safety checks.
  } catch (errTgt) {
    throw badRequest('Unable to determine annotation target(s).');
  }
}



const EX = async function postNewAnno(srv, req) {
  const origInput = await parseRequestBody('json', req);
  const subjTgt = findTargetOrBail(origInput);
  // req.logCkp('postNewAnno input', { origInput, subjTgt });

  await srv.acl.requirePerm(req, {
    targetUrl: subjTgt.url,
    privilegeName: 'create',
  });

  const who = await detectUserIdentity.andDetails(req);
  // console.debug('postNewAnno who:', who);

  const anno = parseSubmittedAnno.fallible(req, origInput, badRequest);
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

  const relations = { subject: subjTgt.url };
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
  await pProps(relations, async function regRel(url, rel) {
    const relRec = { ...recIdParts, rel, url };
    await srv.db.postgresInsertOneRecord('anno_links', relRec);
  });

  ftrOpt.code = 201;
  req.res.header('Location', fullAnno.id);
  return sendFinalTextResponse.json(req, fullAnno, ftrOpt);
};


export default EX;
