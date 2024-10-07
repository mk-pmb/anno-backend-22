// -*- coding: utf-8, tab-width: 2 -*-

import bodyParser from 'body-parser';
import fixStringsDeeplyInplace from 'fix-unicode-strings-deeply-inplace-pmb';
import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be';
import objPop from 'objpop';
import pify from 'pify';

import httpErrors from '../../httpErrors.mjs';

const {
  badRequest,
  payloadTooLarge,
} = httpErrors.throwable;


const promisifiedParsers = {
  json: pify(bodyParser.json({})),
};

const bodyFixOpt = { eol: true, trim: true };


function explainBodyParseError(err) {
  if (err.type === 'entity.too.large') { throw payloadTooLarge(); }
  if (err.statusCode !== 400) { throw err; }
  throw badRequest(['Cannot parse request body', err]);
}


const EX = async function parseRequestBody(fmt, req) {
  const impl = getOwn(promisifiedParsers, fmt);
  if (!impl) { throw new Error('No parser for format ' + fmt); }
  await impl(req, req.res).catch(explainBodyParseError);
  // eslint-disable-next-line no-param-reassign
  req.body = fixStringsDeeplyInplace(req.body, bodyFixOpt); /*
    The assignment is for cases where body is not a container,
    e.g. a JSON body encoding a string or a number. */
  return req.body;
};


async function catchBadInput(impl, ...args) {
  const ctx = this;
  try {
    return await impl(ctx.mustPopInput, ...args, ctx);
  } catch (e) {
    throw badRequest(['Parse input', e]);
  }
}


Object.assign(EX, {

  async fancy(fmt, req) {
    const origInput = await EX(fmt, req);
    return EX.fancify(origInput, req);
  },

  fancify(origInput, req) {
    const mustPopInput = objPop(origInput,
      { mustBe, leftoversMsg: 'Unsupported input field' }).mustBe;
    const ctx = {
      req,
      origInput,
      mustPopInput,
      catchBadInput,
    };
    return ctx;
  },

});


export default EX;
