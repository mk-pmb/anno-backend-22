// -*- coding: utf-8, tab-width: 2 -*-

import absDir from 'absdir';
import envcfgMergeConfigs from 'envcfg-merge-configs-pmb';
import express from 'express';
import mustBe from 'typechecks-pmb/must-be';
import nodeHttp from 'http';
import objPop from 'objpop';
import PrRouter from 'express-promise-router';

import configFilesAdapter from './cfg/configFilesAdapter/ad.mjs';
import dbAdapter from './dbAdapter/pg/index.mjs';
import fallbackErrorHandler from './hnd/fallbackErrorHandler.mjs';
import installGlobalRequestExtras from './hnd/globalRequestExtras.mjs';
import installListenAddrPlumbing from './listenAddrPlumbing.mjs';
import installRootRoutes from './hnd/rootRoutes.mjs';
import logRequestCheckpoint from './logRequestCheckpoint.mjs';
import lusrmgr from './cfg/lusrmgr/index.mjs';
import makeGenericCorsHandler from './hnd/util/genericCorsHandler.mjs';
import prepareAcl from './acl/prepareAcl.mjs';
import prepareRssFeedsConfig from './hnd/rss/prepareConfig.mjs';
import servicesAdapter from './cfg/servicesAdapter.mjs';
import timeoutFallbackResponse from './timeoutFallbackResponse.mjs';


const pathInRepo = absDir(import.meta, '..');

const defaultConfig = {

  envcfg_prefix: 'anno_',
  db: dbAdapter.getConfigDefaults(),
  cfgfiles: configFilesAdapter.getConfigDefaults(),

  listen_addr: '127.0.0.1:33321',
  notify_server_listening: '',
  public_baseurl: '',
  wwwpub_path: pathInRepo('wwwpub'),

  response_timeout_sec: 5,

  ...fallbackErrorHandler.configDefaults,

};


const EX = async function createServer(customConfig) {
  const entireConfig = envcfgMergeConfigs({ ifPrefixProp: 'envcfg_prefix' },
    defaultConfig, customConfig);
  console.debug('Server config:', entireConfig);
  const popCfg = objPop(entireConfig, { mustBe }).mustBe;
  popCfg('str | eeq:false', 'envcfg_prefix');

  const webSrv = nodeHttp.createServer();
  const app = express();
  app.set('x-powered-by', false);
  app.set('case sensitive routing', true);
  app.set('etag', false);
  app.set('strict routing', true);

  app.once('close', function cleanup(...args) {
    console.debug('cleanup:', args);
  });

  installGlobalRequestExtras(app);
  app.use(timeoutFallbackResponse({
    timeoutMsec: popCfg('str | num | undef', 'response_timeout_sec') * 1e3,
  }));

  const rootRouter = PrRouter({
    strict: true,
    /* ^- Discern /session from /session/, because the trailing slash
          is relevant for relative paths.
      Beware: Doesn't fully protect sub-routes:
          https://github.com/expressjs/express/issues/2281
    */
  });
  app.use(rootRouter);
  app.use(fallbackErrorHandler.decide(popCfg, webSrv));
  webSrv.on('request', app);

  const srv = {
    popCfg,

    initialConfigDone() {
      popCfg.expectEmpty('Unsupported server config option(s)');
      srv.popCfg = EX.denyLateConfigRead;
    },

    getRootRouter() { return rootRouter; },
    getLowLevelWebServer() { return webSrv; },
  };
  await installListenAddrPlumbing(srv);

  srv.configFiles = await configFilesAdapter.make({ popCfg });
  srv.rssFeeds = await prepareRssFeedsConfig(srv);
  srv.services = await servicesAdapter.make(srv);
  srv.lusrmgr = await lusrmgr.make(srv);
  srv.acl = await prepareAcl(srv);
  srv.db = await dbAdapter.init({ popCfg });
  await installRootRoutes(srv);

  const confirmCorsImpl = makeGenericCorsHandler();
  app.globalRequestExtras({
    confirmCors() { return confirmCorsImpl(this); },
    getDb() { return srv.db; },
    getSrv() { return srv; },
    logCkp: logRequestCheckpoint,
  });

  return srv;
};


Object.assign(EX, {

  denyLateConfigRead(expectedType, slot) {
    const err = new Error('Late attempt to read server config');
    Object.assign(err, { expectedType, slot });
    throw err;
  },


});


export default EX;
