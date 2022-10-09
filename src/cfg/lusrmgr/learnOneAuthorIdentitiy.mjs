// -*- coding: utf-8, tab-width: 2 -*-

import uuidv5 from 'uuidv5';


const EX = function learnOneAuthorIdentitiy(ctx, aidKey, origSpec) {
  if (!origSpec) { return; }
  const agent = ctx.cfgMeta.mergeInheritedFragments(origSpec);
  let agentId = agent.id;
  if (!agentId) {
    agentId = aidKey;
    if (!EX.mightBeUrl(agentId)) {
      const profileUrl = ctx.mgr.authorAgentUuidBaseUrl + encodeURI(agentId);
      agentId = 'urn:uuid:' + uuidv5('url', profileUrl);
    }
    agent.id = agentId; // eslint-disable-line no-param-reassign
  }

  const auIds = ctx.userDetails.authorIdentities;
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
