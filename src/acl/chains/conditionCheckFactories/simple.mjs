// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import objDive from 'objdive';
import mustBe from 'typechecks-pmb/must-be';

import makeTemplateSpecListIntersectionChecker from
  '../templateSpecListIntersectionChecker.mjs';

import common from './common.mjs';


const EX = {

  never() { return common.alwaysFalse; },

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
      return (common.findUserAclGroupsSet(aclCtx).size >= 1);
    };
  },

  memberOfAclGroup(how) {
    return makeTemplateSpecListIntersectionChecker({
      specsItemDescr: 'group name template',
      specsList: arrayOfTruths(how.args),
      getAclCtxValues: common.findUserAclGroupsArray,
      // debugHint: how.traceDescr,
    });
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
      const val = objDive(aclCtx.allMeta, path);
      const found = list.includes(val);
      // console.debug('D: paramInList?', { path, val, list, found });
      return found;
    };
    return ckf;
  },

};


export default EX;
