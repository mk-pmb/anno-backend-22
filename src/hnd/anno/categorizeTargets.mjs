// -*- coding: utf-8, tab-width: 2 -*-

import guessAndParseSubjectTargetUrl
  from 'webanno-guess-subject-target-url-pmb/extra/parse.mjs';

import httpErrors from '../../httpErrors.mjs';


const {
  badRequest,
} = httpErrors.throwable;


function orf(x) { return x || false; }


const EX = function categorizeTargets(srv, anno) {
  const report = {
    subjTgtUrls: [],
    replyTgtVersIds: [],
  };
  const replyTgtBaseUrl = srv.publicBaseUrlNoSlash + '/anno/';

  const targetsList = [].concat(orf(anno).target);
  const nTargets = targetsList.length;
  targetsList.forEach(function categorize(tgt, idx) {
    if (!tgt) { return; }
    const tgtIdUrl = String(tgt.tgtIdUrl || '');
    if (tgtIdUrl && tgtIdUrl.startsWith(replyTgtBaseUrl)) {
      const versId = tgtIdUrl.slice(replyTgtBaseUrl.length);
      // :TODO: Verify versId safety + syntax
      return report.replyTgtVersIds.push(versId);
    }
    try {
      const subjTgt = guessAndParseSubjectTargetUrl({ target: tgt });
      // ^-- Using parse because it includes safety checks.
      return report.subjTgtUrls.push(subjTgt.url);
    } catch (err) {
      const msg = ('Unable to categorize target #' + (idx + 1)
        + '/' + nTargets);
      throw badRequest(msg);
    }
  });

  if (!report.subjTgtUrls.length) {
    throw new Error('Found no subject target');
  }
  return report;
};


export default EX;
