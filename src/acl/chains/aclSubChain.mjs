// -*- coding: utf-8, tab-width: 2 -*-

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
    console.debug('D: ACL rule check:', rule.traceDescr);

    const skipRule = await EX.decideSkipRule(rule, chainCtx);
    if (skipRule) {
      console.debug('D: ACL rule skip!', rule.traceDescr);
      return;
    }

    console.debug('D: ACL rule apply!', { ...rule, condGroups: '[…]' });
  },


  async decideSkipRule(rule, chainCtx) {
    let skipRule = false;
    async function oneCondGroup(cgr) {
      if (skipRule) { return; }
      const allMet = await EX.decideOneCondGroup(cgr, chainCtx);
      const someNotMet = !allMet;
      skipRule = someNotMet;
      if (cgr.negate) { skipRule = !skipRule; };

      console.debug('D: ACL rule cond group?', cgr.traceDescr, {
        ...cgr,
        checkFuncsList: '[…]',
      }, { allMet, skipRule });
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
      console.debug('D: ACL rule cond', checkFunc.traceDescr,
        { allMet, oneMet });

      // Next assignment needs no condition branch because it either
      // won't cause a change anyway, or will be the last to cause
      // a change, because above we abort on first disagreement.
      allMet = oneMet;
    });
    return allMet;
  },


});


export default EX;
