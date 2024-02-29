// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';

import getOwn from 'getown';
import mapKeys from 'lodash.mapkeys';
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
    let cfg = await oppoRead.readConfigFileIfExists(fullPath);
    if (!cfg) { return; } // probably broken symlink => treat as non-existing
    mustBe.dictObj('Config data in file ' + fullPath, cfg);
    cfg = mapKeys(cfg, (v, k) => k.replace(/\^/g, bfn));
    return cfg;
  });

  let allConfig = (await Promise.all([
    singleFilePr,
    ...dirConfigPrs,
  ])).filter(Boolean);
  try {
    allConfig = mergeOpt({}, ...allConfig);
  } catch (mergeErr) {
    mergeErr.configTopic = topic;
    throw mergeErr;
  }
  if (!Object.keys(allConfig).length) {
    const msg = ('Found no config settings AT ALL for topic '
      + JSON.stringify(topic)
      + '. Please double-check your config directory path '
      + JSON.stringify(basePath));
    throw new Error(msg);
  }
  return allConfig;
};



export default EX;
