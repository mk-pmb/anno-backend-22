// -*- coding: utf-8, tab-width: 2 -*-

import loMapValues from 'lodash.mapvalues';

function plainHeaderLookup(hdrName, req) { return req.header(hdrName); }


const EX = function headers(ctx) {
  const headerNamesLists = {};

  function popHeaderNamesList(key, convert) {
    const orig = ctx.popDetail('nonEmpty str | nonEmpty ary', key);
    const list = [].concat(orig || []);
    list.convert = convert;
    headerNamesLists[key] = list;
  }

  popHeaderNamesList('userId', String);
  popHeaderNamesList('renewalAvailableBefore', Number);
  popHeaderNamesList('sessionExpiryHardLimit', Number);

  const headerLookup = (ctx.headerLookupFunc || plainHeaderLookup);
  // ^-- Easy way to plug a stub for testing and debugging.

  const det = function detectIdentityHeaders(req) {
    const report = loMapValues(headerNamesLists, function one(list) {
      let found = false;
      list.some(function maybe(headerName) {
        const raw = headerLookup(headerName, req);
        if (!raw) { return; }
        const val = list.convert(raw);
        if (!val) { return; }
        found = val;
        return found;
      });
      return found;
    });
    if (!report.userId) { return false; }
    return report;
  };
  return det;
};


export default EX;
