// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../../httpErrors.mjs';
import validateScopeUrl from '../util/validateScopeUrl.mjs';
// import tests from '../util/validateScopeUrl.test.mjs';

import whoamiHnd from './whoami.mjs';

const { fubar, genericDeny } = httpErrors.throwable;


const EX = function login(req) {
  const q = req.query;
  if (q && q.svc && q.redir) { return EX.maybeRedir(req); }
  return whoamiHnd.hndImpl(req, EX.whoamiOpt);
};


Object.assign(EX, {

  whoamiOpt: { detectorOpts: { occasion: 'session:login' } },

  maybeRedir(req) {
    const srv = req.getSrv();
    // tests.runTests(validateScopeUrl, srv);
    const { ok, bad } = validateScopeUrl(srv, req.query.svc, req.query.redir);
    if (bad) { throw genericDeny('Bad redirect URL: ' + bad); }
    if (!ok) { throw fubar('Redirect URL validation was inconclusive'); }
    req.nicerRedirect(ok);
  },


});



export default EX;
