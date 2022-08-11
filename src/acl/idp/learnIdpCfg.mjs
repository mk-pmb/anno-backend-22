// -*- coding: utf-8, tab-width: 2 -*-

import vTry from 'vtry';

import learnDetectors from './learnDetectors.mjs';
import learnTransforms from './learnTransforms.mjs';


const EX = async function learnIdentityProvidersConfig(acl) {
  const popIdpCfg = await acl.initTmp.cfg.readMustPop('identity_providers');

  function dareLearn(impl) {
    const topic = impl.configSectionName;
    return vTry(impl, 'Configure ' + topic)(acl,
      popIdpCfg(impl.expectedConfigSectionFormat, topic));
  }

  dareLearn(learnDetectors);
  dareLearn(learnTransforms);

  popIdpCfg.done('Unsupported identity provider config categories');
};


export default EX;
