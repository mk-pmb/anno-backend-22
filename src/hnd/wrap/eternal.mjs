// -*- coding: utf-8, tab-width: 2 -*-

const farFutureGmtString = 'Fri, 31 Dec 9999 22:59:59 GMT';
// ^- In theory, we could go up to
//    (new Date(Number.MAX_SAFE_INTEGER * 0.9592326)).toGMTString()
//    but some clients will probably use bad RegExps that expect
//    exactly 4 digits in the year.


function eternal(hnd) {
  function addExpiry(req, ...args) {
    req.res.header('Expires', farFutureGmtString);
    if (hnd) { return hnd(req, ...args); }
    return req.next();
  }
  return addExpiry;
}

export default eternal;
