// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import guessAndParseSubjectTargetUrl
  from 'webanno-guess-subject-target-url-pmb/extra/parse.mjs';
import mustBe from 'typechecks-pmb/must-be';

import httpErrors from '../../httpErrors.mjs';
import parseVersId from './parseVersionIdentifier.mjs';


function orf(x) { return x || false; }

const replyField = 'as:inReplyTo';


const EX = function categorizeTargets(srv, anno, opt) {
  const {
    errInvalidAnno,
  } = { ...EX.dfOpt, ...opt };
  if (!anno) { throw errInvalidAnno('Annotation required'); }

  const replyTgtUrls = arrayOfTruths(anno[replyField]);
  // console.debug(replyField, 'before:', anno[replyField]);
  const replyTgtVersIds = [];
  replyTgtUrls.forEach(mustBe('nonEmpty str', replyField + ' URL'));
  replyTgtUrls.forEach(function vali(url) {
    const { versId } = parseVersId.fromLocalUrl(srv, url);
    if (versId) { return replyTgtVersIds.push(versId); }
    throw errInvalidAnno('Currently, only local reply targets are supported.');
  });

  const subjTgtUrls = [];
  const targetsList = arrayOfTruths(orf(anno).target);
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


});


export default EX;
