// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import nodeFs from 'fs';

import mustBe from 'typechecks-pmb/must-be.js';
import pEachSeries from 'p-each-series';
import pgDumpWriter from 'postgres-dump-writer-helpers-220524-pmb';
import readRelaxedJsonFromStdin from 'read-relaxed-json-from-stdin-pmb';
import sortedJson from 'safe-sortedjson';
import vTry from 'vtry';

import miscMetaFieldInfos from '../miscMetaFieldInfos.mjs';
import parseRequestBody from '../../util/parseRequestBody.mjs';
import parseVersId from '../parseVersionIdentifier.mjs';

import fmtRelRecs from './fmtRelRecs.mjs';
import parseSubmittedAnno from './parseSubmittedAnno.mjs';


const EX = {

  defaultMainTimer: setTimeout(() => EX.cliMain(), 10),
  // ^- Allow other modules that import this one to cancel the default action.

  cfg: {
    annoUser: process.env.ANNOUSER || '',
    baseUrl: process.env.BASEURL || '',
    destFile: (process.env.DESTFILE || 'tmp.anno2pg_cli.sql'),
  },


  simpleDateStampTypes: [
    ...miscMetaFieldInfos.visibilityRelatedStampsNames,
  ],


  doiField: 'dc:identifier',


  dbRecords: {
    data: [],
    links: [],
    stamps: [],
  },


  async init() {
    const { baseUrl } = EX.cfg;
    mustBe.nest('Public base URL', baseUrl);
    if (baseUrl.endsWith('/')) {
      throw new Error('Public base URL must not end in a slash.');
    }
  },


  async cliMain() {
    const logFunc = console.info;
    const annos = await readRelaxedJsonFromStdin({ logFunc });

    if (!EX.cfg.baseUrl) {
      console.warn('W: Guessing base URL from first annotation!');
      const bu = String((annos[0] || false).id
        || '').replace(/\/anno\/[\!-\.0-~]+$/, '');
      console.warn('W: Base URL is assumed to be', bu);
      if (!/^\w+:\/{2}/.test(bu)) {
        throw new Error('Unsupported protocol in guessed base URL.');
      }
      EX.cfg.baseUrl = bu;
    }

    await EX.init();
    await pEachSeries(annos, EX.fallibleImportOneAnno);
    logFunc('Imported %s annotations.', annos.length);

    const { destFile } = EX.cfg;
    logFunc('Output will be written to: %s', destFile);
    const fileWrSt = nodeFs.createWriteStream(destFile);
    const stst = pgDumpWriter.stmtStream.fromNativeWriteStream(fileWrSt);

    function writeOneTable(tbl) {
      const recs = EX.dbRecords[tbl];
      recs.forEach(rec => pgDumpWriter.fmtInsert(rec,
        { TABLE: 'anno_' + tbl, STREAM: stst }));
      stst.endCurrentStatement();
    }

    writeOneTable('data');
    writeOneTable('links');
    writeOneTable('stamps');
    stst.end();
  },


  fallibleImportOneAnno(anno, idx) {
    const recNum = idx + 1;
    return vTry.pr(EX.importOneAnno, 'Import record #' + recNum)(anno);
  },


  async importOneAnno(origAnno) {
    const isoDateNow = (new Date()).toISOString();
    let { annoUser } = EX.cfg;
    const minimumConfig = { publicBaseUrlNoSlash: EX.cfg.baseUrl };
    const stamps = [];

    async function validateInput(pop) {
      annoUser = (pop('undef | nonEmpty str', 'ubhd:anno-user') || annoUser);
      EX.simpleDateStampTypes.forEach(function convertStamp(stampType) {
        const val = pop('undef | nonEmpty str', stampType);
        if (!val) { return; }
        const isoDateVal = (new Date(val)).toISOString();
        stamps.push({ st_type: stampType, st_at: isoDateVal });
      });
      const parsed = parseSubmittedAnno(pop, {
        ...minimumConfig,
        extraCopyFields: {
          created: 'nonEmpty str',
          [EX.doiField]: 'undef | nonEmpty str',
        },
      });
      // const createdTimeJs = new Date(parsed.created)).getTime();
      return parsed;
    }

    const anno = await parseRequestBody.fancify(origAnno)
      .catchBadInput(validateInput);
    const { baseId, versNum } = parseVersId.fromLocalUrl(minimumConfig,
      Error, mustBe.nest('Anno ID URL', anno.id));
    if (!versNum) { throw new Error('Anno ID URL must include version!'); }
    const idParts = { base_id: baseId, version_num: versNum };
    const annoCreatedTime = mustBe.nest('Anno creation time', anno.created);
    const stampDefaults = {
      ...idParts,
      st_at: annoCreatedTime || isoDateNow,
      st_by: annoUser || '',
    };

    const dbr = EX.dbRecords;
    dbr.data.push({
      ...idParts,
      time_created: annoCreatedTime,
      author_local_userid: annoUser,
      details: sortedJson(anno, { space: 0 }),
    });
    const relRecs = fmtRelRecs({ srv: minimumConfig, anno, baseId, versNum });
    dbr.links = dbr.links.concat(relRecs);
    stamps.forEach(st => dbr.stamps.push({ ...stampDefaults, ...st }));
  },


};




export default EX;
