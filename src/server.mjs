// -*- coding: utf-8, tab-width: 2 -*-

import absDir from 'absdir';
import envcfgMergeConfigs from 'envcfg-merge-configs-pmb';
import express from 'express';
import mustBe from 'typechecks-pmb/must-be';
import nodeHttp from 'http';
import objPop from 'objpop';
import PrRouter from 'express-promise-router';

import configFilesAdapter from './cfg/configFilesAdapter.mjs';
import dbAdapter from './dbAdapter/pg/index.mjs';
import httpErrors from './httpErrors.mjs';
import installGlobalRequestExtras from './hnd/globalRequestExtras.mjs';
import installListenAddrPlumbing from './listenAddrPlumbing.mjs';
import installRootRoutes from './hnd/rootRoutes.mjs';
import logRequestCheckpoint from './logRequestCheckpoint.mjs';
import lusrmgr from './cfg/lusrmgr/index.mjs';
import prepareAcl from './acl/prepareAcl.mjs';
import servicesAdapter from './cfg/servicesAdapter.mjs';
import timeoutFallbackResponse from './timeoutFallbackResponse.mjs';


const pathInRepo = absDir(import.meta, '..');

const defaultConfig = {

  envcfg_prefix: 'anno_',
  db: dbAdapter.getConfigDefaults(),
  cfgfiles: configFilesAdapter.getConfigDefaults(),

  cors_accept_origin: '*',
  listen_addr: '127.0.0.1:33321',
  public_baseurl: '',
  wwwpub_path: pathInRepo('wwwpub'),

};


const EX = async function createServer(customConfig) {
  const entireConfig = envcfgMergeConfigs({ ifPrefixProp: 'envcfg_prefix' },
    defaultConfig, customConfig);
  console.debug('Server config:', entireConfig);
  const popCfg = objPop(entireConfig, { mustBe }).mustBe;
  popCfg('str | eeq:false', 'envcfg_prefix');

  const app = express();
  app.once('close', function cleanup(...args) {
    console.debug('cleanup:', args);
  });

  installGlobalRequestExtras(app);
  app.use(timeoutFallbackResponse());

  const rootRouter = PrRouter({
    strict: true,
    /* ^- Discern /session from /session/, because the trailing slash
          is relevant for relative paths.
      Beware: Doesn't fully protect sub-routes:
          https://github.com/expressjs/express/issues/2281
    */
  });
  app.use(rootRouter);
  app.use(httpErrors.handleUnknownError);
  const webSrv = nodeHttp.createServer();
  webSrv.on('request', app);

  const srv = {
    popCfg,

    assertNoUnusedCfgOpts() {
      popCfg.expectEmpty('Unsupported server config option(s)');
    },

    getRootRouter() { return rootRouter; },
    getLowLevelWebServer() { return webSrv; },
  };

  srv.configFiles = await configFilesAdapter.make({ popCfg });
  srv.services = await servicesAdapter.make(srv);
  srv.lusrmgr = await lusrmgr.make(srv);
  srv.acl = await prepareAcl(srv);
  srv.db = await dbAdapter.init({ popCfg });
  await installListenAddrPlumbing(srv);
  await installRootRoutes(srv);

  app.globalRequestExtras({
    getDb() { return srv.db; },
    getSrv() { return srv; },
    logCkp: logRequestCheckpoint,
  });

  return srv;
};




export default EX;
