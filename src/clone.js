
VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
	 : Vex.Xform);
VX = Vex.Xform;

// ## Description
//  A transform a slice of a note array.  This can be useful when re-rendering a staff.
//  If you only need to change certain parts, the default transformation keeps the 
//  original note.
//
// Transformer is an iterator.  It will call you back after each note and allow you to
// add modifier or make modifications.
//
// ## Usage:
// var ar1 = VX.TRANSFORM(notes, actor,{start: 0,end: index,notifier:this});
// actor is an callback method that takes and returns the note.  It can be used
// to change pitch, or as an iterator.  If not supplied, a default is provided
//
// To change pitch on the note at index:
// VX.SETPITCH = (notes, index, vexKey)
class Transformer {
	constructor(notes, actor, options) {
		this.notes = notes;
		this.actor = actor ? actor : Transformer.nullActor;
		this.keySignature = 'C';
		this.accidentalMap = [];
		Vex.Merge(this, options);
	}
	static nullActor(note) {
		return note;
	}	

	updateNoteAccidental(iterator,note) {
		for (var i = 0; i < note.keyProps.length; ++i) {
			var prop = note.keyProps[i];
			var letter = prop.key[0].toLowerCase();
		}		
	}

	static hasActiveAccidental(key, pitchIndex, accidentalMap) {
	    var vexKey = key.split('/')[0];
	    var duration = key.split('/')[1];
	    var letter = key[0];
	    var accidental = key.length > 1 ? vexKey[1] : 'n';

	    // Back up the accidental map until we have a match, or until we run out
	    for (var i = accidentalMap.length; i > 0; --i) {
	        var map = accidentalMap[i - 1];
	        var mapKeys = Object.keys(map);
	        for (var j = 0; j < mapKeys.length; ++j) {
	            var mapKey = mapKeys[j];
	            // The letter name + accidental in the map
	            var mapLetter = map[mapKey];
	            var mapAcc = mapLetter.length > 1 ? mapLetter[1] : 'n';

	            // if the letters match and not the accidental...
	            if (mapLetter.toLowerCase()[0] === letter && mapAcc != accidental) {
	                return true;
	            }
	        }
	    }
		return false;
	}
	
    // ## setAccidentalForKey	
	//
	// ## Description:
	// Keep track of the active accidentals at each tickable
	static setAccidentalForKey(note,accidentalMap) {
		var vexKeys=note.keys;
		// Still needs some work...
		for(var k=0;k<vexKeys.length;++k) {
			// get the letter and accidental #bn of the note
			// TODO:  bb ##
			var vexKey = vexKeys[k].split('/')[0];
			var duration=vexKeys[k].split('/')[1];
			var letter = vexKey[0];
			var accidental = vexKey.length>1 ? vexKey[1] : 'n';
			var match=false;
			
			// Back up the accidental map until we have a match, or until we run out
			for (var i = accidentalMap.length;i>0 && match==false;--i) {
				var map = accidentalMap[i-1];
				var mapKeys = Object.keys(map);
				for (var j=0;j<mapKeys.length;++j) {
					var mapKey=mapKeys[j];
					// The letter name + accidental in the map
					var mapLetter = map[mapKey];
					var mapAcc= mapLetter.length>1?mapLetter[1]:'n';
					
					// if the letters match and not the accidental...
					if (mapLetter.toLowerCase()[0]===letter && mapAcc != accidental) {
						note.addAccidental(k,new VF.Accidental(accidental));
						match=true;
						break;
					}
				}
			}
		}
	}
		
	/** create a new note based on attributes of note.  If this is a
	tuplet, create all the notes in the tuplet  **/
	transformNote(iterator, note) {
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
					noteType: noteType
				});
			this.updateAccidentalMap(iterator, note);
			nn = this.actor(nn, iterator, this.accidentalMap);
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
		var tupletActor = function (iterator, notes, note) {
			var vexKey = note.keys;
			var nn = new VF.StaveNote({
					clef: note.clef,
					keys: vexKey,
					duration: note.duration
				});
			self.updateAccidentalMap(iterator, note);
			nn = self.actor(nn, iterator,self.accidentalMap);
			ar.push(nn);
		};
		VX.ITERATE(tupletActor, tuplet.notes);
		new Vex.Flow.Tuplet(ar,tupletData);
		return ar;
	}

	run() {
		var notes = this.notes;
		if (typeof(this['start'])==='undefined') 
			this.start=0;
		if (typeof(this['end'])==='undefined') 
			this.end=this.notes.length;

		var start = this.start;
		var end = this.end;
		
		var ar = [];
		var self = this;
		VX.ITERATE((iterator, notes, note) => {
			ar = ar.concat(self.transformNote(iterator, note));
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

VX.TRANSFORM = (notes, actor, options) => {
	var transformer = new Transformer(notes, actor, options);
	transformer.run();
	return transformer.notes;
}

// ## A note transformer is just a function that modifies a note in some way.
// Any number of transformers can be applied to a note.
class NoteTransformBase {
	constructor() {
	}
	transformNote(note, iterator,accidentalMap) {
        return note;
    }
}

// ## TransformChain
// ## Description:
// Allow multiple transforms to be done on the same set of notes.  This can be useful when adding a chain of 
// modifiers (e.g. dots, accidentals) to some notes.
class TransformChain extends TickIteratorChain {
	constructor(notes) {
		this._notes = notes;
		this.chain=[];
	}
	
	get notes() {return this._notes;}
	
	// ### addModifier
	// ### Description: Add an actor that can modify the note.  The actor in this case will be 
	//    an object with a method:
	// 
	//       transformNote(note,iterator,accidentalMap);
	//   These will be called for each tickable.
	addModifier(actor) {
		if (!actor instanceof NoteTransformBase) {
			throw "A modifier must implement the interface described in NoteTransformBase";
		}
		this.chain.push(actor);
		return this;
	}
	
	//  ### run
	//  ###  Description:  start the transform on this set of notes
	run(options) {
		this._notes = VX.TRANSFORM (this._notes,(note,iterator,accidentalMap) => {
			for (var i=0;i<this.chain.length;++i) {
				note = this.chain[i].transformNote(note,iterator,accidentalMap);
			}
			return note;
		},options);
		return this;
	}
	static Create(notes,actor) {
		var rv = new TransformChain(notes);
		if (actor) rv.addModifier(actor);
		return rv;
	}
}

class FluentDot  extends NoteTransformBase {
    constructor() { super();}
    static Create() {
        return new FluentDot();
    }
    transformNote(note, iterator,accidentalMap) {
        if (note.dots > 0) {
            note.addDotToAll();
        }
        return note;
    }
}

class FluentAccidental extends NoteTransformBase {
	constructor(keySignature) {
		super();
		this.keySignature = keySignature;
		this.keyManager = new VF.KeyManager(this.keySignature);        
	}
	static Create(keySignature) {
		return new FluentAccidental(keySignature);
	}
    transformNote(note, iterator,accidentalMap)  {
	    var canon = VF.Music.canonical_notes;
        for (var i = 0; i < note.keys.length; ++i) {
                var prop = note.keyProps[i];
                var key = prop.key.toLowerCase();
				var accidental = (this.keyManager.scale.indexOf(canon.indexOf(key)) < 0);
				accidental = accidental && !Transformer.hasActiveAccidental(key,i,accidentalMap);
                if (accidental) {
                    if (!prop.accidental)
                        prop.accidental = 'n';
                    note.addAccidental(0, new VF.Accidental(prop.accidental));
                }
            }
		return note;
    }	
	
}

class FluentBeamer extends TickIteratorBase {
    constructor(voice,timeSignature) {
        super();
        this.voice = voice;
        this.duration = 0;
        this._beamGroups = [];
		this.timeSignature=timeSignature;
		this.meterNumbers = this.timeSignature.split('/').map(number => parseInt(number, 10));
		
		this.duration = 0;
        this.startRange = 0;
		// beam on 1/4 notes in most meter, triple time dotted quarter
        this.beamBeats = 2 * 2048;
		if (this.meterNumbers[0] % 3 == 0) {
            this.beamBeats = 3 * 2048;
        }
		this.skipNext = 0;
		this.beamGroup = false;
		this.currentGroup = [];
    }
    static Create(voice,timeSignature) {
        return new FluentBeamer(voice,timeSignature);
    }
	
	get beamGroups() {
		return this._beamGroups;
	}

    transformNote(note, iterator) {
		
		this.voice.addTickable(note);
		
		if (this.skipNext) {
		    this.skipNext -= 1;
		    if (this.beamGroup) {
		        this.currentGroup.push(note);
		        if (!this.skipNext) {
		            this._beamGroups.push(new VF.Beam(this.currentGroup));
		            this.beamGroup = false;
		            this.currentGroup = [];
		        }
		    }
		}
        this.duration += iterator.delta;
        if (note.tupletStack.length) {
            //todo: when does stack have more than 1?
            this.skipNext = note.tupletStack[0].notes.length;

            // Get an array of tuplet notes, and skip to the end of the tuplet
            if (iterator.delta < 4096) {
				this.beamGroup = true;
				this.currentGroup.push(note);                
            }
            return note;
        }
        // don't beam > 1/4 note in 4/4 time
        if (iterator.delta >= this.beamBeats) {
            this.duration = 0;
            this.startRange = iterator.index + 1;            
            return note;
        }
		this.currentGroup.push(note);
        if (this.duration == this.beamBeats) {

            this._beamGroups.push(new VF.Beam(this.currentGroup));
			this.currentGroup = [];
            this.startRange = iterator.index + 1;
            this.duration = 0;
            return note;
        }

        // If this does not align on a beat, don't beam it
        if (this.duration > this.beamBeats ||
            ((iterator.totalDuration - this.duration) % this.beamBeats != 0)) {
            this.duration = 0;
			this.currentGroup=[];
            return note;
        }
    }
}

VX.GET_BEAMS = (notes,voice,timeSignature) => {
	var beamer = FluentBeamer.Create(voice,timeSignature);
	TransformChain.Create(notes,beamer).run(); 
	return beamer.beamGroups;
}

VX.APPLY_MODIFIERS = (notes,keySignature) => {
	return TransformChain.Create(notes).addModifier(FluentDot.Create())
	.addModifier(FluentAccidental.Create(keySignature))
	.run({start:0,end:notes.length}).notes;
}

VX.CLONE = (notes,keySignature) => {
	keySignature = (keySignature) ? keySignature : 'c';
	return VX.APPLY_MODIFIERS(notes,keySignature);
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
				.filter(function (modifier) {
					return modifier.getAttribute('type') === 'Accidental';
				})
				.forEach(function (accid) {
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
			accidentals.forEach(function (accid) {
				if (accid.cautionary) {
					self.setCautionary = false;
				}
			});
		}
		var notes = this.notes;
		var note = notes[this.index];
		return VX.TRANSFORM(notes, (note, index) => {
			return self.modNote(note, index);
		});
	}
}

VX.TRANSPOSE = (notes, selections, offset, keySignature) => {
	// used to decide whether to specify accidental.
	if (!keySignature) {
		keySignature = 'C';
	}
	notes = VX.TRANSFORM(notes,
			(note, iterator, accidentalMap) => {
			var index = iterator.index;
			if (selections.tickArray().indexOf(index) < 0) {
				return note;
			}
			var keys = [];
			VX.PITCHITERATE(note,
				keySignature,
				(iterator, index) => {

				keys.push(vexMusic.getKeyOffset(note.keyProps[index], offset));
			});
			var changed = new VF.StaveNote({
				clef: note.clef,
				keys: keys,
				duration: note.duration
			});			

			return changed;
		});

	return notes;
}

VX.SETPITCH = (notes, selections, vexKey) => {
	notes = VX.TRANSFORM(notes,
			(note, iterator) => {
			var index = iterator.index;

			if (selections.tickArray().indexOf(index) < 0) {
				return note;
			}
			// TODO: preserve pitches not selected
			return new VF.StaveNote({
				clef: note.clef,
				keys: vexKey,
				duration: note.duration,
				noteType: note.noteType
			});
		});

	return notes;
}

VX.SETNOTETYPE = (notes, selections, noteType) => {
	// note to rest
	notes = VX.TRANSFORM(notes,
			(note, iterator) => {
			var index = iterator.index;

			if (selections.tickArray().indexOf(index) < 0) {
				return note;
			}			
			return new VF.StaveNote({
				clef: note.clef,
				keys: note.keys,
				duration: note.duration + noteType
			});
		});

	return notes;
}

VX.COURTESY = (notes, selections, keySignature) => {
	var ar = [];
	var addCourtesy = true;
	var ticks = selections.tickArray();
	
	notes = VX.TRANSFORM(notes,
			(note, iterator) => {
			var index = iterator.index;

			if (selections.tickArray().indexOf(index) < 0) {
				return notes[index];
			}

			note = notes[index];
			for (j=0;j<note.modifiers.length;++j) {
				var modifier = note.modifiers[j];
				if (selections.containsPitch(index,modifier.index)) {
					modifier.courtesy=!modifier.courtesy;
				}
			}

			return note; // TODO: add modifier
		});
	return notes;
}

VX.ENHARMONIC = (notes, selections, keySignature) => {
	// used to decide whether to specify accidental.
	var ticks=selections.tickArray();
	notes = VX.TRANSFORM(notes,
			(note, iterator) => {
			var index = iterator.index;

			if (ticks.indexOf(index) < 0) {
				return note;
			}
			var pitches=selections.getSelectedPitches(index);
			var keys = [];
			VX.PITCHITERATE(note,
				keySignature,
				(iterator, index) => {					
				if (pitches.indexOf(index) >= 0) {
					keys.push(vexMusic.getEnharmonic(note.keyProps[index]));
				} else {
					keys.push(note.keyProps[index]);
				}
			});
			return new VF.StaveNote({
				clef: note.clef,
				keys: keys,
				duration: note.duration
			});
		});

	return notes;
}
