// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.

import { Transposable, SvgBox, SvgPoint } from '../../smo/data/common';
import { SmoSelection } from '../../smo/xform/selections';

declare var $: any;

export interface StrokeInfo {
  strokeName: string,
  stroke: string,
  strokeWidth: string | number,
  strokeDasharray: string | number,
  fill: string,
  opacity: number
}

export interface OutlineInfo {
  stroke: StrokeInfo,
  context: any, // Vex SVG context
  classes: string,
  box: SvgBox | SvgBox[],
  clientCoordinates: boolean,
  scroll: SvgPoint
}

export interface GradientInfo {
  color: string, offset: string, opacity: number
}

export interface Boxable {
  box: SvgBox
}

export class SvgBuilder {
  e: Element;
  constructor(el: string) {
    const ns = SvgHelpers.namespace;
    this.e = document.createElementNS(ns, el);
  }
  classes(cl: string): SvgBuilder {
    this.e.setAttributeNS('', 'class', cl);
    return this;
  }
  attr(name: string, value: string): SvgBuilder {
      this.e.setAttributeNS('', name, value);
      return this;
  }

  text(x: number | string, y: number | string, classes: string, text: string): SvgBuilder {
    x = typeof (x) == 'string' ? x : x.toString();
    y = typeof (y) == 'string' ? y : y.toString();
    this.e.setAttributeNS('', 'class', classes);
    this.e.setAttributeNS('', 'x', x);
    this.e.setAttributeNS('', 'y', y);
    this.e.textContent = text;
    return this;
  }
  rect(x: number | string, y: number | string, width: number | string, height: number | string, classes: string): SvgBuilder {
    x = typeof (x) == 'string' ? x : x.toString();
    y = typeof (y) == 'string' ? y : y.toString();
    width = typeof (width) == 'string' ? width : width.toString();
    height = typeof (height) == 'string' ? height : height.toString();
    this.e.setAttributeNS('', 'x', x);
    this.e.setAttributeNS('', 'y', y);
    this.e.setAttributeNS('', 'width', width);
    this.e.setAttributeNS('', 'height', height);
    if (classes) {
      this.e.setAttributeNS('', 'class', classes);
    }
    return this;
  }
  line(x1: number | string, y1: number | string, x2: number | string, y2: number | string, classes: string): SvgBuilder {
    x1 = typeof (x1) == 'string' ? x1 : x1.toString();
    y1 = typeof (y1) == 'string' ? y1 : y1.toString();
    x2 = typeof (x2) == 'string' ? x2 : x2.toString();
    y2 = typeof (y2) == 'string' ? y2 : y2.toString();

    this.e.setAttributeNS('', 'x1', x1);
    this.e.setAttributeNS('', 'y1', y1);
    this.e.setAttributeNS('', 'x2', x2);
    this.e.setAttributeNS('', 'y2', y2);
    if (classes) {
      this.e.setAttributeNS('', 'class', classes);
    }
    return this;
  }
  append(el: any): SvgBuilder {
    this.e.appendChild(el.e);
    return this;
  }
  dom(): Element {
    return this.e;
  }
  static b(element: string): SvgBuilder {
    return new SvgBuilder(element);
  }
}
// ## SvgHelpers
// Mostly utilities for converting coordinate spaces based on transforms, etc.
// ### static class methods:
// ---
export class SvgHelpers {
  static get namespace(): string {
    return "http://www.w3.org/2000/svg";
  }

  // ### gradient
  // Create an svg linear gradient.
  // Stops look like this:
  // `[{color:"#eee", offset:"0%",opacity:0.5}]`
  // orientation is horizontal or vertical
  static gradient(svg: SVGSVGElement, id: string, orientation: string, stops: GradientInfo[]) {
    var ns = SvgHelpers.namespace;
    var x2 = orientation === 'vertical' ? 0 : 1;
    var y2 = orientation === 'vertical' ? 1 : 0;

    var e = document.createElementNS(ns, 'linearGradient');
    e.setAttributeNS('', 'id', id);
    e.setAttributeNS('', 'x1', '0');
    e.setAttributeNS('', 'x2', x2.toString());
    e.setAttributeNS('', 'y1', '0');
    e.setAttributeNS('', 'y2', y2.toString());
    stops.forEach((stop) => {
      var s = document.createElementNS(ns, 'stop');
      s.setAttributeNS('', 'stop-opacity', stop.opacity.toString());
      s.setAttributeNS('', 'stop-color', stop.color);
      s.setAttributeNS('', 'offset', stop.offset);
      e.appendChild(s);

    });
    svg.appendChild(e);
  }

  static renderCursor(svg: SVGSVGElement, x: number, y: number, height: number) {
    var ns = SvgHelpers.namespace;
    const width = height * 0.4;
    x = x - (width / 2);
    var mcmd = (d: string, x: number, y: number) => {
      return d + 'M ' + x.toString() + ' ' + y.toString() + ' ';
    };
    var qcmd = (d: string, x1: number, y1: number, x2: number, y2: number) => {
      return d + 'q ' + x1.toString() + ' ' + y1.toString() + ' ' + x2.toString() + ' ' + y2.toString() + ' ';
    };
    var lcmd = (d: string, x: number, y: number) => {
      return d + 'L ' + x.toString() + ' ' + y.toString() + ' ';
    };
    var x1 = (width / 2) * .333;
    var y1 = -1 * (x1 / 4);
    var x2 = (width / 2);
    var y2 = x2 / 4;
    var ns = SvgHelpers.namespace;
    var e = document.createElementNS(ns, 'path');
    var d = '';
    d = mcmd(d, x, y);
    d = qcmd(d, x1, y1, x2, y2);
    d = lcmd(d, x + (width / 2), y + height - (width / 8));
    d = mcmd(d, x + width, y);
    d = qcmd(d, -1 * x1, y1, -1 * x2, y2);
    d = mcmd(d, x, y + height);
    d = qcmd(d, x1, -1 * y1, x2, -1 * y2);
    d = mcmd(d, x + width, y + height);
    d = qcmd(d, -1 * x1, -1 * y1, -1 * x2, -1 * y2);
    e.setAttributeNS('', 'd', d);
    e.setAttributeNS('', 'stroke-width', '1');
    e.setAttributeNS('', 'stroke', '#555');
    e.setAttributeNS('', 'fill', 'none');
    svg.appendChild(e);
  }

  // ### boxNote
  // update the note geometry based on current viewbox conditions.
  // This may not be the appropriate place for this...maybe in layout
  static updateArtifactBox(svg: SVGSVGElement, element: SVGSVGElement | undefined, artifact: Transposable) {
    if (typeof (element) === 'undefined') {
      console.log('updateArtifactBox: undefined element!');
      return;
    }
    artifact.logicalBox = SvgHelpers.smoBox(element.getBBox());
    artifact.renderedBox = SvgHelpers.smoBox(SvgHelpers.logicalToClientRaw(svg, artifact.logicalBox));
  }

  // ### eraseOutline
  // Erases old outlineRects.
  static eraseOutline(svg: SVGSVGElement, stroke: StrokeInfo) {
    // Hack:  Assume a stroke style, should just take a stroke param.
    $(svg).find('g.vf-' + stroke.strokeName).remove();
  }

  static _outlineRect(params: OutlineInfo) {
    const scroll = params.scroll;
    const context = params.context;
    // vex puts 'vf-' before everything rendered by context API
    SvgHelpers.eraseOutline(context.svg, params.stroke);
    // Don't highlight in print mode.
    if ($('body').hasClass('printing')) {
      return;
    }
    const classes = params.classes.length > 0 ? params.classes + ' ' + params.stroke.strokeName : params.stroke.strokeName;
    var grp = context.openGroup(classes, classes + '-outline');
    const boxes = Array.isArray(params.box) ? params.box : [params.box];

    boxes.forEach((box: SvgBox) => {
      if (box) {
        var strokeObj:any = params.stroke;
        strokeObj['stroke-width'] = params.stroke.strokeWidth;
        var margin = 5;
        /* if (params.clientCoordinates === true) {
          box = SvgHelpers.smoBox(SvgHelpers.clientToLogical(context.svg, SvgHelpers.smoBox(SvgHelpers.adjustScroll(box, scroll))));
        } */
        context.rect(box.x - margin, box.y - margin, box.width + margin * 2, box.height + margin * 2, strokeObj);
      }
    });
    context.closeGroup(grp);
  }


  // ### outlineRect
  // Usage:
  //  outlineRect(params)
  // params ({context,box,outlineStroke,classes,scroller})
  // outlineStroke: {stroke, strokeWidth, strokeDashArray, fill}
  static outlineRect(params: OutlineInfo) {
    params.clientCoordinates = true;
    SvgHelpers._outlineRect(params);
  }

  static outlineLogicalRect(params: OutlineInfo) {
    params.clientCoordinates = false;
    SvgHelpers._outlineRect(params);
  }

  static setSvgStyle(element: Element, attrs: StrokeInfo) {
    element.setAttributeNS('', 'stroke', attrs.stroke);
    if (attrs.strokeDasharray) {
      element.setAttributeNS('', 'stroke-dasharray', attrs.strokeDasharray.toString());
    }
    if (attrs.strokeWidth) {
      element.setAttributeNS('', 'stroke-width', attrs.strokeWidth.toString());
    }
    if (attrs.fill) {
      element.setAttributeNS('', 'fill', attrs.fill);
    }
  }
  static rect(svg: Document, box: SvgBox, attrs: StrokeInfo, classes: string) {
    var rect = document.createElementNS(SvgHelpers.namespace, 'rect');
    SvgHelpers.setSvgStyle(rect, attrs);
    if (classes) {
      rect.setAttributeNS('', 'class', classes);
    }
    svg.appendChild(rect);
    return rect;
  }

  static line(svg: Document, x1: number | string, y1: number | string, x2: number | string, y2: number | string, attrs: StrokeInfo, classes: string) {
    var line = document.createElementNS(SvgHelpers.namespace, 'line');
    x1 = typeof (x1) == 'string' ? x1 : x1.toString();
    y1 = typeof (y1) == 'string' ? y1 : y1.toString();
    x2 = typeof (x2) == 'string' ? x2 : x2.toString();
    y2 = typeof (y2) == 'string' ? y2 : y2.toString();

    line.setAttributeNS('', 'x1', x1);
    line.setAttributeNS('', 'y1', y1);
    line.setAttributeNS('', 'x2', x2);
    line.setAttributeNS('', 'y2', y2);
    SvgHelpers.setSvgStyle(line, attrs);
    if (classes) {
      line.setAttributeNS('', 'class', classes);
    }
    svg.appendChild(line);
  }

  static arrowDown(svg: Document, box: SvgBox) {
    const arrowStroke: StrokeInfo = { strokeName: 'arrow-stroke', stroke: '#321', strokeWidth: '2', strokeDasharray: '4,1', fill: 'none', opacity: 1.0 };
    SvgHelpers.line(svg, box.x + box.width / 2, box.y, box.x + box.width / 2, box.y + box.height, arrowStroke, '');
    var arrowY = box.y + box.height / 4;
    SvgHelpers.line(svg, box.x, arrowY, box.x + box.width / 2, box.y + box.height, arrowStroke, '');
    SvgHelpers.line(svg, box.x + box.width, arrowY, box.x + box.width / 2, box.y + box.height, arrowStroke, '');
  }
  static debugBox(svg: SVGSVGElement, box: SvgBox | null, classes: string, voffset: number) {
    voffset = voffset ?? 0;
    classes = classes ?? '';
    if (!box)
      return;
    classes += ' svg-debug-box';
    var b = SvgBuilder.b;
    var mid = box.x + box.width / 2;
    var xtext = 'x1: ' + Math.round(box.x);
    var wtext = 'x2: ' + Math.round(box.width + box.x);
    var ytext = 'y1: ' + Math.round(box.y);
    var htext = 'y2: ' + Math.round(box.height + box.y);
    var ytextp = Math.round(box.y + box.height);
    var ytextp2 = Math.round(box.y + box.height - 30);

    var r = b('g').classes(classes)
      .append(
        b('text').text(box.x + 20, box.y - 14 + voffset, 'svg-debug-text', xtext))
      .append(
        b('text').text(mid - 20, box.y - 14 + voffset, 'svg-debug-text', wtext))
      .append(
        b('line').line(box.x, box.y - 2, box.x + box.width, box.y - 2, ''))
      .append(
        b('line').line(box.x, box.y - 8, box.x, box.y + 5, ''))
      .append(
        b('line').line(box.x + box.width, box.y - 8, box.x + box.width, box.y + 5, ''))
      .append(
        b('text').text(Math.round(box.x - 14 + voffset), ytextp, 'svg-vdebug-text', ytext)
          .attr('transform', 'rotate(-90,' + Math.round(box.x - 14 + voffset) + ',' + ytextp + ')'));
    if (box.height > 2) {
      r.append(
        b('text').text(Math.round(box.x - 14 + voffset), ytextp2, 'svg-vdebug-text', htext)
          .attr('transform', 'rotate(-90,' + Math.round(box.x - 14 + voffset) + ',' + (ytextp2) + ')'))
        .append(
          b('line').line(Math.round(box.x - 2), Math.round(box.y + box.height), box.x - 2, box.y, ''))
        .append(
          b('line').line(Math.round(box.x - 8), Math.round(box.y + box.height), box.x + 6, Math.round(box.y + box.height), ''))
        .append(
          b('line').line(Math.round(box.x - 8), Math.round(box.y), Math.round(box.x + 6), Math.round(box.y),''));
    }
    svg.appendChild(r.dom());
  }

  static placeSvgText(svg: Document, attributes: Record<string | number, string | number>[], classes: string, text: string): SVGSVGElement {
    var ns = SvgHelpers.namespace;
    var e = document.createElementNS(ns, 'text');
    attributes.forEach((attr) => {
      var key: string = Object.keys(attr)[0];
      e.setAttributeNS('', key, attr[key].toString());
    })
    if (classes) {
      e.setAttributeNS('', 'class', classes);
    }
    var tn = document.createTextNode(text);
    e.appendChild(tn);
    svg.appendChild(e);
    return (e as any);
  }
  static doesBox1ContainBox2(box1?: SvgBox, box2?: SvgBox): boolean {
    if (!box1 || !box2) {
      return false;
    }
    const i1 = box2.x - box1.x;
    const i2 = box2.y - box1.y;
    return (i1 > 0 && i1 < box1.width && i2 > 0 && i2 < box1.height);
  }

  // ### findIntersectionArtifact
  // find all object that intersect with the rectangle
  static findIntersectingArtifact(clientBox: SvgBox, objects: Boxable[]): Boxable[] {
    var box = SvgHelpers.smoBox(clientBox); //svgHelpers.untransformSvgPoint(this.context.svg,clientBox);

    // box.y = box.y - this.renderElement.offsetTop;
    // box.x = box.x - this.renderElement.offsetLeft;
    var rv: Boxable[] = [];
    objects.forEach((object) => {
      // Measure has been updated, but not drawn.
      if (!object.box) {
        // console.log('there is no box');
      } else {
        var obox = SvgHelpers.smoBox(object.box);
        if (SvgHelpers.doesBox1ContainBox2(obox, box)) {
          rv.push(object);
        }
      }
    });

    return rv;
  }

  // ### findIntersectingArtifactFromMap
  // Same as findIntersectionArtifact but uses a map of keys instead of an array
  static findIntersectingArtifactFromMap(clientBox: SvgBox, map: Record<string | number, SmoSelection>, scrollState: SvgBox): any[] {
    var box = SvgHelpers.smoBox(clientBox); //svgHelpers.untransformSvgPoint(this.context.svg,clientBox);
    // box.y = box.y - this.renderElement.offsetTop;
    // box.x = box.x - this.renderElement.offsetLeft;
    var rv: any[] = [];

    Object.keys(map).forEach((k) => {
      var object = map[k];
      // Measure has been updated, but not drawn.
      if (!object.box) {
        // console.log('there is no box');
      } else {
        var obox = SvgHelpers.smoBox(SvgHelpers.adjustScroll(SvgHelpers.smoBox(object.box), scrollState));
        if (SvgHelpers.doesBox1ContainBox2(obox, box)) {
          rv.push(object);
        }
      }
    });
    return rv;
  }

  static containsPoint(box: SvgBox, point: SvgPoint, scrollState: SvgBox) {
    var obox = SvgHelpers.smoBox(SvgHelpers.adjustScroll(SvgHelpers.smoBox(box), scrollState));
    const i1 = point.x - box.x + scrollState.x; // handle edge not believe in x and y
    const i2 = point.y - box.y + scrollState.y;
    if (i1 > 0 && i1 < obox.width && i2 > 0 && i2 < obox.height) {
      return true;
    }
    return false;
  }

  static findSmallestIntersection(clientBox: SvgBox, objects: Boxable[]) {
    var ar = SvgHelpers.findIntersectingArtifact(clientBox, objects);
    if (!ar.length) {
      return null;
    }
    var rv = ar[0];
    var min = ar[0].box.width * ar[0].box.height;
    ar.forEach((obj) => {
      var tst = obj.box.width * obj.box.height;
      if (tst < min) {
        rv = obj;
        min = tst;
      }
    });
    return rv;
  }

  static translateElement(g: SVGSVGElement, x: number | string, y: number | string) {
    g.setAttributeNS('', 'transform', 'translate(' + x + ' ' + y + ')');
  }

  static stringify(box: SvgBox): string {
    if (box['width']) {

      return JSON.stringify({
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height
      }, null, ' ');
    } else {
      return JSON.stringify({
        x: box.x,
        y: box.y
      }, null, ' ');
    }
  }

  static log(box: SvgBox) {
    if (box['width']) {
      console.log(JSON.stringify({
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height
      }, null, ' '));
    } else {
      console.log('{}');
    }
  }

  // ### pointBox
  // return a point-sized box at the given coordinate
  static pointBox(x: number, y: number) {
    return {
      x: x,
      y: y,
      width: 0,
      height: 0
    };
  }


  // ### smoBox:
  // return a simple box object that can be serialized, copied
  // (from svg DOM box)
  static smoBox(box: any) {
    if (typeof (box) === "undefined" || box === null) {
      return SvgBox.default;
    }
    const hround = (f: number): number => {
      return Math.round((f + Number.EPSILON) * 100) / 100;
    }
    const x = typeof (box.x) == 'undefined' ? hround(box.left) : hround(box.x);
    const y = typeof (box.y) == 'undefined' ? hround(box.top) : hround(box.y);
    return ({
      x: hround(x),
      y: hround(y),
      width: hround(box.width),
      height: hround(box.height)
    });
  }
  // ### unionRect
  // grow the bounding box two objects to include both.
  static unionRect(b1: SvgBox, b2: SvgBox): SvgBox {
    const x = Math.min(b1.x, b2.x);
    const y = Math.min(b1.y, b2.y);
    const width = Math.max(b1.x + b1.width, b2.x + b2.width) - x;
    const height = Math.max(b1.y + b1.height, b2.y + b2.height) - y;
    return {
      x: x,
      y: y,
      width: width,
      height: height
    };
  }

  // ### adjustScroll
  // Add the scroll to the screen coordinates so we can find the mapped
  // location of something.
  static adjustScroll(box: SvgBox, scroll: SvgPoint) {
    // WIP...
    if (typeof (box) == 'undefined' || typeof (scroll) == 'undefined') {
      console.log('bad values to scroll thing');
      return;
    }
    return SvgHelpers.boxPoints(box.x - scroll.x, box.y - scroll.y, box.width, box.height);
    // return box;
  }

  static boxPoints(x: number, y: number, w: number, h: number): SvgBox {
    return ({
      x: x,
      y: y,
      width: w,
      height: h
    });
  }

  static copyBox(box: SvgBox): SvgBox {
    box = SvgHelpers.smoBox(box);
    return {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height
    };
  }

  // ### svgViewport
  // set `svg` element to `width`,`height` and viewport `scale`
  static svgViewport(svg: SVGSVGElement, xOffset: number, yOffset: Number, width: number, height: number, scale: number) {
    svg.setAttributeNS('', 'width', '' + width);
    svg.setAttributeNS('', 'height', '' + height);
    svg.setAttributeNS('', 'viewBox', '' + xOffset + ' ' + yOffset + ' ' + Math.round(width / scale) + ' ' +
      Math.round(height / scale));
  }

  // ### logicalToClient
  // Convert a point from logical (pixels) to actual screen dimensions based on current
  // zoom, aspect ratio
  /* static logicalToClient(svg, logicalPoint) {
  var rect = svg.getBoundingClientRect();
  var rv = SvgHelpers.copyBox(logicalPoint);
  rv.x += rect.x;
  rv.y += rect.y;
  return rv;
  }   */

  // ### clientToLogical
  // return a box or point in svg coordintes from screen coordinates
  static clientToLogical(svg: SVGSVGElement, point: SvgBox): SvgBox | SvgPoint {
    var pt = svg.createSVGPoint();
    if (!point)
      return SvgBox.default;
    const x = point.x;
    const y = point.y;
    pt.x = x;
    pt.y = y;
    const screen = svg.getScreenCTM();
    if (!screen) {
      return SvgBox.default;
    }
    var sp = pt.matrixTransform(screen.inverse());
    if (typeof (point['width']) == 'undefined') {
      return {
        x: sp.x,
        y: sp.y
      };
    }

    const endPt = svg.createSVGPoint();
    endPt.x = pt.x + point.width;
    endPt.y = pt.y + point.height;
    const mat = svg.getScreenCTM();
    if (!mat) {
      return SvgBox.default;
    }
    const ep = endPt.matrixTransform(mat.inverse());
    return {
      x: sp.x,
      y: sp.y,
      width: ep.x - sp.x,
      height: ep.y - sp.y
    };
  }

  /**
   * return a box or point in screen coordinates from svg coordinates
   * @param svg 
   * @param point - in SVG coordinates (logical)
   * @param scroller  - in client coordinates (rendered)
   * @returns 
   */
  static logicalToClient(svg: SVGSVGElement, point: SvgBox, scroller: SvgPoint): SvgBox | SvgPoint {
    var pt = svg.createSVGPoint();
    pt.x = point.x;
    pt.y = point.y;
    var sp = pt.matrixTransform(svg.getScreenCTM() ?? undefined);
    if (!point['width']) {
      return {
        x: sp.x + scroller.x,
        y: sp.y + scroller.y
      };
    }
    var endPt = svg.createSVGPoint();
    endPt.x = pt.x + point.width;
    endPt.y = pt.y + point.height;
    var ep = endPt.matrixTransform(svg.getScreenCTM() ?? undefined);
    return {
      x: sp.x + scroller.x,
      y: sp.y + scroller.y,
      width: ep.x - sp.x,
      height: ep.y - sp.y
    };
  }
  static logicalToClientRaw(svg: SVGSVGElement, point: SvgBox): SvgBox | SvgPoint {
    return this.logicalToClient(svg, point, { x: 0, y: 0});
  }
}
