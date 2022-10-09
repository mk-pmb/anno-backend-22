// -*- coding: utf-8, tab-width: 2 -*-

const firstCharStrictlyAlnumRgx = /^[0-9a-zA-Z]/;


const EX = {

  cfgFileSuffix: '.yaml',

  isPluggableConfigFilename(n) {
    return !!(n
      && n.endsWith(EX.cfgFileSuffix)
      && firstCharStrictlyAlnumRgx.test(n)
    );
  },

};


export default EX;
