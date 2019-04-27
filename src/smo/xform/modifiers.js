
class NoteModifierBase {
	constructor(){}
	modifyNote(note, iterator,accidentalMap) {	}
}

class smoModifierFactory {
    static getStandardModifiers(measure) {
        var actors = [];
        var cautionary = measure.options && measure.options['cautionary'] ? measure.options['cautionary'] : {measure:0,voice:0,tick:0,pitches:[]};
        actors.push(new smoDotModifier());
        actors.push(new smoAccidentalModifier({
                keySignature: measure.keySignature,
                cautionarySelections: cautionary
            }));
        actors.push(new smoBeamModifier(measure));
        return actors;
	}
	
	static applyModifiers(measure) {
		var modifierOptions = measure.modifierOptions;
		var modifiers = smoModifierFactory.getStandardModifiers(measure);
        for (var i = 0; i < measure.customModifiers.length; ++i) {
            var modifier = measure.customModifiers[i];
            var ctor = eval(modifier.ctor);
            var instance = new ctor(modifier.parameters);
            modifiers.push(instance);
        }
		
        var apply = new smoModifierIterator(measure, modifiers);
        apply.run();
	}
}

class smoModifierIterator {
	constructor(measure,actors) {
		this.actors=actors;
		this.measure=measure;		
	}
	
	get iterator() {
		return this._iterator;
	}
	
	//  ### run
	//  ###  Description:  start the iteration on this set of notes
	run() {
		var self=this;
		var iterator = new smoTickIterator(this.measure);
		iterator.iterate((iterator,note,accidentalMap) => {
			for (var i=0;i<self.actors.length;++i) {
				self.actors[i].modifyNote(iterator,note,accidentalMap);
			}
		});
	}
}

class smoDotModifier extends NoteModifierBase {
    constructor() {
        super();
    }
    static Create() {
        return new smoDotModifier();
    }
    modifyNote(iterator, note, accidentalMap) {
        if (vexMusic.isTuplet(note)) {
            return note;
        }
        var vexDuration = vexMusic.ticksToDuration[note.tickCount];
        var dots = vexDuration.split('d').length-1;
        note.addDots(dots);
        return note;
    }
}

class smoAccidentalModifier extends NoteModifierBase {
    constructor(parameters) {
        super();
        this.keySignature = parameters.keySignature;
        this.keyManager = new VF.KeyManager(this.keySignature);
        this.cautionary = parameters.cautionarySelections ? parameters.cautionarySelections : {measure:0,voice:0,tick:0,pitches:[]};
    }

    modifyNote(iterator, note, accidentalMap) {
        var canon = VF.Music.canonical_notes;
		canon.forEach((cc)=>{if (cc.length == 1) cc=cc+'n';});
        for (var i = 0; i < note.keys.length; ++i) {
            var prop = note.keys[i];
			var vexKey=prop.key+prop.accidental;
			if (vexKey.length>1 && vexKey[1] == 'n') {
				vexKey=vexKey[0];
			}
            var accidental = (this.keyManager.scale.indexOf(canon.indexOf(vexKey)) < 0);
            accidental = accidental && !smoTickIterator.hasActiveAccidental(prop, iterator.index, accidentalMap);
			var cautionary = this.cautionary.pitches.indexOf(i) >= 0;
            // {index:1,value:{symbol:'#',cautionary:false}}

            if (accidental || cautionary) {
				// if cautionary natural
				prop.accidental = (prop.accidental) ? prop.accidental : 'n';
                note.addAccidental({
                    index: i,
                    value: {
                        symbol: prop.accidental,
                        cautionary: cautionary
                    }
                });
            }
        }
        return note;
    }
}

class smoBeamModifier extends NoteModifierBase {
    constructor(measure) {
        super();
		this.measure=measure;
		this.measure.beamGroups=[];
        this.duration = 0;
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
        return this.measure.beamGroups;
    }

    modifyNote(iterator, note, accidentalMap) {

        this.duration += iterator.delta;

        // beam tuplets
        if (vexMusic.isTuplet(note)) {
            //todo: when does stack have more than 1?
            var tuplet = this.measure.getTupletForNote(note);
            var ult = tuplet.notes[tuplet.notes.length - 1];
            // is this beamable
            if (vexMusic.durationToTicks(note.duration) < 4096) {
                this.beamGroup = true;
                this.currentGroup.push(note);
            }
            // Ultimate note in tuplet
            if (ult.attrs.id === note.attrs.id) {
				// don't beam groups of 1
				if (this.currentGroup.length>1) {
					this.measure.beamGroups.push(new SmoBeamGroup({
							notes: this.currentGroup
						}));
				}
                this.currentGroup = [];
                this.duration = 0;
                this.startRange = iterator.index + 1;
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
            this.measure.beamGroups.push(new SmoBeamGroup({
                    notes: this.currentGroup
                }));
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
