// -*- coding: utf-8, tab-width: 2 -*-

import loGet from 'lodash.get';
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
      // console.debug('D: memberOfAclGroup?', { groupName, groups, result });
      return result;
    };
    return ckf;
  },

  paramInList(how) {
    const path = how.popRuleProp('nonEmpty str | nonEmpty ary', 'param');
    const list = mustBe('nonEmpty ary', 'list of accepted values')(how.args);
    const ckf = function checkParamInList(aclCtx) {
      const val = loGet(aclCtx.allMeta, path);
      const found = list.includes(val);
      // console.debug('D: paramInList?', { path, val, list, found });
      return found;
    };
    return ckf;
  },

};


export default EX;
