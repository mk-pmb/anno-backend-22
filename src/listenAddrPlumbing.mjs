// -*- coding: utf-8, tab-width: 2 -*-

import spawnDetached from 'childprocess-spawn-detached';

import pify from 'pify';
import smartListen from 'net-smartlisten-pmb';


const EX = function installListenAddrPlumbing(srv) {
  const listenAddr = srv.popCfg('str | pos0 num', 'listen_addr');
  const lsnSpec = smartListen(listenAddr, 0, 'http://');
  const origLsnDescr = String(lsnSpec);
  const lsnUrl = EX.fmtLsnUrl(origLsnDescr);
  const cfgPubUrl = srv.popCfg('str', 'public_baseurl', '');
  const pubUrl = (cfgPubUrl || lsnUrl);

  const noSlashPubUrl = pubUrl.replace(/\/$/, '');
  // ^-- Please don't reinvent guessOrigReqUrl from
  //     `hnd/util/miscPlumbing.mjs`!

  const webSrv = srv.getLowLevelWebServer();

  const notifyListeningCmd = srv.popCfg('str', 'notify_server_listening', '');

  async function listen() {
    const aliasReason = (function whyAlias() {
      if (cfgPubUrl) { return 'config says'; }
      if (pubUrl !== origLsnDescr) { return 'we assume'; }
    }());
    const aliasHint = (aliasReason && (' which ' + aliasReason
      + ' is also ' + pubUrl));
    const descr = ('Gonna listen on ' + origLsnDescr + aliasHint);
    console.info(descr);
    await pify(cb => webSrv.listen(lsnSpec, cb))();
    console.info('Now listening.');
    spawnDetached(notifyListeningCmd);
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
    listen,
    publicBaseUrlNoSlash: noSlashPubUrl,
  });
  return srv;
};


Object.assign(EX, {

  fmtLsnUrl(lsnSpec) {
    let u = String(lsnSpec);
    u = u.replace(/^TCP (\w+:\/{2})127\.0\.0\.1(?=:|\/|$)/, '$1localhost');
    return u;
  },


});


export default EX;
