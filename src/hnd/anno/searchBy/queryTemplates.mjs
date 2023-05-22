// -*- coding: utf-8, tab-width: 2 -*-

const qtpl = {

  annoExactVerCond: (a, b, c) => (`"${a}"."base_id" = "${b}"."base_id" `
    + `AND "${a}"."version_num" = "${b}"."${c || 'version_num'}"`),

};



Object.assign(qtpl, {

  baseQuery: `
      "da"."base_id", "da"."version_num", "da"."time_created",
      #stampFilterColumns
      #stampsArray
      "da"."details"
    FROM "anno_data" AS "da"
    JOIN ( #searchFilter ) AS "sel"
      ON ${qtpl.annoExactVerCond('da', 'sel', 'max_revi')}
    #stampFilterJoins
    WHERE #rqAlwaysShowOwnAnnos OR ( True #stampFilterWhereAnds
      #extraWhereAnds )
    ORDER BY "da"."time_created" ASC, "da"."base_id" ASC
    `,

  stampsArray: `ARRAY(
    SELECT jsonb_build_object(
      'type', "st"."st_type",
      'ts', "st"."st_effuts",
      'detail', "st"."st_detail")
    FROM "anno_stamps_effuts" AS "st"
    WHERE ${qtpl.annoExactVerCond('st', 'da')}
    ) AS "stamps",`.replace(/\n\s+/g, ' '),

  rqAlwaysShowOwnAnnos: 'False',

  extraWhereAnds: '',

  stampFilterJoins: '',
  stampFilterColumns: '',
  stampFilterWhereAnds: '',

  searchByLink: `SELECT "base_id", MAX("version_num"::smallint) AS "max_revi"
        FROM "anno_links" WHERE #searchByLinkWhere
        GROUP BY "base_id"`,

  approvalWhereAnd: '#approvalRequired',
  approvalRequired: 'AND "approval"."st_effuts" <= #nowUts ',
  approvalNotYet: 'AND "approval"."st_effuts" IS NULL',

  sunsetWhereAnd: '#sunsetObey',
  sunsetObey: ['AND (', ' IS NULL OR ', ' > #nowUts )',
  ].join('"sunset"."st_effuts"'),


});






export default qtpl;
