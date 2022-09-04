// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../../httpErrors.mjs';
import ubhdAnnoIdFmt from './ubhdAnnoIdFmt.mjs';

const failNoSuchAnno = httpErrors.noSuchAnno.throwable;

const replySep = ubhdAnnoIdFmt.legacyReplySeparator;

const versIdRgx = /^([A-Za-z0-9_\-]{10,36})((?:\.[\d\.]+)*)(?:\~(\d+)|)$/;


const EX = function parseVersId(versId) {
  if (!versId) { throw failNoSuchAnno('No anno ID given'); }
  const m = versIdRgx.exec(versId);
  if (!m) { throw failNoSuchAnno('Unsupported anno ID format'); }
  const parts = {
    versId,
    mongoId: m[1],
    replySuf: (m[2] || ''),
    versNum: (+m[3] || 0),
  };
  parts.baseId = parts.mongoId + parts.replySuf;
  parts.replyNums = parts.replySuf.split(replySep).slice(1).map(n => +n);
  return parts;
};


export default EX;
