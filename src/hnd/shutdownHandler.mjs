// -*- coding: utf-8, tab-width: 2 -*-

import httpErrors from '../httpErrors.mjs';
import sendFinalTextResponse from '../finalTextResponse.mjs';


const EX = async function shutdownHandler(req) {
  await req.getSrv().acl.requirePerm(req, { privilegeName: 'shutdown' });
  const mtd = req.method;
  if (mtd === 'GET') { return EX.renderButtonForm(req); }
  if (mtd === 'POST') { return EX.scheduleShutdown(req); }
  return httpErrors.badVerb();
};


Object.assign(EX, {

  renderButtonForm(req) {
    const html = [
      '<!DOCTYPE html>',
      '<meta charset="UTF-8">',
      '<title>Shutdown?</title>',
      '<form method="post" action="">',
      '  <input type="submit" value="Shutdown now">',
      '</form>',
      '',
    ].join('\n');
    return sendFinalTextResponse(req, { text: html, type: 'html' });
  },

  scheduleShutdown(req) {
    const srv = req.getSrv();
    setImmediate(() => srv.close());
    const msg = { shutdownScheduledAt: (new Date()).toISOString() };
    return sendFinalTextResponse.json(req, msg);
  },

});


export default EX;
