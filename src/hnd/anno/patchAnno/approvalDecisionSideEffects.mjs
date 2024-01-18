// -*- coding: utf-8, tab-width: 2 -*-

import makeStampDeleter from '../util/makeStampDeleter.mjs';


const unapStamp = '_ubhd:unapproved';


const sunsetUEV = async function sunsetUndecidedEarlierVersions(ctx) {
  const st = ctx.mainStampRec;
  const { sqlTpl } = sunsetUEV;
  const args = [
    st.base_id,
    st.version_num,
    st.st_at,
    st.st_by,
  ];
  await ctx.srv.db.postgresQueryRows(sqlTpl, args);
};

sunsetUEV.sqlTpl = `
  INSERT INTO "anno_stamps"
    ("base_id", "version_num", "st_at", "st_by", "st_type")
  SELECT "da"."base_id", "da"."version_num",
    $3 AS "st_at", $4 AS "st_by", 'as:deleted' AS "st_type"
  FROM "anno_data" AS "da"
  LEFT JOIN "anno_stamps" AS "st" USING ("base_id", "version_num")
  WHERE "st"."st_type" = '${unapStamp}'
    AND "da"."base_id" = $1 AND "da"."version_num" < $2
  ON CONFLICT ("base_id", "version_num", "st_type") DO NOTHING;
  `;


const delUnap = makeStampDeleter.fromCtxProp({ st_type: unapStamp });




const EX = {
  sunsetUndecidedEarlierVersions: sunsetUEV,
  deleteStampUbhdUnapproved: delUnap,

  prepareAdd: sunsetUEV,
  cleanupAfterAdd: delUnap,
};


export default EX;
