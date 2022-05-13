/* -*- coding: utf-8, tab-width: 2 -*-

Simple site-specific additions may be implemented by directly extending
`../../wwwpub` or by pointing config option `wwwpub_path` to an extended
copy thereof. However, both approaches are limited to static files served
with default settings.

For more complex additions like a registration form, it's preferable to
have a reserved URL namespace which a reverse proxy can delegate to a
separate webspace with advanced features like CGI support.

The reserved namespaces are defined below in `urlTopDirs`.

*/

import httpErrors from '../httpErrors.mjs';

const msg = 'This URL namespace is reserved for site-specific extensions.';
const hnd = httpErrors.noSuchResource.explain(msg);

const urlTopDirs = [
  // The leading slash in patterns are here for clarity.
  // For some router modules, they may also be required.

  '/cgi-bin',
  '/local',
  '/site',
];

const EX = {
  installRoutes(rt) {
    urlTopDirs.forEach(function register(pat) {
      rt.use(pat, hnd);
      rt.use(pat + '/*', hnd);
    });
  },
};


export default EX;
