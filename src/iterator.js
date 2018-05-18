
VF = Vex.Flow;
Vex.Xform = (typeof (Vex.Xform)=='undefined' ? {} : Vex.Xform);
VX = Vex.Xform;

// ## Description
// This file implements an iterator through a set of notes.  This is useful when
// redrawing the notes to transform them into something else.   E.g. changing the 
// pitch of one note.
//
// ## Usage:
// VX.ITERATE (actor, notes)
// where actor is a function that is called at each tick in the voice.
// 
// VX.TICKMAP(notes)
// that iterates through all notes and creates information about the notes, like the 
// tuplet ticks, index-to-tick map.
class tickIterator {
    constructor(notes, options) {
        this.index = 0;
        this.startIndex = 0;
        this.endIndex = notes.length;

        Vex.Merge(this,options);

        // so a client can tell if the iterator's been run or not
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
        if (this.voice)
            this.beattime = this.voice.time.resolution / this.voice.time.num_beats;

    }

    // ## Description:
    // empty function for a default iterator (tickmap)
    static nullActor() { }

    // ## todo: is promise useful here?
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
    }
    iterate(actor) {
        // todo add promise
        this._iterate(actor);
    }
    
    // ## getTickIndex
    // get the index into notes array that takes up
    // duration of ticks */
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
    // ## skipNext
    // ## Description:
    // skip some number of notes in the iteration, because we want to skip over them.
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
}

/* iterate over a set of notes, calling actor for each tick */
VX.ITERATE= (actor, notes, options) => {
    var iterator = new tickIterator(notes, options);
    iterator.iterate(actor);
    return iterator;
}

/* iteratoe over a set of notes, creating a map of notes to ticks */
VX.TICKMAP = (notes,options) => {
    return VX.ITERATE(tickIterator.nullActor, notes,options);
}

class PitchIterator {
    constructor(note, keySignature) {
        this.note=note;
        this.keySignature = keySignature;
        this.pitchMap = [];
        var canon = VF.Music.canonical_notes;
        var km = new VF.KeyManager(keySignature);
        for (var i = 0; i < note.keyProps; ++i) {
            var inkey = true;
            var prop = note.keyProps[i];
            var imap = canon.indexOf(prop.key);
            if (km.scale.indexOf(imap) < 0) {
                inkey = false;
            }
            var letter = prop.key[0].toLowerCase();
            var keyAccidental = (prop.accidental ? prop.accidental : 'n');
            var modifier = this.getAccidentalIndex(i);
            var courtesy = false;
            var renderAccidental = null;
            if (modifier) {
                courtesy = modifier.setCautionary;
                renderAccidental = modifier.type;
            }
            pitchMap.push({
                inkey: inkey,
                letter: letter,
                keyAccidental: keyAccidental,
                courtesy: courtesy,
                renderAccidental: renderAccidental
            });
        }
    }
    hasCourtesy() {
        return this.pitchMap.every((pm) => { return pm.courtesy == true; })
    }
    getAccidentalIndex(ix) {
        var accidentals = this.note.getAccidentals();
        if (accidentals) {
            for (var i = 0; i < accidentals.length; ++i) {
                if (accidentals[i].index == ix) {
                    return accidentals[i];
                }
            }
        }
        return null;
    }
}