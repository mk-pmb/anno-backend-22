// -*- coding: utf-8, tab-width: 2 -*-

import emptyIdGet from './emptyIdGet.mjs';
import plumb from '../util/miscPlumbing.mjs';
import httpErrors from '../../httpErrors.mjs';
import idGet from './idGet.mjs';


const EX = async function makeAnnoRoute(srv) {
  function rt(req) { return EX.annoRoute(req, srv); }
  return rt;
};

Object.assign(EX, {

  async annoRoute(req, srv) {
    const urlSubDirs = plumb.getFirstAsteriskDirs(req);
    const { method } = req;
    if (method !== 'GET') { return httpErrors.badVerb(req); }

    // console.debug('annoHnd: urlSubDirs =', urlSubDirs);
    if (urlSubDirs.length !== 1) {
      return httpErrors.notImpl.explain(req,
        'Anno subresource not implemented');
    }
    const [baseId] = urlSubDirs;
    if (!baseId) {
      return emptyIdGet(req, srv);
    }
    return idGet(baseId, req, srv);
  },

});


export default EX;
