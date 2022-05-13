// -*- coding: utf-8, tab-width: 2 -*-

import errorDetailsWithoutLogSpam from 'error-details-without-log-spam-pmb';

import sendFinalTextResponse from './finalTextResponse.mjs';

const makeCanned = sendFinalTextResponse.simpleCanned;
// ^-- Unfortunately the verb "(to) can" is easy to confuse with other "can"s.


const EX = {

  badVerb: makeCanned(405, 'Method Not Allowed'),
  noSuchAnno: makeCanned(404, 'Annotation not found'),
  notImpl: makeCanned(501, 'Not Implemented'),

  noSuchResource: makeCanned(405, 'Method Not Allowed',
    { getLike: { code: 404, text: 'Resource not found' } }),
  unexpectedlySlowTask: makeCanned(500,
    'Internal Server Error: Task exceeds expected time limit'),


  throwable(msg, opt) {
    if (Number.isFinite(opt)) { return EX.throwable(msg, { code: opt }); }
    if ((opt !== undefined) && (typeof opt !== 'object')) {
      return EX.throwable(msg, { unexpectedNonObjectDetails: opt });
    }
    return Object.assign(new Error(msg), opt);
  },


  httpStatusCode(err) {
    const code = (err.code || err);
    return (Number.isFinite(code) && (code >= 100) && (code < 600) && code);
  },


  handleUnknownError: function hunk(err, req, res, next) {
    if (!res) { return hunk(err, req, req.res, req.next); }
    if (!err) { return next(); }
    let logVerb = 'Too late to serve';
    let reply;
    if (!req.complete) {
      const code = EX.httpStatusCode(err);
      if (code) {
        reply = err;
        logVerb = 'Serve';
      } else {
        reply = { code: 500, text: 'Internal Server Error' };
        logVerb = 'Censor';
      }
    }
    req.logCkp('httpErrors.handleUnknownError: ' + logVerb
      + ' error message for:', errorDetailsWithoutLogSpam(err));
    if (reply) { sendFinalTextResponse(req, reply); }
  },


};


export default EX;
