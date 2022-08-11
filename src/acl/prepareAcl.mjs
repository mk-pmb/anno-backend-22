// -*- coding: utf-8, tab-width: 2 -*-

import nullifyObjValues from 'nullify-object-values-shallow-inplace';

import learnAllAclChains from './chains/learn.mjs';
import learnIdentityProviders from './idp/learnIdpCfg.mjs';
import whyDeny from './whyDeny.mjs';


const EX = async function prepareAcl(srv) {
  const acl = {
    identityDetectors: [],
    userIdTransforms: [],
    chainsByName: new Map(),
    ...EX.api,
    initTmp: {
      cfg: srv.configFiles,
    },
  };
  await Promise.all([
    learnAllAclChains(acl),
    learnIdentityProviders(acl),
  ]);

  nullifyObjValues(acl.initTmp); // <- help garbage-collect accidential refs
  delete acl.initTmp; // <- block accidential late access

  return acl;
};


EX.api = {

  whyDeny,

  getChainByName(cn) { return this.chainsByName.get(cn); },

  async requirePerm(req, initMeta) {
    const acl = this;
    const nope = await acl.whyDeny(req, initMeta);
    if (nope) { throw nope; }
  },

};


export default EX;
