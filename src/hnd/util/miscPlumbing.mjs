// -*- coding: utf-8, tab-width: 2 -*-

import deviate from 'deviate';


const EX = {

  legacyMultiArg(legacyHandlerFunc) {
    function hnd(req) { return legacyHandlerFunc(req, req.res, req.next); }
    return Object.assign(hnd, { legacyHandlerFunc });
  },

  makeRedirector(pattern) {
    const redir = EX.legacyMultiArg(deviate(pattern));
    function hnd(req) {
      req.logCkp('Redirecting:', '->', pattern);
      return redir(req);
    }
    return hnd;
  },

  getFirstAsteriskUrlPart(req) {
    return String(req.params['0'] // Yes, express really uses a string.
      || '');
  },

  getFirstAsteriskDirs(req) {
    return EX.getFirstAsteriskUrlPart(req).split('/');
  },

  guessOrigReqUrl(srv, req) {
    return srv.publicBaseUrlNoSlash + req.originalUrl;
  },

};

export default EX;
