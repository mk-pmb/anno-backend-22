// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';

const validateStampType = mustBe('nonEmpty str', 'stamp type');


function hasActualData(x) {
  if (x === null) { return false; }
  if (x === undefined) { return false; }
  const t = typeof x;
  if (t === 'object') { return (Object.keys(x).length >= 1); }
  return true;
}


const EX = function stampValueOrDate(stampRec) {
  let det = stampRec.st_detail;
  if (hasActualData(det)) { return det; }
  det = stampRec.detail;
  if (hasActualData(det)) { return det; }

  const type = validateStampType(stampRec.st_type || stampRec.type);
  let ts = (stampRec.st_effts || stampRec.st_at || stampRec.ts);
  if (Number.isFinite(ts)) { ts = new Date(ts * 1e3); }
  // console.debug('stampRec:', stampRec, { ts });
  if (type.startsWith('iana:')) {
    // iana: dates should be HTTP compliant
    return ts.toGMTString();
  }
  // For all other dates, we prefer ISO:
  return ts.toISOString();
};


export default EX;
