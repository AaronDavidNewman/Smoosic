// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SvgHelpers } from './svgHelpers';
import { SvgBox, SvgPoint } from '../../smo/data/common';
import { SvgPageMap } from './svgPageMap';
import { layoutDebug } from './layoutDebug';
declare var $: any;

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

  /**
   * Scroll such that the box is fully visible, if possible (if it is
   * not larger than the screen) 
   **/
   scrollVisibleBox(box: SvgBox) {
    let yoff = 0;
    let xoff = 0;

    const screenBox = this.svgPages.svgToClientNoOffset(box);
    const scrollState = this.scrollState;
    const scrollDown = () => screenBox.y + screenBox.height > scrollState.y + this.viewport.height;
    const scrollUp = () => screenBox.y < scrollState.y;
    const scrollLeft = () => screenBox.x < scrollState.x;
    const scrollRight = () => screenBox.x + screenBox.width > scrollState.x + this.viewport.width;
    // Math: make sure we don't scroll down if scrollUp is indicated, etc.
    if (scrollUp()) {
      yoff = Math.min(screenBox.y - scrollState.y, 0);
    } 
    if (scrollDown()) {
      yoff = Math.max(screenBox.y - (scrollState.y - screenBox.height), 0);
    }
    if (scrollLeft()) {
      xoff = Math.min(screenBox.x - scrollState.x, 0);
    }
    if (scrollRight()) {
      xoff = Math.max(screenBox.x - (scrollState.x - screenBox.height), 0);
    }
    this.scrollOffset(xoff, yoff);
}
  // Update viewport size, and also fix height of scroll region.
  updateViewport() {
    $(this.selector).css('height', (window.innerHeight - $(this.selector).offset().top).toString() + 'px');
    this.viewport = SvgHelpers.boxPoints(
      $(this.selector).offset().left,
      $(this.selector).offset().top,
      $(this.selector).width(),
      $(this.selector).height());
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
    const xScreen = Math.max(this._scroll.x + x, 0);
    const yScreen = Math.max(this._scroll.y + y, 0);
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
