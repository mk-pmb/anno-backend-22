// -*- coding: utf-8, tab-width: 2 -*-

import core from './core.mjs';
import select from './select.mjs';


const pgAdapter = {
  ...core.api,
  ...select.api,
};

export default pgAdapter;
