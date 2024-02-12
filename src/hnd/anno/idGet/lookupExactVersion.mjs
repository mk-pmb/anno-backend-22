// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';

import categorizeTargets from '../categorizeTargets.mjs';
import detectUserIdentity from '../../../acl/detectUserIdentity.mjs';
import httpErrors from '../../../httpErrors.mjs';
import miscMetaFieldInfos from '../miscMetaFieldInfos.mjs';
import parseDatePropOrFubar from '../../util/parseDatePropOrFubar.mjs';
import parseStampRows from '../parseStampRows.mjs';

import queryTpl from './queryTpl.mjs';


const {
  fubar,
  gone,
  noSuchAnno,
  noSuchResource,
} = httpErrors.throwable;


const approverPrivilegeName = 'stamp_any_add_dc_dateAccepted';


function orf(x) { return x || false; }


const EX = async function lookupExactVersion(ctx) {
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

    subjTgtUrlsForAclCheckRead = categorizeTargets(srv, annoDetails,
      { errInvalidAnno: fubar }).subjTgtUrls;
  }

  const stampRows = (await srv.db.postgresSelect(queryTpl.annoStamps,
    [baseId, versNum]));
  const lowlineStamps = {};
  parseStampRows.into(annoDetails, stampRows, { lowlineStamps });

  const latestPubUrlRelative = baseId;
  const defaultErrorHeaders = {
    Link: [
      // Version control header examples: RFC 5829 page 11
      '<' + latestPubUrlRelative + '>; rel=latest-version',
      '<' + latestPubUrlRelative + '/versions>; rel=version-history',
    ],
  };

  const nowTs = Date.now();
  const sunset = parseDatePropOrFubar(annoDetails, 'as:deleted');
  /* Sunset header for non-error is the responsibility of whatever function
     uses our lookup result. The lookup function itself should not interact
     with the response, because it's meant be usable also for internal
     lookups whose results are not meant to be sent. */
  if (sunset && (sunset.ts <= nowTs)) {
    const iso = sunset.jsDate.toISOString();
    const gmt = sunset.jsDate.toGMTString();
    const err = gone('Annotation was unpublished, effective ' + iso);
    err.headers = { ...defaultErrorHeaders, Sunset: gmt };
    throw err;
  }

  async function requireAdditionalReadPrivilege(privilegeName, opt) {
    await srv.acl.requirePermForAllTargetUrls(req,
      subjTgtUrlsForAclCheckRead, { privilegeName, ...opt });
  }

  const topExtraFields = {};

  const aclReadOpt = {};
  if (req.asRoleName) {
    const apre = {}; // ACL preview container
    aclReadOpt.aclMetaSpy = { aclPreviewBySubjectTargetUrl: apre };
    topExtraFields[miscMetaFieldInfos.subjTgtAclField] = apre;
  }
  await requireAdditionalReadPrivilege('read', aclReadOpt);

  if (versionNotFound) {
    /* At this point, permission to disclose non-existence stems from
       the permission to read the entire annotation. */
    throw noSuchAnno();
  }

  // For consistency (and thus, less nasty surprises) we always verify
  // claimed roles, even for public annos.
  let clientMustCopeWithLowlineStamps = false;
  const allowReadUnapproved = await (async function decide() {
    const { asRoleName } = req;
    if (!asRoleName) { return false; }
    if (asRoleName === 'approver') {
      clientMustCopeWithLowlineStamps = true;
      await requireAdditionalReadPrivilege(approverPrivilegeName);
      return true;
    }
    if (asRoleName === 'author') {
      clientMustCopeWithLowlineStamps = true;
      const webUser = (await detectUserIdentity(req)).userId;
      const annoSubmitter = detailsReply.author_local_userid;
      // console.debug('allowReadUnapproved:', { webUser, annoSubmitter });
      return (webUser && (webUser === annoSubmitter));
    }
    throw noSuchResource('Unsupported role name in URL.');
  }());

  if (lowlineStamps[miscMetaFieldInfos.unapprovedStampName]) {
    if (allowReadUnapproved) {
      annoDetails['dc:dateAccepted'] = false;
    } else {
      const err = noSuchAnno('Annotation requires approval');
      /* NB: "Lacking" approval is different from "pending" approval.
        The error message "Annotation is pending approval" would imply a
        future plan for a decision to be made, which may or may not be
        stipulated in site policy. In order to keep this implementation
        independent of site policy, we just stick to the actual facts
        without any prediction. */
      err.reasonCode = 'approvalRequired';
      err.headers = defaultErrorHeaders;
      throw err;
    }
    delete lowlineStamps[miscMetaFieldInfos.unapprovedStampName];
  }

  Object.assign(annoDetails, topExtraFields,
    clientMustCopeWithLowlineStamps && lowlineStamps,
  );

  const lookup = {
    defaultErrorHeaders,
    annoDetails,
    requireAdditionalReadPrivilege,
    subjTgtUrlsForAclCheckRead,
    targetLookupAllowed,
    ...EX.lookupResultApi,
  };
  return lookup;
};


Object.assign(EX, {

  lookupResultApi: {

    primarySubjectTargetUrl() {
      return orf(this.subjTgtUrlsForAclCheckRead)[0] || '';
    },

    primarySubjectUrlMeta(req) {
      const cache = orf(req).aclMetaCache;
      if (!cache) { throw new Error('No cache on req'); }
      const url = this.primarySubjectTargetUrl();
      return orf(url && getOwn(cache, 'tgtUrl:' + url));
    },

  },

});



export default EX;
