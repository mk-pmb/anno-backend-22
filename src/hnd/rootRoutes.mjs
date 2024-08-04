// -*- coding: utf-8, tab-width: 2 -*-

import express from 'express';
import cookieParser from 'cookie-parser';

import eternal from './wrap/eternal.mjs';
import plumb from './util/miscPlumbing.mjs';
import httpErrors from '../httpErrors.mjs';
import loggingUtil from './util/logging.mjs';
import makeAnnoRoute from './anno/route.mjs';
import makeBearerRssHandler from './rss/bearer.mjs';
import makeSessionRoute from './sess/route.mjs';
import shutdownHandler from './shutdownHandler.mjs';
import simpleFilenameRedirector from './simpleFilenameRedirector.mjs';
import siteLocalReservedRoutes from './siteLocalReservedRoutes.mjs';


const EX = async function installRootRoutes(srv) {
  const rt = srv.getRootRouter();
  const { popCfg } = srv;

  rt.use(cookieParser());
  rt.use(loggingUtil.middleware.logIncomingRequest);


  // ========================================================================
  // ##BEGIN## Paths relevant for the reverse proxy
  /*  Check `../../wwwpub/` to see which additional files may be relevant
      for your production environment (e.g. `robots.txt`). */

  const annoRoute = await makeAnnoRoute(srv);
  rt.use('/anno/*', annoRoute);
  rt.use('/as/:asRoleName/anno/*', annoRoute);
  /*  The `/as/*` namespace is a way for clients to request extended
      feature sets beyond the W3 anno protocol. */
  rt.use('/rssb/', await makeBearerRssHandler(srv));

  const sessionRoute = await makeSessionRoute(srv);
  rt.use('/session/*', sessionRoute);
  rt.use('/as/:asRoleName/session/', sessionRoute.asRoleName);

  // ##ENDOF## Paths relevant for the reverse proxy
  // ========================================================================


  siteLocalReservedRoutes.installRoutes(rt); // safe to ignore.

  // APIs for use only inside the docker network:
  rt.use('/admin/shutdown*', shutdownHandler);

  // Static file serving for use as a stand-alone debug server:
  rt.get('/', plumb.makeRedirector('static/'));
  rt.use('/static/favicon.ico', eternal());
  const serveFile = express.static(popCfg('nonEmpty str', 'wwwpub_path'));
  rt.use('/static', serveFile);
  rt.get('/:filename', eternal(simpleFilenameRedirector('static/:filename')));


  // If no previous route has matched, default to:
  rt.use(httpErrors.noSuchResource);
};


export default EX;
