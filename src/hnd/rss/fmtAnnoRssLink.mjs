// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';

import linkSlots from './linkSlots.mjs';


const EX = function fmtAnnoRssLink(linkTpl, anno, meta) {
  const a = mustBe.tProp('Annotation field ', anno, 'nonEmpty str');
  a.annoIdUrl = a('id');
  [a.versId] = a.annoIdUrl.split('/').slice(-1);
  mustBe.nest('Anno version ID', a.versId);
  const m = mustBe.tProp('Meta field ', meta, 'nonEmpty str');
  return linkSlots(linkTpl, a, m);
};


export default EX;
