// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import loMapValues from 'lodash.mapvalues';

function plainHeaderLookup(hdrName, req) { return req.header(hdrName); }


const EX = function headers(ctx) {
  const headerNamesLists = EX.learnHeaderNamesLists(ctx.popDetail);
  // ^-- Map [session identity report field name] -> [list of header names].

  const headerLookup = ctx.popDetail('fun | undef',
    'headerLookupFunc', plainHeaderLookup);
    // ^-- Easy way to plug a stub for testing and debugging.

  const det = function detectIdentityHeaders(req) {
    const report = loMapValues(headerNamesLists,
      hnl => EX.detectReportField(req, headerLookup, hnl));
    if (!report.userId) { return false; }
    return report;
  };
  return det;
};


Object.assign(EX, {

  learnHeaderNamesLists(popCfg) {
    const hnl = {};

    function learnOneField(key, convert) {
      // Lookup the list of header names that shall be used to determine
      // the `key` field of the session identity report.
      const list = arrayOfTruths(popCfg('nonEmpty str | nonEmpty ary', key));
      list.convert = convert;
      hnl[key] = list;
    }

    learnOneField('userId', String);
    learnOneField('renewalAvailableBefore', Number);
    learnOneField('sessionExpiryHardLimit', Number);
    return hnl;
  },


  detectReportField(req, headerLookup, hnl) {
    let found = false;
    hnl.some(function maybe(headerName) {
      const raw = headerLookup(headerName, req);
      if (!raw) { return; }
      const val = hnl.convert(raw);
      if (!val) { return; }
      found = val;
      return found;
    });
    return found;
  },


});




export default EX;
