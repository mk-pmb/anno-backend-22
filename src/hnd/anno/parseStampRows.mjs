// -*- coding: utf-8, tab-width: 2 -*-

import stampValueOrDate from './stampValueOrDate.mjs';


const EX = function parseStampRows(rows, origHow) {
  const how = (origHow || false);
  const d = {};
  rows.forEach(function eachRow(r) {
    const t = (r.st_type || r.type);
    if (t.startsWith('_')) {
      const llf = how.lowlineFields;
      const ok = (llf && ((llf === true)
        || (llf.test && llf.test(t))
      ));
      if (!ok) { return; }
    }
    const v = stampValueOrDate(r);
    d[t] = v;
  });
  return d;
};


Object.assign(EX, {
  into(anno, stRows, how) { return Object.assign(anno, EX(stRows, how)); },
});


export default EX;
