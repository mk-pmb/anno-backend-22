// -*- coding: utf-8, tab-width: 2 -*-

import guessAndParseSubjectTargetUrl
  from 'webanno-guess-subject-target-url-pmb/extra/parse.mjs';
import makeDictList from 'dictlist-util-pmb';

import clientPrefersHtml from '../util/guessClientPrefersHtml.mjs';
import httpErrors from '../../httpErrors.mjs';
import sendFinalTextResponse from '../../finalTextResponse.mjs';

import fmtAnnoCollection from './fmtAnnosAsSinglePageCollection.mjs';
import genericAnnoMeta from './redundantGenericAnnoMeta.mjs';
import ubhdAnnoIdFmt from './ubhdAnnoIdFmt.mjs';
import parseVersId from './parseVersionIdentifier.mjs';

const {
  noSuchAnno,
  noSuchResource,
} = httpErrors.throwable;

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
  allVersions: ('"version_num", "time_created"'
    + ' FROM "anno_data" WHERE "base_id" = $1'
  ),
};


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
      throw noSuchAnno();
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
    throw noSuchAnno();
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
  const fullAnno = genericAnnoMeta.add(srv, idParts, annoDetails);
  return sendFinalTextResponse.json(req, fullAnno, ftrOpt);
}


async function retrieveLatestVersion(srv, req, idParts) {
  const { baseId } = idParts;
  const { latest } = (await srv.db.postgresSelect(queryTpl.latestVersion,
    [baseId])).expectSingleRow();
  if (!latest) { throw noSuchAnno(); }
  return latest;
}


async function redirToLatestVersion(srv, req, idParts) {
  // :ATTN:ACL: Currently no ACL checks for this lookup.
  const latest = await retrieveLatestVersion(srv, req, idParts);
  return req.res.redirect(idParts.baseId + versionSep + latest);
}


async function listVersions(srv, req, idParts) {
  // Example for an annotation with many versions:
  // https://anno.ub.uni-heidelberg.de/anno/anno/JhTAtRbrSOib9OJERGptUg
  const latestPubUrl = genericAnnoMeta.constructLatestPubUrl(srv, idParts);
  await retrieveLatestVersion(srv, req, idParts);
  // :TODO: Consider ACL permissions
  const { baseId } = idParts;
  const allVers = await srv.db.postgresSelect(queryTpl.allVersions,
    [baseId]);
  const previews = allVers.map(rec => ({
    id: latestPubUrl + versionSep + rec.version_num,
    created: rec.time_created.toISOString(),
  }));
  fmtAnnoCollection.replyToRequest(srv, req, { annos: previews });
}


function idGet(srv, req, versId, subRoute) {
  const idParts = parseVersId(versId);
  if (idParts.versNum) {
    if (subRoute) { return noSuchResource(req); }
    return getExactVersion(srv, req, idParts);
  }
  if (!subRoute) { return redirToLatestVersion(srv, req, idParts); }
  if (subRoute === 'versions') { return listVersions(srv, req, idParts); }
  return noSuchResource(req);
}


export default idGet;
