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
class VxMeasure {
    constructor(context, options) {
        this.context = context;
        Vex.Merge(this, VxMeasure.defaults);
        Vex.Merge(this, options);
        this.smoMeasure = this.smoMeasure ? this.smoMeasure : new SmoMeasure(options);
        this.noteToVexMap = {};
        this.beamToVexMap = {};
        this.tupletToVexMap = {};
        this.modifierOptions = {};

        this.vexNotes = [];
        this.vexBeamGroups = [];
        this.vexTuplets = [];
    }

    static get defaults() {
        return {
            staffX: 10,
            staffY: 40,
            staffWidth: 400,
            smoMeasure: null
        };
    }
    addCustomModifier(ctor, parameters) {
        this.smoMeasure.addCustomModifier(ctor, parameters);
    }

    applyTransform(actor) {
        SmoTickTransformer.applyTransform(this.smoMeasure, [actor]);
        smoModifierFactory.applyModifiers(this.smoMeasure);
    }
    applyModifiers() {
        smoModifierFactory.applyModifiers(this.smoMeasure);
    }
    tickmap() {
        return VX.TICKMAP(this.smoMeasure);
    }

	// ## Description:
	// decide whether to force stem direction for multi-voice, or use the default.
	// ## TODO:
	// use x position of ticks in other voices, pitch of note, and consider 
	// stem direction modifier.
    applyStemDirection(vxParams) {
        if (this.smoMeasure.voices.length === 1) {
            vxParams.auto_stem = true;
        } else if (this.smoMeasure.activeVoice % 2) {
            vxParams.stem_direction = -1;
        } else {
            vxParams.stem_direction = 1;
        }
    }

	// ## Description:
	// convert a smoNote into a vxNote so it can be rasterized
    _createVexNote(smoNote) {
        var noteParams = {
            clef: smoNote.clef,
            keys: smoNote.toVexKeys(),
            duration: smoNote.duration + smoNote.noteType
        };
        this.applyStemDirection(noteParams);
        var vexNote = new VF.StaveNote(noteParams);
		smoNote.renderId = vexNote.attrs.id;

        for (var i = 0; i < smoNote.accidentals.length; ++i) {
            var smoAcc = smoNote.accidentals[i];
            var acc = new VF.Accidental(smoAcc.value.symbol);
            if (smoAcc.value.cautionary)
                acc.setAsCautionary();
            vexNote.addAccidental(smoAcc.index, acc);

        }
        for (var i = 0; i < smoNote.dots; ++i) {
            vexNote.addDotToAll();
        }

        return vexNote;
    }
	// ## Description:
	// create an a array of VF.StaveNote objects to render the active voice.
    createVexNotes() {
        this.vexNotes = [];
		this.noteToVexMap={};

        for (var i = 0; i < this.smoMeasure.notes.length; ++i) {
            var smoNote = this.smoMeasure.notes[i];
            var vexNote = this._createVexNote(smoNote);
            this.noteToVexMap[smoNote.attrs.id] = vexNote;
            this.vexNotes.push(vexNote);
        }
    }
	
	// ## Description:
	// create the VX beam groups, honoring the Smo custom modifiers
	// ## TODO:
	// make the Smo custom modifiers
    createVexBeamGroups() {
        this.vexBeamGroups = [];
		this.beamToVexMap={};
        for (var i = 0; i < this.smoMeasure.beamGroups.length; ++i) {
            var bg = this.smoMeasure.beamGroups[i];
            var vexNotes = [];
            for (var j = 0; j < bg.notes.length; ++j) {
                var note = bg.notes[j];
                vexNotes.push(this.noteToVexMap[note.attrs.id]);
            }
            var vexBeam = new VF.Beam(vexNotes);
            this.beamToVexMap[bg.attrs.id] = vexBeam;
            this.vexBeamGroups.push(vexBeam);
        }
    }

	// ## Description:
	// Create the VF tuplet objects based on the smo tuplet objects
	// that have been defined.
    createVexTuplets() {
        this.vexTuplets = [];
		this.tupletToVexMap={};
        for (var i = 0; i < this.smoMeasure.tuplets.length; ++i) {
            var tp = this.smoMeasure.tuplets[i];
            var vexNotes = [];
            for (var j = 0; j < tp.notes.length; ++j) {
                var smoNote = tp.notes[j];
                vexNotes.push(this.noteToVexMap[smoNote.attrs.id]);
            }
            var vexTuplet = new VF.Tuplet(vexNotes, {
                    num_notes: tp.num_notes,
                    notes_occupied: tp.notes_occupied,
                    ratioed: false,
                    bracketed: true,
                    location: 1
                });
            this.tupletToVexMap[tp.attrs.id] = vexTuplet;
            this.vexTuplets.push(vexTuplet);
        }
    }
	unrender() {
		$(this.context.svg).find('g.' + this.smoMeasure.attrs.id).remove();
	}

	// ## Description:
	// Render all the notes in my smoMeasure.  All rendering logic is called from here.
    render() {

        $(this.context.svg).find('g.' + this.smoMeasure.attrs.id).remove();

        var group = this.context.openGroup();
        group.classList.add(this.smoMeasure.attrs.id);

        // offset for left-hand stuff
        var xOffset = 0;
        this.stave = new VF.Stave(this.smoMeasure.staffX, this.smoMeasure.staffY, this.smoMeasure.staffWidth);

        // Add a clef and time signature.
        if (this.smoMeasure.forceClef || this.smoMeasure.measureNumber.systemIndex === 0) {
            this.stave.addClef(this.smoMeasure.clef)
            .addTimeSignature(this.smoMeasure.timeSignature)
            .addKeySignature(this.smoMeasure.keySignature);
            xOffset = 70;
        }
        // Connect it to the rendering context and draw!
        this.stave.setContext(this.context).draw();

        for (var j = 0; j < this.smoMeasure.voices.length; ++j) {

            this.smoMeasure.activeVoice = j;
            this.createVexNotes();
            this.createVexTuplets();
            this.createVexBeamGroups();

            // console.log(JSON.stringify(notes));
            // Create a voice in 4/4 and add above notes
            this.voice = new VF.Voice({
                    num_beats: this.smoMeasure.numBeats,
                    beat_value: this.smoMeasure.beatValue
                });
            this.voice.addTickables(this.vexNotes);
            this.formatter = new VF.Formatter().joinVoices([this.voice]).format([this.voice], this.staffWidth - xOffset);
            this.voice.draw(this.context, this.stave);

            var self = this;
            this.vexBeamGroups.forEach(function (b) {
                b.setContext(self.context).draw()
            });

            this.vexTuplets.forEach(function (tuplet) {
                tuplet.setContext(self.context).draw();
            });
        }
        this.context.closeGroup();
    }

}
