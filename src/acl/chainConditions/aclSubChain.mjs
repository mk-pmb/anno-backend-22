// -*- coding: utf-8, tab-width: 2 -*-

const EX = async function aclSubChain(chainCtx, chainName) {
  const subCtx = {
    ...chainCtx,
    chainNamesStack: [...chainCtx.chainNamesStack, chainName],
  };
  if (chainCtx.chainNamesStack.includes(chainName)) {
    const msg = ('Circular aclSubChain: '
      + subCtx.chainNamesStack.join(' › '));
    throw new Error(msg);
  }

  const { state } = chainCtx;
  state.decision = 'stub!';
};


export default EX;
