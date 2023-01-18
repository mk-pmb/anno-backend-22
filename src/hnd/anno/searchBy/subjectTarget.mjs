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
  ORDER BY "da"."time_created" ASC, "da"."base_id" ASC
  `;


const EX = async function bySubjectTargetPrefix(subjTgtSpec, req, srv) {
  await srv.acl.requirePerm(req, {
    targetUrl: subjTgtSpec,
    privilegeName: 'discover',
  });
  await srv.acl.requirePerm(req, {
    targetUrl: subjTgtSpec,
    privilegeName: 'read',
  });

  const [urlCond, urlArg] = (subjTgtSpec.endsWith('/*')
    ? ['starts_with("url", $1)', subjTgtSpec.slice(0, -1)]
    : ['"url" = $1', subjTgtSpec]);
  const searchQry = searchQryTpl.replace(/#url(?=\n)/, urlCond);
  // console.debug(searchQry, { urlArg });
  const found = await srv.db.postgresSelect(searchQry, [urlArg]);
  // console.debug('bySubjTgt:', { found });
  const annos = await pMap(found, async function recombineAnno(rec) {
    const { subjTgtUrls } = categorizeTargets(srv, rec.details);
    await pMap(subjTgtUrls, stu => srv.acl.requirePerm(req, {
      targetUrl: stu,
      privilegeName: 'read',
    }));
    const idParts = {
      baseId: rec.base_id,
      versNum: rec.version_num,
    };
    const fullAnno = genericAnnoMeta.add(srv, idParts, rec.details);
    return fullAnno;
  });
  fmtAnnoCollection.replyToRequest(srv, req, { annos });
};


// Object.assign(EX, {});
export default EX;
