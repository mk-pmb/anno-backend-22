// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../../../httpErrors.mjs';

import bySubjectTarget from './subjectTarget.mjs';


const unsupportedCriterion = httpErrors.notImpl.explain(
  'Search criterion not implemented.').throwable;


function apacheSlashes(sub) {
  let url = sub.join('/');

  // Some reverse proxies like our Apache normalize double slashes,
  // mangling the URL. We could document how to configure them properly,
  // … or we can just cheat-fix it:
  url = url.replace(/^(\w+:\/)(?!\/)/, '$1/');

  return url;
}


const EX = async function searchBy(pathParts, req, srv) {
  const [crit, ...sub] = pathParts;
  if (crit === 'subject-target') {
    return bySubjectTarget(apacheSlashes(sub), req, srv);
  }
  throw unsupportedCriterion();
};


// Object.assign(EX, {});
export default EX;
