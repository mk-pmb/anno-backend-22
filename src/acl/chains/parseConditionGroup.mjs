// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import isStr from 'is-string';
import loPick from 'lodash.pick';
import mustBe from 'typechecks-pmb/must-be';
import nullifyObjValues from 'nullify-object-values-shallow-inplace';
import pMap from 'p-map';
import vTry from 'vtry';

import conditionCheckFactories from './conditionCheckFactories/all.mjs';


const initMet = { initiallyMet: true };

const EX = async function parseConditionGroup(origHow) {
  const traceDescr = (origHow.traceDescr + ':' + origHow.propKeyBase + '*');
  const grSt = {
    hadAnyRuleProp: false,
    hadAnyCheckableCond: false,
    initiallyMet: false, // result until a checkFunc disagrees
    checkFuncsList: [],
    negate: mustBe.tProp(traceDescr + '.', origHow, 'bool', 'isNegation'),
    traceDescr,
  };
  const how = {
    ...origHow, // <- popRuleProp, propKeyBase, isNegation
    traceDescr,
    groupState: grSt,
  };

  await EX.parseCondKey({ ...how, singleCond: true });
  await EX.parseCondKey({ ...how, keySuffix: 'Any' });
  await EX.parseCondKey({ ...how, keySuffix: 'All', setGS: initMet });
  // `git grep` trap: ifAny, ifAll, unlessAny, unlessAll

  if (!grSt.checkFuncsList.length) { grSt.checkFuncsList = false; }

  return grSt;
};


Object.assign(EX, {

  async parseCondKey(how) {
    const {
      popRuleProp,
      groupState,
    } = how;
    const rulePropKey = how.propKeyBase + (how.keySuffix || '');
    const origCondSpec = popRuleProp('nonEmpty str | obj | undef', rulePropKey);
    if (!origCondSpec) { return; }

    const { hadAnyRuleProp } = groupState;
    if (hadAnyRuleProp) {
      const msg = rulePropKey + ' cannot be combined with ' + hadAnyRuleProp;
      throw new Error(msg);
    }
    groupState.hadAnyRuleProp = rulePropKey;
    Object.assign(groupState, how.setGS);

    // Special case for the simple "if: always" clarification:
    if ((rulePropKey === 'if') && (origCondSpec === 'always')) {
      groupState.hadAnyRuleProp += ':' + origCondSpec;
      groupState.initiallyMet = true;
      return;
    }

    const condSpecList = (how.expectSingleCond
      ? [origCondSpec]
      : [].concat(origCondSpec));
    const condListParsed = await pMap(condSpecList,
      (s, i) => EX.parseCondList(how, s, i));
    return condListParsed;
  },


  detectCondName(spec) {
    if (isStr(spec)) { return [spec]; }
    const e = Object.entries(spec);
    const n = e.length;
    if (n === 1) { return e[0]; }
    if (!n) { throw new Error('Found no condition name'); }
    throw new Error('Found too many condition names');
  },


  async makeCheckFunc(origHow, condName, condArgs) {
    const makeCkf = getOwn(conditionCheckFactories, condName);
    if (!makeCkf) { throw new Error('Unknown condition ' + condName); }
    const traceDescr = origHow.traceDescr + ':' + condName;
    const how = {
      name: condName,
      args: condArgs,
      traceDescr,
      ...loPick(origHow, [
        'popRuleProp',
      ]),

      // Pass all other stuff only on demand, to avoid accidential refs.
      // That way, when we release those getters later, garbage collection
      // should be able to release the entire `origHow`.
      more() { return origHow; },
    };
    const ckf = await makeCkf(how);
    mustBe.fun('The check function', ckf);
    Object.assign(ckf, { condName, traceDescr });
    origHow.groupState.checkFuncsList.push(ckf);

    // Invalidate above refs to help garbage collection:
    nullifyObjValues(how);

    return ckf;
  },


  async parseCondList(how, origCondSpec, condIdx) {
    const condNum = condIdx + 1;
    const [name, args] = EX.detectCondName(origCondSpec);
    const traceDescr = how.traceDescr + '#' + condNum + '(' + name + ')';
    const check = await vTry.pr(EX.makeCheckFunc,
      'Compile ' + traceDescr)(how, name, args);
    const { groupState } = how;
    groupState.hadAnyCheckableCond = true;
    const cond = { traceDescr, name, args, check };
    return cond;
  },


});


export default EX;
