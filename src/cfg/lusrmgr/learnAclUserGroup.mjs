// -*- coding: utf-8, tab-width: 2 -*-

const EX = function learnGroup(ctx, grpName, mustPopDetail) {
  const { users } = ctx.mgr;
  const members = mustPopDetail('undef | ary', 'usernames');
  (members || []).forEach(function learn(userName) {
    const u = users.get(userName);
    if (!u) {
      const msg = 'Group config adds unknown user. Ignored.';
      console.warn(msg, { grpName, userName });
      return;
    }
    u.aclUserGroups.add(grpName);
  });
  mustPopDetail.done('Unsupported user group option(s)');
};


export default EX;
