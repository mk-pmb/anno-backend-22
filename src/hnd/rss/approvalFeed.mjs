// -*- coding: utf-8, tab-width: 2 -*-

import multiSearch from '../anno/searchBy/multiSearch.mjs';
import fmtAnnosAsRssFeed from '../anno/fmtAnnosAsRssFeed.mjs';


const EX = async function approvalFeed(how) {
  const {
    feedTitle,
    linkTpl,
    prefix,
    req,
    srv,
  } = how;
  req.asRoleName = 'approver';
  const found = await multiSearch({
    srv,
    req,
    rowsLimit: (+how.rowsLimit || fmtAnnosAsRssFeed.defaultMaxItems),
    subjTgtSpec: prefix + (req.query.subj || '*'),
    overrideSearchTmpl: { visibilityWhere: '#visibilityUndecided' },
    latestOnly: true,
    readContent: 'justTitles',
  });
  const annos = found.toFullAnnos();
  return fmtAnnosAsRssFeed({
    annos,
    feedTitle,
    linkTpl,
    req,
    srv,
  });
};


export default EX;
