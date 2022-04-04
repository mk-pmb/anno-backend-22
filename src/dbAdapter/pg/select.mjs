// -*- coding: utf-8, tab-width: 2 -*-

async function postgresSelect(tpl, slots) {
  const pool = this.getPool();
  const resp = await pool.query('SELECT ' + tpl, slots);
  return resp;
}


export default { api: { postgresSelect } };
