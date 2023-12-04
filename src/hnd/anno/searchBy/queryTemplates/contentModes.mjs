// -*- coding: utf-8, tab-width: 2 -*-

const win = 'WITH "in" AS (\n#|\n)\n    SELECT  "in".*, ';
const jad = '\n  NATURAL JOIN "anno_data" AS "da"';

const EX = {

  addAnnoTitle: `${win}COALESCE(
    "da"."details"->>'dc:title',
    "da"."details"->>'title',
    NULL) AS "title" FROM "in"${jad}`,

  addFullContent: `${win}"st"."stamps", "da"."details" FROM "in"
    NATURAL LEFT JOIN "anno_stamps_json" AS "st"${jad}`,

  addSubjectTargetRelUrls: `${win}"st".* FROM "in"
    NATURAL LEFT JOIN "anno_subjtargets_json" AS "st"`,


};


export default EX;
