
VF = Vex.Flow;
Vex.Xform = (typeof (Vex.Xform)=='undefined' ? {} : Vex.Xform);
VX = Vex.Xform;

// ## Description
//  Clone a slice of a note array.  This can be usefule when re-rendering a staff.
// the parts that you don't want to change can be cloned.
//
// ## Usage:
// var ar1 = VX.CLONE(notes, {start: 0,end: index,notifier:this});
// notifier is an object with a modNote method, that can be used to change pitch, etc.
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
  CloneNote(iterator,note) {
    var self = this;
    var ts = note.tupletStack;
    if (ts.length == 0) {
      var vexKey = note.keys;
      var noteType = note.noteType;
     
        var vexDuration = VF.ticksToDuration()[note.ticks.numerator / note.ticks.denominator];
       
      var nn = new VF.StaveNote({
        clef: note.clef,
        keys: vexKey,
        duration: vexDuration,
        noteType:noteType
      });
      if (this.notifier) {
          nn=this.notifier.modNote(nn, iterator.index);
      }
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
        var nn = new VF.StaveNote({
            clef: note.clef,
            keys: vexKey,
            duration: note.duration
        });
        if (self.notifier) {
            nn = self.notifier.modNote(nn, iterator.index);
        }
      ar.push(nn);
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
      ar = ar.concat(self.CloneNote(iterator,note));
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
      this.noteType = 'n';
    this.target = notes[index];
  }
  modNote(note, index) {
      if (index == this.index) {
          if (!this.vexKey) {
              this.vexKey = note.keys;
          }
          if (this.noteType == 'r') {
              note.duration += 'r';
          }
          note = new VF.StaveNote({
              clef: note.clef,
              keys: this.vexKey,
              duration: note.duration,
              noteType:this.noteType
      });
      }
      return note;
  }
  SetNote(vexKey) {
    this.vexKey = vexKey;    
    return VX.CLONE(this.notes, {
      start: 0,
      end: this.notes.length,
      notifier:this
    });
  }
  SetNoteType(noteType) {
      this.noteType = noteType;
      
      return VX.CLONE(this.notes,{
            start: 0,
            end: this.notes.length,
            notifier:this
        });
  }
}

class AccidentalChange {
    constructor(notes, index) {
        this.notes = notes;
        this.index = index;
        this.target = notes[index];
    }
    SetAccidental(a) {
        var notes = this.notes;
        var note = notes[this.index];
        var ar1 = VX.CLONE(notes, {
            start: 0,
            end: this.index
        });
        var ar2 = VX.CLONE(notes, {
            start: this.index+1,
            end: notes.length
        });
        var repl = new VF.StaveNote({
            clef: note.clef,
            keys: note.keys,
            duration: note.duration
        });
        for (var i = 0; i < note.keys.length; ++i) {
            repl.addAccidental(i, new VF.Accidental(a));
        }
        repl.modifiers
            .filter(function(modifier) {
                return modifier.getAttribute('type') === 'Accidental';
            })
            .forEach(function(accid) {
                accid.setAsCautionary();
            });
        return ar1.concat([repl]).concat(ar2);
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

VX.ACCIDENTAL = (notes, index,accidental) => {
    var changer = new AccidentalChange(notes, index);
    return changer.SetAccidental(accidental);
}