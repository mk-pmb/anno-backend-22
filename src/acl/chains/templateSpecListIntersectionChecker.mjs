// -*- coding: utf-8, tab-width: 2 -*-

import metaSlotTemplate from './metaSlotTemplate.mjs';


function alwaysFalse() { return false; }


const EX = function makeTemplateSpecListIntersectionChecker(how) {
  const acceptable = metaSlotTemplate.bulkCompile(how);
  if (!acceptable.nTotal) { return alwaysFalse; }
  const debugSpy = EX.makeDebugSpy(how);
  const ckf = EX.buildCheckFunc(how.getAclCtxValues,
    EX.makeSetChecker(acceptable.verbatims, debugSpy),
    EX.makeRenderersChecker(acceptable.renderers, debugSpy),
    debugSpy);
  return ckf;
};


Object.assign(EX, {

  makeDebugSpy(how) {
    if (!how.debugHint) { return; }
    return console.debug.bind(console, how.debugHint);
  },


  buildCheckFunc(getAclCtxValues, checkVerbatims, checkRenderers, debugSpy) {
    /* Constructing the check function inside a function scope with only
      the necessary arguments helps with garbage collection because this
      way the check function doesn't hold any refernces to variables for
      intermediate values. */
    const ckf = async function check(aclCtx) {
      const values = await getAclCtxValues(aclCtx);
      if (debugSpy) { debugSpy('getAclCtxValues yielded:', values); }
      if (values === false) { return false; }
      if (!Array.isArray(values)) { throw new TypeError('Expected array'); }
      if (!values.length) { return false; }
      return checkVerbatims(values) || checkRenderers(aclCtx, values);
    };
    // return EX.traceThisCheckFunc(ckf);
    return ckf;
  },


  traceThisCheckFunc(ckf) {
    const trace = (new Error('buildCheckFunc() was invoked from:')
    ).stack.split(/\n\s*/).slice(3);
    return (...args) => ckf(args).then(null, (err) => {
      err.traceCheckFunc = trace; // eslint-disable-line no-param-reassign
      throw err;
    });
  },


  makeSetChecker(acceptableValues, debugSpy) {
    if (!acceptableValues.size) {
      if (debugSpy) { debugSpy({ acceptableValues }); }
      return alwaysFalse;
    }
    if (acceptableValues.size === 1) {
      const [singleVerbatim] = Array.from(acceptableValues);
      return function decideSingleVerbatim(ctxValues) {
        const accept = ctxValues.includes(singleVerbatim);
        if (debugSpy) { debugSpy({ singleVerbatim, ctxValues, accept }); }
        return accept;
      };
    }
    const decide = acceptableValues.has.bind(acceptableValues);
    return function anyInSet(ctxValues) {
      const accept = ctxValues.some(decide);
      if (debugSpy) { debugSpy({ acceptableValues, ctxValues, accept }); }
      return accept;
    };
  },


  makeRenderersChecker(renderers, debugSpy) {
    if (!renderers.length) {
      if (debugSpy) { debugSpy({ renderers }); }
      return alwaysFalse;
    }
    const checkOne = function renderAndCheckOneItem(render, aclCtx, values) {
      const candidate = render(aclCtx);
      const accept = candidate && values.includes(candidate); /*
        The `candidate &&` check skips items whose template has resulted
        in an empty string: If the empty string was acceptable, it should
        have been specified verbatim. */
      if (debugSpy) { debugSpy({ render, candidate, accept }); }
      return accept;
    };
    if (renderers.length === 1) { return checkOne.bind(null, renderers[0]); }
    return function anyInRenderedList(aclCtx, values) {
      return renderers.some(r => checkOne(r, aclCtx, values));
    };
  },



});


export default EX;
