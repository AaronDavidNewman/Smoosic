
class BeamModifierBase {
	constructor(){}
	beamNote(note, iterator,accidentalMap) {	}
}

class smoBeamerFactory {	
	static applyBeams(measure) {		
        var beamer = new smoBeamModifier(measure);
        var apply = new smoBeamerIterator(measure, [beamer]);
        apply.run();
	}
}

class smoBeamerIterator {
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
				self.actors[i].beamNote(iterator,note,accidentalMap);
			}
		});
	}
}

class smoBeamModifier extends BeamModifierBase {
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

    beamNote(iterator, note, accidentalMap) {

        this.duration += iterator.delta;

        // beam tuplets
        if (note.isTuplet()) {
            var tuplet = this.measure.getTupletForNote(note);
            var ult = tuplet.notes[tuplet.notes.length - 1];

            // is this beamable
            if (note.tickCount < 4096) {
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
