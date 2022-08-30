// -*- coding: utf-8, tab-width: 2 -*-

import guessAndParseSubjectTargetUrl
  from 'webanno-guess-subject-target-url-pmb/extra/parse.mjs';
import makeDictList from 'dictlist-util-pmb';

import httpErrors from '../../httpErrors.mjs';
import sendFinalTextResponse from '../../finalTextResponse.mjs';

import redundantGenericAnnoMeta from './redundantGenericAnnoMeta.mjs';
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


function clientPrefersHtml(req) {
  const acceptedMediaTypes = req.header('accept');
  // Ideally we'd check the order with respect to priorities assigned.
  // However, in practice, for all usual browsers, this simple prefix
  // check is enough:
  return String(acceptedMediaTypes || '').startsWith('text/html,');
}


async function getExactVersion(srv, req, idParts) {
  const { baseId, versNum, versId } = idParts;
  const targetLookupDeniedReason = await srv.acl.whyDeny(req,
    { privilegeName: 'lookupAnnoTargets', versId });
  const targetLookupAllowed = !targetLookupDeniedReason;

  const detailsReply = (await srv.db.postgresSelect(queryTpl.annoDetails,
    [baseId, versNum])).expectSingleRow();
  const versionNotFound = (detailsReply === 0);
  const annoDetails = detailsReply.details;
  let subjTgtUrlForAclCheckRead = 'about:unknowntarget';
  if (targetLookupAllowed) {
    if (versionNotFound) {
      // At this point, permission to disclose non-existence stems from the
      // permission to lookup the target.
      throw errNotInDb.throwable();
    }
    subjTgtUrlForAclCheckRead = guessAndParseSubjectTargetUrl(annoDetails).url;
    // ^-- Using parse because it includes safety checks.
  }

  await srv.acl.requirePerm(req, {
    privilegeName: 'read',
    targetUrl: subjTgtUrlForAclCheckRead,
  });

  if (versionNotFound) {
    // At this point, permission to disclose non-existence stems from the
    // permission to read the entire annotation.
    throw errNotInDb.throwable();
  }

  const ftrOpt = { type: 'annoLD' };
  if (clientPrefersHtml(req)) {
    const [scope1] = makeDictList(annoDetails.target).getEachOwnProp('scope');
    if (scope1) {
      ftrOpt.redirTo = scope1;
      /*
        We do not use req.res.redirect() because it would send a generic
        HTML body with a fallback link to the redirect URL, whereas the
        FTR redirTo allows us to still send the annotation data.
        This way, annotations are still easy to debug in browsers that
        support manual approval of redirects.
      */
    }
  }
  const fullAnno = redundantGenericAnnoMeta.add(srv, idParts, annoDetails);
  return sendFinalTextResponse.json(req, fullAnno, ftrOpt);
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
