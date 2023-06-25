// -*- coding: utf-8, tab-width: 2 -*-

// import debugRequest from '../util/debugRequest.mjs';
import httpErrors from '../../httpErrors.mjs';
import legacySearchByTarget from './legacySearchByTarget.mjs';
import parseVersId from './parseVersionIdentifier.mjs';

const searchNotImpl = httpErrors.notImpl.explain(
  'Unsupported combination of search criteria.');
const errNoSuchAnno = httpErrors.noSuchAnno.throwable;


const EX = async function emptyIdGet(srv, req) {
  const queryEnts = Object.entries(req.query);
  const nQuery = queryEnts.length;
  if (!nQuery) { return parseVersId(errNoSuchAnno); }

  if (nQuery === 1) {
    const [qk, qv] = queryEnts[0];
    if (qk === '$target') { return legacySearchByTarget(srv, req, qv); }
  }

  return searchNotImpl(req);
};


export default EX;
