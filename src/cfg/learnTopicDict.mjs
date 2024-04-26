// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import bindAllMethods from 'bind-all-methods-nondestructive-pmb';
import mergeOpt from 'merge-options';
import mustBe from 'typechecks-pmb/must-be';
import objDive from 'objdive';
import objPop from 'objpop';
import pProps from 'p-props';
import vTry from 'vtry';


const EX = async function learnTopicDict(origCtx, topic, learnImpl) {
  const { srv } = origCtx;
  const cfgDict = await srv.configFiles.readAsDict(topic);
  const descr = 'Learn config topic ' + topic;
  const cfgMeta = { ...cfgDict[''] };
  delete cfgDict[''];
  const ctx = { ...origCtx, cfgMeta, cfgDict };
  bindAllMethods.dest(ctx, EX.api);

  const mustPopCfgMeta = objPop(cfgMeta, { mustBe }).mustBe;
  const maybeLearnMeta = lmCtx => (lmCtx.learnMeta
    && vTry.pr(lmCtx.learnMeta.bind(learnImpl),
      // ^-- Using dot notation to support `this` keyword inside.
      descr + ', common settings')(ctx, mustPopCfgMeta));
  await maybeLearnMeta(learnImpl);
  await maybeLearnMeta(ctx);
  mustPopCfgMeta.expectEmpty(descr + ': Unsupported common setting(s)');

  ctx.topicDefaults = (ctx.mergeInheritedFragments(ctx.topicDefaults) || {});

  await pProps(cfgDict, async function learnListEntry(origDetails, key) {
    let det = mergeOpt(ctx.topicDefaults, origDetails || {});
    det = ctx.mergeInheritedFragments(det);
    const mustPopDetail = objPop(det, { mustBe }).mustBe;
    await vTry.pr(learnImpl, descr + ', entry ' + key)(ctx, key, mustPopDetail);
  });
};


const api = {

  retrieveInheritedFragments(fragPaths) {
    if (!fragPaths) { return false; }
    const ctx = this;
    const { customData } = ctx.srv.configFiles;
    const frags = arrayOfTruths.ifAnyMap(fragPaths, function lookup(path) {
      const inc = objDive(customData, path);
      if (inc !== undefined) { return inc; }
      console.debug('Known top-level fragments:',
        Object.keys(customData).sort());
      throw new Error('Cannot find fragment ' + path);
    });
    return frags;
  },

  mergeInheritedFragments(origSpec) {
    if (!origSpec) { return origSpec; }
    const ctx = this;
    const inherited = ctx.retrieveInheritedFragments(origSpec.INHERITS);
    if (!inherited) { return origSpec; }
    const merged = mergeOpt(...inherited, origSpec);
    delete merged.INHERITS;
    return merged;
  },

};


Object.assign(EX, {

  api,

});


export default EX;
