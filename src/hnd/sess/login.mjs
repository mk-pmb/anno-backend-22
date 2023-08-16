// -*- coding: utf-8, tab-width: 2 -*-

import whoamiHnd from './whoami.mjs';

const whoamiOpt = { detectorOpts: { occasion: 'session:login' } };

const EX = function login(req) { return whoamiHnd.hndImpl(req, whoamiOpt); };

export default EX;
