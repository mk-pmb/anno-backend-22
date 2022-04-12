// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../../httpErrors.mjs';


const baseIdRgx = /^[A-Za-z0-9_\-]{10,36}$/;

const EX = function verifyBaseIdFormat(baseId) {
  if (baseId) {
    const idMatch = (baseIdRgx.exec(baseId) || false);
    if (idMatch[0] === baseId) { return baseId; }
  }
  const msg = ('Annotation not found: '
    + (baseId ? 'Unsupported ID format' : 'No ID given'));
  throw httpErrors.throwable(404, msg);
};


export default EX;
