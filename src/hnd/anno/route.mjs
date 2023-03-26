// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import conciseValuePreview from 'concise-value-preview-pmb';

import emptyIdGet from './emptyIdGet.mjs';
import plumb from '../util/miscPlumbing.mjs';
import httpErrors from '../../httpErrors.mjs';
import idGet from './idGet.mjs';
import patchAnno from './patchAnno/index.mjs';
import postNewAnno from './postNewAnno/index.mjs';
import searchBy from './searchBy/index.mjs';
import sendFinalTextResponse from '../../finalTextResponse.mjs';


const EX = async function makeAnnoRoute(srv) {
  function rt(req) { return EX.annoRoute(req, srv); }
  return rt;
};


Object.assign(EX, {

  async annoRoute(req, srv) {
    req.confirmCors();
    if (req.method === 'OPTIONS') { return; }
    const urlSubDirs = plumb.getFirstAsteriskDirs(req);
    const [dir1, ...subDirs] = urlSubDirs;
    if (dir1 === 'by') { return searchBy(subDirs, req, srv); }
    // console.debug('annoHnd: urlSubDirs =', urlSubDirs);
    const { versId, subRoute } = EX.decideSubRoute(urlSubDirs);
    // req.logCkp('annoRoute', { method, versId });
    if (versId) { return EX.annoIdRoute(srv, req, versId, subRoute); }
    return EX.emptyIdRoute(srv, req, subRoute);
  },


  decideSubRoute(urlSubDirs) {
    const nSub = urlSubDirs.length;
    const [versId, sub1] = urlSubDirs;
    const deci = { versId, subRoute: (sub1 || false) };
    if (nSub === 1) { return deci; }
    if (versId && (nSub === 2)) {
      if (sub1 === 'versions') { return deci; }
    }
    if (nSub >= 2) {
      const msg = 'Anno subresource not implemented: ' + sub1;
      throw httpErrors.notImpl.explain(msg).throwable();
    }
    throw new Error('Bad route declaration');
  },


  async emptyIdRoute(srv, req) {
    const { method } = req;
    if (method === 'GET') { return emptyIdGet(srv, req); }
    if (method === 'POST') { return postNewAnno(srv, req); }

    return httpErrors.badVerb(req);
  },


  async annoIdRoute(srv, req, versId, subRoute) {
    const { method } = req;
    const fxKey = versId + (subRoute ? '_' + subRoute : '');
    const fxFunc = (getOwn(EX, method.toLowerCase() + '_' + fxKey)
      || getOwn(EX, 'other_' + fxKey));
    req.logCkp('annoIdRoute fx?', 'fxFunc =', conciseValuePreview(fxFunc));
    if (fxFunc) { return fxFunc(srv, req, versId, subRoute); }
    if (method === 'GET') { return idGet(srv, req, versId, subRoute); }
    if (method === 'PATCH') { return patchAnno(req); }
    return httpErrors.badVerb(req);
  },


  async post_acl(srv, req) {
    return sendFinalTextResponse.json(req, { stub: true });
  },


});


export default EX;
