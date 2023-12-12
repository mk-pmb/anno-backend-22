// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import objPop from 'objpop';
import pMap from 'p-map';

import categorizeTargets from '../categorizeTargets.mjs';
import detectUserIdentity from '../../../acl/detectUserIdentity.mjs';
import fmtAnnosAsRssFeed from '../fmtAnnosAsRssFeed.mjs';
import genericAnnoMeta from '../redundantGenericAnnoMeta.mjs';
import httpErrors from '../../../httpErrors.mjs';
import parseStampRows from '../parseStampRows.mjs';

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
    rssMaxItems,
    searchBaseId,
    skipAcl,
    subjTgtSpec,
    untrustedOpt,
  } = ctx;
  let {
    readContent,
    rowsLimit,
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

  if (rssMaxItems) {
    let max = rssMaxItems;
    const flagRss = popUntrustedOpt('rss');
    if (flagRss === true) { // <- i.e. no special value
      meta.outFmt = 'rss';
      readContent = 'justTitles';
      search.tmpl('orderByTimeDirection', 'DESC');
      if (max === -1) { max = fmtAnnosAsRssFeed.defaultMaxItems; }
      if (!rowsLimit) { rowsLimit = max; }
      if (rowsLimit > max) { rowsLimit = max; }
    }
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
  if (rowsLimit) { search.tmplIf(rowsLimit, 'orderedSearchLimit'); }

  const contentMode = getOwn(EX.contentModeDetails, readContent, false);
  if (contentMode.priv) { await addRequiredPrivilege(contentMode.priv); }
  if (contentMode.wrap) { search.wrapSeed(contentMode.wrap); }
  if (!contentMode.hasSubjs) { search.wrapSeed('addSubjectTargetRelUrls'); }

  search.tmpl(overrideSearchTmpl);

  popUntrustedOpt.expectEmpty();

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

    await pMap(privNames, async function check(privilegeName) {
      await srv.acl.requirePermForAllTargetUrls(req,
        allSubjTgtUrls, // <-- No need to de-dupe, it will be done internally.
        { privilegeName });
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
    delete fullAnno['_ubhd:unapproved'];
    if (!rec.disclosed) { fullAnno['dc:dateAccepted'] = false; }
    return fullAnno;
  },


});




export default EX;
