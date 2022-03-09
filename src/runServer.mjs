// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import cliEnvCfg from 'cfg-cli-env-180111-pmb/node.js';

import makeServer from './server.mjs';

(async function cliMain() {
  process.chdir('/');
  const { allCliOpt } = cliEnvCfg();
  console.debug('Server CLI options:', allCliOpt);

  const srv = makeServer({
    testfx_exit_soon_sec: 0,
    ...allCliOpt,
  });

  const exitSoon = +srv.popCfg('num | str', 'testfx_exit_soon_sec', 0);
  if (exitSoon) { setTimeout(() => srv.close(), exitSoon * 1e3); }

  srv.assertNoUnusedCfgOpts();
  await srv.listen();
}());
