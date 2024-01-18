// -*- coding: utf-8, tab-width: 2 -*-

function wrapJustType(x) { return (x.substr ? { st_type: x } : x); }


const EX = function makeStampDeleter(ovr) { return EX.impl.bind(null, ovr); };


Object.assign(EX, {

  impl: async function deleteSpecificStamp(ovr1, srv, st, ovr2) {
    // ovr{1,2}: Stamp property overrides. Usually used to replace st_type.
    const param = { ...st, ...wrapJustType(ovr1), ...ovr2 };
    const sql = `DELETE FROM "anno_stamps" WHERE "st_type" = $1
      AND "base_id" = $2 AND "version_num" ${param.verCmp || '='} $3`;
    const args = [param.st_type, param.base_id, param.version_num];
    if (param.debugSql) { console.debug(EX.impl.name, sql, args); }
    const result = await srv.db.postgresQueryRows(sql, args);
    return result;
  },


  defaultCtxProp: 'mainStampRec',

  fromCtxProp(ovr, prop) {
    if (!prop) { return EX.fromCtxProp(ovr, EX.defaultCtxProp); }
    return async function deleteStampByCtxProp(ctx) {
      return EX.impl(ovr, ctx.srv, ctx[prop]);
    };
  },


});


export default EX;
