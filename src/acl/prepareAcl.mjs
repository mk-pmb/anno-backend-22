// -*- coding: utf-8, tab-width: 2 -*-

import learnIdentityDetectors from './learnIdentityDetectors.mjs';


const EX = async function prepareAcl(srv) {
  const popIdpCfg = await srv.configFiles.readMustPop('identity_providers');
  const acl = {
    identityDetectors: [],
  };
  learnIdentityDetectors(srv, acl,
    popIdpCfg('obj | undef', 'identity_sources'));

  popIdpCfg('obj | undef', 'upstream_userid_transforms');

  popIdpCfg.done('Unsupported identity provider config categories');
  return acl;
};


export default EX;
