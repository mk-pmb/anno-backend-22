// -*- coding: utf-8, tab-width: 2 -*-

import loGet from 'lodash.get';
import mergeOpt from 'merge-options';
import uuidv5 from 'uuidv5';


const EX = function learnOneAuthorIdentitiy(mgr, meta, user, aidKey, spec) {
  if (!spec) { return; }
  const agent = mergeOpt(...[
    ...(spec.INHERITS || []).map(function lookupInherit(path) {
      const inc = loGet(meta.fragments, path);
      if (inc !== undefined) { return inc; }
      throw new Error('Cannot find fragment ' + path);
    }),
    spec,
  ]);
  delete agent.INHERITS;

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
