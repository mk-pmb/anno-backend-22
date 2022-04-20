// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import parseCliArgs from 'cfg-cli-env-180111-pmb/node.js';
/* parseCliArgs: because we do NOT use the "env" part.
    Environment options are dealt with in `server.mjs`,
    using another module.
*/

import makeServer from './server.mjs';

(async function cliMain() {
  process.chdir('/');

  const { allCliOpt } = parseCliArgs(); // see import above!
  console.debug('Server CLI options:', allCliOpt);

  const srv = await makeServer({
    testfx_exit_soon_sec: 0,
    ...allCliOpt,
  });

  process.once('SIGINT', () => srv.close());

  const exitSoon = +srv.popCfg('num | str', 'testfx_exit_soon_sec', 0);
  if (exitSoon) {
    setTimeout(function prepareToQuit() {
      console.debug('Closing server due to testfx_exit_soon_sec.');
      srv.close();
    }, exitSoon * 1e3);
  }

  srv.assertNoUnusedCfgOpts();
  await srv.listen();
}());
