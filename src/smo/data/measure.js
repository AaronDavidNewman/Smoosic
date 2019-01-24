

class SmoMeasure {
    constructor(params) {
        this.tuplets = [];
        this.beamGroups = [];
        this.attrs = {
            id: VF.Element.newID(),
            type: 'SmoMeasure'
        };
        Vex.Merge(this, SmoMeasure.defaults);
        Vex.Merge(this, params);
    }
    static get defaults() {
        return {
            timeSignature: '4/4',
            keySignature: "C",
            staffX: 10,
            customModifiers: [],
            staffY: 40,
			bars:[1,1],  // follows enumeration in VF.Barline
            drawClef: true,
			measureNumber:1,
            staffWidth: 400,
		    modifierOptions:{},
            clef: 'treble',
            numBeats: 4,
            beatValue: 4,
            notes: [
                new SmoNote({
                    clef: "treble",
                    keys: [{
                            key: 'b',
                            accidental: '',
                            octave: 4
                        }
                    ],
                    duration: "4"
                }),
                new SmoNote({
                    clef: "treble",
                    keys: [{
                            key: 'b',
                            accidental: '',
                            octave: 4
                        }
                    ],
                    duration: "4"
                }),
                new SmoNote({
                    clef: "treble",
                    keys: [{
                            key: 'b',
                            accidental: '',
                            octave: 4
                        }
                    ],
                    duration: "4"
                }),
                new SmoNote({
                    clef: "treble",
                    keys: [{
                            key: 'b',
                            accidental: '',
                            octave: 4
                        }
                    ],
                    duration: "4"
                })
            ]
        };
    }
	clearBeamGroups() {
		this.beamGroups=[];
	}

    clearAccidentals() {
        for (var i = 0; i < this.notes.length; ++i) {
            this.notes[i].accidentals = [];
        }
    }
	tupletIndex(tuplet) {
		for (var i=0;i<this.notes.length;++i) {
			if (this.notes[i]['tuplet'] && this.notes[i].tuplet.id===tuplet.attrs.id) {
				return i;
			}
		}
		return -1;
	}

	removeTupletForNote(note) {
		var tuplets=[];
		for (var i=0;i<this.tuplets.length;++i) {
			var tuplet = this.tuplets[i];
			if (note.tuplet.id !== tuplet.attrs.id) {
				tuplets.push(tuplet);
			}
		}
		this.tuplets=tuplets;
	}
    addCustomModifier(ctor, parameters) {
        this.customModifiers.push({
            ctor: ctor,
            parameters: parameters
        });
    }

    setMeasureNumber(num) {
        this.measureNumber=num;
    }
    getTupletForNote(note) {
        if (!vexMusic.isTuplet(note)) {
            return null;
        }
        for (var i = 0; i < this.tuplets.length; ++i) {
            var tuplet = this.tuplets[i];
            if (tuplet.attrs.id === note.tuplet.id) {
                return tuplet;
            }
            return null;
        }
    }
    getBeamGroupForNote(note) {
        for (var i = 0; i < this.beamGroups.length; ++i) {
            var bg = this.beamGroups[i];
            for (var j = 0; j < bg.notes.length; ++j) {
                if (bg.notes[j].attrs.id === note.attrs.id) {
                    return bg;
                }
            }
        }
        return null;
    }
}
