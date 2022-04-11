// -*- coding: utf-8, tab-width: 2 -*-

export {}; // no-op except it forces parsers into ES module mode.


const noCacheRgx = /(?:^|;\s*)no-cache(?=;|$)/;

function hasNoCacheHeader(req, key) {
  const v = req.headers[key];
  return (v && noCacheRgx.test(v) && '↺');
}


const EX = function logIncomingRequest(req) {
  const { query } = req;
  const hasQuery = (Object.keys(query).length ? '?' : '');

  const flags = [
    hasNoCacheHeader(req, 'pragma'),
    hasNoCacheHeader(req, 'cache-control'),
    hasQuery,
  ].filter(Boolean).join('');

  const info = [
    req.method,
    req.url,
    flags,
    (hasQuery && query),
  ].filter(Boolean);

  console.debug('Incoming request:', ...info);
  req.next();
};


export default EX;
