// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';
import objPop from 'objpop';

import redundantGenericAnnoMeta from '../redundantGenericAnnoMeta.mjs';


const verbatimCopyKeysMandatedByProtocol = [
  'canonical',
];


const EX = function parseSubmittedAnno(origInput) {
  const mustPopInput = objPop(origInput, { mustBe }).mustBe;
  redundantGenericAnnoMeta.mustPopAllStatic(mustPopInput);

  const anno = {};
  function copy(key, rule) {
    const val = mustPopInput(rule, key);
    if (val !== undefined) { anno[key] = val; }
  }
  verbatimCopyKeysMandatedByProtocol.forEach(k => copy(k, 'str | undef'));
  copy('id', 'undef | nonEmpty str');
  copy('target', 'obj | ary');
  copy('title', 'nonEmpty str');
  // copy('author', 'obj');
  copy('body', 'obj | ary');
  copy('rights', 'nonEmpty str | undef');

  mustPopInput.expectEmpty('Unsupported annotation field');
  return anno;
};


Object.assign(EX, {

  fallible(req, origInput, makeError) {
    try {
      return EX(origInput);
    } catch (parseErr) {
      throw makeError('Parse annotation: ' + String(parseErr));
    }
  },

});


export default EX;
