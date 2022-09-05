// -*- coding: utf-8, tab-width: 2 -*-

import makeExtendedOrderedMap from 'ordered-map-extended-pmb';
import mustBe from 'typechecks-pmb/must-be';
import pProps from 'p-props';

import learnUpstreamUserIdAliases from './learnUpstreamUserIdAliases.mjs';
import learnOneAuthorIdentitiy from './learnOneAuthorIdentitiy.mjs';


function initEmptyUserRecord() {
  const user = {
    aclUserGroups: new Set(),
    authorIdentities: makeExtendedOrderedMap(),
  };
  user.authorIdentities.byAgentId = new Map();
  return user;
};


const EX = async function learnLocalUser(mgr, userName, mustPopDetail, meta) {
  const user = mgr.users.getOrInit(userName, null, initEmptyUserRecord);

  (mustPopDetail('undef | nul | ary', 'acl_user_groups') || []).forEach(
    grpName => user.aclUserGroups.add(grpName));

  await pProps(mustPopDetail('undef | obj', 'author_identities') || false,
    (v, k) => learnOneAuthorIdentitiy(mgr, meta, user, k, v));

  learnUpstreamUserIdAliases(mgr, userName,
    mustPopDetail('undef | ary', 'upstream_userid_aliases'));

  mustPopDetail.done('Unsupported user account option(s)');
};


Object.assign(EX, {

  async learnMeta(ctx) {
    const { meta, mgr, srv, mustPopMeta } = ctx;
    mgr.authorAgentUuidBaseUrl = (
      mustPopMeta('str | undef', 'author_agent_uuid5_baseurl')
      || (mustBe.tProp('Server property ', srv,
        'nonEmpty str', 'publicBaseUrlNoSlash')
        + '/authors/by/uuid/'));
    meta.fragments = await srv.configFiles.readAsDict('users/fragments');
  },



});


export default EX;
