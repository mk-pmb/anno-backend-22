// -*- coding: utf-8, tab-width: 2 -*-

import fmtAnnoCollection from '../fmtAnnosAsSinglePageCollection.mjs';
import genericAnnoMeta from '../redundantGenericAnnoMeta.mjs';
import httpErrors from '../../../httpErrors.mjs';
import multiSearch from '../searchBy/multiSearch.mjs';
import ubhdAnnoIdFmt from '../ubhdAnnoIdFmt.mjs';

import findLatest from './findLatestVersionNumsForBaseId.mjs';

const versionSep = ubhdAnnoIdFmt.versionNumberSeparator;

const {
  methodNotAllowed,
  noSuchAnno,
} = httpErrors.throwable;


function orf(x) { return x || false; }
function uts2iso(u) { return (new Date(u * 1e3)).toISOString(); }


const EX = async function listVersions(ctx) {
  const { srv, req, idParts } = ctx;
  if (req.method !== 'GET') { throw methodNotAllowed(); }

  /* Example for an annotation with many versions:
     https://anno.ub.uni-heidelberg.de/anno/anno/JhTAtRbrSOib9OJERGptUg */
  const latestPubUrl = genericAnnoMeta.constructLatestPubUrl(srv, idParts);

  // await minis.lookupLatestVersionNum(ctx);
  const searchConfig = {
    searchBaseId: idParts.baseId,
  };
  const allVisibleVersions = await multiSearch({ srv, req, ...searchConfig });
  // console.debug('listVersions: allVisibleVersions:', allVisibleVersions);
  if (!allVisibleVersions.length) { throw noSuchAnno(); }

  const workingCopyVersion = (await findLatest(ctx)).max;
  const workingCopyUrl = latestPubUrl + versionSep + workingCopyVersion;
  req.res.links({ 'working-copy': workingCopyUrl });

  const role = ctx.req.asRoleName;

  function makePreview(rec) {
    const anno = {
      id: latestPubUrl + versionSep + rec.version_num,
      created: rec.time_created.toISOString(),
      'iana:working-copy': workingCopyUrl,
    };
    if (role) {
      if (!rec.disclosed) { anno['dc:dateAccepted'] = false; }
      if (!rec.sunny) { anno['as:deleted'] = uts2iso(rec.sunset_uts); }
    }
    return anno;
  }

  const meta = orf(allVisibleVersions.meta);
  const coll = {
    annos: allVisibleVersions.map(makePreview),
    extraTopFields: { 'skos:note': String(meta.stopwatchDurations) },
  };
  fmtAnnoCollection.replyToRequest(srv, req, coll);
};


export default EX;
