// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';
import fsPromises from 'fs/promises';

import absDir from 'absdir';
import crObAss from 'create-object-and-assign';
import getOwn from 'getown';
import makeExtendedOrderedMap from 'ordered-map-extended-pmb';
import mergeOpt from 'merge-options';
import mustBe from 'typechecks-pmb/must-be';
import objPop from 'objpop';
import readDataFile from 'read-data-file';


const pathInRepo = absDir(import.meta, '../..');
const cfgFileSuffix = '.yaml';
const firstCharStrictlyAlnumRgx = /^[0-9a-zA-Z]/;


async function ignoreENoEnt(pr) {
  try {
    return await pr;
  } catch (err) {
    if (err.code === 'ENOENT') { return undefined; }
    throw err;
  }
}



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


  async readConfigFileIfExists(path) {
    const cfg = await ignoreENoEnt(readDataFile(path));
    if (cfg === undefined) { return; } // File not found
    mustBe.obj('Config data read from ' + path, cfg);
    return cfg;
  },


  api: {

    isPluggableConfigFilename(n) {
      return !!(n
        && n.endsWith(cfgFileSuffix)
        && firstCharStrictlyAlnumRgx.test(n)
      );
    },


    async readAsDict(topic) {
      mustBe.nest('Config topic', topic);
      const ad = this;
      const descr = ('config for topic ' + topic);
      let basePath = (getOwn(ad, topic) || topic);
      mustBe.nest('Path to ' + descr, basePath);
      if (!pathLib.isAbsolute(basePath)) {
        basePath = pathLib.join(ad.cfgDir, basePath);
      }

      const singlePr = EX.readConfigFileIfExists(basePath + cfgFileSuffix);
      const dirFiles = await ignoreENoEnt(fsPromises.readdir(basePath));
      const dirCfgFiles = (dirFiles
        || []).filter(EX.api.isPluggableConfigFilename).sort();
      const dirConfigPrs = dirCfgFiles.map(async function oneCfgFile(name) {
        const bfn = name.slice(0, -cfgFileSuffix.length);
        const fullPath = pathLib.join(basePath, name);
        const cfg = await EX.readConfigFileIfExists(fullPath);
        if (cfg['^'] !== undefined) {
          cfg[bfn] = cfg['^'];
          delete cfg['^']; // Please don't use `^.yaml` as your filename.
        }
        return cfg;
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
