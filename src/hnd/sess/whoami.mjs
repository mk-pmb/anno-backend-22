// -*- coding: utf-8, tab-width: 2 -*-

import detectUserIdentity from '../../acl/detectUserIdentity.mjs';
import sendFinalTextResponse from '../../finalTextResponse.mjs';


const EX = async function whoami(req) {
  const who = await detectUserIdentity(req);
  return sendFinalTextResponse.json(req, who);
};



export default EX;
