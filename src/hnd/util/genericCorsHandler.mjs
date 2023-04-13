// -*- coding: utf-8, tab-width: 2 -*-

import ftr from '../../finalTextResponse.mjs';


const listSep = ', ';

const echoableHeaderNamesGlued = [
  // echoable = safe to reveal to untrusted parties.

  'Allow',
  'Content-Location',
  'Content-Type',
  'ETag',
  'Link',
  'Location',
  'Prefer',
  'Sunset',
  'Vary',
].join(listSep);

const secretHeaderNamesGlued = [
  'Authorization',
].join(listSep);

const acceptableHeaderNamesGlued = [
  echoableHeaderNamesGlued,
  secretHeaderNamesGlued,
].filter(Boolean).join(listSep);

const methodNamesGlued = [
  'GET',
  'HEAD',
  'OPTIONS',
  'PATCH',
  'POST',
].join(listSep);


const EX = function makeGenericCorsHandler() {
  function confirmCors(req) {
    const rsp = req.res;
    rsp.header('Access-Control-Allow-Credentials', 'true');
    rsp.header('Access-Control-Allow-Headers', acceptableHeaderNamesGlued);
    rsp.header('Access-Control-Allow-Methods', methodNamesGlued);
    rsp.header('Access-Control-Allow-Origin', (req.header('Origin') || '*'));
    rsp.header('Access-Control-Expose-Headers', echoableHeaderNamesGlued);
    if (req.method === 'OPTIONS') { return ftr(req, { text: 'OK' }); }
  }
  return confirmCors;
};


// Object.assign(EX, {});
export default EX;
