// -*- coding: utf-8, tab-width: 2 -*-

import genericFTR from 'express-final-text-response-pmb';
import loggers from 'express-final-text-response-pmb/extras/req.logCkp.mjs';


const opt = {
  ...loggers,
  knownMimeTypes: {
    ...genericFTR.dfCfg.knownMimeTypes,
    annoLD: (process.env.as22_debugfx_mime_annold_plain_text
      ? 'text/plain'
      : 'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"'
    ),
  },
};


const EX = genericFTR.customize(opt);

export default EX;
