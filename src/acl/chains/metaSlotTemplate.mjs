// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';


const allSlotsRgx = /<\$([A-Za-z][\w\-\.]*)>/g;

allSlotsRgx.reset = function reset() {
  // Unless we manually reset, the next .test() might report a false negative.
  // -> https://stackoverflow.com/a/2141974
  allSlotsRgx.lastIndex = 0;
  return allSlotsRgx;
};


function emptyMeansFalse(x) { return ((x && x.length) ? x : false); }
function allIfAny() { return emptyMeansFalse(this.all); }


const EX = {

  hasSlots(spec) {
    const has = allSlotsRgx.reset().test(spec);
    return has;
  },

  compile(spec) {
    // Minimize effort for literal specs (no lookup slots):
    const hs = EX.hasSlots(spec);
    const f = (hs ? EX.render : String).bind(null, spec);
    f.hasSlots = hs;
    f.origSpec = spec;
    return f;
  },

  render(spec, ctx) {
    const r = spec.replace(allSlotsRgx.reset(),
      (m, k) => (ctx.allMeta[m && k] || ''));
    return r;
  },

  bulkCompile(opt) {
    const all = [];
    const renderers = [];
    const verbatims = new Set();
    const report = {
      all,
      renderers,
      verbatims,
      nTotal: null,
      allIfAny,
    };
    const { flagPrefix } = opt;
    [].concat(opt.specsList).forEach(function compile(spec, idx) {
      if ((spec === '') && opt.allowEmptySpec) { return verbatims.add(spec); }
      if (!spec) { return; }
      mustBe.str(opt.specsItemDescr + ' #' + (idx + 1), spec);
      if (flagPrefix && spec.startsWith(flagPrefix)) {
        report[spec.slice(flagPrefix.length)] = true;
        return;
      }
      const r = EX.compile(spec);
      all.push(r);
      if (r.hasSlots) { return renderers.push(r); }
      verbatims.add(spec);
    });
    report.nTotal = all.length;
    if (opt.debugHint) { console.debug(opt.debugHint, report); }
    return report;
  },















};


export default EX;
