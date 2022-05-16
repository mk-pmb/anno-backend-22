// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../../httpErrors.mjs';
import ubhdAnnoIdFmt from './ubhdAnnoIdFmt.mjs';

const errNoId = httpErrors.noSuchAnno.explain('No anno ID given');
const errBadId = httpErrors.noSuchAnno.explain('Unsupported anno ID format');

const replySep = ubhdAnnoIdFmt.legacyReplySeparator;

const versIdRgx = /^([A-Za-z0-9_\-]{10,36})(?:\.(\d+)|)(?:\~(\d+)|)$/;


const EX = function parseVersId(versId) {
  if (!versId) { throw errNoId.throwable(); }
  const m = versIdRgx.exec(versId);
  if (!m) { throw errBadId.throwable(); }
  const legacyReplyNum = (+m[2] || 0);
  const parts = {
    baseId: m[1],
    legacyMongoId: m[1],
    legacyReplyNum,
    versNum: (+m[3] || 0),
  };
  if (parts.legacyReplyNum) { parts.baseId += replySep + legacyReplyNum; }
  return parts;
};


export default EX;
