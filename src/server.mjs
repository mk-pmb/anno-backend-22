// -*- coding: utf-8, tab-width: 2 -*-

import absDir from 'absdir';
import envcfgMergeConfigs from 'envcfg-merge-configs-pmb';
import express from 'express';
import makeRedirector from 'deviate';
import mustBe from 'typechecks-pmb/must-be';
import nodeHttp from 'http';
import objPop from 'objpop';
import pify from 'pify';
import PrRouter from 'express-promise-router';
import smartListen from 'net-smartlisten-pmb';

import httpErrors from './httpErrors.mjs';
import simpleFilenameRedirector from './simpleFilenameRedirector.mjs';
import whoamiHandler from './whoamiHandler.mjs';


const pathInRepo = absDir(import.meta, '..');

const defaultConfig = {

  envcfg_prefix: 'anno',
  wwwpub_path: pathInRepo('wwwpub'),
  listen_addr: pathInRepo('tmp.debug/webserver.uds'),

};


function logIncomingRequest(req) {
  console.debug('Incoming request:', req.method, req.url, '?', req.query);
  req.next();
}


const EX = function createServer(customConfig) {
  const entireConfig = envcfgMergeConfigs({ ifPrefixProp: 'envcfg_prefix' },
    defaultConfig, customConfig);
  console.debug('Server config:', entireConfig);
  const popCfg = objPop(entireConfig, { mustBe }).mustBe;
  popCfg('str | eeq:false', 'envcfg_prefix');

  const app = express();
  app.once('close', function cleanup(...args) {
    console.debug('cleanup:', args);
  });

  const rt = PrRouter({
    strict: true,
    /* ^- Discern /session from /session/, because the trailing slash
          is relevant for relative paths.
      Beware: Doesn't fully protect sub-routes:
          https://github.com/expressjs/express/issues/2281
    */
  });
  app.use(rt);
  app.use(httpErrors.handleUnknownError);

  rt.use(logIncomingRequest);
  rt.use('/static', express.static(popCfg('nonEmpty str', 'wwwpub_path')));
  rt.get('/', makeRedirector('/static/'));

  rt.get('/session/whoami', whoamiHandler);
  rt.get('/session/login', makeRedirector('whoami'));
  // ^- This route is meant to be protected by a mandatory login
  //    requirement in a reverse proxy.
  rt.get('/session/*', httpErrors.noSuchResource);

  rt.get('/:filename', simpleFilenameRedirector('/static/:filename'));

  const webSrv = nodeHttp.createServer();
  webSrv.on('request', app);

  const srv = {
    popCfg,
    listenAddr: popCfg('str | pos0 num', 'listen_addr'),
    assertNoUnusedCfgOpts() {
      popCfg.expectEmpty('Unsupported server config option(s)');
    },

    getLowLevelWebServer() { return webSrv; },

    async listen() {
      const lsnSpec = smartListen(srv.listenAddr);
      await pify(cb => webSrv.listen(lsnSpec, cb))();
      console.info('Listening on ' + lsnSpec);
    },

    async close() {
      const closedPr = pify(cb => webSrv.once('close', cb))();
      webSrv.close();
      await closedPr;
    },

  };

  return srv;
};




export default EX;
