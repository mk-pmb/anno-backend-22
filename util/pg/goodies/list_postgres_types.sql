WITH types_summary AS (
  SELECT pg_get_userbyid(t.typowner) AS owner_name,
    n.nspname AS schema,
    t.typname AS type_name,
    CASE c.relkind
      WHEN 'c' THEN 'custom'
      WHEN 'i' THEN 'index'
      WHEN 'r' THEN 'table'
      WHEN 'S' THEN 'sequence'
      WHEN 's' THEN 'special'
      WHEN 'v' THEN 'view'
      ELSE '??:' || c.relkind::text
    END AS category,
    (row_to_json(t)::jsonb - 'typname' - 'oid' - 'typarray' - 'typrelid'
    )::text AS structure
  FROM pg_catalog.pg_type AS t
  LEFT JOIN pg_catalog.pg_namespace AS n ON n.oid = t.typnamespace
  LEFT JOIN pg_catalog.pg_class AS c
    ON c.relnamespace = t.typnamespace AND c.relname = t.typname
  WHERE t.typtype = 'c'
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
  ORDER BY owner_name ASC, schema ASC, type_name ASC
),
types_with_same_structure AS (
  SELECT owner_name, schema, category,
    string_agg(type_name, e'\n') AS type_names
    -- , jsonb_pretty(structure::jsonb)
  FROM types_summary
  GROUP BY owner_name, schema, category, structure
)
SELECT * FROM types_with_same_structure
ORDER BY owner_name ASC, schema ASC, category ASC, type_names ASC





-- -*- coding: UTF-8, tab-width: 2 -*-
