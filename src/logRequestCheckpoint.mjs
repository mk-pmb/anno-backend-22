// -*- coding: utf-8, tab-width: 2 -*-

const EX = function logRequestCheckpoint(where, ...details) {
  const req = this;
  const hints = [
    (req.complete && '[complete]'),
  ].filter(Boolean);
  console.debug(where,
    req.method,
    req.originalUrl,
    ...hints,
    ...details);
  return req;
};


export default EX;
