// -*- coding: utf-8, tab-width: 2 -*-

import bodyParser from 'body-parser';
import getOwn from 'getown';
import pify from 'pify';

import httpErrors from '../../httpErrors.mjs';

const errParseBody = httpErrors.badRequest.explain(
  'Cannot parse request body');

const promisifiedParsers = {
  json: pify(bodyParser.json({})),
};


function explainBodyParseError(err) {
  if (err.statusCode !== 400) { throw err; }
  throw errParseBody.explain(err.message).throwable();
}


const EX = async function parseRequestBody(fmt, req) {
  const impl = getOwn(promisifiedParsers, fmt);
  if (!impl) { throw new Error('No parser for format ' + fmt); }
  await impl(req, req.res).catch(explainBodyParseError);
  return req.body;
};


export default EX;
