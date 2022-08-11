// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be';


function alwaysFalse() { return false; }
function orf(x) { return x || false; }


const EX = {

  never() { return alwaysFalse; },

  memberOfAclGroup(how) {
    const groupName = mustBe.nest('group name', how.args);
    const ckf = function checkMemberOfAclGroup(aclCtx) {
      const { userId } = aclCtx.allMeta;
      const userInfo = aclCtx.getReq().getSrv().lusrmgr.users.get(userId);
      const groups = orf(userInfo).aclUserGroups;
      const result = orf(groups && groups.has(groupName));
      console.debug('D: memberOfAclGroup?', { groupName, groups, result });
      return result;
    };
    return ckf;
  },

  paramInList(how) {
    const paramName = how.popRuleProp('nonEmpty str', 'param');
    const list = mustBe('nonEmpty ary', 'list of accepted values')(how.args);
    const ckf = function checkParamInList(aclCtx) {
      const paramValue = getOwn(aclCtx.allMeta, paramName);
      const found = list.includes(paramValue);
      console.debug('D: paramInList?', { paramValue, list, found });
      return found;
    };
    return ckf;
  },

};


export default EX;
