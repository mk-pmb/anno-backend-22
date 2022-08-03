// -*- coding: utf-8, tab-width: 2 -*-

import makeExtendedOrderedMap from 'ordered-map-extended-pmb';

import learnUpstreamUserIdAliases from './learnUpstreamUserIdAliases.mjs';


function initEmptyUserRecord() {
  const user = {
    aclUserGroups: new Set(),
    authorIdentities: makeExtendedOrderedMap(),
  };
  return user;
};


const EX = function learnLocalUser(mgr, userName, mustPopDetail) {
  const user = mgr.users.getOrInit(userName, null, initEmptyUserRecord);

  (mustPopDetail('undef | ary', 'acl_user_groups') || []).forEach(
    grpName => user.aclUserGroups.add(grpName));

  user.authorIdentities.upd(mustPopDetail('undef | obj', 'author_identities'));

  learnUpstreamUserIdAliases(mgr, userName,
    mustPopDetail('undef | ary', 'upstream_userid_aliases'));

  mustPopDetail.done('Unsupported user account option(s)');
};


export default EX;
