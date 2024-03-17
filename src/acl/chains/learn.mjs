// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be';
import objFromKeys from 'obj-from-keys-list';
import objPop from 'objpop';
import pEachSeries from 'p-each-series';
import pMap from 'p-map';
import pProps from 'p-props';
import vTry from 'vtry';

import repeaterFactories from './repeaterFactories.mjs';
import sideEffectFactories from './sideEffectFactories.mjs';

import decisionEnum from '../decisionEnum.mjs';
import parseConditionGroup from './parseConditionGroup.mjs';
import metaSlotTemplate from './metaSlotTemplate.mjs';


const traceApi = { toString() { return '[' + this.traceDescr + ']'; } };

function orf(x) { return x || false; }


const EX = async function learnAllAclChains(acl) {
  // "learn" := parse + store
  const origChainSpecs = await acl.initTmp.cfg.readAsDict('acl_chains');
  await pProps(origChainSpecs,
    (rules, name) => EX.learnOneChain(acl, rules, name));
};


Object.assign(EX, {

  supportedCondGroups: [
    { propKeyBase: 'if', isNegation: false },
    { propKeyBase: 'unless', isNegation: true },
  ],

  conflictingRuleProps: [
    ['decide', 'aclSubChain'],
  ],


  async learnOneChain(acl, origRulesList, chainName) {
    mustBe.ary('Rules for ACL chain ' + chainName, origRulesList);
    // console.debug('learnOneChain', chainName, origRulesList);
    function eachRule(origRuleSpec, ruleIdx) {
      const ruleNum = ruleIdx + 1;
      const traceDescr = 'ACL[' + chainName + ']#' + ruleNum;
      const how = {
        acl,
        chainName,
        origRuleSpec,
        traceDescr,
        ...traceApi,
      };
      return vTry.pr(EX.parseOneRule, 'Parse ' + traceDescr)(how);
    }
    const parsedRules = await pMap(origRulesList, eachRule);
    acl.chainsByName.set(chainName, parsedRules);
  },

  async parseOneRule(origHow) {
    const {
      acl,
      origRuleSpec,
      traceDescr,
    } = origHow;
    // console.debug(traceDescr, origRuleSpec);
    const popRuleProp = objPop(origRuleSpec, { mustBe }).mustBe;

    EX.conflictingRuleProps.forEach(function check(group) {
      const used = group.filter(p => (origRuleSpec[p] !== undefined));
      if (used.length < 2) { return; }
      throw new Error('Rule can use at most on of: ' + used.join(', '));
    });

    const rule = {
      traceDescr,
      ...traceApi,
      ...objFromKeys(key => decisionEnum.popValidateDict(popRuleProp, key),
        ['decide', 'tendency']),
      condGroups: {},
    };

    rule.repeatImpl = await EX.prepareFactoryFunc(acl, traceDescr,
      popRuleProp('undef | dictObj', 'repeat'),
      repeaterFactories, 'type');

    const sideEffectSpecs = arrayOfTruths.ifAny(popRuleProp(
      'undef | nul | ary', 'sideEffects'));
    rule.sideEffects = await (sideEffectSpecs && pMap(sideEffectSpecs,
      se => EX.prepareFactoryFunc(acl, traceDescr, se,
        sideEffectFactories, ':',
        { namePropDescr: 'side effect name' })));

    rule.subChainNameBuilders = arrayOfTruths.ifAnyMap(
      popRuleProp('undef | str | ary', 'aclSubChain'),
      metaSlotTemplate.compile);

    await pEachSeries(EX.supportedCondGroups, async function cg(spec) {
      const { propKeyBase } = spec;
      const cgrHow = {
        ...spec,
        popRuleProp,
        traceDescr,
        ...traceApi,
      };
      const groupState = await parseConditionGroup(cgrHow);
      if (!groupState.hadAnyRuleProp) { return; }
      rule.condGroups[propKeyBase] = groupState;
    });
    if (!Object.keys(rule.condGroups)) {
      const msg = 'No condition. For clarity, please add "if: always".';
      throw new Error(msg);
    }

    popRuleProp.expectEmpty('Unsupported left-over properties');

    return rule;
  },


  async prepareFactoryFunc(acl, trace, spec, factories, nameProp, origOpt) {
    const opt = orf(origOpt);
    if (!spec) { return false; }
    const pop = objPop(spec, { mustBe }).mustBe;
    const name = pop('nonEmpty str', nameProp);
    const fac = getOwn(factories, name);
    if (!fac) {
      const unsupp = 'Unsupported ' + (opt.namePropDescr || nameProp);
      throw new Error(unsupp + ': ' + name);
    }
    const impl = await vTry.pr(fac, 'While parsing ' + nameProp)({
      acl,
      popSpecProp: pop,
      ruleTraceDescr: trace,
    });
    pop.expectEmpty('Unsupported left-over parameters for field ' + nameProp);
    return impl;
  },





});


export default EX;
