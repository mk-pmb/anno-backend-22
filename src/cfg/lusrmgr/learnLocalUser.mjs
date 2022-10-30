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


const EX = async function learnLocalUser(ctx, userName, mustPopDetail) {
  const { mgr } = ctx;
  const userDetails = mgr.users.getOrInit(userName, null, initEmptyUserRecord);
  const subCtx = { ...ctx, userName, userDetails };

  (mustPopDetail('undef | nul | ary', 'acl_user_groups') || []).forEach(
    grpName => userDetails.aclUserGroups.add(grpName));

  await pProps(mustPopDetail('undef | obj', 'author_identities') || false,
    (v, k) => learnOneAuthorIdentitiy(subCtx, k, v));

  learnUpstreamUserIdAliases(subCtx, userName,
    mustPopDetail('undef | ary', 'upstream_userid_aliases'));

  mustPopDetail.done('Unsupported user account option(s)');
};


Object.assign(EX, {

  async learnMeta(ctx, mustPopCfgMeta) {
    const { cfgMeta, mgr, srv } = ctx;

    mgr.authorAgentUuidBaseUrl = (function parse() {
      const cfgKey = 'author_agent_uuid5_baseurl';
      let bu = mustPopCfgMeta('str | undef', cfgKey);
      bu = (bu || '/authors/by-uuid/');
      if (bu.startsWith('/')) {
        const serverBaseUrl = mustBe.tProp('Server property ', srv,
          'nonEmpty str', 'publicBaseUrlNoSlash');
        bu = serverBaseUrl + bu;
      }
      return bu;
    }());

    mgr.missingAuthorFallbackIdentityKeys = (function parse() {
      const cfgKey = 'missing_author_fallback_identity_keys';
      const origSpec = mustPopCfgMeta('ary | nul | undef', cfgKey);
      const aiKeys = [].concat(origSpec).filter(Boolean);
      return aiKeys;
    }());

    cfgMeta.fragments = await srv.configFiles.readAsDict('users/fragments');
  },



});


export default EX;
