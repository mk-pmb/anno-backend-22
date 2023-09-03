// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../../../httpErrors.mjs';
import ubhdAnnoIdFmt from '../ubhdAnnoIdFmt.mjs';

import queryTpl from './queryTpl.mjs';


const { noSuchAnno } = httpErrors.throwable;

const versionSep = ubhdAnnoIdFmt.versionNumberSeparator;


const EX = {

  async lookupLatestVersionNum(ctx) {
    const { baseId } = ctx.idParts;
    const { latest } = (await ctx.srv.db.postgresSelect(queryTpl.latestVersion,
      [baseId])).expectSingleRow();
    if (!latest) { throw noSuchAnno(); }
    return latest;
  },


  async redirToLatestVersion(ctx) {
    // :ATTN:ACL: Currently no ACL checks for this lookup.
    const latest = await EX.lookupLatestVersionNum(ctx);
    return ctx.req.res.redirect(ctx.idParts.baseId + versionSep + latest);
  },


};


export default EX;
