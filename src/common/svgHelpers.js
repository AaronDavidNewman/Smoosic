

// ## svgHelpers
// Mostly utilities for converting coordinate spaces based on transforms, etc.
// ### static class methods:
// ---
class svgHelpers {
	// ### unionRect
	// grow the bounding box two objects to include both.
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

	static get namespace() {
		return "http://www.w3.org/2000/svg";
	}

	static buildSvg(el) {

		var smoSvgBuilder = function (el) {
			var ns = svgHelpers.namespace;
			this.e = document.createElementNS(ns, el);
			var self = this;
			this.classes = function (cl) {
				self.e.setAttributeNS('', 'class', cl);
				return self;
			}
			this.attr = function (name, value) {
				self.e.setAttributeNS('', name, value);
				return self;
			}
			
			this.text = function (x, y, classes, text) {
				x = typeof(x) == 'string' ? x : x.toString();
				y = typeof(y) == 'string' ? y : y.toString();
				this.e.setAttributeNS('', 'class', classes);
				this.e.setAttributeNS('', 'x', x);
				this.e.setAttributeNS('', 'y', y);
				
				this.e.textContent = text;
				return this;
			}
			this.rect = function (x, y, width, height, classes) {
				x = typeof(x) == 'string' ? x : x.toString();
				y = typeof(y) == 'string' ? y : y.toString();
				width = typeof(width) == 'string' ? width : width.toString();
				height = typeof(height) == 'string' ? height : height.toString();
				this.e.setAttributeNS('', 'x', x);
				this.e.setAttributeNS('', 'y', y);
				this.e.setAttributeNS('', 'width', width);
				this.e.setAttributeNS('', 'height', height);
				if (classes) {
					this.e.setAttributeNS('', 'class', classes);
				}
				return this;
			}
			this.line = function (x1, y1, x2, y2, classes) {
				x1 = typeof(x1) == 'string' ? x1 : x1.toString();
				y1 = typeof(y1) == 'string' ? y1 : y1.toString();
				x2 = typeof(x2) == 'string' ? x2 : x2.toString();
				y2 = typeof(y2) == 'string' ? y2 : y2.toString();

				this.e.setAttributeNS('', 'x1', x1);
				this.e.setAttributeNS('', 'y1', y1);
				this.e.setAttributeNS('', 'x2', x2);
				this.e.setAttributeNS('', 'y2', y2);
				if (classes) {
					this.e.setAttributeNS('', 'class', classes);
				}
				return this;
			}
			this.append = function (el) {
				self.e.appendChild(el.e);
				return self;
			}
			this.dom = function () {
				return self.e;
			}
			return this;
		}
		return new smoSvgBuilder(el);
	}
	
	// ### boxNote
	// update the note geometry based on current viewbox conditions.
	// This may not be the appropriate place for this...maybe in layout
	static updateArtifactBox(svg,element,artifact) {
		
		artifact.renderedBox = svgHelpers.smoBox(element.getBoundingClientRect());
		artifact.logicalBox = svgHelpers.clientToLogical(svg,
			artifact.renderedBox);
	}
    static rect(svg,box,attrs,classes) {
        var rect = document.createELementNS(svgHelpers.namespace,'rect');
        attrs.forEach((attr) => {
            var key = Object.keys(attr)[0];
            key = (key == 'strokewidth') ? 'stroke-width' : key;
            var val = attr[key];
            rect.setAttributeNS('', key, val);            
        });
        if (classes) {
            rect.setAttributeNS('','class',classes);
        }
        svg.appendChild(rect);
    }
    
    static line(svg,x1,y1,x2,y2,attrs,classes) {
        var line = document.createElementNS(svgHelpers.namespace,'line');
        x1 = typeof(x1) == 'string' ? x1 : x1.toString();
        y1 = typeof(y1) == 'string' ? y1 : y1.toString();
        x2 = typeof(x2) == 'string' ? x2 : x2.toString();
        y2 = typeof(y2) == 'string' ? y2 : y2.toString();

        line.setAttributeNS('', 'x1', x1);
        line.setAttributeNS('', 'y1', y1);
        line.setAttributeNS('', 'x2', x2);
        line.setAttributeNS('', 'y2', y2);
        attrs = (attrs) ? attrs : [];
        attrs.forEach((attr) => {
            var key = Object.keys(attr)[0];
            key = (key == 'strokewidth') ? 'stroke-width' : key;
            var val = attr[key];
            line.setAttributeNS('', key, val);            
        });
        if (classes) {
            line.setAttributeNS('', 'class', classes);
        }
        svg.appendChild(line);
    }
    
    static arrowDown(svg,box,attrs,classes) {
        svgHelpers.line(svg,box.x+box.width/2,box.y,box.x+box.width/2,box.y+box.height);
        var arrowY=box.y + box.height/4;
        svgHelpers.line(svg,box.x,arrowY,box.x+box.width/2,box.y+box.height);
        svgHelpers.line(svg,box.x+box.width,arrowY,box.x+box.width/2,box.y+box.height);
    }
    
    static textOutlineRect(svg,textElement, color, classes) {
        var box = textElement.getBBox();
        var attrs = [{width:box.width+5,height:box.height+5,stroke:color,strokewidth:'2',fill:'none',x:box.x-5,y:box.y-5}];
        svgHelpers.rect(svg,box,attrs,classes);
    }
	// ### getTextBox
	// Get the logical bounding box of the text for placement.
	static getTextBox(svg,attributes,classes,text) {
		var el = svgHelpers.placeSvgText(svg,attributes,classes,text);
		var box = el.getBBox();
		svg.removeChild(el);
		return box;
	}

	static debugBox(svg, box, classes, voffset) {
		voffset = voffset ? voffset : 0;
		classes = classes ? classes : '';
		classes += ' svg-debug-box';
		var b = svgHelpers.buildSvg;
		var mid = box.x + box.width / 2;
		var xtext = 'x1: ' + Math.round(box.x);
		var wtext = 'x2: ' + Math.round(box.width+box.x);
		var ytext = 'y1: ' + Math.round(box.y);
		var htext = 'y2: ' + Math.round(box.height+box.y);
		var ytextp = Math.round(box.y+box.height);
		var ytextp2 = Math.round(box.y+box.height-30);

		var r = b('g').classes(classes)
			.append(
				b('text').text(box.x + 20, box.y - 14+voffset, 'svg-debug-text', xtext))
			.append(
				b('text').text(mid - 20, box.y - 14+voffset, 'svg-debug-text', wtext))
			.append(
				b('line').line(box.x, box.y - 2, box.x + box.width, box.y - 2))
			.append(
				b('line').line(box.x, box.y - 8, box.x, box.y + 5))
			.append(
				b('line').line(box.x + box.width, box.y - 8, box.x + box.width, box.y + 5))
			.append(
				b('text').text(Math.round(box.x-14+voffset), ytextp, 'svg-vdebug-text', ytext)
				  .attr('transform','rotate(-90,'+Math.round(box.x-14+voffset)+','+ytextp+')'));
		if (box.height > 2) {
			r.append(
				b('text').text(Math.round(box.x-14+voffset), ytextp2, 'svg-vdebug-text', htext)
				  .attr('transform','rotate(-90,'+Math.round(box.x-14+voffset)+','+(ytextp2)+')'))
				  .append(
				b('line').line(Math.round(box.x-2), Math.round(box.y +box.height),box.x-2,box.y))
				  .append(
				b('line').line(Math.round(box.x-8), Math.round(box.y +box.height),box.x+6,Math.round(box.y+box.height)))
				  .append(
				b('line').line(Math.round(box.x-8), Math.round(box.y),Math.round(box.x+6),Math.round(box.y)));				  
		}
		svg.appendChild(r.dom());
	}
    
    static fontIntoToSvgAttributes(fontInfo) {
        var rv = [];
        var fkeys = Object.keys(fontInfo);
		fkeys.forEach((key) => {
			var n='{"font-'+key+'":"'+fontInfo[key]+'"}';
			rv.push(JSON.parse(n));
		});
        return rv;
    }
		
	static placeSvgText(svg,attributes,classes,text) {
		var ns = svgHelpers.namespace;
		var e = document.createElementNS(ns, 'text');
		attributes.forEach((attr) => {
			var key = Object.keys(attr)[0];
		    e.setAttributeNS('', key, attr[key]);
		})
		if (classes) {
			e.setAttributeNS('', 'class', classes);
		}
		e.textContent = text;
		svg.appendChild(e);	
		return e;
	}

	// ### findIntersectionArtifact
	// find all object that intersect with the rectangle
	static findIntersectingArtifact(clientBox, objects) {
		var box = svgHelpers.smoBox(clientBox); //svgHelpers.untransformSvgPoint(this.context.svg,clientBox);

		// box.y = box.y - this.renderElement.offsetTop;
		// box.x = box.x - this.renderElement.offsetLeft;
		var rv = [];
		if (typeof(objects['forEach']) != 'function') {
			console.log('corrupt objects in findIntersectingArtifact');
		}
		objects.forEach((object) => {
			// Measure has been updated, but not drawn.
			if (!object.box) {
				// console.log('there is no box');
			} else {
				var obox = svgHelpers.smoBox(object.box);
				var i1 = box.x - obox.x; // handle edge not believe in x and y
				var i2 = box.y - obox.y;
				if (i1 > 0 && i1 < object.box.width && i2 > 0 && i2 < object.box.height) {
					rv.push(object);
				}
			}
		});

		return rv;
	}
	static findSmallestIntersection(clientBox, objects) {
		var ar = svgHelpers.findIntersectingArtifact(clientBox, objects);
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
    // ### measurePerInch
    // Supported font units
    static get unitsPerInch() {
        var rv = {};
        
        rv['pt']=72.0;
        rv['px']=96.0;
        rv['em']=6.0;
        return rv;
    }
    
    // ### getFontSize
    // Given '1em' return {size:1.0,unit:em}
    static getFontSize(fs) {
        var size=parseFloat(fs);
        var measure = fs.substr(fs.length-2,2);
        return {size:size,unit:measure};
    }
    
    static convertFont(size,o,n) {
        return size*(svgHelpers.unitsPerInch[o]/svgHelpers.unitsPerInch[n]);
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
				y: box.y
			}, null, ' ');
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
		} else {
			console.log('{}');
		}
	}

	// ### pointBox
	// return a point-sized box at the given coordinate
	static pointBox(x, y) {
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
	static smoBox(box) {
        var x = typeof(box.x) == 'undefined' ? box.left : box.x;
        var y = typeof(box.y) == 'undefined' ? box.top : box.y;
		return ({
			x: x,
			y: y,
			width: box.width,
			height: box.height
		});
	}
    
    static adjustScroll(box,scroll) {
        // WIP...
        // return svgHelpers.boxPoints(box.x + scroll.x,box.y+scroll.y,box.width,box.height);
        return box;
    }

	static boxPoints(x, y, w, h) {
		return ({
			x: x,
			y: y,
			width: w,
			height: h
		});
	}

	static copyBox(box) {
        box = svgHelpers.smoBox(box);
		return {
			x: box.x,
			y: box.y,
			width: box.width,
			height: box.height
		};
	}

	// ### svgViewport
	// set `svg` element to `width`,`height` and viewport `scale`
	static svgViewport(svg, width, height, scale) {
		svg.setAttributeNS('', 'width', '' + width);
		svg.setAttributeNS('', 'height', '' + height);
		svg.setAttributeNS('', 'viewBox', '0 0 ' + Math.round(width / scale) + ' ' +
			Math.round(height / scale));
	}

	// ### logicalToClient
	// Convert a point from logical (pixels) to actual screen dimensions based on current
	// zoom, aspect ratio
	/* static logicalToClient(svg, logicalPoint) {
	var rect = svg.getBoundingClientRect();
	var rv = svgHelpers.copyBox(logicalPoint);
	rv.x += rect.x;
	rv.y += rect.y;
	return rv;
	}   */

	// ### clientToLogical
	// return a box or point in svg coordintes from screen coordinates
	static clientToLogical(svg, point) {
		var pt = svg.createSVGPoint();
        var x = typeof(point.x) != 'undefined' ? point.x : point.left;
        var y = typeof(point.y) != 'undefined' ? point.y : point.top;
		pt.x = x;
		pt.y = y;
		var sp = pt.matrixTransform(svg.getScreenCTM().inverse());
		if (!point['width']) {
			return {
				x: sp.x,
				y: sp.y
			};
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
	static logicalToClient(svg, point) {
		var pt = svg.createSVGPoint();
		pt.x = point.x;
		pt.y = point.y;
		var sp = pt.matrixTransform(svg.getScreenCTM());
		if (!point['width']) {
			return {
				x: sp.x,
				y: sp.y
			};
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
