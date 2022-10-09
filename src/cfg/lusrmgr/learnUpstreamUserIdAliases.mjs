// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';


const EX = function learnUpstreamUserIdAliases(ctx, userName, aliases) {
  if (!aliases) { return; }
  const known = ctx.mgr.upstreamUserIdAliases;
  aliases.forEach(function learnAlias(origAliasSpec) {
    const popSpec = objPop(origAliasSpec, { mustBe }).mustBe;
    let aka = popSpec('str', 'id'); // additional external user ID
    popSpec.done('Unsupported user identity alias option(s)');

    aka = aka.replace(/\s+/g, '');
    if (!aka) {
      const msg = 'Empty or whitespace-only alias for user ' + userName;
      const err = new Error(msg);
      throw err;
    }

    if (!known.has(aka)) { return known.set(aka, userName); }

    const winner = known.get(aka);
    const msg = ('Duplicate upstream user alias: ' + aka
      + ', to be added for user ' + userName
      + ', but already used for user ' + winner);
    const err = new Error(msg);
    err.name = 'DuplicateUserAliasError';
    err.alias = aka;
    err.loser = userName;
    err.winner = winner;
    throw err;
  });
};


export default EX;
