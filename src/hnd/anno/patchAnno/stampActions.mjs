// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';

import decideAuthorIdentity from '../postNewAnno/decideAuthorIdentity.mjs';
import httpErrors from '../../../httpErrors.mjs';
import parseDatePropOrFubar from '../../util/parseDatePropOrFubar.mjs';


const {
  notImpl,
  stateConflict,
} = httpErrors.throwable;


function enforceHttpDateFormat(orig) {
  if (!orig) { return null; }
  return parseDatePropOrFubar(orig).jsDate.toGMTString();
}


const EX = {

  dupeStamp() { throw stateConflict('A stamp of this type already exists'); },


  async add_stamp(ctx) {
    const stRec = {
      base_id: ctx.idParts.baseId,
      version_num: ctx.idParts.versNum,
    };
    let namespace;
    let detail;
    await ctx.catchBadInput(function parse(mustPopInput) {
      stRec.st_type = mustPopInput('nonEmpty str', 'st_type');
      [namespace] = (/^\w+(?=:)/.exec(stRec.st_type) || false);
      if (!namespace) { throw notImpl('Unsupported stamp namespace'); }
      detail = mustPopInput('obj | str | num | nul | undef', 'st_detail');
      mustPopInput.expectEmpty();
    });
    const author = decideAuthorIdentity.fromAnnoCreator(ctx.annoDetails,
      ctx.who);

    const privName = ('stamp_' + (author.authorized ? 'own' : 'any')
      + '_add_' + namespace + '_'
      + stRec.st_type.slice(namespace.length + 1));
    await ctx.requireAdditionalReadPrivilege(privName);
    stRec.st_by = (ctx.who.userId || '');
    stRec.st_at = (new Date()).toISOString();

    const fixup = getOwn(EX.fixupStampValues, stRec.st_type);
    if (fixup) { detail = await fixup(detail, stRec); }
    if (detail === undefined) { detail = null; }
    stRec.st_detail = JSON.stringify(detail);

    await ctx.srv.db.postgresInsertOneRecord('anno_stamps', stRec, {
      customDupeError: EX.dupeStamp,
    });

    return { st_at: stRec.st_at };
  },


  fixupStampValues: {
    'as:deleted': enforceHttpDateFormat,
  },

};



export default EX;
