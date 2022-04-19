// -*- coding: utf-8, tab-width: 2 -*-

import expressTimeoutHandler from 'express-timeout-handler';

import httpErrors from './httpErrors.mjs';


const EX = function timeoutFallbackResponse(cfg) {
  if (!cfg) { return EX(true); }
  const opt = {
    timeout: (+cfg.timeoutMsec || 5e3),
    onTimeout: httpErrors.unexpectedlySlowTask,
  };
  const hnd = expressTimeoutHandler.handler(opt);
  return hnd;
};


Object.assign(EX, {

  setLimitMs(ms) {
    // Make a middleware that sets a custom timeout for its route.
    return expressTimeoutHandler.set(ms);
  },

});


export default EX;
