// -*- coding: utf-8, tab-width: 2 -*-
//
// These are added to ALL routes, so make sure to keep them as minimal
// and as quick as possible.

import qrystr from 'qrystr';

import sendFinalTextResponse from '../finalTextResponse.mjs';
import guessClientPrefersHtml from './util/guessClientPrefersHtml.mjs';


const EX = function installGlobalRequestExtras(app) {
  const f = function extras(...u) { return Object.assign(f, ...u); };
  // ^- This function can be used to easily add more extras later on
  //    once they are available (like `.getDb`).
  Object.assign(f, EX.initialExtras);
  app.use(function enhance(req) { Object.assign(req, f).next(); });
  app.globalRequestExtras = f; // eslint-disable-line no-param-reassign
  return f;
};


EX.initialExtras = {

  debugOpt() {
    const req = this;
    let o = req.cachedDebugOpts;
    if (o === undefined) {
      o = req.cookies.as22debug;
      o = (o ? qrystr(o) : false);
      req.cachedDebugOpts = o;
    }
    return o;
  },


  nicerRedirect(destUrl) {
    const req = this;
    if (guessClientPrefersHtml(req) && req.debugOpt().noredir) {
      const msg = 'Debug cookie prevented redirect to: <' + destUrl + '>\n';
      return sendFinalTextResponse(req, msg, { type: 'plain' });
    }
    return req.res.redirect(destUrl);
  },


};


export default EX;
