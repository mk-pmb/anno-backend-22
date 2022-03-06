// -*- coding: utf-8, tab-width: 2 -*-

import filterObj from 'filter-obj';

import sendFinalTextResponse from './finalTextResponse.mjs';


const relevantKeysRgx = /^(remote|shib)\b/i;

const hnd = function whoamiHandler(req) {
  const relevantHeaders = filterObj(req.headers,
    e => relevantKeysRgx.test(e[0]));
  sendFinalTextResponse.json(req, relevantHeaders);
};



export default hnd;
