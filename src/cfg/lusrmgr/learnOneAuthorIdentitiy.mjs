// -*- coding: utf-8, tab-width: 2 -*-

import uuidv5 from 'uuidv5';


const EX = async function learnOneAuthorIdentitiy(mgr, user, aidKey, spec) {
  const agent = { ...spec };

  let agentId = spec.id;
  if (!agentId) {
    agentId = aidKey;
    if (!EX.mightBeUrl(agentId)) {
      agentId = 'urn:uuid:' + uuidv5('url',
        mgr.authorAgentUuidBaseUrl + agentId);
    }
    agent.id = agentId; // eslint-disable-line no-param-reassign
  }

  const auIds = user.authorIdentities;
  auIds.set(aidKey, agent);
  const dupe = auIds.byAgentId.get(agent.id);
  if (dupe) {
    console.error('Conflicting previous author identity:', dupe);
    throw new Error('Duplicate agent ID: ' + agentId);
  }
  auIds.byAgentId.set(agent.id, agent);
};


Object.assign(EX, {

  mightBeUrl(x) { return /^\w+:/.test(x || ''); },


});


export default EX;
