// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { svgHelpers } from '../../common/svgHelpers';
import { SvgBox, SvgPoint } from '../../smo/data/common';
declare var $: any;
export interface ScrollState {
  initial: SvgPoint,
  scroll: SvgPoint
}
// ## suiScroller
// Respond to scroll events, and handle the scroll of the viewport
//
//
// ---
export class SuiScroller {
  selector: string;
  _scroll: SvgPoint;
  _scrollInitial: SvgPoint;
  _offsetInitial: SvgPoint;
  viewport: SvgBox = SvgBox.default;
  // ### constructor
  // selector is the scrollable DOM container of the music container
  // (grandparent of svg element)
  constructor(selector: string) {
    this.selector = selector;
    this._scroll = { x: 0, y: 0 };
    this._scrollInitial = { x: 0, y: 0 };
    const scroller = $(selector);
    this._offsetInitial = { x: $(scroller).offset().left, y: $(scroller).offset().top };
    this.updateViewport();
  }

  get scrollState(): ScrollState {
    const initial = JSON.parse(JSON.stringify(this._scrollInitial));
    const scroll = JSON.parse(JSON.stringify(this._scroll));
    return { initial, scroll };
  }
  restoreScrollState(state: ScrollState) {
    this.scrollOffset(state.scroll.x - this._scroll.x, state.scroll.y - this._scroll.y);
  }

  // ### handleScroll
  // update viewport in response to scroll events
  handleScroll(x: number, y: number) {
    this._scroll = { x, y };
    this.viewport = svgHelpers.boxPoints(
      $(this.selector).offset().left,
      $(this.selector).offset().top,
      $(this.selector).width(),
      $(this.selector).height());
  }

  scrollAbsolute(x: number, y: number) {
    $(this.selector)[0].scrollLeft = x;
    $(this.selector)[0].scrollTop = y;
    this.netScroll.x = this._scroll.x = x;
    this.netScroll.y = this._scroll.y = y;
  }

  // ### scrollVisible
  // Scroll such that the box is fully visible, if possible (if it is
  // not larger than the screen)
  scrollVisibleBox(box: SvgBox) {
    let xoff = 0;
    let yoff = 0;
    const curBox = this.scrollBox;
    if (box.width > curBox.width || box.height > curBox.height) {
      return;
    }
    if (box.height < curBox.height) {
      if (box.y < curBox.y) {
        yoff = box.y - (curBox.y + 25);
      } else if (box.y + box.height > curBox.y + curBox.height) {
        yoff = box.y + box.height - (curBox.y + curBox.height) + 25;
      }
    }

    if (box.x < curBox.width) {
      if (box.x < curBox.x) {
        xoff = box.x - curBox.x;
      } else if (box.x + box.width > curBox.x + curBox.width) {
        xoff = box.x + box.width - (curBox.x + curBox.width);
      }
    }

    if (xoff !== 0 || yoff !== 0) {
      this.scrollOffset(xoff, yoff);
    }
  }
  updateViewport() {
    this.viewport = svgHelpers.boxPoints(
      $(this.selector).offset().left,
      $(this.selector).offset().top,
      $(this.selector).width(),
      $(this.selector).height());
  }

  // ### scrollBox
  // get the current viewport, in scrolled coordinates.  When tracker maps the
  // music element to client coordinates, these are the coordinates used in the
  // map
  get scrollBox(): SvgBox {
    return svgHelpers.boxPoints(this.viewport.x + this.netScroll.x,
      this.viewport.y + this.netScroll.y,
      this.viewport.width,
      this.viewport.height
    );
  }

  get absScroll(): SvgBox {
    var x = $(this.selector).offset().left + $(this.selector)[0].scrollLeft;
    var y = $(this.selector).offset().top + $(this.selector)[0].scrollTop;
    return svgHelpers.boxPoints(x,
      y,
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

  // ### invScroll
  // invert the scroll parameters.
  get invScroll() {
    var vect = this.netScroll;
    return { x: vect.x * (-1), y: vect.y * (-1) };
  }
}
