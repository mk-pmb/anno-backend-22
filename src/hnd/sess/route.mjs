// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';

import httpErrors from '../../httpErrors.mjs';
// import requestDebugHandler from '../util/debugRequest.mjs';
// import sendFinalTextResponse from '../../finalTextResponse.mjs';

import plumb from '../util/miscPlumbing.mjs';
import loginHandler from './login.mjs';
import whoamiHandler from './whoami.mjs';


const EX = async function makeSessionRoute() {
  function sessionHnd(req) {
    const subUrl = plumb.getFirstAsteriskUrlPart(req);
    const hndFunc = getOwn(EX.subHnd, subUrl);
    return (hndFunc || httpErrors.noSuchResource)(req);
  }
  return sessionHnd;
};


Object.assign(EX, {

  subHnd: {
    login: loginHandler,
    whoami: whoamiHandler,
  },


});


export default EX;
