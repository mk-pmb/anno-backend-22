// -*- coding: utf-8, tab-width: 2 -*-

import genericFTR from 'express-final-text-response-pmb';
import loggers from 'express-final-text-response-pmb/extras/req.logCkp.mjs';


const debugFxPreferPlainText = process.env.as22_debugfx_mime_annold_plain_text;

const permaFtrOpt = {
  ...loggers,
  knownMimeTypes: {
    ...genericFTR.dfCfg.knownMimeTypes,
    annoLD: 'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"',
  },
};


const EX = genericFTR.customize(permaFtrOpt);
const origJsonMthd = EX.json;

function debugFxDecidePlainText(req, opt) {
  if (opt.redirTo) { return true; } /*
    Work-around for Waterfox's network debugger, which would otherwise try
    to parse the _destination_'s content as JSON (if the Content-Type of the
    redirect is JSON). This is especially bad when WF is configured to ask
    for permission before redirecting, because then tries to parse the empty
    string instead and won't show the anno.
    */
  if (opt.type && (opt.type !== 'annoLD')) { return; }
  if (debugFxPreferPlainText) { return true; }
  if (req.debugOpt().text) { return true; }
}


Object.assign(EX, {

  json(req, anno, ftrOpt) {
    const opt = { ...ftrOpt };
    if (debugFxDecidePlainText(req, opt)) { opt.type = 'plain'; }
    return origJsonMthd.call(this, req, anno, opt);
  },

});


export default EX;
