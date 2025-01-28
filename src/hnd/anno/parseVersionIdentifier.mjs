// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../../httpErrors.mjs';
import ubhdAnnoIdFmt from './ubhdAnnoIdFmt.mjs';

const failNoSuchAnno = httpErrors.noSuchAnno.throwable;

const replySep = ubhdAnnoIdFmt.legacyReplySeparator;

const versIdRgx = /^([A-Za-z0-9_\-]{10,36})((?:\.[\d\.]+)*)(?:\~(\d+)|)$/;

function orf(x) { return x || false; }


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


function maybeFullUrl(s) { return s.includes(':') || s.includes('/'); }


Object.assign(EX, {

  errNonLocalVersId: 'Currently, only local anno IDs are supported.',
  wrongBaseUrlHint: (' Ensure that `anno_public_baseurl`'
    + ' is set correctly in your config'
    + ' and matches the annotation(s) in your database.'),


  fromLocalUrl(srv, errInvalidAnno, urlOrVersId) {
    let versId = urlOrVersId;
    let baseUrl = srv.publicBaseUrlNoSlash + '/';

    (function maybeStripOrAdjustBaseUrl() {
      if (!maybeFullUrl(versId)) { return; }
      let msg = EX.errNonLocalVersId;
      if (versId.startsWith(baseUrl)) {
        const v = versId.slice(baseUrl.length);
        const m = orf(/^(?:as\/\w+\/|)anno\//.exec(v))[0];
        if (m) {
          baseUrl += m;
          versId = v.slice(m.length);
          return;
        }
      } else { // i.e. not versId.startsWith(baseUrl)
        msg += EX.wrongBaseUrlHint;
      }
      const err = errInvalidAnno(msg);
      err.versId = versId;
      throw err;
    }());

    const p = EX(errInvalidAnno, versId);
    p.url = baseUrl + p.versId;
    return p;
  },

});


export default EX;
