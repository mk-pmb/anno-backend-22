// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import objPop from 'objpop';
import pMap from 'p-map';

import categorizeTargets from '../categorizeTargets.mjs';
import detectUserIdentity from '../../../acl/detectUserIdentity.mjs';
import fmtAnnosAsRssFeed from '../fmtAnnosAsRssFeed.mjs';
import genericAnnoMeta from '../redundantGenericAnnoMeta.mjs';
import httpErrors from '../../../httpErrors.mjs';
import miscMetaFieldInfos from '../miscMetaFieldInfos.mjs';
import parseStampRows from '../parseStampRows.mjs';
import stampUtil from '../util/stampUtil.mjs';

import buildSearchQuery from './buildSearchQuery.mjs';
import qryTpl from './queryTemplates/index.mjs';

const {
  fubar,
  noSuchResource,
} = httpErrors.throwable;



const EX = async function multiSearch(ctx) {
  const { srv, req } = ctx;
  const {
    latestOnly,
    overrideSearchTmpl,
    searchAllWithStamp,
    searchBaseId,
    skipAcl,
    subjTgtSpec,
    untrustedOpt,
  } = ctx;

  const popUntrustedOpt = objPop(untrustedOpt, {
    leftoversErrCls: noSuchResource,
    leftoversMsg: 'Unsupported criterion qualifier',
  });

  await (skipAcl || srv.acl.requirePerm(req, {
    privilegeName: 'discover',
    targetUrl: subjTgtSpec,
  }));

  const meta = {
    outFmt: ctx.outFmt || '',
  };

  const search = buildSearchQuery.prepare('#defaultSearchCore');
  if (searchBaseId) { search.data({ searchBaseId }); }

  EX.processRssOptionsInplace({ ctx, search, meta, popUntrustedOpt });

  if (searchAllWithStamp) {
    const st = stampUtil.splitStampNameNS(searchAllWithStamp, noSuchResource);
    await (skipAcl || srv.acl.requirePerm(req, {
      privilegeName: 'search_hasStamp_' + st.aclStampName,
      targetUrl: subjTgtSpec,
    }));
    search.tmpl('inquiryType', '#inquiryAllWithStamp');
    search.data('searchStampName', st.stType);
  }

  if (subjTgtSpec) {
    const byPrefix = subjTgtSpec.endsWith('/*') && subjTgtSpec.slice(0, -1);
    const cmp = (byPrefix ? 'Prefix' : 'Exact');
    search.tmpl('inquiryType', qryTpl.inquiryLink('subject', cmp));
    search.data('byLinkUrl', byPrefix || subjTgtSpec);
  }

  const delayedPrivilegeChecks = new Set();

  function addRequiredPrivilege(privilegeName) {
    if (skipAcl) { return; }
    if (!subjTgtSpec) { return delayedPrivilegeChecks.add(privilegeName); }
    return srv.acl.requirePerm(req, { privilegeName, targetUrl: subjTgtSpec });
  }

  const stampParserOpts = {};

  const { asRoleName } = req;
  let validRole = !asRoleName;

  if (asRoleName === 'approver') {
    validRole = true;
    await addRequiredPrivilege('stamp_any_add_dc_dateAccepted');
    search.tmpl('visibilityWhere', '#visibilityAny');
  }

  if (asRoleName === 'author') {
    validRole = true;
    const { userId } = await detectUserIdentity.andDetails(req);
    search.tmpl('visibilityWhere', '#visibilityAuthorMode');
    search.data('rqUserId', userId);
    stampParserOpts.lowlineStamps = {};
  }

  if (!validRole) { throw noSuchResource('Unsupported role name'); }

  if (latestOnly) { search.wrapSeed('latestOnly'); }
  search.wrapSeed('orderedSearch');
  search.tmplIf(ctx.rowsLimit, 'orderedSearchLimit');

  const contentMode = getOwn(EX.contentModeDetails, ctx.readContent, false);
  if (contentMode.priv) {
    // Always delay:
    //  * To validate read (or similar) on all targets,
    //  * For ACL preview.
    delayedPrivilegeChecks.add(contentMode.priv);
    if (asRoleName) {
      // ^-- i.e., client can be expected to tolerate our custom fields.
      delayedPrivilegeChecks.aclPreviewPriv = contentMode.priv;
      const apre = {}; // ACL preview container
      meta.extraTopFields = { [miscMetaFieldInfos.subjTgtAclField]: apre };
      delayedPrivilegeChecks.aclPreviewBySubjectTargetUrl = apre;
    }
  }
  if (contentMode.wrap) { search.wrapSeed(contentMode.wrap); }
  if (!contentMode.hasSubjs) { search.wrapSeed('addSubjectTargetRelUrls'); }

  search.tmpl(overrideSearchTmpl);

  popUntrustedOpt.expectEmpty();

  // search.debug.dumpDataArgs = true;
  // search.debug.dumpSqlQuery = true;
  const found = await search.selectAll(srv);
  // console.debug('subjectTarget: found =', found, '</</ subjTgt found');

  await (skipAcl || EX.checkSubjTgtAcl(srv, req,
    delayedPrivilegeChecks, found));

  Object.assign(found, {

    meta,

    toFullAnnos() {
      const a = found.map(r => EX.resultToFullAnno(srv, stampParserOpts, r));
      a.meta = found.meta;
      return a;
    },

  });
  return found;
};



Object.assign(EX, {

  contentModeDetails: {
    full:         { priv: 'read', wrap: 'addFullContent', hasSubjs: true },
    justTitles:   { priv: 'read', wrap: 'addAnnoTitle' },
  },


  async checkSubjTgtAcl(srv, req, privNamesSet, found) {
    const privNames = Array.from(privNamesSet);
    if (!privNames.length) { return; }

    const allSubjTgtUrls = found.map(function findSubjectTargets(rec) {
      const subj = rec.subject_target_rel_urls;
      if (subj) { return subj; }
      if (!rec.details) {
        const msg = `No details for annotation with ID ${
          rec.base_id} v${rec.version_num} while checking privileges {${
          privNames.join(', ')}}`;
        throw new Error(msg);
      }
      return categorizeTargets(srv, rec.details,
        { errInvalidAnno: fubar }).subjTgtUrls;
    }).flat();
    if (!allSubjTgtUrls.length) { return; }

    const { aclPreviewPriv, aclPreviewBySubjectTargetUrl } = privNamesSet;
    await pMap(privNames, async function check(privilegeName) {
      const aclMetaSpy = ((privilegeName === aclPreviewPriv)
        && { aclPreviewBySubjectTargetUrl });
      await srv.acl.requirePermForAllTargetUrls(req,
        allSubjTgtUrls, // <-- No need to de-dupe, it will be done internally.
        { privilegeName, aclMetaSpy });
    });
  },


  resultToFullAnno(srv, stampParserOpts, rec) {
    const idParts = { baseId: rec.base_id, versNum: rec.version_num };
    const stamps = parseStampRows(rec.stamps, stampParserOpts);
    // console.debug('rec:', rec, 'stamps:', stampInfos);
    const fullAnno = {
      ...genericAnnoMeta.add(srv, idParts, {
        'dc:title': rec.title,
        created: rec.time_created,
        ...rec.details,
      }),
      ...stamps,
      ...stampParserOpts.lowlineStamps,
      // xDisclosed: rec.disclosed,
      // xSunny: rec.sunny,
    };
    delete fullAnno[miscMetaFieldInfos.unapprovedStampName];
    if (!rec.disclosed) { fullAnno['dc:dateAccepted'] = false; }
    return fullAnno;
  },


  processRssOptionsInplace(how) {
    const { ctx, search, meta, popUntrustedOpt } = how;
    let max = ctx.rssMaxItems;
    if (!max) {
      if (meta.outFmt === 'rss') {
        max = -1;
      } else {
        return; // RSS not allowed
      }
    }
    if (max === -1) { max = fmtAnnosAsRssFeed.defaultMaxItems; }

    EX.applyUserRssOptsInplace({ meta, popUntrustedOpt });
    if (meta.outFmt !== 'rss') { return; }

    ctx.readContent = 'justTitles';
    // ^- It would be nice if we could also populate the RSS <author> and
    //    <description> fields, but generating them is too much effort.

    search.tmpl('orderByTimeDirection', 'DESC');
    const limit = (+ctx.rowsLimit || 0);
    if ((!limit) || (limit > max)) { ctx.rowsLimit = max; }
  },


  applyUserRssOptsInplace(how) {
    const { meta, popUntrustedOpt } = how;
    const wantRss = popUntrustedOpt('rss');
    if (wantRss === undefined) { return; }

    meta.outFmt = 'rss';
    if (wantRss === true) { return; }

    if (wantRss === 'vh') {
      meta.rssMode = 'version-history';
      return;
    }

    throw noSuchResource('Unsupported RSS mode option(s).');
  },


});




export default EX;
