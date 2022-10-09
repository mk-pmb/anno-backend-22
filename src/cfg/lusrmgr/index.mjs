// -*- coding: utf-8, tab-width: 2 -*-
/*

Local User Manager
==================

Stores and reports information about:
* Users
* User groups
* Their permissions

The acronym `lusrmgr` is all-lowercase because it's lifted straight from
Microsoft Windows XP.

*/


import makeExtendedOrderedMap from 'ordered-map-extended-pmb';

import learnTopicDict from '../learnTopicDict.mjs';

import learnAclUserGroup from './learnAclUserGroup.mjs';
import learnLocalUser from './learnLocalUser.mjs';


const EX = {

  async make(srv) {
    const mgr = {
      users: makeExtendedOrderedMap(),
      upstreamUserIdAliases: new Map(),
    };

    const ctx = { srv, mgr };
    await learnTopicDict(ctx, 'users', learnLocalUser);
    await learnTopicDict(ctx, 'acl_user_groups', learnAclUserGroup);

    // console.debug('users:', mgr.users.toDict());
    // console.debug('upstreamUserIdAliases:', mgr.upstreamUserIdAliases);

    return mgr;
  },


};


export default EX;
