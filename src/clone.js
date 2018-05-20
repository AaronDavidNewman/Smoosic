
VF = Vex.Flow;
Vex.Xform = (typeof (Vex.Xform)=='undefined' ? {} : Vex.Xform);
VX = Vex.Xform;

// ## Description
//  Clone a slice of a note array.  This can be useful when re-rendering a staff.
// the parts that you don't want to change can be cloned.
//
// Cloner is an iterator.  It will call you back after each note and allow you to
// add modifier or make modifications.
//
// ## Usage:
// var ar1 = VX.CLONE(notes, actor,{start: 0,end: index,notifier:this});
// actor is an callback method that takes and returns the note.  It can be used
// to change pitch, or as an iterator.  If not supplied, a default is provided
// 
// To change pitch on the note at index:
// VX.SETPITCH = (notes, index, vexKey)
class Cloner {
  constructor(notes, actor,options) {
      this.notes = notes;
      this.actor = actor ? actor : Cloner.nullActor;
      Vex.Merge(this, options);
  }
  static nullActor(note) {
      return note;
  }
    /** create a new note based on attributes of note.  If this is a 
    tuplet, create all the notes in the tuplet  **/
  CloneNote(iterator,note) {
    var self = this;
    var ts = note.tupletStack;
    if (ts.length == 0) {
      var vexKey = note.keys;
      var noteType = note.noteType;
     
        var vexDuration = vexMusic.ticksToDuration[note.ticks.numerator / note.ticks.denominator];
       
      var nn = new VF.StaveNote({
        clef: note.clef,
        keys: vexKey,
        duration: vexDuration,
        noteType:noteType
      });
       
          nn=this.actor(nn, iterator);      
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
        nn = self.actor(nn, iterator);
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

VX.CLONE = (notes, actor,options) => {
  var cloner = new Cloner(notes, actor,options);
  cloner.Clone();
  return cloner.notes;
}

class AccidentalChange {
    constructor(notes, index) {
        this.notes = notes;
        this.index = index;
        this.target = notes[index];
    }
    modNote(note, index) {
        if (index == this.index) {
            for (var i = 0; i < note.keys.length; ++i) {
                note.addAccidental(i, new VF.Accidental(this.accidental));
            }
            if (this.setCautionary) {
                note.modifiers
                    .filter(function(modifier) {
                        return modifier.getAttribute('type') === 'Accidental';
                    })
                    .forEach(function(accid) {
                        accid.setAsCautionary();
                    });
            }
        }
        return note;
    }
    SetAccidental(a) {
        this.accidental = a;
        var self = this;
        this.setCautionary = true;
        var accidentals = this.target.getAccidentals();
        if (accidentals) {
            accidentals.forEach(function(accid) {
                if (accid.cautionary) {
                    self.setCautionary = false;
                }
            });
        }
        var notes = this.notes;
        var note = notes[this.index];
        return VX.CLONE(notes, (note, index) => { return self.modNote(note, index); });
    }
}

VX.TRANSPOSE = (notes, selections,offset,keySignature) => {
    // used to decide whether to specify accidental.
    if (!keySignature) {
        keySignature = 'C';
    }
    notes = VX.CLONE(notes,
        (note, iterator) => {
            var index = iterator.index;
            if (selections.indexOf(index) < 0) {
                return note;
            }
            var keys=[];
            VX.PITCHITERATE(note,
                keySignature,
                (iterator, index) => {
                    keys.push(vexMusic.getKeyOffset(note.keyProps[index], offset));
                });
            return new VF.StaveNote({
                clef: note.clef,
                keys: keys,
                duration: note.duration
            });
        });

    return notes;
}

VX.SETPITCH = (notes, selections, vexKey) => {
    // used to decide whether to specify accidental.
    notes = VX.CLONE(notes,
        (note, iterator) => {
            var index = iterator.index;

            if (selections.indexOf(index) < 0) {
                return note;
            }
            return new VF.StaveNote({
                clef: note.clef,
                keys: vexKey,
                duration: note.duration,
                noteType:note.noteType
            });
        });

    return notes;
}

VX.SETNOTETYPE = (notes, selections, noteType) => {
    // used to decide whether to specify accidental.
    notes = VX.CLONE(notes,
        (note, iterator) => {
            var index = iterator.index;

            if (selections.indexOf(index) < 0) {
                return note;
            }
            return new VF.StaveNote({
                clef: note.clef,
                keys: note.keys,
                duration: note.duration+noteType
            });
        });

    return notes;
}

VX.ACCIDENTAL = (notes, index,accidental) => {
    var changer = new AccidentalChange(notes, index);
    return changer.SetAccidental(accidental);
}

VX.ENHARMONIC = (notes, selections,keySignature) => {
    // used to decide whether to specify accidental.
    notes = VX.CLONE(notes,
        (note, iterator) => {
            var index = iterator.index;

            if (selections.indexOf(index) < 0) {
                return note;
            }
            var keys=[];
            VX.PITCHITERATE(note,
                keySignature,
                (iterator, index) => {
                    keys.push(vexMusic.getEnharmonic(note.keyProps[index]));
                });
            return new VF.StaveNote({
                clef: note.clef,
                keys: keys,
                duration: note.duration
            });            
        });

    return notes;
}