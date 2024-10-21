// -*- coding: utf-8, tab-width: 2 -*-

import thh from 'trivial-http-headers';

const { farFuture } = thh.expires;

function eternal(hnd) {
  function addExpiry(req, ...args) {
    req.res.header('Expires', farFuture);
    if (hnd) { return hnd(req, ...args); }
    return req.next();
  }
  return addExpiry;
}

export default eternal;
