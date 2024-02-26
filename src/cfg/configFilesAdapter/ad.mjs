// -*- coding: utf-8, tab-width: 2 -*-

import absDir from 'absdir';
import crObAss from 'create-object-and-assign';
import makeExtendedOrderedMap from 'ordered-map-extended-pmb';
import mustBe from 'typechecks-pmb/must-be';
import objPop from 'objpop';


import coreApi from './coreApi.mjs';
import readAsDict from './readAsDict.mjs';

const pathInRepo = absDir(import.meta, '../../..');


const EX = {

  async make(how) {
    const { popCfg } = how;

    await import(pathInRepo('package.json'));
    // ^- Verify we have the correct relative paths, because I originally
    //    forgot this adjustment when refactoring.

    const cfgDict = popCfg('obj', 'cfgfiles');
    const ad = crObAss(EX.api, {
      cfgDict,
      cfgDir: cfgDict.dir,
    });
    ad.customData = await ad.readAsDict('custom_data');
    return ad;
  },


  getConfigDefaults() {
    const df = {
      dir: pathInRepo('cfg.@localhost'), // usually set by run_server.sh
    };
    return df;
  },


  api: {
    ...coreApi,
    readAsDict,

    async readMustPop(topic) {
      const cfgDict = await this.readAsDict(topic);
      const mustPop = objPop(cfgDict, { mustBe }).mustBe;
      return mustPop;
    },

    async readAsMap(topic) {
      const cfgDict = await this.readAsDict(topic);
      return makeExtendedOrderedMap().upd(cfgDict);
    },

  },

};


export default EX;
