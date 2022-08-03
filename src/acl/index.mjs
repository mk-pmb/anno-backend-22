// -*- coding: utf-8, tab-width: 2 -*-

import crObAss from 'create-object-and-assign';
import mustBe from 'typechecks-pmb/must-be';

import httpErrors from '../httpErrors.mjs';

import detectUserIdentity from './detectUserIdentity.mjs';


const EX = function makeAclProxy(srv, req, initMeta) {
  const allMeta = { ...initMeta };
  const mustMeta = mustBe.tProp('ACL metadata property ', allMeta);
  const tgtUrl = mustMeta('nonEmpty str', 'targetUrl');
  const urlMeta = srv.services.findMetadataByTargetUrl(tgtUrl);
  Object.assign(allMeta, urlMeta);

  const userIdentityMeta = detectUserIdentity(req);
  Object.assign(allMeta, userIdentityMeta);

  const acl = crObAss(EX.api, {
    allMeta,
    mustMeta,
    tgtUrl,
    urlMeta,
    userIdentityMeta,
  });
  console.debug('ACL meta:', allMeta);
  return acl;
};


Object.assign(EX, {

  api: {

    requirePerm(permName) {
      const acl = this;
      const msg = ('Lacking permission ' + permName
        + ' on ' + JSON.stringify(acl.urlMeta, null, 1).replace(/\n\s*/g, ' '));
      throw httpErrors.aclDeny.explain(msg).throwable();
    },

  },

});



export default EX;
