// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import parseCliOpt from 'minimist';
import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be';

import makeServer from './server.mjs';

(async function cliMain() {
  process.chdir('/');
  const allCliOpt = parseCliOpt(process.argv.slice(2));
  console.debug('Server CLI options:', allCliOpt);
  const cliOpt = objPop(allCliOpt, { mustBe }).mustBe;
  cliOpt('empty ary', '_');

  const testFx = cliOpt('str', 'testfx', '');

  cliOpt.expectEmpty('Unsupported CLI option(s)');

  const srv = makeServer();
  await srv.listen();
  // eslint-disable-next-line n/no-process-exit
  if (testFx === 'exitSoon') { setTimeout(() => process.exit(0), 1e3); }
}());
