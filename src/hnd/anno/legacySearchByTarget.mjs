// -*- coding: utf-8, tab-width: 2 -*-

import fmtAnnoCollection from './fmtAnnosAsSinglePageCollection.mjs';
import redundantGenericAnnoMeta from './redundantGenericAnnoMeta.mjs';


const EX = async function legacySearchByTarget(srv, req, origTargetSpec) {
  await srv.acl.requirePerm(req, {
    targetUrl: origTargetSpec,
    privilegeName: 'discover',
  });
  const rows = await srv.db.postgresSelect(EX.queryTpl, [origTargetSpec]);
  const annos = rows.map(a => EX.recombineAnno(srv, a));
  fmtAnnoCollection.replyToRequest(srv, req, { annos });
};


const queryTpl = ([
  'base_id',
  'version_num',
  'details',
].map(f => 'data.' + f).join(', ') + `
  FROM anno_links AS links
  INNER JOIN anno_data AS data
    ON links.rel = 'subject'
    AND links.url = $1
    AND data.base_id = links.base_id
`).trim();


Object.assign(EX, {

  queryTpl,

  recombineAnno(srv, rec) {
    const idParts = {
      baseId: rec.base_id,
      versNum: rec.version_num,
    };
    const fullAnno = redundantGenericAnnoMeta.add(srv, idParts, rec.details);
    return fullAnno;
  },

});


export default EX;
