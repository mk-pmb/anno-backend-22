// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../../../httpErrors.mjs';
import miscSql from '../miscSql.mjs';
import ubhdAnnoIdFmt from '../ubhdAnnoIdFmt.mjs';


const {
  noSuchAnno,
  noSuchResource,
} = httpErrors.throwable;

const versionSep = ubhdAnnoIdFmt.versionNumberSeparator;


const EX = function findLatestVersionNums(ctx) {
  return EX.core(ctx.srv, ctx.idParts.baseId);
};


(function compileTpl() {
  const unapStamp = '_ubhd:unapproved';
  const coal = 'SELECT COALESCE(MAX("version_num")::smallint, 0) FROM "av"';
  const tpl = `
    WITH "av" AS (
      SELECT "da"."base_id", "da"."version_num",
        ("unap"."st_type" IS NULL) AS "disclosed"
      FROM "anno_data" AS "da"
      LEFT JOIN "anno_stamps" AS "unap" ON "unap"."st_type" = '${unapStamp}'
        AND ${miscSql.annoExactVerCond('da', 'unap')}
      WHERE "da"."base_id" = $1
      ORDER BY "da"."version_num" ASC
    ) SELECT
    (${coal}) AS "max",
    (${coal} WHERE "disclosed") AS "dis"
    `;
  EX.queryTpl = tpl;
}());


Object.assign(EX, {

  async core(srv, baseId) {
    const report = (await srv.db.postgresSelect(EX.queryTpl,
      [baseId])).expectSingleRow();
    console.debug(EX.name, 'core report', report);
    if (!report.max) { throw noSuchAnno(); }
    return { baseId, ...report };
  },


  async redirToLatestVersion(ctx) {
    // :ATTN:ACL: Currently no ACL checks for this lookup.
    const report = await EX(ctx);
    const { max, dis } = report;
    const role = ctx.req.asRoleName;
    // console.debug('redirToLatestVersion:', { max, dis, role, redirVer });
    const redirVer = (function decide() {
      if (!role) { return dis; }
      if (role === 'approver') { return max; }
      if (role === 'author') { return dis; }
      throw noSuchResource();
    }());
    if (!redirVer) { throw noSuchAnno(); }
    const { res } = ctx.req;
    const baseUrlRel = ctx.idParts.baseId + versionSep;
    res.links({ 'working-copy': baseUrlRel + max });
    return res.redirect(baseUrlRel + redirVer);
  },




});


export default EX;
