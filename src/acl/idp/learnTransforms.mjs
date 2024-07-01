// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';
import objPop from 'objpop';

import learnOneSimplifierEntry from './learnOneSimplifierEntry.mjs';


const EX = function learnTransforms(acl, origTransforms) {
  const popTr = objPop(origTransforms, { mustBe }).mustBe;

  (popTr('ary | nul | undef', 'simplify') || []).forEach(
    (s, i) => learnOneSimplifierEntry(acl, s, i));

  popTr.expectEmpty('Unsupported transforms');
};


Object.assign(EX, {

  configSectionName: 'upstream_userid_transforms',
  expectedConfigSectionFormat: 'obj | nul | undef',

});


export default EX;
