// -*- coding: utf-8, tab-width: 2 -*-

const EX = {
  annoDetails: ('"details", "author_local_userid"'
    + ' FROM "anno_data" WHERE "base_id" = $1'
    + ' AND "version_num" = $2 LIMIT 2'
  ),
  annoStamps: ('*'
    + ' FROM "anno_stamps" WHERE "base_id" = $1'
    + ' AND "version_num" = $2 LIMIT 2'
  ),
  latestVersion: (
    'MAX("version_num") AS "latest"'
    + ' FROM "anno_data" WHERE "base_id" = $1'
  ),
  allVersions: ('"version_num", "time_created"'
    + ' FROM "anno_data" WHERE "base_id" = $1'
  ),
};


export default EX;
