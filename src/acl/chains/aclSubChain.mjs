// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be';
import pEachSeries from 'p-each-series';
import vTry from 'vtry';


const condResultMustBeBool = mustBe('bool', 'condition check result');


const EX = async function aclSubChain(chainCtx, chainName) {
  if (chainCtx.chainNamesStack.includes(chainName)) {
    throw new Error('Circular aclSubChain');
  }
  const subCtx = {
    ...chainCtx,
    decision: null,
    chainNamesStack: [...chainCtx.chainNamesStack, chainName],
  };

  const acl = chainCtx.getAcl();
  const rules = acl.getChainByName(chainName);
  await pEachSeries(rules, function oneRule(rule) {
    return vTry.pr(EX.oneRule, rule.traceDescr)(rule, subCtx);
  });
};


Object.assign(EX, {

  async oneRule(rule, chainCtx) {
    const chainState = chainCtx.state;
    if (chainState.decision) { return; }
    // console.debug('D: ACL rule check:', rule.traceDescr);

    const skipRule = await EX.decideSkipRule(rule, chainCtx);
    if (skipRule) {
      // console.debug('D: ACL rule skip!', rule.traceDescr);
      return;
    }

    if (rule.decide && EX.applyRuleDecide(rule, chainCtx)) { return; }

    // console.debug('D: ACL rule apply!', { ...rule, condGroups: '[…]' });
    Object.assign(chainState.tendencies, rule.tendency);

    const subChainName = rule.aclSubChain;
    await (subChainName && EX(chainCtx, subChainName));
  },


  applyRuleDecide(rule, chainCtx) {
    function maybe(slot) {
      const decision = getOwn(rule.decide, slot);
      // console.debug('D: ACL decision?', rule.traceDescr, { slot, decision });
      if (decision === undefined) { return false; }
      // ^- Exact equality check: Even if the value is invalid,
      //    stop evaluating the chain. Complaining about invalid
      //    ACL results is done elsewhere. (2022-08-12: in whyDeny)
      Object.assign(chainCtx.state, { decision });
      return true;
    }
    const pn = chainCtx.allMeta.privilegeName;
    const ruleHasBeenDecided = maybe(pn) || maybe('*');
    return ruleHasBeenDecided;
  },


  async decideSkipRule(rule, chainCtx) {
    let skipRule = false;
    async function oneCondGroup(cgr) {
      if (skipRule) { return; }
      const allMet = await EX.decideOneCondGroup(cgr, chainCtx);
      const someNotMet = !allMet;
      skipRule = someNotMet;
      if (cgr.negate) { skipRule = !skipRule; };
    }
    await pEachSeries(Object.values(rule.condGroups), oneCondGroup);
    return skipRule;
  },


  async decideOneCondGroup(cgr, chainCtx) {
    const { initiallyMet } = cgr; // "met" as in "meet all criteria"
    let allMet = initiallyMet;
    const cfl = cgr.checkFuncsList;
    if (!cfl) { return allMet; }
    await pEachSeries(cfl, async function oneCond(checkFunc) {
      if (allMet !== initiallyMet) { return; }
      const oneMet = await checkFunc(chainCtx);
      condResultMustBeBool(oneMet);

      // Next assignment needs no condition branch because it either
      // won't cause a change anyway, or will be the last to cause
      // a change, because above we abort on first disagreement.
      allMet = oneMet;
    });
    return allMet;
  },


});


export default EX;
