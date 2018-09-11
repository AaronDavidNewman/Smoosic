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
        VF.Merge(this, VxMeasure.defaults);
        VF.Merge(this, options);
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

    _createVexNote(noVxNote) {
        var vexNote = new VF.StaveNote({
                clef: noVxNote.clef,
                keys: noVxNote.keys,
                duration: noVxNote.duration + noVxNote.noteType
            });

        for (var i = 0; i < noVxNote.accidentals.length; ++i) {
            var accMap = noVxNote.accidentals[i];
            var keys = Object.keys(accMap);
            for (var j = 0; j < keys.length; ++j) {
                var key = keys[j];
                var keyInt = parseInt(key);
                var val = accMap[key];
                var acc = new VF.Accidental(val.symbol);
                if (val.isCautionary)
                    acc.setAsCautionary();
                vexNote.addAccidental(keyInt, acc);
            }
        }
        for (var i = 0; i < noVxNote.dots; ++i) {
            vexNote.addDotToAll();
        }

        return vexNote;
    }
    createVexNotes() {
        for (var i = 0; i < this.noVexMeasure.notes.length; ++i) {
            noVexNote = this.noVexMeasure.notes[i];
            var vexNote = _createVexNote(noVexNote);
            this.noteToVexMap[noVxNote.attrs.id] = vexNote;
            this.vexNotes.push(vexNote);
        }
    }
    createVexBeamGroups() {
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

        var group = this.context.openGroup();
        group.classList.add(this.noVexMeasure.attrs.id);
        this.createVexNotes();
        this.createVexTuplets();
        this.createVexBeamGroups();
        this.stave = new VF.Stave(this.staffX, this.staffY, this.staffWidth);

        // Add a clef and time signature.
        if (this.drawClef) {
            this.stave.addClef(this.clef).addTimeSignature(this.timeSignature).addKeySignature(this.keySignature);
        }
        // Connect it to the rendering context and draw!
        this.stave.setContext(this.context).draw();

        // console.log(JSON.stringify(notes));
        // Create a voice in 4/4 and add above notes
        this.voice = new VF.Voice({
                num_beats: this.noVexMeasure.numBeats,
                beat_value: this.noVexMeasure.beatValue
            });
        this.voice.addTickables(this.notes);
        this.formatter = new VF.Formatter().joinVoices([voice]).format([voice], this.staffWidth);
        this.voice.draw(this.context, stave);

        var self = this;
        this.vexBeamGroups.forEach(function (b) {
            b.setContext(self.context).draw()
        });

        this.vexTupltes.forEach(function (tuplet) {
            tuplet.setContext(self.context).draw();
        });
    }

}
