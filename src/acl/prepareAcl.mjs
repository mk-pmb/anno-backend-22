// -*- coding: utf-8, tab-width: 2 -*-

import learnIdentityProviders from './idp/learnIdpCfg.mjs';
import whyDeny from './whyDeny.mjs';


const EX = async function prepareAcl(srv) {
  const acl = {
    identityDetectors: [],
    chainsByName: new Map(),
    ...EX.api,
    initTmp: {
      cfg: srv.configFiles,
    },
  };
  await Promise.all([
    learnIdentityProviders(acl),
  ]);
  delete acl.initTmp;
  return acl;
};


EX.api = {

  whyDeny,

  async requirePerm(req, initMeta) {
    const acl = this;
    const nope = await acl.whyDeny(req, initMeta);
    if (nope) { throw nope; }
  },

};


export default EX;
