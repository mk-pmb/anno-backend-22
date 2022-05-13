// -*- coding: utf-8, tab-width: 2 -*-

import makeRequestSummarizer from 'summarize-express-request-pmb';

import sendFinalTextResponse from '../../finalTextResponse.mjs';


const EX = async function debugRequestHandler(req) {
  sendFinalTextResponse.json(req, EX.summarize(req));
};

EX.summarize = makeRequestSummarizer.detailed({
  defaultBoringKeys: false,
  lowLineBoring: false,
});


export default EX;
