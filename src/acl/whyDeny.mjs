// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be';
import sortedJson from 'safe-sortedjson';
import getOrAddKey from 'getoraddkey-simple';

import httpErrors from '../httpErrors.mjs';
import servicesAdapter from '../cfg/servicesAdapter.mjs';

import aclSubChain from './chains/aclSubChain.mjs';
import detectUserIdentity from './detectUserIdentity.mjs';


const EX = async function whyDeny(req, actionMeta) {
  const acl = this;
  const {
    aclMetaSpy,
    ...allMeta
  } = actionMeta;

  const metaCache = getOrAddKey(req, 'aclMetaCache', '{}');
  const mustMeta = mustBe.tProp('ACL metadata property ', allMeta);

  const tgtUrl = (mustMeta('nonEmpty str | undef', 'targetUrl') || false);
  const urlMeta = tgtUrl && (getOrAddKey(metaCache, 'tgtUrl:' + tgtUrl,
    () => req.getSrv().services.findMetadataByTargetUrl(tgtUrl)));

  const userMeta = await getOrAddKey(metaCache, 'user',
    () => detectUserIdentity(req));
  metaCache.user = userMeta;

  const pubMeta = {
    // ACL metadata that is ok to be "public" in the sense that it
    // may be sent to the client as part of explanation.
    // privilegeName: not here becaue it's in the main error message already.
    userId: (userMeta.userId || ''),
    ...urlMeta,
  };
  Object.assign(allMeta, pubMeta);
  if (aclMetaSpy) {
    Object.assign(aclMetaSpy, allMeta);
    EX.metaSpySvcBoolCounters.forEach(function incr(p) {
      const k = 'nServicesWith' + (allMeta[p] ? '' : 'out') + ':' + p;
      aclMetaSpy[k] = (+aclMetaSpy[k] || 0) + 1;
    });
  }

  const chainCtx = {
    getAcl() { return acl; },
    getReq() { return req; },
    pubMeta,
    allMeta,
    mustMeta,
    chainNamesStack: [],
    state: {
      tendencies: {
        '*': 'deny',
      },
      decision: null,
    },
  };
  // req.logCkp('ACL meta before', allMeta);
  await aclSubChain(chainCtx, 'main');
  // req.logCkp('ACL state after', chainCtx.state);
  let { decision } = chainCtx.state;

  if (decision === null) {
    const { tendencies } = chainCtx.state;
    decision = getOwn(tendencies, allMeta.privilegeName);
    if (decision === undefined) { decision = getOwn(tendencies, '*'); }
  }

  if (decision === 'allow') {
    // req.logCkp('D: ACL: allow.');
    return false; // no reason to deny
  }

  if (decision !== 'deny') {
    req.logCkp('E: ACL: invalid decision!', { decision });
  }

  const denyMsg = ('Lacking permission ' + allMeta.privilegeName
    + ' on ' + sortedJson(pubMeta, { mergeNlWsp: true }));
  const errDeny = httpErrors.aclDeny.throwable(denyMsg);
  return errDeny;
};


Object.assign(EX, {

  metaSpySvcBoolCounters: [
    ...servicesAdapter.svcCfgFlagNames,
  ],


});


export default EX;
