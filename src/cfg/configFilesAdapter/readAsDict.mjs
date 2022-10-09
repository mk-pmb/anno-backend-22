// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';

import getOwn from 'getown';
import mergeOpt from 'merge-options';
import mustBe from 'typechecks-pmb/must-be';

import coreApi from './coreApi.mjs';
import oppoRead from './opportunisticReaders.mjs';


const suf = mustBe.nest('suffix', coreApi.cfgFileSuffix);
const cutSuf = -suf.length;


const EX = async function readAsDict(topic) {
  mustBe.nest('Config topic', topic);
  const ad = this;
  const descr = ('config for topic ' + topic);
  let basePath = (getOwn(ad, topic) || topic);
  mustBe.nest('Path to ' + descr, basePath);
  if (!pathLib.isAbsolute(basePath)) {
    basePath = pathLib.join(ad.cfgDir, basePath);
  }

  const singleFilePr = oppoRead.readConfigFileIfExists(basePath + suf);
  const dirFiles = await oppoRead.scanConfigDirIfExists(basePath);
  const dirCfgFiles = (dirFiles
    || []).filter(coreApi.isPluggableConfigFilename).sort();
  const dirConfigPrs = dirCfgFiles.map(async function oneCfgFile(name) {
    const bfn = name.slice(0, cutSuf);
    const fullPath = pathLib.join(basePath, name);
    const cfg = await oppoRead.readConfigFileIfExists(fullPath);
    if (cfg['^'] !== undefined) {
      cfg[bfn] = cfg['^'];
      delete cfg['^']; // Please don't use `^.yaml` as your filename.
    }
    return cfg;
  });

  const readableConfigs = (await Promise.all([
    singleFilePr,
    ...dirConfigPrs,
  ])).filter(Boolean);
  const merged = mergeOpt({}, ...readableConfigs);
  if (!Object.keys(merged).length) {
    throw new Error('Found no config settings AT ALL for topic ' + topic);
  }
  return merged;
};



export default EX;
