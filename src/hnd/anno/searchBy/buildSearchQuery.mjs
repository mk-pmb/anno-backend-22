// -*- coding: utf-8, tab-width: 2 -*-

import mapObjValues from 'lodash.mapvalues';

import makeNumberizer from 'simple-placeholder-slot-numberizer-pmb';
import slotTpl from 'simple-recursive-string-slot-template-pmb';

import queryTemplates from './queryTemplates.mjs';


const EX = {

  defaultTemplates: queryTemplates,

  prepare() {
    const b = {
      templates: { ...EX.defaultTemplates },
      dataSlots: {},
    };
    Object.assign(b, mapObjValues(EX.api, f => f.bind(null, b)));
    return b;
  },

};


EX.api = {

  tmpl(b, t) { return Object.assign(b.templates, t) && b; },
  data(b, d) { return Object.assign(b.dataSlots, d) && b; },


  async selectAll(bsq, srv) {
    let qry = slotTpl('#baseQuery', /#([A-Za-z]\w*)/g, bsq.templates);
    const numb = makeNumberizer();
    qry = slotTpl(qry, /\$([A-Za-z]\w*)/g, mapObjValues(bsq.dataSlots, numb));
    const args = numb.values;
    console.debug('built search query: >>' + qry + '<<', args);
    const found = await srv.db.postgresSelect(qry, args);
    return found;
  },




};







export default EX;
