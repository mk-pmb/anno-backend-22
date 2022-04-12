// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';

import httpErrors from '../httpErrors.mjs';
import sendFinalTextResponse from '../finalTextResponse.mjs';

import plumb from './util/miscPlumbing.mjs';


const namedEqual = equal.named.deepStrictEqual;

const baseIdRgx = /^[A-Za-z0-9_\-]{10,36}$/;

function noSuchAnno(req, why) {
  const text = 'Annotation not found: ' + why;
  sendFinalTextResponse(req, { code: 404, text });
}

const searchNotImpl = httpErrors.notImpl.explain(
  'Unsupported combination of search criteria.');


const EX = async function makeAnnoDecider(srv) {

  async function annoHnd(req) {
    const urlSubDirs = plumb.getFirstAsteriskDirs(req);
    const { method } = req;
    if (method !== 'GET') { return httpErrors.badVerb(req); }

    // console.debug('annoHnd: urlSubDirs =', urlSubDirs);
    if (urlSubDirs.length !== 1) {
      return noSuchAnno(req, 'Subresource not implemented');
    }
    const [baseId] = urlSubDirs;
    if (!baseId) {
      const queryKeys = Object.keys(req.query);
      if (queryKeys.length) {
        return searchNotImpl(req);
      }
      return noSuchAnno(req, 'No ID given');
    }

    const idMatch = (baseIdRgx.exec(baseId) || false);
    if (idMatch[0] !== baseId) {
      return noSuchAnno(req, 'Unsupported ID format');
    }

    const reply = await srv.db.postgresSelect('"details" FROM "anno_data"'
      + ' WHERE "base_id" = $1 LIMIT 2;', [baseId]);
    const { rows } = reply;
    const nRows = rows.length;
    if (!nRows) { return noSuchAnno(req, 'ID not in database'); }
    namedEqual('Number of rows found for anno base ID ' + baseId, nRows, 1);
    return sendFinalTextResponse.json(req, rows[0].details);
  }

  return annoHnd;
};


export default EX;
