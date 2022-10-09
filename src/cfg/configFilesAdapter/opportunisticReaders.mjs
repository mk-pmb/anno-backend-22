// -*- coding: utf-8, tab-width: 2 -*-

import fsPromises from 'fs/promises';

import mustBe from 'typechecks-pmb/must-be';
import readDataFile from 'read-data-file';


async function ignoreENoEnt(pr) {
  try {
    return await pr;
  } catch (err) {
    if (err.code === 'ENOENT') { return undefined; }
    throw err;
  }
}


const EX = {

  async readConfigFileIfExists(path) {
    const cfg = await ignoreENoEnt(readDataFile(path));
    if (cfg === undefined) { return; } // File not found
    mustBe.obj('Config data read from ' + path, cfg);
    return cfg;
  },


  async scanConfigDirIfExists(path) {
    return ignoreENoEnt(fsPromises.readdir(path));
  },


};


export default EX;
