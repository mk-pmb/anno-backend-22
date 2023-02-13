// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../../../httpErrors.mjs';
import idGetHnd from '../idGet.mjs';
import parseVersId from '../parseVersionIdentifier.mjs';


const {
  badRequest,
} = httpErrors.throwable;


const EX = async function checkVersionModifications(ctx) {
  const {
    anno,
    idParts,
    req,
    srv,
  } = ctx;
  const versOf = anno['dc:isVersionOf'];
  if (!versOf) { return; }

  const { baseId } = parseVersId.fromLocalUrl(srv, versOf);
  idParts.baseId = baseId;
  console.debug({ baseId });
  idParts.versNum = await idGetHnd.lookupLatestVersionNum(srv, req, idParts);
  console.debug({ versNum: idParts.versNum });
  const oldAnnoDetails = await idGetHnd.lookupExactVersion(srv, req, idParts);
  idParts.versNum += 1;

  console.debug({ idParts }, oldAnnoDetails);
  throw badRequest('Stub!');
};


export default EX;
