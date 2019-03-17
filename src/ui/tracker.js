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
    _bumpSelection(offset) {
        var increment = offset;
        for (var i = 0; i < this.selections.length; ++i) {
            var sa = this.selections[i].artifact;
            var testTick = sa.selection.tick + increment;
            var testMeasure = sa.selection.measureIndex + increment;
            if (sa.selection.maxTickIndex > testTick && testTick >= 0) {
                return ({
                    measureIndex: sa.selection.measureIndex,
                    voice: sa.selection.voice,
                    tick: testTick,
                    maxTickIndex: sa.selection.maxTickIndex,
                    maxMeasureIndex: sa.selection.maxMeasureIndex
                });
            } else if (sa.selection.maxMeasureIndex > testMeasure && testMeasure >= 0) {
                // first or last tick of next measure.
				var maxTick=this.measureSource.getMaxTicksMeasure(testMeasure);
                var nextTick = increment > 0 ? 0 : maxTick-1;
                return ({
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
            if (self.suggestion['artifact']) {
                self.selections = [self.suggestion];
                self.highlightSelected();
            }
        });

        window.addEventListener("keydown", function (event) {
            if (event.key === 'ArrowRight') {
                if (self.selections.length == 0) {
                    return;
                }
                var nselect = self._bumpSelection(1);
                self._replaceSelection(nselect);
            }
			if (event.key === 'ArrowLeft') {
                if (self.selections.length == 0) {
                    return;
                }
                var nselect = self._bumpSelection(-1);
                self._replaceSelection(nselect);
            }
            console.log("KeyboardEvent: key='" + event.key + "' | code='" +
                event.code + "'"
                 + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");
        }, true);

    }

    _replaceSelection(nselect) {
        if (nselect && typeof(nselect['measureIndex']) != 'undefined') {
            var artifact = this.measureSource.getNoteAtSelection(nselect);
            var mapped = this.objects.find((el) => {return el.artifact.id === artifact.id});
            this.selections = [mapped];
        }
        this.highlightSelected();
    }
    highlightSelected() {
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
            this._highlightArtifact(bb, artifact);
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
