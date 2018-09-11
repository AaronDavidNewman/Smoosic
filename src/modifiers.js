

class vxModifierFactory {
    static getStandardModifiers(measure, options) {
        var actors = [];
		var cautionary = options && options['cautionary'] ? options['cautionary'] : new Selection();
		actors.push(new vxDotModifier());
		actors.push(new vxAccidentalModifier(measure.keySignature,cautionary));
		actors.push(new vxBeamModifier(measure));
		return actors;
    }
}
class vxDotModifier extends NoteModifierBase {
    constructor() {
        super();
    }
    static Create() {
        return new vxDotModifier();
    }
    modifyNote(iterator, note, accidentalMap) {
        if (note.dots > 0) {
            note.addDotToAll();
        }
    }
}

class vxAccidentalModifier extends NoteModifierBase {
    constructor(keySignature, cautionarySelections) {
        super();
        this.keySignature = keySignature;
        this.keyManager = new VF.KeyManager(this.keySignature);
        this.cautionary = cautionarySelections ? cautionarySelections : new Selection();
    }

    modifyNote(iterator, note,accidentalMap) {
        var canon = VF.Music.canonical_notes;
        for (var i = 0; i < note.keys.length; ++i) {
            var prop = note.keyProps[i];
            var key = prop.key.toLowerCase();
            var accidental = (this.keyManager.scale.indexOf(canon.indexOf(key)) < 0);
            accidental = accidental && !vxTickIterator.hasActiveAccidental(key, i, accidentalMap);
            var cautionary = this.cautionary.getSelectedPitches(iterator.index).indexOf(i) > 0;

            if (accidental || cautionary) {
                if (!prop.accidental)
                    prop.accidental = 'n';
                var vxAccidental = new VF.Accidental(prop.accidental);

                if (cautionary) {
                    vxAccidental.setAsCautionary();
                }
                note.addAccidental(0, new VF.Accidental(prop.accidental));
            }
        }
        return note;
    }
}

class vxBeamModifier extends NoteModifierBase {
    constructor(measure) {
        super();       
        this.duration = 0;
        this._beamGroups = [];
        this.timeSignature = measure.timeSignature;
        this.meterNumbers = this.timeSignature.split('/').map(number => parseInt(number, 10));

        this.duration = 0;
        this.startRange = 0;
        // beam on 1/4 notes in most meter, triple time dotted quarter
        this.beamBeats = 2 * 2048;
        if (this.meterNumbers[0] % 3 == 0) {
            this.beamBeats = 3 * 2048;
        }
        this.skipNext = 0;
        this.beamGroup = false;
        this.currentGroup = [];
    }   

    get beamGroups() {
        return this._beamGroups;
    }

    modifyNote(iterator, note, accidentalMap) {
       
        this.duration += iterator.delta;
		
		// beam tuplets
        if (vexMusic.isTuplet(note)) {
            //todo: when does stack have more than 1?
			var tuplet = measure.getTupletFromNote(note);
			var ult = tuplet.notes[tuplet.notes.length-1];
            // is this beamable
            if (iterator.delta < 4096) {
                this.beamGroup = true;
                this.currentGroup.push(note);
            }
			// Ultimate note in tuplet
			if (ult.attrs.id !== note.attrs.id) {
				this._beamGroups.push(new NoVexBeamGroup({notes:this.currentGroup));
				this.currentGroup=[];
				this.duration=0;
				this.startRange = iterator.index+1;
			}				            
			return note;
        }

        // don't beam > 1/4 note in 4/4 time
        if (iterator.delta >= this.beamBeats) {
            this.duration = 0;
            this.startRange = iterator.index + 1;
            return note;
        }
		
        this.currentGroup.push(note);
        if (this.duration == this.beamBeats) {
            this._beamGroups.push(new NoVexBeamGroup({notes:this.currentGroup));
            this.currentGroup = [];
            this.startRange = iterator.index + 1;
            this.duration = 0;
            return note;
        }

        // If this does not align on a beat, don't beam it
        if (this.duration > this.beamBeats ||
            ((iterator.totalDuration - this.duration) % this.beamBeats != 0)) {
            this.duration = 0;
            this.currentGroup = [];
            return note;
        }
    }
}
