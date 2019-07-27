

// ## svgHelpers
// Mostly utilities for converting coordinate spaces based on transforms, etc.
// ### static class methods:
// ---
class svgHelpers {
    static unionRect(b1, b2) {
        var x = Math.min(b1.x, b2.x);
        var y = Math.min(b1.y, b2.y);
        var width = Math.max(b1.x + b1.width, b2.x + b2.width) - x;
        var height = Math.max(b1.y + b1.height, b2.y + b2.height) - y;
        return {
            x: x,
            y: y,
            width: width,
            height: height
        };
    }

    // ### smoBox:
    // return a simple box object that can be serialized, copied.
    static smoBox(box) {
        return ({
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height
        });
    }
	
	// ### measureBBox
	// Return the bounding box of the measure
    static measureBBox(b1, measure, staff) {
        if (measure.renderedBox) {
            if (b1['width']) {
                return svgHelpers.unionRect(b1, measure.renderedBox);
            } else {
                return measure.renderedBox;
            }
        } else {
            var mbox = {
                x: measure.staffX,
                y: staff.staffY,
                width: measure.staffWidth,
                height: staff.staffHeight
            };
            if (b1['width']) {
                return mbox;
            }
            return svgHelpers.unionRect(b1, mbox);
        }
    }

    static stringify(box) {
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
			y: box.y},null,' ');
		}
    }

    static log(box) {
        if (box['width']) {
            console.log(JSON.stringify({
                    x: box.x,
                    y: box.y,
                    width: box.width,
                    height: box.height
                }, null, ' '));
        }
        console.log('{}');
    }
	
	// ### pointBox
	// return a point-sized box at the given coordinate
    static pointBox(x, y) {
        return {
            x: x,
            y: y,
            width: 1,
            height: 1
        };
    }
	
	static copyBox(box) {
		return {x:box.x,y:box.y,width:box.width,height:box.height};
	}
	
	
	// ### logicalToClient
	// Convert a point from logical (pixels) to actual screen dimensions based on current 
	// zoom, aspect ratio
	static logicalToClient(svg,logicalPoint) {
		var rect = svg.getBoundingClientRect();
		var rv = svgHelpers.copyBox(logicalPoint);
		rv.x+=rect.x;
		rv.y+=rect.y;		
		return rv;
	}
	    
	// ### clientToLogical
	// return a box or point in svg coordintes from screen coordinates
    static clientToLogical(svg, point) {
        var pt = svg.createSVGPoint();
        pt.x = point.x;
        pt.y = point.y;
        var sp = pt.matrixTransform(svg.getScreenCTM().inverse());
		if (!point['width']) {
		   return {x:sp.x,y:sp.y};
		}
        
		var endPt = svg.createSVGPoint();
        endPt.x = pt.x + point.width;
        endPt.y = pt.y + point.height;
        var ep = endPt.matrixTransform(svg.getScreenCTM().inverse());
        return {
            x: sp.x,
            y: sp.y,
            width: ep.x - sp.x,
            height: ep.y - sp.y
        };
    }
	
	// ### logicalToClient
	// return a box or point in screen coordinates from svg coordinates
	static logicalToClient(svg,point) {
        var pt = svg.createSVGPoint();
        pt.x = point.x;
        pt.y = point.y;
        var sp = pt.matrixTransform(svg.getScreenCTM());
		if (!point['width']) {
		   return {x:sp.x,y:sp.y};
		}
        var endPt = svg.createSVGPoint();
        endPt.x = pt.x + point.width;
        endPt.y = pt.y + point.height;
        var ep = endPt.matrixTransform(svg.getScreenCTM());
        return {
            x: sp.x,
            y: sp.y,
            width: ep.x - sp.x,
            height: ep.y - sp.y
        };
	}
}
