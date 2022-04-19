// -*- coding: utf-8, tab-width: 2 -*-

import makeRequestSummarizer from 'summarize-express-request-pmb';

import sendFinalTextResponse from '../../finalTextResponse.mjs';


const summ = makeRequestSummarizer.detailed({
  defaultBoringKeys: false,
  lowLineBoring: false,
});

const EX = async function debugRequestHandler(req) {
  sendFinalTextResponse.json(req, summ(req));
};


export default EX;
