// -*- coding: utf-8, tab-width: 2 -*-

import searchBySubjectTarget from '../anno/searchBy/subjectTarget.mjs';
import fmtAnnosAsRssFeed from '../anno/fmtAnnosAsRssFeed.mjs';


const EX = async function approvalFeed(how) {
  const {
    feedTitle,
    linkTpl,
    prefix,
    req,
    srv,
  } = how;
  const annos = await searchBySubjectTarget({
    req,
    rowsLimit: (+how.rowsLimit || 100),
    srv,
    subjTgtSpec: prefix + (req.query.subj || '*'),
    untrustedOpt: { role: 'approver' },
  });
  return fmtAnnosAsRssFeed({
    annos,
    feedTitle,
    linkTpl,
    req,
    srv,
  });
};


export default EX;
