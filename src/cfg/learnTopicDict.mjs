// -*- coding: utf-8, tab-width: 2 -*-

import crObAss from 'create-object-and-assign';
import loGet from 'lodash.get';
import mergeOpt from 'merge-options';
import mustBe from 'typechecks-pmb/must-be';
import objPop from 'objpop';
import pProps from 'p-props';
import vTry from 'vtry';


const EX = async function learnTopicDict(origCtx, topic, learnImpl) {
  const { srv } = origCtx;
  const cfgDict = await srv.configFiles.readAsDict(topic);
  const descr = 'Learn config topic ' + topic;
  const cfgMeta = crObAss(EX.cfgMetaApi, cfgDict['']);
  delete cfgDict[''];
  const ctx = { ...origCtx, cfgMeta, cfgDict };
  if (learnImpl.learnMeta) {
    const mustPopCfgMeta = objPop(cfgMeta, { mustBe }).mustBe;
    await vTry.pr(learnImpl.learnMeta,
      // ^-- Using dot notation to support `this` keyword inside.
      descr + ', common settings')(ctx, mustPopCfgMeta);
    mustPopCfgMeta.expectEmpty(descr + ': Unsupported common setting(s)');
  }

  await pProps(cfgDict, async function learnListEntry(details, key) {
    const mustPopDetail = objPop(details, { mustBe }).mustBe;
    await vTry.pr(learnImpl, descr + ', entry ' + key)(ctx, key, mustPopDetail);
  });
};


const cfgMetaApi = {

  findInheritedFragments(fragNames) {
    if (!fragNames) { return false; }
    const cfgMeta = this;
    const frags = fragNames.map(function lookupInherit(path) {
      const inc = loGet(cfgMeta.fragments, path);
      if (inc !== undefined) { return inc; }
      throw new Error('Cannot find fragment ' + path);
    });
    return frags;
  },

  mergeInheritedFragments(origSpec) {
    const cfgMeta = this;
    const inherited = cfgMeta.findInheritedFragments(origSpec.INHERITS);
    if (!inherited) { return origSpec; }
    const merged = mergeOpt(...inherited, origSpec);
    delete merged.INHERITS;
    return merged;
  },

};


Object.assign(EX, {

  cfgMetaApi,

});


export default EX;
