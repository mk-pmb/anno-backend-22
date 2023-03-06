// -*- coding: utf-8, tab-width: 2 -*-

const symb = {
  book: '🕮',
  books: '📚',
  openBook: '📖',

  chains: '⛓', // Plural but closest concept I found to a singular chain.
  linkSymbol: '🔗', // Usually depicted as a chain, but is it guaranteed?
  linkedPaperclips: '🖇',

  nameBadge: '📛',

  arrowUp: '↑',
  doubleArrowUp: '⇈',
};

function nthLast(a, n) { return a[a.length - n]; }


const lookupFuncs = {

  [symb.books]: ctx => ctx.allMeta.serviceId,
  [symb.chains + symb.arrowUp]: ctx => nthLast(ctx.chainNamesStack, 2),
  [symb.chains + symb.doubleArrowUp]: ctx => nthLast(ctx.chainNamesStack, 3),
  [symb.chains]: ctx => nthLast(ctx.chainNamesStack, 1),
  [symb.nameBadge]: ctx => ctx.allMeta.userId,
  [symb.openBook]: ctx => ctx.allMeta.projectName,

};

const allSlotsRgx = new RegExp(Object.keys(lookupFuncs).join('|'), 'g');

allSlotsRgx.reset = function reset() {
  // Unless we manually reset, the next .test() might report a false negative.
  // -> https://stackoverflow.com/a/2141974
  allSlotsRgx.lastIndex = 0;
  return allSlotsRgx;
};

const EX = {

  hasSlots(spec) {
    const has = allSlotsRgx.reset().test(spec);
    // console.debug('D: emojiTemplate.hasSlots', { spec, has });
    return has;
  },

  compile(spec) {
    // Minimize effort for literal specs (no lookup slots):
    const hs = EX.hasSlots(spec);
    // console.debug('D: emojiTemplate.compile', { spec, hs });
    const f = (hs ? EX.render : String).bind(null, spec);
    f.hasSlots = hs;
    f.origSpec = spec;
    return f;
  },

  render(spec, ctx) {
    const r = spec.replace(allSlotsRgx.reset(), m => lookupFuncs[m](ctx));
    // console.debug('emojiTemplate render:', ctx, { spec }, { r });
    return r;
  },



};


export default EX;
