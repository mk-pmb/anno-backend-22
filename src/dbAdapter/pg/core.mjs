// -*- coding: utf-8, tab-width: 2 -*-

import crObAss from 'create-object-and-assign';
import errUtil from 'error-util-pmb';
import pgLib from 'pg';
import pgPool from 'postgres-pool-pmb';


import httpErrors from '../../httpErrors.mjs';


const {
  databaseUnavailable,
} = httpErrors.throwable;


const dfCfg = {
  pool: {
    ...pgPool.initPool.defaultConfig.defaultsDict,
    table_name_prefix: 'anno_',
  },
};


async function init(how) {
  const api = (this || false);
  if (api.init !== init) {
    throw new Error('.init() must be called on an API object that holds it!');
  }

  const popDbCfg = how.popCfg.sub('db').mustBe;
  const popPoolCfg = popDbCfg.sub('pool').mustBe;
  const pool = await pgPool.initPool({
    pgLib,
    poolCfg: { popDirectly: popPoolCfg.getDict() },
  });
  popDbCfg.expectEmpty();

  const db = crObAss(api, {
    getPool() { return pool; },
    async abandon() { await pool.end(); },
  });
  return db;
}


async function runOnePoolQuery(query, slots) {
  try {
    return await this.getPool().query(query, slots);
  } catch (err) {
    const msg = String(err.message || err);
    if (msg.startsWith('Connection terminated due to ')) {
      throw databaseUnavailable();
    }
    Object.assign(err, {
      via: errUtil.trace(),
      // query, // usually too verbose
      // slots, // might reveal secret data
    });
    throw err;
  }
}


const api = {
  getConfigDefaults() { return dfCfg; },
  init,
  runOnePoolQuery,
};

export default { api };
