// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../../httpErrors.mjs';
import ubhdAnnoIdFmt from './ubhdAnnoIdFmt.mjs';

const failNoSuchAnno = httpErrors.noSuchAnno.throwable;

const replySep = ubhdAnnoIdFmt.legacyReplySeparator;

const versIdRgx = /^([A-Za-z0-9_\-]{10,36})((?:\.[\d\.]+)*)(?:\~(\d+)|)$/;


function parseVersNum(s, e) {
  if (s === undefined) { return 0; }
  const v = (+s || 0);
  if (v >= 1) { return v; }
  throw e('Invalid version number');
}


const EX = function parseVersId(errInvalidAnno, versId) {
  if (!versId) { throw errInvalidAnno('No anno ID given'); }
  const m = versIdRgx.exec(versId);
  if (!m) { throw failNoSuchAnno('Unsupported anno ID format'); }
  const versNum = parseVersNum(m[3], errInvalidAnno);
  const parts = {
    versId,
    mongoId: m[1],
    replySuf: (m[2] || ''),
    versNum,
  };
  parts.baseId = parts.mongoId + parts.replySuf;
  parts.replyNums = parts.replySuf.split(replySep).slice(1).map(n => +n);
  return parts;
};


Object.assign(EX, {

  fromLocalUrl(srv, errInvalidAnno, url) {
    let versId = url;
    const baseUrl = srv.publicBaseUrlNoSlash + '/anno/';
    if (versId.startsWith(baseUrl)) { versId = url.slice(baseUrl.length); }
    if (versId.includes(':') || versId.includes('/')) {
      throw errInvalidAnno('Currently, only local anno IDs are supported.');
    }
    const p = EX(errInvalidAnno, versId);
    p.url = baseUrl + p.versId;
    return p;
  },

});


export default EX;
