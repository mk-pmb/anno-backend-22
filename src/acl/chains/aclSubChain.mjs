// -*- coding: utf-8, tab-width: 2 -*-

// import mustBe from 'typechecks-pmb/must-be';
import pEachSeries from 'p-each-series';
import vTry from 'vtry';


const EX = async function aclSubChain(chainCtx, chainName) {
  if (chainCtx.chainNamesStack.includes(chainName)) {
    throw new Error('Circular aclSubChain');
  }
  const subCtx = {
    ...chainCtx,
    chainNamesStack: [...chainCtx.chainNamesStack, chainName],
  };

  const acl = chainCtx.getAcl();
  const rules = acl.getChainByName(chainName);
  await pEachSeries(rules, function oneRule(ruleSpec, idx) {
    const trace = 'ACL[' + chainName + '#' + (idx + 1) + ']';
    subCtx.ruleTraceDescr = trace;
    return vTry.pr(EX.oneRule, trace)(ruleSpec, subCtx);
  });
};


Object.assign(EX, {

  async oneRule(origRuleSpec, chainCtx) {
    const req = chainCtx.getReq();
    req.logCkp('D: ACL rule', chainCtx.ruleTraceDescr, origRuleSpec);
  },

});


export default EX;
