// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import cliEnvCfg from 'cfg-cli-env-180111-pmb/node.js';
import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be';

import makeServer from './server.mjs';

(async function cliMain() {
  process.chdir('/');
  const { allCliOpt } = cliEnvCfg();
  console.debug('Server CLI options:', allCliOpt);
  const cliOpt = objPop(allCliOpt, { mustBe }).mustBe;

  const testFx = cliOpt('str', 'testfx', '');

  // cliOpt.expectEmpty('Unsupported CLI option(s)');

  const srv = makeServer(allCliOpt);
  await srv.listen();
  // eslint-disable-next-line n/no-process-exit
  if (testFx === 'exitSoon') { setTimeout(() => process.exit(0), 1e3); }
}());
