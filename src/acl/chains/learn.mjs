// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import isStr from 'is-string';
import mustBe from 'typechecks-pmb/must-be';
import objFromKeys from 'obj-from-keys-list';
import objPop from 'objpop';
import pMap from 'p-map';
import pProps from 'p-props';
import vTry from 'vtry';

import conditionCheckFactories from './conditionCheckFactories/all.mjs';
import decisionEnum from '../decisionEnum.mjs';


const EX = async function learnAllAclChains(acl) {
  // "learn" := parse + store
  const origChainSpecs = await acl.initTmp.cfg.readAsDict('acl_chains');
  await pProps(origChainSpecs,
    (rules, name) => EX.learnOneChain(acl, rules, name));
};


Object.assign(EX, {

  async learnOneChain(acl, origRulesList, chainName) {
    mustBe.ary('Rules for ACL chain ' + chainName, origRulesList);
    console.debug('learnOneChain', chainName, origRulesList);
    function eachRule(origRuleSpec, ruleIdx) {
      const ruleNum = ruleIdx + 1;
      const traceHint = 'Parse ACL chain ' + chainName + ' rule #' + ruleNum;
      const how = {
        acl,
        chainName,
        origRuleSpec,
        traceHint,
      };
      return vTry.pr(EX.parseOneRule, traceHint)(how);
    }
    const parsedRules = await pMap(origRulesList, eachRule);
    acl.chainsByName.set(chainName, parsedRules);
  },

  async parseOneRule(origHow) {
    const {
      origRuleSpec,
      traceHint,
    } = origHow;
    const popRuleProp = objPop(origRuleSpec, { mustBe }).mustBe;

    const rule = {
      ...objFromKeys(function popDecisionDict(key) {
        return decisionEnum.popValidateDict(popRuleProp, key);
      }, [
        'decide',
        'tendency',
      ]),
    };

    const subHow = {
      ...origHow,
      popRuleProp,
      rule,
    };
    console.debug(traceHint, 'D: ACL rule', origRuleSpec);

    let hadAnyCondition = false;

    const condIfOne = popRuleProp('nonEmpty str | obj | undef', 'if');
    if (condIfOne) {
      hadAnyCondition = true;
      if (condIfOne !== 'always') {
        rule.condIf = await vTry.pr(EX.makeCheckFunc,
          'Parse "if" condition')(condIfOne, subHow);
      }
    }

    if (!hadAnyCondition) {
      const msg = 'No condition. For clarity, please add "if: always".';
      throw new Error(msg);
    }

    popRuleProp.expectEmpty('Unsupported left-over properties');
  },


  detectCondName(spec) {
    if (isStr(spec)) { return [spec, false]; }
    const e = Object.entries(spec);
    const n = e.length;
    if (n === 1) { return e; }
    if (!n) { throw new Error('Found no condition name'); }
    throw new Error('Found too many condition names');
  },


  makeCheckFunc(condSpec, how) {
    const [condName, condArgs] = EX.detectCondName(condSpec);
    const makeCkf = getOwn(conditionCheckFactories, condName);
    if (!makeCkf) { throw new Error('Unknown condition ' + condName); }
    return vTry.pr(makeCkf, 'Compile condition ' + condName)(
      { ...how, condName, condArgs });
  },


});


export default EX;
