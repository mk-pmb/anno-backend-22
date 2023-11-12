// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';
import pgDumpWriter from 'postgres-dump-writer-helpers-220524-pmb';

const { quoteId } = pgDumpWriter;

function callIfTruthy(f, ...a) { return f && f(...a); }


async function postgresInsertOneRecord(table, rec, origOpt) {
  const safeOpt = { ...origOpt };

  const keys = Object.keys(rec);
  const nKeys = keys.length;
  if (nKeys < 1) {
    throw new Error('Empty record for insert into table ' + table);
  }
  const slots = [];
  function slotify(x) { return '$' + slots.push(x); }
  const query = ('INSERT INTO ' + quoteId(table) + ' ('
    + keys.map(quoteId).join(', ') + ') VALUES ('
    + Object.values(rec).map(slotify).join(', ') + ');');
  // console.debug('pg insert: ', query);

  const pool = this.getPool();
  try {
    const resp = await pool.query(query, slots);
    mustBe.tProp('Postgres insert reply ', resp, 'eeq:1', 'rowCount');
    return resp;
  } catch (origErr) {
    const codeStr = String(origErr.code);
    /* ^-- 2022-10-10:
      The code is a string already. We need a guaranteed type for proper
      comparison. However, conversion to number might be lossy (leading
      zeroes, non-number codes, …) so instead we go the safe route.
    */

    if (codeStr === '23505') {
      const dupe = callIfTruthy(safeOpt.customDupeError, origErr);
      if (dupe === 'ignore') { return false; }
      if (dupe) { throw dupe; }
    }

    throw origErr;
  }
}


export default {
  api: {
    postgresInsertOneRecord,
  },
};
