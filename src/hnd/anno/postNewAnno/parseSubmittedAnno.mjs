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
  copy('dc:title', 'nonEmpty str');
  copy('creator', 'obj | ary | nonEmpty str | undef');
  copy('rights', 'nonEmpty str | undef');

  function targetLike(key) {
    let val = mustPopInput('obj | ary | nonEmpty str | undef', key);
    val = [].concat(val).filter(Boolean);
    if (!val.length) {
      throw new RangeError('Annotation needs at least one ' + key);
    }
    val = val.map(function maybeWrapId(rec) {
      if (typeof rec === 'string') { return { id: rec }; }
      return rec;
    });
    anno[key] = val;
  }
  targetLike('target');
  targetLike('body');

  function neStrList(key) {
    let list = mustPopInput('ary | nonEmpty str | undef', key);
    if (!list) { return; }
    list = [].concat(list).filter(Boolean);
    if (!list.length) { return; }
    list.forEach((x, i) => mustBe.nest(key + '[' + i + ']', x));
    anno[key] = list;
  }
  neStrList('motivation');

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
