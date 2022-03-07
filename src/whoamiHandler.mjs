// -*- coding: utf-8, tab-width: 2 -*-

import filterObj from 'filter-obj';

import sendFinalTextResponse from './finalTextResponse.mjs';


const relevantKeysRgx = /^(remote|shib)\b/i;

const hnd = function whoamiHandler(req) {
  const relevantHeaders = filterObj(req.headers,
    k => relevantKeysRgx.test(k));
  sendFinalTextResponse.json(req, relevantHeaders);
};



export default hnd;
