// -*- coding: utf-8, tab-width: 2 -*-

function hasActualData(x) {
  if (x === null) { return false; }
  if (x === undefined) { return false; }
  const t = typeof x;
  if (t === 'object') { return (Object.keys(x).length >= 1); }
  return true;
}


const EX = function stampValueOrDate(stampRec) {
  const det = stampRec.st_detail;
  if (hasActualData(det)) { return det; }
  const {
    st_type: type,
    st_at: at,
    st_effts: effts,
  } = stampRec;
  const ts = (effts || at);
  if (type.startsWith('iana:')) {
    // iana: dates should be HTTP compliant
    return ts.toGMTString();
  }
  // For all other dates, we prefer ISO:
  return ts.toISOString();
};


export default EX;
