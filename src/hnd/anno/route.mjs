// -*- coding: utf-8, tab-width: 2 -*-

import plumb from '../util/miscPlumbing.mjs';
import httpErrors from '../../httpErrors.mjs';
import idGet from './idGet.mjs';
import verifyBaseIdFormat from './verifyBaseIdFormat.mjs';


const searchNotImpl = httpErrors.notImpl.explain(
  'Unsupported combination of search criteria.');


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
      const queryKeys = Object.keys(req.query);
      if (queryKeys.length) {
        return searchNotImpl(req);
      }
      return verifyBaseIdFormat(baseId);
    }

    return idGet(baseId, req, srv);
  },

});


export default EX;
