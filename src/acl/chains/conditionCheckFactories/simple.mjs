// -*- coding: utf-8, tab-width: 2 -*-


function alwaysFalse() { return false; }


function dummyNever(how) {
  console.debug('ACL: stub: dummyNever as', how.name, 'args', how.args);
  return alwaysFalse;
}


const EX = {

  memberOfAclGroup: dummyNever,

  paramInList(how) {
    const paramName = how.popRuleProp('nonEmpty str', 'param');
    const ckf = function checkParamInList(aclCtx) {
      console.debug('ACL: stub! checkParamInList', { paramName, aclCtx });
      return false;
    };
    return ckf;
  },

};


export default EX;
