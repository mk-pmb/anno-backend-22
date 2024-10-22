-- !!
-- !! Make sure the DB is idle and nobody submits
-- !! any new anno while you run this!
-- !!

SELECT SETVAL('anno_data_pg_row_id_seq1',
  (SELECT MAX(pg_row_id) FROM anno_data));

SELECT SETVAL('anno_links_pg_row_id_seq1',
  (SELECT MAX(pg_row_id) FROM anno_links));

SELECT SETVAL('anno_stamps_pg_row_id_seq1',
  (SELECT MAX(pg_row_id) FROM anno_stamps));


-- -*- coding: UTF-8, tab-width: 2 -*-
