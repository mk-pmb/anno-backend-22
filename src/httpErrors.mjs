// -*- coding: utf-8, tab-width: 2 -*-

import sendFinalTextResponse from './finalTextResponse.mjs';


const errs = {

  noSuchResource(req) {
    const mtd = req.method;
    const getLike = ((mtd === 'GET')
      || (mtd === 'HEAD')
      || (mtd === 'OPTIONS')
    );
    sendFinalTextResponse(req, (getLike
      ? { code: 404, text: 'File not found' }
      : { code: 405, text: 'Method Not Allowed' }));
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
    return next();
  },


};


export default errs;
