
class BeamModifierBase {
    constructor() {}
    beamNote(note, iterator, accidentalMap) {}
}

class smoBeamerFactory {
    static applyBeams(measure) {
        var beamer = new smoBeamModifier(measure);
        var apply = new smoBeamerIterator(measure, [beamer]);
        apply.run();
    }
}

class smoBeamerIterator {
    constructor(measure, actors) {
        this.actors = actors;
        this.measure = measure;
    }

    get iterator() {
        return this._iterator;
    }

    //  ### run
    //  ###  Description:  start the iteration on this set of notes
    run() {
        var self = this;
        var iterator = new smoTickIterator(this.measure);
        iterator.iterate((iterator, note, accidentalMap) => {
            for (var i = 0; i < self.actors.length; ++i) {
                self.actors[i].beamNote(iterator, note, accidentalMap);
            }
        });
    }
}

class smoBeamModifier extends BeamModifierBase {
    constructor(measure) {
        super();
        this.measure = measure;
        this.measure.beamGroups = [];
        this.duration = 0;
        this.timeSignature = measure.timeSignature;
        this.meterNumbers = this.timeSignature.split('/').map(number => parseInt(number, 10));

        this.duration = 0;
        // beam on 1/4 notes in most meter, triple time dotted quarter
        this.beamBeats = 2 * 2048;
        if (this.meterNumbers[0] % 3 == 0) {
            this.beamBeats = 3 * 2048;
        }
        this.skipNext = 0;
        this.currentGroup = [];
    }

    get beamGroups() {
        return this.measure.beamGroups;
    }

    _completeGroup() {
        // don't beam groups of 1
        if (this.currentGroup.length > 1) {
            this.measure.beamGroups.push(new SmoBeamGroup({
                    notes: this.currentGroup
                }));
        }
    }

    _advanceGroup() {
        this.currentGroup = [];
        this.duration = 0;
    }
    beamNote(iterator, note, accidentalMap) {

        this.duration += iterator.delta;

        // beam tuplets
        if (note.isTuplet) {
            var tuplet = this.measure.getTupletForNote(note);
            var ult = tuplet.notes[tuplet.notes.length - 1];
            var first = tuplet.notes[0];

            if (first.endBeam) {
                this._advanceGroup();
                return note;
            }

            // is this beamable length-wise
            var vexDuration = smoMusic.closestVexDuration(note.tickCount);
            var stemTicks = VF.durationToTicks.durations[vexDuration];
            if (stemTicks < 4096) {
                this.currentGroup.push(note);
            }
            // Ultimate note in tuplet
            if (ult.attrs.id === note.attrs.id) {
                this._completeGroup();
                this._advanceGroup();
            }
            return note;
        }

        // don't beam > 1/4 note in 4/4 time
        if (iterator.delta >= this.beamBeats) {
			this._completeGroup();
            this._advanceGroup();
            return note;
        }

        this.currentGroup.push(note);
        if (note.endBeam) {
            this._completeGroup();
            this._advanceGroup();
        }

        if (this.duration == this.beamBeats) {
            this._completeGroup();
            this._advanceGroup();
            return note;
        }

        // If this does not align on a beat, don't beam it
        if (this.duration > this.beamBeats) {
			// ||            ((iterator.totalDuration - this.duration) % this.beamBeats != 0)) {
            this._advanceGroup()
            return note;
        }
    }
}
