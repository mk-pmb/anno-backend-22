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


const views = { // in order of creation – will be dropped in reverse order.

  anno_disclosed: `
    SELECT "base_id", "version_num" FROM "anno_data"
    EXCEPT
    SELECT "base_id", "version_num" FROM "anno_stamps"
      WHERE "st_type" = '_ubhd:unapproved'
    `,

  anno_unapproved: `
    SELECT "base_id", "version_num" FROM "anno_stamps"
      WHERE "st_type" = '_ubhd:unapproved'
    EXCEPT
    SELECT "base_id", "version_num" FROM "anno_stamps"
      WHERE "st_type" = 'as:deleted'
    `,

  anno_stamps_effuts: `
    SELECT *, extract(epoch from COALESCE("st_effts", "st_at")) AS st_effuts
    -- Appending 0 to the arguments list of COALESCE here would be useless
    -- for most JOINs because a non-existing stamp would still produce either
    -- NULL or row omission, never number 0.
    FROM "anno_stamps"
    `,

  anno_stamps_as_json: `
    SELECT "base_id", "version_num", json_agg(
      jsonb_build_object(
        'type', "st_type",
        'ts', COALESCE(extract(epoch from COALESCE("st_effts", "st_at")), 0),
        'detail', "st_detail")
      ORDER BY "st_type" ASC
      ) AS "stamps"
    FROM "anno_stamps" GROUP BY "base_id", "version_num"
    `,

};

// We have to drop all views before we can drop their tables.
Object.keys(views).reverse().forEach(
  name => console.log('DROP VIEW IF EXISTS "' + name + '";'));


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




loMapValues(views, function createView(recipe, name) {
  console.log('CREATE VIEW "' + name + '" AS ' + recipe.trimEnd() + ';\n');
});













// eof
