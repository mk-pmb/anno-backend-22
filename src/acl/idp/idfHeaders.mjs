// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import loMapValues from 'lodash.mapvalues';

function plainHeaderLookup(hdrName, req) { return req.header(hdrName); }

function nonEmptyObj(mustPop, key) {
  const o = mustPop('obj | nul | undef', key);
  return (o && Object.keys(o).length ? o : false);
}


function unixTime() { return Math.floor(Date.now() / 1e3); }


const EX = function headers(ctx) {
  const headerNamesLists = EX.learnHeaderNamesLists(ctx.popDetail);
  // ^-- Map [session identity report field name] -> [list of header names].

  const headerLookup = ctx.popDetail('fun | undef',
    'headerLookupFunc', plainHeaderLookup);
    // ^-- Easy way to plug a stub for testing and debugging.

  const loginExtraHeaders = nonEmptyObj(ctx.popDetail, 'loginExtraHeaders');
  EX.predictLoginExtraHeaderProblems(loginExtraHeaders);

  const det = function detectIdentityHeaders(req, detectorOpts) {
    const report = loMapValues(headerNamesLists,
      hnl => EX.detectReportField(req, headerLookup, hnl));
    if (!report.userId) { return false; }
    if (loginExtraHeaders) {
      if (detectorOpts && (detectorOpts.occasion === 'session:login')) {
        EX.sendLoginExtraHeaders(req, report, loginExtraHeaders, headerLookup);
      }
    }
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


  predictLoginExtraHeaderProblems(loginExtraHeaders) {
    loMapValues(loginExtraHeaders, function oneHeader(origVal, headerName) {
      const lcName = headerName.toLowerCase();
      if (lcName.startsWith('x-')) {
        const bug = ('loginExtraHeaders: Cannot use X-… headers because they '
          + 'would be discarded by Express or Node.js.');
        throw new Error(bug);
      }
    });
  },


  sendLoginExtraHeaders(req, report, loginExtraHeaders, headerLookup) {
    loMapValues(loginExtraHeaders, function oneHeader(origVal, headerName) {
      let val = String(origVal || '');
      if (!val) { return; }
      const received = headerLookup(headerName, req) || '';
      val = val.replace(/\vu/g, report.userId);
      val = val.replace(/\vt/g, unixTime);
      val = val.replace(/\vh/g, received);
      if (!val) { return; }
      req.res.header(headerName, val);
    });
  },


});




export default EX;
