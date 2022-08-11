// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import parseCliArgs from 'cfg-cli-env-180111-pmb/node.js';
/* parseCliArgs: because we do NOT use the "env" part.
    Environment options are dealt with in `server.mjs`,
    using another module.
*/

import makeServer from './server.mjs';


const exitSoonSignalNames = [
  'SIGINT',
  'SIGTERM',
];


(async function cliMain() {
  process.chdir('/');

  const { allCliOpt } = parseCliArgs(); // see import above!
  console.debug('Server CLI options:', allCliOpt);

  const srv = await makeServer({
    testfx_exit_soon_sec: 0,
    alive_pid_intv_sec: 0,
    ...allCliOpt,
  });

  const alivePidIntvSec = +srv.popCfg('num | str', 'alive_pid_intv_sec', 0);
  if (alivePidIntvSec) {
    const msg = 'Still alive! pid = ' + process.pid;
    setInterval(function stillAlive() { console.debug(msg); },
      alivePidIntvSec * 1e3).unref();
  }

  function closeSrv(reason) {
    console.debug('Closing server due to', reason);
    srv.close();
  }
  exitSoonSignalNames.forEach(s => process.once(s, closeSrv.bind(null, s)));

  const exitSoon = +srv.popCfg('num | str', 'testfx_exit_soon_sec', 0);
  if (exitSoon) {
    setTimeout(closeSrv.bind(null, 'testfx_exit_soon_sec'),
      exitSoon * 1e3).unref();
  }

  srv.initialConfigDone();
  await srv.listen();
}());
