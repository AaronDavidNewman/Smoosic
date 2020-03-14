

// ## suiScroller
// Respond to scroll events, and handle the scroll of the viewport
//
// ### class methods:
// ---
class suiScroller  {
	constructor(layout) {

        this._scroll = {x:0,y:0};
        this._scrollInitial = {x:0,y:0};
	    var scroller = $('.musicRelief');
	    this._offsetInitial = {x:$(scroller).offset().left,y:$(scroller).offset().top};

        this.viewport = svgHelpers.boxPoints(
          $('.musicRelief').offset().left,
          $('.musicRelief').offset().top,
          $('.musicRelief').width(),
          $('.musicRelief').height());
	}

    // ### setScrollInitial
    // tracker is going to remap the music, make sure we take the current scroll into account.
    setScrollInitial() {
        var scroller = $('.musicRelief');
        this._scrollInitial = {x:$(scroller)[0].scrollLeft,y:$(scroller)[0].scrollTop};
        this._offsetInitial = {x:$(scroller).offset().left,y:$(scroller).offset().top};
    }

    // ### handleScroll
    // handle scroll events.
    handleScroll(x,y) {
        this._scroll = {x:x,y:y};
        this.viewport = svgHelpers.boxPoints(
          $('.musicRelief').offset().left,
          $('.musicRelief').offset().top,
          $('.musicRelief').width(),
          $('.musicRelief').height());
    }

    scrollAbsolute(x,y) {
        $('.musicRelief')[0].scrollLeft = x;
        $('.musicRelief')[0].scrollTop = y;
        this.netScroll.x = x;
        this.netScroll.y = y;
    }

    // ### scrollVisible
    // Scroll such that the box is fully visible, if possible (if it is
    // not larger than the screen)
    scrollVisibleBox(box) {

        var xoff = 0;
        var yoff = 0;
        var curBox = this.scrollBox;
        if (box.width > curBox.width || box.height > curBox.height) {
            return;
        }
        if (box.height < curBox.height) {
            if (box.y < curBox.y) {
                yoff = box.y - curBox.y;
            }
            else if (box.y + box.height > curBox.y + curBox.height) {
                yoff = box.y + box.height - (curBox.y + curBox.height);
            }
        }

        if (box.x < curBox.width) {
            if (box.x < curBox.x) {
                xoff = box.x - curBox.x;
            } else if (box.x + box.width > curBox.x + curBox.width) {
                xoff = box.x + box.width - (curBox.x + curBox.width);
            }
        }

        if (xoff != 0 || yoff != 0) {
            this.scrollOffset(xoff,yoff);
        }
    }

    // ### scrollBox
    // get the current viewport, in scrolled coordinates.
    get scrollBox() {
        return svgHelpers.boxPoints(this.viewport.x + this.netScroll.x,
         this.viewport.y + this.netScroll.y,
         this.viewport.width,
          this.viewport.height
      );
    }

    // ### scrollOffset
    // scroll the offset from the starting scroll point
    scrollOffset(x,y) {
        var cur = {x:this._scroll.x,y:this._scroll.y};
        setTimeout(function() {
            if (x) {
                $('.musicRelief')[0].scrollLeft = cur.x + x;
            }
            if (y) {
                $('.musicRelief')[0].scrollTop = cur.y + y;
            }
        },1);
    }

    // ### netScroll
    // return the net amount we've scrolled, based on when the maps were make (initial)
    // , the offset of the container, and the absolute coordinates of the scrollbar.
    get netScroll() {
		var xoffset = $('.musicRelief').offset().left - this._offsetInitial.x;
		var yoffset = $('.musicRelief').offset().top - this._offsetInitial.y;
        return {x:this._scroll.x - (this._scrollInitial.x + xoffset),y:this._scroll.y - (this._scrollInitial.y + yoffset)};
    }

    // ### invScroll
    // invert the scroll parameters.
    get invScroll() {
        var vect = this.netScroll;
        return {x:vect.x*(-1),y:vect.y*(-1)};
    }

}
