// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';
import objFromKeys from 'obj-from-keys-list';
import objPop from 'objpop';
import pEachSeries from 'p-each-series';
import pMap from 'p-map';
import pProps from 'p-props';
import vTry from 'vtry';

import decisionEnum from '../decisionEnum.mjs';
import parseConditionGroup from './parseConditionGroup.mjs';
import aclEmojiTemplate from './emojiTemplate.mjs';

const traceApi = { toString() { return '[' + this.traceDescr + ']'; } };


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

    const subChainSpec = popRuleProp('nonEmpty str | undef', 'aclSubChain');
    const aclSubChain = (subChainSpec
      && aclEmojiTemplate.compile(subChainSpec));

    const rule = {
      traceDescr,
      ...traceApi,
      ...objFromKeys(function popDecisionDict(key) {
        return decisionEnum.popValidateDict(popRuleProp, key);
      }, [
        'decide',
        'tendency',
      ]),
      condGroups: {},
      aclSubChain,
    };

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

    (function dd() {
      const key = 'debugDump';
      const val = popRuleProp('undef | str', key);
      if (val) { rule[key] = val; }
    }());

    if (!Object.keys(rule.condGroups)) {
      const msg = 'No condition. For clarity, please add "if: always".';
      throw new Error(msg);
    }

    popRuleProp.expectEmpty('Unsupported left-over properties');

    return rule;
  },


});


export default EX;
