// -*- coding: utf-8, tab-width: 2 -*-
//
// This file is meant to give an overview of available data slots in RSS
// link templates. Implementation details belong in `fmtAnnoRssLink.mjs`.

const EX = function annoRssLinkSlot(t, a, m) {
  let u = t;
  u = u.replace(/%sv/g, m.orEmptyStr('serviceId'));
  u = u.replace(/%as/g, a.versId);
  u = u.replace(/%au/g, a.annoIdUrl);
  u = u.replace(/%hu/g, a('iana:version-history'));
  u = u.replace(/%lu/g, a('iana:latest-version'));
  return u;
};


export default EX;
