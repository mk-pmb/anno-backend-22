// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be';
import xmlAttrDict from 'xmlattrdict';

import httpErrors from '../../httpErrors.mjs';
import plumb from '../util/miscPlumbing.mjs';
import sendFinalTextResponse from '../../finalTextResponse.mjs';


const errNoCanvasPattern = httpErrors.notImpl.explain(
  'This service is not configured to support IIIF.').throwable;


function orf(x) { return x || false; }
function propIf(o, k) { return (o && o[k]) || o; }


const EX = function fmtAnnosAsIiif3() {
  throw new Error('Need req.aclMetaCache => use .replyToRequest()!');
};


Object.assign(EX, {

  miradorAcceptableMotivation: 'commenting', /*
    Mirador 3 will ignore annos with these motivations:
      * commenting
      * linking
      * replying
      * (maybe more?)
  */


  replyToRequest(srv, req, origHow) {
    const { annos, extraTopFields } = origHow;
    mustBe.ary('Annotations list', annos);
    const canonicalUrl = plumb.guessOrigReqUrl(srv, req);
    mustBe.nest('canonicalUrl', canonicalUrl);

    const annoListMeta = orf(annos.meta);
    const fmtCtx = {
      ...EX.predictCanvasForMultiTargetAnno(annoListMeta, req.aclMetaCache),
      logCkp: req.logCkp.bind(req),
    };

    const coll = {
      '@context': 'http://iiif.io/api/presentation/3/context.json',
      type: 'AnnotationPage', /* No array! Mirador 3 expects string. */
      id: canonicalUrl,
      items: arrayOfTruths.ifAnyMap(annos, EX.fmtOneAnno.bind(null, fmtCtx)),
      ...annoListMeta.extraTopFields,
      ...extraTopFields,
    };
    return sendFinalTextResponse.json(req, coll);
  },


  predictCanvasForMultiTargetAnno(annoListMeta, aclMetaCache) {
    /* Some viewers cannot understand multi-target annos: For example,
      when we feed Mirador an array of canvas IDs, it will add the anno
      to all those canvases' anno lists, but fails to render the rectangle.
      We thus have to simplify the IIIF target to point to only the one
      canvas that was searched for. */
    const { subjTgtSpec } = annoListMeta;
    const subjTgtMeta = aclMetaCache['tgtUrl:' + subjTgtSpec];
    const canvasId = EX.constructCanvasId(subjTgtMeta);
    if (!canvasId) { throw errNoCanvasPattern(); }
    return { canvasId, subjTgtSpec, subjTgtMeta };
  },


  constructCanvasId(subjTgtMeta) {
    let canvas = orf(subjTgtMeta).iiifCanvasIdPattern;
    if (!canvas) { return ''; }
    mustBe.nest('iiifCanvasIdPattern', canvas);
    canvas = canvas.replace(/%\{([ -z\|~]+)\}/g,
      (m, k) => String(m && getOwn(subjTgtMeta, k, '')));
    canvas = canvas.trim();
    return canvas;
  },


  iiifTargetMatchPropsOrder: [
    'source',
    'scope',
  ],


  pickIiifTarget(subjTgtSpec, origAnno) {
    /* Since some viewers cannot handle multi-target annos, we have to
      extract the one target that was searched for. */
    const origTargets = arrayOfTruths(origAnno.target);
    let foundProp;
    const foundIdx = origTargets.findIndex(function findIiifTarget(origTgt) {
      const k = EX.iiifTargetMatchPropsOrder.find(
        p => (origTgt[p] === subjTgtSpec));
      if (!k) { return false; }
      foundProp = k;
      return true;
    });
    if (!foundProp) { return ''; }
    return origTargets[foundIdx];
  },


  fmtOneAnno(fmtCtx, origAnno) {
    const annoIdUrl = origAnno.id;
    const annoTarget = EX.pickIiifTarget(fmtCtx.subjTgtSpec, origAnno);
    const tgtMeta = fmtCtx.subjTgtMeta;

    /* As of 2025-01-24, Mirador 3 seems to not support IIIF cookbook
      recipe #22 "Linking with a hotspot", so instead we have to try and
      use an HTML body for the link: */
    let htmlBody = xmlAttrDict({ '': 'span', '¶': origAnno['dc:title'] });
    if (tgtMeta.iiifAnnoIdUrlLinkCaption) {
      const scope = (tgtMeta.iiifAnnoIdUrlLinkToScope
        && propIf(annoTarget.scope, 'id'));
      htmlBody = xmlAttrDict({
        '': 'a',
        href: scope || annoIdUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
        '¶': tgtMeta.iiifAnnoIdUrlLinkCaption || '[link]',
      }) + '&nbsp;&nbsp; ' + htmlBody;
    }
    if (fmtCtx.svgShapes) {
      htmlBody += (' / shapes: ' + fmtCtx.svgShapes.map(s => s['']).join(','));
    }
    htmlBody = xmlAttrDict({
      '': 'p', /*
        Mirador 3 loads the body into a span, so we shouldn't wrap it in a
        block level element. */
      'class': 'as22-iiif-anno-body',
      '|': htmlBody,
    });

    const iiifTarget = (EX.fmtIiifTarget(fmtCtx, annoTarget)
      || 'about:error/no_iiif_target_canvas');
    const iiifAnno = {
      id: annoIdUrl,
      type: 'Annotation',
      motivation: EX.miradorAcceptableMotivation,
      target: iiifTarget,
      body: {
        type: 'TextualBody',
        format: 'text/html',
        value: htmlBody,
      },
    };
    return iiifAnno;
  },


  fmtIiifTarget(fmtCtx, annoTarget) {
    const { logCkp } = fmtCtx;
    const { canvasId } = fmtCtx;

    const sel = orf(annoTarget.selector);
    if (sel.type === 'SvgSelector') {
      const svgShapes = EX.findSvgShapes(sel.value);
      Object.assign(fmtCtx, { svgShapes });
      if (svgShapes) {
        const { single } = svgShapes;
        if (single[''] === 'rect') {
          const nums = ['x', 'y', 'width', 'height'].map(
            k => Math.round(+single[k] || 0));
          return canvasId + '#xywh=' + nums.join(',');
        }
      }

      // logCkp('IIIF unvalidated SVG selector:', { canvasId, svgShapes });
      return { type: 'SpecificResource', source: canvasId, selector: sel };
    }

    logCkp('IIIF no selector:', { canvasId });
    return canvasId;
  },


  xmlTagsRgx: /<[ -;=\?-\uFFFF]+>/g,


  findSvgShapes(origSvg) {
    let svg = origSvg.replace(/\s+/g, ' ');
    const shapes = [];
    svg = svg.replace(EX.xmlTagsRgx, function foundTag(m) {
      const t = xmlAttrDict(m);
      const n = t[''];
      if (n.startsWith('/')) { return ''; }
      if (n === '?xml') { return ''; }
      if (n === 'svg') { return ''; }
      shapes.push(t);
      return '';
    });
    shapes.textContent = svg.trim();
    shapes.single = orf((shapes.length <= 1) && shapes[0]);
    return shapes.length && shapes;
  },


});


export default EX;
