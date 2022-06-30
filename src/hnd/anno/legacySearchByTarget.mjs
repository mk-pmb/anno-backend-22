// -*- coding: utf-8, tab-width: 2 -*-

import fmtAnnoCollection from './fmtAnnosAsSinglePageCollection.mjs';
import ubhdAnnoIdFmt from './ubhdAnnoIdFmt.mjs';

import acl from '../../acl/index.mjs';


const {
  versionNumberSeparator,
} = ubhdAnnoIdFmt;


const EX = async function legacySearchByTarget(srv, req, origTargetSpec) {
  (await acl(srv, req, { targetUrl: origTargetSpec })
  ).requirePerm('discover');
  const reply = await srv.db.postgresSelect(EX.queryTpl, [origTargetSpec]);
  const { rows } = reply;
  const annos = rows.map(EX.recombineAnno);
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

  recombineAnno(rec) {
    const versionId = rec.base_id + versionNumberSeparator + rec.version_num;
    const anno = { id: versionId, ...rec.details };
    return anno;
  },

});


export default EX;
