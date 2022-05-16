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
    const nUrlSubDirs = urlSubDirs.length;
    if (nUrlSubDirs >= 2) {
      return httpErrors.notImpl.explain('Anno subresource not implemented: '
        + urlSubDirs[1])(req);
    }
    if (nUrlSubDirs !== 1) { throw new Error('Bad route declaration'); }
    const [versId] = urlSubDirs;
    // req.logCkp('annoRoute', { method, versId });
    if (versId) { return EX.annoIdRoute(srv, req, versId); }
    return EX.emptyIdRoute(srv, req);
  },


  async emptyIdRoute(srv, req) {
    const { method } = req;
    if (method === 'GET') { return emptyIdGet(srv, req); }

    return httpErrors.badVerb(req);
  },


  async annoIdRoute(srv, req, versId) {
    const { method } = req;
    const fx = (getOwn(EX, method.toLowerCase() + '_' + versId)
      || getOwn(EX, 'other_' + versId));
    req.logCkp('annoIdRoute fx?', 'fx =', conciseValuePreview(fx));
    if (fx) { return fx(srv, req, versId); }
    if (method === 'GET') { return idGet(srv, req, versId); }
    return httpErrors.badVerb(req);
  },


  async post_acl(srv, req) {
    return sendFinalTextResponse.json(req, { stub: true });
  },


});


export default EX;
