
VF = Vex.Flow;
Vex.Xform = (typeof (Vex.Xform)=='undefined' ? {} : Vex.Xform);
VX = Vex.Xform;

// ## Description
//  Clone a slice of a note array.  This can be usefule when re-rendering a staff.
// the parts that you don't want to change can be cloned.
//
// ## Usage:
// var ar1 = VX.CLONE(notes, {start: 0,end: index});
// 
// To change pitch on the note at index:
// VX.SETPITCH = (notes, index, vexKey)
class Cloner {
  constructor(notes, options) {
    this.notes = notes;
    Vex.Merge(this, options);
  }
  /** create a new note based on attributes of note.  If this is a 
  tuplet, create all the notes in the tuplet  **/
  static CloneNote(note, pitchChange,noteTypeChange) {
    var ts = note.tupletStack;
    if (ts.length == 0) {
      var vexKey = note.keys;
      var noteType = note.noteType;

      if (pitchChange && note.attrs.id == pitchChange.id) {
        vexKey = pitchChange.vexKey;
      }
      if (noteTypeChange && note.attrs.id == noteTypeChange.id) {
          noteType = noteTypeChange.noteType;
      }
        var vexDuration = VF.ticksToDuration()[note.ticks.numerator / note.ticks.denominator];
        if (noteType == 'r') {
            vexDuration += 'r';
        }
      var nn = new VF.StaveNote({
        clef: note.clef,
        keys: vexKey,
        duration: vexDuration,
        noteType:noteType
      });
      return [nn];
    }
    var tuplet = ts[0];
    var tupletData = {
      num_notes: tuplet.num_notes,
      notes_occupied: tuplet.notes_occupied,
      bracketed: tuplet.bracketed,
      ratioed: tuplet.ratioed,
      location: tuplet.location
    }
    var ar = [];
    var tupletActor = function(iterator, notes, note) {
      var vexKey = note.keys;


      if (pitchChange && note.attrs.id == pitchChange.id) {
        vexKey = pitchChange.vexKey;
      }
      ar.push(new VF.StaveNote({
        clef: note.clef,
        keys: vexKey,
        duration: note.duration
      }));
    };
    VX.ITERATE(tupletActor, tuplet.notes);
    new Vex.Flow.Tuplet(ar);
    return ar;
  }

  Clone() {
    var notes = this.notes;
    var start = this.start;
    var end = this.end;
    var ar = [];
    var self = this;
    VX.ITERATE((iterator, notes, note) => {
      ar = ar.concat(Cloner.CloneNote(note, self.pitchChange,self.noteTypeChange));
      // if this is a tuplet, we clone the whole tuplet so skip the rest
      // of the notes.
      if (note.tupletStack.length) {
        iterator.skipNext(note.tupletStack[0].notes.length)
      }
    }, notes.slice(start, end));
    this.notes = ar;
    return ar;
  }
}

VX.CLONE = (notes, options) => {
  var cloner = new Cloner(notes, options);
  cloner.Clone();
  return cloner.notes;
}

class PitchChange {
  constructor(notes, index) {
    this.notes = notes;
    this.index = index;
    this.target = notes[index];
  }
  SetNote(vexKey) {
    var pitchChange = {
      vexKey: vexKey,
      id: this.notes[this.index].attrs.id
    };
    return VX.CLONE(this.notes, {
      start: 0,
      end: this.notes.length,
      pitchChange: pitchChange
    });
  }
  SetNoteType(noteType) {
      var noteTypeChange = {
          noteType: noteType,
          id: this.notes[this.index].attrs.id
      };
      return VX.CLONE(this.notes,{
            start: 0,
            end: this.notes.length,
            noteTypeChange: noteTypeChange
        });
  }
}


VX.SETPITCH = (notes, index, vexKey) => {
  var changer = new PitchChange(notes, index);
  return changer.SetNote(vexKey);
}

VX.SETNOTETYPE = (notes, index, noteType) => {
    var changer = new PitchChange(notes, index);
    return changer.SetNoteType(noteType);
}
