// -*- coding: utf-8, tab-width: 2 -*-

import loMapValues from 'lodash.mapvalues';
import pgDumpWriter from 'postgres-dump-writer-helpers-220524-pmb';


console.log('-- -*- coding: UTF-8, tab-width: 2 -*-\n');
console.log('-- $date$ File generated at ' + (new Date()).toString() + '\n');

const annoAddrTypes = {
  base_id: 'char*',
  version_num: 'smallint',
};

const annoAddrUniq = loMapValues(annoAddrTypes, v => v + ' ¹addr');

const indexColumnFlag = ' B'; // btree


const dfOpt = {
  tableNamePrefix: 'anno_',
};


// We have to drop all views before we can drop their tables.
console.log('DROP VIEW IF EXISTS anno_stamps_effuts;');


console.log(pgDumpWriter.fmtCreateSimpleTable('data', {
  ...annoAddrUniq,
  time_created: 'ts',
  author_local_userid: 'char* B',
  details: 'json',
  // debug_mongo_doc_id: 'char* ? B',
  debug_doi_verified: 'char* ?',
  // debug_replyto: 'char* ?',
}, {
  ...dfOpt,
}));


console.log(pgDumpWriter.fmtCreateSimpleTable('links', {
  ...annoAddrTypes,
  rel: 'char*' + indexColumnFlag,
  url: 'char*' + indexColumnFlag,
}, {
  ...dfOpt,
}));


console.log(pgDumpWriter.fmtCreateSimpleTable('stamps', {
  ...annoAddrUniq,
  st_type: 'char* ¹addr',
  st_at: 'ts',
  st_effts: 'ts ?',   // effective timestamp, if different from st_at
  st_by: 'char*',
  st_detail: 'json ?',
}, {
  ...dfOpt,
}));

console.log(`CREATE VIEW anno_stamps_effuts AS SELECT "st".*,
  extract(epoch from COALESCE("st"."st_effts", "st"."st_at"))
  AS st_effuts FROM "anno_stamps" AS "st";\n`);
// ^- Adding COALESCE(…, 0) here would be useless for most JOINs
//    because a non-existing stamp would still produce either NULL
//    or row omission, never number 0.













// eof
