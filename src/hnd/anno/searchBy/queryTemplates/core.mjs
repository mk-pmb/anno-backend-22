// -*- coding: utf-8, tab-width: 2 -*-

const EX = {

  defaultSearchCore: `
    WITH "criteria_filter" AS ( SELECT DISTINCT #inquiryType ),
    "visibility_prep" AS (
      SELECT "da"."base_id", "da"."version_num"
        \r, "da"."time_created"
        \r, "da"."author_local_userid",
        #visibilityStampCols
      FROM "criteria_filter" AS "cf" NATURAL JOIN "anno_data" AS "da"
      #visibilityStampJoins
    ),
    "data_and_visibility" AS (SELECT *,
      \r ("sunset_uts" = 0 OR "sunset_uts" > #nowUts) AS sunny\r
      \r FROM "visibility_prep" )
    SELECT * FROM "data_and_visibility" AS "da" WHERE #visibilityWhere
    `,

  inquiryType: '#inquiryBaseId',
  inquiryBaseId: '$searchBaseId AS "base_id"',
  inquiryLink: (rel, cmp) => ('"base_id", "version_num"'
    + ` FROM "anno_links" WHERE "rel" = '${rel}' AND #byLinkCmp${cmp}`),

  byLinkCmpExact: '"url" = $byLinkUrl',
  byLinkCmpPrefix: 'starts_with("url", $byLinkUrl)',

  inquiryAllWithStamp: ('"base_id", "version_num"'
    + ' FROM "anno_stamps" WHERE "st_type" = $searchStampName'),

};


export default EX;
