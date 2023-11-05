// -*- coding: utf-8, tab-width: 2 -*-

import loMapValues from 'lodash.mapvalues';

import ubhdAnnoIdFmt from './ubhdAnnoIdFmt.mjs';

const vnSep = ubhdAnnoIdFmt.versionNumberSeparator;

const EX = {

  commonStaticAnnoMeta: {
    '@context': 'http://www.w3.org/ns/anno.jsonld',
  },

  constructLatestPubUrl(srv, idParts) {
    return (srv.publicBaseUrlNoSlash
      + (idParts.injectedBaseUrlExtension || '')
      + '/anno/'
      + idParts.baseId
    );
  },

  constructVersionNumberPubUrl(srv, idParts) {
    const latest = EX.constructLatestPubUrl(srv, idParts);
    return latest + vnSep + idParts.versNum;
  },

  add(srv, idParts, annoDetails) {
    const { baseId, versNum, versId } = idParts;
    const latestPubUrl = EX.constructLatestPubUrl(srv, idParts);
    if (!latestPubUrl.endsWith('/' + baseId)) {
      console.error('Inconsistent:', { latestPubUrl, baseId });
      throw new Error("Latest ID URL doesn't end with base ID");
    }
    const fullPubUrl = latestPubUrl + vnSep + versNum;
    if (versId !== undefined) {
      if (!fullPubUrl.endsWith('/' + versId)) {
        console.error('Inconsistent:', { fullPubUrl, versId });
        throw new Error("Current ID URL doesn't end with version ID");
      }
    }
    const addMeta = {
      id: fullPubUrl,
      'dc:isVersionOf': latestPubUrl,
      'iana:latest-version': latestPubUrl,
      'iana:version-history': latestPubUrl + '/versions',
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
