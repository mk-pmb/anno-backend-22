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


console.log(pgDumpWriter.fmtCreateSimpleTable('data', {
  ...annoAddrUniq,
  time_created: 'ts',
  author_local_userid: 'char* B',
  details: 'json',
  debug_mongo_doc_id: 'char* ? B',
  debug_doi_verified: 'char* ?',
  debug_replyto: 'char* ?',
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



// eof
