// -*- coding: utf-8, tab-width: 2 -*-

import splitOnce from 'split-string-or-buffer-once-pmb';

import httpErrors from '../httpErrors.mjs';


const OrderedMap = Map; // to clarify where we do care.


const EX = {

  async make(srv) {
    const svcs = await srv.configFiles.readAsMap('services');
    Object.assign(svcs, {
      idByPrefix: new OrderedMap(),
      ...EX.api,
    });
    svcs.forEach(function learn(origDetails, svcId) {
      const det = { ...origDetails, svcId };
      svcs.set(svcId, det);
      if (!det) { return; }
      const tumCfg = det.targetUrlMetadata;
      if (tumCfg) {
        tumCfg.prefixes.forEach(pfx => svcs.idByPrefix.set(pfx, svcId));
      }
    });
    console.debug('services:', svcs.toDict());
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
        throw httpErrors.aclDeny.explain(msg).throwable();
      }
      const meta = {
        serviceId: svcFromPrefix.svcId,
      };

      const tumCfg = (svcFromPrefix.svc || false).targetUrlMetadata;
      const subUrl = tgtUrl.slice(svcFromPrefix.pfx.length);
      (tumCfg.vSubDirs || []).reduce(function learn(remain, slot) {
        const rmnOrEmpty = (remain || '');
        const [val, more] = (splitOnce('/', rmnOrEmpty) || [rmnOrEmpty]);
        meta[slot] = val;
        return more;
      }, subUrl);

      return meta;
    },

  },

};


export default EX;
