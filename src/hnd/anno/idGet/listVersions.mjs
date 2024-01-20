// -*- coding: utf-8, tab-width: 2 -*-

import fmtAnnoCollection from '../fmtAnnosAsSinglePageCollection.mjs';
import genericAnnoMeta from '../redundantGenericAnnoMeta.mjs';
import httpErrors from '../../../httpErrors.mjs';
import multiSearch from '../searchBy/multiSearch.mjs';
import ubhdAnnoIdFmt from '../ubhdAnnoIdFmt.mjs';

const versionSep = ubhdAnnoIdFmt.versionNumberSeparator;

const {
  methodNotAllowed,
  noSuchAnno,
} = httpErrors.throwable;


function uts2iso(u) { return (new Date(u * 1e3)).toISOString(); }


const EX = async function listVersions(ctx) {
  const { srv, req, idParts } = ctx;
  if (req.method !== 'GET') { throw methodNotAllowed(); }

  /* Example for an annotation with many versions:
     https://anno.ub.uni-heidelberg.de/anno/anno/JhTAtRbrSOib9OJERGptUg */
  const latestPubUrl = genericAnnoMeta.constructLatestPubUrl(srv, idParts);

  // await minis.lookupLatestVersionNum(ctx);
  const searchBaseId = idParts.baseId;
  const allVisibleVersions = await multiSearch({ srv, req, searchBaseId });
  // console.debug('listVersions: allVisibleVersions:', allVisibleVersions);
  if (!allVisibleVersions.length) { throw noSuchAnno(); }

  function makePreview(rec) {
    const anno = {
      id: latestPubUrl + versionSep + rec.version_num,
      created: rec.time_created.toISOString(),
    };
    if (rec.disclosed) {
      if (!rec.sunny) { anno['as:deleted'] = uts2iso(rec.sunset_uts); }
    } else {
      anno['dc:dateAccepted'] = false;
    }
    return anno;
  }

  const previews = allVisibleVersions.map(makePreview);
  fmtAnnoCollection.replyToRequest(srv, req, { annos: previews });
};


export default EX;
