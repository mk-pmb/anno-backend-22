// -*- coding: utf-8, tab-width: 2 -*-

import pEachSeries from 'p-each-series';


const EX = {

  staticMetadataForEach(how) {
    const { popSpecProp, ruleTraceDescr } = how;
    const slot = popSpecProp('nonEmpty str', 'slot');
    const items = popSpecProp('undef | nul | ary', 'list') || [];
    String(popSpecProp('undef | nul | str', 'words')
      || '').replace(/\S+/g, w => items.push(w));

    const trace = popSpecProp('undef | nul | nonEmpty str | bool', 'trace');
    if (trace) { console.debug(ruleTraceDescr, { trace, slot, items }); }

    function repeat(processRule, rule, chainCtx) {
      return pEachSeries(items, function each(item) {
        if (chainCtx.state.decision) { return; };
        if (trace) { console.debug(ruleTraceDescr, { trace, slot, item }); }
        const subMeta = { ...chainCtx.allMeta, [slot]: item };
        return processRule(rule, { ...chainCtx, allMeta: subMeta });
      });
    }

    return repeat;
  },


};


export default EX;
