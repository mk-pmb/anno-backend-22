// -*- coding: utf-8, tab-width: 2 -*-

import isStr from 'is-string';

import httpErrors from '../../../httpErrors.mjs';

const failBadRequest = httpErrors.badRequest.throwable;

function isNonEmptyStr(x) { return x && isStr(x) && x; }

const EX = function decideAuthorIdentity(ctx) {
  const {
    srv,
    // req,
    who,
    anno,
  } = ctx;

  if (!anno) { throw new Error('Cannot ' + EX.name + ' without anno.'); }
  const firstOrigCreator = EX.findFirstOrigCreator(anno);

  const accepted = (
    EX.fromExplicitAuthorId(firstOrigCreator, who)
    || EX.guessMissingAuthorId(srv, who)
  );
  if (accepted) { return accepted; }

  throw failBadRequest('Unable to detect or guess a valid author identity.');
};


Object.assign(EX, {

  findFirstOrigCreator(anno) {
    const orig = [].concat(anno.creator).filter(Boolean);
    const nOrig = orig.length;
    if (nOrig > 1) {
      throw failBadRequest('Multiple authors in "creator" not supported yet.');
    }
    const [crea1] = orig;
    return (crea1 || false);
  },

  fromExplicitAuthorId(crea1, who) {
    if (!crea1) { return; }
    const origAuthorId = crea1.id || crea1;
    if (!isNonEmptyStr(origAuthorId)) {
      const msg = 'When a creator field is given, it must carry an id.';
      throw failBadRequest(msg);
    }
    const knownIdentities = who.details.authorIdentities;
    const accepted = knownIdentities.byAgentId.get(origAuthorId);
    // console.debug('knownIdentities', knownIdentities);
    if (accepted) { return accepted; }
    const msg = ('The requested creator id was not found in'
      + ' your configured identities.');
    throw failBadRequest(msg);
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
