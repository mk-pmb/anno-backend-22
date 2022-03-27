// -*- coding: utf-8, tab-width: 2 -*-

import express from 'express';
import makeRedirector from 'deviate';

import eternal from '../hnd/wrap/eternal.mjs';
import httpErrors from '../httpErrors.mjs';
import makeAnnoDecider from '../hnd/annoDecider.mjs';
import requestDebugHandler from '../hnd/util/debugRequest.mjs';
import simpleFilenameRedirector from '../hnd/simpleFilenameRedirector.mjs';


function logIncomingRequest(req) {
  console.debug('Incoming request:', req.method, req.url, '?', req.query);
  req.next();
}


const EX = async function installRootRoutes(srv) {
  const rt = srv.getRootRouter();
  const { popCfg } = srv;

  rt.use(logIncomingRequest);

  const serveFile = express.static(popCfg('nonEmpty str', 'wwwpub_path'));
  rt.use('/static/favicon.ico', eternal());
  rt.use('/static', serveFile);
  rt.get('/', makeRedirector('/static/'));

  rt.get('/session/whoami', requestDebugHandler);
  rt.get('/session/login', makeRedirector('whoami'));
  // ^- This route is meant to be protected by a mandatory login
  //    requirement in a reverse proxy.
  rt.get('/session/*', httpErrors.noSuchResource);

  const annoDecider = await makeAnnoDecider(srv);
  rt.use('/anno/*', annoDecider);

  rt.get('/:filename', eternal(simpleFilenameRedirector('/static/:filename')));
};


export default EX;
