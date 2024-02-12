// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import loMapValues from 'lodash.mapvalues';
import splitOnce from 'split-string-or-buffer-once-pmb';

import httpErrors from '../httpErrors.mjs';


const OrderedMap = Map; // to clarify where we do care.
const isNum = Number.isFinite;

function orf(x) { return x || false; }


const EX = {

  async make(srv) {
    const svcs = await srv.configFiles.readAsMap('services');
    Object.assign(svcs, {
      idByPrefix: new OrderedMap(),
      ...EX.api,
    });

    function learnOneService(origDetails, svcId) {
      const det = { ...origDetails, id: svcId };
      svcs.set(svcId, det);
      if (!det) { return; }
      const tumPrefixes = arrayOfTruths(orf(det.targetUrlMetadata).prefixes);
      tumPrefixes.forEach(pfx => svcs.idByPrefix.set(pfx, svcId));

      function learnOneRssFeed(origFeedCfg, origFeedId) {
        const feedId = origFeedId.replace(/\^/g, svcId);
        const fc = srv.rssFeeds.register(feedId, { ...origFeedCfg });
        if (!fc.prefix) { fc.prefix = 1; }
        if (isNum(fc.prefix)) { fc.prefix = tumPrefixes[fc.prefix - 1]; }
        if (!fc.prefix) {
          throw new Error('Empty URL prefix for RSS feed ' + feedId);
        }
      }
      loMapValues(orf(det.rssFeeds), learnOneRssFeed);
    }
    svcs.forEach(learnOneService);

    // console.debug('services:', svcs.toDict());
    return svcs;
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
