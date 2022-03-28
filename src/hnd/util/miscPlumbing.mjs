// -*- coding: utf-8, tab-width: 2 -*-

const EX = {

  getFirstAsteriskUrlPart(req) {
    return String(req.params['0'] // Yes, express really uses a string.
      || '');
  },

  getFirstAsteriskDirs(req) {
    return EX.getFirstAsteriskUrlPart(req).split('/');
  },

};

export default EX;
