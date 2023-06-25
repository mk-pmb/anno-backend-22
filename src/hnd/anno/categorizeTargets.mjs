// -*- coding: utf-8, tab-width: 2 -*-

import guessAndParseSubjectTargetUrl
  from 'webanno-guess-subject-target-url-pmb/extra/parse.mjs';

import arrayOfTruths from 'array-of-truths';
import mustBe from 'typechecks-pmb/must-be';

import httpErrors from '../../httpErrors.mjs';
import parseVersId from './parseVersionIdentifier.mjs';


const replyField = 'as:inReplyTo';


const EX = function categorizeTargets(srv, anno, opt) {
  const {
    errInvalidAnno,
  } = { ...EX.dfOpt, ...opt };
  if (!anno) { throw errInvalidAnno('Annotation required'); }

  // console.debug(replyField, 'before:', anno[replyField]);
  const replyTgtUrls = [];
  const replyTgtVersIds = [];
  arrayOfTruths(anno[replyField]).forEach(function validate(t) {
    EX.validateReplyTgtNest(t);
    const { versId, url } = parseVersId.fromLocalUrl(srv, errInvalidAnno, t);
    replyTgtUrls.push(url);
    replyTgtVersIds.push(versId);
  });

  const subjTgtUrls = [];
  const targetsList = arrayOfTruths(anno.target);
  const nTargets = targetsList.length;
  targetsList.forEach(function categorize(tgt, idx) {
    if (replyTgtUrls.includes(tgt)) { return; }
    try {
      const subjTgt = guessAndParseSubjectTargetUrl({ target: tgt });
      // ^-- Using parse because it includes safety checks.
      if (!subjTgtUrls.includes(subjTgt.url)) {
        // ^- Duplicates may occurr when the SVG selector's scope is also
        //    given as the "id": of another target entry.
        subjTgtUrls.push(subjTgt.url);
      }
      return;
    } catch (err) {
      const msg = ('Unable to categorize target #' + (idx + 1)
        + '/' + nTargets);
      throw errInvalidAnno(msg);
    }
  });

  if (!subjTgtUrls.length) { throw new Error('Found no subject target'); }

  const report = {
    subjTgtUrls,
    replyTgtVersIds,
  };
  return report;
};


Object.assign(EX, {

  dfOpt: {
    errInvalidAnno: httpErrors.throwable.fubar,
  },

  validateReplyTgtNest: mustBe('nonEmpty str', replyField + ' URI'),


});


export default EX;
