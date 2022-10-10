// -*- coding: utf-8, tab-width: 2 -*-

import guessAndParseSubjectTargetUrl
  from 'webanno-guess-subject-target-url-pmb/extra/parse.mjs';

import httpErrors from '../../../httpErrors.mjs';
import parseRequestBody from '../../util/parseRequestBody.mjs';
// import redundantGenericAnnoMeta from '../redundantGenericAnnoMeta.mjs';
import sendFinalTextResponse from '../../../finalTextResponse.mjs';

import parseSubmittedAnno from './parseSubmittedAnno.mjs';

const failBadRequest = httpErrors.badRequest.throwable;


function findTargetOrBail(anno) {
  try {
    return guessAndParseSubjectTargetUrl(anno);
    // ^-- Using parse because it includes safety checks.
  } catch (errTgt) {
    throw failBadRequest('Unable to determine annotation target(s).');
  }
}


const EX = async function postNewAnno(srv, req) {
  const origInput = await parseRequestBody('json', req);
  const subjTgt = findTargetOrBail(origInput);
  req.logCkp('postNewAnno', { origInput, subjTgt });

  await srv.acl.requirePerm(req, {
    targetUrl: subjTgt.url,
    privilegeName: 'create',
  });

  const anno = parseSubmittedAnno.fallible(req, origInput, failBadRequest);
  const previewMode = (anno.id === 'about:preview');
  if ((!previewMode) && (anno.id !== undefined)) {
    const msg = ('Please omit the "id" field from your submission,'
      + ' as it will be assigned by the server.');
    throw failBadRequest(msg);
  }

  // await EX.validateOrUpdateAuthorInplace(srv, req, anno);

  if (previewMode) {
    return sendFinalTextResponse.json(req, anno, { type: 'annoLD' });
  }
  return httpErrors.notImpl.explain('Stub: '
    + 'Annotation seems acceptable but saving is not implemented yet.')(req);
};


export default EX;
