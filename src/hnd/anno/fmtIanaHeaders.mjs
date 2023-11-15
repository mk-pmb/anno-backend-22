// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import loMapValues from 'lodash.mapvalues';


const EX = function fmtIanaHeaders(dict) { return EX.onlyPrefixed(dict, ''); };

Object.assign(EX, {

  onlyPrefixed(dict, prefix) {
    if ((!prefix) && (prefix !== '')) {
      return EX.onlyPrefixed(dict, 'iana:');
    }
    const headers = {};
    const pxLen = prefix.length;
    loMapValues(dict, function maybe(origVal, origKey) {
      if (!origVal) { return; }
      if (prefix && (origKey.slice(0, pxLen) !== prefix)) { return; }
      const [hName, hVal] = EX.fmtOnePair(origKey.slice(pxLen), origVal);
      const oldVal = getOwn(headers, hName);
      headers[hName] = (oldVal ? [].concat(oldVal, hVal) : hVal);
    });
    return headers;
  },


  fmtOnePair(k, v) {
    return ['Link', '<' + v + '>; rel=' + k];
  },


});


export default EX;
