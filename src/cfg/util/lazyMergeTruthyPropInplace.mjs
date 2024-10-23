// -*- coding: utf-8, tab-width: 2 -*-

import mergeOpt from 'merge-options';
import getOwn from 'getown';


const EX = function lazyMergeTruthyPropInplace(dest, key, source) {
  const update = getOwn(source, key);
  if (!update) { return; }
  const old = getOwn(source, key);
  const merged = (old ? mergeOpt(old, update) : update);
  dest[key] = merged; // eslint-disable-line no-param-reassign
};


export default EX;
