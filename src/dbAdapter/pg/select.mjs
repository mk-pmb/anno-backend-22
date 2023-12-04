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
  const { rowCount } = r;
  return Object.assign([...r.rows], responseRowsApi, {
    getFullResponse() { return r; },
    rowCount,
  });
}


async function postgresQueryRows(tpl, slots) {
  const pool = this.getPool();
  const resp = await pool.query(maybeJoin(tpl, '\n'), slots);
  return unpackRows(resp);
}


function postgresSelect(tpl, slots) {
  let pre = 'SELECT ';
  if (/^\s*(with)\b/i.test(tpl)) { pre = ''; }
  return postgresQueryRows.call(this, pre + tpl, slots);
}


export default {
  api: {
    postgresQueryRows,
    postgresSelect,
  },
};
