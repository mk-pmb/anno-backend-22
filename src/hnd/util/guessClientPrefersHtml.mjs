// -*- coding: utf-8, tab-width: 2 -*-

const archiveBotKeywordsLowercase = [
  'archive',
  'saver',
  'wayback',
];

function lcHdr(req, h) { return String(req.header(h) || '').toLowerCase(); }

const EX = function guessClientPrefersHtml(req) {
  if (req.asRoleName) { return false; }
  const userAgent = lcHdr(req, 'user-agent');
  if (!userAgent) { return false; }
  const foundArchiveBotKeyword = archiveBotKeywordsLowercase.find(
    kw => userAgent.includes(kw));
  if (foundArchiveBotKeyword) {
    req.logCkp('guessClientPrefersHtml:', { foundArchiveBotKeyword });
    return false;
  }

  const acceptedMediaTypes = lcHdr(req, 'accept');
  // Ideally we'd check the order with respect to priorities assigned.
  // However, in practice, for all usual browsers, this simple prefix
  // check is enough:
  return acceptedMediaTypes.startsWith('text/html,');
};


export default EX;
