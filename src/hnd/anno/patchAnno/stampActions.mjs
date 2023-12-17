// -*- coding: utf-8, tab-width: 2 -*-
/* eslint-disable no-unused-vars */

import getOwn from 'getown';

import decideAuthorIdentity from '../postNewAnno/decideAuthorIdentity.mjs';
import httpErrors from '../../../httpErrors.mjs';
import lookupExactVersion from '../idGet/lookupExactVersion.mjs';
import parseDatePropOrFubar from '../../util/parseDatePropOrFubar.mjs';
import stampUtil from '../util/stampUtil.mjs';

import approvalDecisionSideEffects from './approvalDecisionSideEffects.mjs';


const {
  notImpl,
  stateConflict,
} = httpErrors.throwable;


const doNothing = Boolean;

function orf(x) { return x || false; }

function popEffTs(pop) {
  let eff = pop('str | undef', 'when');
  eff = (eff && parseDatePropOrFubar(eff).jsDate);
  return (eff && { st_effts: eff });
}


/*
async add_stamp(ctx) {
  const stRec = {
    base_id: ctx.idParts.baseId,
    version_num: ctx.idParts.versNum,
    st_effts: null,
    st_detail: null,
  };
  const stParsed = await ctx.catchBadInput(function parse(mustPopInput) {
    const stType = mustPopInput('nonEmpty str', 'type');
    stRec.st_type = stType;
    const splat = stampUtil.splitStampNameNS(stType, notImpl);
    const popMore = getOwn(EX.addStampParseDetails, splat.aclStampName);
    if (popMore) { Object.assign(stRec, popMore(mustPopInput)); }
    mustPopInput.expectEmpty();
    return splat;
  });
  const { aclStampName, stType } = stParsed;

  const guessRole = getOwn(EX.roleByStamp, stType);
  if (guessRole) { ctx.req.asRoleName = guessRole; }
  Object.assign(ctx, await lookupExactVersion(ctx));
  const author = decideAuthorIdentity.fromAnnoCreator(ctx.annoDetails,
    ctx.who);

  const privName = ('stamp_' + (author.authorized ? 'own' : 'any')
    + '_add_' + aclStampName);
  await ctx.requireAdditionalReadPrivilege(privName);
  stRec.st_by = (ctx.who.userId || '');
  stRec.st_at = (new Date()).toISOString();
  ctx.mainStampRec = stRec;

  const stampFx = orf(getOwn(EX.stampFx, stType));
  await (stampFx.prepareAdd || doNothing)(ctx);

  ctx.hadDupeError = false;
  await ctx.srv.db.postgresInsertOneRecord('anno_stamps', stRec, {
    customDupeError(err) {
      ctx.hadDupeError = err;
      return 'ignore';
    },
  });

  await (stampFx.cleanupAfterAdd || doNothing)(ctx);

  if (ctx.hadDupeError) { EX.dupeStamp(); }
  return { st_at: stRec.st_at };
},
*/

const EX = {

  dupeStamp() { throw stateConflict('A stamp of this type already exists'); },

  roleByStamp: {
    'as:deleted':         'approver',
    'dc:dateApproved':    'approver',
  },


  addStampParseDetails: {
    as_deleted: popEffTs,
  },


  stampFx: {
    'dc:dateAccepted': approvalDecisionSideEffects,
  },


};



export default EX;
