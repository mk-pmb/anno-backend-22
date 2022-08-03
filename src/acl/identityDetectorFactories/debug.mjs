// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';

import readDataFile from 'read-data-file';


const msecPerMinute = 6e4;


function dummyGuestSession(report) {
  if (!report) { return false; }
  const soon = Date.now() + (10 * msecPerMinute);
  return {
    userId: '',
    renewalAvailableBefore: soon,
    sessionExpiryHardLimit: soon,
    ...report,
  };
}


const EX = {

  cookie(ctx) {
    const prefix = ctx.popDetail('nonEmpty str', 'cookie_name') + '=';
    const dumpAllCk = ctx.popDetail('bool', 'dump_all', false);
    return function detectIdentityCookie(req) {
      let report = false;
      const cookies = (req.header('cookie') || '').split(/;\s*/);
      if (dumpAllCk) { console.debug('IDP cookies:', { prefix, cookies }); }
      cookies.forEach(function maybe(ck) {
        if (report) { return; }
        if (!ck.startsWith(prefix)) { return; }
        const un = decodeURIComponent(ck.slice(prefix.length));
        if (!un) { return; }
        if (un === '-') {
          report = { userId: '' };
          return;
        }
        report = { userId: un };
      });
      return dummyGuestSession(report);
    };
  },

  static_from_file(ctx) {
    let srcPath = ctx.popDetail('nonEmpty str', 'path');
    if (srcPath.startsWith('cfg://')) {
      srcPath = pathLib.join(ctx.srv.configFiles.cfgDir, srcPath.slice(6));
      console.debug('IDP static_from_file: effective path:', srcPath);
    }
    return async function detectIdentityStaticFromFile() {
      try {
        const report = await readDataFile(srcPath);
        return dummyGuestSession(report);
      } catch (err) {
        if (err.code === 'ENOENT') { return false; }
        throw err;
      }
    };
  },




};


export default EX;
