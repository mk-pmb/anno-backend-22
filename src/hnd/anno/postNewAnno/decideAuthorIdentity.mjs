// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import isStr from 'is-string';

import httpErrors from '../../../httpErrors.mjs';

const {
  badRequest,
  notImplemented,
} = httpErrors.throwable;

function isNonEmptyStr(x) { return x && isStr(x) && x; }
function orf(x) { return x || false; }


const EX = function decideAuthorIdentity(ctx) {
  const {
    srv,
    who,
    anno,
  } = ctx;
  if (!anno) { throw new Error('Cannot ' + EX.name + ' without anno.'); }

  if (anno.creator) {
    const firstOrigCreator = EX.findFirstOrigCreator(anno);
    const author = EX.fromExplicitAuthorId(firstOrigCreator, who);
    return author;
  }

  const fallbackAgent = EX.guessMissingAuthorId(srv, who);
  if (fallbackAgent) {
    return {
      agent: fallbackAgent,
      authorized: true,
      // isFallback: true // nope, rather check if anno.creator is truthy
    };
  }

  throw badRequest('Unable to detect or guess a valid author identity.');
};


Object.assign(EX, {

  findFirstOrigCreator(anno) {
    const orig = arrayOfTruths(anno.creator);
    const nOrig = orig.length;
    if (nOrig > 1) {
      throw notImplemented('Multiple authors in "creator" not supported yet.');
    }
    const [crea1] = orig;
    return orf(crea1);
  },

  fromExplicitAuthorId(crea1, who) {
    if (!crea1) { return false; }
    if (isStr(crea1)) { return EX.fromExplicitAuthorId({ id: crea1 }, who); }
    const origAuthorId = crea1.id;
    if (!isNonEmptyStr(origAuthorId)) {
      throw badRequest('When a creator field is given, it must carry an id.');
    }
    const knownIdentities = who.details.authorIdentities;
    // console.debug('knownIdentities', knownIdentities);
    const accepted = knownIdentities.byAgentId.get(origAuthorId);
    return { agent: orf(accepted || crea1), authorized: !!accepted };
  },

  guessMissingAuthorId(srv, who) {
    const fallbackIds = srv.lusrmgr.missingAuthorFallbackIdentityKeys;
    if (!fallbackIds) { return; }
    const knownIdentities = who.details.authorIdentities;
    const found = fallbackIds.find(k => knownIdentities.has(k));
    return (found && knownIdentities.get(found));
  },

});




export default EX;
