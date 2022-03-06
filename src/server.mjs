// -*- coding: utf-8, tab-width: 2 -*-

import mergeOpt from 'merge-options';
import absDir from 'absdir';
import pify from 'pify';
import express from 'express';
import PrRouter from 'express-promise-router';
import makeRedirector from 'deviate';
import smartListen from 'net-smartlisten-pmb';

import httpErrors from './httpErrors.mjs';
import whoamiHandler from './whoamiHandler.mjs';
import simpleFilenameRedirector from './simpleFilenameRedirector.mjs';


const pathInRepo = absDir(import.meta, '..');

const defaultConfig = {

  wwwpubPath: pathInRepo('wwwpub'),
  listenAddr: pathInRepo('tmp.debug/webserver.uds'),

};


function logIncomingRequest(req) {
  console.debug('Incoming request:', req.method, req.url, '?', req.query);
  req.next();
}


const EX = function createServer(customConfig) {
  const cfg = mergeOpt(defaultConfig, customConfig);

  const app = express();
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
  rt.use('/static', express.static(cfg.wwwpubPath));
  rt.get('/', makeRedirector('/static/'));

  rt.get('/session/whoami', whoamiHandler);
  rt.get('/session/login', makeRedirector('whoami'));
  // ^- This route is meant to be protected by a mandatory login
  //    requirement in a reverse proxy.
  rt.get('/session/*', httpErrors.noSuchResource);

  rt.get('/:filename', simpleFilenameRedirector('/static/:filename'));


  const srv = {
    cfg,

    async listen() {
      const lsnSpec = smartListen(cfg.listenAddr);
      await pify(cb => app.listen(lsnSpec, cb))();
      console.info('Listening on ' + lsnSpec);
    },

  };

  return srv;
};




export default EX;
