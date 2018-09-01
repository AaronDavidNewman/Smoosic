VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

VX.groupCounter = 1;

// ## Description:
//   Create a staff and draw music on it.
//
// ##  Options:
//  clef:'treble',
//  num_beats:num_beats,
//  timeSignature: '4/4'

class StaffMeasure {
    constructor(context, options) {
        this.context = context;
        this.timeSignature = '4/4';
        this.keySignature = "G";
		Vex.Merge(this,StaffMeasure.defaults);
        Vex.Merge(this, options);
        this.meterNumbers = this.timeSignature.split('/').map(number => parseInt(number, 10));
        this.groupName = 'staffGroup-' + VX.groupCounter;
        VX.groupCounter += 1;
       
    }
	
	static get defaults() {
		this.timeSignature = '4/4';
        this.keySignature = "C";
		this.staffX=10;
		this.staffY=40;
		this.staffWidth=400;
		this.clef='treble';
		this.numBeats = 4;
		this.notes= [
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/5"],
                duration: "4"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/5"],
                duration: "4"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/5"],
                duration: "4"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/5"],
                duration: "4"
            })
	}
	
	_createMusic() {
		if (this.replace) {
			this.staffX = this.replace.staffX;
			this.staffY = this.replace.staffY;
			this.staffWidth = this.replace.staffWidth;
		}
		
		 this.stave = new VF.Stave(this.staffX, this.staffY, this.staffWidth);

		 // Add a clef and time signature.
        this.stave.addClef(this.clef).addTimeSignature(this.timeSignature).addKeySignature(this.keySignature);

        // Connect it to the rendering context and draw!
        this.stave.setContext(this.context).draw();

        // console.log(JSON.stringify(notes));
        // Create a voice in 4/4 and add above notes
        this.voice = new VF.Voice({
                num_beats: this.num_beats
            });
			
	}

    render() {
		
		_createMusic();
		
		var beamer = FluentBeamer.Create(this.voice,this.timeSignature);
		TickIteratorChain.addModifier(beamer).run();
		
		this.beamGrups = beamer.beamGroups;
		
        if (this.notes.length) {
            $(this.context.svg).find('#vf-' + this.notes[0].attrs.id).closest('g.measure').remove();
        }        

        var group = this.context.openGroup();
        group.classList.add(this.groupName);
        group.classList.add('measure');


        // this.createBeamGroups(voice, notes);

        // Format and justify the notes to 400 pixels.
        var formatter = new VF.Formatter().joinVoices([voice]).formatToStave([voice], stave);

        // Render voice
        voice.draw(this.context, stave);
        this.drawBeams();

        this.drawTuplets(notes, this.context);
        this.context.closeGroup();

        return {
            group: group,
            voice: voice,
            staff: stave,
            notes: notes,
            beams: this.beamGroups,
            keySignature: this.keySignature
        };
    }

    drawBeams() {
        var self = this;
        this.beamGroups.forEach(function (b) {
            b.setContext(self.context).draw()
        });
    }
    createBeamGroups(voice, notes) {

        var rv = [];
        var duration = 0;
        var startRange = 0;
        var beamBeats = 2 * 2048;
        if (this.meterNumbers[0] % 3 == 0) {
            beamBeats = 3 * 2048;
        }
        var beamLogic = function (iterator, notes, note) {
            duration += iterator.delta;
            if (note.tupletStack.length) {
                //todo: when does stack have more than 1?
                var tuplen = note.tupletStack[0].notes.length;

                // Get an array of tuplet notes, and skip to the end of the tuplet
                var tupNotes = iterator.skipNext(tuplen);

                if (iterator.delta < 4096) {
                    rv.push(new VF.Beam(tupNotes));
                }
                return;
            }
            // don't beam > 1/4 note in 4/4 time
            if (iterator.delta >= beamBeats) {
                duration = 0;
                startRange = iterator.index + 1;
                // iterator.resetRange();
                return;
            }
            if (duration == beamBeats) {

                rv.push(new VF.Beam(notes.slice(startRange, iterator.index + 1)));
                startRange = iterator.index + 1;
                duration = 0;
                return;
            }

            // If this does not align on a beat, don't beam it
            if (duration > beamBeats ||
                ((iterator.totalDuration - duration) % beamBeats != 0)) {
                duration = 0;
                startRange = iterator.index + 1;
                return;
            }
        }
        VX.ITERATE(beamLogic, notes, {
            voice: voice,
            timeSignature: this.timeSignature
        });
        this.beams = rv;
    }

    drawTuplets(notes, context) {
        var self = this;
        VX.ITERATE(function (iterator, notes, note) {
            note.tupletStack.forEach(function (tuplet) {
                tuplet.setContext(self.context).draw();
            });
        }, notes);
    }
}

class EditorApi {
    constructor(music, context, staffMeasure) {
        this.modNote = Selection.selectChords(music.notes, 0);

        this.staffMeasure = staffMeasure;
        this.music = music;
        this.context = context;      
    }
    setDuration(duration) {
        var selectedChords = this.modNote.tickArray();
        for (var i = 0; i < selectedChords.length; ++i) {
            this.music.notes = VX.DURATION(this.music.notes, selectedChords[i], duration);
        }
		
		this.music.notes = VX.MODIFY(this.music.notes,this.music.keySignature);
        this.music = this.staffMeasure.drawNotes(this.music.notes);
        this.drawRect(this.modNote.getSelectedNotes(this.music.notes));
    }
    addDot() {
        var notes = this.modNote.getSelectedNotes(this.music.notes);
        for (var i = 0; i < notes.length; ++i) {
            var note = notes[i];
            var ticks = note.ticks.numerator / note.ticks.denominator;
            var duration = vexMusic.ticksToDuration[ticks];
            duration += 'd';
            this.setDuration(duration);
        }
    }
    highlightSelected() {
        this.drawRect(this.modNote.getSelectedNotes(this.music.notes));
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

    offsetHandler(offset) {
        var keys = [];
        var canon = VF.Music.canonical_notes;
        var self = this;
        this.music.notes = VX.TRANSPOSE(this.music.notes, this.modNote, offset, this.staffMeasure.keySignature);

        // this.music.notes = VX.SETPITCH(this.music.notes, this.modNote,keys);
	    this.music.notes = VX.APPLY_MODIFIERS(this.music.notes,this.music.keySignature);

        this.music = this.staffMeasure.drawNotes(this.music.notes);
        this.highlightSelected();
        return this;
    }
    downHandler() {
        this.offsetHandler(-1);
    }
    upHandler() {
        this.offsetHandler(1);
    }

    enharmonicHandler() {
        this.music.notes = VX.ENHARMONIC(this.music.notes, this.modNote, this.staffMeasure.keySignature);
		this.music.notes = VX.APPLY_MODIFIERS(this.music.notes,this.music.keySignature);

        this.music = this.staffMeasure.drawNotes(this.music.notes);
        this.highlightSelected();
    }
    anoteHandler(pitch) {
        var km = new VF.KeyManager(this.staffMeasure.keySignature);
        var noteType = 'n';
        var note = this.modNote.getSelectedNotes(this.music.notes)[0];
        if (pitch.toLowerCase() == 'r') {
            noteType = 'r';
            this.music.notes = VX.SETNOTETYPE(this.music.notes, this.modNote, 'r');
        } else {
            pitch = vexMusic.getKeySignatureKey(pitch, this.staffMeasure.keySignature);
            var octave = note.keyProps[0].octave;
            this.music.notes = VX.SETPITCH(this.music.notes, this.modNote, [pitch + '/' + octave]);
        }
		VX.APPLY_MODIFIERS(this.music.notes,this.music.keySignature);
        this.music = this.staffMeasure.drawNotes(this.music.notes);
        this.highlightSelected();
    }

    courtesyHandler() {
        var note = this.modNote.getSelectedNotes(this.music.notes)[0];
        this.music.notes = VX.COURTESY(this.music.notes, this.modNote, this.staffMeasure.keySignature);
		VX.MODIFY(this.music.notes,this.music.keySignature);
        this.music = this.staffMeasure.drawNotes(this.music.notes);
        this.highlightSelected();
    }
}

class Tracker {
    constructor(music, context, staffMeasure) {
        this.editorApi = new EditorApi(music, context, staffMeasure);

        var self = this;

        $('#left').off('click').on('click', function () {
            self.editorApi.leftHandler();
        });

        $('#right').off('click').on('click', function () {
            self.editorApi.rightHandler();
        });
        $('#up').off('click').on('click', function () {
            self.editorApi.upHandler();
        });
        $('#down').off('click').on('click', function () {
            self.editorApi.downHandler();
        });
        $('#upOctave').off('click').on('click', function () {
            self.editorApi.offsetHandler(12);
        });
        $('#downOctave').off('click').on('click', function () {
            self.editorApi.offsetHandler(-12);
        });
        $('#noteGroup button').off('click').on('click', function () {
            var note = $(this).attr('id')[0].toLowerCase();
            self.editorApi.anoteHandler(note);
        });
        $('#addCourtesy').off('click').on('click', function () {
            self.editorApi.courtesyHandler();
        });
        $('#enharmonic').off('click').on('click',
            function () {
            self.editorApi.enharmonicHandler();
        });

        $('#noteDurations button').off('click').on('click',
            function () {
            var duration = $(this).attr('data-duration');
            self.editorApi.setDuration(duration);
        });
        $('#dotted').off('click').on('click',
            function () {
            self.editorApi.addDot();
        });

        this.editorApi.highlightSelected();
    }

}
