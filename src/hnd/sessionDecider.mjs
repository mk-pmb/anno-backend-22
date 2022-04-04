// -*- coding: utf-8, tab-width: 2 -*-

import makeRedirector from 'deviate';

import httpErrors from '../httpErrors.mjs';
import requestDebugHandler from './util/debugRequest.mjs';
// import sendFinalTextResponse from '../finalTextResponse.mjs';

import plumb from './util/miscPlumbing.mjs';


const EX = async function makeSessionDecider() {

  const redirectToWhoami = makeRedirector('whoami');

  function sessionHnd(req) {
    const subUrl = plumb.getFirstAsteriskUrlPart(req);
    if (subUrl === 'login') {
      // This route is meant to be protected by a mandatory login
      // requirement in a reverse proxy.
      return redirectToWhoami(req, req.res, req.next);
    }
    if (subUrl === 'whoami') {
      return requestDebugHandler(req);
    }
    return httpErrors.noSuchResource(req);
  }

  return sessionHnd;
};


export default EX;
