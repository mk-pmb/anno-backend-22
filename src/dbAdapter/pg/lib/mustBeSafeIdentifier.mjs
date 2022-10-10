// -*- coding: utf-8, tab-width: 2 -*-

const accept = /^[a-z]\w*$/;

const EX = function mustBeSafeIdentifier(x) {
  const ok = (accept.exec(x) || false)[0];
  if (ok === x) { return ok; }
  throw new Error('Not a safe identifier: ' + x);
};


export default EX;
