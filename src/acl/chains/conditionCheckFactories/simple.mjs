// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be';


function alwaysFalse() { return false; }


const EX = {

  never() { return alwaysFalse; },

  memberOfAclGroup(how) {
    const groupName = mustBe.nest('group name', how.args);
    const ckf = function checkMemberOfAclGroup(aclCtx) {
      const { userId } = aclCtx.allMeta;
      const userInfo = aclCtx.getReq().getSrv().lusrmgr.users.get(userId);
      if (!userInfo) { return false; } // <- ensure we return a boolean
      return userInfo.aclUserGroups.has(groupName);
    };
    return ckf;
  },

  paramInList(how) {
    const paramName = how.popRuleProp('nonEmpty str', 'param');
    const list = mustBe('nonEmpty ary', 'list of accepted values')(how.args);
    const ckf = function checkParamInList(aclCtx) {
      return list.includes(getOwn(aclCtx, paramName));
    };
    return ckf;
  },

};


export default EX;
