
class BeamModifierBase {
    constructor() {}
    beamNote(note, tickmap, accidentalMap) {}
}

class smoBeamerFactory {
    static applyBeams(measure) {
        for (var i = 0;i < measure.voices.length;++i) {
            var beamer = new smoBeamModifier(measure,i);
            var apply = new smoBeamerIterator(measure, beamer,i);
            apply.run();
        }
    }
}

class smoBeamerIterator {
    constructor(measure, actor,voice) {
        this.actor = actor;
        this.measure = measure;
        this.voice = voice;
    }

    //  ### run
    //  ###  Description:  start the iteration on this set of notes
    run() {
        var tickmap = this.measure.tickmapForVoice(this.voice);
        for (var i = 0;i < tickmap.durationMap.length;++i) {
            this.actor.beamNote(tickmap, i,this.measure.voices[this.voice].notes[i]);
        }
    }
}

class smoBeamModifier extends BeamModifierBase {
    constructor(measure,voice) {
        super();
        this.measure = measure;
        this._removeVoiceBeam(measure,voice);
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
    _removeVoiceBeam(measure,voice) {
        var beamGroups = [];
        measure.beamGroups.forEach((gr) => {
            if (gr.voice != voice) {
                beamGroups.push(gr);
            }
        });

        measure.beamGroups = beamGroups;
    }

    _completeGroup(voice) {
        // don't beam groups of 1
        if (this.currentGroup.length > 1) {
            this.measure.beamGroups.push(new SmoBeamGroup({
                    notes: this.currentGroup,
                    voice:voice
                }));
        }
    }

    _advanceGroup() {
        this.currentGroup = [];
        this.duration = 0;
    }

    // ### _isRemainingTicksBeamable
    // look ahead, and see if we need to beam the tuplet now or if we
    // can combine current beam with future notes.
    _isRemainingTicksBeamable(tickmap,index) {
      if (this.duration >= this.beamBeats) {
        return false;
      }
      var acc = this.duration;
      for (var i = index + 1;i < tickmap.deltaMap.length; ++i) {
        acc += tickmap.deltaMap[i]
        if (acc === this.beamBeats) {
          return true;
        }
        if (acc > this.beamBeats) {
          return false;
        }
      }
      return false;
    }
    beamNote(tickmap, index, note, accidentalMap) {
        this.beamBeats = note.beamBeats;

        this.duration += tickmap.deltaMap[index];

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
            if (ult.attrs.id === note.attrs.id && !this._isRemainingTicksBeamable(tickmap,index)) {
                this._completeGroup(tickmap.voice);
                this._advanceGroup();
            }
            return note;
        }

        // don't beam > 1/4 note in 4/4 time
        if (tickmap.deltaMap[index] >= 4096) {
			this._completeGroup(tickmap.voice);
            this._advanceGroup();
            return note;
        }

        this.currentGroup.push(note);
        if (note.endBeam) {
            this._completeGroup(tickmap.voice);
            this._advanceGroup();
        }

        if (this.duration == this.beamBeats) {
            this._completeGroup(tickmap.voice);
            this._advanceGroup();
            return note;
        }

        // If this does not align on a beat, don't beam it
        if (this.duration > this.beamBeats) {
            this._advanceGroup()
            return note;
        }
    }
}
