// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import qrystr from 'qrystr';
import splitStringOnce from 'split-string-or-buffer-once-pmb';

import fmtAnnoCollection from '../fmtAnnosAsSinglePageCollection.mjs';
import fmtAnnosAsRssFeed from '../fmtAnnosAsRssFeed.mjs';
import fmtAnnosAsIiif3 from '../fmtAnnosAsIiif3.mjs';
import httpErrors from '../../../httpErrors.mjs';

import multiSearch from './multiSearch.mjs';


const unsupportedCriterion = httpErrors.notImpl.explain(
  'Search criterion not implemented.').throwable;
const missingCriterionParam = httpErrors.noSuchResource.explain(
  'Search criterion requires a parameter.').throwable;
const outFmtUnsupported = httpErrors.notImpl.explain(
  'Requested output format is not currently supported.').throwable;


function apacheSlashes(sub) {
  let url = sub.join('/');

  // Some reverse proxies like our Apache normalize double slashes,
  // mangling the URL. We could document how to configure them properly,
  // … or we can just cheat-fix it:
  url = url.replace(/^(\w+:\/)(?!\/)/, '$1/');

  return url;
}


const rtrFormatLibs = {
  '': fmtAnnoCollection,
  iiif3: fmtAnnosAsIiif3,
};


const EX = async function searchBy(pathParts, req, srv) {
  const [critSpec, ...subPathParts] = pathParts;
  const [criterion, query] = (splitStringOnce(';', critSpec) || [critSpec]);
  const hnd = getOwn(EX.handlers, criterion);
  if (!hnd) { throw unsupportedCriterion(); }
  const untrustedOpt = (Boolean(query)
    && qrystr.parse(query.replace(/;/g, '&')));
  return hnd({ req, srv, untrustedOpt }, subPathParts);
};


async function fmtColl({ srv, req }, annoListPr) {
  const annos = (await annoListPr).toFullAnnos();
  const { outFmt, stopwatchDurations } = annos.meta;
  const stopwatchReport = String(stopwatchDurations);

  if (outFmt === 'rss') {
    const rssOpt = {
      feedTitle: 'Search',
      headerHints: stopwatchReport,
    };
    return fmtAnnosAsRssFeed({ ...rssOpt, annos, req, srv });
  }

  const fmtLib = getOwn(rtrFormatLibs, outFmt || '');
  if (!fmtLib) { throw outFmtUnsupported(); }
  const extraTopFields = {
    'skos:note': stopwatchReport,
  };
  fmtLib.replyToRequest(srv, req, { annos, extraTopFields });
}


function makeSubPathUrlSearch(pathKey, customOpt) {
  const opt = {
    latestVersionOnly: true,
    readContent: 'full',
    rssMaxItems: -1,
    ...customOpt,
  };
  const f = function subPathUrlSearch(ctx, subPathParts) {
    const sub = apacheSlashes(subPathParts);
    if (!sub) { throw missingCriterionParam(); }
    return fmtColl(ctx, multiSearch({ ...ctx, ...opt, [pathKey]: sub }));
  };
  Object.assign(f, { pathKey });
  return f;
}


Object.assign(EX, {


  handlers: {
    has_stamp: makeSubPathUrlSearch('searchAllWithStamp'),
    subject_target: makeSubPathUrlSearch('subjTgtSpec'),
  },


});


export default EX;
