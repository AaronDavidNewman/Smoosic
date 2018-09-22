
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
		var rootIndex = canon.indexOf(key);
        var index = (rootIndex + canon.length+offset) % canon.length;
        var octave = prop.octave;
        if (Math.abs(offset) >= 12) {
            var octaveOffset = Math.sign(offset) * Math.round(Math.abs(offset) / 12);
            octave += octaveOffset;
			offset = offset % 12;
        }
        if (rootIndex + offset >= canon.length) {
            octave += 1;
        }
        if (rootIndex + offset < 0) {
            octave -= 1;
        }
		var rv = JSON.parse(JSON.stringify(prop));
		key=canon[index];
		if (key.length>0) {
			rv.accidental=key.substring(1);
			key=key[0];
		}
		rv.key=key;
		rv.octave=octave;
        return rv;
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
            return ticksToDuration;
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
	
	static isTuplet(note) {
		return note['tuplet'] && note.tuplet['id'];
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
	
	static noteDebugRecurse(clone, level) {
        if (!level)
            level = 0;

        if (level > 2) {
            return '...';
        }
        var obj = {};
        var keys = Object.keys(clone);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            var attr = clone[key];
            if (attr) {
                if (key === 'glyph' || key === 'outline') {
                    obj[key] = '...';
                } else if (Array.isArray(attr)) {
                    obj[key] = [];
                    for (var j = 0; j < attr.length; ++j) {
                        obj[key].push(noteDebugRecurse(attr[j], level + 1))
                    }
                } else if (typeof(attr) != 'object') {
                    obj[key] = attr;
                } else {
                    obj[key] = noteDebugRecurse(attr, level + 1);
                }
            }
        }
        return obj;
    }
    static noteDebug (note) {
        console.log(JSON.stringify(noteDebugRecurse(note, 0), null, ' '));
    }
}

/**
 *  ## Selection
 *  represent a selection of notes as a 2-dimensional array
 *  ## Format
 *  selection = [
	 tickIndex:0,pitches:[0,1]
    ]
  *  ## Usages:
  *    selection.tickArray()
  *      Creates array of tick indices
  **/
class Selection {
	
	constructor(params) {
		this._obj=[];
		if (params && Array.isArray(params)) {
			this._obj=params;
		}
	}
	pitchArray(tickIndex) {
		
		for (var i=0;i<this._obj.length;++i) {			
			if (this._obj[i].tickIndex===tickIndex) {
				return this._obj[i].pitches;
			}
		}
		return [];
	}	
}
