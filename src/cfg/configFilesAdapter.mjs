// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';

import absDir from 'absdir';
import crObAss from 'create-object-and-assign';
import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be';
import readDataFile from 'read-data-file';
import vTry from 'vtry';


const pathInRepo = absDir(import.meta, '../..');


const EX = {

  async make(how) {
    const { popCfg } = how;
    const cfgDict = popCfg('obj', 'cfgfiles');
    const ad = crObAss(EX.api, {
      cfgDict,
      cfgDir: cfgDict.dir,
    });
    return ad;
  },


  getConfigDefaults() {
    const df = {
      dir: pathInRepo('cfg.@localhost'), // usually set by run_server.sh
      collections: 'collections.yaml',
    };
    return df;
  },


  api: {

    async read(topic) {
      console.debug('cfga read:', [topic]);
      mustBe.nest('Config topic', topic);
      const ad = this;
      const descr = ('config for topic ' + topic);
      let path = (getOwn(ad, topic) || (topic + '.yaml'));
      mustBe.nest('Path to ' + descr, path);
      if (!pathLib.isAbsolute(path)) { path = pathLib.join(ad.cfgDir, path); }
      return vTry.pr(readDataFile, 'Read ' + descr)(path);
    },

  },

};


export default EX;
