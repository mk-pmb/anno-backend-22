// -*- coding: utf-8, tab-width: 2 -*-

import isGetLikeMethod from './isGetLikeMethod.mjs';
import sendFinalTextResponse from './finalTextResponse.mjs';


const EX = {

  noSuchResource(req) {
    if (!isGetLikeMethod(req)) { return EX.badMethod(req); }
    return sendFinalTextResponse(req, { code: 404, text: 'File not found' });
  },


  badMethod(req) {
    sendFinalTextResponse(req, { code: 405, text: 'Method Not Allowed' });
  },


  custom500(msg) {
    return function cannedReply(req) {
      sendFinalTextResponse(req, { code: 500, text: msg });
    };
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
