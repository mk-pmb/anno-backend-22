// -*- coding: utf-8, tab-width: 2 -*-

import mergeOpt from 'merge-options';
import absDir from 'absdir';
import pify from 'pify';
import express from 'express';
import PrRouter from 'express-promise-router';
import makeRedirector from 'deviate';
import smartListen from 'net-smartlisten-pmb';

import simpleErrorHandler from './simpleErrorHandler.mjs';


const doNothing = Boolean;
const ignoreUnusedArgs = doNothing;

const resolveRelativePath = absDir(import.meta, '.');

const defaultConfig = {

  wwwpubPath: resolveRelativePath('../wwwpub'),
  listenAddr: '127.0.0.1:8022',

};



const EX = function createServer(customConfig) {
  const cfg = mergeOpt(defaultConfig, customConfig);

  const app = express();
  const rt = PrRouter();
  app.use(rt);

  rt.use(function logIncomingRequest(req, resp, next) {
    ignoreUnusedArgs(resp);
    console.debug('Incoming request:', req.method, req.url, req.query);
    next();
  });

  rt.get('/', makeRedirector('/static/index.html'));
  rt.use('/static', express.static(cfg.wwwpubPath));
  rt.get('/:path', makeRedirector('/static/:path'));



  app.use(simpleErrorHandler);

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
