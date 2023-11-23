// -*- coding: utf-8, tab-width: 2 -*-

import mapObjValues from 'lodash.mapvalues';

import makeNumberizer from 'simple-placeholder-slot-numberizer-pmb';
import slotTpl from 'simple-recursive-string-slot-template-pmb';

import miscSql from '../miscSql.mjs';
import queryTemplates from './queryTemplates.mjs';


const EX = {

  defaultTemplates: queryTemplates,

  prepare(how) {
    const {
      approvalRequired,
    } = (how || false);
    const b = {
      templates: { ...EX.defaultTemplates },
      dataSlots: {},
    };
    Object.assign(b, mapObjValues(EX.api, f => f.bind(null, b)));
    if (approvalRequired) {
      b.joinStampEffUts0('approval', 'dc:dateAccepted');
    }
    b.joinStampEffUts0('sunset', 'as:deleted');

    return b;
  },

};


EX.api = {

  tmpl(b, t) { return Object.assign(b.templates, t) && b; },
  data(b, d) { return Object.assign(b.dataSlots, d) && b; },


  async selectAll(bsq, srv) {
    const tpl = {
      ...bsq.templates,
      nowUts: Date.now() / 1e3,
    };
    let qry = slotTpl('#baseQuery', /#([A-Za-z]\w*)/g, tpl);
    const numb = makeNumberizer();
    qry = slotTpl(qry, /\$([A-Za-z]\w*)/g, mapObjValues(bsq.dataSlots, numb));
    const args = numb.values;
    // console.debug('built search query: >>' + qry + '<<', args);
    const found = await srv.db.postgresSelect(qry, args);
    return found;
  },


  joinStampEffUts0(bsq, joinAs, stType) {
    const { colLn, join } = miscSql.joinStampEffUts0(joinAs, stType);
    const tpl = bsq.templates;
    tpl.stampFilterColumns += colLn;
    tpl.stampFilterJoins += join;
    tpl.stampFilterWhereAnds += '\n      #' + joinAs + 'WhereAnd';
  },


};







export default EX;
