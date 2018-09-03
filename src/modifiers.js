


class vxDotModifier extends NoteModifierBase {
    constructor() {super(); }
    static Create() {
        return new vxDotModifier();
    }
    modifyNote(note, iterator,accidentalMap) {
        if (note.dots > 0) {
            note.addDotToAll();
        }
    }
}


class vxAccidentalModifier extends NoteModifierBase {
	constructor(keySignature,cautionarySelections) {
		super();
		this.keySignature = keySignature;
		this.keyManager = new VF.KeyManager(this.keySignature);
		this.cautionary = cautionarySelections;
	}
	
    modifyNote(note, iterator,accidentalMap)  {
	    var canon = VF.Music.canonical_notes;
        for (var i = 0; i < note.keys.length; ++i) {
                var prop = note.keyProps[i];
                var key = prop.key.toLowerCase();
				var accidental = (this.keyManager.scale.indexOf(canon.indexOf(key)) < 0);
				accidental = accidental && !vxTickIterator.hasActiveAccidental(key,i,accidentalMap);
                if (accidental) {
                    if (!prop.accidental)
                        prop.accidental = 'n';
                    note.addAccidental(0, new VF.Accidental(prop.accidental));
                }
            }
		return note;
    }
	
}

class vxBeamModifier extends NoteModifierBase {
    constructor(music) {
        super();
        this.voice = music.voice;
        this.duration = 0;
        this._beamGroups = [];
		this.timeSignature=music.timeSignature;
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
    static Create(voice,timeSignature) {
        return new FluentBeamer(voice,timeSignature);
    }
	
	get beamGroups() {
		return this._beamGroups;
	}

    modifyNote(note, iterator,accidentalMap) {
		
		this.voice.addTickable(note);
		
		if (this.skipNext) {
		    this.skipNext -= 1;
		    if (this.beamGroup) {
		        this.currentGroup.push(note);
		        if (!this.skipNext) {
		            this._beamGroups.push(new VF.Beam(this.currentGroup));
		            this.beamGroup = false;
		            this.currentGroup = [];
		        }
		    }
		}
        this.duration += iterator.delta;
        if (note.tupletStack.length) {
            //todo: when does stack have more than 1?
            this.skipNext = note.tupletStack[0].notes.length;

            // Get an array of tuplet notes, and skip to the end of the tuplet
            if (iterator.delta < 4096) {
				this.beamGroup = true;
				this.currentGroup.push(note);                
            }
            return;
        }
        // don't beam > 1/4 note in 4/4 time
        if (iterator.delta >= this.beamBeats) {
            this.duration = 0;
            this.startRange = iterator.index + 1;            
            return;
        }
		this.currentGroup.push(note);
        if (this.duration == this.beamBeats) {

            this._beamGroups.push(new VF.Beam(this.currentGroup));
			this.currentGroup = [];
            this.startRange = iterator.index + 1;
            this.duration = 0;
            return note;
        }

        // If this does not align on a beat, don't beam it
        if (this.duration > this.beamBeats ||
            ((iterator.totalDuration - this.duration) % this.beamBeats != 0)) {
            this.duration = 0;
			this.currentGroup=[];
            return note;
        }
    }
}
