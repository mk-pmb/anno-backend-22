// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';

import detectUserIdentity from '../../../acl/detectUserIdentity.mjs';
import httpErrors from '../../../httpErrors.mjs';
import lookupExactVersion from '../idGet/lookupExactVersion.mjs';
import parseRequestBody from '../../util/parseRequestBody.mjs';
import sendFinalTextResponse from '../../../finalTextResponse.mjs';

import stampActions from './stampActions.mjs';

const {
  notImpl,
} = httpErrors.throwable;


const actionHandlers = {
  ...stampActions,
};


const EX = async function patchAnno(ctx) {
  const { req } = ctx;
  Object.assign(ctx, ...(await Promise.all([
    lookupExactVersion(ctx),
    parseRequestBody.fancy('json', req),
  ])));
  await ctx.catchBadInput(function parse(mustPopInput) {
    ctx.action = mustPopInput('nonEmpty str', 'action');
  });
  const hnd = getOwn(actionHandlers, ctx.action);
  if (!hnd) { throw notImpl('Unknown PATCH action'); }
  ctx.who = await detectUserIdentity(req);
  const result = await hnd(ctx);
  if (result !== undefined) { sendFinalTextResponse.json(req, result); }
};


export default EX;
