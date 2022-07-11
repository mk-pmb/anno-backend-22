// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';
import fsPromises from 'fs/promises';

import absDir from 'absdir';
import crObAss from 'create-object-and-assign';
import getOwn from 'getown';
import mergeOpt from 'merge-options';
import mustBe from 'typechecks-pmb/must-be';
import readDataFile from 'read-data-file';
// import vTry from 'vtry';


const pathInRepo = absDir(import.meta, '../..');
const cfgFileSuffix = '.yaml';

function err2null() { return null; }


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
    };
    return df;
  },


  api: {

    async read(topic) {
      mustBe.nest('Config topic', topic);
      const ad = this;
      const descr = ('config for topic ' + topic);
      let basePath = (getOwn(ad, topic) || topic);
      mustBe.nest('Path to ' + descr, basePath);
      if (!pathLib.isAbsolute(basePath)) {
        basePath = pathLib.join(ad.cfgDir, basePath);
      }

      const singlePr = readDataFile(basePath + cfgFileSuffix).catch(err2null);
      const dirFiles = await (fsPromises.readdir(basePath).catch(err2null));
      const dirCfgFiles = (dirFiles || []).sort().filter(
        n => n.endsWith(cfgFileSuffix));
      const dirConfigPrs = dirCfgFiles.map(function oneCfgFile(name) {
        const bfn = name.slice(0, -cfgFileSuffix.length);
        function wrap(x) { return { [bfn]: x }; }
        return readDataFile(pathLib.join(basePath, name)).then(wrap, err2null);
      });

      const readableConfigs = (await Promise.all([
        singlePr,
        ...dirConfigPrs,
      ])).filter(Boolean);
      const merged = mergeOpt({}, ...readableConfigs);
      if (!Object.keys(merged).length) {
        throw new Error('Found no config settings AT ALL for topic ' + topic);
      }
      return merged;
    },

  },

};


export default EX;
