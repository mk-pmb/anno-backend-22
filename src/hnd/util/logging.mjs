// -*- coding: utf-8, tab-width: 2 -*-

import makeRequestSummarizer from 'summarize-express-request-pmb';

const requestSummarizer = makeRequestSummarizer.logLineArgs();


function logMsg(...args) {
  const d = (new Date()).toISOString();
  console.log(d.slice(0, 10), d.slice(11, 19), ...args);
}


function logIncomingRequest(req) {
  req.logMsg('WebReq', ...requestSummarizer(req));
  req.next();
}


function logRequestCheckpoint(where, ...details) {
  const req = this;
  const hints = [
    (req.complete && '[complete]'),
    (req.res.finished && '[finished]'),
  ].filter(Boolean);
  req.logMsg(where,
    req.method,
    req.originalUrl,
    ...hints,
    ...details);
  return req;
}


const EX = {

  basics: {
    logMsg,
  },

  middleware: {
    logIncomingRequest,
  },

  requestExtras: {
    logMsg,
    logCkp: logRequestCheckpoint,
  },



};


export default EX;
