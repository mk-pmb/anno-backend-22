// -*- coding: utf-8, tab-width: 2 -*-

function padIf(b, x, a) { return (x ? b + x + (a || '') : ''); }

function defaultSearchOrder(sourcePrefix) {
  const a = padIf('"', sourcePrefix, '".') + '"';
  const b = '" #orderByTimeDirection';
  const l = [
    'time_created',
    'base_id',
    'version_num',
  ];
  return l.join(', ').replace(/\w+/g, m => a + m + b);
}


const EX = {

  defaultSearchOrder,

  orderedSearch: `
    WITH "found" AS (
      #|
    ) SELECT * FROM "found"
    ORDER BY #orderedSearchPrioritize #orderedSearchDefaultOrderNoPrefix
    LIMIT #orderedSearchLimit
    `.trim(),

  orderedSearchSource: '#unrestrictedSearch',
  orderedSearchPrioritize: '',
  orderedSearchLimit: 'ALL',

  orderByTimeDirection: 'DESC', /*
    Usually, people are more interested in newest annos.
    Bot queues however will usually want FIFO, but bots can say so.
    */

  orderedSearchDefaultOrder: defaultSearchOrder,
  orderedSearchDefaultOrderNoPrefix: defaultSearchOrder(),

};


export default EX;
