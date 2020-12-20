
VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

// ## smoTickIterator
// This file implements over the notes in a single measure.
// This is useful when redrawing the notes to transform them into something else.
// E.g. changing the duration of a note in a measure.  It keeps track of accidentals,
// ticks used etc.
// ### Usage:
// ``javascript``
// `var iterator=new smoTickIterator(measure)
// `iterator.iterate (actor)`
// where actor is a function that is called at each tick in the voice.
//
// ### iterator format:
//   iterator: {
//      notes:[note1,note2...],
//      delta: tick value of this note
//      totalDuration: ticks up until this point
//      note: current note,
//      index: running index
//
// ### Tickmap format
// `VX.TICKMAP(measure)`
// Iterate through all notes and creates information about the notes, like
// tuplet ticks, index-to-tick map.  The tickmap is useful for finding things out like how much
// time is left in a measure at a given note index (tickIndex).
//
//     tickmap = {
//        totalDuration: 16384,
//        accidentalMap:[{'F':'#','G':'b'},....
//        durationMap:[2048,4096,..],  // A running total
//        deltaMap:[2048,2048...], a map of deltas
//        tupletMap: {
//          noteId1:
//          {startIndex:1,endIndex:3,numNotes:3,startTick:4096,endTick:8196,durations:[1365,...],smallestDuration:2048}
//
//
// ## method documentation follows
// ---
class smoTickIterator {

    constructor(measure, options) {
        this.keySignature = measure.keySignature;

        Vex.Merge(this, options);
        this.voice = typeof(options['voice']) == 'number' ? options.voice : measure.activeVoice;
        if (measure.voices.length <= this.voice) {
          console.warn('tickmap for invalid voice');
          return;
        }
        this.notes = measure.voices[this.voice].notes;
        this.index = 0;
        this.startIndex = 0;
        this.endIndex = this.notes.length;

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
        this.deltaMap = [];

        this.tupletMap = {};
        this.accidentalMap = [];
        this.durationAccidentalMap={};

        this.hasRun = false;
        this.beattime = 4096;
    }

    // empty function for a default iterator (tickmap)
    static nullActor() {}

    // ### _getAccidentalsForKey
    // Update `map` with the correct accidental based on the key signature.
    static _getAccidentalsForKey(keySignature, map) {
        var music = new VF.Music();
        var keys = music.createScaleMap(keySignature);
        var keyKeys = Object.keys(keys);
        keyKeys.forEach((keyKey) => {
            var vexKey = keys[keyKey];
            if (vexKey.length > 1 && (vexKey[1] === 'b' || vexKey[1] === '#')) {
                var pitch = {
                    letter: vexKey[0],
                    accidental: vexKey[1]
                };
                map[vexKey[0]] = {
                    duration:0,
                    pitch:pitch
                }
            }
        });
    }

	// ### updateAccidentalMap
	// Keep a running tally of the accidentals for this voice
    // based on the key and previous accidentals.
    static updateAccidentalMap(note, iterator, keySignature, accidentalMap) {
        var sigObj = {};
        var newObj = {};
        if (iterator.index === 0) {
            smoTickIterator._getAccidentalsForKey(keySignature, newObj);
            sigObj = newObj;
        } else {
            sigObj = accidentalMap[iterator.index - 1];
        }
        for (var i = 0; i < note.pitches.length; ++i) {
            if (note.noteType != 'n') {
                continue;
            }
            var pitch = note.pitches[i];
            var letter = pitch.letter.toLowerCase();
            var sigLetter = letter + pitch.accidental;
            var sigKey = smoMusic.getKeySignatureKey(letter, keySignature);

            if (sigObj && sigObj[letter]) {
                var currentVal = sigObj[letter].key + sigObj[letter].accidental;
                if (sigLetter != currentVal) {
                    newObj[letter] = {pitch:pitch,duration:iterator.duration};
                }
            } else {
                if (sigLetter != sigKey) {
                    newObj[letter] = {pitch:pitch,duration:iterator.duration};
                }
            }
        }
        accidentalMap.push(newObj);
        // Mark the accidental with the start of this note.
        iterator.durationAccidentalMap[iterator.durationMap[iterator.index]] = newObj;
    }

	// ### getActiveAccidental
	// return the active accidental for the given note
    getActiveAccidental(pitch, iteratorIndex, keySignature) {
		var defaultAccidental = smoMusic.getKeySignatureKey(pitch.letter, keySignature);
		defaultAccidental = defaultAccidental.length > 1 ? defaultAccidental[1] : 'n';
        if (iteratorIndex === 0)
            return defaultAccidental;
        var accidental = pitch.accidental.length > 0 ? pitch.accidental : 'n';
		var letter = pitch.letter;

        // Back up the accidental map until we have a match, or until we run out
        for (var i = iteratorIndex; i > 0; --i) {
            var map = this.accidentalMap[i - 1];
            var mapKeys = Object.keys(map);
            for (var j = 0; j < mapKeys.length; ++j) {
                var mapKey = mapKeys[j];
                // The letter name + accidental in the map
                var mapLetter = map[mapKey];
                var mapAcc = mapLetter.accidental ? mapLetter.accidental : 'n';

                // if the letters match and the accidental...
                if (mapLetter.pitch.letter.toLowerCase() === letter) {
                    return mapAcc;
                }
            }
        }
        return defaultAccidental;
    }

    // ### _iterate
    // Internal callback for iterator.
    _iterate(actor) {
        this.state = 'RUNNING';
        for (this.index = this.startIndex; this.index < this.endIndex; ++this.index) {
            var note = this.notes[this.index];

            // save the starting point, tickwise
            this.durationMap.push(this.totalDuration);

            // the number of ticks for this note
            this.delta = (note.ticks.numerator / note.ticks.denominator) + note.ticks.remainder;
            this.deltaMap.push(this.delta);

            if (note['tuplet'] && note.tuplet['attrs']) {
                var normalizedTicks = VF.durationToTicks(note.duration);
                if (typeof(this.tupletMap[note.tuplet.attrs.id]) == 'undefined') {
                    this.tupletMap[note.tuplet.attrs.id] = {
                        startIndex: this.index,
                        tupletIndex: 0,
                        startTick: this.totalDuration,
                        smallestDuration: normalizedTicks,
                        num_notes: note.tuplet.num_notes,
                        durations: [this.delta]
                    };
                } else {
                    var entry = this.tupletMap[note.tuplet.attrs.id];

                    entry.endIndex = this.index;
                    entry.endTick = this.totalDuration + this.delta;
                    entry.smallestDuration = ((normalizedTicks < entry.smallestDuration) ? normalizedTicks : entry.smallestDuration);
                    entry.durations.push(this.delta);
                }
            }

            // update the tick count for the current range.
            this.duration += this.delta;

            // update the tick count for the whole array/measure
            this.totalDuration += this.delta;

            smoTickIterator.updateAccidentalMap(note, this, this.keySignature, this.accidentalMap);

            var rv = actor(this, note, this.accidentalMap);
            if (rv === false) {
                break;
            }
        }
        this.state = 'COMPLETE';
    }

    // ### iterate
    // Call `actor` for each iterator tick
    iterate(actor) {
        // todo add promise
        this._iterate(actor);
    }

    // ### getTickIndex
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
    // ### skipNext
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
