// -*- coding: utf-8, tab-width: 2 -*-

import dateFmtRfc822 from 'rfc822-date';
import mustBe from 'typechecks-pmb/must-be';
import xmlenc from 'xmlunidefuse';

import sendFinalTextResponse from '../../finalTextResponse.mjs';


function xmlStrTag(t, c) { return `    <${t}>${xmlenc(c)}</${t}>\n`; }


const annoIdMustBeNest = mustBe('nonEmpty str', 'Annotation field "id"');


const EX = function fmtAnnosAsRssFeed(how) {
  const {
    req,
    annos,
    linkTpl,
    ...unexpected
  } = how;
  mustBe.keyless('Unexpected options', unexpected);
  mustBe.ary('Annotations list', annos);

  const rss = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<rss version="2.0"><channel>',
    '  <title>Annotations</title>',
    ...annos.filter(Boolean).map(a => ('  <item>\n'
      + xmlStrTag('title', a['dc:title'] || a.title || '(untitled)')
      + xmlStrTag('link', EX.fmtLinkTpl(linkTpl, a))
      + xmlStrTag('pubDate', dateFmtRfc822(a.created))
      + '  </item>')),
    '</channel>',
    '</rss>',
    ''].join('\n');
  return sendFinalTextResponse(req, { text: rss, type: 'rss' });
};



Object.assign(EX, {

  fmtLinkTpl(linkTpl, anno) {
    let u = linkTpl;
    const [versId] = annoIdMustBeNest(anno.id).split('/').slice(-1);
    u = u.replace(/%as/g, versId);
    return u;
  },


});



export default EX;
