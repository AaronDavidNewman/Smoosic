

// ##Note on prefixes:
// SMO == Serializable Music Ontology, stuff I made up
// vx == VF == Vexflow rendering engine by https://github.com/0xfe
// Where it makes sense, SMO uses VF conventions, e.g. ticks to store note durations
// and identifiers for notes and things.
//
// ## Description:
// Basic note information.  Leaf node of the SMO dependency tree (so far)
class SmoNote {
    // ## Description:
    // see defaults for params format.
    constructor(params) {
        Vex.Merge(this, SmoNote.defaults);
        Vex.Merge(this, params);
        var ticks = vexMusic.durationToTicks(this.duration);
        this.ticks = {
            numerator: ticks,
            denominator: 1,
            remainder: 0
        };
        this.tupletInfo = {};
        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoNote'
            };
        } else {
			console.log('inherit attrs');
		}
        this.accidentals = [];
        this.dots = 0;
    }
	get id() {
		return this.attrs.id;
	}
	
    toVexKeys() {
        var rv = [];
        for (var i = 0; i < this.keys.length; ++i) {
            var key = this.keys[i];
            rv.push(key.key + '/' + key.octave);
        }
        return rv;
    }
    _sortKeys() {
        var canon = VF.Music.canonical_notes;
        var keyIndex = ((key) => {
            return canon.indexOf(key.key) + key.octave * 12;
        });
        this.keys.sort((a, b) => {
            return keyIndex(a) - keyIndex(b);
        });
    }
    addPitchOffset(offset) {
        if (this.keys.length == 0) {
            return this;
        }
        var key = this.keys[0];
        this.keys.push(vexMusic.getKeyOffset(key, offset));

        this._sortKeys();
    }

    transpose(pitchArray, offset) {
        var keys = [];
        for (var j = 0; j < pitchArray.length; ++j) {
            var index = pitchArray[j];
            if (index + 1 > this.keys.length) {
                this.addPitchOffset(offset);
            } else {
                this.keys[index] = vexMusic.getKeyOffset(this.keys[index], offset);
            }
        }
        this._sortKeys();
        return this;
    }
    get tickCount() {
        return this.ticks.numerator / this.ticks.denominator + this.ticks.remainder;
    }

    // ## Accidental format
    // {index:1,value:{symbol:'#',cautionary:false}}
    addAccidental(accidental) {
        for (var i = 0; i < this.accidentals.length; ++i) {
            var aa = this.accidentals[i];
            if (aa.index === accidental.index) {
                aa.value = accidental.value;
                return;
            }
        }
        this.accidentals.push(accidental);
        return this;
    }
    addDots(num) {
        this.dots = num;
        return this;
    }
	static _cloneParameters(note) {
        var keys = Object.keys(note);
        var clone = {};
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            clone[key] = note[key];
        }
		return clone;
	}
    static clone(note) {
        var clone = SmoNote._cloneParameters(note);

        // should tuplet info be cloned?
        var rv = new SmoNote(clone);
		
		// make sure id is unique
		rv.attrs={
                id: VF.Element.newID(),
                type: 'SmoNote'
            };
		return rv;
    }
	
	// ## Description:
	// Clone the note, but use the different duration.  Changes the length
	// of the note but nothing else.
	static cloneWithDuration(note,duration) {
		var clone = SmoNote._cloneParameters(note);
		clone.duration = duration;
        // should tuplet info be cloned?
        var rv = new SmoNote(clone);
		
		// make sure id is unique
		rv.attrs={
                id: VF.Element.newID(),
                type: 'SmoNote'
            };
		return rv;
	}
	
    static get defaults() {
        return {
            timeSignature: '4/4',
            keySignature: "C",
            clef: 'treble',
            noteType: 'n',
            numBeats: 4,
            beatValue: 4,
            voice: 0,
            duration: '4',
            keys: [{
                    key: 'b',
                    octave: 4,
                    accidental: ''
                }
            ],
            accidentals: []
        }
    }
}

class SmoTuplet {
    constructor(params) {
        this.notes = params.notes;
        Vex.Merge(this, SmoTuplet.defaults);
        Vex.Merge(this, params);
        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoTuplet'
            };
        } else {
			console.log('inherit attrs');
		}
        this._adjustTicks();
    }

    _adjustTicks() {
        var sum = this.durationSum;
        for (var i = 0; i < this.notes.length; ++i) {
            var note = this.notes[i];
            var normTicks = vexMusic.durationToTicks(vexMusic.ticksToDuration[this.stemTicks]);
            // TODO:  notes_occupied needs to consider vex duration
            var tupletBase = normTicks * this.note_ticks_occupied;
            note.ticks.denominator = 1;
            note.ticks.numerator = Math.floor((this.totalTicks * this.durationMap[i]) / sum);
            // put all the remainder in the first note of the tuplet
            note.ticks.remainder = (i == 0) ? this.totalTicks * this.durationMap[i] % sum : 0;

            note.tuplet = this.attrs;
        }
    }
    split(combineIndex) {
        var multiplier = 0.5;
        var nnotes = [];
        var nmap = [];

        for (var i = 0; i < this.notes.length; ++i) {
            var note = this.notes[i];
            if (i === combineIndex) {
                nmap.push(this.durationMap[i] * multiplier);
                nmap.push(this.durationMap[i] * multiplier);
                note.ticks.numerator *= multiplier;

                var normalizedTicks = VF.durationToTicks(note.duration) / 2;
                note.duration = vexMusic.ticksToDuration[normalizedTicks];

                var onote = SmoNote.clone(note);
                nnotes.push(note);
                nnotes.push(onote);
            } else {
                nmap.push(this.durationMap[i]);
                nnotes.push(note);
            }
        }
        this.notes = nnotes;
        this.durationMap = nmap;
    }
    combine(startIndex, endIndex) {
        // can't combine in this way, too many notes
        if (this.num_notes <= endIndex || startIndex >= endIndex) {
            return this;
        }
        var acc = 0.0;
        var i;
        var base = 0.0;
        for (i = startIndex; i <= endIndex; ++i) {
            acc += this.durationMap[i];
            if (i == startIndex) {
                base = this.durationMap[i];
            } else if (this.durationMap[i] != base) {
                // Can't combine non-equal tuplet notes
                return this;
            }
        }
        // how much each combined value will be multiplied by
        var multiplier = acc / base;

        var nmap = [];
        var nnotes = [];
        // adjust the duration map
        for (i = 0; i < this.num_notes; ++i) {
            var note = this.notes[i];
            // notes that don't change are unchanged
            if (i < startIndex || i > endIndex) {
                nmap.push(this.durationMap[i]);
                nnotes.push(note);
            }
            // changed note with combined duration
            if (i == startIndex) {
                note.ticks.numerator = note.ticks.numerator * acc;
                var normTicks = VF.durationToTicks(note.duration) * multiplier;
                note.duration = vexMusic.ticksToDuration[normTicks];
                nmap.push(acc);
                nnotes.push(note);
            }
            // other notes after startIndex are removed from the map.
        }
        this.notes = nnotes;
        this.durationMap = nmap;
    }
    get durationSum() {
        var acc = 0;
        for (var i = 0; i < this.durationMap.length; ++i) {
            acc += this.durationMap[i];
        }
        return Math.round(acc);
    }
    get num_notes() {
        return this.durationSum;
    }
    get notes_occupied() {
        return Math.floor(this.totalTicks / this.stemTicks);
    }
	get note_ticks_occupied() {
		return this.totalTicks / this.stemTicks;
	}
    get tickCount() {
        var rv = 0;
        for (var i = 0; i < this.notes.length; ++i) {
            var note = this.notes[i];
            rv += (note.ticks.numerator / note.ticks.denominator) + note.ticks.remainder;
        }
        return rv;
    }
    static get defaults() {
        return {
            numNotes: 3,
            totalTicks: 4096, // how many ticks this tuple takes up
            stemTicks: 2048, // the stem ticks, for drawing purposes.  >16th, draw as 8th etc.
            location: 1,
            durationMap: [1.0, 1.0, 1.0],
            bracketed: true,
            ratioed: false
        }
    }
}

class SmoBeamGroup {
    constructor(params) {
        this.notes = params.notes;
        Vex.Merge(this, params);

        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoBeamGroup'
            };
        } else {
			console.log('inherit attrs');
		}
        for (var i = 0; i < this.notes.length; ++i) {
            var note = this.notes[i];
            if (VF.durationToTicks(note.duration) < 4096)
                note.beam_group = this.attrs;
        }
    }
}
