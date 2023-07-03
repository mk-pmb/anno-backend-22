// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import qrystr from 'qrystr';
import splitStringOnce from 'split-string-or-buffer-once-pmb';

import libFmtAnnoCollection from '../fmtAnnosAsSinglePageCollection.mjs';
import httpErrors from '../../../httpErrors.mjs';

import bySubjectTarget from './subjectTarget.mjs';


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
  const annos = await annoListPr;
  libFmtAnnoCollection.replyToRequest(srv, req, { annos });
}


Object.assign(EX, {

  handlers: {

    subject_target(ctx, spp) {
      return fmtColl(ctx, bySubjectTarget(
        { subjTgtSpec: apacheSlashes(spp), ...ctx }));
    },

  },


});


export default EX;
