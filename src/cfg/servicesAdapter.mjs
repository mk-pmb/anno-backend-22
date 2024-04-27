// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import loMapValues from 'lodash.mapvalues';
import splitOnce from 'split-string-or-buffer-once-pmb';
import mergeOpt from 'merge-options';


import httpErrors from '../httpErrors.mjs';

import learnTopicDict from './learnTopicDict.mjs';

const OrderedMap = Map; // to clarify where we do care.
const isNum = Number.isFinite;

function orf(x) { return x || false; }


const EX = {

  async make(srv) {
    const svcs = new Map();
    Object.assign(svcs, EX.api, {
      idByPrefix: new OrderedMap(),
    });
    const ctx = { srv, svcs, learnMeta: EX.learnServicesMeta };
    await learnTopicDict(ctx, 'services', EX.learnOneService);
    return svcs;
  },


  learnServicesMeta(ctx, mustPopCfgMeta) {
    const sd = EX.learnOneService(ctx, '', mustPopCfgMeta);
    ctx.topicDefaults = sd; // eslint-disable-line no-param-reassign
    mustPopCfgMeta.expectEmpty('Services defaults config key');
  },


  learnOneService(ctx, svcId, mustPopDetail) {
    const det = {};
    if (svcId) {
      det.id = svcId;
      ctx.svcs.set(svcId, det);
    }

    function copy(prop, rules, dflt) {
      const v = mustPopDetail(rules, prop, dflt);
      if (v !== undefined) { det[prop] = v; }
      return v;
    }

    const tum = orf(copy('targetUrlMetadata',
      'dictObj' + (svcId ? '' : ' | undef')));
    const { prefixes } = tum;
    if (svcId) {
      arrayOfTruths(prefixes).forEach(
        pfx => ctx.svcs.idByPrefix.set(pfx, svcId));
    } else if (prefixes !== undefined) {
      const msg = 'Services defaults must not include URL prefixes.';
      throw new Error(msg);
    }

    EX.learnRssFeeds(ctx, svcId, prefixes,
      copy('rssFeeds', 'dictObj | nul | undef'));
    copy('annoBrowserRedirect', 'str | nul | undef');
    copy('approvalRequired', 'bool | undef', false);
    copy('autoRequestNextVersionDoi', 'bool | undef', false);
    copy('staticAclMeta', 'dictObj | nul | undef');

    mustPopDetail.expectEmpty('Unsupported leftover service config keys');
    return det;
  },


  learnRssFeeds(ctx, svcId, urlPrefixes, feedsSpec) {
    // console.debug('learnRssFeeds', { svcId }, feedsSpec);
    if (!feedsSpec) { return; }
    if (!svcId) { return; }
    const feedDefaults = ctx.mergeInheritedFragments(feedsSpec['']);
    loMapValues(feedsSpec, function learnOneRssFeed(origFeedCfg, origFeedId) {
      if (!origFeedId) { return; }
      // ^-- Empty feed ID is used for defaults.
      const feedId = origFeedId.replace(/\^/g, svcId);
      // console.debug('learnOneRssFeed:', feedId, merged);
      const merged = mergeOpt({
        staticMeta: {
          serviceId: svcId,
        },
      }, feedDefaults, ctx.mergeInheritedFragments(origFeedCfg));
      const fc = ctx.srv.rssFeeds.register(feedId, merged);
      if (!fc.prefix) { fc.prefix = 1; }
      if (isNum(fc.prefix)) { fc.prefix = urlPrefixes[fc.prefix - 1]; }
      if (!fc.prefix) {
        throw new Error('Empty URL prefix for RSS feed ' + feedId);
      }
    });
  },


  api: {

    findServiceByTargetUrl(tgtUrl) {
      const svcs = this;
      let found = false;
      svcs.idByPrefix.forEach(function check(svcId, pfx) {
        if (found) { return; }
        if (!tgtUrl.startsWith(pfx)) { return; }
        found = { pfx, svcId, svc: svcs.get(svcId) };
      });
      return found;
    },

    findMetadataByTargetUrl(tgtUrl) {
      const svcs = this;
      const svcFromPrefix = svcs.findServiceByTargetUrl(tgtUrl);
      if (!svcFromPrefix) {
        const msg = 'No service configured for target URL: ' + tgtUrl;
        throw httpErrors.aclDeny.throwable(msg);
      }
      const { svcId } = svcFromPrefix;
      const svcInfo = svcFromPrefix.svc;
      if (!svcInfo) {
        const msg = 'No data for service ID: ' + svcId;
        throw httpErrors.aclDeny.throwable(msg);
      }
      const meta = {
        serviceId: svcId,
        ...svcInfo.staticAclMeta,
      };
      EX.svcCfgFlagNames.forEach((k) => { meta[k] = Boolean(svcInfo[k]); });

      const tumCfg = svcInfo.targetUrlMetadata;
      const subUrl = tgtUrl.slice(svcFromPrefix.pfx.length);
      (tumCfg.vSubDirs || []).reduce(function learn(remain, slot) {
        const rmnOrEmpty = (remain || '');
        const [val, more] = (splitOnce('/', rmnOrEmpty) || [rmnOrEmpty]);
        if (slot) { meta[slot] = val; }
        return more;
      }, subUrl);

      return meta;
    },

  },


  svcCfgFlagNames: [
    'approvalRequired',
    'autoRequestNextVersionDoi',
  ],


};


export default EX;
