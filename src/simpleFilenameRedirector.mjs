// -*- coding: utf-8, tab-width: 2 -*-

import makeRedirector from 'deviate';

const rgx = /^[\w\-]+(?:\.[\w\-]+)+$/;

const sfr = function makeSimpleFilenameRedirector(pattern) {
  const redir = makeRedirector(pattern);
  return function topLevelFileRedir(req) {
    if (rgx.test(req.params.filename)) { redir(req, req.res, req.next); }
    req.next();
  };
};

export default sfr;
