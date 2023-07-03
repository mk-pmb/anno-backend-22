// -*- coding: utf-8, tab-width: 2 -*-
//
//  The "bearer" RSS feed uses a bearer token as the only authentification,
//  submitted as the "key" query parameter.


import bcrypt from 'bcryptjs';
import getOwn from 'getown';

import debugRequest from '../util/debugRequest.mjs';
import httpErrors from '../../httpErrors.mjs';


const {
  genericDeny,
  noSuchResource,
} = httpErrors.throwable;


function orf(x) { return x || false; }


const keyAlgos = {

  async bcrypt(hash, key) { return bcrypt.compare(key, hash); },

};


const EX = async function makeBearerRssHandler(srv) {
  const hnd = async function serveBearerRss(req) {
    const feedId = req.url.split('?')[0].replace(/^\//, '');
    if (!feedId) { throw noSuchResource(); }

    req.confirmCors();
    if (req.method === 'OPTIONS') { return; }

    const feedCfg = srv.rssFeeds.byFeedId.get(feedId);
    if (!feedCfg) { throw noSuchResource(); }
    const keyGiven = orf(req.query).key;
    await EX.verifyFeedKey(feedCfg, keyGiven);

    return debugRequest(req);
  };

  return hnd;
};



Object.assign(EX, {

  async verifyFeedKey(feedCfg, keyGiven) {
    const { feedId, keyAlgo, keyHash } = feedCfg;
    const algoImpl = getOwn(keyAlgos, keyAlgo);
    if (!algoImpl) {
      throw new Error('Unsupported keyAlgo for bearer RSS ' + feedId);
    }
    if (!keyHash) { throw genericDeny('No hash configured.'); }
    const correct = await algoImpl(keyHash, keyGiven, feedCfg);
    if (!correct) { throw genericDeny('Wrong key.'); }
  },


});


export default EX;
