// -*- coding: utf-8, tab-width: 2 -*-

import stampValueOrDate from './stampValueOrDate.mjs';


const EX = function parseStampRows(rows, origHow) {
  const how = (origHow || false);
  const lls = how.lowlineStamps;
  const stampsDict = {};
  rows.forEach(function eachRow(r) {
    const t = (r.st_type || r.type);
    const d = (t.startsWith('_') ? lls : stampsDict);
    if (!d) { return; }
    const v = stampValueOrDate(r);
    d[t] = v;
  });
  return stampsDict;
};


Object.assign(EX, {
  into(anno, stRows, how) { return Object.assign(anno, EX(stRows, how)); },
});


export default EX;
