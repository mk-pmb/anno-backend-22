// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import isStr from 'is-string';
import isErr from 'is-error';
import sortedJson from 'safe-sortedjson';


const lazyDebug = true;


const mimeTypes = {
  json: (lazyDebug ? 'text/plain' : 'application/json'),
};


const ftr = function sendFinalTextResponse(req, how) {
  if (isStr(how)) { return ftr(req, { text: how }); }
  const type = how.subType || 'plain';
  const code = how.code || (isErr(how) ? 500 : 200);

  let { text } = how;
  if (text === undefined) { text = (how || ''); }
  text = String(text);

  const rsp = req.res;
  rsp.status(code);
  rsp.header('Content-Type', getOwn(mimeTypes, type, 'text/' + type)
    + '; charset=UTF-8');
  rsp.send(text);
  rsp.end();
};

Object.assign(ftr, {

  json(req, data, opt) {
    const text = sortedJson(data) + '\n';
    return ftr(req, { type: 'json', text, ...opt });
  },

});


export default ftr;
