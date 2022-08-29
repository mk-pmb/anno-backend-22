// -*- coding: utf-8, tab-width: 2 -*-

import guessAndParseSubjectTargetUrl
  from 'webanno-guess-subject-target-url-pmb/extra/parse.mjs';

import httpErrors from '../../httpErrors.mjs';
import sendFinalTextResponse from '../../finalTextResponse.mjs';

import parseVersId from './parseVersionIdentifier.mjs';
import ubhdAnnoIdFmt from './ubhdAnnoIdFmt.mjs';

const errNotInDb = httpErrors.noSuchAnno.explain('ID not in database');

const versionSep = ubhdAnnoIdFmt.versionNumberSeparator;

const queryTpl = {
  annoDetails: ('"details"'
    + ' FROM "anno_data" WHERE "base_id" = $1'
    + ' AND "version_num" = $2 LIMIT 2'
  ),
  latestVersion: (
    'MAX("version_num") AS "latest"'
    + ' FROM "anno_data" WHERE "base_id" = $1'
  ),
};


async function getExactVersion(srv, req, idParts) {
  const { baseId, versNum } = idParts;

  const { details } = (await srv.db.postgresSelect(queryTpl.annoDetails,
    [baseId, versNum])).expectSingleRow();
  if (details === 0) { throw errNotInDb.throwable(); }

  const subjTgt = guessAndParseSubjectTargetUrl(details);
  // ^-- Using parse because it includes safety checks.
  await srv.acl.requirePerm(req, {
    targetUrl: subjTgt.url,
    privilegeName: 'read',
  });
  return sendFinalTextResponse.json(req, details, { type: 'annoLD' });
}


async function redirToLatestVersion(srv, req, idParts) {
  const { baseId } = idParts;
  // :ATTN:ACL: Currently no ACL checks for this lookup.
  const { latest } = (await srv.db.postgresSelect(queryTpl.latestVersion,
    [baseId])).expectSingleRow();
  if (!latest) { throw errNotInDb.throwable(); }
  return req.res.redirect(baseId + versionSep + latest);
}


function idGet(srv, req, versId) {
  const idParts = parseVersId(versId);
  if (idParts.versNum) { return getExactVersion(srv, req, idParts); }
  return redirToLatestVersion(srv, req, idParts);
}


export default idGet;
