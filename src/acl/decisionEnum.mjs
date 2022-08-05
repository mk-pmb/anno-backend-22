// -*- coding: utf-8, tab-width: 2 -*-

import loMapValues from 'lodash.mapvalues';
import mustBe from 'typechecks-pmb/must-be';


const safeDefaultValue = 'deny';
const validValues = [
  safeDefaultValue,
  'allow',
];


const EX = {

  safeDefaultValue,
  validValues,

  validate: mustBe([['oneOf', validValues]]),

  popValidateDict(popRuleProp, rulePropName) {
    const dict = popRuleProp('obj | undef', rulePropName);
    if (!dict) { return false; }
    return loMapValues(dict, function validate(v, k) {
      return EX.validate(rulePropName + '[' + k + ']', v);
    });
  },

};


export default EX;
