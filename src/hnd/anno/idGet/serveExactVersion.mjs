// -*- coding: utf-8, tab-width: 2 -*-

import clientPrefersHtml from '../../util/guessClientPrefersHtml.mjs';
import fmtIanaHeaders from '../fmtIanaHeaders.mjs';
import genericAnnoMeta from '../redundantGenericAnnoMeta.mjs';
import httpErrors from '../../../httpErrors.mjs';
import sendFinalTextResponse from '../../../finalTextResponse.mjs';

import browserRedirect from './browserRedirect.mjs';
import lookupExactVersion from './lookupExactVersion.mjs';

const {
  methodNotAllowed,
} = httpErrors.throwable;


const EX = async function serveExactVersion(ctx) {
  const found = await lookupExactVersion(ctx);
  const { srv, req, idParts } = ctx;
  const headers = fmtIanaHeaders.onlyPrefixed(found.annoDetails);
  const ftrOpt = { type: 'annoLD', headers };

  const { accept } = req.headers;
  const wantText = ((accept || '').startsWith('text/plain,')
    || req.debugOpt().text);
  if (wantText) { ftrOpt.type = 'plain'; }

  if (req.method === 'HEAD') { return sendFinalTextResponse(req, '', ftrOpt); }
  if (req.method !== 'GET') { throw methodNotAllowed(); }

  const earlyFields = {};
  if (clientPrefersHtml(req)) {
    const redirUrl = browserRedirect.fmtUrl(found, ctx);
    if (redirUrl) {
      if (req.debugOpt().noredir) {
        earlyFields['as22debug:would_redirect_to'] = redirUrl;
      } else {
        ftrOpt.redirTo = redirUrl; /*
        We do not use req.res.redirect() because it would send a generic
        HTML body with a fallback link to the redirect URL, whereas the
        FTR redirTo allows us to still send the annotation data.
        This way, annotations are still easy to debug in browsers that
        support manual approval of redirects. */
      }
    }
  }
  const fullAnno = genericAnnoMeta.add(srv, idParts, found.annoDetails);
  const reply = { ...earlyFields, ...fullAnno };
  return sendFinalTextResponse.json(req, reply, ftrOpt);
};


export default EX;
