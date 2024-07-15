// -*- coding: utf-8, tab-width: 2 -*-

const win = 'WITH "content_in" AS (\n#|\n)\n    SELECT  "content_in".*, ';
const jad = '\n  NATURAL JOIN "anno_data" AS "da"';

const EX = {

  addAnnoTitle: `${win}COALESCE(
    "da"."details"->>'dc:title',
    "da"."details"->>'title',
    NULL) AS "title" FROM "content_in"${jad}`,

  addFullContent: `${win}"st"."stamps", "da"."details" FROM "content_in"
    NATURAL LEFT JOIN "anno_stamps_json" AS "st"${jad}`,

  addSubjectTargetRelUrls: `${win}"st".* FROM "content_in"
    NATURAL LEFT JOIN "anno_subjtargets_json" AS "st"`,


};


export default EX;
