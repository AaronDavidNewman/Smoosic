VF = Vex.Flow;
Vex.Xform = (typeof (Vex.Xform)=='undefined' ? {} : Vex.Xform);
VX = Vex.Xform;

class DurationChange {
  constructor(notes, options) {
    Vex.Merge(this, options)
    this.notes = notes;

    // duration in ticks
    this.newTicks = DurationChange.VexDurationToTicks(this.vexDuration);

    this.target = notes[this.index];
    this.noteTicks = DurationChange.VexDurationToTicks(this.target.duration);
    this.iterator = VX.TICKMAP(notes);
  }
  static VexDurationToTicks(vexDuration) {
    return VF.parseNoteData(VF.parseNoteDurationString(vexDuration)).ticks;
  }
  /*
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
    var iterator = VX.TICKMAP(this.notes);
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

    var ticks = 0;

    var ar1 = VX.CLONE(notes, {
      start: 0,
      end: tupletInfo.startIndex
    });
    var ar2 = VX.CLONE(notes, {
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
  unmakeTuplet() {
    var note = this.target;
    var tickobj = this.calculateTupletTicks();
    var tupletInfo = this.iterator.tupletMap[note.tuplet.attrs.id];
    var noteTuplet = note.tuplet;
    var notes = this.notes;
    // total ticks of the new thing
    var ticks = tupletInfo.smallestDuration * noteTuplet.notes_occupied;
    var vexDuration = VF.ticksToDuration()[ticks];

    var ar1 = VX.CLONE(notes, {
      start: 0,
      end: tupletInfo.startIndex
    });
    var ar2 = VX.CLONE(notes, {
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

    var ar1 = VX.CLONE(notes, {
      start: 0,
      end: this.index
    });
    var ar2 = VX.CLONE(notes, {
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
    // 1 for 0-index, 1 for the note we're adding
    var tupletLength = 2 + tupletInfo.endIndex - tupletInfo.startIndex;


    var ar1 = VX.CLONE(notes, {
      start: 0,
      end: tupletInfo.startIndex
    });
    var ar2 = VX.CLONE(notes, {
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
  /** 
  replace the notes at index with a note oflonger duration,
  replacing any notes in the way
  **/
  stretch() {
    var notes = this.notes;
    var index = this.index;
    var vexDuration = this.vexDuration;
    var iterator = VX.TICKMAP(this.notes);
    var endIx = iterator.getTickIndex(index, this.newTicks);
    var replNote = notes[index];

    var repl = new VF.StaveNote({
      clef: replNote.clef,
      keys: replNote.keys,
      duration: this.vexDuration
    });
    if (this.vexDuration.indexOf('d') > 0)
      repl.addDotToAll();
    var ar1 = VX.CLONE(notes, {
      start: 0,
      end: index
    });
    var ar2 = VX.CLONE(notes, {
      start: endIx,
      end: notes.length
    });

    this.notes = ar1.concat([repl]).concat(ar2);
    // recreateTuplets(notes, tupletData1);
    // recreateTuplets(notes, tupletData2);
    return this.notes;
  }
  /** split note at index into multiple notes of duration.
  durtation in ticks
  **/
  contract() {
    var notes = this.notes;
    var index = this.index;
    var noteTicks = this.newTicks;
    var iterator = VX.TICKMAP(notes);
    var replNote = notes[index];
    var noteCount = replNote.ticks.numerator / noteTicks;
    var nar = [];

    for (var i = 0; i < noteCount; ++i) {
      var repl = new VF.StaveNote({
        clef: replNote.clef,
        keys: replNote.keys,
        duration: this.vexDuration
      });
      nar.push(repl);
    }
    var ar1 = VX.CLONE(notes, {
      start: 0,
      end: index
    });
    var ar2 = VX.CLONE(notes, {
      start: index + 1,
      end: notes.length
    });

    this.notes = ar1.concat(nar).concat(ar2);
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
      return this.stretch(this.notes, this.index, this.newTicks);
    } else if (this.newTicks < this.noteTicks) {
      return this.contract(this.notes, this.index, this.newTicks);
    }
    return this.notes;
  }
}

VX.DURATION = function(notes, index, vexDuration) {
  var changer = new DurationChange(notes, {
    index: index,
    vexDuration: vexDuration
  });
  changer.ChangeDuration();
  return changer.notes;
}

VX.TUPLET = function(notes, index, vexDuration, numNotes) {
  var changer = new DurationChange(notes, {
    index: index,
    vexDuration: vexDuration,
    numNotes: numNotes
  });
  changer.makeTuplet();
  return changer.notes;
}

VX.UNTUPLET = function(notes, index, vexDuration, numNotes) {
  var changer = new DurationChange(notes, {
    index: index,
    vexDuration: vexDuration
  });
  changer.unmakeTuplet();
  return changer.notes;
}

VF.ticksToDuration = (function() {
  var durations = ["1/2", "1", "2", "4", "8", "16", "32", "64", "128", "256"];
  var ticksToDuration = {};
  var _ticksToDurations = function() {
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
});

