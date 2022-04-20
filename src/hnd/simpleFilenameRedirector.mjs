// -*- coding: utf-8, tab-width: 2 -*-

import plumb from './util/miscPlumbing.mjs';

const rgx = /^[\w\-]+(?:\.[\w\-]+)+$/;

const sfr = function makeSimpleFilenameRedirector(pattern) {
  const redir = plumb.makeRedirector(pattern);
  return function topLevelFileRedir(req) {
    if (rgx.test(req.params.filename)) { return redir(req); }
    req.next();
  };
};

export default sfr;
