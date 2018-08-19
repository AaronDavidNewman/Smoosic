
VF = Vex.Flow;
Vex.Xform = (typeof (Vex.Xform)=='undefined' ? {} : Vex.Xform);
VX = Vex.Xform;


/**
  * Utilities I wish were in VF.Music but aren't
  **/
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
	
	// ### ticksToDuration
	// ### Description:
	// Frequently we double/halve a note duration, and we want to find the vex tick duration that goes with that.
    static get ticksToDuration  () {
        var durations = ["1/2", "1", "2", "4", "8", "16", "32", "64", "128", "256"];
        var ticksToDuration = {};
        var _ticksToDurations = function () {
            for (var i = 0; i < durations.length - 1; ++i) {
                var dots = '';
                var ticks = 0;
				
				// We support up to 4 'dots'
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

class Selection {
	
	constructor() {
		this.ticks={};
	}
	addNote(tickableIndex,note) {
		if (typeof(this.ticks[tickableIndex]) == 'undefined') {
			this.ticks[tickableIndex]=[];
		}
		for (var i = 0; i < note.keyProps.length; ++i) {
			this.ticks[tickableIndex].push(i);
		}
		return this;
	}
	addPitch(tickableIndex,pitchIndex) {
		if (typeof(this.ticks[tickableIndex]) == 'undefined') {
			this.ticks[tickableIndex]=[];
		}
		if (this.ticks[tickableIndex].indexOf(pitchIndex)) {
			return;
		}
	    this.ticks[tickableIndex].push(pitchIndex);		
		return this;
	}
	static selectChords(notes,selection) {
		var rv = new Selection();
		if (typeof(selection)==="number") {
			rv.addNote(selection,notes[selection]);
		} else if (Array.isArray(selection)) {
			for (var i=0;i<selection.length;++i) {
				rv.addNote(notes[selection[i]],selection[i]);
			}
		}
		return rv;
	}
	tickArray() {
		return Object.keys(this.ticks);
	}
	containsPitch(tick,pitchIndex) {
		return (this.ticks[tick] && (this.ticks[tick].indexOf(pitchIndex) >= 0));
	}
	noteSelections(notes) {
		var ar=this.tickArray();
		var rv = [];
		for (var i=0;i<ar.length;++i) {
			rv.push(notes[ar[i]]);
		}
		return rv;
	}
}