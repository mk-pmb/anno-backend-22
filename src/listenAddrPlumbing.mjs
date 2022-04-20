// -*- coding: utf-8, tab-width: 2 -*-

import makeGenericAsyncCorsHandler from 'cors-async';
import pify from 'pify';
import smartListen from 'net-smartlisten-pmb';

import plumb from './hnd/util/miscPlumbing.mjs';


const EX = function installListenAddrPlumbing(srv) {
  const listenAddr = srv.popCfg('str | pos0 num', 'listen_addr');
  const lsnSpec = smartListen(listenAddr, 0, 'http://');
  const lsnUrl = String(lsnSpec);
  const pubUrl = srv.popCfg('str', 'public_baseurl', '');

  const noSlashPubUrl = String(pubUrl || lsnSpec)
    // ^-- Please don't reinvent guessOrigReqUrl from
    //     `hnd/util/miscPlumbing.mjs`!
    .replace(/^TCP /, '').replace(/\/$/, '');

  const confirmCors = plumb.legacyMultiArg(makeGenericAsyncCorsHandler({
    origin: srv.popCfg('nonEmpty str', 'cors_accept_origin'),
    optionsSuccessStatus: 200, // as recommended by npm:cors
  }));

  const webSrv = srv.getLowLevelWebServer();


  async function listen() {
    let descr = 'Gonna listen on ' + lsnUrl;
    if (pubUrl) { descr += ' which config says is also ' + pubUrl; }
    console.info(descr);
    await pify(cb => webSrv.listen(lsnSpec, cb))();
    console.info('Now listening.');
  }


  async function close() {
    const closePrs = [
      pify(cb => webSrv.once('close', cb))(),
      (srv.db && srv.db.abandon()),
    ];
    webSrv.close();
    await Promise.all(closePrs);
  }


  Object.assign(srv, {
    close,
    confirmCors,
    listen,
    publicBaseUrlNoSlash: noSlashPubUrl,
  });
  return srv;
};


export default EX;
