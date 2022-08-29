// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';

const namedEqual = equal.named.deepStrictEqual;


function maybeJoin(x, glue) { return x && (x.join ? x.join(glue) : x); }


const responseRowsApi = {

  expectSingleRow() {
    const rows = this;
    const nRows = rows.length;
    if (!nRows) { return 0; }
    namedEqual('Number of rows found', nRows, 1);
    return rows[0];
  },

};


function unpackRows(r) {
  return Object.assign([...r.rows], responseRowsApi,
    { getFullResponse() { return r; } });
}


async function postgresSelect(tpl, slots) {
  const pool = this.getPool();
  const resp = await pool.query('SELECT ' + maybeJoin(tpl, '\n'), slots);
  return unpackRows(resp);
}


export default {
  api: {
    postgresSelect,
  },
};
