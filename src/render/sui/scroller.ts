// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SvgHelpers } from './svgHelpers';
import { SvgBox, SvgPoint } from '../../smo/data/common';
import { SuiRendererBase } from './mapper';
import { layoutDebug } from './layoutDebug';
declare var $: any;
const VF = eval('Vex.Flow');

/**
 * Respond to scroll events in music DOM, and handle the scroll of the viewport
 * @category SuiRender
 */
export class SuiScroller {
  selector: HTMLElement;
  renderer: SuiRendererBase;
  _scroll: SvgPoint;
  _offsetInitial: SvgPoint;
  viewport: SvgBox = SvgBox.default;
  logicalViewport: SvgBox = SvgBox.default;
  // ### constructor
  // selector is the scrollable DOM container of the music container
  // (grandparent of svg element)
  constructor(selector: HTMLElement, renderer: SuiRendererBase) {
    const self = this;
    this.selector = selector;
    this._scroll = { x: 0, y: 0 };
    this.renderer = renderer;
    const scroller = $(selector);
    this._offsetInitial = { x: $(scroller).offset().left, y: $(scroller).offset().top };
    renderer.createViewportPromise().then(() => {
      self.updateViewport();
    });
    const dbgDiv = $('<div class="scroll-box-debug"/>');
    $('body').append(dbgDiv);
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
    this.viewport = SvgHelpers.boxPoints(
      $(this.selector).offset().left,
      $(this.selector).offset().top,
      $(this.selector).width(),
      $(this.selector).height());
    this.deferUpdateDebug();
  }
  updateDebug() {
    const displayString = 'X: ' + this._scroll.x + ' Y: ' + this._scroll.y;
    $('.scroll-box-debug').text(displayString);
    $('.scroll-box-debug').css('left', '2%').css('top', '2%');
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
    const topY = this.scrollState.y;
    const bottomY = topY + this.logicalViewport.height;
    if (topY >= box.y || box.y + box.height >= bottomY) {      
      yoff = (box.y - this.scrollState.y) + 20;
    }
    const xoff = 0;
    if (xoff !== 0 || yoff !== 0) {
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
    this.logicalViewport = SvgHelpers.smoBox(SvgHelpers.clientToLogical(this.renderer.svg, this.viewport));
    this.deferUpdateDebug();
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
    const self = this;
    const cur = { x: this._scroll.x, y: this._scroll.y };
    setTimeout(() => {
      if (x) {
        $(this.selector)[0].scrollLeft = cur.x + x;
      }
      if (y) {
        $(this.selector)[0].scrollTop = cur.y + y;
      }
      self.handleScroll($(this.selector)[0].scrollLeft, $(this.selector)[0].scrollTop);
    }, 1);
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
