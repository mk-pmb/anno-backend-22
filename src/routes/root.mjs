// -*- coding: utf-8, tab-width: 2 -*-

import express from 'express';
import makeRedirector from 'deviate';

import eternal from '../hnd/wrap/eternal.mjs';
import makeAnnoDecider from '../hnd/annoDecider.mjs';
import makeSessionDecider from '../hnd/sessionDecider.mjs';
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

  rt.use('/session/*', await makeSessionDecider(srv));
  rt.use('/anno/*', await makeAnnoDecider(srv));

  rt.get('/:filename', eternal(simpleFilenameRedirector('/static/:filename')));
};


export default EX;
