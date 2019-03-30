VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

VX.groupCounter = 1;

class suiTracker {
    constructor(layout) {
        this.layout = layout;
        this.groupObjectMap = {};
        this.objectGroupMap = {};
        this.objects = [];
        this.selections = [];
        this.suggestion = {};
    }

    get renderElement() {
        return this.layout.renderElement;
    }

    get score() {
        return this.layout.score;
    }

    get context() {
        return this.layout.context;
    }
	
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
                this.groupObjectMap[id] = artifact;
                this.objectGroupMap[artifact.id] = artifact;
                this.objects.push({
                    artifact: artifact,
                    box: box
                });
            }
	}

    updateMap() {
        var notes = [].slice.call(this.renderElement.getElementsByClassName('vf-stavenote'));
        this.groupObjectMap = {};
        this.objectGroupMap = {};
        this.objects = [];
		notes.forEach((note) => this._mapNoteElementToNote(note));
		if (this.objects.length && !this.selections.length) {
			this.selections=[this.objects[0]];
			this.drawRect(this.selections[0],'selection');
		}
   
    }

    _getClosestTick(staffIndex, selectObj) {
		var selection = selectObj.artifact.selection
        var measureObj = this.objects.find((e) => e.artifact.selection.measureIndex === selection.measureIndex && 
		e.artifact.selection.staffIndex === staffIndex
                 && e.artifact.selection.tick === 0);
        var tickObj = this.objects.find((e) => e.artifact.selection.measureIndex === selection.measureIndex && 
		e.artifact.selection.staffIndex === staffIndex
                 && e.artifact.selection.tick === selection.tick);
        if (tickObj)
            return tickObj;
        return measureObj;
    }
	
    // WIP
    _bumpSelection(offset) {
        var increment = offset;
        for (var i = 0; i < this.selections.length; ++i) {
            var sa = this.selections[i].artifact;
            var testTick = sa.selection.tick + increment;
            var testMeasure = sa.selection.measureIndex + increment;
            if (sa.selection.maxTickIndex > testTick && testTick >= 0) {
                return ({
                    staffIndex: sa.selection.staffIndex,
                    measureIndex: sa.selection.measureIndex,
                    voice: sa.selection.voice,
                    tick: testTick,
                    maxTickIndex: sa.selection.maxTickIndex,
                    maxMeasureIndex: sa.selection.maxMeasureIndex
                });
            } else if (sa.selection.maxMeasureIndex > testMeasure && testMeasure >= 0) {
                // first or last tick of next measure.
                var maxTick = this.score.getMaxTicksMeasure(testMeasure);
                var nextTick = increment > 0 ? 0 : maxTick - 1;
                return ({
                    staffIndex: sa.selection.staffIndex,
                    measureIndex: testMeasure,
                    voice: sa.selection.voice,
                    tick: nextTick,
                    maxTickIndex: maxTick, // unknown, this will get filled in
                    maxMeasureIndex: sa.selection.maxMeasureIndex
                });

            }
        }
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

    moveSelectionRight() {
        if (this.selections.length == 0) {
            return;
        }
        var nselect = this._bumpSelection(1);
        this._replaceSelection(nselect);
    }

    moveSelectionLeft() {
        if (this.selections.length == 0) {
            return;
        }
        var nselect = this._bumpSelection(-1);
        this._replaceSelection(nselect);
    }
	moveSelectionOffset(offset) {
		var fcn = (offset>=0 ? 'moveSelectionRight' : 'moveSelectionLeft');
		offset = (offset < 0 ) ? -1* offset: offset;
		for (var i=0;i<offset;++i) {
			this[fcn]();
		}
	}
	
	_moveStaffOffset(offset) {
		if (this.selections.length == 0) {
            return;
        }
		var staffIndex = this.score.incrementActiveStaff(offset);
		
        this.selections=[this._getClosestTick(staffIndex,this.selections[0])];
        this.drawRect(this.selections[0],'selection');
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

    _replaceSelection(nselect) {
        if (nselect && typeof(nselect['measureIndex']) != 'undefined') {
            var artifact = this.score.getNoteAtSelection(nselect);
            this.score.setActiveStaff(nselect.staffIndex);
            var mapped = this.objects.find((el) => {
                    return el.artifact.id === artifact.id
                });
            this.selections = [mapped];
			this.drawRect(mapped,'selection');
        }
    }
    selectSuggestion() {
		if (!this.suggestion['artifact']) {
			return;               
        }
		this.selections = [this.suggestion];
        if (this.selections.length == 0)
            return;
        var first = this.selections[0];
        for (var i = 0; i < this.selections.length; ++i) {
            var selection = this.selections[i];
            this.drawRect(selection, 'selection');
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
            this.selectedArtifact.id === artifact.artifact.id) {
            return artifact;
        }
        this.drawRect(artifact, 'suggestion');

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

    drawRect(renderedArtifact, stroke) {
        this.eraseRect(stroke);
        var grp = this.context.openGroup(stroke, stroke + '-' + renderedArtifact.artifact.id);
        var bb = renderedArtifact.box;
        var strokes = suiTracker.strokes[stroke];
        var strokeObj = {};
        $(Object.keys(strokes)).each(function (ix, key) {
            strokeObj[key] = strokes[key];
        });
        this.context.rect(bb.x - 3, bb.y - 3, bb.width + 3, bb.height + 3, strokeObj);
        this.context.closeGroup(grp);
    }
}
