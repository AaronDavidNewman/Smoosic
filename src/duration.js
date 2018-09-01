VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
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
        this.noteTicks = this.target.ticks.numerator / this.target.ticks.denominator;
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
    static calculateTupletTicks(tickmap, tupletInfo, changeIndex, changeTicks) {
        var iterator = tickmap;
        var tupletInfo = iterator.tupletMap[tupletId];
        var D = tupletInfo.smallestDuration * tupletInfo.num_notes;
        var index = tupletInfo.startIndex;
        var Ax = tupletInfo.startIndex;
        var Bx = changeIndex - Ax;
        var Cx = Bx + 1;
        var B = changeTicks;
        var A = tupletInfo.durations.reduce((sum, current) => {
                sum + current
            });
        var i;
        // calculate remaining ticks after start note and duration change
        for (i = tupletInfo.startIndex; i < changeIndex; ++i) {
            A += DurationChange.VexDurationToTicks(tupletInfo.durations[i - tupletInfo.startIndex]);
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
        var ar1 = VX.CLONE(notes.slice(0, index), null);
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
        if (this.tickmap.durationMap.indexOf(nduration) < 0 && this.tickmap.duration > nduration) {

            // find the tick count of closest note
            var gapidx = this.tickmap.durationMap.findIndex((x) => {
                    return x > noteTicks
                });
            if (gapidx > 0) {
                // compute the gap ticks
                var gap = this.tickmap.durationMap[gapidx] - noteTicks;
                var vexGapDuration = vexMusic.ticksToDuration[gap];
                ar1.push(
                    new VF.StaveNote({
                        clef: replNote.clef,
                        keys: replNote.keys,
                        duration: vexGapDuration + 'r'
                    }));
            }
        }
        var ar2 = VX.CLONE(notes.slice(index + 1, notes.length), null);

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
            this.notes = this.stretch(this.notes, this.index, this.newTicks);
        } else if (this.newTicks < this.noteTicks) {
            this.notes = this.contract(this.notes, this.index, this.newTicks);
        }
        return this.notes;
    }
}


class Contract  extends NoteTransformBase {
	constructor(tickmap,startIndex,newTicks) {
		this.tickmap=tickmap;
		this.startIndex = startIndex;
		this.newTicks=newTicks;
	}
	transformNote(note, iterator, accidentalMap) {
		if (iterator.index == startIndex) {
			var notes=[];
			var noteCount = Math.floor(note.ticks.numerator / this.newTicks);
			var nextIndex = this.tickmap.durationMap.indexOf(iterator.totalDuration+noteCount*this.newTicks);
			var notes=[];
			var vexDuration=vexMusic.ticksToDuration[this.newTicks];
			if (nextIndex >=0) {				
				for (var i=0;i<noteCount;++i) {
					notes.push(new VF.StaveNote({
                        clef: note.clef,
                        keys: note.keys,
                        duration:vexDuration
                    });
				}				
				return notes;
			} else {
				/**
				 *  Contract does not meet the next note.  Insert a gap in the rest
				 *      old map:
				 *     d  .  .  .  d
				 *     new map:
				 *     d  .  .  r  d
				 */
				var gap = this.tickmap.durationMap[this.startIndex+1]-
				    (iterator.totalDuration+noteCount*this.newTicks);
				var vexGapDuration=vexMusic.ticksToDuration[this.newTicks];
				notes.push(new VF.StaveNote({
                        clef: note.clef,
                        keys: note.keys,
                        duration:vexDuration
                    }));
				notes.push(new VF.StaveNote({
                        clef: note.clef,
                        keys: note.keys,
                        duration:vexGapDuration+"r"
				}));
				return notes;
			}
		}
		return null;
	}
}
// ## A note transformer is just a function that modifies a note in some way.
// Any number of transformers can be applied to a note.
class StretchTuplet extends NoteTransformBase {
    constructor(tickmap, tupletInfo, changeIndex, newTicks) {
        this.tickobj = DurationChange.calculateTupletTicks(tickmap, tupletInfo.startIndex, changeIndex, newTicks);
        this.newTicks = newTicks;
        this.tupletInfo = tupletInfo;
        this.vexDuration = vexMusic.ticksToDuration[newTicks];
        this.remainingTicks = tickobj.C;
        this.tuplet = [];
    }
    transformNote(note, iterator, accidentalMap) {

        var index = iterator.index;
        var tupletInfo = iterator.tupletMap[note.tuplet.attrs.id];
        var tickobj = this.tickobj;
        var D = tickobj.D;
        var Ax = tickobj.Ax;
        var Bx = tickobj.Bx;
        var Cx = tickobj.Cx;
        var B = tickobj.B;
        var A = tickobj.A;
        var C = tickobj.C;

        // if this exceeds the length of tuplet, fail
        if (tickobj.C < 0) {
            return [note];
        }

        if (iterator.index < Ax || iterator.index >= Cx) {
            return null;
        }
        var notes = [];
        var duration = tupletInfo.durations[tupletIndex];

        var tupletIndex = Ax - iterator.index;

        // parts of the tuplet, before the change
        if (iterator.index < Bx) {
            note = new VF.StaveNote({
                    clef: note.clef,
                    keys: note.keys,
                    duration: note.duration
                });
            this.remainingTicks -= duration;
            notes.push(note);
            this.tuplet.push(note);

        } else if (iterator.index == Bx) {
            // The note we are changing explicitly
            this.remainingTicks -= this.newTicks;
            var note = VF.StaveNote({
                    clef: note.clef,
                    keys: note.keys,
                    duration: this.vexDuration

                });
            notes.push(note);
            this.tuplet.push(note);

        }
        // Cx > iterator.index > Bx.
        // Borrow ticks from remaining notes.
        else {
            if (this.remainingTicks <= 0) {
                notes = [];
            } else {
                if (tupletInfo.durations[tupletIndex] > this.remainingTicks) {
                    duration = this.remainingTicks;
                    this.remainingTicks = 0;
                } else {
                    this.remainingTicks -= duration;
                }

                var vexDuration = vxMusic.ticksToDuration[duration];
                var note = VF.StaveNote({
                        clef: note.clef,
                        keys: note.keys,
                        duration: vexDuration
                    });
                notes.push(note);
                this.tuplet.push(note);
            }
        }

        if (iterator.index == Cx) {
            // this sets the correct duration and so needs to be called, even
            // though it is not used.
            var tuplet = new Vex.Flow.Tuplet(this.tuplet, {
                    num_notes: tupletInfo.num_notes,
                    notes_occupied: tupletInfo.notes_occupied,
                    ratioed: false,
                    bracketed: true,
                    location: 1
                });
        }
        return notes;
    }

}

// ## A note transformer is just a function that modifies a note in some way.
// Any number of transformers can be applied to a note.
class ContractTuplet extends NoteTransformBase {
    constructor(tickmap, tupletInfo, changeIndex) {
        this.Bx = changeIndex;
        this.Ax = tupletInfo.startIndex;
        this.Cx = tupletInfo.endIndex;
        this.tupletInfo = tupletInfo;
        this.remainingTicks = tupletInfo.endTick - tupletInfo.startTick;
        this.tuplet = [];
    }
    transformNote(note, iterator, accidentalMap) {

        var index = iterator.index;
        var tupletInfo = this.tupletInfo;
        var Ax = this.Ax;
        var Bx = this.Bx;
        var Cx = this.Cx;

        var i;

        if (iterator.index < Ax || iterator.index >= Cx) {
            return null;
        }
        var notes = [note];
        var duration = tupletInfo.durations[tupletIndex];

        var tupletIndex = Ax - iterator.index;

        // parts of the tuplet, before the change
        if (iterator.index < Bx) {
            this.remainingTicks -= duration;
            notes.push(note);
        } else if (iterator.index == Bx) {
            var notes = [];
            duration = duration / 2;

            var vexDuration = vxMusic.ticksToDuration[duration];
            notes.push(new VF.StaveNote({
                    clef: note.clef,
                    keys: note.keys,
                    duration: vexDuration
                }));
            notes.push(new VF.StaveNote({
                    clef: note.clef,
                    keys: note.keys,
                    duration: vexDuration
                }));
        }
        // Cx > iterator.index > Bx.
        // Duration should be unchanged.
        else {
            this.remainingTicks -= duration;

            var vexDuration = vxMusic.ticksToDuration[duration];
            var note = VF.StaveNote({
                    clef: note.clef,
                    keys: note.keys,
                    duration: vexDuration
                });
            notes.push(note);
        }

        this.tuplet.concat(notes);
        if (iterator.index == Cx) {
            // this sets the correct duration and so needs to be called, even
            // though it is not used.
            var tuplet = new Vex.Flow.Tuplet(this.tuplet, {
                    num_notes: tupletInfo.num_notes,
                    notes_occupied: tupletInfo.notes_occupied,
                    ratioed: false,
                    bracketed: true,
                    location: 1
                });
        }
        return notes;
    }
}

class UnmakeTuplet extends NoteTransformBase {
    constructor(tickmap, tupletInfo) {
        this.Ax = tupletInfo.startIndex;
        this.Cx = tupletInfo.endIndex;
        this.tupletInfo = tupletInfo;
        this.ticks = tupletInfo.endTick - tupletInfo.startTick;
        this.vexDuration = vexMusic.ticksToDuration[this.ticks];
        this.tuplet = [];
    }
    transformNote(note, iterator, accidentalMap) {
        if (iterator.index < this.Ax || this.iterator.index > this.Bx) {
            return null;
        }
        if (iterator.index == this.Ax) {
            var note = VF.StaveNote({
                    clef: note.clef,
                    keys: note.keys,
                    duration: this.vexDuration
                });
            return [note];
        }
        return [];
    }

}

class MakeTuplet extends NoteTransformBase {
    constructor(tickmap, index, num_notes, notes_occupied) {
        this.tickmap = tickmap;
        this.duration = tickmap.durationMap[index];
        this.tupletTicks = this.duration / notes_occupied;
        this.vexDuration = vexMusic.ticksToDuration[this.tupletTicks];
        this.tuplet = [];

        this.Ax = index;
        this.num_notes = num_notes;

        // duration in ticks
        if (this.vexDuration) {
            this.newTicks = DurationChange.VexDurationToTicks(this.vexDuration);
        }

        this.target = notes[this.index];
        this.noteTicks = this.target.ticks.numerator / this.target.ticks.denominator;
    }
    transformNote(note, iterator, accidentalMap) {
        if (iterator.index != this.Ax) {
            return null;
        }
        for (var i = 0; i < this.num_notes; ++i) {
            note = new VF.StaveNote({
                    clef: note.clef,
                    keys: note.keys,
                    duration: this.vexDuration
                });
            this.tuplet.push(note);
        }
        var tuplet = new Vex.Flow.Tuplet(this.tuplet, {
                num_notes: this.num_notes,
                notes_occupied: this.notes_occupied,
                ratioed: false,
                bracketed: true,
                location: 1
            });
        return this.tuplet;
    }
}

class StretchNote extends NoteTransformBase {
    constructor(tickmap, index, newTicks) {
        this.index = index;
        this.tickmap = tickmap;
        this.newTicks = newTicks;
        this.vexDuration = vexMusic.ticksToDuration[newTicks];
        this.endIndex = this.index + 1;
        this.startTick = this.tickmap.durationMap[this.index];

        var endTick = this.tickmap.durationMap[this.index] + this.newTicks;
        this.divisor = -1;
        this.durationMap = [];
        this.skipFromStart = this.index + 1;
        this.skipFromEnd = this.index + 1;
        this.durationMap.push(newTicks);

        var mapIx = this.tickmap.durationMap.indexOf(endTick);
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
            var npos = this.tickmap.durationMap[this.index + 1];
            var ndelta = this.tickmap.deltaMap[this.index + 1];
            if (ndelta / 2 + this.startTick + this.newTicks === npos) {
                durationMap.push(ndelta / 2);				
            } else {
                // there is no way to do this...
                durationMap = [];

            }
        } else {
			// If this note now takes up the space of other notes, remove those notes
			for (var i=this.startTick+1;i<mapIx;++i) {
		       this.durationMap.push(0);
			}
        }
    }
    transformNote(note, iterator, accidentalMap) {
		if (this.durationMap.length==0) {
			return null;
		}
		if (iterator.index >= this.index && iterator.index  < this.index+this.durationMap.length) {
			var mapIndex = iterator.index-this.index;
			var ticks=this.durationMap[mapIndex];
			if (ticks == 0) {
				return [];
			}
			var vexDuration = vexMusic.ticksToDuration[ticks];
            var note = new VF.StaveNote({
                    clef: note.clef,
                    keys: note.keys,
                    duration: vexDuration
            });
			return [note];
		}
		return null;
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
