// -*- coding: utf-8, tab-width: 2 -*-

import pMap from 'p-map';

// import httpErrors from '../../../httpErrors.mjs';
import buildSearchQuery from './buildSearchQuery.mjs';
import categorizeTargets from '../categorizeTargets.mjs';
import fmtAnnoCollection from '../fmtAnnosAsSinglePageCollection.mjs';
import genericAnnoMeta from '../redundantGenericAnnoMeta.mjs';


const EX = async function bySubjectTargetPrefix(param) {
  const {
    subjTgtSpec,
    req,
    srv,
  } = param;
  const {
    role: rqRole,
  } = (param.untrustedOpt || false);

  const search = buildSearchQuery.prepare();
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

  await srv.acl.requirePerm(req, {
    targetUrl: subjTgtSpec,
    privilegeName: 'discover',
  });

  const aclMetaSpy = {};
  await srv.acl.requirePerm(req, {
    targetUrl: subjTgtSpec,
    privilegeName: 'read',
    aclMetaSpy,
  });
  const {
    approvalRequired,
  } = aclMetaSpy;

  if (!approvalRequired) { search.tmpl({ approvalWhereAnd: '' }); }
  if (rqRole === 'approver') {
    await srv.acl.requirePerm(req, {
      targetUrl: subjTgtSpec,
      privilegeName: 'stamp_any_add_dc_dateAccepted',
    });
    search.tmpl({ approvalWhereAnd: '#approvalNotYet' });
  }

  const found = await search.selectAll(srv);
  console.debug('subjectTarget: found =', found);

  const allSubjTgtUrls = found.map(rec => categorizeTargets(srv,
    rec.details).subjTgtUrls).flat();
  if (allSubjTgtUrls.length) {
    await srv.acl.requirePermForAllTargetUrls(req,
      allSubjTgtUrls, // <-- No need to de-dupe, it will be done internally.
      { privilegeName: 'read' });
  }

  const annos = await pMap(found, async function recombineAnno(rec) {
    const idParts = { baseId: rec.base_id, versNum: rec.version_num };
    const fullAnno = genericAnnoMeta.add(srv, idParts, rec.details);
    return fullAnno;
  });
  fmtAnnoCollection.replyToRequest(srv, req, { annos });
};




export default EX;
