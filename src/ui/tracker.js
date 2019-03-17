VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

VX.groupCounter = 1;

class Tracker {
    constructor(options) {
        this.measureSource = options.measureSource;
        this.renderElement = options.renderElement;
        this.context = options.context;
        this.groupObjectMap = {};
        this.objectGroupMap = {};
        this.objects = [];
        this.selections = [];
        this.selection = {};
        this.suggestion = {};
    }

    updateMap() {
        var self = this;
        var notes = $(this.renderElement).find('.vf-stavenote');
        this.groupObjectMap = {};
        this.objectGroupMap = {};
        this.objects = [];
        $(notes).each(function (ix, note) {
            var id = $(note).attr('id');
            var artifact = self.measureSource.getRenderedNote(id);
            if (!artifact) {
                console.log('note ' + id + ' not found');
            } else {
                var box = $('#' + id)[0].getBBox();
                var renderedArtifact = {
                    artifact: artifact,
                    box: box
                };
                self.groupObjectMap[id] = artifact;
                self.objectGroupMap[artifact.id] = artifact;
                self.objects.push({
                    artifact: artifact,
                    box: box
                });
            }
        });
        $(this.renderElement).off('mousemove').on('mousemove', function (ev) {
            console.log('' + ev.clientX + ' ' + ev.clientY);
        });
    }
	
	// WIP
	get incrementSelection() {
		var increment=1;
		var sign=1;
		for (var i=0;i<this.selections.length;++i) {
			var sa=this.selections[i];
			var testTick=sa.selection.tick+increment;
			var testMeasure = sa.selection.measureIndex+increment;
			if (sa.selection.maxTicks<testTick && testTick>=0) {
				return ({
					measureIndex:selection.measureIndex,
						voice:selection.voice,
						tick:testTick,
						maxTick:sa.selection.maxTicks,
						maxMeasureIndex:sa.selection.maxMeasureIndex
				});
			} else if (sa.selection.maxMeasureIndex < testMeasure && testMeasure>=0) {
				return ({
					measureIndex:selection.measureIndex+1,
						voice:selection.voice,
						tick:0,
						maxTick:0, // unknown, this will get filled in
						maxMeasureIndex:this.measures.length
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

    containsArtifact() {
        return this.selections.length > 0;
    }
    bindEvents() {
        var self = this;
        $(this.renderElement).off('mousemove').on('mousemove', function (ev) {
            self.intersectingArtifact({
                x: ev.clientX,
                y: ev.clientY
            });
        });

        $(this.renderElement).off('click').on('click', function (ev) {
            if (self.suggestion) {
                self.drawRect(self.suggestion, 'selection');
                self.selections = [];
                self.selections.push(self.suggestion);
            }
        });

        window.addEventListener("keydown", function (event) {
            console.log("KeyboardEvent: key='" + event.key + "' | code='" +
                event.code + "'"
                 + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");
        }, true);

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

    _highlightArtifact(bb, artifact) {
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
			this._highlightArtifact(bb,artifact);
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
        var strokes = Tracker.strokes[stroke];
        var strokeObj = {};
        $(Object.keys(strokes)).each(function (ix, key) {
            strokeObj[key] = strokes[key];
        });
        this.context.rect(bb.x - 3, bb.y - 3, bb.width + 3, bb.height + 3, strokeObj);
        this.context.closeGroup(grp);
    }

}
