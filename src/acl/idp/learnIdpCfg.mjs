// -*- coding: utf-8, tab-width: 2 -*-

import learnDetectors from './learnDetectors.mjs';


const EX = async function learnIdentityProvidersConfig(acl) {
  const popIdpCfg = await acl.initTmp.cfg.readMustPop('identity_providers');

  learnDetectors(acl, popIdpCfg('nonEmpty obj', 'identity_sources'));

  popIdpCfg('obj | undef', 'upstream_userid_transforms');

  popIdpCfg.done('Unsupported identity provider config categories');
};


export default EX;
