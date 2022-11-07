// -*- coding: utf-8, tab-width: 2 -*-

import detectUserIdentity from '../../acl/detectUserIdentity.mjs';
import httpErrors from '../../httpErrors.mjs';
import sendFinalTextResponse from '../../finalTextResponse.mjs';


const failNotImpl = httpErrors.notImpl.throwable;


const EX = async function whoami(req) {
  req.confirmCors();
  const who = await detectUserIdentity.andDetails(req);
  if (who) {
    const { details } = who;
    who.authorIdentities = EX.reportAuthorIdentities(req, details);
    delete who.details;
  }
  return sendFinalTextResponse.json(req, who);
};


Object.assign(EX, {

  reportAuthorIdentities(req, userDetails) {
    if (!userDetails) { return; }
    const key = 'author_identities';
    const mode = req.query[key];
    if (!mode) { return; }

    const agents = userDetails.authorIdentities.byAgentId;
    const agentIdsList = Array.from(agents.keys()).sort();
    if (mode === 'ids') { return agentIdsList; }
    if (mode === 'full') { return agentIdsList.map(a => agents.get(a)); }

    const err = failNotImpl('Unsupported ' + key + ' mode');
    throw err;
  },


});


export default EX;
