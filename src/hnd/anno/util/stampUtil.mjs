// -*- coding: utf-8, tab-width: 2 -*-

function orf(x) { return x || false; }


const EX = {

  stampNamespaceRgx: /^\w+(?=:)/,
  // ^- This check is intentionally kept rather lenient, including accepting
  //    U+005F low line (_) at the start and end. There is no need to be
  //    strict here, because that responsibility lies with the ACL.

  splitStampNameNS(stType, errInvalid) {
    const stNS = orf(EX.stampNamespaceRgx.exec(stType))[0];
    if (!stNS) { throw errInvalid('Unsupported stamp namespace'); }
    const stName = stType.slice(stNS.length + 1);
    const aclStampName = stNS + '_' + stName;
    return { stType, stNS, stName, aclStampName };
  },


};


export default EX;
