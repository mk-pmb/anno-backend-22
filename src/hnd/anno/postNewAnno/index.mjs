// -*- coding: utf-8, tab-width: 2 -*-

import guessAndParseSubjectTargetUrl
  from 'webanno-guess-subject-target-url-pmb/extra/parse.mjs';

// import makeDictList from 'dictlist-util-pmb';
import mustBe from 'typechecks-pmb/must-be';
import objPop from 'objpop';

import httpErrors from '../../httpErrors.mjs';
import parseRequestBody from '../util/parseRequestBody.mjs';
import redundantGenericAnnoMeta from './redundantGenericAnnoMeta.mjs';
import sendFinalTextResponse from '../../finalTextResponse.mjs';


const failBadRequest = httpErrors.badRequest.throwable;

const verbatimCopyKeysMandatedByProtocol = [
  'canonical',
];

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

  const anno = EX.fallibleParseSubmittedAnno(req, origInput);
  req.logCkp('postNewAnno result:', anno);
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


Object.assign(EX, {

  parseSubmittedAnno(origInput) {
    const mustPopInput = objPop(origInput, { mustBe }).mustBe;
    redundantGenericAnnoMeta.mustPopAllStatic(mustPopInput);

    const anno = {};
    function copy(key, rule) {
      const val = mustPopInput(rule, key);
      if (val !== undefined) { anno[key] = val; }
    }
    verbatimCopyKeysMandatedByProtocol.forEach(k => copy(k, 'str | undef'));
    copy('id', 'undef | nonEmpty str');
    copy('target', 'obj | ary');
    copy('title', 'nonEmpty str');
    // copy('author', 'obj');
    copy('body', 'obj | ary');
    copy('rights', 'nonEmpty str | undef');

    mustPopInput.expectEmpty('Unsupported annotation field');
    return anno;
  },

  fallibleParseSubmittedAnno(req, origInput) {
    try {
      return EX.parseSubmittedAnno(origInput);
    } catch (parseErr) {
      const msg = ('Parse annotation: ' + String(parseErr));
      throw failBadRequest(msg);
    }
  },

});


export default EX;
