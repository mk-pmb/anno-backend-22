// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';
import vTry from 'vtry';

import allKnownSimplifierFeatures from './allKnownSimplifierFeatures.mjs';


const EX = function learnOneSimplifierEntry(acl, simpSpec, entryIdx) {
  const traceDescr = 'simplify step ' + (entryIdx + 1);
  const popSimp = objPop(simpSpec, { mustBe });
  const ctx = { acl, popSimp, traceDescr };
  Object.entries(allKnownSimplifierFeatures).forEach(
    ([name, impl]) => EX.learnOneFeature(ctx, name, impl));
  popSimp.expectEmpty(traceDescr + ': Unsupported simplifier features');
};


Object.assign(EX, {

  learnOneFeature(origCtx, name, impl) {
    const details = origCtx.popSimp(name);
    if (details === undefined) { return; }
    const traceDescr = origCtx.traceDescr + ', feature ' + name;
    const ctx = {
      ...origCtx,
      name,
      details,
      traceDescr,
    };
    const trFunc = vTry(impl, 'Configure ' + traceDescr)(ctx);
    mustBe('fun', 'Simplifier function for ' + traceDescr)(trFunc);
    Object.assign(trFunc, { traceDescr });
    origCtx.acl.userIdTransforms.push(trFunc);
  },


});



export default EX;
