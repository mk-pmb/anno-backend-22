// -*- coding: utf-8, tab-width: 2 -*-

import express from 'express';
import makeRedirector from 'deviate';

import eternal from './wrap/eternal.mjs';
import logIncomingRequest from './util/logIncomingRequest.mjs';
import makeAnnoRoute from './anno/route.mjs';
import makeSessionRoute from './sess/route.mjs';
import simpleFilenameRedirector from './simpleFilenameRedirector.mjs';


const EX = async function installRootRoutes(srv) {
  const rt = srv.getRootRouter();
  const { popCfg } = srv;

  rt.use(logIncomingRequest);

  const serveFile = express.static(popCfg('nonEmpty str', 'wwwpub_path'));
  rt.use('/static/favicon.ico', eternal());
  rt.use('/static', serveFile);
  rt.get('/', makeRedirector('/static/'));

  rt.use('/session/*', await makeSessionRoute(srv));
  rt.use('/anno/*', await makeAnnoRoute(srv));

  rt.get('/:filename', eternal(simpleFilenameRedirector('/static/:filename')));
};


export default EX;
