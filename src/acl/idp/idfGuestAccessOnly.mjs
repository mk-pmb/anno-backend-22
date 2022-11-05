// -*- coding: utf-8, tab-width: 2 -*-

const secPerMinute = 60;


const EX = function guestAccessOnly() {
  return EX.dummyDetectIdentityGuestAccessOnly;
};


function unixtime() { return Math.floor(Date.now() / 1e3); }


Object.assign(EX, {

  dummyDetectIdentityGuestAccessOnly() {
    return EX.dummyGuestSession;
  },

  dummyGuestSession(report) {
    if (!report) { return false; }
    const soon = unixtime() + (10 * secPerMinute);
    return {
      userId: '',
      renewalAvailableBefore: soon,
      sessionExpiryHardLimit: soon,
      ...report,
    };
  },

});



export default EX;
