// ## SmoNote
// ## Description:
// Data for a musical note.  THe most-contained-thing, except there can be note modifiers
// Basic note information.  Leaf node of the SMO dependency tree (so far)
// ## SmoNote Methods
// ---
class SmoNote {
    // ### Description:
    // see defaults for params format.
    constructor(params) {
        Vex.Merge(this, SmoNote.defaults);
        smoSerialize.serializedMerge(SmoNote.parameterArray, params, this);

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
    static get flagStates() {
        return {auto:0,up:1,down:2};
    }
    static get parameterArray() {
        return ['ticks', 'pitches', 'noteType', 'tuplet', 'attrs', 'clef', 'endBeam','beamBeats','flagState'];
    }

    toggleFlagState() {
        this.flagState = (this.flagState + 1) % 3;
    }

    toVexStemDirection() {
        return (this.flagState == SmoNote.flagStates.up ? VF.Stem.UP : VF.Stem.DOWN);

    }
    get id() {
        return this.attrs.id;
    }

    get dots() {
        if (this.isTuplet) {
            return 0;
        }
        var vexDuration = smoMusic.ticksToDuration[this.tickCount];
        if (!vexDuration) {
            return 0;
        }
        return vexDuration.split('d').length - 1;
    }

    set dots(value) {
        // ignore - dots are a function of duration only.
    }

    // ### _addModifier
    // ### Description
    // add or remove sFz, mp, etc.
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

    _addArticulation(articulation, toAdd) {
        var tms = [];
        this.articulations.forEach((tm) => {
            if (tm.articulation != articulation.articulation) {
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
    getModifiers(type) {
        var ms = this.textModifiers.filter((mod)=> {
            return mod.attrs.type === type;
        });
        return ms;
    }

    addLyric(lyric) {
        var tms = this.textModifiers.filter((mod) => {
            return mod.attrs.type != 'SmoLyric' || mod.verse != lyric.verse;
        });
        tms.push(lyric);
        this.textModifiers = tms;
    }


    removeLyric(lyric) {
        var tms = this.textModifiers.filter((mod) => {
            return mod.attrs.type != 'SmoLyric' || mod.verse != lyric.verse;
        });
        this.textModifiers = tms;
    }

    getLyricForVerse(verse) {
        return this.textModifiers.filter((mod) => {
            return mod.attrs.type == 'SmoLyric' && mod.verse == verse;
        });
    }

    getOrnaments(ornament) {
        return this.ornaments;
    }

    toggleOrnament(ornament) {
            var aix = this.ornaments.filter((a) => {
                return a.attrs.type === 'SmoOrnament' && a.ornament === ornament.ornament;
            });
        if (!aix.length) {
            this.ornaments.push(ornament);
        } else {
            this.ornaments=[];
        }
    }

    // Toggle between articulation above, below, or remove
    toggleArticulation(articulation) {
        var aix = this.articulations.findIndex((a) => {
                return a.articulation === articulation.articulation;
            });
        if (aix >= 0) {
            var cur = this.articulations[aix];
            if (cur.position == SmoArticulation.positions.above) {
                cur.position = SmoArticulation.positions.below;
                return;
            }
            else {
                this._addArticulation(articulation,false);
                return;
            }
        }
        this._addArticulation(articulation, true);
    }

    static _sortPitches(note) {
        var canon = VF.Music.canonical_notes;
        var keyIndex = ((pitch) => {
            return canon.indexOf(pitch.letter) + pitch.octave * 12;
        });
        note.pitches.sort((a, b) => {
            return keyIndex(a) - keyIndex(b);
        });
    }
    addGraceNote(params,offset) {
        params.clef = this.clef;
        if (this.graceNotes.length > offset) {
            this.graceNotes[offset]= new SmoGraceNote(params);
        } else {
            this.graceNotes.push(new SmoGraceNote(params));
        }
    }
    removeGraceNote(offset) {
        if (offset >= this.graceNotes.length) {
            return;
        }
        this.graceNotes.splice(offset,1);
    }
    getGraceNotes() {
        return this.graceNotes;
    }
    addPitchOffset(offset) {
        if (this.pitches.length == 0) {
            return this;
        }
        this.noteType = 'n';
        var pitch = this.pitches[0];
        this.pitches.push(smoMusic.getKeyOffset(pitch, offset));

        SmoNote._sortPitches(this);
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

    addMicrotone(tone) {
        var ar = this.tones.filter((tn) => tn.pitch != tone.pitch);
        ar.push(tone);
        this.tones = ar;
    }
    removeMicrotone(tone) {
        var ar = this.tones.filter((tn) => tn.pitch != tone.pitch
            && tone.tone != tn.tone);
        this.tones = ar;
    }

    getMicrotones() {
        return this.tones;
    }

    transpose(pitchArray, offset, keySignature) {
        return SmoNote._transpose(this,pitchArray,offset,keySignature);
    }
    static _transpose(note,pitchArray, offset, keySignature) {
        var pitches = [];
        note.noteType = 'n';
        if (pitchArray.length == 0) {
            note.pitches.forEach((m) => {
                pitchArray.push(note.pitches.indexOf(m));
            });
        }
        for (var j = 0; j < pitchArray.length; ++j) {
            var index = pitchArray[j];
            if (index + 1 > note.pitches.length) {
                note.addPitchOffset(offset);
            } else {
                var pitch = smoMusic.getKeyOffset(note.pitches[index], offset);
                if (keySignature) {
                    var letterKey = pitch.letter + pitch.accidental;
                    letterKey = smoMusic.getKeyFriendlyEnharmonic(letterKey, keySignature);
                    pitch.letter = letterKey[0];
                    if (letterKey.length < 2) {
                        pitch.accidental = 'n';
                    } else {
                        pitch.accidental = letterKey.substring(1);
                    }
                }
                note.pitches[index] = pitch;
            }
        }
        SmoNote._sortPitches(note);
        return note;
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
        if (typeof(ticks) === 'number') {
            ticks = {numerator:ticks,denominator:1,remainder:0};
        }
        var rv = SmoNote.clone(note);

        rv.ticks = ticks;

        return rv;
    }

    _serializeModifiers(params) {
        ['textModifiers','graceNotes','articulations','ornaments','tones'].forEach((attr) => {
            if (this[attr] && this[attr].length) {
                params[attr] =  JSON.parse(JSON.stringify(this[attr]));
            }
        });
    }
    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoNote.defaults,SmoNote.parameterArray, this, params);
        if (params.ticks) {
            params.ticks = JSON.parse(JSON.stringify(params.ticks));
        }
        this._serializeModifiers(params);
        return params;
    }

    static get defaults() {
        return {
            noteType: 'n',
            textModifiers: [],
            articulations: [],
            graceNotes:[],
            ornaments:[],
            tones:[],
            endBeam: false,
            beamBeats:4096,
            flagState:SmoNote.flagStates.auto,
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
        note.attrs.id = jsonObj.attrs.id;
        ['textModifiers','graceNotes','ornaments','articulations','tones'].forEach((attr) =>
        {
            if (!jsonObj[attr]) {
                note[attr] = [];
            } else {
                jsonObj[attr].forEach((mod) => {
                    note[attr].push(SmoNoteModifierBase.deserialize(mod));
                });
            }
        });
        // Due to a bug, text modifiers were serialized into noteModifiers array
        if (jsonObj.noteModifiers) {
            jsonObj.noteModifiers.forEach((mod) => {
                note.textModifiers.push(mod);
            });
        }

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
        }
        this._adjustTicks();
    }

	static get longestTuplet() {
		return 8192;
	}

    get clonedParams() {
        var paramAr = ['stemTicks', 'ticks', 'totalTicks', 'durationMap']
        var rv = {};
        smoSerialize.serializedMerge(paramAr, this, rv);
        return rv;

    }

	static calculateStemTicks(totalTicks,numNotes) {
        var stemValue = totalTicks / numNotes;
        var stemTicks = SmoTuplet.longestTuplet;

        // The stem value is the type on the non-tuplet note, e.g. 1/8 note
        // for a triplet.
        while (stemValue < stemTicks) {
            stemTicks = stemTicks / 2;
        }
		return stemTicks * 2;
	}

    static cloneTuplet(tuplet) {
        var noteAr = tuplet.notes;
        var durationMap = JSON.parse(JSON.stringify(tuplet.durationMap)); // deep copy array

		// Add any remainders for oddlets
		var totalTicks = noteAr.map((nn) => nn.ticks.numerator+nn.ticks.remainder).reduce((acc, nn) => acc+nn);

        var numNotes = tuplet.numNotes;
        var stemValue = totalTicks / numNotes;
        var stemTicks = SmoTuplet.calculateStemTicks(totalTicks,numNotes);

        var tupletNotes = [];

        var i = 0;
        noteAr.forEach((note) => {
            var textModifiers = note.textModifiers;
            note = SmoNote.cloneWithDuration(note, {
                    numerator: stemTicks*tuplet.durationMap[i],
                    denominator: 1,
                    remainder: 0
                });

            // Don't clone modifiers, except for first one.
            if (i === 0) {
                var ntmAr = [];
                textModifiers.forEach((tm) => {
                    ntm = SmoNoteModifierBase.deserialize(JSON.stringify(tm));
                    ntmAr.push(ntm);
                });
                note.textModifiers = ntmAr;
            }
            i += 1;

            tupletNotes.push(note);
        });
        var rv = new SmoTuplet({
                notes: tupletNotes,
                stemTicks: stemTicks,
                totalTicks: totalTicks,
                ratioed: false,
                bracketed: true,
                startIndex: tuplet.startIndex,
                durationMap: durationMap
            });
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

            note.tuplet = this.attrs;
        }

		// put all the remainder in the first note of the tuplet
		var noteTicks = this.notes.map((nn) => {return nn.tickCount;}).reduce((acc,dd) => {return acc+dd;});
		this.notes[0].ticks.remainder = this.totalTicks-noteTicks;

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
				// remainder is for the whole tuplet, so don't duplicate that.
				onote.ticks.remainder=0;
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
        }
        for (var i = 0; i < this.notes.length; ++i) {
            var note = this.notes[i];
            if (note.tickCount < 4096)
                note.beam_group = this.attrs;
        }
    }
}
