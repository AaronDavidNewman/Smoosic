// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SvgHelpers } from './svgHelpers';
import { SvgBox, SvgPoint } from '../../smo/data/common';
import { SuiRendererBase } from './mapper';
import { SvgPageMap, VexRendererContainer } from './svgPageMap';
import { layoutDebug } from './layoutDebug';
declare var $: any;
const VF = eval('Vex.Flow');

/**
 * Respond to scroll events in music DOM, and handle the scroll of the viewport
 * @category SuiRender
 */
export class SuiScroller {
  selector: HTMLElement;
  svgPages: SvgPageMap;
  _scroll: SvgPoint;
  _offsetInitial: SvgPoint;
  viewport: SvgBox = SvgBox.default;
  logicalViewport: SvgBox = SvgBox.default;
  scrolling: boolean = false;
  // ### constructor
  // selector is the scrollable DOM container of the music container
  // (grandparent of svg element)
  constructor(selector: HTMLElement, svgPages: SvgPageMap) {
    const self = this;
    this.selector = selector;
    this._scroll = { x: 0, y: 0 };
    this.svgPages = svgPages;
    const scroller = $(selector);
    this._offsetInitial = { x: $(scroller).offset().left, y: $(scroller).offset().top };
  }

  get scrollState(): SvgPoint {
    const scroll = JSON.parse(JSON.stringify(this._scroll));
    return { x: this._scroll.x, y: this._scroll.y };
  }
  restoreScrollState(state: SvgPoint) {
    this.scrollOffset(state.x - this._scroll.x, state.y - this._scroll.y);
    this.deferUpdateDebug();
  }

  // ### handleScroll
  // update viewport in response to scroll events
  handleScroll(x: number, y: number) {
    this._scroll = { x, y };
    this.deferUpdateDebug();
  }
  updateDebug() {
    layoutDebug.updateScrollDebug(this._scroll);
  }
  deferUpdateDebug() {
    if (layoutDebug.mask & layoutDebug.values.scroll) {
      setTimeout(() => {
        this.updateDebug();
      }, 1);
    }
  }

  scrollAbsolute(x: number, y: number) {
    $(this.selector)[0].scrollLeft = x;
    $(this.selector)[0].scrollTop = y;
    this.netScroll.x = this._scroll.x = x;
    this.netScroll.y = this._scroll.y = y;
    this.deferUpdateDebug();
  }

  // ### scrollVisible
  // Scroll such that the box is fully visible, if possible (if it is
  // not larger than the screen)
  scrollVisibleBox(box: SvgBox) {
    let yoff = 0;
    let xoff = 0;
    const container = this.svgPages.getRendererFromPoint({ x: 0, y: 0 });
    if (container) {
      const svg = container.svg;
      // Since the pages will all be the same dimensions, any page svg should work here.
      const screenBox = SvgHelpers.smoBox(SvgHelpers.logicalToClient(svg, box,
        { x: -1 * this.viewport.x, y: -1 * this.viewport.y }));
      if (screenBox.y < 0 || screenBox.y + screenBox.height > this.viewport.height) {
        yoff = screenBox.y;
      }
      if (screenBox.x < 0 || screenBox.x + screenBox.width > this.viewport.width) {
        xoff = screenBox.x;
      }
      this.scrollOffset(xoff, yoff);
    }
}
  // Update viewport size, and also fix height of scroll region.
  updateViewport() {
    $(this.selector).css('height', (window.innerHeight - $(this.selector).offset().top).toString() + 'px');
    this.viewport = SvgHelpers.boxPoints(
      $(this.selector).offset().left,
      $(this.selector).offset().top,
      $(this.selector).width(),
      $(this.selector).height());
    const container = this.svgPages.getRendererFromPoint({ x: 0, y: 0 });
    if (container) {
      this.logicalViewport = SvgHelpers.smoBox(SvgHelpers.clientToLogical(container.svg, this.viewport));
      this.deferUpdateDebug();
    }
  }

  // ### scrollBox
  // get the current viewport, in scrolled coordinates.  When tracker maps the
  // music element to client coordinates, these are the coordinates used in the
  // map
  get scrollBox(): SvgBox {
    return SvgHelpers.boxPoints(this.viewport.x + this.netScroll.x,
      this.viewport.y + this.netScroll.y,
      this.viewport.width,
      this.viewport.height
    );
  }

  // ### scrollOffset
  // scroll the offset from the starting scroll point
  scrollOffset(x: number, y: number) {
    const xScreen = this._scroll.x + x;
    const yScreen = this._scroll.y + y;
    this.scrollAbsolute(xScreen, yScreen);
  }

  // ### netScroll
  // return the net amount we've scrolled, based on when the maps were make (initial)
  // , the offset of the container, and the absolute coordinates of the scrollbar.
  get netScroll() {
    var xoffset = $(this.selector).offset().left - this._offsetInitial.x;
    var yoffset = $(this.selector).offset().top - this._offsetInitial.y;
    return { x: this._scroll.x - xoffset, y: this._scroll.y - yoffset };
  }
}
