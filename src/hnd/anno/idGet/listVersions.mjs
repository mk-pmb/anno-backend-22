// -*- coding: utf-8, tab-width: 2 -*-

import fmtAnnoCollection from '../fmtAnnosAsSinglePageCollection.mjs';
import genericAnnoMeta from '../redundantGenericAnnoMeta.mjs';
import ubhdAnnoIdFmt from '../ubhdAnnoIdFmt.mjs';

import minis from './minis.mjs';
import queryTpl from './queryTpl.mjs';

const versionSep = ubhdAnnoIdFmt.versionNumberSeparator;


const EX = async function listVersions(ctx) {
  const { srv, req, idParts } = ctx;
  /* Example for an annotation with many versions:
     https://anno.ub.uni-heidelberg.de/anno/anno/JhTAtRbrSOib9OJERGptUg */
  const latestPubUrl = genericAnnoMeta.constructLatestPubUrl(srv, idParts);
  await minis.lookupLatestVersionNum(ctx);
  // :TODO: Consider ACL permissions
  const { baseId } = idParts;
  const allVers = await srv.db.postgresSelect(queryTpl.allVersions,
    [baseId]);
  const previews = allVers.map(rec => ({
    id: latestPubUrl + versionSep + rec.version_num,
    created: rec.time_created.toISOString(),
  }));
  fmtAnnoCollection.replyToRequest(srv, req, { annos: previews });
};


export default EX;
