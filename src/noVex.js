

class NoVexNote {
    constructor(params) {
        Vex.Merge(this, NoVexNote.defaults);
        Vex.Merge(this, params);
        var ticks = VF.durationToTicks(this.duration);
        this.ticks = {
            numerator: ticks,
            denominator: 1
        };
        this.tupletInfo = {};
        this.attrs = {
            id: VF.Element.newID(),
            type: 'NoVexNote'
        };
        this.accidentals = [];
        this.dots = 0;
    }

    transpose(selections, offset) {
        var keys = [];
        var selectedKeys = selections.chordIndexOf(index);
        for (var i = 0; i < this.keys.length; ++i) {
            var key = this.keys[i];
            if (selectedKeys.indexOf(i) < 0) {
                keys.push(key);
            } else {
                keys.push(vexMusic.getKeyOffset(key, offset));
            }
        }
        this.keys = keys;
        return this;
    }
    setKeys(selections, keys) {
        this.keys = keys;
        return this;
    }
    // ## Accidental format
    // {index:1,value:{symbol:'#',cautionary:false}}
    addAccidental(accidental) {
        for (var i = 0; i < this.accidentals.length; ++0) {
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
    static get defaults() {
        return {
            timeSignature: '4/4',
            keySignature: "C",
            clef: 'treble',
            noteType: 'n',
            numBeats: 4,
            beatValue: 4,
            duration: '4',
            keys: ['B/4']
        }
    }
}

class NoVexTuplet {
    constructor(params) {
        this.notes = params.notes;
        Vex.Merge(this, NoVexTuplet.defaults);
        Vex.Merge(this, params);
        this.attrs = {
            id: VF.Element.newID(),
            type: 'NoVexTuplet'
        };
        this._adjustTicks();
    }

    _adjustTicks() {
        for (var i = 0; i < this.notes.length; ++i) {
            var note = this.notes[i];
            var normTicks = VF.durationToTicks[note.duration];
            var tupletBase = normTicks * this.notes_occupied;
            note.ticks.denominator = this.num_notes;
            note.ticks.numerator = Math.floor(tupletBase / this.num_notes);
            note.ticks.remainder = tupletBase % this.num_notes;

            note.tuplet = this.attrs;
        }
    }
    static get defaults() {
        return {
            num_notes: this.notes.length,
            notes_occupied: 2,
            location: 1,
            bracketed: true,
            ratioed: false
        }
    }
}

class NoVexBeamGroup {
    constructor(params) {
        this.notes = params.notes;
        this.attrs = {
            id: VF.Element.newID(),
            type: 'NoVexBeamGroup'
        };
        Vex.Merge(this, params);

        for (var i = 0; i < this.notes.length; ++i) {
            note.beam_group = this.attrs;
        }
    }
}

class NoVexMeasure {
    constructor(params) {
        this.tuplets = [];
        this.beamGroups = [];
        this.notes = [];
        VF.Merge(this, params);
    }
    static get defaults() {
        return {
            timeSignature: '4/4',
            keySignature: "C",
            staffX: 10,
            staffY: 40,
            drawClef: true,
            staffWidth: 400,
            clef: 'treble',
            numBeats: 4,
            beatValue: 4,
            notes: [
                new NoVexNote({
                    clef: "treble",
                    keys: ["b/4"],
                    duration: "4"
                }),
                new NoVexNote({
                    clef: "treble",
                    keys: ["b/4"],
                    duration: "4"
                }),
                new NoVexNote({
                    clef: "treble",
                    keys: ["b/4"],
                    duration: "4"
                }),
                new NoVexNote({
                    clef: "treble",
                    keys: ["b/4"],
                    duration: "4"
                })
            ]
        };
    }
    getTupletForNote(note) {
        if (!vexMusic.isTuplet(note)) {
            return null;
        }
        for (var i = 0; i < this.tuplets.length; ++i) {
            var tuplet = this.tuplets[i];
            for (j = 0; i < tuplet.notes.length; ++i) {
                if (tuplet.notes[j].attrs.id === note.attrs.id) {
                    return tuplet;
                }
            }
            return null;
        }
    }
	getBeamGroupForNote(note) {
		for (var i=0;i<this.beamGroups.length;++i) {
			var bg = this.beamGroups[i];
			for (var j=0;j<bg.notes.length;++j) {
				if (bg.notes[j].attrs.id === note.attrs.id) {
					return bg;
				}
			}
		}
		return null;
	}
}
