// -*- coding: utf-8, tab-width: 2 -*-

const msecPerMinute = 6e4;


const EX = function guestAccessOnly() {
  return EX.dummyDetectIdentityGuestAccessOnly;
};


Object.assign(EX, {

  dummyDetectIdentityGuestAccessOnly() {
    return EX.dummyGuestSession;
  },

  dummyGuestSession(report) {
    if (!report) { return false; }
    const soon = Date.now() + (10 * msecPerMinute);
    return {
      userId: '',
      renewalAvailableBefore: soon,
      sessionExpiryHardLimit: soon,
      ...report,
    };
  },

});



export default EX;
