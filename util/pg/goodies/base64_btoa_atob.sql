
SELECT encode(convert_to('{"héllo": "wörld!"}', 'UTF-8'), 'base64')::text AS b,
  convert_from(decode('eyJow6lsbG8iOiAid8O2cmxkISJ9', 'base64'), 'UTF-8')::text AS a,
  convert_from(decode('eyJow6lsbG8iOiAid8O2cmxkISJ9', 'base64'), 'UTF-8')::json AS j


SELECT 'base64 -d >anno.' || base_id || '~' || version_num || e'.json <<<"\n'
  || encode(convert_to(details::text, 'UTF-8'), 'base64') || '"' AS b
FROM anno_data
WHERE base_id IN ('egTd18ZjSNuOlhD23joRzg', 'M69FyD1SSg-RK-ZLcjC6WQ')


SELECT '( echo "{"' AS b
UNION
SELECT 'base64 -d <<<"'
  || encode(convert_to('"' || base_id || '~' || version_num || '": '
  || details::text || e',\n', 'UTF-8'), 'base64') || '"' AS b
FROM anno_data
WHERE base_id IN ('egTd18ZjSNuOlhD23joRzg', 'M69FyD1SSg-RK-ZLcjC6WQ')
UNION
SELECT 'echo -e "\x22\x22: null }" ) >annos.json' AS b






-- -*- coding: UTF-8, tab-width: 2 -*-
