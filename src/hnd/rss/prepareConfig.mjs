// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../../httpErrors.mjs';


const EX = function prepareConfig(/* srv */) {
  const rssFeeds = {
    byFeedId: new Map(),
    ...EX.api,
  };
  return rssFeeds;
};


const errDupeRssId = httpErrors.fubar.explain(
  'Config error: Duplicate RSS feed ID').throwable;



EX.api = {

  register(feedId, details) {
    const { byFeedId } = this;
    if (byFeedId.has(feedId)) { throw errDupeRssId(feedId); }
    const feedCfg = { ...EX.defaultFeedConfig, ...details };
    byFeedId.set(feedId, feedCfg);
    return feedCfg;
  },

};


EX.defaultFeedConfig = {
  keyAlgo: 'bcrypt',
};


export default EX;
