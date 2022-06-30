// -*- coding: utf-8, tab-width: 2 -*-

import splitOnce from 'split-string-or-buffer-once-pmb';

import httpErrors from '../httpErrors.mjs';


const OrderedMap = Map; // just to clarify where we do care.


const EX = {

  async make(srv) {
    const origCfg = await srv.configFiles.read('collections');
    const colls = new Map(Object.entries(origCfg));
    Object.assign(colls, {
      idByPrefix: new OrderedMap(),
      ...EX.api,
    });
    Object.entries(origCfg).forEach(function learn([collId, origDetails]) {
      const det = { ...origDetails, collId };
      colls.set(collId, det);
      if (!det) { return; }
      const tumCfg = det.targetUrlMetadata;
      if (tumCfg) {
        tumCfg.prefixes.forEach(pfx => colls.idByPrefix.set(pfx, collId));
      }
    });
    console.debug(colls);
    return colls;
  },


  api: {

    findCollectionByTargetUrl(tgtUrl) {
      const colls = this;
      let found = false;
      colls.idByPrefix.forEach(function check(collId, pfx) {
        if (found) { return; }
        if (!tgtUrl.startsWith(pfx)) { return; }
        found = { pfx, collId, coll: colls.get(collId) };
      });
      return found;
    },

    findMetadataByTargetUrl(tgtUrl) {
      const colls = this;
      const collFromPrefix = colls.findCollectionByTargetUrl(tgtUrl);
      if (!collFromPrefix) {
        const msg = 'No collection configured for target URL: ' + tgtUrl;
        throw httpErrors.aclDeny.explain(msg).throwable();
      }
      const meta = {
        collectionId: collFromPrefix.collId,
      };

      const tumCfg = (collFromPrefix.coll || false).targetUrlMetadata;
      const subUrl = tgtUrl.slice(collFromPrefix.pfx.length);
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
