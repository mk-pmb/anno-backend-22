// -*- coding: utf-8, tab-width: 2 -*-

function simpleErrorHandler(err, req, resp, next) {
  if (!err) { return next(); }
  const { code } = err;
  if (Number.isFinite(code) && (code > 0) && (code < 600)) {
    console.warn('Serving error message for:', err);
    resp.header('Content-Type', 'text/plain; charset=UTF-8');
    resp.status(err.code);
    resp.send(err.message);
    return resp.end();
  }
  console.warn('Not serving error message for:', err);
  return next();
}

export default simpleErrorHandler;
