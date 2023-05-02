// -*- coding: utf-8, tab-width: 2 -*-

import pMap from 'p-map';

// import httpErrors from '../../../httpErrors.mjs';
import categorizeTargets from '../categorizeTargets.mjs';
import fmtAnnoCollection from '../fmtAnnosAsSinglePageCollection.mjs';
import genericAnnoMeta from '../redundantGenericAnnoMeta.mjs';


const searchQryTpl = `
    "da"."base_id", "da"."version_num",
    "da"."time_created",
    "da"."details"
  FROM "anno_data" AS "da"
  JOIN (
    SELECT "base_id", MAX("version_num"::smallint) AS "max_revi"
    FROM "anno_links"
    WHERE "rel" = 'subject' AND #url
    GROUP BY "base_id"
    ) AS "sel"
  ON "da"."base_id" = "sel"."base_id"
    AND "da"."version_num" = "sel"."max_revi"
  #approval_join
  ORDER BY "da"."time_created" ASC, "da"."base_id" ASC
  `;


const EX = async function bySubjectTargetPrefix(param) {
  const {
    subjTgtSpec,
    untrustedOpt,
    req,
    srv,
  } = param;
  console.debug('bySubjectTargetPrefix: untrustedOpt:', untrustedOpt);
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
    serviceApprovalStampType,
  } = aclMetaSpy;

  const [searchQry, ...searchArgs] = EX.buildSearchQry({
    subjTgtSpec,
    serviceApprovalStampType,
  });
  const found = await srv.db.postgresSelect(searchQry, searchArgs);

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


Object.assign(EX, {

  buildSearchQry(how) {
    let qry = searchQryTpl;
    const args = [];

    const { subjTgtSpec } = how;
    const [urlCond, urlArg] = (subjTgtSpec.endsWith('/*')
      ? ['starts_with("url", $1)', subjTgtSpec.slice(0, -1)]
      : ['"url" = $1', subjTgtSpec]);
    args.push(urlArg);
    qry = qry.replace(/#url(?=\n)/, urlCond);

    const apprStamp = how.serviceApprovalStampType;
    if (apprStamp) {
      const apprJoin = `
        JOIN "anno_stamps" AS "appr"
          ON "appr"."base_id" = "da"."base_id"
          AND "appr"."version_num" = "da"."version_num"
          AND "appr"."st_type" = $2
          AND "appr"."st_at" <= NOW()
        `;
      qry = qry.replace(/#approval_join(?=\n)/, apprJoin);
      args.push(apprStamp);
    } else {
      qry = qry.replace(/#approval_\w+(?=\n)/g, '');
    }

    return [qry, ...args];
  },



});


export default EX;
