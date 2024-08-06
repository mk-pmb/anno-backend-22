// -*- coding: utf-8, tab-width: 2 -*-

const EX = {

  latestVersionOnly: `WITH "latest_only_in" AS (\n#|\n)
    SELECT DISTINCT ON ("base_id") *
    FROM "latest_only_in" ORDER BY "base_id" ASC, "version_num" DESC
    `,


};


export default EX;
