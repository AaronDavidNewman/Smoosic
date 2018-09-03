VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

VX.groupCounter = 1;

class Tracker {
    constructor(measure, context, staffMeasure) {
		this.measure = Selection.selectChords(measure.notes, 0);        

        var self = this;

        $('#left').off('click').on('click', function () {
            self.leftHandler();
        });

        $('#right').off('click').on('click', function () {
            self.rightHandler();
        });
        $('#up').off('click').on('click', function () {
            self.transposeHandler(1);
        });
        $('#down').off('click').on('click', function () {
            self.transposeHandler(-1);
        });
        $('#upOctave').off('click').on('click', function () {
            self.transposeHandler(12);
        });
        $('#downOctave').off('click').on('click', function () {
            self.transposeHandler(-12);
        });
        $('#noteGroup button').off('click').on('click', function () {
            var note = $(this).attr('id')[0].toLowerCase();
            self.setPitchHandler(note);
        });
        /* $('#addCourtesy').off('click').on('click', function () {
            self.editorApi.courtesyHandler();
        });  */
        /* $('#enharmonic').off('click').on('click',
            function () {
            self.editorApi.enharmonicHandler();
        });  */

        $('#noteDurations button').off('click').on('click',
            function () {
            var duration = $(this).attr('data-duration');
            self.setDuration(duration);
        });
        /* $('#dotted').off('click').on('click',
            function () {
            self.editorApi.addDot();
        });  */

        this.highlightSelected();
    }
	setPitchHandler(pitch) {
		var km = new VF.KeyManager(this.measure.keySignature);
		var note = this.modNote.getSelectedNotes(this.measure.notes)[0];
		if (pitch.toLowerCase() == 'r') {
            noteType = 'r';
            this.music.notes = VX.SETNOTETYPE(this.music.notes, this.modNote, 'r');
        } else {
            pitch = vexMusic.getKeySignatureKey(pitch, this.staffMeasure.keySignature);
            var octave = note.keyProps[0].octave;
            this.music.notes = VX.SETPITCH(this.music.notes, this.modNote, [pitch + '/' + octave]);
        }
		this.measure = vxMeasureOperations.setPitchHandler(this.measure,this.selection,keys);
		this.measure.render();
	}
	transposeHandler(offset) {
		this.measure = vxMeasureOperations.transposeHandler(
		this.measure,this.modNote,offset);
		  
		measure.render();
	}
	setDuration(duration) {
		this.measure = vxMeasureOperations.setDuration(this.measure,this.modNote,duration) ;
		measure.render();
	}
	leftHandler() {
        var len = this.music.notes.length;

        // shift left with wrap
        var newIndex = (this.modNote.tickArray()[0] + len - 1) % len;
        this.modNote = Selection.selectChords(this.music.notes, newIndex);
        this.highlightSelected();
        return this;
    }
	rightHandler() {
        var len = this.music.notes.length;
        // shift right with wrap
        var newIndex = (this.modNote.tickArray()[0] + 1) % len;

        this.modNote = Selection.selectChords(this.music.notes, newIndex);
        this.highlightSelected();
        return this;
    }
	drawRect(noteAr) {
        // whatever note we were tracking before, forget it
        $(this.context.svg).find('g.vf-note-box').remove();

        // Create a bounding box around all the selections
        var bb = null;
        var grp = this.context.openGroup('note-box', 'box-' + noteAr[0].attrs.id);
        for (var i = 0; i < noteAr.length; ++i) {
            var note = noteAr[i];
            if (!bb) {
                bb = note.getBoundingBox();
            } else {
                bb = bb.mergeWith(note.getBoundingBox());
            }
        }
        this.context.rect(bb.x, bb.y, bb.w + 3, bb.h + 3, {
            stroke: '#fc9',
            'stroke-width': 2,
            'fill': 'none'
        });
        this.context.closeGroup(grp);
    }
	highlightSelected() {
		this.drawRect(this.modNote.getSelectedNotes(this.music.notes));
	}

}
