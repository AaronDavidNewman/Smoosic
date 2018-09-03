
VF = Vex.Flow;
Vex.Xform = (typeof (Vex.Xform)=='undefined' ? {} : Vex.Xform);
VX = Vex.Xform;


// ## Description
// This file implements an iterator through a set of notes.  This is useful when
// redrawing the notes to transform them into something else.   E.g. changing the 
// pitch of one note.
//

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
class vxTickIterator {
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

	static updateAccidentalMap(note,iterator, keySignature,accidentalMap) {
		var sigObj = {};
		var newObj = {};
		if (iterator.index > 0) {
			sigObj = accidentalMap[iterator.index - 1];
		}
		for (var i = 0; i < note.keyProps.length; ++i) {
			var prop = note.keyProps[i];
			var letter = prop.key[0].toLowerCase();
			var sigKey = vexMusic.getKeySignatureKey(letter, keySignature);
			if (sigObj && sigObj[letter]) {
				if (prop.key != sigObj[letter]) {
					newObj[letter] = prop.key;
				}
			} else {
				if (prop.key.toLowerCase() != sigKey) {
					newObj[letter] = prop.key;
				}
			}
		}
		accidentalMap.push(newObj);
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
            this.delta = (note.ticks.numerator / note.ticks.denominator);
			this.deltaMap.push(this.delta);

            if (note.tupletStack.length) {
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
			
			vxTickIterator.updateAccidentalMap(note,this, this.keySignature,this.accidentalMap);

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

class NoteModifierBase {
	constructor(){}
	modifyNote(note, iterator,accidentalMap) {	}
}
	

class vxModifier {
	constructor(measure,actors) {
		this.actors=actors;
		this.measure=measure;
		
	}
	
	get iterator() {
		return this._iterator;
	}
	
	//  ### run
	//  ###  Description:  start the iteration on this set of notes
	run() {
		var self=this;
		var iterator = new vxTickIterator(this.measure);
		iterator.iterate((iterator,note,accidentalMap) => {
			for (var i=0;i<self.actors.length;++i) {
				self.actors[i].modifyNote(iterator,note,accidentalMap);
			}
		});
	}
}


/* iterate over a set of notes, creating a map of notes to ticks */
VX.TICKMAP = (measure) => {
    var iterator = new vxTickIterator(measure);
	iterator.iterate(Iterator.nullActor,measure);
	return iterator;
}

