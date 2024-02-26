// -*- coding: utf-8, tab-width: 2 -*-

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


const api = {

  retrieveInheritedFragments(fragPaths) {
    if (!fragPaths) { return false; }
    const ctx = this;
    const { customData } = ctx.srv.configFiles;
    const frags = fragPaths.map(function lookupInherit(path) {
      const inc = objDive(customData, path);
      if (inc !== undefined) { return inc; }
      throw new Error('Cannot find fragment ' + path);
    });
    return frags;
  },

  mergeInheritedFragments(origSpec) {
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
