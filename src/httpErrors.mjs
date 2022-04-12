// -*- coding: utf-8, tab-width: 2 -*-

import isGetLikeMethod from './isGetLikeMethod.mjs';
import sendFinalTextResponse from './finalTextResponse.mjs';

const makeCanned = sendFinalTextResponse.simpleCanned;
// ^-- Unfortunately the verb "(to) can" is easy to confuse with other "can"s.


const EX = {

  badVerb: makeCanned(405, 'Method Not Allowed'),
  noSuchResource(r) { (isGetLikeMethod(r) ? EX.notFound : EX.badVerb)(r); },
  notFound: makeCanned(404, 'File not found'),
  notImpl: makeCanned(501, 'Not Implemented'),


  throwable(msg, opt) {
    if (Number.isFinite(opt)) { return EX.throwable(msg, { code: opt }); }
    return Object.assign(new Error(msg), opt);
  },


  httpStatusCode(err) {
    const code = (err.code || err);
    return (Number.isFinite(code) && (code >= 100) && (code < 600) && code);
  },


  handleUnknownError: function hunk(err, req, res, next) {
    if (!res) { return hunk(err, req, req.res, req.next); }
    if (!err) { return next(); }
    let logVerb = 'Too late to serve';
    let reply;
    if (!req.complete) {
      const code = EX.httpStatusCode(err);
      if (code) {
        reply = err;
        logVerb = 'Serve';
      } else {
        reply = { code: 500, text: 'Internal Server Error' };
        logVerb = 'Censor';
      }
    }
    console.warn('httpErrors.handleUnknownError: ' + logVerb
      + ' error message for:', err);
    if (reply) { sendFinalTextResponse(req, reply); }
  },


};


export default EX;
