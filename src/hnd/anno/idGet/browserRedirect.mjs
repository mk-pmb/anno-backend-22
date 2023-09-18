// -*- coding: utf-8, tab-width: 2 -*-

import makeDictList from 'dictlist-util-pmb';


function orf(x) { return x || false; }

function slot(val) {
  return function expectSlotValue(m) {
    if (val) { return val; }
    throw new Error('No data for redirect URL slot ' + m);
  };
}


const EX = {

  fmtUrl(found, ctx) {
    const urlMeta = found.primarySubjectUrlMeta(ctx.req);
    const svcId = urlMeta.serviceId;
    const svcCfg = svcId && ctx.srv.services.get(svcId);
    if (!svcCfg) { throw new Error('Failed to lookup service config'); }
    let url = svcCfg.annoBrowserRedirect || '%sc';
    url = url.replace(/%sv/g, svcId);

    url = url.replace(/%bi/g, ctx.idParts.baseId);
    url = url.replace(/%vi/g, ctx.idParts.versId);
    url = url.replace(/%vn/g, ctx.idParts.versNum);

    const anno = orf(found.annoDetails);
    const subjUrl = found.primarySubjectTargetUrl();
    const scopes = makeDictList(anno.target).getEachOwnProp('scope');
    url = url.replace(/%sc/g, slot(scopes[0] || subjUrl));
    url = url.replace(/%st/g, slot(subjUrl));

    return url;
  },

};

export default EX;
