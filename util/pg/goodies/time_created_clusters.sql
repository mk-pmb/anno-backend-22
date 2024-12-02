-- We have a lot of annos that claim they were created at the exact same
-- millisecond, even multiple versions in the same lineage.

WITH pop AS (
  SELECT time_created, COUNT(1) AS date_popularity
  FROM anno_data GROUP BY time_created
  ORDER BY date_popularity DESC, date_popularity ASC
),
dupes AS (SELECT * FROM pop WHERE date_popularity > 1),
clsz AS (
  SELECT date_popularity, COUNT(1) AS date_cluster_size
  FROM dupes GROUP BY date_popularity
  ORDER BY date_cluster_size DESC, date_popularity ASC
)
SELECT * FROM clsz
LIMIT 100


-- -*- coding: UTF-8, tab-width: 2 -*-
