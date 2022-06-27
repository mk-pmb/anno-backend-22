// -*- coding: utf-8, tab-width: 2 -*-

import sendFinalTextResponse from '../../finalTextResponse.mjs';

const dummy = null; // For nicer list style and nicer git diffs


const EX = async function whoami(req) {
  const hdr = req.headers;
  const who = {
    userId: (dummy
      || hdr.remote_user
      || ''),
    renewalAvailableBefore: (dummy
      || +hdr['shib-session-inactivity']
      || 0),
    sessionExpiryHardLimit: (dummy
      || +hdr['shib-session-expires']
      || 0),
  };
  return sendFinalTextResponse.json(req, who);
};



export default EX;
