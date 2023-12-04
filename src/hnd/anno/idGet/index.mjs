// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../../../httpErrors.mjs';

import findLatest from './findLatestVersionNumsForBaseId.mjs';
import listVersions from './listVersions.mjs';
import serveExactVersion from './serveExactVersion.mjs';


const {
  noSuchAnno,
  noSuchResource,
} = httpErrors.throwable;


const EX = function idGet(ctx) {
  const { subRoute } = ctx;
  if (ctx.idParts.versNum) {
    if (subRoute) { throw noSuchAnno(); }
    return serveExactVersion(ctx);
  }
  if (!subRoute) { return findLatest.redirToLatestVersion(ctx); }
  if (subRoute === 'versions') { return listVersions(ctx); }
  throw noSuchResource();
};


// Object.assign(EX, {
// });


export default EX;
