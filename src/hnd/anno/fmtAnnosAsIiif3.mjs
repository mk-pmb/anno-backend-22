// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be';
import shapeToPath from 'svg-shape-to-path-pmb';
import xmlAttrDict from 'xmlattrdict';

import sendFinalTextResponse from '../../finalTextResponse.mjs';
import plumb from '../util/miscPlumbing.mjs';
import httpErrors from '../../httpErrors.mjs';


const errNoCanvasPattern = httpErrors.notImpl.explain(
  'This service is not configured to support IIIF.').throwable;


function orf(x) { return x || false; }
function propIf(o, k) { return (o && o[k]) || o; }


const EX = function fmtAnnosAsIiif3() {
  throw new Error('Need req.aclMetaCache => use .replyToRequest()!');
};


Object.assign(EX, {

  miradorAcceptableMotivation: 'commenting', /*
    Mirador 3 accepts these motivations:
      * commenting
      * tagging (ignores body type and assumes text/plain)
    Mirador 3 will ignore annos with these motivations:
      * linking
      * replying
      * (maybe more?)
  */


  forceCustomSvgStartTag: ('<svg'
    // Mirador is very picky about the opening SVG tag!
    // For example, it flinches when you omit the quotes:
    + " xmlns='http://www.w3.org/2000/svg'"
    + " version='1.1'"
    + '>'),


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
    const selector = orf(annoTarget.selector);
    const svgShapes = orf((selector.type === 'SvgSelector')
      && EX.findSvgShapes(selector.value));
    const tgtMeta = fmtCtx.subjTgtMeta;
    const iiifTarget = EX.fmtIiifTarget(fmtCtx,
      { annoTarget, selector, svgShapes });

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
    htmlBody = xmlAttrDict({
      '': 'p', /*
        Mirador 3 loads the body into a span, so we shouldn't wrap it in a
        block level element. */
      'class': 'as22-iiif-anno-body',
      '|': htmlBody,
    });

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


  fmtIiifTarget(fmtCtx, how) {
    if (!fmtCtx.canvasId) { throw new Error('Missing canvasId!'); }
    if (how.svgShapes) { return EX.fmtIiifTargetSvgSelector(fmtCtx, how); }
    return fmtCtx.canvasId;
  },


  fmtIiifTargetSvgSelector(fmtCtx, how) {
    // const { logCkp } = fmtCtx;
    const { canvasId } = fmtCtx;
    const { svgShapes } = how;
    const { single } = svgShapes;
    if (single[''] === 'rect') {
      const nums = ['x', 'y', 'width', 'height'].map(
        k => Math.round(+single[k] || 0));
      return canvasId + '#xywh=' + nums.join(',');
    }

    const sel = { ...how.selector };
    sel.value = ((EX.forceCustomSvgStartTag || svgShapes.svgTag)
      + svgShapes.map(shapeToPath).join('')
      + '</svg>');
    // logCkp('IIIF converted SVG selector:', { canvasId, svgShapes, sel });
    return { type: 'SpecificResource', source: canvasId, selector: sel };
  },


  findSvgShapes(svg) {
    const shapes = [];

    function foundTag(t) {
      const n = t[''];
      if (n.startsWith('/')) { return; }
      if (n === '?xml') { return; }
      if (n === 'svg') {
        shapes.svgTag = t['<>'];
        return;
      }
      shapes.push(t);
    }

    xmlAttrDict.splitXml(svg, { onto: null, verbatim: '<>', onTag: foundTag });
    const n = shapes.length;
    if (!n) { return false; }
    shapes.single = orf((n <= 1) && shapes[0]);
    return shapes;
  },


});


export default EX;
