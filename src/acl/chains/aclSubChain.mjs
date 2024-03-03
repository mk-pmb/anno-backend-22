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
    chainNamesStack: [...chainCtx.chainNamesStack, chainName],
  };

  const rules = chainCtx.getAcl().getChainByName(chainName);
  if (!rules) {
    const err = new Error('Found no ACL chain named '
      + JSON.stringify(chainName));
    Object.assign(err, { chainName });
    throw err;
  }
  await pEachSeries(rules, function oneRule(rule) {
    return vTry.pr(EX.oneRule, rule.traceDescr)(rule, subCtx);
  });
};


Object.assign(EX, {

  async oneRule(rule, chainCtx) {
    const chainState = chainCtx.state;
    const trace = console.debug.bind(console, rule.traceDescr);
    // trace('check', { deci: chainState.decision });
    if (chainState.decision) { return; }

    const skipRule = await EX.decideSkipRule(rule, chainCtx);
    if (rule.debugDump === 'meta') {
      trace({ skipRule }, 'allMeta:', chainCtx.allMeta);
    }
    if (skipRule) {
      // trace('skip!');
      return;
    }

    if (rule.decide && EX.applyRuleDecide(rule, chainCtx)) { return; }

    // trace('apply!', { ...rule, condGroups: '[…]' });
    Object.assign(chainState.tendencies, rule.tendency);

    if (rule.subChainNameBuilders) {
      const subchainNames = rule.subChainNameBuilders.map(nb => nb(chainCtx));
      // trace('subchainNames:', subchainNames);
      await pEachSeries(subchainNames,
        cn => (cn && (!chainState.decision) && EX(chainCtx, cn)));
    }
  },


  applyRuleDecide(rule, chainCtx) {
    const newDecisions = rule.decide;
    const chainState = chainCtx.state;
    if (newDecisions['*']) { chainState.tendencies = {}; }
    Object.assign(chainState.allDecisions, newDecisions);

    function maybe(slot) {
      const deci = getOwn(newDecisions, slot);
      // console.debug(rule.traceDescr, 'decision?', { slot, decision });
      if (deci === undefined) { return false; }
      // ^- Exact equality check: Even if the value is invalid,
      //    stop evaluating the chain. Complaining about invalid
      //    ACL results is done elsewhere. (2022-08-12: in whyDeny)
      chainState.decision = deci;
      chainState.traceDecision = rule.traceDescr;
      return true;
    }

    const pn = chainCtx.allMeta.privilegeName;
    const ruleHasBeenDecided = maybe(pn) || maybe('*');
    if (ruleHasBeenDecided) { delete chainState.tendencies[pn]; }
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
