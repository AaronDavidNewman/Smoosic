

class SmoMeasure {
    constructor(params) {
        this.tuplets = [];
        this.beamGroups = [];
        
        Vex.Merge(this, SmoMeasure.defaults);
        Vex.Merge(this, params);
		if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoMeasure'
            };
        } else {
			console.log('inherit attrs');
		}
    }
    get notes() {
        return this.voices[this.activeVoice].notes;
    }
    set notes(val) {
        this.voices[this.activeVoice].notes = val;
    }
    get stemDirection() {
        return this.activeVoice % 2 ? -1 : 1;
    }
    static deserialize(jsonString) {
        var jsonObj = JSON.parse(jsonString);
        var voices = [];
        for (var j = 0; j < jsonObj.voices.length; ++j) {
            var voice = jsonObj.voices[j];
            var notes = [];
            voices.push({
                notes: notes
            });
            for (var i = 0; i < voice.notes.length; ++i) {
                var noteParams = voice.notes[i];
                var smoNote = new SmoNote(noteParams);
                notes.push(smoNote);
            }
        }

        var tuplets = [];
        for (j = 0; j < jsonObj.tuplets.length; ++j) {
            var tuplet = new SmoTuplet(jsonObj.tuplets[j]);
            tuplets.push(tuplet);
        }

        var beamGroups = [];
        for (j = 0; j < jsonObj.beamGroups.length; ++j) {
            var smoBeam = new SmoBeamGroup(jsonObj.beamGroups[j]);
            beamGroups.push(smoBeam);
        }

        var attrs = [
            'timeSignature', 'keySignature', 'staffX', 'staffY', 'customModifiers',
            'drawClef', 'measureNumber', 'staffWidth', 'modifierOptions', 'beatValue',
            'activeVoice'];
        var params = {
            voices: voices,
            tuplets: tuplets,
            beamGroups: beamGroups
        };
		
		vexMusic.filteredMerge(attrs,jsonObj,params);

        return new SmoMeasure(params);
    }

    static get defaultVoice44() {
        return [
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
        ];
    }
    static get defaults() {
        var noteDefault = SmoMeasure.defaultVoice44;
        return {
            timeSignature: '4/4',
            keySignature: "C",
            staffX: 10,
            customModifiers: [],
            staffY: 40,
            bars: [1, 1], // follows enumeration in VF.Barline
            drawClef: true,
            measureNumber: {
                localIndex: 0,
                systemIndex: 0,
                measureNumber: 0
            },
            staffWidth: 400,
            modifierOptions: {},
            clef: 'treble',
            numBeats: 4,
            forceClef: false,
            beatValue: 4,
            voices: [{
                    notes: noteDefault
                }
            ],
            activeVoice: 0
        };
    }
    tickmap() {
        return VX.TICKMAP(this);
    }
    clearBeamGroups() {
        this.beamGroups = [];
    }

    clearAccidentals() {
        for (var j = 0; j < this.voices.length; ++j) {
            var notes = this.voices[j].notes;
            for (var i = 0; i < notes.length; ++i) {
                notes[i].accidentals = [];
            }
        }
    }
    tupletIndex(tuplet) {
        for (var j = 0; j < this.voices.length; ++j) {
            var notes = this.voices[j].notes;
            for (var i = 0; i < notes.length; ++i) {
                if (notes[i]['tuplet'] && notes[i].tuplet.id === tuplet.attrs.id) {
                    return i;
                }
            }
        }
        return -1;
    }

    removeTupletForNote(note) {
        var tuplets = [];
        for (var i = 0; i < this.tuplets.length; ++i) {
            var tuplet = this.tuplets[i];
            if (note.tuplet.id !== tuplet.attrs.id) {
                tuplets.push(tuplet);
            }
        }
        this.tuplets = tuplets;
    }
    addCustomModifier(ctor, parameters) {
        this.customModifiers.push({
            ctor: ctor,
            parameters: parameters
        });
    }

    setMeasureNumber(num) {
        this.measureNumber = num;
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
