// -*- coding: utf-8, tab-width: 2 -*-

import loMapValues from 'lodash.mapvalues';
import mustBe from 'typechecks-pmb/must-be';


const safeDefaultValue = 'deny';


const EX = {

  safeDefaultValue,

  popValidateDict(popRuleProp, rulePropName) {
    const dict = popRuleProp('obj | undef', rulePropName);
    if (!dict) { return false; }
    const validValues = [safeDefaultValue, 'allow'];
    if (rulePropName === 'decide') { validValues.push('stop'); }
    const validate = mustBe([['oneOf', validValues]]);
    return loMapValues(dict, function eachPrivName(deci, privName) {
      return validate(rulePropName + '[' + privName + ']', deci);
    });
  },

};


export default EX;
