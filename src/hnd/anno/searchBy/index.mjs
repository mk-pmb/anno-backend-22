// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../../../httpErrors.mjs';

import bySubjectTarget from './subjectTarget.mjs';


const unsupportedCriterion = httpErrors.notImpl.explain(
  'Search criterion not implemented.').throwable;


const EX = async function searchBy(pathParts, req, srv) {
  const [crit, ...sub] = pathParts;
  if (crit === 'subject-target') {
    return bySubjectTarget(sub.join('/'), req, srv);
  }
  throw unsupportedCriterion();
};


// Object.assign(EX, {});
export default EX;
