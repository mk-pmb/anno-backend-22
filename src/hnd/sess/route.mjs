// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';

import httpErrors from '../../httpErrors.mjs';
// import requestDebugHandler from '../util/debugRequest.mjs';
// import sendFinalTextResponse from '../../finalTextResponse.mjs';

import eternal from '../wrap/eternal.mjs';
import plumb from '../util/miscPlumbing.mjs';

import loginHandler from './login.mjs';
import whoamiHandler from './whoami.mjs';


const EX = async function makeSessionRoute() {
  const sh = function sessionHandler(req) {
    const subUrl = plumb.getFirstAsteriskUrlPart(req);
    const hndImpl = getOwn(EX.subHnd, subUrl);
    return (hndImpl || httpErrors.noSuchResource)(req);
  };
  Object.assign(sh, EX.commonApi);
  return sh;
};


Object.assign(EX, {

  subHnd: {
    login: loginHandler,
    whoami: whoamiHandler,
  },

  commonApi: {

    asRoleName: eternal(function redirectAsRoleNameSession(req, res) {
      res.redirect('../../../session' + req.url);
    }),

  },


});


export default EX;
