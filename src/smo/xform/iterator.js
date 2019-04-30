
VF = Vex.Flow;
Vex.Xform = (typeof (Vex.Xform)=='undefined' ? {} : Vex.Xform);
VX = Vex.Xform;


// ## Description
// This file implements an iterator through a set of notes in a single measure.  
// This is useful when redrawing the notes to transform them into something else.   
// E.g. changing the duration of a note in a measure.  It keeps track of accidentals,
// ticks used etc.

// ## Usage:
// VX.ITERATE (actor, notes)
// where actor is a function that is called at each tick in the voice.
// 
// ## iterator format:
//   iterator: {
//      notes:[note1,note2...],
//      delta: tick value of this note
//      totalDuration: ticks up until this point
//      note: current note,
//      index: running index
//
// ## Tickmap format
// VX.TICKMAP(notes)
// Iterate through all notes and creates information about the notes, like
// tuplet ticks, index-to-tick map.
// 
//     tickmap = {
//        totalDuration: 16384,
//        accidentalMap:[{'F':'#','G':'b'},....
//        durationMap:[2048,4096,..],  // A running total
//        deltaMap:[2048,2048...], a map of deltas
//        tupletMap: {
//          noteId1: 
//          {startIndex:1,endIndex:3,numNotes:3,startTick:4096,endTick:8196,durations:[1365,...],smallestDuration:2048}
//
//        
class smoTickIterator {
	/**
	  measure looks like:
	  return {
            group: group,
            voice: voice,
            staff: stave,
            notes: notes,
            beams: this.beamGroups,
            keySignature: this.keySignature
        };
    }   **/
    constructor(measure,options) {
		this.notes=measure.notes;
		this.keySignature = measure.keySignature;
        this.index = 0;
        this.startIndex = 0;
        this.endIndex = this.notes.length;

        Vex.Merge(this,options);

        // so a client can tell if the iterator's been run or not
        var states = ['CREATED', 'RUNNING', 'COMPLETE'];
        this.state = 'CREATED';

        // ticks as we iterate.  
        // duration is duration of the current range
        this.duration = 0;
        // duration is the accumulated duraition over all the notes
        this.totalDuration = 0;
        // delta is the tick contribution of this note
        this.delta = 0;
        // the tick start location of notes[x]
        this.durationMap = [];
		this.deltaMap=[];

        this.tupletMap = {};
		this.accidentalMap=[];

        this.hasRun = false;
        this.beattime = 4096;
        if (this.voice)
            this.beattime = this.voice.time.resolution / this.voice.time.num_beats;

    }

    // ## Description:
    // empty function for a default iterator (tickmap)
    static nullActor() { }

	static _getAccidentalsForKey(key,map) {
		var music = new VF.Music();
		var keys = music.createScaleMap(key);
		var keyKeys=Object.keys(keys);
		keyKeys.forEach((keyKey) => {
			var key = keys[keyKey];
			var newObj={};
			if (key.length>1 && (key[1]==='b' || key[1] === '#')) {
				map[key[0]]={key:key[0],accidental:key[1]};
			}
		});
	}
	static updateAccidentalMap(note,iterator, keySignature,accidentalMap) {
		var sigObj = {};
		var newObj = {};
		if (iterator.index === 0) {
			smoTickIterator._getAccidentalsForKey(keySignature,newObj);
			sigObj=newObj;
		}
		else {
			sigObj = accidentalMap[iterator.index - 1];
		}
		for (var i = 0; i < note.keys.length; ++i) {
			var prop = note.keys[i];
			var letter = prop.key.toLowerCase();
			var sigLetter = letter+prop.accidental;
			var sigKey = vexMusic.getKeySignatureKey(letter, keySignature);
			
			if (sigObj && sigObj[letter]) {
				var currentVal = sigObj[letter].key+sigObj[letter].accidental;
				if (sigLetter != currentVal) {
					newObj[letter] = prop;
				}
			} else {
				if (sigLetter != sigKey) {
					newObj[letter] = prop;
				}
			}
		}
		accidentalMap.push(newObj);
	}
	
	static hasActiveAccidental(key, iteratorIndex, accidentalMap) {
		if (iteratorIndex === 0) 
			return false;
	    var vexKey = key.key;
	    var letter = vexKey;
	    var accidental = key.accidental.length > 0 ? key.accidental: 'n';		

	    // Back up the accidental map until we have a match, or until we run out
	    for (var i = iteratorIndex; i > 0; --i) {
	        var map = accidentalMap[i - 1];
	        var mapKeys = Object.keys(map);
	        for (var j = 0; j < mapKeys.length; ++j) {
	            var mapKey = mapKeys[j];
	            // The letter name + accidental in the map
	            var mapLetter = map[mapKey];
	            var mapAcc = mapLetter.accidental ? mapLetter.accidental : 'n';			

	            // if the letters match and the accidental...
	            if (mapLetter.key.toLowerCase() === letter && mapAcc == accidental) {
	                return true;
	            }
	        }
	    }
		return false;
	}
	getTupletInfo(index) {
		var tuplets = Object.keys(this.tupletMap);
		for (var i=0;i<tuplets.length;++i) {
			var tupletInfo = this.tupletMap[tuplets[i]];
			if (tupletInfo.startIndex <= index && tupletInfo.endIndex >= index) {
				return tupletInfo;
			}
		}
		return {};
	}

    // ## todo: is promise useful here?
    _iterate(actor) {
        this.state = 'RUNNING';
        for (this.index = this.startIndex; this.index < this.endIndex; ++this.index) {
            var note = this.notes[this.index];

            // save the starting point, tickwise
            this.durationMap.push(this.totalDuration);

            // the number of ticks for this note
            this.delta = (note.ticks.numerator / note.ticks.denominator) + note.ticks.remainder;
			this.deltaMap.push(this.delta);

            if (note['tuplet'] && note.tuplet['attrs']) {
                var normalizedTicks = VF.durationToTicks(note.duration);
                if (typeof (this.tupletMap[note.tuplet.attrs.id]) == 'undefined') {
                    this.tupletMap[note.tuplet.attrs.id] = {
                        startIndex: this.index,
						tupletIndex:0,
                        startTick: this.totalDuration,
                        smallestDuration: normalizedTicks,
						num_notes:note.tuplet.num_notes,
						durations:[this.delta]
                    };
                } else {
                    var entry = this.tupletMap[note.tuplet.attrs.id];

                    entry.endIndex = this.index;
                    entry.endTick = this.totalDuration + this.delta;
                    entry.smallestDuration = ((normalizedTicks < entry.smallestDuration) ? normalizedTicks : entry.smallestDuration);
					entry.durations.push(this.delta);
                }
            }

            // update the tick count for the current range.
            this.duration += this.delta;

            // update the tick count for the whole array/measure
            this.totalDuration += this.delta;
			
			smoTickIterator.updateAccidentalMap(note,this, this.keySignature,this.accidentalMap);

            var rv = actor(this,note,this.accidentalMap);
            if (rv === false) {
                break;
            }
        }
        this.state = 'COMPLETE';
    }
    iterate(actor) {
        // todo add promise
        this._iterate(actor);
    }
    
    // ## getTickIndex
    // get the index into notes array that takes up
    // duration of ticks */
    getTickIndex(index, duration) {
        if (index == 0)
            return 0;
        var initial = this.durationMap[index];
        var delta = 0;
        while (index < this.notes.length && delta < duration) {
            index += 1;
            delta += this.durationMap[index] - this.durationMap[index - 1];
        }
        return index;
    }
    // ## skipNext
    // ## Description:
    // skip some number of notes in the iteration, because we want to skip over them.
    skipNext(skipCount) {
        var rv = [];
        var startRange = this.index;
        // var tuplen = note.tupletStack[0].notes.length;
        var endRange = this.index + skipCount;
        rv = this.notes.slice(startRange, endRange);
        this.index = endRange;
        // this.startRange = this.index;
        return rv;
    }
}

class smoMeasureIterator {
	constructor(system,options) {
		this.measures=system.measures;
		this.index = this.startIndex = 0;
		this.endIndex = this.measures.length;
		Vex.Merge(this,options);
	}
	
	iterate(actor) {
		for (this.index=this.startIndex;this.index<this.endIndex;this.index+=1) {
			var measure=this.measures[this.index];
			actor(this,measure);
		}
	}
}

/* iterate over a set of notes, creating a map of notes to ticks */
VX.TICKMAP = (measure) => {
    var iterator = new smoTickIterator(measure);
	iterator.iterate(smoTickIterator.nullActor,measure);
	return iterator;
}

