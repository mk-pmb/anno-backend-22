// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import objDive from 'objdive';

import metaSlotTemplate from './metaSlotTemplate.mjs';


const EX = {

  debugDumpMeta(how) {
    return function debugDumpMeta(chainCtx) {
      console.debug(how.ruleTraceDescr, 'allMeta:', chainCtx.allMeta);
    };
  },


};


export default EX;
