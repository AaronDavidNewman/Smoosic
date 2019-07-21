


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
        smoMusic.filteredMerge(SmoNote.parameterArray, params, this);

        // this.keys=JSON.parse(JSON.stringify(this.keys));

        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoNote'
            };
        } else {
            // inherit attrs id for deserialized
        }
    }
    static get parameterArray() {
        return ['ticks', 'pitches', 'noteType','tuplet','attrs','clef'];
    }
    get id() {
        return this.attrs.id;
    }

    get dots() {
        if (this.isTuplet) {
            return 0;
        }
        var vexDuration = smoMusic.ticksToDuration[this.tickCount];
        return vexDuration.split('d').length - 1;
    }

    set dots(value) {
        // ignore - dots are a function of duration only.
    }
   

    // ## _addModifier
    // sFz, mp, etc.
    _addModifier(dynamic, toAdd) {
        var tms = [];
        this.textModifiers.forEach((tm) => {
            if (tm.attrs.type != dynamic.attrs.type) {
                tms.push(tm);
            }
        });
        if (toAdd) {
            tms.push(dynamic);
        }
        this.textModifiers = tms;
    }
	
	_addArticulation(articulation,toAdd) {
        var tms = [];
        this.articulations.forEach((tm) => {
            if (tm.articulation  != articulation.articulation) {
                tms.push(tm);
            }
        });
        if (toAdd) {
            tms.push(articulation);
        }
        this.articulations = tms;
	}

    addModifier(dynamic) {
        this._addModifier(dynamic, true);
    }
    removeModifier(dynamic) {
        this._addModifier(dynamic, false);
    }
		
	toggleArticulation(articulation) {
		if (this.articulations.findIndex((a) => {return a.articulation===articulation.articulation;}) < 0) {
			this._addArticulation(articulation,true);
		} else {
			this._addArticulation(articulation,false);
		}
	}

    _sortPitches() {
        var canon = VF.Music.canonical_notes;
        var keyIndex = ((pitch) => {
            return canon.indexOf(pitch.letter) + pitch.octave * 12;
        });
        this.pitches.sort((a, b) => {
            return keyIndex(a) - keyIndex(b);
        });
    }
    addPitchOffset(offset) {
        if (this.pitches.length == 0) {
            return this;
        }
        this.noteType = 'n';
        var pitch = this.pitches[0];
        this.pitches.push(smoMusic.getKeyOffset(pitch, offset));

        this._sortPitches();
    }

    makeRest() {
        this.noteType = (this.noteType == 'r' ? 'n' : 'r');
    }

    makeNote() {
        this.noteType = 'n';
    }

    get isTuplet() {
        return this['tuplet'] && this.tuplet['id'];
    }

    transpose(pitchArray, offset, keySignature) {
        var pitches = [];
        this.noteType = 'n';
        if (pitchArray.length == 0) {
            this.pitches.forEach((m) => {
                pitchArray.push(this.pitches.indexOf(m));
            });
        }
        for (var j = 0; j < pitchArray.length; ++j) {
            var index = pitchArray[j];
            if (index + 1 > this.pitches.length) {
                this.addPitchOffset(offset);
            } else {
                var nnote = smoMusic.getKeyOffset(this.pitches[index], offset);
                if (keySignature) {
                    var letterKey = nnote.letter + nnote.accidental;
                    letterKey = smoMusic.getKeyFriendlyEnharmonic(letterKey, keySignature);
                    nnote.letter = letterKey[0];
                    if (letterKey.length < 2) {
                        nnote.accidental = 'n';
                    } else {
                        nnote.accidental = letterKey.substring(1);
                    }
                }
                this.pitches[index] = nnote;
            }
        }
        this._sortPitches();
        return this;
    }
    get tickCount() {
        return this.ticks.numerator / this.ticks.denominator + this.ticks.remainder;
    }

    describe() {
        return this.id + ' ' + this.tickCount;
    }

    static clone(note) {
        var rv = SmoNote.deserialize(note.serialize());

        // make sure id is unique
        rv.attrs = {
            id: VF.Element.newID(),
            type: 'SmoNote'
        };
        return rv;
    }

    // ## Description:
    // Clone the note, but use the different duration.  Changes the length
    // of the note but nothing else.
    static cloneWithDuration(note, ticks) {
        var rv = SmoNote.clone(note);

        rv.ticks = ticks;

        return rv;
    }

	_serializeModifiers() {
        return JSON.parse(JSON.stringify(this.textModifiers));
    }
	serialize()  {
		var params={};
		smoMusic.serializedMerge(SmoNote.parameterArray,this,params);
		params.ticks = JSON.parse(JSON.stringify(params.ticks));
		params.noteModifiers=this._serializeModifiers();
		return params;
	}

    static get defaults() {
        return {
            noteType: 'n',
            textModifiers: [],
			articulations:[],
            ticks: {
                numerator: 4096,
                denominator: 1,
                remainder: 0
            },
            pitches: [{
                    letter: 'b',
                    octave: 4,
                    accidental: ''
                }
            ],
        }
    }
    static deserialize(jsonObj) {
		var note = new SmoNote(jsonObj);
		note.attrs.id=jsonObj.attrs.id;
		jsonObj.noteModifiers.forEach((mod) => {
			note.textModifiers.push(SmoNoteModifierBase.deserialize(mod));
		});
		return note;
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
	
	get clonedParams() {
		var paramAr=['stemTicks','ticks','totalTicks','durationMap']
		var rv = {};
		smoMusic.serializedMerge(paramAr,this,rv);
		return rv;
			
	}

    _adjustTicks() {
        var sum = this.durationSum;
        for (var i = 0; i < this.notes.length; ++i) {
            var note = this.notes[i];
            var normTicks = smoMusic.durationToTicks(smoMusic.ticksToDuration[this.stemTicks]);
            // TODO:  notes_occupied needs to consider vex duration
            var tupletBase = normTicks * this.note_ticks_occupied;
            note.ticks.denominator = 1;
            note.ticks.numerator = Math.floor((this.totalTicks * this.durationMap[i]) / sum);
            // put all the remainder in the first note of the tuplet
            note.ticks.remainder = (i == 0) ? this.totalTicks * this.durationMap[i] % sum : 0;

            note.tuplet = this.attrs;
        }
    }
    getIndexOfNote(note) {
        var rv = -1;
        for (var i = 0; i < this.notes.length; ++i) {
            var tn = this.notes[i];
            if (note.id === tn.id) {
                rv = i;
            }
        }
        return rv;
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
        if (this.notes.length <= endIndex || startIndex >= endIndex) {
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
        for (i = 0; i < this.notes.length; ++i) {
            var note = this.notes[i];
            // notes that don't change are unchanged
            if (i < startIndex || i > endIndex) {
                nmap.push(this.durationMap[i]);
                nnotes.push(note);
            }
            // changed note with combined duration
            if (i == startIndex) {
                note.ticks.numerator = note.ticks.numerator * multiplier;
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
            if (note.tickCount < 4096)
                note.beam_group = this.attrs;
        }
    }
}
