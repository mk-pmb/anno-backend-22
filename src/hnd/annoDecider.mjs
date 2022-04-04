// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';

import httpErrors from '../httpErrors.mjs';
import sendFinalTextResponse from '../finalTextResponse.mjs';

import plumb from './util/miscPlumbing.mjs';


const namedEqual = equal.named.deepStrictEqual;

const baseIdRgx = /^[A-Za-z0-9_\-]{10,36}$/;


const EX = async function makeAnnoDecider(srv) {

  function annoHnd(req) {
    const urlSubDirs = plumb.getFirstAsteriskDirs(req);
    const { method } = req;
    if (method !== 'GET') { return httpErrors.badMethod(req); }

    console.debug('annoHnd:', urlSubDirs);
    if (urlSubDirs.length !== 1) { return httpErrors.noSuchResource(req); }
    const [baseId] = urlSubDirs;
    const idMatch = (baseIdRgx.exec(baseId) || false);
    if (idMatch[0] !== baseId) { return httpErrors.noSuchResource(req); }

    console.debug('annoHnd: srv.db:', srv.db);
    const reply = srv.db.postgresSelect('"details" FROM "anno_data"'
      + ' WHERE "base_id" = $1 LIMIT 2;', [baseId]);
    const { rows } = reply;
    const nRows = rows.length;
    if (!nRows) { return httpErrors.noSuchResource(req); }
    namedEqual('Number of rows found for anno base ID ' + baseId, nRows, 1);
    return sendFinalTextResponse.json(req, rows[0].details);
  }

  return annoHnd;
};


export default EX;
