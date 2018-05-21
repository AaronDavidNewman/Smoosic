
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

class vexMusic {
    // ### getKeyOffset
    // ### description:  given a vex noteProp and an offset, offset that number
    // of 1/2 steps.
    static getKeyOffset(prop,offset) {
        var canon = VF.Music.canonical_notes;
        var key = prop.key.toLowerCase();
        var index = (canon.indexOf(key) + canon.length+offset) % canon.length;
        var octave = prop.octave;
        if (Math.abs(offset) >= 12) {
            offset = Math.sign(offset) * Math.round(Math.abs(offset) / 12);
            octave += offset;
        }
        if (canon[index] == 'b' && offset==-1) {
            octave += -1;
        }
        if (canon[index] == 'c' && offset==1) {
            octave += 1;
        }
        return canon[index] + '/' + octave;
    }

    // ### getKeySignatureKey
    // ### Description:
    // given a letter pitch (a,b,c etc.), and a key signature, return the actual note. 
    // 
    // ### Usage:
    //   vexMusic.getKeySignatureKey('F','G'); // returns f# 
    static getKeySignatureKey(letter, keySignature) {
        var km = new VF.KeyManager(keySignature);
        return km.scaleMap[letter];
    }

    static get ticksToDuration  () {
        var durations = ["1/2", "1", "2", "4", "8", "16", "32", "64", "128", "256"];
        var ticksToDuration = {};
        var _ticksToDurations = function () {
            for (var i = 0; i < durations.length - 1; ++i) {
                var dots = '';
                var ticks = 0;
                for (var j = 0; j < 4 && j + i < durations.length; ++j) {
                    ticks += VF.durationToTicks.durations[durations[i + j]];
                    ticksToDuration[ticks.toString()] = durations[i] + dots;
                    dots += 'd'
                }
            }
            return ticksToDuration
        }
        _ticksToDurations();
        return ticksToDuration;
    };

    static ticksFromNote(note) {
        return note.ticks.numerator / note.ticks.denominator;
    }
    static get enharmonics() {
        var rv = {};
        var keys = Object.keys(VF.Music.noteValues);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            var int_val = VF.Music.noteValues[key].int_val;
            if (typeof (rv[int_val.toString()]) == 'undefined') {
                rv[int_val.toString()] = [];
            }
            // only consider natural note 1 time.  It is in the list twice for some reason.
            if (key.indexOf('n') == -1) {
                rv[int_val.toString()].push(key);
            }
        }
        return rv;
    }

    // ### getEnharmonic(noteProp)
    // ###   cycle through the enharmonics for a note.
    static getEnharmonic(noteProp) {
        var key = noteProp.key.toLowerCase();
        var intVal= VF.Music.noteValues[key].int_val;
        var ar = vexMusic.enharmonics[intVal.toString()];
        var len = ar.length;
        var ix = ar.indexOf(key);
        key = ar[(ix + 1) % len];
        return (key + '/' + noteProp.octave);
    }
}

class PitchIterator {
    constructor(note, keySignature, actor) {
        this.note = note;
        this.keySignature = keySignature;
        this.pitchMap = [];
    }
    iterate(actor) {
        if (!actor) {
            actor = PitchIterator.nullActor;
        }
        var canon = VF.Music.canonical_notes;
        var note = this.note;
        var km = new VF.KeyManager(this.keySignature);
        for (var i = 0; i < note.keyProps.length; ++i) {
            var inkey = true;
            var prop = note.keyProps[i];
            var imap = canon.indexOf(prop.key.toLowerCase());
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
            var mapData = {
                inkey: inkey,
                letter: letter,
                keyAccidental: keyAccidental,
                courtesy: courtesy,
                renderAccidental: renderAccidental
            };
            this.pitchMap.push(mapData);
            actor(this,i,mapData)
        }
    }
    static get nullActor() {}

  

    hasCourtesy() {
        return this.pitchMap.every((pm) => { return pm.courtesy == true; })
    }
    getAccidentalIndex(ix) {
        // this seems a little hacky to me.  getAccidentals is so fragile.
        if (!this.note.modifierContext) {
            return null;
        }
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

VX.PITCHMAP = (note, keySignature) => {
    var rv= new PitchIterator(note, keySignature);
    rv.iterate();
    return rv;
}
VX.PITCHITERATE = (note, keySignature, actor) => {
    var rv= new PitchIterator(note, keySignature);
    rv.iterate(actor);
};