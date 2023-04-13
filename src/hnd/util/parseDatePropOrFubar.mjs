// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';

import httpErrors from '../../httpErrors.mjs';

const { fubar } = httpErrors.throwable;


const EX = function parseDatePropOrFubar(obj, key) {
  const val = getOwn(obj, key);
  if (!val) { return false; }
  const jsDate = new Date(val);
  const ts = jsDate.getTime();
  if (Number.isFinite(ts) && (ts >= 0)) { return { val, jsDate, ts }; }
  throw fubar('Bad date format in ' + key);
};


export default EX;
