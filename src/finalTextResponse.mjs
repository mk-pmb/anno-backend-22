// -*- coding: utf-8, tab-width: 2 -*-

import conciseValuePreview from 'concise-value-preview-pmb';
import getOwn from 'getown';
import isErr from 'is-error';
import isStr from 'is-string';
import sortedJson from 'safe-sortedjson';


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
  const type = how.subType || 'plain';
  const code = how.code || (isErr(how) ? 500 : 200);

  let { text } = how;
  if (text === undefined) { text = (how || ''); }
  text = String(text);
  if (knwonTextTypes.includes(type)) {
    if (text.slice(-1) !== '\n') { text += '\n'; }
  }

  req.logCkp('sendFinalTextResponse:', '->', type, conciseValuePreview(text));

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
  const { opt } = (this || false);
  const { code, text } = (opt || false);
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
