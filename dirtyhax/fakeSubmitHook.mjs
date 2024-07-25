// -*- coding: utf-8, tab-width: 2 -*-

import eq from 'equal-pmb';
import commonPrefix from 'generic-common-prefix';
import saniLib from 'sanitize-html';

// eslint-disable-next-line n/no-unpublished-import
import preparePluginSanitizeHtml from './plugin.sanitize-html.js';

const saniFunc = preparePluginSanitizeHtml({ injected: { sani: saniLib } });

const EX = function checkAnno(anno) {
  if (process.env.AS22_FAKE_SUBMIT_HOOK === 'skip') { return; }
  anno.body.forEach(function validate(body, idx) {
    const { format, value } = body;
    if (format !== 'text/html') { return; }
    const clean = saniFunc(value);
    if (clean === value) { return; }
    const msg = ('HTML sanitization mismatch in body #' + (idx + 1)
      + ' after ' + commonPrefix.measure(value, clean)
      + ' acceptable characters.');
    try { eq(clean, value); } catch (e) { console.error(msg, e); }
    throw new Error(msg);
  });
};


export default EX;
