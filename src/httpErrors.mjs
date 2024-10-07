// -*- coding: utf-8, tab-width: 2 -*-

import handleUnknownError from
  'express-final-text-response-pmb/extras/handleUnknownError.mjs';
import mapValues from 'lodash.mapvalues';

import finalTextResponse from './finalTextResponse.mjs';


const makeCanned = finalTextResponse.simpleCanned;
// ^-- Unfortunately the verb "(to) can" is easy to confuse with other "can"s.

const simpleCanneds = {

  badRequest: makeCanned(400, 'Bad Request'),
  badVerb: makeCanned(405, 'Method Not Allowed'),
  noSuchAnno: makeCanned(404, 'Annotation not found'),
  stateConflict: makeCanned(409, 'Conflict'),
  gone: makeCanned(410, 'Gone'),
  payloadTooLarge: makeCanned(413, 'Submission exceeds the upload size limit.'),
  notImpl: makeCanned(501, 'Not Implemented'),

  noSuchResource: makeCanned(405, 'Method Not Allowed',
    { getLike: { code: 404, text: 'Resource not found' } }),
  unexpectedlySlowTask: makeCanned(500,
    'Internal Server Error: Task exceeds expected time limit'),
  fubar: makeCanned(500, 'Internal Server Error'),

  genericDeny: makeCanned(403, 'Forbidden'),
  aclDeny: makeCanned(403, 'Forbidden by ACL'),
  authorIdentityNotConfigured: makeCanned(403,
    'The requested creator id was not found in your configured identities.'),

};


const EX = {

  ...simpleCanneds,

  throwable(msg, opt) {
    if (Number.isFinite(opt)) { return EX.throwable(msg, { code: opt }); }
    if ((opt !== undefined) && (typeof opt !== 'object')) {
      return EX.throwable(msg, { unexpectedNonObjectDetails: opt });
    }
    return Object.assign(new Error(msg), opt);
  },

  handleUnknownError: handleUnknownError.bind(null, finalTextResponse),

};

Object.assign(EX.throwable, mapValues(simpleCanneds, sc => sc.throwable));


export default EX;
