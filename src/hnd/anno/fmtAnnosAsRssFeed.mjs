// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import dateFmtRfc822 from 'rfc822-date';
import mustBe from 'typechecks-pmb/must-be';
import xmlenc from 'xmlunidefuse';

import sendFinalTextResponse from '../../finalTextResponse.mjs';

import fmtAnnoRssLink from '../rss/fmtAnnoRssLink.mjs';


function orf(x) { return x || false; }
function xmlStrTag(t, c) { return `    <${t}>${xmlenc(c)}</${t}>\n`; }


function fmtAnnoRssDate(x, a) {
  let d = x;
  if ((!d) && (d !== 10)) {
    console.warn('W: fmtAnnoRssDate: Invalid date:', d, 'in anno', a.id);
    d = 0;
  }
  if (!d.getDay) { d = new Date(d); }
  return dateFmtRfc822(d);
}


const EX = function fmtAnnosAsRssFeed(how) {
  const {
    annos,
    feedTitle,
    headerHints,
    linkTpl: origLinkTpl,
    req,
    srv,
    ...unexpected
  } = how;
  mustBe.keyless('Unexpected options', unexpected);
  mustBe.ary('Annotations list', annos);

  const meta = orf(annos.meta);
  let lnk = origLinkTpl || EX.defaultLinkTpl(meta);
  if (lnk.startsWith('/')) { lnk = srv.publicBaseUrlNoSlash + lnk; }

  const dateFieldName = (how.dateFieldName || 'created');
  const rss = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<rss version="2.0"><channel>',
    xmlStrTag('title', feedTitle || 'Annotations'),
    ...arrayOfTruths(headerHints).map(h => '  <!-- ' + xmlenc(h) + ' -->'),
    ...annos.filter(Boolean).map(a => ('  <item>\n'
      + xmlStrTag('title', a['dc:title'] || a.title || '(untitled)')
      + xmlStrTag('link', fmtAnnoRssLink(lnk, a, meta))
      + xmlStrTag('pubDate', fmtAnnoRssDate(a[dateFieldName], a))
      + '  </item>')),
    '</channel>',
    '</rss>',
    ''].join('\n');
  return sendFinalTextResponse(req, { text: rss, type: 'rss' });
};



Object.assign(EX, {

  defaultMaxItems: 50,

  defaultLinkTpl(meta) {
    const { rssMode } = orf(meta);
    if (rssMode === 'version-history') { return '%hu'; }
    return '%au';
  },

  fmtAnnoRssDate,


});



export default EX;
