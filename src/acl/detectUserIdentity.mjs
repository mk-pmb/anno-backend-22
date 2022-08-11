// -*- coding: utf-8, tab-width: 2 -*-

import pEachSeries from 'p-each-series';


const logCkpTopic = 'detectUserIdentity';


const EX = async function detectUserIdentity(req) {
  let sess = false;
  let sDet = null;

  async function tryOneDetector(det) {
    if (sess) { return; }
    const found = await det(req);
    req.logCkp(logCkpTopic, 'detector:', det.name, 'found:', found);
    if (!found) { return; }
    sess = found;
    sDet = det.name;
  }

  const detectors = req.getSrv().acl.identityDetectors;
  await pEachSeries(detectors, tryOneDetector);
  req.logCkp('detectUserIdentity', 'using result from', sDet);
  return sess;
};


export default EX;
