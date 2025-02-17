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
import stopwatchUtil from '../../util/stopwatchUtil.mjs';

import buildSearchQuery from './buildSearchQuery.mjs';
import qryTpl from './queryTemplates/index.mjs';

const {
  fubar,
  noSuchResource,
} = httpErrors.throwable;



function uts2iso(u) { return (new Date((+u || 0) * 1e3)).toISOString(); }


const EX = async function multiSearch(ctx) {
  const stopwatch = { ZERO: Date.now() };
  const { srv, req } = ctx;
  const {
    latestVersionOnly,
    overrideSearchTmpl,
    reviverOpts: customReviverOpts,
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
  stopwatch.earlyAcl = Date.now();

  const meta = {
    outFmt: ctx.outFmt || popUntrustedOpt('fmt') || '',
    subjTgtSpec: subjTgtSpec || '',
  };


  EX.miscUntrustedMetaOptNames.forEach(function maybeCopy(k) {
    const v = popUntrustedOpt(k);
    if (v !== undefined) { meta[k] = v; }
  });

  const search = buildSearchQuery.prepare('#defaultSearchCore');
  if (searchBaseId) { search.data({ searchBaseId }); }

  (function parseOptions() {
    const optCtx = { ctx, search, meta, popUntrustedOpt };
    EX.processRssOptionsInplace(optCtx);
  }());

  if (searchAllWithStamp) {
    const st = stampUtil.splitStampNameNS(searchAllWithStamp, noSuchResource);
    await (skipAcl || srv.acl.requirePerm(req, {
      privilegeName: 'search_hasStamp_' + st.aclStampName,
      targetUrl: subjTgtSpec,
    }));
    stopwatch.stampAcl = Date.now();
    search.tmpl('inquiryType', '#inquiryAllWithStamp');
    search.data('searchStampName', st.stType);
  }

  const delayedPrivilegeChecks = new Set();
  const additionalTargetUrls = [];

  if (subjTgtSpec) {
    const byPrefix = subjTgtSpec.endsWith('/*') && subjTgtSpec.slice(0, -1);
    const cmp = (byPrefix ? 'Prefix' : 'Exact');
    search.tmpl('inquiryType', qryTpl.inquiryLink('subject', cmp));
    search.data('byLinkUrl', byPrefix || subjTgtSpec);
  }

  function addRequiredPrivilege(privilegeName) {
    if (skipAcl) { return; }
    if (!subjTgtSpec) { return delayedPrivilegeChecks.add(privilegeName); }
    return srv.acl.requirePerm(req, { privilegeName, targetUrl: subjTgtSpec });
  }

  const annoReviverOpts = { ...customReviverOpts };

  const { asRoleName } = req;
  let validRole = !asRoleName;

  if (asRoleName === 'approver') {
    validRole = true;
    await addRequiredPrivilege('stamp_any_add_dc_dateAccepted');
    search.tmpl('visibilityWhere', '#visibilityAny');
  }

  let userId = null;
  if (asRoleName === 'author') {
    validRole = true;
    userId = ((await detectUserIdentity.andDetails(req)).userId || '');
    search.tmpl('visibilityWhere', '#visibilityAuthorMode');
    search.data('rqUserId', userId);
    annoReviverOpts.lowlineStamps = {};
  }

  if (!validRole) { throw noSuchResource('Unsupported role name'); }

  if (latestVersionOnly) { search.wrapSeed('latestVersionOnly'); }
  search.wrapSeed('orderedSearch');
  search.tmplIf(ctx.rowsLimit, 'orderedSearchLimit');

  search.tmpl('orderByTimeDirection', (function decide() {
    if (popUntrustedOpt('oldestFirst')) { return 'ASC'; }
    if (ctx.rowsLimit) { return 'DESC'; }
    return 'ASC';
  }()));

  const contentMode = EX.decideContentMode({ ctx, meta, popUntrustedOpt });
  if (contentMode.priv) {
    // Always delay:
    //  * To validate read (or similar) on all targets,
    //  * For ACL preview.
    delayedPrivilegeChecks.add(contentMode.priv);
    additionalTargetUrls.push(subjTgtSpec);
    if (asRoleName) {
      // ^-- i.e., client can be expected to tolerate our custom fields.
      delayedPrivilegeChecks.aclPreviewPriv = contentMode.priv;
      const apre = {}; // ACL preview container
      apre[''] = { userId };
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
  stopwatch.prep = Date.now();
  const found = await search.selectAll(srv);
  stopwatch.db = Date.now();
  // console.debug('subjectTarget: found =', found, '</</ subjTgt found');

  await (skipAcl || EX.checkSubjTgtAcl(srv, req,
    delayedPrivilegeChecks, found, additionalTargetUrls));
  stopwatch.lateAcl = Date.now();

  Object.assign(found, {

    meta,

    toFullAnnos() {
      const a = found.map(r => EX.resultToFullAnno(srv, annoReviverOpts, r));
      a.meta = found.meta;
      return a;
    },

  });

  stopwatch.packaged = Date.now();
  meta.stopwatchDurations = stopwatchUtil.durations(stopwatch);
  meta.stopwatchDurations += ', nResult=' + found.length;
  return found;
};



Object.assign(EX, {

  contentModeDetails: {
    full:         { priv: 'read', wrap: 'addFullContent', hasSubjs: true },
    justTitles:   { priv: 'read', wrap: 'addAnnoTitle' },
  },


  decideContentMode(how) {
    const { ctx, popUntrustedOpt } = how;
    let cm = ctx.readContent;
    if (cm === undefined) {
      cm = popUntrustedOpt.firstDefinedKey(EX.requestedContentModePriority);
      cm = cm.key;
    }
    if (!cm) { return false; }
    cm = getOwn(EX.contentModeDetails, cm, false);
    return cm;
  },


  async checkSubjTgtAcl(srv, req, privNamesSet, found, additionalTargetUrls) {
    const privNames = Array.from(privNamesSet);
    if (!privNames.length) { return; }

    const foundSubjTgtUrls = found.map(function findSubjectTargets(rec) {
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
    const allSubjTgtUrls = [
      ...foundSubjTgtUrls,
      ...additionalTargetUrls,
    ].filter(Boolean);
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


  resultToFullAnno(srv, opts, rec) {
    const idParts = { baseId: rec.base_id, versNum: rec.version_num };
    const { lowlineStamps } = opts;
    const stamps = parseStampRows(rec.stamps, { lowlineStamps });
    // console.debug('rec:', rec, 'stamps:', stampInfos);
    let fullAnno = {
      'dc:title': rec.title,
      created: rec.time_created.toISOString(),
      ...rec.details,
    };
    if (!opts.omitGenericMeta) {
      fullAnno = genericAnnoMeta.add(srv, idParts, fullAnno);
    }
    Object.assign(fullAnno, {
      ...stamps,
      ...lowlineStamps,
      // xDisclosed: rec.disclosed,
      // xSunny: rec.sunny,
    });
    delete fullAnno[miscMetaFieldInfos.unapprovedStampName];
    if (!rec.disclosed) { fullAnno['dc:dateAccepted'] = false; }
    if (!rec.sunny) { fullAnno['as:deleted'] = uts2iso(rec.sunset_uts); }
    return fullAnno;
  },


  processRssOptionsInplace(how) {
    const { ctx, meta, popUntrustedOpt } = how;
    let max = ctx.rssMaxItems;
    if (!max) {
      if (meta.outFmt === 'rss') {
        max = -1;
      } else {
        return; // RSS not allowed
      }
    }
    if (max === -1) { max = fmtAnnosAsRssFeed.defaultMaxItems; }

    const userLimit = +popUntrustedOpt('limit') || 0;
    if ((userLimit > 0) && (userLimit < max)) { max = userLimit; }
    const limit = (+ctx.rowsLimit || 0);
    if ((!limit) || (limit > max)) { ctx.rowsLimit = max; }

    EX.applyUserRssOptsInplace({ meta, popUntrustedOpt });
    if (meta.outFmt !== 'rss') { return; }

    ctx.readContent = 'justTitles';
    // ^- It would be nice if we could also populate the RSS <author> and
    //    <description> fields, but generating them is too much effort.
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


EX.requestedContentModePriority = [
  'justTitles',
];


EX.miscUntrustedMetaOptNames = [
  ...EX.requestedContentModePriority,
  'scaleTargetWidth',
  'scaleTargetHeight',
];











export default EX;
