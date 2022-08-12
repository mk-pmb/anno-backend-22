// -*- coding: utf-8, tab-width: 2 -*-

function orf(x) { return x || false; }


const EX = {


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

  findUserAclGroups(aclCtx) {
    return orf(EX.findUserDetails(aclCtx).aclUserGroups);
  },




};

export default EX;
