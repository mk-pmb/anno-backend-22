// -*- coding: utf-8, tab-width: 2 -*-

function orf(x) { return x || false; }


const EX = {

  alwaysFalse() { return false; },
  truthyToArray(x) { return x && Array.from(x); },


  expectNoCondArgs(how) {
    if (how.args === undefined) { return; }
    const msg = 'Condition ' + how.name + ' does not accept any options.';
    throw new Error(msg);
  },


  findUserId(aclCtx) { return aclCtx.allMeta.userId; },

  findUserDetails(aclCtx) {
    const userId = EX.findUserId(aclCtx);
    return orf(aclCtx.getReq().getSrv().lusrmgr.users.get(userId));
  },

  findUserAclGroupsSet(aclCtx) {
    return orf(EX.findUserDetails(aclCtx).aclUserGroups);
  },


  findUserAclGroupsArray(aclCtx) {
    return EX.truthyToArray(EX.findUserAclGroupsSet(aclCtx));
  },




};

export default EX;
