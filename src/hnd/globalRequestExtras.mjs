// -*- coding: utf-8, tab-width: 2 -*-
//
// These are added to ALL routes, so make sure to keep them as minimal
// and as quick as possible.

const EX = function installGlobalRequestExtras(app) {
  const f = function extras(...u) { return Object.assign(f, ...u); };
  app.use(function enhance(req) { Object.assign(req, f).next(); });
  app.globalRequestExtras = f; // eslint-disable-line no-param-reassign
  return f;
};


export default EX;
