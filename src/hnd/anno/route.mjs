// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
// import conciseValuePreview from 'concise-value-preview-pmb';

import emptyIdGet from './emptyIdGet.mjs';
import plumb from '../util/miscPlumbing.mjs';
import httpErrors from '../../httpErrors.mjs';
import idGet from './idGet/index.mjs';
import parseVersId from './parseVersionIdentifier.mjs';
import patchAnno from './patchAnno/index.mjs';
import postNewAnno from './postNewAnno/index.mjs';
import searchBy from './searchBy/index.mjs';
import sendFinalTextResponse from '../../finalTextResponse.mjs';

function errNotImpl(why) { throw httpErrors.notImpl.explain(why).throwable(); }
function orf(x) { return x || false; }



const EX = async function makeAnnoRoute(srv) {
  function rt(req) { return EX.annoRoute(req, srv); }
  return rt;
};



Object.assign(EX, {

  async annoRoute(req, srv) {
    req.confirmCors();
    if (req.method === 'OPTIONS') { return; }

    const asRoleName = (orf(req.params).asRoleName || '');
    if (/\W/.test(asRoleName)) { errNotImpl('Invalid role name'); }
    req.asRoleName = asRoleName; // eslint-disable-line no-param-reassign
    // ^- No roleName ACL checks here: We cannot validate role permissions
    //    until we know which subject URLs are meant to be affected.

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
    const deci = { versId, subRoute: orf(sub1) };
    if (nSub === 1) { return deci; }
    if (versId && (nSub === 2)) {
      if (sub1 === 'versions') { return deci; }
    }
    if (nSub >= 2) {
      const msg = 'Anno subresource not implemented: ' + sub1;
      errNotImpl(msg);
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
    const ctx = {
      srv,
      req,
      idParts: parseVersId(httpErrors.throwable.fubar, versId),
      subRoute,
    };
    if (req.asRoleName) {
      ctx.idParts.injectedBaseUrlExtension = '/as/' + req.asRoleName;
    }

    const { method } = req;
    const fxKey = versId + (subRoute ? '_' + subRoute : '');
    const fxFunc = (getOwn(EX, method.toLowerCase() + '_' + fxKey)
      || getOwn(EX, 'other_' + fxKey));
    // req.logCkp('annoIdRoute fx?', 'fxFunc =', conciseValuePreview(fxFunc));
    if (fxFunc) { return fxFunc(ctx); }

    if (method === 'GET') { return idGet(ctx); }
    if (method === 'HEAD') { return idGet(ctx); }
    if (method === 'PATCH') { return patchAnno(ctx); }
    return httpErrors.badVerb(req);
  },


  async post_acl(ctx) {
    return sendFinalTextResponse.json(ctx.req, { stub: true });
  },


});


export default EX;
