// -*- coding: utf-8, tab-width: 2 -*-

import clientPrefersHtml from '../../util/guessClientPrefersHtml.mjs';
import genericAnnoMeta from '../redundantGenericAnnoMeta.mjs';
import sendFinalTextResponse from '../../../finalTextResponse.mjs';

import browserRedirect from './browserRedirect.mjs';
import lookupExactVersion from './lookupExactVersion.mjs';


const EX = async function serveExactVersion(ctx) {
  const found = await lookupExactVersion(ctx);
  const { srv, req, idParts } = ctx;
  const headers = {};
  const ftrOpt = { type: 'annoLD', headers };
  Object.entries(found.annoDetails).forEach(function sendIanaHeaders([k, v]) {
    if (!k.startsWith('iana:')) { return; }
    const h = k.slice(5).replace(/\b[a-z]/g, m => m.toUpperCase());
    headers[h] = v;
  });

  if (clientPrefersHtml(req)) {
    const redirUrl = browserRedirect.fmtUrl(found, ctx);
    if (redirUrl) { ftrOpt.redirTo = redirUrl; }
    /*
      We do not use req.res.redirect() because it would send a generic
      HTML body with a fallback link to the redirect URL, whereas the
      FTR redirTo allows us to still send the annotation data.
      This way, annotations are still easy to debug in browsers that
      support manual approval of redirects.
    */
  }
  const fullAnno = genericAnnoMeta.add(srv, idParts, found.annoDetails);
  return sendFinalTextResponse.json(req, fullAnno, ftrOpt);
};


export default EX;
