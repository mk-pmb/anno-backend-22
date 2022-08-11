// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';
import regexpFlagsUpfront from 'regexp-flags-upfront';


const EX = {

  replace_regexp(how) {
    const { details, popSimp } = how;
    const p = mustBe.nest('RegExp pattern', details).trimEnd();
    if (!p) { throw new Error('Empty search pattern'); }
    const r = regexpFlagsUpfront(p);
    const w = popSimp.mustBe('str', 'replace_with');
    // console.debug('Prepare replace_regexp:', { r, w });
    return function userIdTransformReplaceRegexp(u) {
      const b = u.replace(r, w);
      // console.debug('D: userId transform replace_regexp:', { u, p, w, b });
      return b;
    };
  },


};


export default EX;
