VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

// this file contains utilities that change the duration of notes in a measure.

// ## SmoTickTransformer
//  Base class for duration transformations.  I call them transformations because this can
//  create and delete notes, as opposed to modifiers which act on existing notes.
class SmoTickTransformer {
    constructor(measure, actors, options) {
        this.notes = measure.notes;
        this.measure = measure;
        this.vxNotes = [];
        this.actors = actors ? actors : [];
        this.keySignature = 'C';
        this.accidentalMap = [];
        Vex.Merge(this, options);
    }
    static nullActor(note) {
        return note;
    }
	// ## applyTransform
	// create a transform with the given actors and run it against the supplied measure
	static applyTransform(measure,actors) {
		var actAr = (Array.isArray(actors)) ? actors : [actors];
    	measure.clearAccidentals();
		measure.clearBeamGroups();
        var transformer = new SmoTickTransformer(measure, actAr);
        transformer.run();
        measure.notes = transformer.notes;
	}
    // ## transformNote
    // call the actors for each note, and put the result in the note array.
    // The note from the original array is copied and sent to each actor.
    //
    // Because the resulting array can have a different number of notes than the existing
    // array, the actors communicate with the transformer in the following, jquery-ish
    // but somewhat unintuitive way:
    //
    // 1. if the actor returns null, the next actor is called and the results of that actor are used
    // 2. if all the actors return null, the copy is used.
    // 3. if a note object is returned, that is used for the current tick and no more actors are called.
    // 4. if an array of notes is returned, it is concatenated to the existing note array and no more actors are called.
    //     Note that *return note;* and *return [note];* produce the same result.
    // 5. if an empty array [] is returned, that copy is not added to the result.  The note is effectively deleted.
    transformTick(iterator, note) {
        var self = this;
       
        for (var i = 0; i < this.actors.length; ++i) {
			var actor=this.actors[i];
            var newNote = actor.transformTick(note, iterator, iterator.accidentalMap);
            if (newNote == null) {
				this.vxNotes.push(note); // no change
                continue;
            }
            if (Array.isArray(newNote)) {
                if (newNote.length === 0) {
                    return;
                }
                this.vxNotes = this.vxNotes.concat(newNote);
                return;
            }
            this.vxNotes.push(newNote);
            return;
        }
    }

    run() {
        var self = this;
        var iterator = new smoTickIterator(this.measure);
        iterator.iterate((iterator, note, accidentalMap) => {
            self.transformTick(iterator, note, accidentalMap);
        });

        this.notes = this.vxNotes;
        return this.vxNotes;
    }
}

// ## A note transformer is just a function that modifies a note in some way.
// Any number of transformers can be applied to a note.
class TickTransformBase {
    constructor() {}
    transformTick(note, iterator, accidentalMap) {
        return note;
    }
}
// ## VxContractActor
// Contract the duration of a note, filling in the space with another note
// or rest.
//
class SmoContractNoteActor extends TickTransformBase {
    constructor(params) {
        super();
        Vex.Merge(this, params);
    }
    transformTick(note, iterator, accidentalMap) {
        if (iterator.index == this.startIndex) {
            var notes = [];
            var noteCount = Math.floor(note.ticks.numerator / this.newTicks);
            var notes = [];
			var remainder = note.ticks.numerator;
            /**
             *  Replace 1 note with noteCOunt notes of newTIcks duration
             *      old map:
             *     d  .  d  .  .
             *     new map:
             *     d  d  d  .  .
             */
            for (var i = 0; i < noteCount; ++i) {
                notes.push(new SmoNote({
                        clef: note.clef,
                        pitches: JSON.parse(JSON.stringify(note.pitches)),
                        ticks: {numerator:this.newTicks,denominator:1,remainder:0}
                    }));
				remainder = remainder - this.newTicks;
            }
			
			if (remainder > 0) {
				notes.push(new SmoNote({
                        clef: note.clef,
                        pitches: JSON.parse(JSON.stringify(note.pitches)),
                        ticks: {numerator:remainder,denominator:1,remainder:0}
                    }));
			}
            return notes;
        }

        return null;
    }
}

// ## VxStretchTupletActor
// Stretch a note in a tuplet, removing or shortening other notes in the tuplet
// ## Parameters:
//   {changeIndex:changeIndex, multiplier:multiplier,measure:measure}
//
class SmoStretchTupletActor extends TickTransformBase {
    constructor(params) {
        super();
        Vex.Merge(this, params);
        this.tuplet = this.measure.getTupletForNote(this.measure.notes[this.changeIndex]);
        this.oldLength = this.tuplet.notes.length;
        this.tupletIndex = this.measure.tupletIndex(this.tuplet);

        this.tuplet.combine(this.startIndex, this.endIndex);
        this.durationMap = this.tuplet.durationMap;
    }
    transformTick(note, iterator, accidentalMap) {

        /*
        ## Strategy:
        Before A, after C, leave alone
        At A, send all notes of the tuplet
        Between A+1 and C, return empty array for removed note

        5
        ---------
        | | | | |
        n n n n n
        A | B | C
         */

        if (iterator.index < this.tupletIndex)
            return note;
        if (iterator.index >= this.tupletIndex + this.oldLength)
            return note;
        if (iterator.index === this.tupletIndex) {
            return this.tuplet.notes;
        }
        return [];

    }

}

// ## VxContractActor
// Contract the duration of a note in a tuplet by duplicate
// notes of fractional length
//
class SmoContractTupletActor extends TickTransformBase {
    constructor(params) {
        super();
        Vex.Merge(this, params);
        this.tuplet = this.measure.getTupletForNote(this.measure.notes[this.changeIndex]);
        this.oldLength = this.tuplet.notes.length;
        this.tupletIndex = this.measure.tupletIndex(this.tuplet);
        this.splitIndex = this.changeIndex - this.tupletIndex;
        this.tuplet.split(this.splitIndex);
    }
    transformTick(note, iterator, accidentalMap) {
        if (iterator.index < this.tupletIndex)
            return note;
        if (iterator.index >= this.tupletIndex + this.oldLength)
            return note;
        if (iterator.index == this.changeIndex) {
            return this.tuplet.notes;
        }
        return [];
    }
}

// ## VxUnmakeTupletActor
// Turn a tuplet into a non-tuplet of the same length
// ## Parameters:
// startIndex: start index of tuplet
// endIndex: end index of tuplet
// measure: Smo measure that the tuplet is contained in.
class SmoUnmakeTupletActor extends TickTransformBase {
    constructor(parameters) {
        super();
        Vex.Merge(this, parameters);
    }
    transformTick(note, iterator, accidentalMap) {
        if (iterator.index < this.startIndex || iterator.index > this.endIndex) {
            return null;
        }
        if (iterator.index == this.startIndex) {
            var tuplet = this.measure.getTupletForNote(note);
            var ticks = tuplet.totalTicks;
            var nn = SmoNote.cloneWithDuration(note, {numerator:ticks,denominator:1,remainder:0});
            nn.tuplet = {};
            this.measure.removeTupletForNote(note);
            return [nn];
        }
        return [];
    }
}

// ## VxUnmakeTupletActor
// Turn a tuplet into a non-tuplet of the same length
// parameters:
//  {tickmap:tickmap,ticks:ticks,
class SmoMakeTupletActor extends TickTransformBase {
    constructor(params) {
        super();
        Vex.Merge(this, params);
        this.durationMap = [];
        var sum = 0.0; // 819.2
        for (var i = 0; i < this.numNotes; ++i) {
            this.durationMap.push(1.0);
            sum += 1.0;
        }
        var stemValue = this.totalTicks / this.numNotes;
        var stemTicks = 8192;

        // The stem value is the type on the non-tuplet note, e.g. 1/8 note
        // for a triplet.
        while (stemValue < stemTicks) {
            stemTicks = stemTicks / 2;
        }

        this.stemTicks = stemTicks * 2;
        this.rangeToSkip = this._rangeToSkip();

        // special case - is this right?  this is needed for tuplets in 6/8
        if (this.rangeToSkip[1] > this.rangeToSkip[0]) {
            this.stemTicks = stemTicks;
        } else {
            this.stemTicks = stemTicks * 2;
        }

        this.vexDuration = smoMusic.ticksToDuration[this.stemTicks];
        this.tuplet = [];
        // skip notes in the original array if we are taking up
        // multiple notes

    }
    _rangeToSkip() {
        var ticks = this.measure.tickmap();
        var accum = 0;
        var rv = [];
        rv.push(this.index);
        for (var i = 0; i < ticks.deltaMap.length; ++i) {
            if (i >= this.index) {
                accum += ticks.deltaMap[i];
            }
            if (accum >= this.totalTicks) {
                rv.push(i);
                break;
            }
        }
        return rv;
    }
    transformTick(note, iterator, accidentalMap) {
        // if our tuplet replaces this note, make sure we make it go away.
        if (iterator.index > this.index && iterator.index <= this.rangeToSkip[1]) {
            return [];
        }
        if (iterator.index != this.index) {
            return null;
        }
        for (var i = 0; i < this.numNotes; ++i) {
            note = SmoNote.cloneWithDuration(note, {numerator:this.stemTicks,denominator:1,remainder:0});
			
			// Don't clone modifiers, except for first one.
			note.textModifiers = i===0 ? note.textModifiers : [];

            this.tuplet.push(note);
        }
        var tuplet = new SmoTuplet({
                notes: this.tuplet,
                stemTicks: this.stemTicks,
                totalTicks: this.totalTicks,
                ratioed: false,
                bracketed: true,
                startIndex: iterator.index,
                durationMap: this.durationMap,
                location: 1
            });
        this.measure.tuplets.push(tuplet);
        return this.tuplet;
    }
}

class SmoStretchNoteActor extends TickTransformBase {
    constructor(parameters) {
        super();
        Vex.Merge(this, parameters);
        this.startTick = this.tickmap.durationMap[this.startIndex];

        var endTick = this.tickmap.durationMap[this.startIndex] + this.newTicks;
        this.divisor = -1;
        this.durationMap = [];
        this.skipFromStart = this.startIndex + 1;
        this.skipFromEnd = this.startIndex + 1;
        this.durationMap.push(this.newTicks);

        var mapIx = this.tickmap.durationMap.indexOf(endTick);

        var remaining = this.tickmap.deltaMap.slice(this.startIndex, this.tickmap.durationMap.length).reduce((accum, x) => x + accum);
        if (remaining === this.newTicks) {
            mapIx = this.tickmap.deltaMap.length;
        }

        // If there is no tickable at the end point, try to split the next note
        /**
         *      old map:
         *     d  . d  .
         *     split map:
         *     d  .  d  d
         *     new map:
         *     d .   .  d
         */
        if (mapIx < 0) {
            var npos = this.tickmap.durationMap[this.startIndex + 1];
            var ndelta = this.tickmap.deltaMap[this.startIndex + 1];
            if (ndelta / 2 + this.startTick + this.newTicks <= this.tickmap.totalDuration) {
                this.durationMap.push(ndelta / 2);
            } else {
                // there is no way to do this...
                this.durationMap = [];

            }
        } else {
            // If this note now takes up the space of other notes, remove those notes
            for (var i = this.startIndex + 1; i < mapIx; ++i) {
                this.durationMap.push(0);
            }
        }
    }
    transformTick(note, iterator, accidentalMap) {
        if (this.durationMap.length == 0) {
            return null;
        }
        if (iterator.index >= this.startIndex && iterator.index < this.startIndex + this.durationMap.length) {
            var mapIndex = iterator.index - this.startIndex;
            var ticks = this.durationMap[mapIndex];
            if (ticks == 0) {
                return [];
            }
            var vexDuration = smoMusic.ticksToDuration[ticks];
            var note = SmoNote.cloneWithDuration(note, {numerator:ticks,denominator:1,remainder:0});
            return [note];
        }
        return null;
    }
}
