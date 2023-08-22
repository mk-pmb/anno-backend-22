
-- Approve imported annotations for some prefix before some date:
INSERT INTO "anno_stamps" ("base_id", "version_num", "st_type", "st_at", "st_by")
SELECT "li"."base_id", "li"."version_num", 'dc:dateAccepted', NOW(), ''
FROM "anno_links" AS "li"
JOIN "anno_data" AS "ad"
  ON "ad"."base_id" = "li"."base_id"
  AND "ad"."version_num" = "li"."version_num"
LEFT JOIN "anno_stamps" AS "st"
  ON "st"."base_id" = "li"."base_id"
  AND "st"."version_num" = "li"."version_num"
  AND "st"."st_type" = 'dc:dateAccepted'
WHERE "st"."st_type" IS NULL AND "li"."rel" = 'subject'
  AND starts_with("li"."url", 'https://digi.ub.uni-heidelberg.de/diglit/')
  AND "ad"."time_created" < '2023-08-22 00:00'
LIMIT 10 -- UBHD test dump 2022: ~33k records
-- ^- The LIMIT protects your browser when you copy only the SELECT part
--    into pgAdminer for debug preview.








-- -*- coding: UTF-8, tab-width: 2 -*-
