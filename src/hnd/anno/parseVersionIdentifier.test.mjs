// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';

import eq from 'equal-pmb';

import pvi from './parseVersionIdentifier.mjs';

const bu = 'http://anno.example.net';
const stubSrv = { publicBaseUrlNoSlash: bu };
const ola = / only local anno IDs are supported\W?$/;
const ebu = / only local anno IDs are supported. Ensure .*public_baseurl/;

function flu(url) {
  console.debug('flu? <%s>', url);
  return pvi.fromLocalUrl(stubSrv, Error, url);
}


eq.err(() => flu(''), /No anno ID given/);
eq.err(() => flu(bu), ebu);
eq.err(() => flu('http://unrelated.test/anno/test-rsterr~4'), ebu);
eq.err(() => flu(bu + '/'), ola);
eq.err(() => flu(bu + '/index.html'), ola);
eq.err(() => flu(bu + '/anno'), ola);
eq.err(() => flu(bu + '/anno/'), /No anno ID given/);
eq.err(() => flu(bu + '/anno/too-short'), /Unsupported anno ID format/);

eq(flu(bu + '/anno/test-rsterr'), {
  baseId: 'test-rsterr',
  mongoId: 'test-rsterr',
  replyNums: [],
  replySuf: '',
  url: bu + '/anno/test-rsterr',
  versId: 'test-rsterr',
  versNum: 0,
});

eq(flu(bu + '/anno/test-rsterr~4'), {
  baseId: 'test-rsterr',
  mongoId: 'test-rsterr',
  replyNums: [],
  replySuf: '',
  url: bu + '/anno/test-rsterr~4',
  versId: 'test-rsterr~4',
  versNum: 4,
});













console.info('+OK test passed.');
