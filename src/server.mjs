// -*- coding: utf-8, tab-width: 2 -*-

import absDir from 'absdir';
import envcfgMergeConfigs from 'envcfg-merge-configs-pmb';
import express from 'express';
import mustBe from 'typechecks-pmb/must-be';
import nodeHttp from 'http';
import objPop from 'objpop';
import pify from 'pify';
import PrRouter from 'express-promise-router';
import smartListen from 'net-smartlisten-pmb';

import dbAdapter from './dbAdapter/pg/index.mjs';
import httpErrors from './httpErrors.mjs';
import installRootRoutes from './routes/root.mjs';

const pathInRepo = absDir(import.meta, '..');

const defaultConfig = {

  envcfg_prefix: 'anno_',
  wwwpub_path: pathInRepo('wwwpub'),
  listen_addr: '127.0.0.1:33321',
  db: dbAdapter.getConfigDefaults(),

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
    listenAddr: popCfg('str | pos0 num', 'listen_addr'),

    assertNoUnusedCfgOpts() {
      popCfg.expectEmpty('Unsupported server config option(s)');
    },

    getRootRouter() { return rootRouter; },
    getLowLevelWebServer() { return webSrv; },

    async listen() {
      const lsnSpec = smartListen(srv.listenAddr, 0, 'http://');
      await pify(cb => webSrv.listen(lsnSpec, cb))();
      console.info('Listening on ' + lsnSpec);
    },

    async close() {
      const closePrs = [
        pify(cb => webSrv.once('close', cb))(),
        (srv.db && srv.db.close()),
      ];
      webSrv.close();
      await Promise.all(closePrs);
    },

  };

  await installRootRoutes(srv);
  srv.db = await dbAdapter.init({ popCfg });

  return srv;
};




export default EX;
