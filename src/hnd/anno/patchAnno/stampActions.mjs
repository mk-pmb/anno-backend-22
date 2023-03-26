// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../../../httpErrors.mjs';

const {
  notImpl,
  // badRequest,
} = httpErrors.throwable;


const EX = {

  async add_stamp(ctx) {
    const stRec = {};
    let namespace;
    await ctx.catchBadInput(function parse(mustPopInput) {
      stRec.st_type = mustPopInput('nonEmpty str', 'st_type');
      [namespace] = (/^\w+(?=:)/.exec(stRec.st_type) || false);
      if (!namespace) { throw notImpl('Unsupported stamp namespace'); }
      stRec.st_detail = mustPopInput('obj | str | num | nul | undef',
        'st_detail', null);
      mustPopInput.expectEmpty();
    });
    stRec.st_by = (ctx.who.userId || '');
    stRec.st_at = (new Date()).toISOString();
    return { stRec, anno: ctx.oldAnnoDetails };
  },

};



export default EX;
