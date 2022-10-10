// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';
import pEachSeries from 'p-each-series';
import vTry from 'vtry';


const logCkpTopic = 'detectUserIdentity';


const EX = async function detectUserIdentity(req) {
  let sess = false;
  let sDet = null;
  const { acl, lusrmgr } = req.getSrv();
  const debug = acl.debugFlags.sessionDetectors;

  async function tryOneDetector(det) {
    if (sess) { return; }
    const found = await det(req);
    if (debug) {
      req.logCkp(logCkpTopic, 'detector:', det.name, 'found:', found);
    }
    if (!found) { return; }
    sess = found;
    sDet = det.name;
  }

  await pEachSeries(acl.identityDetectors, tryOneDetector);
  let u = sess.userId;
  const userIdStages = { detected: u };
  if (u) {
    u = EX.applyUserIdTransforms(acl, u);
    userIdStages.transformed = u;

    u = (u && mustBe.nest('User ID after resolving alias ' + u,
      lusrmgr.upstreamUserIdAliases.get(u) || u));
    userIdStages.aliasResolved = u;

    sess.userId = u;
  }

  if (debug) {
    req.logCkp('detectUserIdentity', 'using result from', sDet, userIdStages);
  }
  return sess;
};


Object.assign(EX, {

  applyUserIdTransforms(acl, orig) {
    if (!orig) { return orig; }
    const steps = acl.userIdTransforms;
    // console.debug('D: applyUserIdTransforms: steps =', steps);
    return steps.reduce(EX.applyOneUserIdTransform, orig);
  },

  applyOneUserIdTransform(orig, trFunc) {
    if (!orig) { return orig; }
    const { traceDescr } = trFunc;
    const u = vTry(trFunc, traceDescr)(orig);
    mustBe.nest('userId after transforming ' + traceDescr, u);
    return u;
  },


  async andDetails(req) {
    const who = await EX(req);
    if (!who) { return who; }
    const { userId } = who;
    const details = (req.getSrv().lusrmgr.users.get(userId) || false);
    return { ...who, details };
  },

});


export default EX;
