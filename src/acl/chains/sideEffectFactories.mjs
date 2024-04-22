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


  debugTrace(how) {
    const { popSpecProp, ruleTraceDescr } = how;
    const msg = popSpecProp('nonEmpty str | undef', 'msg');
    return function debugTrace() {
      console.debug(ruleTraceDescr, msg);
    };
  },


  setMetaFromCustomDataDict(how) {
    const { popSpecProp, acl } = how;
    const dict = objDive(acl.initTmp.cfg.customData,
      popSpecProp('nonEmpty str', 'dict'));
    const searchFor = metaSlotTemplate.compile(
      popSpecProp('nonEmpty str', 'searchFor'));
    const notFound = popSpecProp('any', 'notFound');
    const setSlot = popSpecProp('nonEmpty str | nul', 'setSlot');
    return function setMetaFromCustomDataDict(chainCtx) {
      const key = searchFor(chainCtx);
      const data = getOwn(dict, key, notFound);
      const { allMeta } = chainCtx;
      if (setSlot === null) {
        Object.assign(allMeta, data);
      } else {
        allMeta[setSlot] = data;
      }
      // console.debug(how.ruleTraceDescr, 'setMeta', { key, data, allMeta });
    };
  },


};


export default EX;
