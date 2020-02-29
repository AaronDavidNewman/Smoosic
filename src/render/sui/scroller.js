

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

    // ### handleScroll
    // handle scroll events.
    handleScroll(x,y) {
        this._scroll = {x:x,y:y};
        this.viewport = svgHelpers.boxPoints(
          $('.musicRelief').offset().left,
          $('.musicRelief').offset().top,
          $('.musicRelief').width,
          $('.musicRelief').height());
    }

    scrollAbsolute(x,y) {
        $('.musicRelief')[0].scrollLeft = x;
        $('.musicRelief')[0].scrollTop = y;
        this.netScroll.x = x;
        this.netScroll.y = y;
    }


    // ### scrollVisible
    // Scroll such that the area x,y is visible.
    scrollVisible(x,y) {
        var y = y - this.netScroll.y;
        var x = x - this.netScroll.x;
        var dx = 0;
        var dy = 0;
        if (y < 0) {
            dy = -y;
        } else if (y > this.viewport.height + this.viewport.y) {
            var offset = y - (this.viewport.height + this.viewport.y);
            dy = offset + this.viewport.height/2;
        }

        if (x < 0) {
            dx = -x;
        } else if (x > this.viewport.width + this.viewport.x) {
            var offset = x - (this.viewport.width + this.viewport.x);
            dx = offset + this.viewport.width -50;
        }
        if (dx != 0 || dy != 0) {
            this.scrollOffset(dx,dy);
        }
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
