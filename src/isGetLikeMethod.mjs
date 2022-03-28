// -*- coding: utf-8, tab-width: 2 -*-

const EX = function isGetLikeMethod(req) {
  const mtd = (req.method || req);
  return ((mtd === 'GET')
    || (mtd === 'HEAD')
    || (mtd === 'OPTIONS')
  );
};

export default EX;
