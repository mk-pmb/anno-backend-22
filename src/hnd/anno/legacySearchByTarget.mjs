// -*- coding: utf-8, tab-width: 2 -*-

import fmtAnnoCollection from './fmtAnnosAsSinglePageCollection.mjs';


const EX = async function legacySearchByTarget(srv, req, origTargetSpec) {
  const annos = [
    { '@context': 'http://www.w3.org/ns/anno.jsonld',
      type: ['Stub'],
      dummy: { origTargetSpec },
    },
  ];
  fmtAnnoCollection.replyToRequest(srv, req, { annos });
};


export default EX;
