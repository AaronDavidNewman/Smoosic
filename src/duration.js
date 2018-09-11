VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

// ## VxDurationFactory:
// Create actors that change the duration of notes, or just re-create existing notes.
// Also creates tuplets.
class VxDurationFactory {
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
			// Can't I just VF.durationToTicks?
            A += VxDurationFactory.VexDurationToTicks(tupletInfo.durations[i - tupletInfo.startIndex]);
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
    static _createTupletActors(measure,tickmap, notes, exclude) {
        var rv = [];
        var tupletKeys = Object.keys(tickmap.tupletMap);
        for (var i = 0; i < tupletKeys.length; ++i) {
            var tupletInfo = tickmap.tupletMap[tupletKeys[i]];
            if (exclude.length === 0 || exclude.indexOf(tupletInfo.startIndex) < 0) {
                rv.push(new VxReplaceTupletActor(measure,tickmap, tupletInfo));
            }
        }
        return rv;
    }
   
    // ## vxCreateDurationChangeActors
	// Create actors that either replace existing notes with notes of equal duration,
	// or stretches/contracts existing notes
    static vxCreateDurationChangeActors(measure, index, newTicks) {
        var tickmap = VX.TICKMAP(measure);
        var exclusions = [];
        var actors = [];
        if (index >= 0) {
            exclusions.push(index);
        }
        var actors = VxDurationFactory._createTupletActors(measure,tickmap, measure.notes, exclusions);

        // No duration change, just return the actors to create the tuplets
        if (index < 0) {
            return actors;
        }
        var note = measure.notes[index];
        var oldDuration = (note.ticks.numerator / note.ticks.denominator);

        // Make sure the new duration is valid.
        if (!vexMusic.ticksToDuration[newTicks]) {
            return actors;
        }
        if (vexMusic.isTuplet(note)) {
            // no dotted tuplets
            if (oldDuration > newTicks) {
                if (oldDuration % newTicks !== 0) {
                    return actors;
                }
                actors.push(new VxContractTupletActor(measure,tickmap, tickmap.getTupletInfo(index), index, newTicks));
            } else if (oldDuration < newTicks) {
                // no dots on tuplets
                if (newTicks % oldDuration !== 0) {
                    return actors;
                }
                actors.push(new VxStretchTupletActor(measure,tickmap, tickmap.getTupletInfo(index), index, newTicks));
            }
        } else {
            if (oldDuration > newTicks) {
                actors.push(new VxContractNoteActor(tickmap, startIndex, newTicks));
            } else {
                var remaining = tickmap.totalDuration - tickmap.durationMap[index];
                if (newTicks + remaining > totalDuration) {
                    return actors;
                }
                actors.push(new VxStretchNoteActor(tickmap, index, newTicks));
            }
        }
        return actors;
    }
	
    static vxCreateMakeTupletActors(measure, index, newTicks,num_notes) {
        var actors = VxDurationFactory.vxCreateDurationChangeActors(measure, -1);
		var tickmap = VX.TICKMAP(measure);
		var note = measure.notes[index];
		var notesOccupied = 4096/newTicks;
		// TODO: validity checks here
		actors.push(new VxMakeTupletActor(measure,tickmap, index, num_notes, notes_occupied));
		return actors;
    }
	static vxCreateUnmakeTupletActors(measure,index) {
        var actors = VxDurationFactory.vxCreateDurationChangeActors(measure, index);		
		var tickmap = VX.TICKMAP(measure);
		var note = measure.notes[index];
		if (!vexMusic.isTuplet(note)) {
			return actors;
		}
		var tupletInfo = tickmap.getTupletInfo(index);
		actors.push(new VxUnmakeTupletActor(tickmap,tupletInfo));
		return actors;
	}
}

/**
 * Replace tuplet with identical tuplet
 **/
class VxReplaceTupletActor extends NoteTransformBase {
    constructor(measure,tickmap, tupletInfo) {
        this.tickmap = tickmap;
        this.tupletInfo = tupletInfo;
        this.tuplet = [];
    }
    transformNote(note, iterator, accidentalMap) {
        if (iterator.index < this.tupletInfo.startIndex || iterator.index > this.tupletInfo.endIndex) {
            return null;
        }
        this.tuplet.push(note);
        if (iterator.index > this.tupletInfo.endIndex) {
            var tuplet = new NoVexTuplet(this.tuplet, {
                    num_notes: tupletInfo.num_notes,
                    notes_occupied: tupletInfo.notes_occupied,
                    ratioed: false,
                    bracketed: true,
                    location: 1
                });
			this.measure.tuplets.push(tuplet);
        }
        return [note];
    }
}

// ## VxContractActor
// Contract the duration of a note, filling in the space with another note
// or rest.
//
class VxContractActor extends NoteTransformBase {
    constructor(tickmap, startIndex, newTicks) {
        this.tickmap = tickmap;
        this.startIndex = startIndex;
        this.newTicks = newTicks;
    }
    transformNote(note, iterator, accidentalMap) {
        if (iterator.index == startIndex) {
            var notes = [];
            var noteCount = Math.floor(note.ticks.numerator / this.newTicks);
            var nextIndex = this.tickmap.durationMap.indexOf(iterator.totalDuration + noteCount * this.newTicks);
            var notes = [];
            var vexDuration = vexMusic.ticksToDuration[this.newTicks];
            if (nextIndex >= 0) {
                /**
                 *  Replace 1 note with noteCOunt notes of newTIcks duration
                 *      old map:
                 *     d  .  d  .  .
                 *     new map:
                 *     d  d  d  .  .
                 */
                for (var i = 0; i < noteCount; ++i) {
                    notes.push(new NoVexNote({
                            clef: note.clef,
                            keys: note.keys,
                            duration: vexDuration
                        }));
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
                var gap = this.tickmap.durationMap[this.startIndex + 1] -
                    (iterator.totalDuration + noteCount * this.newTicks);
                var vexGapDuration = vexMusic.ticksToDuration[this.newTicks];
                notes.push(new NoVexNote({
                        clef: note.clef,
                        keys: note.keys,
                        duration: vexDuration
                    }));
                notes.push(new NoVexNote({
                        clef: note.clef,
                        keys: note.keys,
                        duration: vexGapDuration + "r"
                    }));
                return notes;
            }
        }
        return null;
    }
}
// ## VxStretchTupletActor 
// Stretch a note in a tuplet, replacing or shortening other notes in the tuplet
//
class VxStretchTupletActor extends NoteTransformBase {
    constructor(measure,tickmap, tupletInfo, changeIndex, newTicks) {
        this.tickobj = DurationChange.calculateTupletTicks(tickmap, tupletInfo.startIndex, changeIndex, newTicks);
        this.newTicks = newTicks;
        this.tupletInfo = tupletInfo;
        this.vexDuration = vexMusic.ticksToDuration[newTicks];
        this.remainingTicks = tickobj.C;
		this.measure = measure;
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

        /*
        ## Strategy:
        Parts of tuplet before A, leave alone
        Parts of tuplet B, give new duration
        After B:
        place notes that fit as normal
        shorten notes that don't fit
        once all the ticks are used up, just remove the notes

        5
        ---------
        | | | | |
        n n n n n
        A | B | C
         */
        if (iterator.index < Bx) {
            note = new NoVexNote({
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
            var note = NoVexNote({
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
                var note = NoVexNote({
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
            var tuplet = new NoVexTuplet(this.tuplet, {
                    num_notes: tupletInfo.num_notes,
                    notes_occupied: tupletInfo.notes_occupied,
                    ratioed: false,
                    bracketed: true,
                    location: 1
                });
			this.measure.tuplets.push(tuplet);
        }
        return notes;
    }

}

// ## VxContractActor
// Contract the duration of a note in a tuplet by duplicate
// notes of fractional length
//
class VxContractTupletActor extends NoteTransformBase {
    constructor(measure,tickmap, tupletInfo, changeIndex, newTicks) {
		this.measure=measure;
        this.Bx = changeIndex;
        this.Ax = tupletInfo.startIndex;
        this.Cx = tupletInfo.endIndex;
        this.tupletInfo = tupletInfo;
        this.newTicks = newTicks;
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
            var num_notes = iterator.deltaMap[iterator.index] / this.newTicks;
            duration = this.newTicks;

            var vexDuration = vxMusic.ticksToDuration[duration];
            for (var i = 0; i < num_notes; ++i) {
                notes.push(new NoVexNote({
                        clef: note.clef,
                        keys: note.keys,
                        duration: vexDuration
                    }));
            }
        }
        // Cx > iterator.index > Bx.
        // Duration should be unchanged.
        else {
            this.remainingTicks -= duration;

            var vexDuration = vxMusic.ticksToDuration[duration];
            var note = NoVexNote({
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
            var tuplet = new NoVexTuplet(this.tuplet, {
                    num_notes: tupletInfo.num_notes,
                    notes_occupied: tupletInfo.notes_occupied,
                    ratioed: false,
                    bracketed: true,
                    location: 1
                });
			this.measure.tuplets.push(tuplet);
        }
        return notes;
    }
}

// ## VxUnmakeTupletActor
// Turn a tuplet into a non-tuplet of the same length
class VxUnmakeTupletActor extends NoteTransformBase {
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
            var note = NoVexNote({
                    clef: note.clef,
                    keys: note.keys,
                    duration: this.vexDuration
                });
            return [note];
        }
        return [];
    }
}

// ## VxUnmakeTupletActor
// Turn a tuplet into a non-tuplet of the same length
class VxMakeTupletActor extends NoteTransformBase {
    constructor(measure,tickmap, index, num_notes, notes_occupied) {
        this.tickmap = tickmap;
		this.measure = measure;
        this.duration = tickmap.deltaMap[index];
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
            note = new NoVexNote({
                    clef: note.clef,
                    keys: note.keys,
                    duration: this.vexDuration
                });
            this.tuplet.push(note);
        }
        var tuplet = new NoVexTuplet(this.tuplet, {
                num_notes: this.num_notes,
                notes_occupied: this.notes_occupied,
                ratioed: false,
                bracketed: true,
                location: 1
            });
		this.measure.tuplets.push(tuplet);
        return this.tuplet;
    }
}

class VxStretchNoteActor extends NoteTransformBase {
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
            for (var i = this.startTick + 1; i < mapIx; ++i) {
                this.durationMap.push(0);
            }
        }
    }
    transformNote(note, iterator, accidentalMap) {
        if (this.durationMap.length == 0) {
            return null;
        }
        if (iterator.index >= this.index && iterator.index < this.index + this.durationMap.length) {
            var mapIndex = iterator.index - this.index;
            var ticks = this.durationMap[mapIndex];
            if (ticks == 0) {
                return [];
            }
            var vexDuration = vexMusic.ticksToDuration[ticks];
            var note = new NoVexNote({
                    clef: note.clef,
                    keys: note.keys,
                    duration: vexDuration
                });
            return [note];
        }
        return null;
    }
}

