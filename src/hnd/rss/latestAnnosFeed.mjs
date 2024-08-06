// -*- coding: utf-8, tab-width: 2 -*-

import multiSearch from '../anno/searchBy/multiSearch.mjs';
import fmtAnnosAsRssFeed from '../anno/fmtAnnosAsRssFeed.mjs';


const EX = async function latestAnnosFeed(how) {
  const {
    feedTitle,
    linkTpl,
    overrideSearchTmpl,
    prefix,
    req,
    srv,
    staticMeta,
  } = how;
  const found = await multiSearch({
    srv,
    req,
    rowsLimit: (+how.rowsLimit || fmtAnnosAsRssFeed.defaultMaxItems),
    subjTgtSpec: prefix + (req.query.subj || '*'),
    overrideSearchTmpl,
    latestOnly: true,
    readContent: 'justTitles',
  });
  const annos = found.toFullAnnos();
  if (staticMeta) { annos.meta = { ...annos.meta, ...staticMeta }; }
  return fmtAnnosAsRssFeed({
    annos,
    feedTitle,
    linkTpl,
    req,
    srv,
  });
};


Object.assign(EX, {

  withForcedPresets(presets) {
    return function presetFeed(how) { return EX({ ...how, ...presets }); };
  },

  withVisibility(visibilityWhere) {
    return EX.withForcedPresets({ overrideSearchTmpl: { visibilityWhere } });
  },



});


export default EX;
