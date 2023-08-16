// -*- coding: utf-8, tab-width: 2 -*-

import detectUserIdentity from '../../acl/detectUserIdentity.mjs';
import httpErrors from '../../httpErrors.mjs';
import sendFinalTextResponse from '../../finalTextResponse.mjs';


const failNotImpl = httpErrors.notImpl.throwable;


const EX = function whoami(req) { return EX.hndImpl(req); };


Object.assign(EX, {

  async hndImpl(req, opt) {
    req.confirmCors();
    const who = await EX.reportSessionIdentity(req, opt);
    return sendFinalTextResponse.json(req, who);
  },


  async reportSessionIdentity(req, origOpt) {
    const opt = (origOpt || false);
    const who = await detectUserIdentity.andDetails(req, opt.detectorOpts);
    if (!who) { return false; }
    const { details } = who;
    delete who.details;
    who.authorIdentities = EX.reportAuthorIdentities(req, details);
    return who;
  },


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
