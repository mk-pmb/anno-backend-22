// -*- coding: utf-8, tab-width: 2 -*-

import makeDictList from 'dictlist-util-pmb';

import clientPrefersHtml from '../util/guessClientPrefersHtml.mjs';
import httpErrors from '../../httpErrors.mjs';
import parseDatePropOrFubar from '../util/parseDatePropOrFubar.mjs';
import sendFinalTextResponse from '../../finalTextResponse.mjs';

import categorizeTargets from './categorizeTargets.mjs';
import fmtAnnoCollection from './fmtAnnosAsSinglePageCollection.mjs';
import genericAnnoMeta from './redundantGenericAnnoMeta.mjs';
import stampValueOrDate from './stampValueOrDate.mjs';
import ubhdAnnoIdFmt from './ubhdAnnoIdFmt.mjs';

const {
  gone,
  noSuchAnno,
  noSuchResource,
} = httpErrors.throwable;

const versionSep = ubhdAnnoIdFmt.versionNumberSeparator;

const queryTpl = {
  annoDetails: ('"details"'
    + ' FROM "anno_data" WHERE "base_id" = $1'
    + ' AND "version_num" = $2 LIMIT 2'
  ),
  annoStamps: ('*'
    + ' FROM "anno_stamps" WHERE "base_id" = $1'
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


async function lookupExactVersion(ctx) {
  const { srv, req, idParts } = ctx;
  const { baseId, versNum, versId } = idParts;
  const targetLookupDeniedReason = await srv.acl.whyDeny(req,
    { privilegeName: 'lookupAnnoTargets', versId });
  const targetLookupAllowed = !targetLookupDeniedReason;

  const detailsReply = (await srv.db.postgresSelect(queryTpl.annoDetails,
    [baseId, versNum])).expectSingleRow();
  const versionNotFound = (detailsReply === 0);
  const annoDetails = detailsReply.details;
  let subjTgtUrlsForAclCheckRead; // <- `undefined` is valid for acl.rPFATU
  if (targetLookupAllowed) {
    if (versionNotFound) {
      /* At this point, permission to disclose non-existence stems from
         the permission to lookup the target. */
      throw noSuchAnno();
    }

    subjTgtUrlsForAclCheckRead = categorizeTargets(srv,
      annoDetails).subjTgtUrls;
  }

  const stampsReply = (await srv.db.postgresSelect(queryTpl.annoStamps,
    [baseId, versNum]));
  stampsReply.forEach(function addStamp(row) {
    annoDetails[row.st_type] = stampValueOrDate(row);
  });

  const nowTs = Date.now();
  const sunset = parseDatePropOrFubar(annoDetails, 'as:deleted');
  /* Sunset header for non-error is the responsibility of whatever function
     uses our lookup result. The lookup function itself should not interact
     with the response, because it's meant be usable also for internal
     lookups whose results are not meant to be sent. */
  if (sunset && (sunset.ts <= nowTs)) {
    const err = gone('Annotation was unpublished, effective '
      + sunset.jsDate.toISOString());
    err.headers = { Sunset: sunset.jsDate.toGMTString() };
    throw err;
  }

  async function requireAdditionalReadPrivilege(privilegeName, opt) {
    await srv.acl.requirePermForAllTargetUrls(req,
      subjTgtUrlsForAclCheckRead, { privilegeName, ...opt });
  }
  const aclMetaSpy = {};
  await requireAdditionalReadPrivilege('read', { aclMetaSpy });

  if (versionNotFound) {
    /* At this point, permission to disclose non-existence stems from
       the permission to read the entire annotation. */
    throw noSuchAnno();
  }

  const apprStamp = aclMetaSpy.serviceApprovalStampType;
  if (apprStamp) {
    const val = annoDetails[apprStamp];
    const ts = (val && (new Date(val)).getTime()) || 0;
    const active = (ts && (ts <= nowTs));
    console.debug({ apprStamp, val, ts, nowTs, active });
    if (!active) {
      throw noSuchAnno('Annotation is not yet approved');
      /* NB: This is different from "Annotation is pending approval",
         because here we don't care whether approval has been requested. */
    }
  }

  const lookup = {
    annoDetails,
    requireAdditionalReadPrivilege,
    subjTgtUrlsForAclCheckRead,
    targetLookupAllowed,
  };
  return lookup;
}


async function serveExactVersion(ctx) {
  const { srv, req, idParts } = ctx;
  const { annoDetails } = await lookupExactVersion(ctx);

  const headers = {};
  const ftrOpt = { type: 'annoLD', headers };
  Object.entries(annoDetails).forEach(function sendIanaHeaders([k, v]) {
    if (!k.startsWith('iana:')) { return; }
    const h = k.slice(5).replace(/\b[a-z]/g, m => m.toUpperCase());
    headers[h] = v;
  });

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


async function lookupLatestVersionNum(ctx) {
  const { baseId } = ctx.idParts;
  const { latest } = (await ctx.srv.db.postgresSelect(queryTpl.latestVersion,
    [baseId])).expectSingleRow();
  if (!latest) { throw noSuchAnno(); }
  return latest;
}


async function redirToLatestVersion(ctx) {
  // :ATTN:ACL: Currently no ACL checks for this lookup.
  const latest = await lookupLatestVersionNum(ctx);
  return ctx.req.res.redirect(ctx.idParts.baseId + versionSep + latest);
}


async function listVersions(ctx) {
  const { srv, req, idParts } = ctx;
  /* Example for an annotation with many versions:
     https://anno.ub.uni-heidelberg.de/anno/anno/JhTAtRbrSOib9OJERGptUg */
  const latestPubUrl = genericAnnoMeta.constructLatestPubUrl(srv, idParts);
  await lookupLatestVersionNum(ctx);
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


const EX = function idGet(ctx) {
  const { subRoute } = ctx;
  if (ctx.idParts.versNum) {
    if (subRoute) { throw noSuchAnno(); }
    return serveExactVersion(ctx);
  }
  if (!subRoute) { return redirToLatestVersion(ctx); }
  if (subRoute === 'versions') { return listVersions(ctx); }
  throw noSuchResource();
};


Object.assign(EX, {

  lookupExactVersion,
  lookupLatestVersionNum,

});


export default EX;
