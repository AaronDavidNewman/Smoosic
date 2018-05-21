VF = Vex.Flow;
Vex.Xform = (typeof (Vex.Xform) == 'undefined' ? {} : Vex.Xform);
VX = Vex.Xform;

// ## Description:
// Change duration of a note in an array of notes.  Either by duplicating a note at a smaller duration
// or by replacing a note with a note of longer duration and remove following notes.
//
// ## TODO: other time signatures, stacked voices
// 
// ## Usage:
// VX.DURATION (notes, index, vexDuration)
//    changes notes[index] to vexDuration, if it is legal within the 
//    time/bar.  Works with tuplets
//
// VX.TUPLET (notes, index, vexDuration, numNotes)
//      converts notes[index] into a tuplet, with numNotes over vexDuration
//
// VX.UNTUPLET (notes, index)  
//    replace the tuplet at notes[index] with a non-tuplet
// 
class DurationChange {
    constructor(notes, options) {
        Vex.Merge(this, options);
        this.notes = notes;

        // duration in ticks
        if (this.vexDuration) { // UNTUPLET doesn't use it.
            this.newTicks = DurationChange.VexDurationToTicks(this.vexDuration);
        }

        this.target = notes[this.index];
        this.noteTicks = this.target.ticks.numerator/this.target.ticks.denominator;
        this.tickmap = VX.TICKMAP(notes);
    }
    static VexDurationToTicks(vexDuration) {
        return VF.parseNoteData(VF.parseNoteDurationString(vexDuration)).ticks;
    }
    /*
      ## Calculate the tickmap of a tuplet with respect to one of the notes.
            5
        ---------
        | | | | |
        n n n n n
        A | B | C
        
        ticks (normalized to tuplet):
        A= ticks before tuplet
        B= duration of new tuplet
        C= ticks after tuplet
        D= total duration of tuplet
        
        indices:
        index = index of note to change
        Ax=index of first tuplet note
        Bx=offset into tuplet of note to change
        Cx=offset  of first tuplet note after change
    */
    calculateTupletTicks() {
        var notes = this.notes;
        var index = this.index;
        var note = this.notes[this.index];
        var iterator = this.tickmap;
        var tupletInfo = iterator.tupletMap[note.tuplet.attrs.id];
        var D = tupletInfo.smallestDuration * note.tuplet.num_notes;
        var Ax = tupletInfo.startIndex;
        var Bx = index - Ax;
        var Cx = Bx + 1;
        var B = this.newTicks;
        var A = 0;
        var i;
        // calculate remaining ticks after start note and duration change
        for (i = tupletInfo.startIndex; i < index; ++i) {
            A += DurationChange.VexDurationToTicks(notes[index].duration);
        }

        var C = D - (A + B);
        return {
            iterator: iterator,
            tupletInfo: tupletInfo,
            D: D,
            A: A,
            B: B,
            C: C,
            Ax: Ax,
            Bx: Bx,
            Cx: Cx
        };
    }
    stretchTuplet() {
        var notes = this.notes;
        var index = this.index;
        var note = this.notes[this.index];
        var tickobj = this.calculateTupletTicks();
        var iterator = tickobj.iterator;
        var tupletInfo = iterator.tupletMap[note.tuplet.attrs.id];
        var D = tickobj.D;
        var Ax = tickobj.Ax;
        var Bx = tickobj.Bx;
        var Cx = tickobj.Cx;
        var B = tickobj.B;
        var A = tickobj.A;
        var C = tickobj.C;

        // if this exceeds the length of tuplet, fail
        if (C < 0) {
            return notes;
        }

        var ar = [];
        var i;
        for (i = 0; i < Bx; ++i) {
            var tnote = notes[tupletInfo.startIndex + i];
            var tRep = new VF.StaveNote({
                clef: tnote.clef,
                keys: tnote.keys,
                duration: tnote.duration

            });
            ar.push(tRep);
        }
        var repl = new VF.StaveNote({
            clef: note.clef,
            keys: note.keys,
            duration: this.vexDuration
        });
        ar.push(repl);

        var tupletLength = 1 + tupletInfo.endIndex - tupletInfo.startIndex;

        var remainingTicks = C;
        for (i = Cx; remainingTicks > 0 && i < tupletLength; ++i) {
            ar.push(this.notes[i + tupletInfo.startNote]);
        }

        var ar1 = VX.CLONE(notes,null, {
            start: 0,
            end: tupletInfo.startIndex
        });
        var ar2 = VX.CLONE(notes,null, {
            start: tupletInfo.endIndex + 1,
            end: notes.length
        });

        this.notes = ar1.concat(ar).concat(ar2);

        // this sets the correct duration and so needs to be called, even 
        // though it is not used.
        var tuplet = new Vex.Flow.Tuplet(ar, {
            num_notes: note.tuplet.num_notes,
            notes_occupied: note.tuplet.notes_occupied,
            ratioed: false,
            bracketed: true,
            location: 1
        });
        return this.notes;
    }
    unmakeTuplet() {
        var note = this.target;
        // var tickobj = this.calculateTupletTicks();
        var tupletInfo = this.tickmap.tupletMap[note.tuplet.attrs.id];
        var noteTuplet = note.tuplet;
        var notes = this.notes;
        // total ticks of the new thing
        var ticks = tupletInfo.smallestDuration * noteTuplet.notes_occupied;
        var vexDuration = vexMusic.ticksToDuration[ticks];

        var ar1 = VX.CLONE(notes,null, {
            start: 0,
            end: tupletInfo.startIndex
        });
        var ar2 = VX.CLONE(notes,null, {
            start: tupletInfo.endIndex + 1,
            end: notes.length
        });
        var repl = new VF.StaveNote({
            clef: note.clef,
            keys: note.keys,
            duration: vexDuration
        });
        this.notes = ar1.concat([repl]).concat(ar2);
        return this.notes;
    }
    makeTuplet() {
        var numNotes = this.numNotes;
        var note = this.target;
        var notes = this.notes;
        
        // total ticks of the new thing
        var notes_occupied = this.noteTicks / this.newTicks;
        var remaininigTicks=this.tickmap.totalDuration-this.tickmap.durationMap[this.index];
        if (notes_occupied<1 || notes_occupied * this.newTicks > remaininigTicks) {
            return notes;
        }

        var ar1 = VX.CLONE(notes,null, {
            start: 0,
            end: this.index
        });
        var ar2 = VX.CLONE(notes,null, {
            start: this.index + 1,
            end: notes.length
        });
        var i;
        var ar = [];
        for (i = 0; i < numNotes; ++i) {
            var repl = new VF.StaveNote({
                clef: note.clef,
                keys: note.keys,
                duration: this.vexDuration
            });
            ar.push(repl);
        }

        this.notes = ar1.concat(ar).concat(ar2);
        var tuplet = new Vex.Flow.Tuplet(ar, {
            num_notes: numNotes,
            notes_occupied: notes_occupied,
            ratioed: false,
            bracketed: true,
            location: 1
        });
        return this.notes;
    }
    contractTuplet() {
        var notes = this.notes;
        var note = this.notes[this.index];
        var tickobj = this.calculateTupletTicks();
        var iterator = tickobj.iterator;
        var tupletInfo = iterator.tupletMap[note.tuplet.attrs.id];
        var Bx = tickobj.Bx;
        var Cx = tickobj.Cx;
        var C = tickobj.C;
        var changeD = this.noteTicks / this.newTicks;

        // if this exceeds the length of tuplet, fail
        if (C < 0) {
            return notes;
        }

        var ar = [];
        var i, tnote, tRep;
        // notes before the change in tuplet
        for (i = 0; i < Bx; ++i) {
            tnote = notes[tupletInfo.startIndex + i];
            tRep = new VF.StaveNote({
                clef: tnote.clef,
                keys: tnote.keys,
                duration: tnote.duration
            });
            ar.push(tRep);
        }

        // notes we are changing in tuplet
        for (i = Bx; i < Bx + changeD; ++i) {
            tnote = notes[tupletInfo.startIndex + Bx];
            tRep = new VF.StaveNote({
                clef: tnote.clef,
                keys: tnote.keys,
                duration: this.vexDuration
            });
            ar.push(tRep);
        }

        // notes after change in tuplet
        for (i = Bx + 1; i < Cx; ++i) {
            tnote = notes[tupletInfo.startIndex + i];
            tRep = new VF.StaveNote({
                clef: tnote.clef,
                keys: tnote.keys,
                duration: tnote.duration
            });
            ar.push(tRep);
        }

        var ar1 = VX.CLONE(notes,null, {
            start: 0,
            end: tupletInfo.startIndex
        });
        var ar2 = VX.CLONE(notes,null, {
            start: tupletInfo.endIndex + 1,
            end: notes.length
        });

        this.notes = ar1.concat(ar).concat(ar2);

        var tuplet = new Vex.Flow.Tuplet(ar, {
            num_notes: note.tuplet.num_notes,
            notes_occupied: note.tuplet.notes_occupied,
            ratioed: false,
            bracketed: true,
            location: 1
        });
        return this.notes;
    }
    // Handle the iterator to change the duration
    _stretch(note, iterator) {
        var index = iterator.index;
        // Just clone any notes before the target index
        if (index < this.index) {
            return note;
        }

        // Replace note with correct duration at index
        if (this.index == index) {
            var repl = new VF.StaveNote({
                clef: note.clef,
                keys: note.keys,
                duration: this.vexDuration
            });

            // 2 iterators: over original durations, and over new durations
            // if this note takes up space for multiple notes, skip
            var preDuration = iterator.durationMap[index];

            // if this is the duration of the whole measure, skip the rest
            if (preDuration + this.newTicks == this.tickmap.totalDuration) {
                iterator.skipNext(iterator.endIndex - index);
                return repl;
            }

            // if there is no tick, just don't do the change.  
            // TODO:  borrow from next note, when that's the expected thing.
            var mapIx = this.tickmap.durationMap.indexOf(preDuration+this.newTicks);
            if (mapIx < 0) {            
                return note;
            }
            if (mapIx > this.index + 1) {
                var toSkip = mapIx - (this.index + 1);
                iterator.skipNext(toSkip);
            } 
            
            return repl;
        }

        // For notes later in the measure, taper the note if it 
        // exceeds the length of the measure.
        if (note.tuplet) {
            return note;
        }
        var ticks = note.ticks.numerator / note.ticks.denominator;
        var vexDuration = note.duration;
        if (this.tickmap.durationMap[index] + ticks > this.tickmap.totalDuration) {
            ticks = iterator.totalDuration - iterator.durationMap[index];
            vexDuration = vexMusic.ticksToDuration[ticks];
        }
        return new VF.StaveNote({
            clef: note.clef,
            keys: note.keys,
            duration: vexDuration
        });
    }
    /** 
    replace the notes at index with a note oflonger duration,
    replacing any notes in the way
    **/
    stretch() {
        var notes = this.notes;

        var self = this;
        this.notes = VX.CLONE(notes,
            (note, iterator) => { return self._stretch(note, iterator); }, {
            start: 0,
            end: notes.length
        });
        return this.notes;
    }
   
    /** split note at index into multiple notes of duration.
    durtation in ticks
    **/
    contract() {
        var notes = this.notes;
        var index = this.index;
        var noteTicks = this.newTicks;
        var replNote = notes[index];
        var noteCount = Math.floor(replNote.ticks.numerator / noteTicks);
        var nar = [];

        for (var i = 0; i < noteCount; ++i) {
            var repl = new VF.StaveNote({
                clef: replNote.clef,
                keys: replNote.keys,
                duration: this.vexDuration
            });
            nar.push(repl);
        }
        var ar1 = VX.CLONE(notes,null, {
            start: 0,
            end: index
        });
        var ar1 = ar1.concat(nar);

        // If there is no note at the end of this note, insert a rest in the gap
        /**
         *      old map:    
         *     d  .  .  .  d
         *     new map:
         *     d  .  .  r  d
         */

        // figure out duration so far.
        var newMap = VX.TICKMAP(ar1);
        var nduration = newMap.totalDuration;
        if (this.tickmap.durationMap.indexOf(nduration) < 0) {

            // find the tick count of closest note
            var gapidx = this.tickmap.durationMap.findIndex((x) => { return x > noteTicks });
            if (gapidx > 0) {
                // compute the gap ticks
                var gap = this.tickmap.durationMap[gapidx] - noteTicks;
                var vexGapDuration = vexMusic.ticksToDuration[gap];
                ar1.push(
                    new VF.StaveNote({
                        clef:replNote.clef,
                        keys:replNote.keys,
                        duration: vexGapDuration+'r'
                    }));
            }
        }
        var ar2 = VX.CLONE(notes,null, {
            start: index + 1,
            end: notes.length
        });

        this.notes = ar1.concat(ar2);
        return this.notes;
    }

    Check() {
        if (this.target.tupletStack.length) {
            var tickobj = this.calculateTupletTicks();
            if (this.noteTicks > this.newTicks) {
                if (this.noteTicks % this.newTicks == 0) {
                    return true;
                }
                return false;
            } else {
                if (tickobj.C < 0) {
                    return false;
                }
                return true;
            }
            // TODO:
            // convert tuplet to non-tuplet
        }
        if (this.newTicks == this.noteTicks) {
            return false;
        }
        return true;
    }
    ChangeDuration() {
        if (!this.Check()) {
            return this.notes;
        }
        if (this.target.tupletStack.length) {
            if (this.newTicks < this.noteTicks) {
                return this.contractTuplet();
            } else {
                return this.stretchTuplet(this.notes, this.index, this.newTicks);
            }

        }
        if (this.newTicks > this.noteTicks) {
            this.notes= this.stretch(this.notes, this.index, this.newTicks);
        } else if (this.newTicks < this.noteTicks) {
            this.notes=this.contract(this.notes, this.index, this.newTicks);
        }
        return this.notes;
    }
}

VX.DURATION = (notes, index, vexDuration) => {
    var changer = new DurationChange(notes, {
        index: index,
        vexDuration: vexDuration
    });
    changer.ChangeDuration();
    return changer.notes;
}

VX.TUPLET = (notes, index, vexDuration, numNotes, notesOccupied) => {
    var changer = new DurationChange(notes, {
        index: index,
        vexDuration: vexDuration,
        numNotes: numNotes,
        notesOccupied: notesOccupied
    });
    changer.makeTuplet();
    return changer.notes;
}

VX.UNTUPLET = (notes, index, vexDuration) => {
    var changer = new DurationChange(notes, {
        index: index
        // vexDuration: vexDuration
    });
    changer.unmakeTuplet();
    return changer.notes;
}


