// -*- coding: utf-8, tab-width: 2 -*-

import sendFinalTextResponse from './finalTextResponse.mjs';

const hnd = function whoamiHandler(req) {
  sendFinalTextResponse.json(req, req.headers);
};

export default hnd;
