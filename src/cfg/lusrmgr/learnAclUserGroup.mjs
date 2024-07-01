// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';


const EX = function learnGroup(ctx, grpName, mustPopDetail) {
  const { users } = ctx.mgr;
  const members = mustPopDetail('ary | undef | nul', 'usernames');
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


Object.assign(EX, {

  async learnMeta(ctx, mustPopCfgMeta) {
    const { cfgDict, mgr } = ctx;

    (function setupDefaultUserGroups() {
      const cfgKey = 'default_user_groups';
      const dug = mustPopCfgMeta('obj | undef', cfgKey);
      if (!dug) { return; }
      const allUserNames = Array.from(mgr.users.keys());
      if (!allUserNames.length) {
        return console.warn('Skipping default_user_groups setup'
          + ' because we do not have any known users.');
      }
      const astRgx = /\*/g;
      Object.entries(dug).forEach(function eachGroup(ent) {
        const [groupNameTpl, groupDetailsSpec] = ent;
        const membersTpl = groupDetailsSpec.usernames;
        allUserNames.forEach(function eachUser(asteriskUser) {
          const mb = membersTpl.map(function eachName(mt) {
            const un = mt.replace(astRgx, asteriskUser);
            return (allUserNames.includes(un) && un);
          }).filter(Boolean);
          if (!mb.length) { return; }
          const grName = groupNameTpl.replace(astRgx, asteriskUser);
          if (getOwn(cfgDict, grName)) {
            return console.warn('Skipping default_user_groups setup'
              + ' for this group because it already exists: ' + grName);
          }
          cfgDict[grName] = { ...groupDetailsSpec, usernames: mb };
        });
      });
    }());
  },



});


export default EX;
