// -*- coding: utf-8, tab-width: 2 -*-
/*

The purpose of this module is to ensure we register the same kinds of anno
relations, and all of them, independent of which way we use to insert the
data into the database.

*/

import categorizeTargets from '../categorizeTargets.mjs';

const isNum = Number.isFinite;


const EX = function fmtRelRecs(how) {
  // "srv" should be just for srv.publicBaseUrlNoSlash.
  // "knownMeta" should be cached pre-determined meta or "false".
  const {
    anno,
    srv,
    baseId,
    versNum,
  } = how;
  let {
    tgtCateg,
  } = how;
  if (!tgtCateg) { tgtCateg = categorizeTargets(srv, anno); }

  const idPartsValid = (baseId && isNum(versNum));
  if (!idPartsValid) {
    throw new Error('Invalid anno base ID or version!');
  }

  const relRecs = [];
  categorizeTargets.dbRelNames.forEach(function eachRelType(relTypeInfo) {
    const urlsList = tgtCateg[relTypeInfo.reportField];
    const rel = relTypeInfo.dbRelName;
    urlsList.forEach(function addUrl(url) {
      relRecs.push({ base_id: baseId, version_num: versNum, rel, url });
    });
  });
  return relRecs;
};



export default EX;
