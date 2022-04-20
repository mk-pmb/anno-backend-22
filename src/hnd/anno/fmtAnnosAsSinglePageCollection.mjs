// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';

import sendFinalTextResponse from '../../finalTextResponse.mjs';
import plumb from '../util/miscPlumbing.mjs';


const EX = function fmtAnnosAsSinglePageCollection(how) {
  const {
    annos,
    canonicalUrl,
    ...unexpected
  } = how;
  mustBe.keyless('Unexpected options', unexpected);
  mustBe.ary('Annotations list', annos);
  mustBe.nest('canonicalUrl', canonicalUrl);

  const nTotal = annos.length;
  const coll = {
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    type: [
      'BasicContainer',
      'AnnotationCollection',
    ],
    id: canonicalUrl,
    total: nTotal,
    first: {
      id: canonicalUrl,
      startIndex: 0,
      items: annos,
    },
    last: { id: canonicalUrl },
  };
  return coll;
};


function replyToRequest(req, how) {
  if (!how.canonicalUrl) {
    const canonicalUrl = plumb.guessOrigReqUrl(req);
    return replyToRequest(req, { ...how, canonicalUrl });
  }
  return sendFinalTextResponse.json(req, EX(how));
}


Object.assign(EX, {
  replyToRequest,
});


export default EX;
