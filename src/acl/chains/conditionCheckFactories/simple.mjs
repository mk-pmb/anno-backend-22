// -*- coding: utf-8, tab-width: 2 -*-

import loGet from 'lodash.get';
import mustBe from 'typechecks-pmb/must-be';

import metaSlotTemplate from '../metaSlotTemplate.mjs';
import common from './common.mjs';


function alwaysFalse() { return false; }


const EX = {

  never() { return alwaysFalse; },

  isLoggedIn(how) {
    common.expectNoCondArgs(how);
    return function check(aclCtx) {
      return Boolean(common.findUserId(aclCtx));
    };
  },

  isConfiguredUser(how) {
    common.expectNoCondArgs(how);
    return function check(aclCtx) {
      return Boolean(common.findUserDetails(aclCtx));
    };
  },

  isGenericUnknownUser(how) {
    // IDP provided a userId but we don't know them.
    common.expectNoCondArgs(how);
    return function check(aclCtx) {
      const userId = common.findUserId(aclCtx);
      const details = common.findUserDetails(aclCtx);
      return Boolean(userId && (!details));
    };
  },

  memberOfAnyAclGroup(how) {
    common.expectNoCondArgs(how);
    return function check(aclCtx) {
      return (common.findUserAclGroups(aclCtx).size >= 1);
    };
  },

  memberOfAclGroup(how) {
    const groupNameSpec = mustBe.nest('group name', how.args);
    const decideGroupName = metaSlotTemplate.compile(groupNameSpec);
    const staticGroupName = (decideGroupName.isIdentityFunc && groupNameSpec);
    const ckf = function check(aclCtx) {
      const groups = common.findUserAclGroups(aclCtx);
      if (!groups) { return false; }
      const gn = (staticGroupName || decideGroupName(aclCtx));
      if (!gn) { return false; }
      const result = groups.has(gn);
      // console.debug('D: memberOfAclGroup?', { gn, groups, result });
      return result;
    };
    return ckf;
  },

  paramInList(how) {
    let { param: path, list } = how.args;
    const pathFmt = ['nonEmpty str | nonEmpty ary', 'param'];
    const listFmt = ['nonEmpty ary', 'list of accepted values'];
    if (path || list) {
      mustBe(...pathFmt)(path);
      mustBe(...listFmt)(list);
    } else {
      path = how.popRuleProp(...pathFmt);
      list = mustBe(...listFmt)(how.args);
    }
    const ckf = function check(aclCtx) {
      const val = loGet(aclCtx.allMeta, path);
      const found = list.includes(val);
      // console.debug('D: paramInList?', { path, val, list, found });
      return found;
    };
    return ckf;
  },

};


export default EX;
