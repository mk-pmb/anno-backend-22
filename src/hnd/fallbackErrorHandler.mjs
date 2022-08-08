// -*- coding: utf-8, tab-width: 2 -*-

import 'exit-code'; // for process.exitCode

import loMapValues from 'lodash.mapvalues';

import httpErrors from '../httpErrors.mjs';


const baseHandler = httpErrors.handleUnknownError;

const cfgPrefix = 'max_web_errors_';
const cfgKeys = loMapValues({
  max: 'until_quit',
  hardExitCode: 'hard_exit_code',
  delaySec: 'quit_delay_sec',
}, v => cfgPrefix + v);
const logTopic = cfgKeys.max;


const EX = {

  configDefaults: {
    [cfgKeys.max]: 0, // 0 = keep going
    [cfgKeys.hardExitCode]: 5, // when > 0, error code for unclean hard exit.
    [cfgKeys.delaySec]: 2,
  },


  decide(popCfg, webSrv) {
    const cfg = loMapValues(cfgKeys, v => +popCfg('num | str', v, 0));
    console.debug('D:', logTopic, 'config:', cfg);
    const hnd = (cfg.max ? EX.makeWrapper(cfg, webSrv) : baseHandler);
    return hnd;
  },


  makeWrapper(cfg, webSrv) {
    const { delaySec, hardExitCode } = cfg;
    let remain = cfg.max;

    function hardExitNow() {
      console.debug('D:', logTopic, 'hard exit.');
      // eslint-disable-next-line n/no-process-exit
      process.exit(hardExitCode);
    }

    function quitNow() {
      console.debug('D:', logTopic, 'closing server.');
      process.exitCode = 2;
      webSrv.close();
      if (hardExitCode) { setTimeout(hardExitNow, 200).unref(); }
    }

    function onError() {
      remain -= 1;
      console.debug('D:', logTopic, { remain });
      if (remain >= 1) { return; }
      setTimeout(quitNow, delaySec * 1e3);
    }

    const wr = function countErrorsMaybeQuit(err, req, res, next) {
      if (remain && err) { onError(); }
      // We use this verbose way of forwarding the other arguments because the
      // Express API requires seeing exactly four arguments for error handlers.
      return baseHandler(err, req, res, next);
    };
    return wr;
  },

};


export default EX;
