VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

VX.groupCounter = 1;

class Tracker {
    constructor(options) {
        this.measureSource = options.measureSource;
        this.renderElement = options.renderElement;
		this.context=options.context;
        this.groupObjectMap = {};
        this.objectGroupMap = {};
        this.objects = [];
    }

    updateMap() {
        var self = this;
        var notes = $(this.renderElement).find('.vf-stavenote');
        this.groupObjectMap = {};
        this.objectGroupMap = {};
        this.objects = [];
        $(notes).each(function (ix, note) {
            var id = $(note).attr('id');
            var smoNote = self.measureSource.getRenderedNote(id);
            if (!smoNote) {
                console.log('note ' + id + ' not found');
            } else {
                console.log('rendered note ' + id + ' = ' + smoNote.id);
                var box = $('#'+id)[0].getBBox();
                var artifact = {
                    smoNote: smoNote,
                    box: box
                };
                self.groupObjectMap[id] = artifact;
                self.objectGroupMap[smoNote.id] = artifact;
                self.objects.push(artifact);
            }
        });
        $('#boo svg').off('mousemove').on('mousemove', function (ev) {
            console.log('' + ev.clientX + ' ' + ev.clientY);
        });
    }
	intersectingArtifact(bb) {
		var obj = null;
		$(this.objects).each(function(ix,object) {
			var i1 = bb.x-object.box.x;
			var i2 = bb.y-object.box.y;
			if (i1>0 &&  i1<object.box.width && i2>0 && i2<object.box.height) {
				obj=object;
				return false;
			}
		});
		if (obj) {
			this.drawRect(obj);
		}
		return obj;
	}

    drawRect(artifact) {
        $(this.renderElement).find('g.vf-note-box').remove();
        var grp = this.context.openGroup('note-box', 'box-' + artifact.smoNote.id);
		var bb=artifact.box;
        this.context.rect(bb.x, bb.y, bb.width + 3, bb.height + 3, {
            stroke: '#fc9',
            'stroke-width': 2,
            'fill': 'none'
        });
        this.context.closeGroup(grp);
    }

}
