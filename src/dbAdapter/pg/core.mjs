// -*- coding: utf-8, tab-width: 2 -*-

import crObAss from 'create-object-and-assign';
import pgLib from 'pg';
import pgPool from 'postgres-pool-pmb';


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


const api = {
  init,
  getConfigDefaults() { return dfCfg; },
};

export default { api };
