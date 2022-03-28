// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../httpErrors.mjs';
import sendFinalTextResponse from '../finalTextResponse.mjs';

import plumb from './util/miscPlumbing.mjs';


const baseIdRgx = /^[A-Za-z0-9_\-]{10,36}$/;


const EX = async function makeAnnoDecider() {

  function annoHnd(req) {
    const urlSubDirs = plumb.getFirstAsteriskDirs(req);
    const { method } = req;
    if (method !== 'GET') { return httpErrors.badMethod(req); }

    console.debug('annoHnd:', urlSubDirs);
    if (urlSubDirs.length !== 1) { return httpErrors.noSuchResource(req); }
    const [baseId] = urlSubDirs;
    const idMatch = (baseIdRgx.exec(baseId) || false);
    if (idMatch[0] !== baseId) { return httpErrors.noSuchResource(req); }

    const anno = { baseId };
    sendFinalTextResponse.json(req, anno);
  }

  return annoHnd;
};


export default EX;
