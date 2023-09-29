// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import isStr from 'is-string';


const traceGlue = '›';
const errNoSlashUnlessFullUri = ('Field must not contain a slash (/)'
  + "unless it's a full URI: ");


const regexps = {
  startsWithProtocol: /^\w+:/,  // no slashes: accept urn:uuid:…
};


const topLevelStringProps = [
  'dc:isVersionOf',
  'dc:replaces',
  'id',
  'via',
];

const topLevelStringLists = [
  'as:inReplyTo',
];

const topLevelResourceLists = [
  'body',
  'target',
];


const EX = function fixLocalUrlFieldsInplace(cfg, anno) {
  if (!cfg) { throw new Error('Expected configuration'); }
  if (!anno) { throw new Error('Expected an annotation'); }
  const pubBase = cfg.publicBaseUrlNoSlash;
  if (!pubBase) { throw new Error('Missing publicBaseUrlNoSlash'); }

  function fixUrl(orig, trace, key) {
    if (regexps.startsWithProtocol.test(orig)) { return orig; }
    if (orig.includes('/')) {
      throw new Error(errNoSlashUnlessFullUri + trace + key + '=' + orig);
    }
    return pubBase + '/anno/' + orig;
  }
  function fixField(dict, trace, key) {
    const orig = dict[key];
    if (!orig) { return; }
    if (!isStr(orig)) { return; }
    const better = fixUrl(orig, trace, key);
    dict[key] = better; // eslint-disable-line no-param-reassign
    return dict;
  }
  topLevelStringProps.forEach(k => fixField(anno, '', k));

  function fixOneResource(key, val, idx) {
    if (!val) { return; }
    if (isStr(val)) { return { id: fixUrl(val, '', key) }; }
    const trace = key + '#' + (idx + 1) + traceGlue;
    fixField(val, trace, 'id');
    fixField(val, trace, 'scope');
    fixField(val, trace, 'source');
    return val;
  }
  function fixOneTopLevelResource(key) {
    const better = fixOneResource(key, anno[key], 0);
    if (better === undefined) { return; }
    anno[key] = better; // eslint-disable-line no-param-reassign
  }
  fixOneTopLevelResource('creator');

  function fixStringList(key) {
    const orig = anno[key];
    if (orig === undefined) { return; }
    const better = arrayOfTruths(orig).map(
      (val, idx) => fixUrl(val, '', key + '#' + (idx + 1)));
    // console.debug('better:', better);
    anno[key] = better; // eslint-disable-line no-param-reassign
  }
  topLevelStringLists.forEach(fixStringList);

  function fixResourceList(key) {
    const orig = anno[key];
    if (orig === undefined) { return; }
    const better = arrayOfTruths(orig).map(
      (val, idx) => fixOneResource(key, val, idx));
    anno[key] = better; // eslint-disable-line no-param-reassign
  }
  topLevelResourceLists.forEach(fixResourceList);
};


export default EX;
