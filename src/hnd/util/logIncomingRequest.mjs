// -*- coding: utf-8, tab-width: 2 -*-

import makeRequestSummarizer from 'summarize-express-request-pmb';

const summ = makeRequestSummarizer.logLineArgs();

const EX = function logIncomingRequest(req) {
  console.debug('Incoming request:', ...summ(req));
  req.next();
};


export default EX;
