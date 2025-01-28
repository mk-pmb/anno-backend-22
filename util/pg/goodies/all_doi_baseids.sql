WITH doi_baseids AS (SELECT DISTINCT base_id FROM anno_dois)
  , doi_check AS (SELECT base_id, version_num, ident FROM anno_dois)
  , doi_urls AS (SELECT '_' AS versep,
    'https://doi.org/10.11588/anno.diglit.' AS baseurl)
SELECT
  (doi_urls.baseurl || LOWER(base_id) || doi_urls.versep
    || version_num) AS probably_missing_doi_url,
  (doi_urls.baseurl || LOWER(base_id) || doi_urls.versep
    || (version_num - 1)) AS probably_last_doi_url,
  da.*
FROM anno_data AS da
NATURAL JOIN doi_baseids
NATURAL LEFT JOIN doi_check
JOIN doi_urls ON TRUE
WHERE doi_check.ident IS NULL
ORDER BY base_id ASC, version_num ASC
LIMIT 100

-- -*- coding: UTF-8, tab-width: 2 -*-
