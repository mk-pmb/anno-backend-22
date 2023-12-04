// -*- coding: utf-8, tab-width: 2 -*-

const EX = {

  latestOnly: `WITH "in" AS (\n#|\n)
    SELECT DISTINCT ON ("base_id") *
    FROM "in" ORDER BY "base_id" ASC, "version_num" DESC
    `,


};


export default EX;
