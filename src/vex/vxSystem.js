// ## Description:
//   Create a system of staves and draw music on it.
//
// ##  Options:
//  clef:'treble',
//  num_beats:num_beats,
//  timeSignature: '4/4',
//  smoMeasures: []
class VxSystem {
    constructor(context, topY, lineIndex) {
        this.context = context;
        this.leftConnector = [null, null];
        this.lineIndex = lineIndex;
        this.maxStaffIndex = -1;
        this.maxSystemIndex = -1;
        this.width = -1;
        this.endcaps = [];
        this.box = {
            x: -1,
            y: -1,
            width: 0,
            height: 0
        };
        this.currentY = 0;
        this.topY = topY;
        this.clefWidth = 70;
        this.ys = [];
        this.measures = [];
        this.modifiers = [];
    }

    getVxNote(smoNote) {
        var note;
		if (!smoNote) {
			return null;
		}
        for (var i = 0; i < this.measures.length; ++i) {
            var mm = this.measures[i];
            if (mm.noteToVexMap[smoNote.id]) {
                return mm.noteToVexMap[smoNote.id];
            }
        }
        return null;
    }

    renderModifier(modifier, vxStart, vxEnd) {
		var artifactId=modifier.attrs.id+'-'+this.lineIndex;
        $(this.context.svg).find('g.' + artifactId).remove();
        var group = this.context.openGroup();
		console.log('adding modifier note '+vxStart.attrs.id);
        group.classList.add(artifactId);
        if (modifier.type == SmoStaffModifier.types.CRESCENDO ||
            modifier.type == SmoStaffModifier.types.DECRESCENDO) {
            var hairpin = new VF.StaveHairpin({
                    first_note: vxStart,
                    last_note: vxEnd
                }, modifier.type);
            hairpin.setContext(this.context).setPosition(modifier.position).draw();
        }

        this.context.closeGroup();
		return group.getBoundingClientRect();
    }

    // ## renderMeasure
    // ## Description:
    // Create the graphical (VX) notes and render them on svg.  Also render the tuplets and beam
    // groups
    renderMeasure(staffIndex, smoMeasure) {
        var systemIndex = smoMeasure.measureNumber.systemIndex;

        var vxMeasure = new VxMeasure(this.context, {
                smoMeasure: smoMeasure
            });

        vxMeasure.render();

        // Keep track of the y coordinate for the nth staff


        // keep track of left-hand side for system connectors
        if (systemIndex === 0) {
            if (staffIndex === 0) {
                this.leftConnector[0] = vxMeasure.stave;
            } else if (staffIndex > this.maxStaffIndex) {
                this.maxStaffIndex = staffIndex;
                this.leftConnector[1] = vxMeasure.stave;
            }
        } else if (smoMeasure.measureNumber.systemIndex > this.maxSystemIndex) {
            this.endcaps = [];
            this.endcaps.push(vxMeasure.stave);
            this.maxSystemIndex = smoMeasure.measureNumber.systemIndex;
        } else if (smoMeasure.measureNumber.systemIndex === this.maxSystemIndex) {
            this.endcaps.push(vxMeasure.stave);
        }
        this.measures.push(vxMeasure);
        // this._adjustBox(vxMeasure.renderedSize);
    }

    // ## cap
    // ## Description:
    // draw the system brackets.  I don't know why I call them a cap.
    cap() {
        $(this.context.svg).find('g.lineBracket-' + this.lineIndex).remove();
        var group = this.context.openGroup();
        group.classList.add('lineBracket-' + this.lineIndex);
        if (this.leftConnector[0] && this.leftConnector[1]) {
            var c1 = new VF.StaveConnector(this.leftConnector[0], this.leftConnector[1])
                .setType(VF.StaveConnector.type.BRACKET);
            var c2 = new VF.StaveConnector(this.leftConnector[0], this.leftConnector[1])
                .setType(VF.StaveConnector.type.SINGLE);
            c1.setContext(this.context).draw();
            c2.setContext(this.context).draw();
        }
        this.context.closeGroup();
    }
}
