// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import mustBe from 'typechecks-pmb/must-be';
import objPop from 'objpop';

import redundantGenericAnnoMeta from '../redundantGenericAnnoMeta.mjs';


const verbatimCopyKeysMandatedByProtocol = [
  'canonical',
];


function maybeWrapId(rec) {
  if (typeof rec === 'string') { return { id: rec }; }
  return rec;
}


const EX = function parseSubmittedAnno(origInput) {
  const mustPopInput = objPop(origInput, { mustBe }).mustBe;
  redundantGenericAnnoMeta.mustPopAllStatic(mustPopInput);

  const anno = {};
  function copy(key, rule) {
    const val = mustPopInput(rule, key);
    if (val !== undefined) { anno[key] = val; }
  }
  verbatimCopyKeysMandatedByProtocol.forEach(k => copy(k, 'str | undef'));
  copy('id', 'nonEmpty str | undef');

  copy('creator', 'obj | ary | nonEmpty str | undef');
  copy('dc:isVersionOf', 'nonEmpty str | undef');
  copy('dc:title', 'nonEmpty str');
  copy('rights', 'nonEmpty str | undef');

  function targetLike(key) {
    const spec = mustPopInput('obj | ary | nonEmpty str | undef', key);
    const list = arrayOfTruths(spec).map(maybeWrapId);
    if (!list.length) {
      throw new RangeError('Annotation needs at least one ' + key);
    }
    anno[key] = list;
  }
  targetLike('target');
  targetLike('body');

  function neStrList(key) {
    const list = arrayOfTruths.ifAny(
      mustPopInput('ary | nonEmpty str | undef', key));
    if (!list) { return; }
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
