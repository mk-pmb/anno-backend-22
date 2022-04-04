// -*- coding: utf-8, tab-width: 2 -*-

import isGetLikeMethod from './isGetLikeMethod.mjs';
import sendFinalTextResponse from './finalTextResponse.mjs';


const errs = {

  noSuchResource(req) {
    if (!isGetLikeMethod(req)) { return errs.badMethod(req); }
    sendFinalTextResponse(req, { code: 404, text: 'File not found' });
  },


  badMethod(req) {
    sendFinalTextResponse(req, { code: 405, text: 'Method Not Allowed' });
  },


  handleUnknownError: function hunk(err, req, res, next) {
    if (!res) { return hunk(err, req, req.res, req.next); }
    if (!err) { return next(); }
    const { code } = err;
    if (Number.isFinite(code) && (code >= 100) && (code < 600)) {
      console.warn('Serving error message for:', err);
      return sendFinalTextResponse(req, err);
    }
    console.warn('Not serving error message for:', err);
    sendFinalTextResponse(req, { code: 500, text: 'Internal Server Error' });
  },


};


export default errs;
