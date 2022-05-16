// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';

import httpErrors from '../../httpErrors.mjs';
import sendFinalTextResponse from '../../finalTextResponse.mjs';
import parseVersId from './parseVersionIdentifier.mjs';

const namedEqual = equal.named.deepStrictEqual;

const errNotInDb = httpErrors.noSuchAnno.explain('ID not in database');


const queryTpl = `
  "details" FROM "anno_data"
  WHERE "base_id" = $1
    AND "version_num" = $2
  LIMIT 2;
`.trim();


async function idGet(srv, req, versId) {
  const idParts = parseVersId(versId);
  const reply = await srv.db.postgresSelect(queryTpl,
    [idParts.baseId, idParts.versNum]);
  const { rows } = reply;
  const nRows = rows.length;
  if (!nRows) { throw errNotInDb.throwable(); }
  namedEqual('Number of rows found for anno version ID ' + versId, nRows, 1);
  return sendFinalTextResponse.json(req, rows[0].details, { type: 'annoLD' });
}


export default idGet;
