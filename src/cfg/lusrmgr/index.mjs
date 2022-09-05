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
import mustBe from 'typechecks-pmb/must-be';
import objPop from 'objpop';
import vTry from 'vtry';

import learnLocalUser from './learnLocalUser.mjs';
import learnAclUserGroup from './learnAclUserGroup.mjs';


const EX = {

  async make(srv) {
    const mgr = {
      users: makeExtendedOrderedMap(),
      upstreamUserIdAliases: new Map(),
    };

    await EX.learnConfigTopic(srv, mgr, 'users', learnLocalUser);
    await EX.learnConfigTopic(srv, mgr, 'acl_user_groups', learnAclUserGroup);

    // console.debug('users:', mgr.users.toDict());
    // console.debug('upstreamUserIdAliases:', mgr.upstreamUserIdAliases);

    return mgr;
  },


  async learnConfigTopic(srv, mgr, topic, how) {
    const cfg = await srv.configFiles.readAsMap(topic);
    const descr = 'lusrmgr: Learn config topic ' + topic;
    const meta = { ...cfg.get('') };
    cfg.delete('');
    if (how.learnMeta) {
      const mustPopMeta = objPop(meta, { mustBe }).mustBe;
      await vTry.pr(how.learnMeta, descr + ', common settings')({
        meta,
        mgr,
        mustPopMeta,
        srv,
      });
      mustPopMeta.expectEmpty(descr + ': Unsupported common setting(s)');
    }

    const prs = [];
    cfg.forEach(function learnListEntry(details, topicId) {
      const mustPopDetail = objPop(details, { mustBe }).mustBe;
      prs.push(vTry.pr(how, descr + ', entry ' + topicId)(
        mgr, topicId, mustPopDetail, meta));
    });
    await Promise.all(prs);
  },


};


export default EX;
