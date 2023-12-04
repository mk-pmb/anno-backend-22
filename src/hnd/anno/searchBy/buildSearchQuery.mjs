// -*- coding: utf-8, tab-width: 2 -*-

import mapObjValues from 'lodash.mapvalues';
import mustBe from 'typechecks-pmb/must-be.js';

import makeNumberizer from 'simple-placeholder-slot-numberizer-pmb';
import slotTpl from 'simple-recursive-string-slot-template-pmb';

import defaultTemplates from './queryTemplates/index.mjs';

function ifUndef(x, d) { return (x === undefined ? d : x); }


const EX = {

  defaultTemplates,

  prepare(seed, initTmpl, initData) {
    const b = {
      seed,
      templates: { ...EX.defaultTemplates, ...initTmpl },
      dataSlots: { ...initData },
    };
    Object.assign(b, mapObjValues(EX.api, f => f.bind(null, b)));
    return b;
  },


  acceptableDbQueryArgTypes: 'str | num',

  validateDbQueryArgTypes(descr, dict) {
    const vali = mustBe.tProp(descr, dict, EX.acceptableDbQueryArgTypes);
    Object.keys(dict).forEach(k => vali(k)); // forward only arg 1!
  },


};


function smartAssign(d, k, v) {
  const t = k && typeof k;
  if (t === 'object') { return Object.assign(d, k); }
  d[k] = v; // eslint-disable-line no-param-reassign
  return d;
}


EX.api = {

  tmpl(b, ...a) { return smartAssign(b.templates, ...a) && b; },
  data(b, ...a) { return smartAssign(b.dataSlots, ...a) && b; },

  tmplIf(bsq, cond, key, customVal, elseVal) {
    const val = (cond ? ifUndef(customVal, cond) : elseVal);
    if (val === undefined) { return bsq; }
    bsq.templates[key] = val; // eslint-disable-line no-param-reassign
    return bsq;
  },


  buildSql(bsq) {
    bsq.validateDataSlotValues(bsq);
    const tpl = {
      ...bsq.templates,
      nowUts: Math.floor(Date.now() / 1e3),
    };
    let query = slotTpl(bsq.seed, /#([A-Za-z]\w*)/g, tpl);
    query = query.replace(/\s+\r/g, '');
    query = query.replace(/\s+\n/g, '\n').trim();
    const numb = makeNumberizer();
    query = slotTpl(query, /\$([A-Za-z]\w*)/g,
      mapObjValues(bsq.dataSlots, numb), { reportUnused: 'error' });
    const args = numb.values;
    // EX.validateDbQueryArgTypes('Search query data list ', numb.values);
    // setTimeout(() => console.debug('built SQL:', query, args), 10);
    return { query, args };
  },


  validateDataSlotValues(bsq) {
    EX.validateDbQueryArgTypes('Search query data slot ', bsq.dataSlots);
  },


  async selectAll(bsq, srv) {
    const { query, args } = bsq.buildSql();
    const found = await srv.db.postgresSelect(query, args);
    return found;
  },


  /* No longer supported in queryTemplates/core.mjs, but we'll probably
     have to revive this when we want to search by DOI request stamp.

  joinStampEffUts0(bsq, joinAs, stType) {
    const { colLn, join } = miscSql.joinStampEffUts0(joinAs, stType);
    const tpl = bsq.templates;
    tpl.stampFilterColumns += colLn;
    tpl.stampFilterJoins += join;
    tpl.stampFilterWhereAnds += '\n      #' + joinAs + 'WhereAnd';
  },
  */


  wrapSeed(bsq, wrTmplName) {
    const wrTmplText = mustBe.tProp('Wrapper template ', bsq.templates,
      'nonEmpty str', wrTmplName);
    const [a, b, y, z, extra] = wrTmplText.split(/(^|\s)#\|(\s|$)/);
    let bad;
    if (z === undefined) { bad = 'no'; }
    if (extra !== undefined) { bad = 'too many'; }
    if (bad) {
      const msg = ('Wrapper template "' + wrTmplName
        + '" has ' + bad + ' insertion marker(s).');
      throw new Error(msg);
    }
    // eslint-disable-next-line no-param-reassign
    bsq.seed = a + b + bsq.seed + y + z;
    return bsq;
  },


};







export default EX;
