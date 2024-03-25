// -*- coding: utf-8, tab-width: 2 -*-

import crObAss from 'create-object-and-assign';
import mapValues from 'lodash.mapvalues';


const sumSign = '\u2211';

function fmtMsec(ms) {
  if (ms >= 1e3) { return (ms / 1e3).toFixed(3) + 's'; }
  return ms + 'ms';
}


function signed(x, p) {
  if (x.startsWith('-')) { return x; }
  return (p || '+') + x;
}


const EX = {

  durations(times) {
    const { ZERO, ...durations } = times;
    return crObAss(EX.durationsApi, mapValues(durations, t => t - ZERO));
  },

  durationsApi: {
    toString() {
      const durations = this;
      let buf = '';
      let prev = 0;
      Object.keys(durations).forEach(function fmt(k) {
        const t = +durations[k];
        buf += ((buf && ', ') + k + ':' + signed(fmtMsec(t - prev))
          + sumSign + fmtMsec(t));
        prev = t;
      });
      return '[Stopwatch: ' + (buf || 'no measurements') + ']';
    },
  },


};

export default EX;
