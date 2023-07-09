// -*- coding: utf-8, tab-width: 2 -*-

import pMap from 'p-map';

import categorizeTargets from '../categorizeTargets.mjs';
import detectUserIdentity from '../../../acl/detectUserIdentity.mjs';
import genericAnnoMeta from '../redundantGenericAnnoMeta.mjs';
import httpErrors from '../../../httpErrors.mjs';
import parseStampRows from '../parseStampRows.mjs';

import buildSearchQuery from './buildSearchQuery.mjs';

const { fubar } = httpErrors.throwable;



const EX = async function bySubjectTargetPrefix(param) {
  const {
    req,
    rowsLimit,
    srv,
    subjTgtSpec,
  } = param;
  const {
    role: rqRole,
  } = (param.untrustedOpt || false);

  const skipAcl = (srv.acl === 'skip!');

  await (skipAcl || srv.acl.requirePerm(req, {
    targetUrl: subjTgtSpec,
    privilegeName: 'discover',
  }));

  const aclMetaSpy = {};
  await (skipAcl || srv.acl.requirePerm(req, {
    targetUrl: subjTgtSpec,
    privilegeName: 'read',
    aclMetaSpy,
  }));
  const {
    approvalRequired,
  } = aclMetaSpy;

  const search = buildSearchQuery.prepare({ approvalRequired });
  const isPrefixSearch = subjTgtSpec.endsWith('/*');
  search.tmpl({
    searchFilter: '#searchByLink',
    searchByLinkWhere: '"rel" = \'subject\' AND ' + (isPrefixSearch
      ? 'starts_with("url", $subjTgtStr)'
      : '"url" = $subjTgtStr'),
  });
  search.data({
    subjTgtStr: (isPrefixSearch ? subjTgtSpec.slice(0, -1) : subjTgtSpec),
  });
  if (rowsLimit >= 0) { search.tmpl({ globalLimit: 'LIMIT ' + rowsLimit }); }

  const stampParserOpts = {};

  if (!approvalRequired) { search.tmpl({ approvalWhereAnd: '' }); }
  if (rqRole === 'approver') {
    await (skipAcl || srv.acl.requirePerm(req, {
      targetUrl: subjTgtSpec,
      privilegeName: 'stamp_any_add_dc_dateAccepted',
    }));
    search.tmpl({ approvalWhereAnd: '#approvalNotYet' });
  }

  if (rqRole === 'author') {
    const { userId } = await detectUserIdentity.andDetails(req);
    const own = '"da"."author_local_userid" = $rqUserId';
    search.tmpl({ rqAlwaysShowOwnAnnos: own });
    search.data({ rqUserId: userId });
    stampParserOpts.lowlineFields = true;
  }

  const found = await search.selectAll(srv);
  // console.debug('subjectTarget: found =', found);

  await (skipAcl || EX.checkSubjTgtAcl(srv, req, found));

  async function fixupAnno(rec) {
    const idParts = { baseId: rec.base_id, versNum: rec.version_num };
    const stamps = parseStampRows(rec.stamps, stampParserOpts);
    // console.debug('rec:', rec, 'stamps:', stampInfos);
    const fullAnno = {
      ...(approvalRequired && { 'dc:dateAccepted': false }),
      ...genericAnnoMeta.add(srv, idParts, rec.details),
      ...stamps,
    };
    return fullAnno;
  }
  const annos = await pMap(found, fixupAnno);
  return annos;
};



Object.assign(EX, {

  async checkSubjTgtAcl(srv, req, found) {
    const allSubjTgtUrls = found.map(rec => categorizeTargets(srv,
      rec.details, { errInvalidAnno: fubar }).subjTgtUrls).flat();
    if (!allSubjTgtUrls.length) { return; }
    await srv.acl.requirePermForAllTargetUrls(req,
      allSubjTgtUrls, // <-- No need to de-dupe, it will be done internally.
      { privilegeName: 'read' });
  },


});




export default EX;
