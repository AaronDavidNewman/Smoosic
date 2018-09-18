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
        this.noVexMeasure = new NoVexMeasure(options);
        this.noteToVexMap = {};
        this.beamToVexMap = {};
        this.tupletToVexMap = {};

        this.vexNotes = [];
        this.vexBeamGroups = [];
        this.vexTuplets = [];
    }

    static get defaults() {
        return {
            staffX: 10,
            staffY: 40,
            staffWidth: 400,
            drawClef: true
        };
    }
    addCustomModifier(ctor, parameters) {
        this.noVexMeasure.addCustomModifier(ctor, parameters);
    }

    applyTransform(ctorString, parameters) {
        var ctor = eval(ctorString);
        parameters.keySignature = this.noVexMeasure.keySignature;
        var actor = new ctor(parameters);
        var transformer = new VxTransformer(this.noVexMeasure, [actor]);
        transformer.run();
        this.noVexMeasure.notes = transformer.notes;
        this.applyModifiers();
    }
    applyModifiers() {
        var modifiers = this.getModifiers();
        var apply = new vxModifier(this.noVexMeasure, modifiers);
        apply.run();
    }
    getModifiers() {

        var actors = vxModifierFactory.getStandardModifiers(this.noVexMeasure);
        for (var i = 0; i < this.noVexMeasure.customModifiers.length; ++i) {
            var modifier = this.noVexMeasure.customModifiers[i];
            var ctor = eval(modifier.ctor);
            var instance = new ctor(modifier.parameters);
            actors.push(instance);
        }

        return actors;

    }
	tickmap() {
		return VX.TICKMAP(this.noVexMeasure);
	}

    _createVexNote(noVxNote) {
        var vexNote = new VF.StaveNote({
                clef: noVxNote.clef,
                keys: noVxNote.toVexKeys(),
                duration: noVxNote.duration + noVxNote.noteType
            });

        for (var i = 0; i < noVxNote.accidentals.length; ++i) {
            var noVexAcc = noVxNote.accidentals[i];
            var acc = new VF.Accidental(noVexAcc.value.symbol);
            if (noVexAcc.value.isCautionary)
                acc.setAsCautionary();
            vexNote.addAccidental(noVexAcc.index, acc);

        }
        for (var i = 0; i < noVxNote.dots; ++i) {
            vexNote.addDotToAll();
        }

        return vexNote;
    }
    createVexNotes() {
        this.vexNotes = [];
        for (var i = 0; i < this.noVexMeasure.notes.length; ++i) {
            var noVexNote = this.noVexMeasure.notes[i];
            var vexNote = this._createVexNote(noVexNote);
            this.noteToVexMap[noVexNote.attrs.id] = vexNote;
            this.vexNotes.push(vexNote);
        }
    }
    createVexBeamGroups() {
        this.vexBeamGroups = [];
        for (var i = 0; i < this.noVexMeasure.beamGroups.length; ++i) {
            var bg = this.noVexMeasure.beamGroups[i];
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

    createVexTuplets() {
        this.vexTuplets = [];
        for (var i = 0; i < this.noVexMeasure.tuplets.length; ++i) {
            var tp = this.noVexMeasure.tuplets[i];
            var vexNotes = [];
            for (var j = 0; j < tp.notes.length; ++j) {
                var noVexNote = tp.notes[j];
                vexNotes.push(this.noteToVexMap[noVexNote.attrs.id]);
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

    render() {

        $(this.context.svg).find('g.' + this.noVexMeasure.attrs.id).remove();

        var group = this.context.openGroup();
        group.classList.add(this.noVexMeasure.attrs.id);
        this.createVexNotes();
        this.createVexTuplets();
        this.createVexBeamGroups();
        this.stave = new VF.Stave(this.staffX, this.staffY, this.staffWidth);

        // Add a clef and time signature.
        if (this.drawClef) {
            this.stave.addClef(this.noVexMeasure.clef)
            .addTimeSignature(this.noVexMeasure.timeSignature)
            .addKeySignature(this.noVexMeasure.keySignature);
        }
        // Connect it to the rendering context and draw!
        this.stave.setContext(this.context).draw();

        // console.log(JSON.stringify(notes));
        // Create a voice in 4/4 and add above notes
        this.voice = new VF.Voice({
                num_beats: this.noVexMeasure.numBeats,
                beat_value: this.noVexMeasure.beatValue
            });
        this.voice.addTickables(this.vexNotes);
        this.formatter = new VF.Formatter().joinVoices([this.voice]).format([this.voice], this.staffWidth);
        this.voice.draw(this.context, this.stave);

        var self = this;
        this.vexBeamGroups.forEach(function (b) {
            b.setContext(self.context).draw()
        });

        this.vexTuplets.forEach(function (tuplet) {
            tuplet.setContext(self.context).draw();
        });
        this.context.closeGroup();
    }

}
