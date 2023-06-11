// -*- coding: utf-8, tab-width: 2 -*-

import stampValueOrDate from './stampValueOrDate.mjs';


const EX = function parseStampRows(rows) {
  return Object.fromEntries(rows.map(
    r => [(r.st_type || r.type), stampValueOrDate(r)]));
};


Object.assign(EX, {
  into(anno, stRows) { return Object.assign(anno, EX(stRows)); },
});


export default EX;
