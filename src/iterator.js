
VF = Vex.Flow;
Vex.Xform = (typeof (Vex.Xform)=='undefined' ? {} : Vex.Xform);
VX = Vex.Xform;

/** General purpose iterator through an array of notes that have 
been drawn and hence have tickable and geometry information.  Used to 
transform notes, e.g. change duration, pitch etc.
**/
class noteIterator {
    constructor(notes, voice) {
        this.index = 0;
        this.startIndex = 0;
        this.endIndex = notes.length;
        var states = ['CREATED', 'RUNNING', 'COMPLETE'];
        this.state = 'CREATED';

        // ticks as we iterate.  
        // duration is duration of the current range
        this.duration = 0;
        // duration is the accumulated duraition over all the notes
        this.totalDuration = 0;
        // delta is the tick contribution of this note
        this.delta = 0;
        // the tick start location of notes[x]
        this.durationMap = [];

        this.tupletMap = {};

        this.hasRun = false;

        this.noteSlice = notes;
        this.notes = notes;
        this.beattime = 4096;
        if (voice)
            this.beattime = voice.time.resolution / voice.time.beat_value;

    }

    static nullActor() { }
    /*slice() {
      return this.notes.slice(this.startRange, this.endRange);
    }  */
    _iterate(actor) {
        this.state = 'RUNNING';
        for (this.index = this.startIndex; this.index < this.endIndex; ++this.index) {
            var note = this.notes[this.index];

            // save the starting point, tickwise
            this.durationMap.push(this.totalDuration);

            // the number of ticks for this note
            this.delta = (note.ticks.numerator / note.ticks.denominator);

            if (note.tupletStack.length) {
                var normalizedTicks = VF.durationToTicks(note.duration);
                if (typeof (this.tupletMap[note.tuplet.attrs.id]) == 'undefined') {
                    this.tupletMap[note.tuplet.attrs.id] = {
                        startIndex: this.index,
                        startTick: this.totalDuration,
                        smallestDuration: normalizedTicks
                    };
                } else {
                    var entry = this.tupletMap[note.tuplet.attrs.id];

                    entry.endIndex = this.index;
                    entry.endTick = this.totalDuration + this.delta;
                    entry.smallestDuration = ((normalizedTicks < entry.smallestDuration) ? normalizedTicks : entry.smallestDuration)
                }
            }

            // update the tick count for the current range.
            this.duration += this.delta;

            // update the tick count for the whole array/measure
            this.totalDuration += this.delta;

            var rv = actor(this, this.notes, note);
            if (rv === false) {
                break;
            }
        }
        this.state = 'COMPLETE';
        console.log(JSON.stringify(this.tupletMap), null, ' ');
    }
    iterate(actor) {
        // todo add promise
        this._iterate(actor);
    }
    /* get the index into notes array that takes up
      duration of ticks */
    getTickIndex(index, duration) {
        if (index == 0)
            return 0;
        var initial = this.durationMap[index];
        var delta = 0;
        while (index < this.notes.length && delta < duration) {
            index += 1;
            delta += this.durationMap[index] - this.durationMap[index - 1];
        }
        return index;
    }
    /* Skip the next set of n notes, and return the notes in an array */
    skipNext(skipCount) {
        var rv = [];
        var startRange = this.index;
        // var tuplen = note.tupletStack[0].notes.length;
        var endRange = this.index + skipCount;
        rv = this.notes.slice(startRange, endRange);
        this.index = endRange;
        // this.startRange = this.index;
        return rv;
    }
    skip(offset) {
        if (!offset)
            offset = 1;
        this.index += offset;
    }
}

/* iterate over a set of notes, calling actor for each tick */

VX.ITERATE = function (actor, notes, voice) {
    var iterator = new noteIterator(notes, voice);
    iterator.iterate(actor);
    return iterator;
}

/* iteratoe over a set of notes, creating a map of notes to ticks */
VX.TICKMAP = function (notes) {
    return VX.ITERATE(noteIterator.nullActor, notes);
}
