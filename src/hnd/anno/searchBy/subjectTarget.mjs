// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../../../httpErrors.mjs';


const EX = async function bySubjectTargetPrefix(subjTgtSpec, req, srv) {
  await srv.acl.requirePerm(req, {
    targetUrl: subjTgtSpec,
    privilegeName: 'discover',
  });
  const msg = 'Stub! ' + subjTgtSpec;
  throw httpErrors.notImpl.explain(msg).throwable();
};


// Object.assign(EX, {});
export default EX;
