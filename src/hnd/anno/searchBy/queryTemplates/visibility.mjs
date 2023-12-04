// -*- coding: utf-8, tab-width: 2 -*-

import miscSql from '../../miscSql.mjs';


const EX = {

  visibilityStampJoins: `
      ${miscSql.joinStampEffUts0('unapproval', '_ubhd:unapproved').join}
      ${miscSql.joinStampEffUts0('retractions', 'as:deleted').join}
    `.trim(),

  visibilityStampCols: `
        ("unapproval"."st_type" IS NULL) AS "disclosed",
        COALESCE("retractions"."st_effuts"::int, 0) AS "sunset_uts"
    `.trim(),

  visibilityWhere: '#visibilityIsOrWasPublic',
  visibilityAny: 'True',
  visibilityAuthorMode: '#visibilityOwnAnnos OR ( #visibilityIsOrWasPublic )',
  visibilityOwnAnnos: '"da"."author_local_userid" = $rqUserId',
  visibilityIsOrWasPublic: '"da"."disclosed"',
  visibilityUndecided: '"da"."sunny" AND NOT "da"."disclosed"',

};


export default EX;
