// -*- coding: utf-8, tab-width: 2 -*-

const EX = async function checkVersionModifications(srv, anno) {
  const versOf = anno['dc:isVersionOf'];
  if (!versOf) { return; }
  throw new Error('checkVersionModifications: stub!');
};


export default EX;
