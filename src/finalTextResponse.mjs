// -*- coding: utf-8, tab-width: 2 -*-

import conciseValuePreview from 'concise-value-preview-pmb';
import getOwn from 'getown';
import isErr from 'is-error';
import isStr from 'is-string';
import sortedJson from 'safe-sortedjson';

import isGetLikeMethod from './isGetLikeMethod.mjs';


const lazyDebug = true;


const mimeTypes = {
  json: (lazyDebug ? 'text/plain' : 'application/json'),
};


const knwonTextTypes = [
  'json',
  'plain',
];


const ftr = function sendFinalTextResponse(req, how) {
  // console.debug('sendFinalTextResponse:', how);
  if (isStr(how)) { return ftr(req, { text: how }); }
  const ifGet = ftr.checkGetLike(how, req);
  const type = ifGet.subType || how.subType || 'plain';
  const code = ifGet.code || how.code || (isErr(how) ? 500 : 200);

  let { text } = ifGet;
  if (text === undefined) { text = how.text; }
  if (text === undefined) { text = how; }
  text = String(text || '');
  if (text && knwonTextTypes.includes(type)) {
    if (text.slice(-1) !== '\n') { text += '\n'; }
  }
  text = (text || '(No error message provided.)\n');

  req.logCkp('sendFinalTextResponse:', code, type, conciseValuePreview(text));

  const rsp = req.res;
  try {
    rsp.status(code);
  } catch (errStatus) {
    console.error('sendFinalTextResponse: status:', String(errStatus));
  }
  try {
    rsp.header('Content-Type', getOwn(mimeTypes, type, 'text/' + type)
      + '; charset=UTF-8');
  } catch (errHead) {
    console.error('sendFinalTextResponse: cType:', String(errHead));
  }
  rsp.send(text);
  rsp.end();
};


function simpleCannedExplain(detail) {
  let opt = (this || false).opt || false;
  const {
    code,
    text,
    getLike,
  } = opt;

  (function maybeExtendGetLike() {
    const t = (getLike || false).text;
    if (!t) { return; }
    opt = { ...opt, getLike: { ...getLike, text: t + ': ' + detail } };
  }());

  return ftr.simpleCanned(code, text + ': ' + detail, opt);
}


function simpleCannedThrowable() {
  const { opt } = (this || false);
  const {
    code,
    text,
    ...other
  } = opt;
  delete other.type;
  const err = new Error(text);
  Object.assign(err, other);
  err.code = (code || 500);
  return err;
}


Object.assign(ftr, {

  checkGetLike(how, req) {
    const g = how.getLike;
    if (g && isGetLikeMethod(req)) { return g; }
    return false;
  },

  json(req, data, opt) {
    const text = sortedJson(data);
    return ftr(req, { type: 'json', text, ...opt });
  },

  simpleCanned(code, text, custom) {
    const f = function cannedReply(req) { ftr(req, f.opt); };
    f.opt = { type: 'text', ...custom, code, text };
    f.explain = simpleCannedExplain;
    f.throwable = simpleCannedThrowable;
    return f;
  },

});


export default ftr;
