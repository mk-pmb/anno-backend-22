// -*- coding: utf-8, tab-width: 2 -*-

import loMapValues from 'lodash.mapvalues';

import ubhdAnnoIdFmt from './ubhdAnnoIdFmt.mjs';

const vnSep = ubhdAnnoIdFmt.versionNumberSeparator;

const EX = {

  commonStaticAnnoMeta: {
    '@context': 'http://www.w3.org/ns/anno.jsonld',
  },

  add(srv, idParts, annoDetails) {
    const { baseId, versNum } = idParts;
    const latestPubUrl = (srv.publicBaseUrlNoSlash
      + '/anno/'
      + baseId
    );
    const fullPubUrl = latestPubUrl + vnSep + versNum;
    const addMeta = {
      id: fullPubUrl,
      'dc:isVersionOf': latestPubUrl,
    };
    if (versNum >= 2) {
      addMeta['dc:replaces'] = latestPubUrl + vnSep + (versNum - 1);
    }
    const fullAnno = {
      ...EX.commonStaticAnnoMeta,
      ...addMeta,
      ...annoDetails,
    };
    return fullAnno;
  },

  mustPopAllStatic(pop) {
    loMapValues(EX.commonStaticAnnoMeta, function verify(want, key) {
      const actual = pop('undef | str', key);
      if (actual === want) { return; }
      const msg = ('Unsupported value for field "' + key
        + '", expected ' + JSON.stringify(want));
      throw new Error(msg);
    });
  },

};


export default EX;
