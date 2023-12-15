// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import qrystr from 'qrystr';
import splitStringOnce from 'split-string-or-buffer-once-pmb';

import libFmtAnnoCollection from '../fmtAnnosAsSinglePageCollection.mjs';
import fmtAnnosAsRssFeed from '../fmtAnnosAsRssFeed.mjs';
import httpErrors from '../../../httpErrors.mjs';

import multiSearch from './multiSearch.mjs';


const unsupportedCriterion = httpErrors.notImpl.explain(
  'Search criterion not implemented.').throwable;


function apacheSlashes(sub) {
  let url = sub.join('/');

  // Some reverse proxies like our Apache normalize double slashes,
  // mangling the URL. We could document how to configure them properly,
  // … or we can just cheat-fix it:
  url = url.replace(/^(\w+:\/)(?!\/)/, '$1/');

  return url;
}


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
  const { outFmt } = annos.meta;

  if (outFmt === 'rss') {
    const rssOpt = {
      feedTitle: 'Search',
      linkTpl: '%au',
    };
    return fmtAnnosAsRssFeed({ ...rssOpt, annos, req, srv });
  }

  libFmtAnnoCollection.replyToRequest(srv, req, { annos });
}


function makeSubPathUrlSearch(pathKey, customOpt) {
  const opt = {
    latestOnly: true,
    readContent: 'full',
    rssMaxItems: -1,
    ...customOpt,
  };
  const f = function subPathUrlSearch(ctx, subPathParts) {
    const sub = apacheSlashes(subPathParts);
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
