// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import conciseValuePreview from 'concise-value-preview-pmb';

import emptyIdGet from './emptyIdGet.mjs';
import plumb from '../util/miscPlumbing.mjs';
import httpErrors from '../../httpErrors.mjs';
import idGet from './idGet.mjs';
import sendFinalTextResponse from '../../finalTextResponse.mjs';


const EX = async function makeAnnoRoute(srv) {
  function rt(req) { return EX.annoRoute(req, srv); }
  return rt;
};


Object.assign(EX, {

  async annoRoute(req, srv) {
    srv.confirmCors(req);
    if (req.method === 'OPTIONS') { return; }
    const urlSubDirs = plumb.getFirstAsteriskDirs(req);
    // console.debug('annoHnd: urlSubDirs =', urlSubDirs);
    if (urlSubDirs.length !== 1) {
      return httpErrors.notImpl.explain(req,
        'Anno subresource not implemented');
    }
    const [baseId] = urlSubDirs;
    // req.logCkp('annoRoute', { method, baseId });
    if (baseId) { return EX.annoIdRoute(srv, req, baseId); }
    return EX.emptyIdRoute(srv, req);
  },


  async emptyIdRoute(srv, req) {
    const { method } = req;
    if (method === 'GET') { return emptyIdGet(srv, req); }

    return httpErrors.badVerb(req);
  },


  async annoIdRoute(srv, req, baseId) {
    const { method } = req;
    const fx = (getOwn(EX, method.toLowerCase() + '_' + baseId)
      || getOwn(EX, 'other_' + baseId));
    req.logCkp('annoIdRoute fx:', conciseValuePreview(fx));
    if (fx) { return fx(srv, req, baseId); }
    if (method === 'GET') { return idGet(srv, req, baseId); }
    return httpErrors.badVerb(req);
  },


  async post_acl(srv, req) {
    return sendFinalTextResponse.json(req, { stub: true });
  },


});


export default EX;
