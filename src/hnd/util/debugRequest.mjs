// -*- coding: utf-8, tab-width: 2 -*-

import loMapValues from 'lodash.mapvalues';

import sendFinalTextResponse from '../../finalTextResponse.mjs';


const hnd = async function debugRequestHandler(origReq) {
  const rq = { ...origReq };

  function pop(list) {
    const p = {};
    list.forEach((k) => {
      let v = rq[k];
      let suf = '';
      delete rq[k];
      const t = (v && typeof v);
      if (t === 'function') {
        suf += '()';
        v = v.call(origReq);
      }
      if (v === undefined) {
        suf += ' ø';
        v = origReq[k];
      }
      if (v === undefined) { v = 'UNDEF'; }
      p[k + suf] = v;
    });
    return p;
  }

  pop([ // ignore boring keys:
    'aborted',
    'client',
    'complete',
    'end',
    'httpVersion',
    'httpVersionMajor',
    'httpVersionMinor',
    'json',
    'next',
    'res',
    'send',
    'socket',
  ]);

  const dbg = {
    '!': pop([
      'baseUrl',
      'method',
      'originalUrl',
      'url',
    ]),
    ...pop([
      'headers',
      'params',
      'query',
      'rawHeaders',
      'rawTrailers',
      'statusCode',
      'statusMessage',
      'upgrade',
    ]),
  };

  Object.keys(rq).forEach(k => (k.startsWith('_') && delete rq[k]));

  // show unexpected keys:
  const unexpected = loMapValues(rq, x => String(x && typeof x));
  if (Object.keys(unexpected).length) { dbg.unexpected = unexpected; }
  sendFinalTextResponse.json(origReq, dbg);
};

export default hnd;
