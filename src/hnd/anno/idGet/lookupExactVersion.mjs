// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';

import categorizeTargets from '../categorizeTargets.mjs';
import httpErrors from '../../../httpErrors.mjs';
import parseDatePropOrFubar from '../../util/parseDatePropOrFubar.mjs';
import parseStampRows from '../parseStampRows.mjs';

import queryTpl from './queryTpl.mjs';


const {
  fubar,
  gone,
  noSuchAnno,
} = httpErrors.throwable;


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
  parseStampRows.into(annoDetails, stampRows);

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
  // console.debug('idGet:', { subjTgtUrlsForAclCheckRead, aclMetaSpy });

  if (versionNotFound) {
    /* At this point, permission to disclose non-existence stems from
       the permission to read the entire annotation. */
    throw noSuchAnno();
  }

  if (aclMetaSpy.approvalRequired) {
    const val = annoDetails['dc:dateAccepted'];
    const ts = (val && (new Date(val)).getTime()) || 0;
    const active = (ts && (ts <= nowTs));
    // console.debug({ val, ts, nowTs, active });
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
