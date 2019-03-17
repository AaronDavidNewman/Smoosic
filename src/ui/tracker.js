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

	get selectedArtifact() {
		if (this.selection['artifact']) {
			return this.selection.artifact;
		}
		return {};
	}
	
	static containsArtifact(artifact) {
        return artifact && artifact['artifact'];
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
                self.selection = self.suggestion;
            }
        });

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

    intersectingArtifact(bb) {
        var obj = null;

        $(this.objects).each(function (ix, object) {
            var i1 = bb.x - object.box.x;
            var i2 = bb.y - object.box.y;
            if (i1 > 0 && i1 < object.box.width && i2 > 0 && i2 < object.box.height) {
                obj = object;
                return false;
            }
        });
        if (obj) {
            if (this['suggestFadeTimer']) {
                clearTimeout(this.suggestFadeTimer);
            }
            var self = this;
            this.suggestion = obj;

            // don't suggest the current selection.
            if (Tracker.containsArtifact(this.selection) &&
                Tracker.containsArtifact(obj) && this.selectedArtifact.id === obj.artifact.id) {
                return obj;
            }
            this.drawRect(obj, 'suggestion');
			
			// Make selection fade if there is a selection.
            this.suggestFadeTimer = setTimeout(function () {
                    if (Tracker.containsArtifact(self.selection)) {
                        self.eraseRect('suggestion');
                    }
                }, 1000);
        }

        return obj;
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
