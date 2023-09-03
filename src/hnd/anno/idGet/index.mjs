// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../../../httpErrors.mjs';

import listVersions from './listVersions.mjs';
import lookupExactVersion from './lookupExactVersion.mjs';
import minis from './minis.mjs';
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
  if (!subRoute) { return minis.redirToLatestVersion(ctx); }
  if (subRoute === 'versions') { return listVersions(ctx); }
  throw noSuchResource();
};


Object.assign(EX, {

  lookupExactVersion,
  lookupLatestVersionNum: minis.lookupLatestVersionNum,

});


export default EX;
