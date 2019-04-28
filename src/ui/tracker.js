VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
	 : Vex.Xform);
VX = Vex.Xform;

VX.groupCounter = 1;

// ## Description
// A tracker maps the UI elements to the logical elements ,and allows the user to
// move through the score and make selections, for navigation and editing.
//
// ## Usage:
// new suiTracker(layout)
//
// ## See also:
// layout, controller, menu
class suiTracker {
	constructor(layout) {
		this.layout = layout;
		this.groupObjectMap = {};
		this.objectGroupMap = {};
		this.objects = [];
		this.selections = [];
		this.suggestion = {};
	}

	// ### renderElement
	// the element the score is rendered on
	get renderElement() {
		return this.layout.renderElement;
	}

	get score() {
		return this.layout.score;
	}

	get context() {
		return this.layout.context;
	}
	
	_copySelections() {
		var rv=[];
		this.selections.forEach((sel) => {rv.push(sel.selector)});
		return rv;
	}
	
	_findClosestSelection(selector) {
		var artifact=this._getClosestTick(selector);
		if (!artifact)
			return;
		if (this.selections.find((sel) => JSON.stringify(sel.selector) 
			 === JSON.stringify(artifact.selector))) {
			return;
		}
		this.selections.push(artifact);
	}
	
	highlightSelection() {
		this._drawRect(this._outerSelection(), 'selection');
	}

	// ### updateMap
	// This should be called after rendering the score.  It updates the score to
	// graphics map and selects the first object.
	//
	// ### TODO:
	// try to preserve the previous selection
	updateMap() {
		var notes = [].slice.call(this.renderElement.getElementsByClassName('vf-stavenote'));
		this.groupObjectMap = {};
		this.objectGroupMap = {};
		this.objects = [];
		var selCopy=this._copySelections();
		notes.forEach((note) => this.objects.push(SmoSelection.renderedNoteSelection(this.score,note)));
		this.selections=[];
		if (this.objects.length && !selCopy.length) {
			this.selections = [this.objects[0]];
		}  else {
			selCopy.forEach((sel) => this._findClosestSelection(sel));
		}
		this.highlightSelection();
	}
	
	static stringifyBox(box) {
		return '{x:'+box.x+',y:'+box.y+',width:'+box.width+',height:'+box.height+'}';
	}

	// ### _mapNoteElementToNote
	// given a svg note group, find the smo element that defines this note;
	_mapNoteElementToNote(nel) {
		var id = nel.getAttribute('id');
		var artifact = this.score.getRenderedNote(id);
		if (!artifact) {
			console.log('note ' + id + ' not found');
		} else {
			var box = document.getElementById(id).getBBox();
			var renderedArtifact = {
				artifact: artifact,
				box: box
			};
			//console.log('note '+JSON.stringify(artifact.smoMeasure.measureNumber,null,' ')+' box: '+
			  // suiTracker.stringifyBox(box));
			this.groupObjectMap[id] = artifact;
			this.objectGroupMap[artifact.id] = artifact;
			this.objects.push({
				artifact: artifact,
				box: box
			});
		}
	}

	_getClosestTick(selector) {
		var measureObj = this.objects.find((e) => SmoSelector.sameMeasure(e.selector,selector)
				 && e.selector.tick === 0);
		var tickObj = this.objects.find((e) => SmoSelector.sameNote(e.selector,selector));
		if (tickObj)
			return tickObj;
		return measureObj;
	}

	_getExtremeSelection(sign) {
		var rv = this.selections[0];
		for (var i = 1; i < this.selections.length; ++i) {
			var sa = this.selections[i].selector;
			if (sa.measure * sign > rv.measure * sign) {
				rv = this.selections[i];
			} else if (sa.measure === rv.measure && sa.tick * sign > rv.tick * sign) {
				rv = this.selections[i];
			}
		}
		return rv;
	}

	// ### _getOffsetSelection
	// Get the selector that is the offset of the first existing selection
	_getOffsetSelection(offset) {
		var increment = offset;
		var testSelection = this._getExtremeSelection(Math.sign(offset));
		var scopyTick = JSON.parse(JSON.stringify(testSelection.selector));
		var scopyMeasure = JSON.parse(JSON.stringify(testSelection.selector));
		scopyTick.tick += increment;
		scopyMeasure.measure += increment;
		if (testSelection.measure.notes.length > scopyTick.tick && scopyTick.tick >= 0) {
			return scopyTick;
		} else if (scopyMeasure.measure <testSelection.staff.measures.length && scopyMeasure.measure>= 0) {
			return scopyMeasure;
		}
		return testSelection.selector;
	}

	static unionRect(b1, b2) {
		return svgHelpers.unionRect(b1,b2);
	}

	_outerSelection() {
		if (this.selections.length == 0)
			return null;
		var rv = this.selections[0].box;
		for (var i = 1; i < this.selections.length; ++i) {
			rv = suiTracker.unionRect(rv, this.selections[i].box);
		}
		return rv;
	}

	get selectedArtifact() {
		for (var i = 0; i < this.selections.length; ++i) {
			var selection = this.selections[i];
			if (selection['artifact']) {
				return selection.artifact;
			}
		}
		return {};
	}

	growSelectionRight() {
		var nselect = this._getOffsetSelection(1);
		// already selected
		var artifact = this._getClosestTick(this.score.activeStaff, nselect);
		if (!artifact) {
			return;
		}
		if (this.selections.find((sel) => SmoSelector.sameNote(sel.selector,artifact.selector))) {
			return;
		}

		this.selections.push(artifact);
		this.highlightSelection();
	}

	growSelectionLeft() {
		var nselect = this._getOffsetSelection(-1);
		// already selected
		var artifact = this._getClosestTick(this.score.activeStaff, nselect);
		if (!artifact) {
			return;
		}
		if (this.selections.find((sel) => SmoSelector.sameNote(sel.selector,artifact.selector))) {
			return;
		}

		this.selections.push(artifact);
		this.highlightSelection();
	}

	moveSelectionRight() {
		if (this.selections.length == 0) {
			return;
		}
		var nselect = this._getOffsetSelection(1);
		this._replaceSelection(nselect);
	}

	moveSelectionLeft() {
		if (this.selections.length == 0) {
			return;
		}
		var nselect = this._getOffsetSelection(-1);
		this._replaceSelection(nselect);
	}
	moveSelectionLeftMeasure() {
		this._moveSelectionMeasure(-1);
	}
	moveSelectionRightMeasure() {
		this._moveSelectionMeasure(1);
	}
	moveSelectionOffset(offset) {
		var fcn = (offset >= 0 ? 'moveSelectionRight' : 'moveSelectionLeft');
		offset = (offset < 0) ? -1 * offset : offset;
		for (var i = 0; i < offset; ++i) {
			this[fcn]();
		}
	}
	
	_moveSelectionMeasure(offset) {
		var selection=this._getExtremeSelection(Math.sign(offset));
		selection = JSON.parse(JSON.stringify(selection));
		selection.measure += offset;
		selection.tick=0;
		var selObj=this._getClosestTick(selection.staffIndex,selection);
		if (selObj) {
			this.selections=[selObj];
		}
		this.highlightSelection();
	}

	_moveStaffOffset(offset) {
		if (this.selections.length == 0) {
			return;
		}

		var nselector = JSON.parse(JSON.stringify(this.selections[0].selector));
		nselector.staff=this.score.incrementActiveStaff(offset);
		this.selections = [this._getClosestTick(nselector)];
		this.highlightSelection();
	}
	moveSelectionUp() {
		this._moveStaffOffset(-1);
	}
	moveSelectionDown() {
		this._moveStaffOffset(1);
	}

	containsArtifact() {
		return this.selections.length > 0;
	}

	_replaceSelection(nselector) {
		var artifact = SmoSelection.noteSelection(this.score,nselector.staff,nselector.measure,nselector.voice,nselector.tick);
		this.score.setActiveStaff(nselector.staff);
		var mapped = this.objects.find((el) => {
				return SmoSelector.sameNote(el.selector,artifact.selector);
			});
		this.selections = [mapped];
		this.highlightSelection();
	}
	
	getFirstMeasureOfSelection() {
		if (this.selections.length) {
			return this.selections[0].artifact.measure;
		}
		return null;
	}
	// ## measureIterator
	// Description: iterate over the any measures that are part of the selection
	iterateMeasures(callback) {
		var set = [];
		this.selections.forEach((sel) => {
			var measure = SmoSelection.measureSelection(this.score,sel.selector.staff,sel.selector.measure).measure;
			var ix = measure.measureNumber.measureIndex;
			if (set.indexOf(ix) === -1) {
				set.push(ix);
				callback(measure);
			}
		});
	}
	selectSuggestion() {
		if (!this.suggestion['artifact']) {
			return;
		}
		this.selections = [this.suggestion];
		this.score.setActiveStaff(this.selections[0].selector.staff);
		if (this.selections.length == 0)
			return;
		var first = this.selections[0];
		for (var i = 0; i < this.selections.length; ++i) {
			var selection = this.selections[i];
			this.highlightSelection();
		}
	}

	static get strokes() {
		return {
			'suggestion': {
				'stroke': '#fc9',
				'stroke-width': 2,
				'stroke-dasharray': '4,1',
				'fill': 'none'
			},
			'selection': {
				'stroke': '#99d',
				'stroke-width': 2,
				'fill': 'none'
			},
		}
	}

	_findIntersectionArtifact(box) {
		var obj = null;
		box.y =box.y-this.renderElement.offsetTop;
		box.x =box.x-this.renderElement.offsetLeft;

		$(this.objects).each(function (ix, object) {
			var i1 = box.x - object.box.x;
			var i2 = box.y - object.box.y;			
			if (i1 > 0 && i1 < object.box.width && i2 > 0 && i2 < object.box.height) {
				obj = object;
				return false;
			}
		});
		return obj;
	}

	_setArtifactAsSuggestion(bb, artifact) {
		if (this['suggestFadeTimer']) {
			clearTimeout(this.suggestFadeTimer);
		}
		var self = this;
		this.suggestion = artifact;

		// don't suggest the current selection.
		if (this.containsArtifact(this.selections) &&
			SmoSelector.sameNote(this.selectedArtifact.selector,artifact.selector)) {
			return artifact;
		}
		this._drawRect(artifact.box, 'suggestion');

		// Make selection fade if there is a selection.
		this.suggestFadeTimer = setTimeout(function () {
				if (self.containsArtifact()) {
					self.eraseRect('suggestion');
				}
			}, 1000);
	}

	intersectingArtifact(bb) {
		var artifact = this._findIntersectionArtifact(bb);
		if (artifact) {
			this._setArtifactAsSuggestion(bb, artifact);
		}
		return artifact;
	}

	eraseRect(stroke) {
		$(this.renderElement).find('g.vf-' + stroke).remove();
	}

	_drawRect(bb, stroke) {
		this.eraseRect(stroke);
		var grp = this.context.openGroup(stroke, stroke + '-');
		var strokes = suiTracker.strokes[stroke];
		var strokeObj = {};
		$(Object.keys(strokes)).each(function (ix, key) {
			strokeObj[key] = strokes[key];
		});
		this.context.rect(bb.x - 3, bb.y - 3, bb.width + 3, bb.height + 3, strokeObj);
		this.context.closeGroup(grp);
	}
}
