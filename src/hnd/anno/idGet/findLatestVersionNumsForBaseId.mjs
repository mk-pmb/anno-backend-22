// -*- coding: utf-8, tab-width: 2 -*-

import detectUserIdentity from '../../../acl/detectUserIdentity.mjs';
import httpErrors from '../../../httpErrors.mjs';
import miscSql from '../miscSql.mjs';
import ubhdAnnoIdFmt from '../ubhdAnnoIdFmt.mjs';


const {
  noSuchAnno,
  noSuchResource,
} = httpErrors.throwable;

const versionSep = ubhdAnnoIdFmt.versionNumberSeparator;


const EX = async function findLatestVersionNums(ctx) {
  const { srv, req, idParts } = ctx;
  const role = req.asRoleName;
  const fx = {};
  if (role === 'author') { fx.owner = (await detectUserIdentity(req)).userId; }
  return EX.core(srv, idParts.baseId, fx);
};


(function compileTpl() {
  const unapStamp = '_ubhd:unapproved';
  const coal = 'SELECT COALESCE(MAX("version_num")::smallint, 0) FROM "av"';
  const main = `
    WITH "av" AS (
      SELECT "da"."base_id", "da"."version_num",
        "da"."author_local_userid" AS "user",
        ("unap"."st_type" IS NULL) AS "disclosed"
      FROM "anno_data" AS "da"
      LEFT JOIN "anno_stamps" AS "unap" ON "unap"."st_type" = '${unapStamp}'
        AND ${miscSql.annoExactVerCond('da', 'unap')}
      WHERE "da"."base_id" = $1
      ORDER BY "da"."version_num" ASC
    ) SELECT (${coal}) AS "max",
    (${coal} WHERE "disclosed") AS "dis"`;
  EX.queryTpl = {
    main,
    owner: `,\n(${coal} WHERE "user" = $2) AS "own"`,
  };
}());


Object.assign(EX, {

  async core(srv, baseId, fx) {
    let query = EX.queryTpl.main;
    const args = [baseId];

    if (fx.owner) {
      query += EX.queryTpl.owner;
      args.push(fx.owner);
    }

    const found = await srv.db.postgresSelect(query, args);
    const report = found.expectSingleRow();
    // console.debug(EX.name, 'core report', report, 'fx:', fx);
    if (!report.max) { throw noSuchAnno(); }
    return { baseId, ...report };
  },


  async redirToLatestVersion(ctx) {
    // :ATTN:ACL: Currently no ACL checks for this lookup.
    const report = await EX(ctx);
    const { max, dis, own } = report;
    // console.debug('redirToLatestVersion:', { max, dis, role, redirVer });
    const role = ctx.req.asRoleName;
    const redirVer = (function decide() {
      if (!role) { return dis; }
      if (role === 'approver') { return max; }
      if (role === 'author') { return Math.max(dis, (own || 0)); }
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
