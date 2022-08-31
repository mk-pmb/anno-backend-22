// -*- coding: utf-8, tab-width: 2 -*-

import guessAndParseSubjectTargetUrl
  from 'webanno-guess-subject-target-url-pmb/extra/parse.mjs';

// import makeDictList from 'dictlist-util-pmb';
import mustBe from 'typechecks-pmb/must-be';
import objPop from 'objpop';

import httpErrors from '../../httpErrors.mjs';
// import sendFinalTextResponse from '../../finalTextResponse.mjs';
import parseRequestBody from '../util/parseRequestBody.mjs';
import redundantGenericAnnoMeta from './redundantGenericAnnoMeta.mjs';


const errNoTargets = httpErrors.badRequest.explain(
  'Unable to determine annotation target(s).');

const verbatimCopyKeysMandatedByProtocol = [
  'canonical',
];

function findTargetOrBail(anno) {
  try {
    return guessAndParseSubjectTargetUrl(anno);
    // ^-- Using parse because it includes safety checks.
  } catch (errTgt) {
    throw errNoTargets.throwable();
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
    copy('title', 'nonEmpty str');
    copy('target', 'obj | ary');
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
      throw httpErrors.badRequest.explain(msg).throwable();
    }
  },

});


export default EX;
