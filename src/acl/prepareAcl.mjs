// -*- coding: utf-8, tab-width: 2 -*-

import learnIdentityDetectors from './learnIdentityDetectors.mjs';
import whyDeny from './whyDeny.mjs';


const EX = async function prepareAcl(srv) {
  const popIdpCfg = await srv.configFiles.readMustPop('identity_providers');
  const acl = {
    identityDetectors: [],
    ...EX.api,
  };
  learnIdentityDetectors(srv, acl,
    popIdpCfg('obj | undef', 'identity_sources'));

  popIdpCfg('obj | undef', 'upstream_userid_transforms');

  popIdpCfg.done('Unsupported identity provider config categories');
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
