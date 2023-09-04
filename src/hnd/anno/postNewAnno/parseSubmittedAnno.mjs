// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import loMapValues from 'lodash.mapvalues';
import mustBe from 'typechecks-pmb/must-be';

import redundantGenericAnnoMeta from '../redundantGenericAnnoMeta.mjs';


const verbatimCopyKeysMandatedByProtocol = [
  'canonical',
];

const alwaysDiscardFields = [
  'iana:version-history',
];


function maybeWrapId(rec) {
  if (typeof rec === 'string') { return { id: rec }; }
  return rec;
}


function orf(x) { return x || false; }


const EX = function parseSubmittedAnno(mustPopInput, opt) {
  redundantGenericAnnoMeta.mustPopAllStatic(mustPopInput);
  alwaysDiscardFields.forEach(k => mustPopInput('any', k));

  const anno = {};
  function copy(key, rule) {
    const val = mustPopInput(rule, key);
    if (val !== undefined) { anno[key] = val; }
  }
  verbatimCopyKeysMandatedByProtocol.forEach(k => copy(k, 'str | undef'));
  copy('id', 'nonEmpty str | undef');

  if (opt && opt.extraCopyFields) {
    loMapValues(opt.extraCopyFields, (rule, key) => copy(key, rule));
  }

  copy('creator', 'obj | ary | nonEmpty str | undef');
  copy('dc:isVersionOf', 'nonEmpty str | undef');
  copy('dc:language', 'nonEmpty str | undef');
  copy('dc:replaces', 'nonEmpty str | undef');
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
  anno.target.forEach(EX.sanifyCheckTarget);

  function neStrList(key) {
    const list = arrayOfTruths.ifAny(
      mustPopInput('ary | nonEmpty str | undef', key));
    if (!list) { return ''; }
    // ^-- using empty string b/c it's false-y but still supports .includes().
    list.forEach((x, i) => mustBe.nest(key + '[' + i + ']', x));
    anno[key] = list;
    return list;
  }

  const typeDecl = neStrList('type');
  if (!typeDecl.includes('Annotation')) {
    throw new Error('Field "type" must include "Annotation".');
  }

  const motivations = neStrList('motivation');
  const inReplyTo = neStrList('as:inReplyTo');

  const motiReply = motivations.includes('replying');
  if (motiReply && (!inReplyTo.length)) {
    const msg = ('For annotation with motivation "replying"'
      + ' we expect to also see "as:inReplyTo".');
    throw new Error(msg);
  }
  if (inReplyTo.length && (!motiReply)) {
    const msg = ('For annotation with "as:inReplyTo"'
      + ' we expect to also see motivation "replying".');
    throw new Error(msg);
  }

  mustPopInput.expectEmpty('Unsupported annotation field');
  return anno;
};


Object.assign(EX, {

  sanifyCheckTarget(tgt) {
    const sel = orf(tgt.selector);
    if (sel.type === 'SvgSelector') {
      if (!/\d/.test(sel.value)) {
        throw new Error('Refusing SvgSelector that contains no numbers.');
      }
    }
  },

});


export default EX;
