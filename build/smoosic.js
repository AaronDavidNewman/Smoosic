
VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
	 : Vex.Xform);
VX = Vex.Xform;

// ## smoMusic
// Helper functions that build on the VX music theory routines, and other
// utilities I wish were in VF.Music but aren't
// ### Note on pitch and duration format
// We use some VEX music theory routines and frequently need to convert
// formats from SMO format.
//
// `Smo` uses pitch JSON:
// ``javascript``
//  {note:'c',accidental:'#',octave:4}
// `Vex` usually uses a canonical string:
//  'c#/4'
//  Depending on the operation, the octave might be omitted
//
// `Smo` uses a JSON for duration always:
// ``javascript``
// {numerator:4096,denominator:1,remainder:0}
//
// `VexFlow` uses a letter duration ('4' for 1/4 note) and 'd' for dot.
// I try to indicate whether I am using vex or smo notation
// ## smoMusic static methods:
// ---
class smoMusic {

	// ### vexToCannonical
	// return Vex canonical note enharmonic - e.g. Bb to A#
	// Get the canonical form
	static vexToCannonical(vexKey) {
		vexKey = smoMusic.stripVexOctave(vexKey);
		return VF.Music.canonical_notes[VF.Music.noteValues[vexKey].int_val];
	}

	// ### circleOfFifths
	// A note array in key-signature order
	static get circleOfFifths() {
		return [{
				letter: 'c',
				accidental: 'n'
			}, {
				letter: 'g',
				accidental: 'n'
			}, {
				letter: 'd',
				accidental: 'n'
			}, {
				letter: 'a',
				accidental: 'n'
			}, {
				letter: 'e',
				accidental: 'n'
			}, {
				letter: 'b',
				accidental: 'n'
			}, {
				letter: 'f',
				accidental: '#'
			}, {
				letter: 'c',
				accidental: '#'
			}, {
				letter: 'a',
				accidental: 'b'
			}, {
				letter: 'e',
				accidental: 'b'
			}, {
				letter: 'b',
				accidental: 'b'
			}, {
				letter: 'f',
				accidental: 'n'
			}
		];
	}

	// ### circleOfFifthsIndex
	// gives the index into circle-of-fifths array for a pitch, considering enharmonics.
	static circleOfFifthsIndex(smoPitch) {
		var en1 = smoMusic.vexToSmoPitch(smoMusic.getEnharmonic(smoMusic.pitchToVexKey(smoPitch)));
		var en2 = smoMusic.vexToSmoPitch(smoMusic.getEnharmonic(smoMusic.getEnharmonic(smoMusic.pitchToVexKey(smoPitch))));
		var ix = smoMusic.circleOfFifths.findIndex((el) => {
				return (el.letter === smoPitch.letter && el.accidental == smoPitch.accidental) ||
				(el.letter == en1.letter && el.accidental == en1.accidental) ||
				(el.letter == en2.letter && el.accidental == en2.accidental);
			});
		return ix;
	}

	// ### addSharp
	// Get pitch to the right in circle of fifths
	static addSharp(smoPitch) {
		var rv = smoMusic.circleOfFifths[
				(smoMusic.circleOfFifthsIndex(smoPitch) + 1) % smoMusic.circleOfFifths.length];
		rv = JSON.parse(JSON.stringify(rv));
		rv.octave = smoPitch.octave;
		return rv;
	}

	// ### addFlat
	// Get pitch to the left in circle of fifths
	static addFlat(smoPitch) {
		var rv = smoMusic.circleOfFifths[
				((smoMusic.circleOfFifths.length - 1) + smoMusic.circleOfFifthsIndex(smoPitch)) % smoMusic.circleOfFifths.length];
		rv = JSON.parse(JSON.stringify(rv));
		rv.octave = smoPitch.octave;
		return rv;
	}

	// ### addSharps
	// Add *distance* sharps/flats to given key
	static addSharps(smoPitch, distance) {
		if (distance == 0) {
			return JSON.parse(JSON.stringify(smoPitch));
		}
		var rv = smoMusic.addSharp(smoPitch);
		for (var i = 1; i < distance; ++i) {
			rv = smoMusic.addSharp(rv);
		}
		var octaveAdj = smoMusic.letterPitchIndex[smoPitch.letter] > smoMusic.letterPitchIndex[rv.letter] ? 1 : 0;
		rv.octave += octaveAdj;
		return rv;
	}

	// ### addFlats
	// Add *distance* sharps/flats to given key
	static addFlats(smoPitch, distance) {
		if (distance == 0) {
			return JSON.parse(JSON.stringify(smoPitch));
		}
		var rv = smoMusic.addFlat(smoPitch);
		for (var i = 1; i < distance; ++i) {
			rv = smoMusic.addFlat(rv);
		}
		var octaveAdj = smoMusic.letterPitchIndex[smoPitch.letter] > smoMusic.letterPitchIndex[rv.letter] ? 1 : 0;
		rv.octave += octaveAdj;
		return rv;
	}

	// ### smoPitchesToVexKeys
	// Transpose and convert from SMO to VEX format so we can use the VexFlow tables and methods
	static smoPitchesToVexKeys(pitchAr, keyOffset) {
		var noopFunc = keyOffset > 0 ? 'addSharps' : 'addFlats';

		var rv = [];
		pitchAr.forEach((pitch) => {
			rv.push(smoMusic.pitchToVexKey(smoMusic[noopFunc](pitch, keyOffset)));
		});
		return rv;
	}

	static get scaleIntervals() {
		return {
			up: [2, 2, 1, 2, 2, 2, 1],
			down: [1, 2, 2, 2, 1, 2, 2]
		};
	}

	// ### smoScalePitchMatch
	// return true if the pitches match, but maybe not in same octave
	static smoScalePitchMatch(p1, p2) {
		var pp1 = JSON.parse(JSON.stringify(p1));
		var pp2 = JSON.parse(JSON.stringify(p2));
		pp1.octave = 0;
		pp2.octave = 0;

		return smoMusic.smoPitchToInt(pp1) == smoMusic.smoPitchToInt(pp2);
	}

    // ### pitchToLedgerLineInt
    static pitchToLedgerLine(clef,pitch) {
        // return the distance from the top ledger line, as 0.5 per line/space
        return -1.0*(VF.keyProperties(smoMusic.pitchToVexKey(pitch,clef)).line-4.5)
         - VF.clefProperties.values[clef].line_shift;
    }

    // ### pitchToVexKey
    // convert from SMO to VEX format so we can use the VexFlow tables and methods
    // example:
    // 	`{letter,octave,accidental}` object to vexKey string `'f#'`
    static pitchToVexKey(smoPitch) {
        // Convert to vex keys, where f# is a string like 'f#'.
        var vexKey = smoPitch.letter.toLowerCase();
        if (smoPitch.accidental.length === 0) {
            vexKey = vexKey + 'n';
        } else {
            vexKey = vexKey + smoPitch.accidental;
        }
        if (smoPitch['octave']) {
            vexKey = vexKey + '/' + smoPitch.octave;
        }
        return vexKey;
    }

	static smoPitchToInt(pitch) {
		var intVal = VF.Music.noteValues[
				smoMusic.stripVexOctave(smoMusic.pitchToVexKey(pitch))].int_val;
		return pitch.octave * 12 + intVal;
	}

	static smoIntToPitch(intValue) {
		var letterInt = intValue % 12;
		var noteKey = Object.keys(VF.Music.noteValues).find((key) => {
				return VF.Music.noteValues[key].int_val === letterInt;
			});
		var octave = Math.floor(intValue / 12);
        var accidental = noteKey.substring(1, noteKey.length);
        accidental = accidental ? accidental : 'n';
		return {
			letter: noteKey[0],
			accidental: accidental,
			octave: octave
		};
	}

	// ### get enharmonics
	// return a map of enharmonics for choosing or cycling.  notes are in vexKey form.
	static get enharmonics() {
		var rv = {};
		var keys = Object.keys(VF.Music.noteValues);
		for (var i = 0; i < keys.length; ++i) {
			var key = keys[i];
			var int_val = VF.Music.noteValues[key].int_val;
			if (typeof(rv[int_val.toString()]) == 'undefined') {
				rv[int_val.toString()] = [];
			}
			// only consider natural note 1 time.  It is in the list twice for some reason.
			if (key.indexOf('n') == -1) {
				rv[int_val.toString()].push(key);
			}
		}
		return rv;
	}

	static getEnharmonics(vexKey) {
		var proto = smoMusic.stripVexOctave(vexKey);
		var rv = [];
		var ne = smoMusic.getEnharmonic(vexKey);
		rv.push(proto);
		while (ne[0] != proto[0]) {
			rv.push(ne);
			ne = smoMusic.getEnharmonic(ne);
		}
		return rv;
	}

    // ### getEnharmonic(noteProp)
	// cycle through the enharmonics for a note.
	static getEnharmonic(vexKey) {
		vexKey = smoMusic.stripVexOctave(vexKey);
		var intVal = VF.Music.noteValues[vexKey.toLowerCase()].int_val;
		var ar = smoMusic.enharmonics[intVal.toString()];
		var len = ar.length;
		// 'n' for natural in key but not in value
		vexKey = vexKey.length > 1 && vexKey[1] === 'n' ? vexKey[0] : vexKey;
		var ix = ar.indexOf(vexKey);
		vexKey = ar[(ix + 1) % len];
		return vexKey;
	}

	// ### getKeyFriendlyEnharmonic
	// fix the enharmonic to match the key, if possible
	// `getKeyFriendlyEnharmonic('b','eb');  => returns 'bb'
	static getKeyFriendlyEnharmonic(letter, keySignature) {
		var rv = letter;
		var muse = new VF.Music();
		var scale = Object.values(muse.createScaleMap(keySignature));
		var prop = smoMusic.getEnharmonic(letter.toLowerCase());
		while (prop.toLowerCase() != letter.toLowerCase()) {
			for (var i = 0; i < scale.length; ++i) {
				var skey = scale[i];
				if ((skey[0] == prop && skey[1] == 'n') ||
					(skey.toLowerCase() == prop.toLowerCase())) {
					rv = skey;
					break;
				}
			}
			prop = (prop[1] == 'n' ? prop[0] : prop);
			prop = smoMusic.getEnharmonic(prop);
		}
		return rv;
	}
	static closestTonic(smoPitch, vexKey, direction) {
		direction = Math.sign(direction) < 0 ? -1 : 1;
		var tonic = smoMusic.vexToSmoPitch(vexKey);
		tonic.octave=smoPitch.octave;
		var iix = smoMusic.smoPitchToInt(smoPitch);
		var smint=smoMusic.smoPitchToInt(tonic);
		if (Math.sign(smint - iix) != direction) {
			tonic.octave += direction
		}
		return tonic;
	}

	static getEnharmonicInKey(smoPitch, keySignature) {
		var ar = smoMusic.getEnharmonics(smoMusic.pitchToVexKey(smoPitch));
		var rv = smoMusic.stripVexOctave(smoMusic.pitchToVexKey(smoPitch));
		var scaleMap = new VF.Music().createScaleMap(keySignature);
		ar.forEach((vexKey) => {
			if (vexKey.length === 1) {
				vexKey += 'n';
			}
			if (vexKey === scaleMap[vexKey[0]]) {
				rv = vexKey;
			}
		});
		var smoRv = smoMusic.vexToSmoPitch(rv);
		smoRv.octave = smoPitch.octave;
		var rvi = smoMusic.smoPitchToInt(smoRv);
		var ori = smoMusic.smoPitchToInt(smoPitch);
		// handle the case of c0 < b0, pitch-wise
		smoRv.octave += Math.sign(ori - rvi);
		return smoRv;
	}

	// ### getIntervalInKey
	// give a pitch and a key signature, return another pitch at the given
	// diatonic interval.  Similar to getKeyOffset but diatonic.
	static getIntervalInKey(pitch, keySignature, interval) {
		if (interval === 0)
			return JSON.parse(JSON.stringify(pitch));

		var delta = interval > 0 ? 1 : -1;
		var inv = -1 * delta;
		var tonic = smoMusic.closestTonic(pitch, keySignature, inv);
		var intervals = delta > 0 ? smoMusic.scaleIntervals.up : smoMusic.scaleIntervals.down;
		var pitchInt = smoMusic.smoPitchToInt(pitch);
		var scaleIx = 0;
		var diatonicIx=0;

		var nkey = tonic;
		var nkeyInt = smoMusic.smoPitchToInt(nkey);
		while (Math.sign(nkeyInt - pitchInt) != delta && Math.sign(nkeyInt - pitchInt) != 0) {
			nkey = smoMusic.smoIntToPitch(smoMusic.smoPitchToInt(nkey) + delta * intervals[scaleIx]);
			scaleIx = (scaleIx + 1) % 7;
			nkeyInt = smoMusic.smoPitchToInt(nkey);
		}
		while (diatonicIx != interval) {
			nkey = smoMusic.smoIntToPitch(smoMusic.smoPitchToInt(nkey) + delta * intervals[scaleIx]);
			scaleIx = (scaleIx + 1) % 7;
			diatonicIx += delta;
		}
		return smoMusic.getEnharmonicInKey(nkey,keySignature);
	}

	static vexKeySignatureTranspose(key, transposeIndex) {
		var key = smoMusic.vexToSmoPitch(key);
		key = smoMusic.smoPitchesToVexKeys([key], transposeIndex)[0];
		key = smoMusic.stripVexOctave(key);
		key = key[0].toUpperCase() + key.substring(1, key.length);
		if (key.length > 1 && key[1] === 'n') {
			key = key[0];
		}
		return key;
	}
    static get frequencyMap() {
        return suiAudioPitch.pitchFrequencyMap;
    }

	// ### get letterPitchIndex
	// Used to adjust octave when transposing.
	// Pitches are measured from c, so that b0 is higher than c0, c1 is 1 note higher etc.
	static get letterPitchIndex() {
		return {
			'c': 0,
			'd': 1,
			'e': 2,
			'f': 3,
			'g': 4,
			'a': 5,
			'b': 6
		};
	}

	// ### letterChangedOctave
	// Indicate if a change from letter note 'one' to 'two' needs us to adjust the
	// octave due to the `smoMusic.letterPitchIndex` (b0 is higher than c0)
	static letterChangedOctave(one, two) {
		var p1 = smoMusic.letterPitchIndex[one];
		var p2 = smoMusic.letterPitchIndex[two];
		if (p1 < p2 && p2 - p1 > 2)
			return -1;
		if (p1 > p2 && p1 - p2 > 2)
			return 1;
		return 0;

	}

	// ### vexToSmoPitch
	// #### Example:
	// ['f#'] => [{letter:'f',accidental:'#'}]
	static vexToSmoPitch(vexPitch) {
		var accidental = vexPitch.length < 2 ? 'n' : vexPitch.substring(1, vexPitch.length);
		return {
			letter: vexPitch[0].toLowerCase(),
			accidental: accidental
		};
	}

    // ### smoPitchToVes
	// #### Example:
    // {letter:'f',accidental:'#'} => [f#/
    static smoPitchesToVex(pitchAr) {
        var rv = [];
        pitchAr.forEach((p) => {
            rv.push(smoMusic.pitchToVexKey(p));
        });
        return rv;
    }

	static stripVexOctave(vexKey) {
		if (vexKey.indexOf('/') > 0) {
			vexKey = vexKey.substring(0, vexKey.indexOf('/'))
		}
		return vexKey;
	}


	// ### getKeyOffset
	// Given a vex noteProp and an offset, offset that number
	// of 1/2 steps.
	// #### Input:  smoPitch
	// #### Output:  smoPitch offset, not key-adjusted.
	static getKeyOffset(pitch, offset) {
		var canon = VF.Music.canonical_notes;

		// Convert to vex keys, where f# is a string like 'f#'.
		var vexKey = smoMusic.pitchToVexKey(pitch);
		vexKey = smoMusic.vexToCannonical(vexKey);
		var rootIndex = canon.indexOf(vexKey);
		var index = (rootIndex + canon.length + offset) % canon.length;
		var octave = pitch.octave;
		if (Math.abs(offset) >= 12) {
			var octaveOffset = Math.sign(offset) * Math.floor(Math.abs(offset) / 12);
			octave += octaveOffset;
			offset = offset % 12;
		}
		if (rootIndex + offset >= canon.length) {
			octave += 1;
		}
		if (rootIndex + offset < 0) {
			octave -= 1;
		}
		var rv = JSON.parse(JSON.stringify(pitch));
		vexKey = canon[index];
		if (vexKey.length > 1) {
			rv.accidental = vexKey.substring(1);
			vexKey = vexKey[0];
		} else {
			rv.accidental = '';
		}
		rv.letter = vexKey;
		rv.octave = octave;
		return rv;
	}

	// ### keySignatureLength
	// return the number of sharp/flat in a key signature for sizing guess.
	static get keySignatureLength() {
		return {
			'C': 0,
			'B': 5,
			'A': 3,
			'F#': 6,
			'Bb': 2,
			'Ab': 4,
			'Gg': 6,
			'G': 1,
			'F': 1,
			'Eb': 3,
			'Db': 5,
			'Cb': 7,
			'C#': 7,
			'F#': 6,
			'E': 4,
			'D': 2
		};
	}

	static getSharpsInKeySignature(key) {
		var sharpKeys = ['B','G','D','A','E','B','F#','C#'];
		if (sharpKeys.indexOf[key] < 0) {
			return 0;
		}
		return smoMusic.keySignatureLength[key];
	}

	static getFlatsInKeySignature(key) {
		var flatKeys = ['F','Bb','Eb','Ab','Db','Gb','Cb'];
		if (flatKeys.indexOf[key] < 0) {
			return 0;
		}
		return smoMusic.keySignatureLength[key];
	}

    static timeSignatureToTicks(timeSignature) {
        var nd = timeSignature.split('/');
        var num = parseInt(nd[0]);
        var den = parseInt(nd[1]);

        var base = 2048*(8/den);
        return base*num;
    }
    static smoTicksToVexDots(ticks) {
        var vd = smoMusic.ticksToDuration[ticks];
        var dots = (vd.match(/d/g) || []).length;
        return dots;
    }
	// ## closestVexDuration
	// ## Description:
	// return the closest vex duration >= to the actual number of ticks. Used in beaming
	// triplets which have fewer ticks then their stem would normally indicate.
	static closestVexDuration(ticks) {
		var stemTicks = VF.RESOLUTION;

		// The stem value is the type on the non-tuplet note, e.g. 1/8 note
		// for a triplet.
		while (ticks <= stemTicks) {
			stemTicks = stemTicks / 2;
		}

		stemTicks = stemTicks * 2;
		return smoMusic.ticksToDuration[stemTicks];
		var ix = Object.keys(smoMusic.ticksToDuration).findIndex((x) => {
				return x >= ticks
			});
		return smoMusic.ticksToDuration[durations[ix]];
	}

	// ### getKeySignatureKey
	// given a letter pitch (a,b,c etc.), and a key signature, return the actual note
	// that you get without accidentals
	// ### Usage:
	//   smoMusic.getKeySignatureKey('F','G'); // returns f#
	static getKeySignatureKey(letter, keySignature) {
		var km = new VF.KeyManager(keySignature);
		return km.scaleMap[letter];
	}

    static getAccidentalForKeySignature(smoPitch,keySignature) {
        var vexKey = smoMusic.getKeySignatureKey(smoPitch.letter,keySignature);
        return vexKey.length == 1 ? 'n' : vexKey.substr(1,vexKey.length - 1);
    }

    // ### isPitchInKeySignature
    // Return true if the pitch is not an accidental in the give key, e.g.
    // f# in 'g' or c in 'Bb'
    static isPitchInKeySignature(smoPitch,keySignature) {
        var vexKey = smoMusic.getKeySignatureKey(smoPitch.letter,keySignature);
        return (vexKey.length == 1 && smoPitch.accidental == 'n' ||
            (vexKey[1]==smoPitch.accidental));
    }

	// ### Description:
	// Get ticks for this note with an added dot.  Return
	// identity if that is not a supported value.
	static getNextDottedLevel(ticks) {
		var ttd = smoMusic.ticksToDuration;
		var vals = Object.values(ttd);

		var ix = vals.indexOf(ttd[ticks]);
		if (ix >= 0 && ix < vals.length && vals[ix][0] == vals[ix + 1][0]) {
			return smoMusic.durationToTicks(vals[ix + 1]);
		}
		return ticks;
	}

	// ### Description:
	// Get ticks for this note with one fewer dot.  Return
	// identity if that is not a supported value.
	static getPreviousDottedLevel(ticks) {
		var ttd = smoMusic.ticksToDuration;
		var vals = Object.values(ttd);
		var ix = vals.indexOf(ttd[ticks]);
		if (ix > 0 && vals[ix][0] == vals[ix - 1][0]) {
			return smoMusic.durationToTicks(vals[ix - 1]);
		}
		return ticks;
	}


	// ### ticksToDuration
	// Frequently we double/halve a note duration, and we want to find the vex tick duration that goes with that.
	static get ticksToDuration() {
		var durations = ["1/2", "1", "2", "4", "8", "16", "32", "64", "128", "256"];
		smoMusic._ticksToDuration = smoMusic['_ticksToDuration'] ? smoMusic._ticksToDuration : null;
		var _ticksToDurationsF = function () {
            var ticksToDuration = smoMusic._ticksToDuration = {};
			for (var i = 0; i < durations.length - 1; ++i) {
				var dots = '';
				var ticks = 0;

				// We support up to 4 'dots'
				for (var j = 0; j <= 4 && j + i < durations.length; ++j) {
					ticks += VF.durationToTicks.durations[durations[i + j]];
					ticksToDuration[ticks.toString()] = durations[i] + dots;
					dots += 'd'
				}
			}
			return ticksToDuration;
		}
        if (!smoMusic._ticksToDuration) {
		   _ticksToDurationsF();
        }
		return smoMusic._ticksToDuration;
	};

	// ### durationToTicks
	// Uses VF.durationToTicks, but handles dots.
	static durationToTicks(duration) {
		var dots = duration.indexOf('d');
		if (dots < 0) {
			return VF.durationToTicks(duration);
		} else {
			var vfDuration = VF.durationToTicks(duration.substring(0, dots));
			dots = duration.length - dots; // number of dots
			var split = vfDuration / 2;
			for (var i = 0; i < dots; ++i) {
				vfDuration += split;
				split = split / 2;
			}

			return vfDuration;
		}
	}


	static gcdMap(duration) {
        var keys = Object.keys(smoMusic.ticksToDuration).map((x) => parseInt(x));
        var dar = [];

        var gcd = function(td) {
            var rv = keys[0];
            for (var k = 1;k<keys.length;++k) {
                if (td % keys[k] == 0) {
                    rv = keys[k]
                }
            }
            return rv;
        }
        while (duration > 0 && !smoMusic.ticksToDuration[duration]) {
            var div = gcd(duration);
            duration = duration - div;
            dar.push(div);
        }
        if (duration > 0) {
            dar.push(duration);
        }
        return dar.sort((a,b) => a > b ? -1 : 1);
    }

}
;
VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
	 : Vex.Xform);
VX = Vex.Xform;

// ## smoSerialize
// Helper functions that perform serialized merges, general JSON
// types of routines.
// ---
class smoSerialize {

	// ### filteredMerge
	// Like vexMerge, but only for specific attributes.
	static filteredMerge(attrs, src, dest) {
		attrs.forEach(function (attr) {
			if (typeof(src[attr]) != 'undefined') {
				dest[attr] = src[attr];
			}
		});
	}

    static get localScore() {
        return '_smoosicScore';
    }

    // This is the token map we use to reduce the size of
    // serialized data.
    static get tokenMap() {
 var _tm=`{
     "a": "score",
     "b": "layout",
     "c": "leftMargin",
     "d": "rightMargin",
     "e": "topMargin",
     "f": "bottomMargin",
     "g": "pageWidth",
     "h": "pageHeight",
     "i": "orientation",
     "j": "interGap",
     "k": "intraGap",
     "l": "svgScale",
     "m": "zoomScale",
     "n": "zoomMode",
     "o": "pages",
     "p": "pageSize",
     "q": "startIndex",
     "r": "renumberingMap",
     "s": "staves",
     "t": "staffId",
     "u": "staffX",
     "v": "staffY",
     "w": "adjY",
     "x": "staffWidth",
     "y": "staffHeight",
     "z": "keySignatureMap",
     "aa": "instrumentInfo",
     "ba": "instrumentName",
     "ca": "keyOffset",
     "da": "clef",
     "ea": "modifiers",
     "fa": "startSelector",
     "ga": "staff",
     "ha": "measure",
     "ia": "voice",
     "ja": "tick",
     "ka": "pitches",
     "la": "endSelector",
     "ma": "xOffset",
     "na": "cp1y",
     "oa": "cp2y",
     "pa": "attrs",
     "qa": "id",
     "ra": "type",
     "sa": "ctor",
     "ta": "yOffset",
     "ua": "position",
     "va": "measures",
     "wa": "timeSignature",
     "xa": "keySignature",
     "ya": "measureNumber",
     "za": "measureIndex",
     "ab": "systemIndex",
     "bb": "adjX",
     "cb": "tuplets",
     "db": "voices",
     "eb": "notes",
     "fb": "ticks",
     "gb": "numerator",
     "hb": "denominator",
     "ib": "remainder",
     "jb": "letter",
     "kb": "octave",
     "lb": "accidental",
     "mb": "symbol",
     "nb": "bpm",
     "ob": "display",
     "pb": "beatDuration",
     "qb": "beamBeats",
     "rb": "endBeam",
     "sb": "textModifiers",
     "tb": "text",
     "ub": "endChar",
     "vb": "fontInfo",
     "wb": "size",
     "xb": "family",
     "yb": "style",
     "zb": "weight",
     "ac": "classes",
     "bc": "verse",
     "cc": "fill",
     "dc": "scaleX",
     "ec": "scaleY",
     "fc": "translateX",
     "gc": "translateY",
     "hc": "selector",
     "ic": "renderedBox",
     "jc": "x",
     "kc": "y",
     "lc": "width",
     "mc": "height",
     "nc": "logicalBox",
     "oc": "noteType",
     "pc": "cautionary",
     "qc": "articulations",
     "rc": "articulation",
     "sc": "activeVoice",
     "tc": "flagState",
     "uc": "invert",
     "vc": "fontSize",
     "wc": "yOffsetLine",
     "xc": "yOffsetPixels",
     "yc": "scoreText",
     "zc": "backup",
     "ad": "edited",
     "bd": "pagination",
     "cd": "boxModel",
     "dd": "justification",
     "ed": "autoLayout",
     "fd": "ornaments",
     "gd": "offset",
     "hd": "ornament",
     "id": "tempoMode",
     "jd": "tempoText",
     "kd": "barline",
     "ld": "systemBreak"}`
      ;
     return JSON.parse(_tm);
    }

    static get valueTokens() {
        var vm = `{"@sn","SmoNote"}`;
        return JSON.parse(vm);
    }

    static reverseMap(map) {
        var rv = {};
        var keys = Object.keys(map);
        keys.forEach((key) => {
            rv[map[key]] = key;
        });
        return rv;
    }

    static get tokenValues() {
        return smoSerialize.reverseMap(smoSerialize.tokenMap);
    }

    // ## detokenize
    // If we are saving, replace token values with keys, since the keys are smaller.
    // if we are loading, replace the token keys with values so the score can
    // deserialize it
    static detokenize(json,dictionary) {
        var rv = {};

        var smoKey = (key) => {
            return dictionary[key] ? dictionary[key] : key;
        }

        var n1 = 0;
        var n2=-1;
        var _tokenRecurse = (input,output) =>  {
            var keys = Object.keys(input);
            keys.forEach((key) => {
                var val = input[key];
                var dkey = smoKey(key);
                if (typeof(val) == 'string' || typeof(val) == 'number' || typeof(val) == 'boolean') {
                    output[dkey] = val;
                }
                if (typeof(val) == 'object' && key != 'dictionary') {
                    if (Array.isArray(val)) {
                        output[dkey] = [];
                        val.forEach((arobj) => {
                            if (typeof(arobj) == 'string' || typeof(arobj) == 'number' || typeof(arobj) == 'boolean') {
                                output[dkey].push(val);
                            }
                            if (arobj && typeof(arobj) == 'object') {
                                var nobj = {};
                                _tokenRecurse(arobj,nobj);
                                output[dkey].push(nobj);
                            }
                        });
                    } else {
                        var nobj = {};
                      _tokenRecurse(val,nobj);
                      output[dkey] = nobj;
                   }
                }
            });

        }
        _tokenRecurse(json,rv);
        // console.log(JSON.stringify(rv,null,' '));
        return rv;
    }

    static incrementIdentifier(label) {
        var increcurse = (ar,ix) => {
            var n1 = (ar[ix].charCodeAt(0)-97)+1;
            if (n1 > 25) {
                ar[ix]='a';
                if (ar.length <= ix+1) {
                    ar.push('a');
                } else {
                   increcurse(ar,ix+1);
                }
            } else {
                ar[ix] = String.fromCharCode(97+n1);
            }
        }
        if (!label) {
            label = 'a';
        }
        var ar = label.split('');
        increcurse(ar,0);
        label = ar.join('');
        return label;
    }

    // used to generate a tokenization scheme that I will use to make
    // saved files smaller
    static jsonTokens(json) {
        var map = {};
        var valmap = {};
        var startKeys = Object.keys(smoSerialize.tokenMap);
        var keyLabel = startKeys[startKeys.length - 1];
        keyLabel = smoSerialize.incrementIdentifier(keyLabel);

        var exist = smoSerialize.tokenValues;
        var addMap = (key) => {
            if (!exist[key] && !map[key]) {
                map[key] = keyLabel;
                keyLabel = smoSerialize.incrementIdentifier(keyLabel);
            }
        }
        var _tokenRecurse = (obj) =>  {
            var keys = Object.keys(obj);
            keys.forEach((key) => {
                var val = obj[key];
                if (typeof(val) == 'string' || typeof(val) == 'number'
                 || typeof(val) == 'boolean') {
                    addMap(key);
                }
                if (typeof(val) == 'object') {
                    if (Array.isArray(val)) {
                        addMap(key);
                        val.forEach((arobj) => {
                            if (arobj && typeof(arobj) == 'object') {
                                _tokenRecurse(arobj);
                            }
                        });
                    } else {
                        addMap(key);
                      _tokenRecurse(val);
                   }
                }

            });
        }
        _tokenRecurse(json);
        var mkar = Object.keys(map);
        var m2 = {};
        mkar.forEach((mk) => {
            m2[map[mk]] = mk;
        })
        console.log(JSON.stringify(m2,null,' '));
    }
	// ### serializedMerge
	// serialization-friendly, so merged, copied objects are deep-copied
	static serializedMerge(attrs, src, dest) {
		attrs.forEach(function (attr) {
			if (typeof(src[attr]) != 'undefined') {
				// copy the number 0
				if (typeof(src[attr]) === 'number' ||
					typeof(src[attr]) === 'boolean' ||
                    typeof(src[attr]) === 'string') {
					dest[attr] = src[attr];
					// copy the empty array
				} else if (Array.isArray(src[attr])) {
					dest[attr] = JSON.parse(JSON.stringify(src[attr]));
				} else {
					// but don't copy empty/null objects
					if (src[attr]) {
						if (typeof(src[attr]) == 'object') {
							dest[attr] = JSON.parse(JSON.stringify(src[attr]));
						} else {
							dest[attr] = src[attr];
						}
					}
				}
			}
		});
	}

    // ### serializedMergeNonDefault
    // Used to reduce size of serializations.  Create a serialzation of
    // the object, but don't serialize attributes that are already the default
    // since the default will be set when the object is deserialized
    // #### parameters:
    //     defaults - default Array
    //     attrs - array of attributes to save
    //     src - the object to serialize
    //     dest - the json object that is the target.
    static serializedMergeNonDefault(defaults,attrs,src,dest) {
        attrs.forEach(function (attr) {
			if (typeof(src[attr]) != 'undefined') {
				// copy the number 0
				if (typeof(src[attr]) === 'number' ||
					typeof(src[attr]) === 'boolean' ||
                    typeof(src[attr]) === 'string' ) {
                        if (src[attr] != defaults[attr]) {
					        dest[attr] = src[attr];
                        }
					// copy the empty array
				} else if (Array.isArray(src[attr])) {
                    var defval = JSON.stringify(defaults[attr]);
                    var srcval = JSON.stringify(src[attr]);
                    if (defval != srcval) {
					    dest[attr] = JSON.parse(srcval);
                    }
				} else {
					// but don't copy empty/null objects
					if (src[attr]) {
						if (typeof(src[attr]) == 'object') {
                            var defval = JSON.stringify(defaults[attr]);
                            var srcval = JSON.stringify(src[attr]);
                            if (defval != srcval) {
                                dest[attr] = JSON.parse(srcval);
                            }
						} else {
                            if (src[attr] != defaults[attr]) {
							    dest[attr] = src[attr];
                            }
						}
					}
				}
			}
		});
    }

	static stringifyAttrs(attrs, obj) {
		var rv = '';
		attrs.forEach((attr) => {
			if (obj[attr]) {
				rv += attr + ':' + obj[attr] + ', ';
			} else {
				rv += attr + ': null,';
			}
		});
		return rv;
	}
}
;

// ## svgHelpers
// Mostly utilities for converting coordinate spaces based on transforms, etc.
// ### static class methods:
// ---
class svgHelpers {
	// ### unionRect
	// grow the bounding box two objects to include both.
	static unionRect(b1, b2) {
		var x = Math.min(b1.x, b2.x);
		var y = Math.min(b1.y, b2.y);
		var width = Math.max(b1.x + b1.width, b2.x + b2.width) - x;
		var height = Math.max(b1.y + b1.height, b2.y + b2.height) - y;
		return {
			x: x,
			y: y,
			width: width,
			height: height
		};
	}

	static get namespace() {
		return "http://www.w3.org/2000/svg";
	}

	static buildSvg(el) {

		var smoSvgBuilder = function (el) {
			var ns = svgHelpers.namespace;
			this.e = document.createElementNS(ns, el);
			var self = this;
			this.classes = function (cl) {
				self.e.setAttributeNS('', 'class', cl);
				return self;
			}
			this.attr = function (name, value) {
				self.e.setAttributeNS('', name, value);
				return self;
			}

			this.text = function (x, y, classes, text) {
				x = typeof(x) == 'string' ? x : x.toString();
				y = typeof(y) == 'string' ? y : y.toString();
				this.e.setAttributeNS('', 'class', classes);
				this.e.setAttributeNS('', 'x', x);
				this.e.setAttributeNS('', 'y', y);

				this.e.textContent = text;
				return this;
			}
			this.rect = function (x, y, width, height, classes) {
				x = typeof(x) == 'string' ? x : x.toString();
				y = typeof(y) == 'string' ? y : y.toString();
				width = typeof(width) == 'string' ? width : width.toString();
				height = typeof(height) == 'string' ? height : height.toString();
				this.e.setAttributeNS('', 'x', x);
				this.e.setAttributeNS('', 'y', y);
				this.e.setAttributeNS('', 'width', width);
				this.e.setAttributeNS('', 'height', height);
				if (classes) {
					this.e.setAttributeNS('', 'class', classes);
				}
				return this;
			}
			this.line = function (x1, y1, x2, y2, classes) {
				x1 = typeof(x1) == 'string' ? x1 : x1.toString();
				y1 = typeof(y1) == 'string' ? y1 : y1.toString();
				x2 = typeof(x2) == 'string' ? x2 : x2.toString();
				y2 = typeof(y2) == 'string' ? y2 : y2.toString();

				this.e.setAttributeNS('', 'x1', x1);
				this.e.setAttributeNS('', 'y1', y1);
				this.e.setAttributeNS('', 'x2', x2);
				this.e.setAttributeNS('', 'y2', y2);
				if (classes) {
					this.e.setAttributeNS('', 'class', classes);
				}
				return this;
			}
			this.append = function (el) {
				self.e.appendChild(el.e);
				return self;
			}
			this.dom = function () {
				return self.e;
			}
			return this;
		}
		return new smoSvgBuilder(el);
	}

	// ### boxNote
	// update the note geometry based on current viewbox conditions.
	// This may not be the appropriate place for this...maybe in layout
	static updateArtifactBox(svg,element,artifact) {
		artifact.renderedBox = svgHelpers.smoBox(element.getBoundingClientRect());
		artifact.logicalBox = svgHelpers.smoBox(element.getBBox());
	}

    static rect(svg,box,attrs,classes) {
        var rect = document.createELementNS(svgHelpers.namespace,'rect');
        attrs.forEach((attr) => {
            var key = Object.keys(attr)[0];
            key = (key == 'strokewidth') ? 'stroke-width' : key;
            var val = attr[key];
            rect.setAttributeNS('', key, val);
        });
        if (classes) {
            rect.setAttributeNS('','class',classes);
        }
        svg.appendChild(rect);
    }

    static line(svg,x1,y1,x2,y2,attrs,classes) {
        var line = document.createElementNS(svgHelpers.namespace,'line');
        x1 = typeof(x1) == 'string' ? x1 : x1.toString();
        y1 = typeof(y1) == 'string' ? y1 : y1.toString();
        x2 = typeof(x2) == 'string' ? x2 : x2.toString();
        y2 = typeof(y2) == 'string' ? y2 : y2.toString();

        line.setAttributeNS('', 'x1', x1);
        line.setAttributeNS('', 'y1', y1);
        line.setAttributeNS('', 'x2', x2);
        line.setAttributeNS('', 'y2', y2);
        attrs = (attrs) ? attrs : [];
        attrs.forEach((attr) => {
            var key = Object.keys(attr)[0];
            key = (key == 'strokewidth') ? 'stroke-width' : key;
            var val = attr[key];
            line.setAttributeNS('', key, val);
        });
        if (classes) {
            line.setAttributeNS('', 'class', classes);
        }
        svg.appendChild(line);
    }

    static arrowDown(svg,box,attrs,classes) {
        svgHelpers.line(svg,box.x+box.width/2,box.y,box.x+box.width/2,box.y+box.height);
        var arrowY=box.y + box.height/4;
        svgHelpers.line(svg,box.x,arrowY,box.x+box.width/2,box.y+box.height);
        svgHelpers.line(svg,box.x+box.width,arrowY,box.x+box.width/2,box.y+box.height);
    }

    static textOutlineRect(svg,textElement, color, classes) {
        var box = textElement.getBBox();
        var attrs = [{width:box.width+5,height:box.height+5,stroke:color,strokewidth:'2',fill:'none',x:box.x-5,y:box.y-5}];
        svgHelpers.rect(svg,box,attrs,classes);
    }
	// ### getTextBox
	// Get the logical bounding box of the text for placement.
	static getTextBox(svg,attributes,classes,text) {
		var el = svgHelpers.placeSvgText(svg,attributes,classes,text);
		var box = el.getBBox();
		svg.removeChild(el);
		return box;
	}

	static debugBox(svg, box, classes, voffset) {
		voffset = voffset ? voffset : 0;
		classes = classes ? classes : '';
        if (!box)
           return;
		classes += ' svg-debug-box';
		var b = svgHelpers.buildSvg;
		var mid = box.x + box.width / 2;
		var xtext = 'x1: ' + Math.round(box.x);
		var wtext = 'x2: ' + Math.round(box.width+box.x);
		var ytext = 'y1: ' + Math.round(box.y);
		var htext = 'y2: ' + Math.round(box.height+box.y);
		var ytextp = Math.round(box.y+box.height);
		var ytextp2 = Math.round(box.y+box.height-30);

		var r = b('g').classes(classes)
			.append(
				b('text').text(box.x + 20, box.y - 14+voffset, 'svg-debug-text', xtext))
			.append(
				b('text').text(mid - 20, box.y - 14+voffset, 'svg-debug-text', wtext))
			.append(
				b('line').line(box.x, box.y - 2, box.x + box.width, box.y - 2))
			.append(
				b('line').line(box.x, box.y - 8, box.x, box.y + 5))
			.append(
				b('line').line(box.x + box.width, box.y - 8, box.x + box.width, box.y + 5))
			.append(
				b('text').text(Math.round(box.x-14+voffset), ytextp, 'svg-vdebug-text', ytext)
				  .attr('transform','rotate(-90,'+Math.round(box.x-14+voffset)+','+ytextp+')'));
		if (box.height > 2) {
			r.append(
				b('text').text(Math.round(box.x-14+voffset), ytextp2, 'svg-vdebug-text', htext)
				  .attr('transform','rotate(-90,'+Math.round(box.x-14+voffset)+','+(ytextp2)+')'))
				  .append(
				b('line').line(Math.round(box.x-2), Math.round(box.y +box.height),box.x-2,box.y))
				  .append(
				b('line').line(Math.round(box.x-8), Math.round(box.y +box.height),box.x+6,Math.round(box.y+box.height)))
				  .append(
				b('line').line(Math.round(box.x-8), Math.round(box.y),Math.round(box.x+6),Math.round(box.y)));
		}
		svg.appendChild(r.dom());
	}

    static fontIntoToSvgAttributes(fontInfo) {
        var rv = [];
        var fkeys = Object.keys(fontInfo);
		fkeys.forEach((key) => {
			var n='{"font-'+key+'":"'+fontInfo[key]+'"}';
			rv.push(JSON.parse(n));
		});
        return rv;
    }

	static placeSvgText(svg,attributes,classes,text) {
		var ns = svgHelpers.namespace;
		var e = document.createElementNS(ns, 'text');
		attributes.forEach((attr) => {
			var key = Object.keys(attr)[0];
		    e.setAttributeNS('', key, attr[key]);
		})
		if (classes) {
			e.setAttributeNS('', 'class', classes);
		}
		e.textContent = text;
		svg.appendChild(e);
		return e;
	}

    // ### findIntersectingArtifactFromMap
    // Same as findIntersectionArtifact but uses a map of keys instead of an array
    static findIntersectingArtifactFromMap(clientBox,map,netScroll) {
        var box = svgHelpers.smoBox(clientBox); //svgHelpers.untransformSvgPoint(this.context.svg,clientBox);

		// box.y = box.y - this.renderElement.offsetTop;
		// box.x = box.x - this.renderElement.offsetLeft;
		var rv = [];

		Object.keys(map).forEach((k) => {
            var object = map[k];
			// Measure has been updated, but not drawn.
			if (!object.box) {
				// console.log('there is no box');
			} else {
				var obox = svgHelpers.adjustScroll(svgHelpers.smoBox(object.box),netScroll);
				var i1 = box.x - obox.x; // handle edge not believe in x and y
				var i2 = box.y - obox.y;
				if (i1 > 0 && i1 < object.box.width && i2 > 0 && i2 < object.box.height) {
					rv.push(object);
				}
			}
		});

		return rv;

    }

	// ### findIntersectionArtifact
	// find all object that intersect with the rectangle
	static findIntersectingArtifact(clientBox, objects,netScroll) {
		var box = svgHelpers.smoBox(clientBox); //svgHelpers.untransformSvgPoint(this.context.svg,clientBox);

		// box.y = box.y - this.renderElement.offsetTop;
		// box.x = box.x - this.renderElement.offsetLeft;
		var rv = [];
		if (typeof(objects['forEach']) != 'function') {
			console.log('corrupt objects in findIntersectingArtifact');
		}
		objects.forEach((object) => {
			// Measure has been updated, but not drawn.
			if (!object.box) {
				// console.log('there is no box');
			} else {
				var obox = svgHelpers.adjustScroll(svgHelpers.smoBox(object.box),netScroll);
				var i1 = box.x - obox.x; // handle edge not believe in x and y
				var i2 = box.y - obox.y;
				if (i1 > 0 && i1 < object.box.width && i2 > 0 && i2 < object.box.height) {
					rv.push(object);
				}
			}
		});

		return rv;
	}
	static findSmallestIntersection(clientBox, objects, netScroll) {
		var ar = svgHelpers.findIntersectingArtifact(clientBox, objects, netScroll);
		if (!ar.length) {
			return null;
		}
		var rv = ar[0];
		var min = ar[0].box.width * ar[0].box.height;
		ar.forEach((obj) => {
			var tst = obj.box.width * obj.box.height;
			if (tst < min) {
				rv = obj;
				min = tst;
			}
		});
		return rv;
	}

    static translateElement(g,x,y) {
        g.setAttributeNS('','transform','translate('+x+' '+y+')');
    }

	// ### measureBBox
	// Return the bounding box of the measure
	static measureBBox(b1, measure, staff) {
		if (measure.renderedBox) {
			if (b1['width']) {
				return svgHelpers.unionRect(b1, measure.renderedBox);
			} else {
				return measure.renderedBox;
			}
		} else {
			var mbox = {
				x: measure.staffX,
				y: staff.staffY,
				width: measure.staffWidth,
				height: staff.staffHeight
			};
			if (b1['width']) {
				return mbox;
			}
			return svgHelpers.unionRect(b1, mbox);
		}
	}
    // ### measurePerInch
    // Supported font units
    static get unitsPerInch() {
        var rv = {};

        rv['pt']=72.0;
        rv['px']=96.0;
        rv['em']=6.0;
        return rv;
    }

    // ### getFontSize
    // Given '1em' return {size:1.0,unit:em}
    static getFontSize(fs) {
        var size=parseFloat(fs);
        var measure = fs.substr(fs.length-2,2);
        return {size:size,unit:measure};
    }

    static convertFont(size,o,n) {
        return size*(svgHelpers.unitsPerInch[o]/svgHelpers.unitsPerInch[n]);
    }

	static stringify(box) {
		if (box['width']) {

			return JSON.stringify({
				x: box.x,
				y: box.y,
				width: box.width,
				height: box.height
			}, null, ' ');
		} else {
			return JSON.stringify({
				x: box.x,
				y: box.y
			}, null, ' ');
		}
	}

	static log(box) {
		if (box['width']) {
			console.log(JSON.stringify({
					x: box.x,
					y: box.y,
					width: box.width,
					height: box.height
				}, null, ' '));
		} else {
			console.log('{}');
		}
	}

	// ### pointBox
	// return a point-sized box at the given coordinate
	static pointBox(x, y) {
		return {
			x: x,
			y: y,
			width: 0,
			height: 0
		};
	}

	// ### smoBox:
	// return a simple box object that can be serialized, copied
	// (from svg DOM box)
	static smoBox(box) {
        var x = typeof(box.x) == 'undefined' ? Math.round(box.left) : Math.round(box.x);
        var y = typeof(box.y) == 'undefined' ? Math.round(box.top) : Math.round(box.y);
		return ({
			x: x,
			y: y,
			width: Math.round(box.width),
			height: Math.round(box.height)
		});
	}

    // ### adjustScroll
    // Add the scroll to the screen coordinates so we can find the mapped
    // location of something.
    static adjustScroll(box,scroll) {
        // WIP...
        if (typeof(box) == 'undefined' || typeof(scroll) == 'undefined') {
            console.log('bad values to scroll thing');
            return;
        }
        return svgHelpers.boxPoints(box.x - scroll.x,box.y-scroll.y,box.width,box.height);
        // return box;
    }

	static boxPoints(x, y, w, h) {
		return ({
			x: x,
			y: y,
			width: w,
			height: h
		});
	}

	static copyBox(box) {
        box = svgHelpers.smoBox(box);
		return {
			x: box.x,
			y: box.y,
			width: box.width,
			height: box.height
		};
	}

	// ### svgViewport
	// set `svg` element to `width`,`height` and viewport `scale`
	static svgViewport(svg, width, height, scale) {
		svg.setAttributeNS('', 'width', '' + width);
		svg.setAttributeNS('', 'height', '' + height);
		svg.setAttributeNS('', 'viewBox', '0 0 ' + Math.round(width / scale) + ' ' +
			Math.round(height / scale));
	}

	// ### logicalToClient
	// Convert a point from logical (pixels) to actual screen dimensions based on current
	// zoom, aspect ratio
	/* static logicalToClient(svg, logicalPoint) {
	var rect = svg.getBoundingClientRect();
	var rv = svgHelpers.copyBox(logicalPoint);
	rv.x += rect.x;
	rv.y += rect.y;
	return rv;
	}   */

	// ### clientToLogical
	// return a box or point in svg coordintes from screen coordinates
	static clientToLogical(svg, point) {
		var pt = svg.createSVGPoint();
        if (!point)
           return;
        var x = typeof(point.x) != 'undefined' ? point.x : point.left;
        var y = typeof(point.y) != 'undefined' ? point.y : point.top;
		pt.x = x;
		pt.y = y;
		var sp = pt.matrixTransform(svg.getScreenCTM().inverse());
		if (typeof(point['width']) == 'undefined') {
			return {
				x: sp.x,
				y: sp.y
			};
		}

		var endPt = svg.createSVGPoint();
		endPt.x = pt.x + point.width;
		endPt.y = pt.y + point.height;
		var ep = endPt.matrixTransform(svg.getScreenCTM().inverse());
		return {
			x: sp.x,
			y: sp.y,
			width: ep.x - sp.x,
			height: ep.y - sp.y
		};
	}

	// ### logicalToClient
	// return a box or point in screen coordinates from svg coordinates
	static logicalToClient(svg, point) {
		var pt = svg.createSVGPoint();
		pt.x = point.x;
		pt.y = point.y;
		var sp = pt.matrixTransform(svg.getScreenCTM());
		if (!point['width']) {
			return {
				x: sp.x,
				y: sp.y
			};
		}
		var endPt = svg.createSVGPoint();
		endPt.x = pt.x + point.width;
		endPt.y = pt.y + point.height;
		var ep = endPt.matrixTransform(svg.getScreenCTM());
		return {
			x: sp.x,
			y: sp.y,
			width: ep.x - sp.x,
			height: ep.y - sp.y
		};
	}
}
;
var smoDomBuilder = function (el) {}

// # htmlHelpers
// # Description:
//  Helper functions for buildling UI elements
class htmlHelpers {
	// ## buildDom
	// ## Description:
	// returns an object that  lets you build a DOM in a somewhat readable way.
	// ## Usage:
	// var b = htmlHelpers.buildDom;
	//  var r =
	// b('tr').classes('jsSharingMember').data('entitykey', key).data('name', name).data('entitytype', entityType).append(
	// b('td').classes('noSideBorderRight').append(
	// ...
	// $(parent).append(r.dom());
	//
	// Don't forget the '.dom()' !  That is the actual jquery element object
	static buildDom(el) {
		var smoDomBuilder = function (el) {
			this.e = $('<' + el + '/>');
			var self = this;
			this.classes = function (cl) {
				$(self.e).addClass(cl);
				return self;
			}
			this.data = function (name, value) {
				$(self.e).attr('data-' + name, value);
				return self;
			}
			this.attr = function (name, value) {
				$(self.e).attr(name, value);
				return self;
			}
			this.css = function (name, value) {
				$(self.e).css(name, value);
				return self;
			}
			this.append = function (el) {
				$(self.e).append(el.e);
				return self;
			}
			this.text = function (tx) {
				$(self.e).append(document.createTextNode(tx));
				return self;
			}
			this.dom = function () {
				return self.e;
			}
			return this;
		}
		return new smoDomBuilder(el);
	}
	static draggable(parameters) {
		return new draggable(parameters);
	}

	static get focusableElements() {
		return ['a', 'input', 'select', 'textarea', 'button', 'li[tabindex]', 'div[tabindex]'];
	}
    static addFileLink(filename,txt,parent) {        
        var anchor = $('<a></a>');
        var url = URL.createObjectURL(new Blob([txt],{type:'application/octet-stream'}));
        $(anchor).attr('href',url);
        $(anchor).attr('download',filename);
        $(anchor).text('save');
        $(parent).html('');
        $(parent).append(anchor);    
    }
    
	static inputTrapper(selector) {
		var trapper = function () {
			this.parent = $(selector);
			this.id = $(this.parent).attr('id');
			this.parentId = $(this.parent).parent().attr('id');
			var idstr = Math.round(Math.random() * (999999 - 1) + 1);
			if (!this.id) {
				$(this.parent).attr('id', idstr + '-element');
				this.id = $(this.parent).attr('id');
			}
			if (!this.parentId) {
				$(this.parent).parent().attr('id', idstr + '-parent');
				this.parentId = $(this.parent).parent().attr('id');
			}
			this.modalInputs = [];
			this.disabledInputs = [];
			this.siblingInputs = [];

			// aria-hide peers of dialog and peers of parent that are not the parent.
			var peers = $(this.parent).parent().children().toArray();

			peers.forEach((node) => {
				var ptag = $(node)[0].tagName;
				if (ptag === 'SCRIPT' || ptag === 'LINK' || ptag === 'STYLE') { ;
				} else if ($(node).attr('id') === this.parentId ||
					$(node).attr('id') === this.id) { ;
				} else {
					var hidden = $(node).attr('aria-hidden');
					if (!hidden || hidden != 'true') {
						$(node).attr('aria-hidden', 'true');
						this.siblingInputs.push(node);
					}
				}
			});
			htmlHelpers.focusableElements.forEach((etype) => {
				var elements = $(etype).toArray();

				elements.forEach((element) => {
					var tagName = $(element)[0].tagName;
					if ($(element).attr('id') === this.id) { ;
					} else if ($(element).prop('disabled')) { ;
					} else if ($(element).hasClass('hide')) { ;
					} else if ($(element).closest(selector).length) {
						// inside
						this.modalInputs.push(element);
					} else if ((tagName === 'A' || tagName === 'DIV' || tagName === 'LI') && $(element).attr('tabIndex') === '-1') { ;
					} else {
						this.disabledInputs.push(element);
						if (tagName === 'A' || tagName === 'DIV' || tagName === 'LI') {
							$(element).attr('tabIndex', '-1');
						} else {
							$(element).prop('disabled', true);
						}
					}
				});
			});

			this.close = function () {
				this.disabledInputs.forEach(function (element) {
					var tagName = $(element)[0].tagName;
					if (tagName === 'A' || tagName === 'DIV' || tagName === 'LI') {
						$(element).attr('tabIndex', '0');
					} else {
						$(element).prop('disabled', false);
					}
				});
				this.siblingInputs.forEach((el) => {
					$(el).removeAttr('aria-hidden');
				});
			}
		}

		return new trapper(selector);
	}

	static closeDialogPromise() {
		return new Promise((resolve, reject) => {
			$('body').off('dialogDismiss').on('dialogDismiss', function () {
				resolve();
			});
		});
	}
}

class draggable {

	constructor(parameters) {

		this.parent = parameters.parent;
		this.handle = parameters.handle;
        this.animeClass = parameters.animateDiv;
        this.dragParent = parameters.dragParent;
        
		this.svg=parameters['svg'];
		this.width = $(this.parent).outerWidth();
		this.height = $(this.parent).outerHeight();
		this.lastX = $(this.handle).offset().left;
		this.lastY = $(this.handle).offset().top;
		this.cb = parameters.cb;
		this.moveParent = parameters.moveParent;

		var self = this;

		// $('.itemMenu input[name="itemTitle"]').css('width','60%');
		$(this.handle)
		.off('mousedown').on('mousedown',
			function (e) {
			self.mousedown(e);
		});
		$(document)
		.on('mousemove',
			function (e) {
			self.mousemove(e);

		})
		.on('mouseup',
			function (e) {
			self.mouseup(e);
		});
	}
    disconnect() {
        $(this.handle).off('mousedown');
        $(this.document).off('mousemove');
        $(this.handle).off('mouseup');
    }
	_animate(e) {
		this.lastX = e.clientX;
		this.lastY = e.clientY;
		$(this.animeClass).css('left', this.lastX);
		$(this.animeClass).css('top', this.lastY);
        
        if (this.dragParent) {
            $(this.parent).css('left', this.lastX + 'px');
			$(this.parent).css('top', this.lastY + 'px');
        }
	}
	mousedown(e) {
		if (!this.dragging) {
			$(this.animeClass).removeClass('hide');

			$(this.animeClass).css('width', this.width);
			$(this.animeClass).css('height', this.height);
		}

		this.dragging = true;
		this._animate(e);
	}
	enddrag(e) {

		if (this.moveParent) {
			$(this.parent).css('left', this.lastX + 'px');
			$(this.parent).css('top', this.lastY + 'px');
		}
		$(this.animeClass).addClass('hide');
		this.cb(this.lastX, this.lastY);
	}

	mouseup(e) {
		// stop resizing
		if (this.dragging) {
			this.dragging = false;
			this.lastX = e.clientX;
			this.lastY = e.clientY;

			this.enddrag();
		}
	}
	mousemove(e) {
		// we don't want to do anything if we aren't resizing.
		if (!this.dragging)
			return;
		this._animate(e);
	}
}
;// ## SmoNote
// ## Description:
// Data for a musical note.  THe most-contained-thing, except there can be note modifiers
// Basic note information.  Leaf node of the SMO dependency tree (so far)
// ## SmoNote Methods
// ---
class SmoNote {
    // ### Description:
    // see defaults for params format.
    constructor(params) {
        Vex.Merge(this, SmoNote.defaults);
        smoSerialize.serializedMerge(SmoNote.parameterArray, params, this);

        // this.keys=JSON.parse(JSON.stringify(this.keys));

        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoNote'
            };
        } else {
            // inherit attrs id for deserialized
        }
    }
    static get flagStates() {
        return {auto:0,up:1,down:2};
    }
    static get parameterArray() {
        return ['ticks', 'pitches', 'noteType', 'tuplet', 'clef', 'endBeam','beamBeats','flagState'];
    }

    toggleFlagState() {
        this.flagState = (this.flagState + 1) % 3;
    }

    toVexStemDirection() {
        return (this.flagState == SmoNote.flagStates.up ? VF.Stem.UP : VF.Stem.DOWN);

    }
    get id() {
        return this.attrs.id;
    }

    get dots() {
        if (this.isTuplet) {
            return 0;
        }
        var vexDuration = smoMusic.ticksToDuration[this.tickCount];
        if (!vexDuration) {
            return 0;
        }
        return vexDuration.split('d').length - 1;
    }

    set dots(value) {
        // ignore - dots are a function of duration only.
    }

    // ### _addModifier
    // ### Description
    // add or remove sFz, mp, etc.
    _addModifier(dynamic, toAdd) {
        var tms = [];
        this.textModifiers.forEach((tm) => {
            if (tm.attrs.type != dynamic.attrs.type) {
                tms.push(tm);
            }
        });
        if (toAdd) {
            tms.push(dynamic);
        }
        this.textModifiers = tms;
    }

    _addArticulation(articulation, toAdd) {
        var tms = [];
        this.articulations.forEach((tm) => {
            if (tm.articulation != articulation.articulation) {
                tms.push(tm);
            }
        });
        if (toAdd) {
            tms.push(articulation);
        }
        this.articulations = tms;
    }

    addModifier(dynamic) {
        this._addModifier(dynamic, true);
    }
    removeModifier(dynamic) {
        this._addModifier(dynamic, false);
    }
    getModifiers(type) {
        var ms = this.textModifiers.filter((mod)=> {
            return mod.attrs.type === type;
        });
        return ms;
    }

    longestLyric() {
        var tms = this.textModifiers.filter((mod) => {
            return mod.attrs.type == 'SmoLyric';
        });
        if (!tms.length) {
            return null;
        }
        return tms.reduce((m1,m2) => {
            return m1.text.length > m2.text.length;
        });

    }

    addLyric(lyric) {
        var tms = this.textModifiers.filter((mod) => {
            return mod.attrs.type != 'SmoLyric' || mod.verse != lyric.verse;
        });
        tms.push(lyric);
        this.textModifiers = tms;
    }


    removeLyric(lyric) {
        var tms = this.textModifiers.filter((mod) => {
            return mod.attrs.type != 'SmoLyric' || mod.verse != lyric.verse;
        });
        this.textModifiers = tms;
    }

    getLyricForVerse(verse) {
        return this.textModifiers.filter((mod) => {
            return mod.attrs.type == 'SmoLyric' && mod.verse == verse;
        });
    }

    getOrnaments(ornament) {
        return this.ornaments;
    }

    toggleOrnament(ornament) {
            var aix = this.ornaments.filter((a) => {
                return a.attrs.type === 'SmoOrnament' && a.ornament === ornament.ornament;
            });
        if (!aix.length) {
            this.ornaments.push(ornament);
        } else {
            this.ornaments=[];
        }
    }

    // Toggle between articulation above, below, or remove
    toggleArticulation(articulation) {
        var aix = this.articulations.findIndex((a) => {
                return a.articulation === articulation.articulation;
            });
        if (aix >= 0) {
            var cur = this.articulations[aix];
            if (cur.position == SmoArticulation.positions.above) {
                cur.position = SmoArticulation.positions.below;
                return;
            }
            else {
                this._addArticulation(articulation,false);
                return;
            }
        }
        this._addArticulation(articulation, true);
    }

    static _sortPitches(note) {
        var canon = VF.Music.canonical_notes;
        var keyIndex = ((pitch) => {
            return canon.indexOf(pitch.letter) + pitch.octave * 12;
        });
        note.pitches.sort((a, b) => {
            return keyIndex(a) - keyIndex(b);
        });
    }
    addGraceNote(params,offset) {
        params.clef = this.clef;
        if (this.graceNotes.length > offset) {
            this.graceNotes[offset]= new SmoGraceNote(params);
        } else {
            this.graceNotes.push(new SmoGraceNote(params));
        }
    }
    removeGraceNote(offset) {
        if (offset >= this.graceNotes.length) {
            return;
        }
        this.graceNotes.splice(offset,1);
    }
    getGraceNotes() {
        return this.graceNotes;
    }
    addPitchOffset(offset) {
        if (this.pitches.length == 0) {
            return this;
        }
        this.noteType = 'n';
        var pitch = this.pitches[0];
        this.pitches.push(smoMusic.getKeyOffset(pitch, offset));

        SmoNote._sortPitches(this);
    }

    makeRest() {
        this.noteType = (this.noteType == 'r' ? 'n' : 'r');
    }

    makeNote() {
        this.noteType = 'n';
    }

    get isTuplet() {
        return this['tuplet'] && this.tuplet['id'];
    }

    addMicrotone(tone) {
        var ar = this.tones.filter((tn) => tn.pitch != tone.pitch);
        ar.push(tone);
        this.tones = ar;
    }
    removeMicrotone(tone) {
        var ar = this.tones.filter((tn) => tn.pitch != tone.pitch
            && tone.tone != tn.tone);
        this.tones = ar;
    }

    getMicrotones() {
        return this.tones;
    }

    transpose(pitchArray, offset, keySignature) {
        return SmoNote._transpose(this,pitchArray,offset,keySignature);
    }
    static _transpose(note,pitchArray, offset, keySignature) {
        var pitches = [];
        note.noteType = 'n';
        if (pitchArray.length == 0) {
            note.pitches.forEach((m) => {
                pitchArray.push(note.pitches.indexOf(m));
            });
        }
        for (var j = 0; j < pitchArray.length; ++j) {
            var index = pitchArray[j];
            if (index + 1 > note.pitches.length) {
                note.addPitchOffset(offset);
            } else {
                var pitch = smoMusic.getKeyOffset(note.pitches[index], offset);
                if (keySignature) {
                    var letterKey = pitch.letter + pitch.accidental;
                    letterKey = smoMusic.getKeyFriendlyEnharmonic(letterKey, keySignature);
                    pitch.letter = letterKey[0];
                    if (letterKey.length < 2) {
                        pitch.accidental = 'n';
                    } else {
                        pitch.accidental = letterKey.substring(1);
                    }
                }
                note.pitches[index] = pitch;
            }
        }
        SmoNote._sortPitches(note);
        return note;
    }
    get tickCount() {
        return this.ticks.numerator / this.ticks.denominator + this.ticks.remainder;
    }

    describe() {
        return this.attrs.id + ' ' + this.tickCount;
    }

    static clone(note) {
        var rv = SmoNote.deserialize(note.serialize());

        // make sure id is unique
        rv.attrs = {
            id: VF.Element.newID(),
            type: 'SmoNote'
        };
        return rv;
    }

    // ## Description:
    // Clone the note, but use the different duration.  Changes the length
    // of the note but nothing else.
    static cloneWithDuration(note, ticks) {
        if (typeof(ticks) === 'number') {
            ticks = {numerator:ticks,denominator:1,remainder:0};
        }
        var rv = SmoNote.clone(note);

        rv.ticks = ticks;

        return rv;
    }

    _serializeModifiers(params) {
        ['textModifiers','graceNotes','articulations','ornaments','tones'].forEach((attr) => {
            if (this[attr] && this[attr].length) {
                params[attr] = [];
                this[attr].forEach((mod) => {
                    params[attr].push(mod.serialize());
                });
            }
        });
    }
    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoNote.defaults,SmoNote.parameterArray, this, params);
        if (params.ticks) {
            params.ticks = JSON.parse(JSON.stringify(params.ticks));
        }
        this._serializeModifiers(params);
        return params;
    }

    static get defaults() {
        return {
            noteType: 'n',
            textModifiers: [],
            articulations: [],
            graceNotes:[],
            ornaments:[],
            tones:[],
            endBeam: false,
            beamBeats:4096,
            flagState:SmoNote.flagStates.auto,
            ticks: {
                numerator: 4096,
                denominator: 1,
                remainder: 0
            },
            pitches: [{
                    letter: 'b',
                    octave: 4,
                    accidental: ''
                }
            ],
        }
    }
    static deserialize(jsonObj) {
        var note = new SmoNote(jsonObj);
        ['textModifiers','graceNotes','ornaments','articulations','tones'].forEach((attr) =>
        {
            if (!jsonObj[attr]) {
                note[attr] = [];
            } else {
                jsonObj[attr].forEach((mod) => {
                    note[attr].push(SmoNoteModifierBase.deserialize(mod));
                });
            }
        });
        // Due to a bug, text modifiers were serialized into noteModifiers array
        if (jsonObj.noteModifiers) {
            jsonObj.noteModifiers.forEach((mod) => {
                note.textModifiers.push(mod);
            });
        }

        return note;
    }
}
class SmoTuplet {
    constructor(params) {
        this.notes = params.notes;
        Vex.Merge(this, SmoTuplet.defaults);
        Vex.Merge(this, params);
        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoTuplet'
            };
        } else {
        }
        this._adjustTicks();
    }

	static get longestTuplet() {
		return 8192;
	}

    get clonedParams() {
        var paramAr = ['stemTicks', 'ticks', 'totalTicks', 'durationMap']
        var rv = {};
        smoSerialize.serializedMerge(paramAr, this, rv);
        return rv;

    }

	static calculateStemTicks(totalTicks,numNotes) {
        var stemValue = totalTicks / numNotes;
        var stemTicks = SmoTuplet.longestTuplet;

        // The stem value is the type on the non-tuplet note, e.g. 1/8 note
        // for a triplet.
        while (stemValue < stemTicks) {
            stemTicks = stemTicks / 2;
        }
		return stemTicks * 2;
	}

    static cloneTuplet(tuplet) {
        var noteAr = tuplet.notes;
        var durationMap = JSON.parse(JSON.stringify(tuplet.durationMap)); // deep copy array

		// Add any remainders for oddlets
		var totalTicks = noteAr.map((nn) => nn.ticks.numerator+nn.ticks.remainder).reduce((acc, nn) => acc+nn);

        var numNotes = tuplet.numNotes;
        var stemValue = totalTicks / numNotes;
        var stemTicks = SmoTuplet.calculateStemTicks(totalTicks,numNotes);

        var tupletNotes = [];

        var i = 0;
        noteAr.forEach((note) => {
            var textModifiers = note.textModifiers;
            note = SmoNote.cloneWithDuration(note, {
                    numerator: stemTicks*tuplet.durationMap[i],
                    denominator: 1,
                    remainder: 0
                });

            // Don't clone modifiers, except for first one.
            if (i === 0) {
                var ntmAr = [];
                textModifiers.forEach((tm) => {
                    ntm = SmoNoteModifierBase.deserialize(JSON.stringify(tm));
                    ntmAr.push(ntm);
                });
                note.textModifiers = ntmAr;
            }
            i += 1;

            tupletNotes.push(note);
        });
        var rv = new SmoTuplet({
                notes: tupletNotes,
                stemTicks: stemTicks,
                totalTicks: totalTicks,
                ratioed: false,
                bracketed: true,
                startIndex: tuplet.startIndex,
                durationMap: durationMap
            });
        return rv;
    }

    _adjustTicks() {
        var sum = this.durationSum;
        for (var i = 0; i < this.notes.length; ++i) {
            var note = this.notes[i];
            var normTicks = smoMusic.durationToTicks(smoMusic.ticksToDuration[this.stemTicks]);
            // TODO:  notes_occupied needs to consider vex duration
            var tupletBase = normTicks * this.note_ticks_occupied;
            note.ticks.denominator = 1;
            note.ticks.numerator = Math.floor((this.totalTicks * this.durationMap[i]) / sum);

            note.tuplet = this.attrs;
        }

		// put all the remainder in the first note of the tuplet
		var noteTicks = this.notes.map((nn) => {return nn.tickCount;}).reduce((acc,dd) => {return acc+dd;});
		this.notes[0].ticks.remainder = this.totalTicks-noteTicks;

    }
    getIndexOfNote(note) {
        var rv = -1;
        for (var i = 0; i < this.notes.length; ++i) {
            var tn = this.notes[i];
            if (note.attrs.id === tn.attrs.id) {
                rv = i;
            }
        }
        return rv;
    }
    split(combineIndex) {
        var multiplier = 0.5;
        var nnotes = [];
        var nmap = [];

        for (var i = 0; i < this.notes.length; ++i) {
            var note = this.notes[i];
            if (i === combineIndex) {
                nmap.push(this.durationMap[i] * multiplier);
                nmap.push(this.durationMap[i] * multiplier);
                note.ticks.numerator *= multiplier;

                var onote = SmoNote.clone(note);
				// remainder is for the whole tuplet, so don't duplicate that.
				onote.ticks.remainder=0;
                nnotes.push(note);
                nnotes.push(onote);
            } else {
                nmap.push(this.durationMap[i]);
                nnotes.push(note);
            }
        }
        this.notes = nnotes;
        this.durationMap = nmap;
    }
    combine(startIndex, endIndex) {
        // can't combine in this way, too many notes
        if (this.notes.length <= endIndex || startIndex >= endIndex) {
            return this;
        }
        var acc = 0.0;
        var i;
        var base = 0.0;
        for (i = startIndex; i <= endIndex; ++i) {
            acc += this.durationMap[i];
            if (i == startIndex) {
                base = this.durationMap[i];
            } else if (this.durationMap[i] != base) {
                // Can't combine non-equal tuplet notes
                return this;
            }
        }
        // how much each combined value will be multiplied by
        var multiplier = acc / base;

        var nmap = [];
        var nnotes = [];
        // adjust the duration map
        for (i = 0; i < this.notes.length; ++i) {
            var note = this.notes[i];
            // notes that don't change are unchanged
            if (i < startIndex || i > endIndex) {
                nmap.push(this.durationMap[i]);
                nnotes.push(note);
            }
            // changed note with combined duration
            if (i == startIndex) {
                note.ticks.numerator = note.ticks.numerator * multiplier;
                nmap.push(acc);
                nnotes.push(note);
            }
            // other notes after startIndex are removed from the map.
        }
        this.notes = nnotes;
        this.durationMap = nmap;
    }
    get durationSum() {
        var acc = 0;
        for (var i = 0; i < this.durationMap.length; ++i) {
            acc += this.durationMap[i];
        }
        return Math.round(acc);
    }
    get num_notes() {
        return this.durationSum;
    }
    get notes_occupied() {
        return Math.floor(this.totalTicks / this.stemTicks);
    }
    get note_ticks_occupied() {
        return this.totalTicks / this.stemTicks;
    }
    get tickCount() {
        var rv = 0;
        for (var i = 0; i < this.notes.length; ++i) {
            var note = this.notes[i];
            rv += (note.ticks.numerator / note.ticks.denominator) + note.ticks.remainder;
        }
        return rv;
    }

    static get defaults() {
        return {
            numNotes: 3,
            totalTicks: 4096, // how many ticks this tuple takes up
            stemTicks: 2048, // the stem ticks, for drawing purposes.  >16th, draw as 8th etc.
            durationMap: [1.0, 1.0, 1.0],
            bracketed: true,
            ratioed: false
        }
    }
}

class SmoBeamGroup {
    constructor(params) {
        this.notes = params.notes;
        Vex.Merge(this, params);

        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoBeamGroup'
            };
        } else {
        }
        for (var i = 0; i < this.notes.length; ++i) {
            var note = this.notes[i];
            if (note.tickCount < 4096)
                note.beam_group = this.attrs;
        }
    }
}
;
class SmoNoteModifierBase {
	constructor(ctor) {
        this.attrs = {
            id: VF.Element.newID(),
            type: ctor
        };
		this.ctor = ctor;
	}
	static deserialize(jsonObj) {
		var ctor = eval(jsonObj.ctor);
		var rv = new ctor(jsonObj);
		return rv;
	}
}

class SmoGraceNote extends SmoNoteModifierBase {
    static get defaults() {
        return {
            flagState:SmoGraceNote.flagStates.auto,
            noteType: 'n',
            beamBeats:4096,
            endBeam:false,
            clef:'treble',
            slash:false,

            ticks: {
                numerator: 4096,
                denominator: 1,
                remainder: 0
            },
            pitches: [{
                    letter: 'b',
                    octave: 4,
                    accidental: ''
                }
            ],
        }
    }
    // TODO: Matches SmoNote - move to smoMusic?
    static get flagStates() {
        return {auto:0,up:1,down:2};
    }
    static get parameterArray() {
        return ['ticks', 'pitches', 'noteType', 'clef', 'endBeam','beamBeats','flagState','slash','ctor'];
    }
    tickCount() {
        return this.ticks.numerator / this.ticks.denominator + this.ticks.remainder;
    }

    toVexGraceNote() {
        var p = smoMusic.smoPitchesToVex(this.pitches);
        var rv = {duration:smoMusic.closestVexDuration(this.tickCount()),keys:p};
        return rv;
    }

    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoGraceNote.defaults,
           SmoGraceNote.parameterArray,this,params);
        return params;
    }

    constructor(parameters) {
        super('SmoGraceNote');
    	smoSerialize.serializedMerge(SmoGraceNote.parameterArray,SmoGraceNote.defaults,this);
		smoSerialize.serializedMerge(SmoGraceNote.parameterArray, parameters, this);
    }

}

class SmoMicrotone extends SmoNoteModifierBase {
    static get smoToVex() {
        return {
            flat75sz:'db',
            flat25sz:'d',
            flat25ar:'bs',
            flat125ar:'afhf',
            sharp75:'++',
            sharp125:'ashs',
            sharp25:'+',
            sori:'o',
            koron:'k'
        }
    }

    static get pitchCoeff() {
        return {
        flat75sz:-1.5,
        flat25sz:-0.5,
        flat25ar:-0.5,
        flat125ar:-2.5,
        sharp75:1.5,
        sharp125:2.5,
        sharp25:0.5,
        sori:0.5,
        koron:-0.5
        };
    }

    get toPitchCoeff() {
        return SmoMicrotone.pitchCoeff[this.tone];
    }

    get toVex() {
        return SmoMicrotone.smoToVex[this.tone];
    }
    static get defaults() {
        return {
            tone:'flat25sz',
            pitch:0
        };
    }
    static get parameterArray() {
		return ['tone', 'pitch','ctor'];
	}
    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoMicrotone.defaults,
           SmoMicrotone.parameterArray,this,params);
        return params;
    }
    constructor(parameters) {
        super('SmoMicrotone');
        smoSerialize.serializedMerge(SmoMicrotone.parameterArray,SmoMicrotone.defaults,this);
        smoSerialize.serializedMerge(SmoMicrotone.parameterArray, parameters, this);
    }
}
class SmoOrnament extends SmoNoteModifierBase {
    static get ornaments() {
		return {
			mordent: 'mordent',
			mordentInverted: 'mordent_inverted',
			turn: 'turn',
			turnInverted: 'turn_inverted',
			trill: 'tr',
			upprail: 'upprail',
			prailup: 'prailup',
			praildown: 'praildown',
            upmordent:'upmordent',
            downmordent:'downmordent',
            lineprail:'linepraile',
            prailprail:'prailprail'
		};
	}
    static get parameterArray() {
		return ['position', 'offset','ornament','ctor'];
	}

    static get positions() {
		return {
			above: 'above',
			below: 'below'
		};
	}
    static get offsets() {
		return {
			on: 'on',
			after: 'after'
		};
	}
    static get defaults() {
        return {
            ornament:SmoOrnament.ornaments.mordent,
            position:SmoOrnament.positions.above,
            offset:SmoOrnament.offsets.on
        };
    }
    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoOrnament.defaults,
           SmoOrnament.parameterArray,this,params);
        return params;
    }
    constructor(parameters) {
		super('SmoOrnament');
		smoSerialize.serializedMerge(SmoOrnament.parameterArray,SmoOrnament.defaults,this);
		smoSerialize.serializedMerge(SmoOrnament.parameterArray, parameters, this);
		this.selector = parameters.selector;
	}
}
class SmoArticulation extends SmoNoteModifierBase {
	static get articulations() {
		return {
			accent: 'accent',
			staccato: 'staccato',
			marcato: 'marcato',
			tenuto: 'tenuto',
			upStroke: 'upStroke',
			downStroke: 'downStroke',
			pizzicato: 'pizzicato',
			fermata: 'fermata'
		};
	}
	static get positions() {
		return {
			above: 'above',
			below: 'below'
		};
	}
	static get articulationToVex() {
		return {
			accent: 'a>',
			staccato: 'a.',
			marcato: 'a^',
			tenuto: 'a-',
			upStroke: 'a|',
			downStroke: 'am',
			pizzicato: 'ao',
			fermata: 'a@a'
		};
	}

	static get vexToArticulation() {
		return {
			"a>": "accent",
			"a.": "staccato",
			"a^": "marcato",
			"a-": "tenuto",
			"a|": "upStroke",
			"am": "downStroke",
			"ao": "pizzicato",
			'a@a': "fermata"
		};
	}
	static get parameterArray() {
		return ['position', 'articulation','ctor'];
	}

	static get positionToVex() {
		return {
			'above': 3,
			'below': 4
		};
	}
	static get defaults() {
		return {
			position: SmoArticulation.positions.above,
			articulation: SmoArticulation.articulations.accent
		};

	}
    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoArticulation.defaults,
           SmoArticulation.parameterArray,this,params);
        return params;
    }
	constructor(parameters) {
		super('SmoArticulation');
		smoSerialize.serializedMerge(SmoArticulation.parameterArray,SmoArticulation.defaults,this);
		smoSerialize.serializedMerge(SmoArticulation.parameterArray, parameters, this);
		this.selector = parameters.selector;
	}

}

class SmoLyric extends SmoNoteModifierBase {
	static get defaults() {
		return {
            text:'',
            endChar:'',
            verse:0,
			fontInfo: {
				size: 12,
				family: 'times',
				style: 'normal',
				weight: 'normal'
			},
            fill:'black',
			rotate:0,
			classes:'score-text',
			scaleX:1.0,
			scaleY:1.0,
			translateX:0,
			translateY:0,
		};
	}

    static get parameterArray() {
        return ['text','endChar','fontInfo','classes','verse',
		    'fill','scaleX','scaleY','translateX','translateY','ctor'];
    }
    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoLyric.defaults,
           SmoLyric.parameterArray,this,params);
        return params;
    }

    constructor(parameters) {
		super('SmoLyric');
		smoSerialize.serializedMerge(SmoLyric.parameterArray, SmoLyric.defaults,this);
		smoSerialize.serializedMerge(SmoLyric.parameterArray, parameters, this);

        // calculated adjustments for alignment purposes
		this.adjY=0;
        this.adjX = 0;

		if (!this['attrs']) {
			this.attrs = {
				id: VF.Element.newID(),
				type: 'SmoLyric'
			};
		} else {
		}
	}
}

// ## SmoDynamicText
// ## Description:
// standard dynamics text
class SmoDynamicText extends SmoNoteModifierBase {
	static get defaults() {
		return {
			xOffset: 0,
			fontSize: 38,
			yOffsetLine: 11,
			yOffsetPixels: 0,
			text: SmoDynamicText.dynamics.MP,
		};
	}

	static get dynamics() {
		// matches VF.modifier
		return {
			PP: 'pp',
			P: 'p',
			MP: 'mp',
			MF: 'mf',
			F: 'f',
			FF: 'ff',
			SFZ: 'sfz'
		};
	}

    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoDynamicText.defaults,
           SmoDynamicText.parameterArray,this,params);
        return params;
    }
	constructor(parameters) {
		super('SmoDynamicText');
		Vex.Merge(this, SmoDynamicText.defaults);
		smoSerialize.filteredMerge(SmoDynamicText.parameterArray, parameters, this);
		this.selector = parameters.selector;

		if (!this['attrs']) {
			this.attrs = {
				id: VF.Element.newID(),
				type: 'SmoDynamicText'
			};
		} else {
		}
	}

	static get parameterArray() {
		return ['xOffset', 'fontSize', 'yOffsetLine', 'yOffsetPixels', 'text','ctor'];
	}
	backupOriginal() {
		if (!this['original']) {
			this.original = {};
			smoSerialize.filteredMerge(
				SmoDynamicText.parameterArray,
				this, this.original);
		}
	}
	restoreOriginal() {
		if (this['original']) {
			smoSerialize.filteredMerge(
				SmoDynamicText.parameterArray,
				this.original, this);
			this.original = null;
		}
	}
}
;
// ## SmoMeasure - data for a measure of music
// Many rules of musical engraving are enforced at a measure level, e.g. the duration of
// notes, accidentals, etc.
// ### See Also:
// Measures contain *notes*, *tuplets*, and *beam groups*.  So see `SmoNote`, etc.
// Measures are contained in staves, see also `SystemStaff.js`
// ## SmoMeasure Methods:
class SmoMeasure {
	constructor(params) {
		this.tuplets = [];
        this.svg = {};
		this.beamGroups = [];
		this.modifiers = [];
        this.pageGap = 0;
		this.changed = true;
        this.timestamp=0;
        this.prevY = 0;
        this.prevX = 0;
        this.padLeft=0;
        this.prevFrame=0;
        this.svg.staffWidth=200;
        this.svg.staffX = 0;
        this.svg.staffY = 0;
        this.svg.history=[];
        this.svg.logicalBox={};
        this.svg.yTop = 0;

		var defaults = SmoMeasure.defaults;

		smoSerialize.serializedMerge(SmoMeasure.defaultAttributes, defaults, this);
		smoSerialize.serializedMerge(SmoMeasure.defaultAttributes, params, this);
		this.voices = params.voices ? params.voices : [];
		this.tuplets = params.tuplets ? params.tuplets : [];
		this.modifiers = params.modifiers ? params.modifiers : defaults.modifiers;

        this.setDefaultBarlines();

		if (!this['attrs']) {
			this.attrs = {
				id: VF.Element.newID(),
				type: 'SmoMeasure'
			};
		} else {
			// inherit attrs id for deserialized
		}
	}


	// ### defaultAttributes
	// attributes that are to be serialized for a measure.
	static get defaultAttributes() {
		return [
			'timeSignature', 'keySignature','systemBreak','pageBreak',
			'measureNumber',
			'activeVoice', 'clef', 'transposeIndex', 'activeVoice', 'adjX','padLeft', 'padRight', 'rightMargin'];
	}

	// ### serialize
	// Convert this measure object to a JSON object, recursively serializing all the notes,
	// note modifiers, etc.
	serialize() {
		var params = {};
		smoSerialize.serializedMergeNonDefault(SmoMeasure.defaults,SmoMeasure.defaultAttributes, this, params);
		params.tuplets = [];
		params.voices = [];
		params.modifiers=[];

		this.tuplets.forEach((tuplet) => {
			params.tuplets.push(JSON.parse(JSON.stringify(tuplet)));
		});

		this.voices.forEach((voice) => {
			var obj = {
				notes: []
			};
			voice.notes.forEach((note) => {
				obj.notes.push(note.serialize());
			});
			params.voices.push(obj);
		});

		this.modifiers.forEach((modifier) => {
            /* don't serialize default modifiers */
            if (modifier.ctor == 'SmoBarline' && modifier.position == SmoBarline.positions.start && modifier.barline == SmoBarline.barlines.singleBar) {
                ;
            }
            else if (modifier.ctor == 'SmoBarline' && modifier.position == SmoBarline.positions.end && modifier.barline == SmoBarline.barlines.singleBar) {
                ;
            }
            else if (modifier.ctor == 'SmoRepeatSymbol' && modifier.position == SmoRepeatSymbol.positions.start && modifier.symbol == SmoRepeatSymbol.symbols.None) {
                ;
            } else {
			    params.modifiers.push(modifier.serialize());
            }
		});
		return params;
	}

	// ### deserialize
	// restore a serialized measure object.  Usually called as part of deserializing a score,
	// but can also be used to restore a measure due to an undo operation.
	static deserialize(jsonObj) {
		var voices = [];
        var noteSum = [];
		for (var j = 0; j < jsonObj.voices.length; ++j) {
			var voice = jsonObj.voices[j];
			var notes = [];
			voices.push({
				notes: notes
			});
			for (var i = 0; i < voice.notes.length; ++i) {
				var noteParams = voice.notes[i];
				var smoNote = SmoNote.deserialize(noteParams);
				notes.push(smoNote);
                noteSum.push(smoNote);
			}
		}

		var tuplets = [];
		for (j = 0; j < jsonObj.tuplets.length; ++j) {
            var tupJson = jsonObj.tuplets[j];
            var noteAr = noteSum.filter((nn) => {
                return nn.isTuplet && nn.tuplet.id === tupJson.attrs.id;
            });
            tupJson.notes = noteAr;
			var tuplet = new SmoTuplet(tupJson);
			tuplets.push(tuplet);
		}

		/* var beamGroups = [];
		for (j = 0; j < jsonObj.beamGroups.length; ++j) {
			var smoBeam = new SmoBeamGroup(jsonObj.beamGroups[j]);
			beamGroups.push(smoBeam);
		}  */

		var modifiers = [];
		jsonObj.modifiers.forEach((modParams) => {
			var ctor = eval(modParams.ctor);
			var modifier = new ctor(modParams);
			modifiers.push(modifier);
		});


		var params = {
			voices: voices,
			tuplets: tuplets,
			beamGroups: [],
			modifiers:modifiers
		};

		smoSerialize.serializedMerge(SmoMeasure.defaultAttributes, jsonObj, params);
        var rv = new SmoMeasure(params);
        smoBeamerFactory.applyBeams(rv);

		return rv;
    }

    // ### defaultPitchForClef
	// Accessor for clef objects, which are set at a measure level.
	// #### TODO: learn what all these clefs are
	static get defaultPitchForClef() {
		return {
			'treble': {
				letter: 'b',
				accidental: 'n',
				octave: 4
			},
			'bass': {
				letter: 'd',
				accidental: 'n',
				octave: 3
			},
			'tenor': {
				letter: 'a',
				accidental: 'n',
				octave: 3
			},
			'alto': {
				letter: 'c',
				accidental: 'n',
				octave: 4
			},
			'soprano': {
				letter: 'b',
				accidental: 'n',
				octave: 4
			},
			'percussion': {
				letter: 'b',
				accidental: 'n',
				octave: 4
			},
			'mezzo-soprano': {
				letter: 'b',
				accidental: 'n',
				octave: 4
			},
			'baritone-c': {
				letter: 'b',
				accidental: 'n',
				octave: 3
			},
			'baritone-f': {
				letter: 'e',
				accidental: 'n',
				octave: 3
			},
			'subbass': {
				letter: 'd',
				accidental: '',
				octave: 2
			},
			'french': {
				letter: 'b',
				accidental: '',
				octave: 4
			} // no idea
		}
	}
	// ### getDefaultNotes
	// Get a measure full of default notes for a given timeSignature/clef.
	// returns 8th notes for triple-time meters, etc.
	static getDefaultNotes(params) {
		if (params == null) {
			params = {};
		}
		params.timeSignature = params.timeSignature ? params.timeSignature : '4/4';
		params.clef = params.clef ? params.clef : 'treble';
		var meterNumbers = params.timeSignature.split('/').map(number => parseInt(number, 10));
		var ticks = {
			numerator: 4096,
			denominator: 1,
			remainder: 0
		};
        var beamBeats = ticks.numerator;
		if (meterNumbers[1]  == 8) {
			ticks = {
				numerator: 2048,
				denominator: 1,
				remainder: 0
			};
            beamBeats = 2048*3;
		}
		var pitches =
           JSON.parse(JSON.stringify(SmoMeasure.defaultPitchForClef[params.clef]));
		var rv = [];

		for (var i = 0; i < meterNumbers[0]; ++i) {
			var note = new SmoNote({
					clef: params.clef,
					pitches: [pitches],
					ticks: ticks,
					timeSignature: params.timeSignature,
                    beamBeats:beamBeats
				});
			rv.push(note);
		}
		return rv;
	}

	// ### getDefaultMeasure
	// For create the initial or new measure, get a measure with notes.
	static getDefaultMeasure(params) {
		var obj = {};
		smoSerialize.serializedMerge(SmoMeasure.defaultAttributes, SmoMeasure.defaults, obj);
		smoSerialize.serializedMerge(SmoMeasure.defaultAttributes, params, obj);
		return new SmoMeasure(obj);
	}

	// ### SmoMeasure.getDefaultMeasureWithNotes
	// Get a new measure with the appropriate notes for the supplied clef, instrument
	static getDefaultMeasureWithNotes(params) {
		var measure = SmoMeasure.getDefaultMeasure(params);
		measure.voices.push({
			notes: SmoMeasure.getDefaultNotes(params)
		});
		return measure;
	}


	static get defaultVoice44() {
		return SmoMeasure.getDefaultNotes({
			clef: 'treble',
			timeSignature: '4/4'
		});
	}

    setDefaultBarlines() {
        if (!this.getStartBarline()) {
            this.modifiers.push(new SmoBarline({
    				position: SmoBarline.positions.start,
    				barline: SmoBarline.barlines.singleBar
    			}));
        }
        if (!this.getEndBarline()) {
            this.modifiers.push(new SmoBarline({
    				position: SmoBarline.positions.end,
    				barline: SmoBarline.barlines.singleBar
    			}));
        }
    }
	static get defaults() {
		// var noteDefault = SmoMeasure.defaultVoice44;
		const modifiers = [];
		modifiers.push(new SmoBarline({
				position: SmoBarline.positions.start,
				barline: SmoBarline.barlines.singleBar
			}));
		modifiers.push(new SmoBarline({
				position: SmoBarline.positions.end,
				barline: SmoBarline.barlines.singleBar
			}));
		modifiers.push(new SmoRepeatSymbol({
				position: SmoRepeatSymbol.positions.start,
				symbol: SmoRepeatSymbol.symbols.None
			}));
	    // modifiers.push(new SmoTempoText({tempoMode:SmoTempoText.tempoModes.textMode}));
		// modifiers.push(new SmoRepeatSymbol({symbol:SmoRepeatSymbol.symbols.None});
		return {
			timeSignature: '4/4',
			keySignature: "C",
			canceledKeySignature: null,
			adjX: 0,
            pageBreak:false,
            systemBreak:false,
			adjRight:0,
			padRight: 10,
            padLeft:0,
            tuplets:[],
			transposeIndex: 0,
			modifiers: modifiers,
			rightMargin: 2,
			staffY: 40,
			// bars: [1, 1], // follows enumeration in VF.Barline
			measureNumber: {
				localIndex: 0,
				systemIndex: 0,
				measureNumber: 0,
				staffId: 0
			},
			clef: 'treble',
			changed: true,
			forceClef: false,
			forceKeySignature: false,
			forceTimeSignature: false,
			voices: [],
			activeVoice: 0
		};
	}

    setForcePageBreak(val) {
        this.pageBreak = val;
    }

    setForceSystemBreak(val) {
        this.systemBreak = val;
    }

    getForceSystemBreak() {
        return this.systemBreak;
    }

    getForcePageBreak() {
        return this.pageBreak;
    }

    // ###   SVG mixins
    // We store some rendering data in the instance for UI mapping.
    get staffWidth() {
        return this.svg.staffWidth;
    }

    setWidth(width,description) {
        if (layoutDebug.flagSet('measureHistory')) {
           this.svg.history.push('setWidth '+this.staffWidth+'=> '+width + ' ' + description);
        }
        this.svg.staffWidth = width;
    }

    get staffX() {
        return this.svg.staffX;
    }

    setX(x,description) {
        if (layoutDebug.flagSet('measureHistory')) {
           this.svg.history.push('setX '+this.svg.staffX+'=> '+x + ' ' + description);
        }
        this.svg.staffX = x;

    }

    get staffY() {
        return this.svg.staffY;
    }

    setY(y,description) {
        if (layoutDebug.flagSet('measureHistory')) {
           this.svg.history.push('setY '+this.svg.staffY+'=> '+y + ' ' + description);
        }
        this.svg.staffY = y;
    }

    get logicalBox() {
        return typeof(this.svg.logicalBox['x']) == 'number'  ? this.svg.logicalBox : null;
    }

    get yTop() {
        return this.svg.yTop;
    }

    setYTop(y,description) {
        if (layoutDebug.flagSet('measureHistory')) {
           this.svg.history.push('yTop '+this.svg.yTop+'=> '+y + ' ' + description);
        }
        this.svg.yTop = y;
    }

    deleteLogicalBox(description) {
        this.svg.logicalBox = {};
        this.svg.history.push('delete box ' +description);
    }

    setBox(box,description) {
        if (layoutDebug.flagSet('measureHistory')) {

           this.svg.history.push(description+' ' +JSON.stringify(this.svg.logicalBox) +' => '+
              JSON.stringify(box));
        }
        this.svg.logicalBox = box;
    }

    saveUnjustifiedWidth() {
        this.svg.unjustifiedWidth = this.svg.staffWidth;
    }

    // ### getClassId
    // create a identifier unique to this measure index so it can be easily removed.
    getClassId() {
        return 'mm-'+this.measureNumber.staffId+'-'+this.measureNumber.measureIndex;
    }

    pickupMeasure(duration) {
        var proto = SmoMeasure.deserialize(this.serialize());
        proto.attrs.id =  VF.Element.newID();
        var note = proto.voices[0].notes[0];
        proto.voices = [];
        note.pitches = [note.pitches[0]];
        note.ticks.numerator = duration;
        note.makeRest();
        proto.voices.push({notes:[note]});
        return proto;
    }

	// ### getRenderedNote
	// The renderer puts a mapping between rendered svg groups and
	// the logical notes in SMO.  The UI needs this mapping to be interactive,
	// figure out where a note is rendered, what its bounding box is, etc.
	getRenderedNote(id) {
		for (var j = 0; j < this.voices.length; ++j) {
			var voice = this.voices[j];
			for (var i = 0; i < voice.notes.length; ++i) {
				var note = voice.notes[i];
				if (note.renderId === id) {
					return {
						smoNote: note,
						voice: j,
						tick: i
					};
				}
			}
		}
		return null;
	}

	/* set notes(val) {
		this.voices[this.activeVoice].notes = val;
	}  */

    getNotes() {
        return this.voices[this.activeVoice].notes;
    }

    getActiveVoice() {
        return this.activeVoice;
    }

    setActiveVoice(vix) {
        if (vix >= 0 && vix < this.voices.length) {
            this.activeVoice=vix;
        }
    }



    tickmapForVoice(voiceIx) {
        var tickmap = new smoTickIterator(this,{voice:voiceIx});
        tickmap.iterate(smoTickIterator.nullActor,this);
        return tickmap;
    }

    // ### createMeasureTickmaps
    // A tickmap is a map of notes to ticks for the measure.  It is speciifc per-voice
    // since each voice may have different numbers of ticks.  The accidental map is
    // overall since accidentals in one voice apply to accidentals in the other
    // voices.  So we return the tickmaps and the overall accidental map.
    createMeasureTickmaps() {
        var tickmapArray=[];
        var accidentalMap = {};
        for (var i = 0;i< this.voices.length;++i) {
            tickmapArray.push(this.tickmapForVoice(i));
        }

        for (var i = 0;i< this.voices.length;++i) {
            var voice = this.voices[i];
            var tickmap = tickmapArray[i];
            var durationKeys = Object.keys(tickmap.durationAccidentalMap)

            durationKeys.forEach((durationKey) => {
                if (!accidentalMap[durationKey]) {
                    accidentalMap[durationKey] = tickmap.durationAccidentalMap[durationKey];
                } else {
                    var amap = accidentalMap[durationKey];
                    var amapKeys = Object.keys(amap);
                    var pitchKeys = Object.keys(tickmap.durationAccidentalMap[durationKey]);
                    pitchKeys.forEach((pitchKey) => {
                        if (!amap[pitchKey]) {
                            amap[pitchKey] = tickmap.durationAccidentalMap[durationKey][pitchKey];
                        }
                    });
                }
            });
        }
        var accidentalArray = [];
        Object.keys(accidentalMap).forEach((durationKey) => {
            accidentalArray.push({duration:durationKey,pitches:accidentalMap[durationKey]});
        });
        return {
            tickmaps:tickmapArray,
            accidentalMap:accidentalMap,
            accidentalArray:accidentalArray
        };
    }

    getTicksFromVoice() {
        var ticks = 0;
        this.voices[0].notes.forEach((note) => {
            ticks += note.tickCount;
        });
        return ticks;
    }

    isPickup() {
        var ticks = this.getTicksFromVoice();
        var goal = smoMusic.timeSignatureToTicks(this.timeSignature);
        return (ticks < goal);
    }

	// ### getDynamicMap
	// ### Description:
	// returns the dynamic text for each tick index.  If
	// there are no dynamics, the empty array is returned.
	getDynamicMap() {
		var rv = [];
		var hasDynamic = false;
		this.voices.forEach((voice) => {
			voice.notes.forEach((note) => {
				if (note.dynamicText) {
					rv.push({
						note: note,
						text: note.dynamicText
					});
					hasDynamic = true;
				} else {
					rv.push({
						note: note,
						text: ''
					});
				}
			});
		});

		if (hasDynamic) {
			return rv;
		}
		return [];
	}

	clearBeamGroups() {
		this.beamGroups = [];
	}

    // ### tuplet methods.

    // #### tupletNotes
	tupletNotes(tuplet) {
		var notes = [];
		for (var j = 0; j < this.voices.length; ++j) {
			var notes = this.voices[j].notes;
			for (var i = 0; i < notes.length; ++i) {
				if (notes[i]['tuplet'] && notes[i].tuplet.id === tuplet.attrs.id) {
					notes.push(notes[i]);
				}
			}
		}
		return notes;
	}

    // #### tupletIndex
    // return the index of the given tuplet
	tupletIndex(tuplet) {
		for (var j = 0; j < this.voices.length; ++j) {
			var notes = this.voices[j].notes;
			for (var i = 0; i < notes.length; ++i) {
				if (notes[i]['tuplet'] && notes[i].tuplet.id === tuplet.attrs.id) {
					return i;
				}
			}
		}
		return -1;
	}

    // #### getTupletForNote
    // Finds the tuplet for a given note, or null if there isn't one.
    getTupletForNote(note) {
		if (!note.isTuplet) {
			return null;
		}
		for (var i = 0; i < this.tuplets.length; ++i) {
			var tuplet = this.tuplets[i];
			if (tuplet.attrs.id === note.tuplet.id) {
				return tuplet;
			}
		}
		return null;
	}
	removeTupletForNote(note) {
		var tuplets = [];
		for (var i = 0; i < this.tuplets.length; ++i) {
			var tuplet = this.tuplets[i];
			if (note.tuplet.id !== tuplet.attrs.id) {
				tuplets.push(tuplet);
			}
		}
		this.tuplets = tuplets;
	}

    // ### populateVoice
    // Create a new voice in this measure, and populate it with the default note
    // for this measure/key/clef
    populateVoice(index) {
        if (index !=  this.voices.length ) {
            return;
        }
        this.voices.push({notes:SmoMeasure.getDefaultNotes(this)});
        this.activeVoice = index;
        this.changed = true;
    }

    // ### measure modifier mixins
    _addSingletonModifier(name,parameters) {
        var ctor = eval(name);
        var ar= this.modifiers.filter(obj => obj.attrs.type != name);
        this.modifiers=ar;
        this.modifiers.push(new ctor(parameters));
    }
    _removeSingletonModifier(name) {
        var ar= this.modifiers.filter(obj => obj.attrs.type != name);
        this.modifiers=ar;
    }

    _getSingletonModifier(name) {
        return this.modifiers.find(obj => obj.attrs.type == name);
    }

    addRehearsalMark(parameters) {
        this._addSingletonModifier('SmoRehearsalMark',parameters);
    }
	removeRehearsalMark() {
        this._removeSingletonModifier('SmoRehearsalMark');
    }
    getRehearsalMark() {
        return this._getSingletonModifier('SmoRehearsalMark');
    }
    getModifiersByType(type) {
        return this.modifiers.filter((mm) => {
            return type == mm.attrs.type;
        });
    }

    addTempo(params) {
        this._addSingletonModifier('SmoTempoText',params);
    }
    removeTempo(params) {
        this._removeSingletonModifier('SmoTempoText',params);
    }
    getTempo() {
        return this._getSingletonModifier('SmoTempoText');
    }
	addMeasureText(mod) {
		var added = false;
		var exist = this.modifiers.filter((mm) => {
			return mm.attrs.id === mod.attrs.id;
		});
		if (exist.length) {
			this.setChanged(); // already added but set changed===true to re-justify
			return;
		}
		this.modifiers.push(mod);
		this.setChanged();
	}

	getMeasureText() {
		return this.modifiers.filter(obj => obj.ctor === 'SmoMeasureText');
	}

	removeMeasureText(id) {
		var ar= this.modifiers.filter(obj => obj.attrs.id != id);
		this.modifiers=ar;
		this.setChanged();
	}

	setRepeatSymbol(rs) {
		var ar = [];
		var toAdd = true;
		var exSymbol = this.getRepeatSymbol();
		if (exSymbol && exSymbol.symbol === rs.symbol) {
			toAdd = false;
		}
		this.modifiers.forEach((modifier) => {
			if (modifier.ctor != 'SmoRepeatSymbol') {
				ar.push(modifier);
			}
		});
		this.modifiers = ar;
		if (toAdd) {
			ar.push(rs);
		}
	}
	getRepeatSymbol() {
		var rv = this.modifiers.filter(obj => obj.ctor === 'SmoRepeatSymbol');
		return rv.length ? rv[0] : null;
	}
	clearRepeatSymbols() {
		var ar = [];
		this.modifiers.forEach((modifier) => {
			if (modifier.ctor != 'SmoRepeatSymbol') {
				ar.push(modifier);
			}
		});
		this.modifiers = ar;
	}
	setBarline(barline) {
		var ar = [];
		this.modifiers.forEach((modifier) => {
			if (modifier.ctor != 'SmoBarline' || modifier.position != barline.position) {
				ar.push(modifier);
			}
		});
		this.modifiers = ar;
		ar.push(barline);
	}

	_getBarline(pos) {
		var rv = null;
		this.modifiers.forEach((modifier) => {
			if (modifier.ctor === 'SmoBarline' && modifier.position === pos) {
				rv = modifier;
			}
		});
		return rv;
	}
	getEndBarline() {
		return this._getBarline(SmoBarline.positions.end);
	}
	getStartBarline() {
		return this._getBarline(SmoBarline.positions.start);
	}

	addNthEnding(ending) {
		var mods = [];
		this.modifiers.forEach((modifier) => {
			if (modifier.ctor != 'SmoVolta' || modifier.startBar != ending.startBar || modifier.endBar != ending.endBar) {
				mods.push(modifier);
			}
		});
		mods.push(ending);
		this.modifiers = mods;
	}

	removeNthEnding(number) {
		var mods = [];
		this.modifiers.forEach((modifier) => {
			if (modifier.ctor != 'SmoVolta' || modifier.number != number) {
				mods.push(modifier);
			}
		});
		this.modifiers = mods;
	}

	getNthEndings() {
		var rv = [];
		this.modifiers.forEach((modifier) => {
			if (modifier.ctor === 'SmoVolta') {
				rv.push(modifier);
			}
		});
		return rv;
	}
	getEndEndings() {
		var rv = null;
		this.modifiers.forEach((modifier) => {
			if (modifier.ctor === 'SmoVolta' && modifier.endBar === this.measureNumber.systemIndex
				 && modifier.startBar != this.measureNumber.systemIdnex) {
				rv.push(modifier);
			}
		});
		return rv;
	}
	getMidEndings() {
		var rv = null;
		this.modifiers.forEach((modifier) => {
			if (modifier.ctor === 'SmoVolta' && modifier.endBar > this.measureNumber.systemIndex
				 && modifier.startBar < this.measureNumber.systemIndex) {
				rv.push(modifier);
			}
		});
		return rv;
	}



	get numBeats() {
		return this.timeSignature.split('/').map(number => parseInt(number, 10))[0];
	}
	setKeySignature(sig) {
		this.keySignature = sig;
		this.setChanged();
		this.voices.forEach((voice) => {
			voice.notes.forEach((note) => {
				note.keySignature = sig;
			});
		});
	}
    setChanged() {
        this.changed = true;
        this.prevFrame=0;
        this.timestamp = Date.now();
    }
	get beatValue() {
		return this.timeSignature.split('/').map(number => parseInt(number, 10))[1];
	}

	setMeasureNumber(num) {
		this.measureNumber = num;
	}

	getBeamGroupForNote(note) {
		for (var i = 0; i < this.beamGroups.length; ++i) {
			var bg = this.beamGroups[i];
			for (var j = 0; j < bg.notes.length; ++j) {
				if (bg.notes[j].attrs.id === note.attrs.id) {
					return bg;
				}
			}
		}
		return null;
	}
}
;
// ## Measure modifiers are elements that are attached to the bar itself, like barlines or measure-specific text,
// repeats - lots of stuff
class SmoMeasureModifierBase {
    constructor(ctor) {
        this.ctor = ctor;
		 if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: ctor
            };
        } else {
            console.log('inherit attrs');
        }
    }
    static deserialize(jsonObj) {
        var ctor = eval(jsonObj.ctor);
        var rv = new ctor(jsonObj);
        return rv;
    }
}

class SmoBarline extends SmoMeasureModifierBase {
    static get positions() {
        return {
            start: 0,
            end: 1
        }
    };

    static get barlines() {
        return {
            singleBar: 0,
            doubleBar: 1,
            endBar: 2,
            startRepeat: 3,
            endRepeat: 4,
            noBar: 5
        }
    }

	static get _barlineToString() {
		return  ['singleBar','doubleBar','endBar','startRepeat','endRepeat','noBar'];
	}
	static barlineString(inst) {
		return SmoBarline._barlineToString[inst.barline];
	}

    static get defaults() {
        return {
            position: SmoBarline.positions.end,
            barline: SmoBarline.barlines.singleBar
        };
    }

    static get attributes() {
        return ['position', 'barline'];
    }
	serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoBarline.defaults,SmoBarline.attributes,this,params);
        params.ctor = 'SmoBarline';
        return params;
	}

    constructor(parameters) {
        super('SmoBarline');
        parameters = parameters ? parameters : {};
        smoSerialize.serializedMerge(SmoBarline.attributes, SmoBarline.defaults, this);
        smoSerialize.serializedMerge(SmoBarline.attributes, parameters, this);
    }

    static get toVexBarline() {
        return [VF.Barline.type.SINGLE, VF.Barline.type.DOUBLE, VF.Barline.type.END,
            VF.Barline.type.REPEAT_BEGIN, VF.Barline.type.REPEAT_END, VF.Barline.type.NONE];

    }
    static get toVexPosition() {
        return [VF.StaveModifier.BEGIN, VF.StaveModifier.END];
    }

    toVexBarline() {
        return SmoBarline.toVexBarline[this.barline];
    }
    toVexPosition() {
        return SmoBarline.toVexPosition[this.position];
    }
}

class SmoRepeatSymbol extends SmoMeasureModifierBase {
    static get symbols() {
        return {
            None: 0,
            Coda: 1,
            Segno: 2,
            Dc: 3,
			ToCoda:1,
            DcAlCoda: 4,
            DcAlFine: 5,
            Ds: 6,
            DsAlCoda: 7,
            DsAlFine: 8,
            Fine: 9
        };
    }

	static get defaultXOffset() {
		return [0,0,0,-20,-60,-60,-50,-60,-50,-40];
	}
    static get positions() {
        return {
            start: 0,
            end: 1
        }
    };
    static get defaults() {
        return {
            symbol: SmoRepeatSymbol.Coda,
            xOffset: 0,
            yOffset: 30,
            position: SmoRepeatSymbol.positions.end
        }
    }
    static get toVexSymbol() {
        return [VF.Repetition.type.NONE, VF.Repetition.type.CODA_LEFT, VF.Repetition.type.SEGNO_LEFT, VF.Repetition.type.DC,
            VF.Repetition.type.DC_AL_CODA, VF.Repetition.type.DC_AL_FINE, VF.Repetition.type.DS, VF.Repetition.type.DS_AL_CODA, VF.Repetition.type.DS_AL_FINE, VF.Repetition.type.FINE];
    }
    static get attributes() {
        return ['symbol', 'xOffset', 'yOffset', 'position'];
    }
    toVexSymbol() {
        return SmoRepeatSymbol.toVexSymbol[this.symbol];
    }
	serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoRepeatSymbol.defaults,SmoRepeatSymbol.attributes,this,params);
        params.ctor = 'SmoRepeatSymbol';
        return params;
	}
    constructor(parameters) {
        super('SmoRepeatSymbol');
        smoSerialize.serializedMerge(SmoRepeatSymbol.attributes, SmoRepeatSymbol.defaults, this);
		this.xOffset = SmoRepeatSymbol.defaultXOffset[parameters.symbol];
        smoSerialize.serializedMerge(SmoRepeatSymbol.attributes, parameters, this);
    }
}

class SmoVolta extends SmoMeasureModifierBase {
    constructor(parameters) {
        super('SmoVolta');
		this.original={};


        smoSerialize.serializedMerge(SmoVolta.attributes, SmoVolta.defaults, this);
		smoSerialize.serializedMerge(SmoVolta.attributes, parameters, this);
    }
	get id() {
		return this.attrs.id;
	}

	get type() {
		return this.attrs.type;
	}
    static get attributes() {
        return ['startBar', 'endBar', 'endingId','startSelector','endSelector','xOffsetStart', 'xOffsetEnd', 'yOffset', 'number'];
    }
	static get editableAttributes() {
		return ['xOffsetStart','xOffsetEnd','yOffset','number'];
	}

	serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoVolta.defaults,SmoVolta.attributes,this,params);
        params.ctor = 'SmoVolta';
        return params;
	}

    static get defaults() {
        return {
            startBar: 1,
            endBar: 1,
            xOffsetStart: 0,
            xOffsetEnd: 0,
            yOffset: 20,
            number: 1
        }
    }

	 backupOriginal() {
        if (!this['original']) {
            this.original = {};
            smoSerialize.filteredMerge(
                SmoVolta.attributes,
                this, this.original);
        }
    }
    restoreOriginal() {
        if (this['original']) {
            smoSerialize.filteredMerge(
                SmoVolta.attributes,
                this.original, this);
            this.original = null;
        }
    }

	toVexVolta(measureNumber) {
		if (this.startBar === measureNumber && this.startBar === this.endBar) {
			return VF.Volta.type.BEGIN_END;
		}
		if (this.startBar === measureNumber) {
			return VF.Volta.type.BEGIN;
		}
		if (this.endBar === measureNumber) {
			return VF.Volta.type.END;
		}
		if (this.startBar < measureNumber && this.endBar > measureNumber) {
			return VF.Volta.type.MID;
		}
		return VF.Volta.type.NONE;
	}
}

class SmoMeasureText extends SmoMeasureModifierBase {
	static get positions() {
		return {above:0,below:1,left:2,right:3,none:4};
	}

	static get justifications() {
		return {left:0,right:1,center:2}
	}

	static get _positionToString() {
		return ['above','below','left','right'];
	}

	static get toVexPosition() {
		return [VF.Modifier.Position.ABOVE,VF.Modifier.Position.BELOW,VF.Modifier.Position.LEFT,VF.Modifier.Position.RIGHT];
	}
	static get toVexJustification() {
		return [VF.TextNote.LEFT,VF.TextNote.RIGHT,VF.TextNote.CENTER];
	}

	toVexJustification() {
		return SmoMeasureText.toVexJustification[this.justification];
	}
	toVexPosition() {
		return SmoMeasureText.toVexPosition[parseInt(this.position)];
	}
	static get attributes() {
		return ['position','fontInfo','text','adjustX','adjustY','justification'];
	}

	static get defaults() {
		return {
			position:SmoMeasureText.positions.above,
			fontInfo: {
				size: '9',
				family:'times',
				style:'normal',
				weight:'normal'
			},
			text:'Smo',
			adjustX:0,
			adjustY:0,
			justification:SmoMeasureText.justifications.center
		};
	}
	serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoMeasureText.defaults,SmoMeasureText.attributes,this,params)
        params.ctor = 'SmoMeasureText';
        return params;
	}

	constructor(parameters) {
		super('SmoMeasureText');
        parameters = parameters ? parameters : {};
        smoSerialize.serializedMerge(SmoMeasureText.attributes, SmoMeasureText.defaults, this);
        smoSerialize.serializedMerge(SmoMeasureText.attributes, parameters, this);

		// right-justify left text and left-justify right text by default
		if (!parameters['justification']) {
			this.justification = (this.position === SmoMeasureText.positions.left) ? SmoMeasureText.justifications.right :
			     (this.position === SmoMeasureText.positions.right ? SmoMeasureText.justifications.left : this.justification);
		}
	}
}

class SmoRehearsalMark extends SmoMeasureModifierBase {

	static get cardinalities() {
		return {capitals:'capitals',lowerCase:'lowerCase',numbers:'numbers'};
	}
	static get positions() {
		return {above:0,below:1,left:2,right:3};
	}
	static get _positionToString() {
		return ['above','below','left','right'];
	}

	// TODO: positions don't work.
	static get defaults() {
		return {
			position:SmoRehearsalMark.positions.above,
			cardinality:SmoRehearsalMark.cardinalities.capitals,
			symbol:'A',
            increment:true
		}
	}
	static get attributes() {
		return ['cardinality','symbol','position','increment'];
	}
	getIncrement() {
		if (!this.cardinality != 'number') {
			var code = this.symbol.charCodeAt(0);
			code += 1;
			var symbol=String.fromCharCode(code);
			return symbol;
		} else {
            return parseInt(symbol)+1;
        }
	}
    getInitial() {
        return this.cardinality == SmoRehearsalMark.cardinalities.capitals ? 'A' :
            (this.cardinality == SmoRehearsalMark.cardinalities.lowerCase ? 'a' : '1');
    }
	serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoRehearsalMark.defaults,SmoRehearsalMark.attributes,this,params)
        params.ctor = 'SmoRehearsalMark';
        return params;
	}
	constructor(parameters) {
		super('SmoRehearsalMark');
        parameters = parameters ? parameters : {};
        smoSerialize.serializedMerge(SmoRehearsalMark.attributes, SmoRehearsalMark.defaults, this);
        smoSerialize.serializedMerge(SmoRehearsalMark.attributes, parameters, this);
        if (!parameters.symbol) {
            this.symbol=this.getInitial();
        }
	}
}


// ### SmoTempoText
// Tempo marking and also the information about the tempo.
class SmoTempoText extends SmoMeasureModifierBase {
	static get tempoModes() {
		return {
			durationMode: 'duration',
			textMode: 'text',
			customMode: 'custom'
		};
	}

	static get tempoTexts() {
		return {
			larghissimo: 'Larghissimo',
			grave: 'Grave',
			lento: 'Lento',
			largo: 'Largo',
			larghetto: 'Larghetto',
			adagio: 'Adagio',
			adagietto: 'Adagietto',
			andante_moderato: 'Andante moderato',
			andante: 'Andante',
			andantino: 'Andantino',
			moderator: 'Moderato',
			allegretto: 'Allegretto',
			allegro: 'Allegro',
			vivace: 'Vivace',
			presto: 'Presto',
			prestissimo: 'Prestissimo'
		};
	}

	static get defaults() {
		return {
			tempoMode: SmoTempoText.tempoModes.durationMode,
			bpm: 120,
			beatDuration: 4096,
			tempoText: SmoTempoText.tempoTexts.allegro,
            yOffset:0,
            display:false
		};
	}
	static get attributes() {
		return ['tempoMode', 'bpm', 'display', 'beatDuration', 'tempoText','yOffset'];
	}
    _toVexTextTempo() {
        return {name:this.tempoText};
    }

    // ### eq
    // Return equality wrt the tempo marking, e.g. 2 allegro in textMode will be equal but
    // an allegro and duration 120bpm will not.
    static eq (t1,t2) {
    	if (t1.tempoMode != t2.tempoMode) {
    		return false;
    	}
    	if (t1.tempoMode == SmoTempoText.tempoModes.durationMode) {
    		return t1.bpm == t2.bpm && t1.beatDuration == t2.beatDuration;
    	}
    	if (t1.tempoMode == SmoTempoText.tempoModes.textMode) {
    		return t1.tempoText == t2.tempoText;
    	} else {
    		return t1.bpm == t2.bpm && t1.beatDuration == t2.beatDuration &&
    		    t1.tempoText == t2.tempoText;
    	}
    }
    static get bpmFromText() {
        // TODO: learn these
        var rv = {};
        rv[SmoTempoText.tempoTexts.larghissimo] = 40;
        rv[SmoTempoText.tempoTexts.grave] = 40;
		rv[SmoTempoText.tempoTexts.lento] = 42;
		rv[SmoTempoText.tempoTexts.largo] = 46;
		rv[SmoTempoText.tempoTexts.larghetto] = 52;
		rv[SmoTempoText.tempoTexts.adagio] = 72;
		rv[SmoTempoText.tempoTexts.adagietto] = 72;
		rv[SmoTempoText.tempoTexts.andante_moderato] = 72;
		rv[SmoTempoText.tempoTexts.andante] = 72;
		rv[SmoTempoText.tempoTexts.andantino] = 84;
		rv[SmoTempoText.tempoTexts.moderator] = 96;
		rv[SmoTempoText.tempoTexts.allegretto] = 96;
		rv[SmoTempoText.tempoTexts.allegro] = 120;
		rv[SmoTempoText.tempoTexts.vivace] = 144;
		rv[SmoTempoText.tempoTexts.presto] = 168;
		rv[SmoTempoText.tempoTexts.prestissimo] = 240;
        return rv;
    }

    _toVexDurationTempo() {
        var vd = smoMusic.ticksToDuration[this.beatDuration];
        var dots = (vd.match(/d/g) || []).length;
        vd=vd.replace(/d/g,'');
        return {duration: vd, dots: dots, bpm: this.bpm };
    }
    toVexTempo() {
        if (this.tempoMode ==  SmoTempoText.tempoModes.durationMode) {
            return this._toVexDurationTempo();
        }
        return this._toVexTextTempo();
    }
    backupOriginal() {
        this.backup = {};
        smoSerialize.serializedMerge(SmoTempoText.attributes, this, this.backup);
    }
    restoreOriginal() {
        smoSerialize.serializedMerge(SmoTempoText.attributes, this.backup, this);
    }
    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoTempoText.defaults,SmoTempoText.attributes,this,params)
        params.ctor = 'SmoTempoText';
        return params;
	}
	constructor(parameters) {
		super('SmoTempoText');
        parameters = parameters ? parameters : {};
		smoSerialize.serializedMerge(SmoTempoText.attributes, SmoTempoText.defaults, this);
		smoSerialize.serializedMerge(SmoTempoText.attributes, parameters, this);
	}
}
;

// ## SmoSystemStaff
// ## Description:
// A staff is a line of music that can span multiple measures.
// A system is a line of music for each staff in the score.  So a staff
// spans multiple systems.
// A staff modifier connects 2 points in the staff.
class SmoSystemStaff {
    constructor(params) {
        this.measures = [];
        Vex.Merge(this, SmoSystemStaff.defaults);
        Vex.Merge(this, params);
        if (this.measures.length) {
            this.numberMeasures();
        }
        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoSystemStaff'
            };
        } else {
            // inherit attrs id for deserialized

        }
    }

    // ### defaultParameters
    // the parameters that get saved with the score.
	static get defaultParameters() {
		return [
		'staffId','staffX','staffY','adjY','staffWidth','staffHeight','startIndex',
            'renumberingMap','keySignatureMap','instrumentInfo'];
	}

    // ### defaults
    // default values for all instances
    static get defaults() {
        return {
            staffX: 10,
            staffY: 40,
            adjY: 0,
            staffWidth: 1600,
            staffHeight: 90,
            startIndex: 0,
			staffId:0,
            renumberingMap: {},
            keySignatureMap: {},
            instrumentInfo: {
                instrumentName: 'Treble Instrument',
                keyOffset: '0',
                clef: 'treble'
            },
            measures: [],
            modifiers: []
        };
    }

    // ### serialize
    // JSONify self.
	serialize() {
		var params={};
		smoSerialize.serializedMerge(SmoSystemStaff.defaultParameters,this,params);
		params.modifiers=[];
		params.measures=[];


		this.measures.forEach((measure) => {
			params.measures.push(measure.serialize());
		});

		this.modifiers.forEach((modifier) => {
			params.modifiers.push(modifier.serialize());
		});

		return params;
	}

     // ### deserialize
     // parse formerly serialized staff.
    static deserialize(jsonObj) {
        var params = {};
        smoSerialize.serializedMerge(
            ['staffId','staffX', 'staffY', 'staffWidth', 'startIndex', 'renumberingMap', 'renumberIndex', 'instrumentInfo'],
            jsonObj, params);
        params.measures = [];
        jsonObj.measures.forEach(function (measureObj) {
            var measure = SmoMeasure.deserialize(measureObj);
            params.measures.push(measure);
        });

        var rv = new SmoSystemStaff(params);

        if (jsonObj.modifiers) {
            jsonObj.modifiers.forEach((params) => {
                var mod = StaffModifierBase.deserialize(params);
                rv.modifiers.push(mod);
            });
        }
		return rv;
    }

   // ### addStaffModifier
   // add a staff modifier, or replace a modifier of same type
   // with same endpoints.
    addStaffModifier(modifier) {
        this.removeStaffModifier(modifier);
        this.modifiers.push(modifier);
    }

    // ### removeStaffModifier
    // Remove a modifier of given type and location
    removeStaffModifier(modifier) {
        var mods = [];
        this.modifiers.forEach((mod) => {
            if (mod.attrs.id != modifier.attrs.id) {
                mods.push(mod);
            }
        });
        this.modifiers = mods;
    }

    // ### getModifiersAt
    // get any modifiers at the selected location
	getModifiersAt(selector) {
		var rv = [];
		this.modifiers.forEach((mod) => {
			if (SmoSelector.sameNote(mod.startSelector,selector)) {
				rv.push(mod);
			}
		});
		return rv;
	}

    // ### getSlursStartingAt
    // like it says.  Used by audio player to slur notes
    getSlursStartingAt(selector) {
        return this.modifiers.filter((mod) => {
            return SmoSelector.sameNote(mod.startSelector,selector)
               && mod.attrs.type == 'SmoSlur';
        });
    }

    // ### getSlursEndingAt
    // like it says.
    getSlursEndingAt(selector) {
        return this.modifiers.filter((mod) => {
            return SmoSelector.sameNote(mod.endSelector,selector);
        });
    }

    // ### accesor getModifiers
    getModifiers() {
        return this.modifiers;
    }

    // ### applyBeams
    // group all the measures' notes into beam groups.
    applyBeams() {
        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];
            smoBeamerFactory.applyBeams(measure);
        }
    }

    // ### getRenderedNote
    // used by mapper to get the rendered note from it's SVG DOM ID.
    getRenderedNote(id) {
        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];
            var note = measure.getRenderedNote(id);
            if (note)
                return {
                    smoMeasure: measure,
                    smoNote: note.smoNote,
                    smoSystem: this,
                    selection: {
                        measureIndex: measure.measureNumber.measureIndex,
                        voice: measure.activeVoice,
                        tick: note.tick,
                        maxTickIndex: measure.notes.length,
                        maxMeasureIndex: this.measures.length
                    },
                    type: note.smoNote.attrs.type,
                    id: note.smoNote.attrs.id
                };
        }
        return null;
    }

    // ### addRehearsalMark
    // for all measures in the system, and also bump the
    // auto-indexing
    addRehearsalMark(index,parameters) {
        var mark = new SmoRehearsalMark(parameters);
        if (!mark.increment) {
            this.measures[index].addRehearsalMark(mark);
            return;
        }

        var symbol = mark.symbol;
        for (var i=0;i<this.measures.length;++i) {
            var mm = this.measures[i];
            if (i < index) {
                var rm = mm.getRehearsalMark();
                if (rm && rm.cardinality==mark.cardinality && rm.increment) {
                   symbol = rm.getIncrement();
                   mark.symbol=symbol;
                }
            }
            if (i === index) {
                mm.addRehearsalMark(mark);
                symbol = mark.getIncrement();
            }
            if (i > index) {
                var rm = mm.getRehearsalMark();
                if (rm && rm.cardinality==mark.cardinality && rm.increment) {
                    rm.symbol = symbol;
                    symbol = rm.getIncrement();
                }
            }
        }
    }

    removeTempo(index) {
        this.measures[index].removeTempo();
    }

    addTempo(tempo,index) {
        this.measures[index].addTempo(tempo);
    }

    // ### removeRehearsalMark
    // for all measures in the system, and also decrement the
    // auto-indexing
    removeRehearsalMark(index) {
        var ix = 0;
        var symbol=null;
        var card = null;
        this.measures.forEach((measure) => {
            if (ix == index) {
                var mark = measure.getRehearsalMark();
                if (mark) {
                    symbol = mark.symbol;
                    card = mark.cardinality;
                }
                measure.removeRehearsalMark();
            }
            if (ix > index && symbol && card) {
                var mark = measure.getRehearsalMark();
                if (mark && mark.increment) {
                    mark.symbol = symbol;
                    symbol = mark.getIncrement();
                }
            }

            ix += 1;
        });
    }

    // ### deleteMeasure
    // delete the measure, and any staff modifiers that start/end there.
	deleteMeasure(index) {
		if (this.measures.length < 2) {
			return; // don't delete last measure.
		}
		var nm=[];
		this.measures.forEach((measure) => {
			if (measure.measureNumber.measureIndex != index) {
				nm.push(measure);
			}
		});
		var sm=[];
		this.modifiers.forEach((mod)=> {
            // Bug: if we are deleting a measure before the selector, change the measure number.
			if (mod.startSelector.measure != index && mod.endSelector.measure != index) {
                if (index < mod.startSelector.measure) {
                    mod.startSelector.measure -= 1;
                }
                if (index < mod.endSelector.measure) {
                    mod.endSelector.measure -= 1;
                }
				sm.push(mod);
			}
		});
		this.measures=nm;
		this.modifiers=sm;
		this.numberMeasures();
	}

    // ### addKeySignature
    // Add key signature to the given measure and update map so we know
    // when it changes, cancels etc.
    addKeySignature(measureIndex, key) {
        this.keySignatureMap[measureIndex] = key;
		var target = this.measures[measureIndex];
		target.keySignature = key;
        // this._updateKeySignatures();
    }

    // ### removeKeySignature
    // remove key signature and update map so we know
    // when it changes, cancels etc.
    removeKeySignature(measureIndex) {
        var keys = Object.keys(this.keySignatureMap);
        var nmap = {};
        keys.forEach((key) => {
            if (key !== measureIndex) {
                nmap[key] = this.keySignatureMap[key];
            }
        });
        this.keySignatureMap = nmap;
        this._updateKeySignatures();
    }
    _updateKeySignatures() {
        var currentSig = this.measures[0].keySignature;

        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];

            var nextSig = this.keySignatureMap[i] ? this.keySignatureMap[i] : currentSig;
            measure.setKeySignature(nextSig);
        }
    }

    // ### numberMeasures
    // After anything that might change the measure numbers, update them iteratively
    numberMeasures() {
        this.renumberIndex = this.startIndex;
        var currentOffset = 0;
        if (this.measures[0].getTicksFromVoice(0) < smoMusic.timeSignatureToTicks(this.measures[0].timeSignature)) {
            currentOffset = -1;
        }

        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];

            this.renumberIndex = this.renumberingMap[i] ? this.renumberingMap[i].startIndex : this.renumberIndex;
            var localIndex = this.renumberIndex + i + currentOffset;
            // If this is the first full measure, call it '1'
            var numberObj = {
                measureNumber: localIndex,
                measureIndex: i + this.startIndex,
                systemIndex: i,
				staffId:this.staffId
            }
            measure.setMeasureNumber(numberObj);
			// If we are renumbering measures, we assume we want to redo the layout so set measures to changed.
			measure.changed=true;
        }
    }
    getSelection(measureNumber, voice, tick, pitches) {
        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];
            if (measure.measureNumber.measureNumber === measureNumber) {
                var target = this.measures[i].getSelection(voice, tick, pitches);
                if (!target) {
                    return null;
                }
                return ({
                    measure: measure,
                    note: target.note,
                    selection: target.selection
                });
            }
        }
        return null;
    }

    addDefaultMeasure(index, params) {
        var measure = SmoMeasure.getDefaultMeasure(params);
        this.addMeasure(index, measure);
    }

    // ## addMeasure
    // ## Description:
    // Add the measure at the specified index, splicing the array as required.
    addMeasure(index, measure) {

        if (index === 0 && this.measures.length) {
            measure.setMeasureNumber(this.measures[0].measureNumber);
        }
        if (index >= this.measures.length) {
            this.measures.push(measure);
        } else {
            this.measures.splice(index, 0, measure);
        }
        var modifiers = this.modifiers.filter((mod) => mod.startSelector.measure >= index);
        modifiers.forEach((mod) => {
            if (mod.startSelector.measure < this.measures.length) {
                mod.startSelector.measure += 1;
            }
            if (mod.endSelector.measure < this.measures.length) {
                mod.endSelector.measure += 1;
            }
        });

        this.numberMeasures();
    }
}
;
// ## SmoScore
// ## Description:
// The whole score.
// ## Score methods:
// ---
class SmoScore {
    constructor(params) {
        Vex.Merge(this, SmoScore.defaults);
        Vex.Merge(this, params);
        if (!this.layout.pages) {
            this.layout.pages = 1;
        }
        if (this.staves.length) {
            this._numberStaves();
        }
    }
	static get zoomModes() {
		return {fitWidth:0,wholePage:1,zoomScale:2}
	}
    static get defaults() {
        return {
			layout :{
				leftMargin:30,
				rightMargin:30,
				topMargin:40,
				bottomMargin:40,
				pageWidth: 8 * 96 + 48,
				pageHeight: 11 * 96,
				orientation:SmoScore.orientations.portrait,
				interGap: 30,
				intraGap:10,
				svgScale: 1.0,
				zoomScale: 2.0,
				zoomMode:SmoScore.zoomModes.fitWidth,
                pages:1
			},
            staffWidth: 1600,
            startIndex: 0,
            renumberingMap: {},
            keySignatureMap: {},
            measureTickmap: [],
            staves: [],
            activeStaff: 0,
			scoreText:[]
        };
    }
	static get pageSizes() {
		return ['letter','tabloid','A4','custom'];
	}
	static get pageDimensions() {
		return {
			'letter':{width:8*96+48,height:11*96},
			'tabloid':{width:1056,height:1632},
			'A4':{width:794,height:1122},
			'custom':{width:1,height:1}
		}
	}

	static get orientationLabels() {
		return ['portrait','landscape'];
	}
	static get orientations() {
		return {'portrait':0,'landscape':1};
	}

    static get defaultAttributes() {
        return ['layout' ,'startIndex',  'renumberingMap', 'renumberIndex'];
    }

    // ### serialize
    // ### Serialize the score.  The resulting JSON string will contain all the staves, measures, etc.
    serialize() {
        var params = {};
        smoSerialize.serializedMerge(SmoScore.defaultAttributes, this, params);
        var obj = {
            score: params,
            staves: [],
			scoreText:[]
        };
        this.staves.forEach((staff) => {
            obj.staves.push(staff.serialize());
        });

		this.scoreText.forEach((tt) => {
			obj.scoreText.push(tt.serialize());
		});
        smoSerialize.jsonTokens(obj);
        obj = smoSerialize.detokenize(obj,smoSerialize.tokenValues);
        obj.dictionary = smoSerialize.tokenMap;
        return obj;
    }
    // ### deserialize
    // ### Restore an earlier JSON string.  Unlike other deserialize methods, this one expects the string.
    static deserialize(jsonString) {
        var jsonObj = JSON.parse(jsonString);
        if (jsonObj.dictionary) {
            jsonObj = smoSerialize.detokenize(jsonObj,jsonObj.dictionary);
        }
        var params = {};
        var staves = [];
        smoSerialize.serializedMerge(
            SmoScore.defaultAttributes,
            jsonObj.score, params);
        jsonObj.staves.forEach((staffObj) => {
            var staff = SmoSystemStaff.deserialize(staffObj);
            staves.push(staff);
        });
		var scoreText=[];
		jsonObj.scoreText.forEach((tt) => {
            var st = SmoScoreText.deserialize(tt);
            st.autoLayout = false; // since this has been layed out, presumably, before save
			scoreText.push(st);
		});
        params.staves = staves;

        let score = new SmoScore(params);
		score.scoreText=scoreText;
		return score;
    }

    // ### getDefaultScore
    // ### Description:
    // Gets a score consisting of a single measure with all the defaults.
    static getDefaultScore(scoreDefaults, measureDefaults) {
        scoreDefaults = (scoreDefaults != null ? scoreDefaults : SmoScore.defaults);
        measureDefaults = (measureDefaults != null ? measureDefaults : SmoMeasure.defaults);
        var score = new SmoScore(scoreDefaults);
        score.addStaff({measureDefaults:measureDefaults});
        var measure = SmoMeasure.getDefaultMeasure(measureDefaults);
        score.addMeasure(0, measure);
        measure.voices.push({
            notes: SmoMeasure.getDefaultNotes(measureDefaults)
        });
        return score;
    }

    // ### getEmptyScore
    // ### Description:
    // Create a score object, but don't populate it with anything.
    static getEmptyScore(scoreDefaults) {
        var score = new SmoScore(scoreDefaults);
        score.addStaff();
        return score;
    }

    // ### _numberStaves
    // recursively renumber staffs and measures.
    _numberStaves() {
        for (var i = 0; i < this.staves.length; ++i) {
            var stave = this.staves[i];
			stave.staffId=i;
            stave.numberMeasures();
        }
    }

    // ### addDefaultMeasureWithNotes
    // ### Description:
    // Add a measure to the score with the supplied parameters at the supplied index.
    // The defaults per staff may be different depending on the clef, key of the staff.
    addDefaultMeasureWithNotes(measureIndex, parameters) {
        this.staves.forEach((staff) => {
            var defaultMeasure =
                SmoMeasure.getDefaultMeasureWithNotes(parameters);
            staff.addMeasure(measureIndex, defaultMeasure);
        });
    }

    // ### deleteMeasure
    // Delete the measure at the supplied index in all the staves.
    deleteMeasure(measureIndex) {
        this.staves.forEach((staff) => {
            staff.deleteMeasure(measureIndex);
        });

    }

    convertToPickupMeasure(measureIndex,duration) {
        for (var i = 0; i < this.staves.length; ++i) {

            var staff = this.staves[i];
            var protomeasure = staff.measures[measureIndex].pickupMeasure(duration);
            staff.measures[measureIndex] = protomeasure;
            smoBeamerFactory.applyBeams(staff.measures[measureIndex]);
        }
        this._numberStaves();
    }

    addPickupMeasure(measureIndex,duration) {
        for (var i = 0; i < this.staves.length; ++i) {

            var staff = this.staves[i];
            var protomeasure = staff.measures[measureIndex].pickupMeasure(duration);
            staff.addMeasure(measureIndex,protomeasure);
        }
        this._numberStaves();
    }

    // ### addMeasure
    // Give a measure prototype, create a new measure and add it to each staff, with the
    // correct settings for current time signature/clef.
    addMeasure(measureIndex, measure) {

        for (var i = 0; i < this.staves.length; ++i) {
            var protomeasure = measure;
            var staff = this.staves[i];
            // Since this staff may already have instrument settings, use the
            // immediately preceeding or post-ceding measure if it exists.
            if (measureIndex < staff.measures.length) {
                protomeasure = staff.measures[measureIndex];
            } else if (staff.measures.length) {
                protomeasure = staff.measures[staff.measures.length - 1];
            }
            var nmeasure = SmoMeasure.getDefaultMeasureWithNotes(protomeasure);
            if (nmeasure.voices.length <= nmeasure.getActiveVoice()) {
                nmeasure.setActiveVoice(0);
            }
            staff.addMeasure(measureIndex, nmeasure);
        }
        this._numberStaves();
    }

    // ### replaceMeasure
    // Replace the measure at the given location.  Probably due to an undo operation or paste.
    replaceMeasure(selector, measure) {
        var staff = this.staves[selector.staff];
        staff.measures[selector.measure] = measure;
    }

    // ### addScoreText
    //

    // ### replace staff
	// Probably due to an undo operation, replace the staff at the given index.
    replaceStaff(index, staff) {
        var staves = [];
        for (var i = 0; i < this.staves.length; ++i) {
            if (i != index) {
                staves.push(this.staves[i]);
            } else {
                staves.push(staff);
            }
        }
        this.staves = staves;
    }
    // ### addKeySignature
    // Add a key signature at the specified index in all staves.
    addKeySignature(measureIndex, key) {
        this.staves.forEach((staff) => {
            staff.addKeySignature(measureIndex, key);
        });
    }

    // ### addInstrument
    // add a new staff (instrument) to the score
    addStaff(parameters) {
        if (this.staves.length == 0) {
            this.staves.push(new SmoSystemStaff(parameters));
            this.activeStaff = 0;
            return;
        }
        if (!parameters) {
            parameters = SmoSystemStaff.defaults;
        }
        var proto = this.staves[0];
        var measures = [];
        for (var i = 0; i < proto.measures.length; ++i) {
            var newParams = {};
            var measure = proto.measures[i];
            smoSerialize.serializedMerge(SmoMeasure.defaultAttributes, measure, newParams);
            newParams.clef = parameters.instrumentInfo.clef;
            newParams.transposeIndex = parameters.instrumentInfo.keyOffset;
            var newMeasure = SmoMeasure.getDefaultMeasureWithNotes(newParams);
            newMeasure.measureNumber = measure.measureNumber;
			newMeasure.modifiers=[];
			measure.modifiers.forEach((modifier) => {
				var ctor = eval(modifier.ctor);
                var nmod = new ctor(modifier);
				newMeasure.modifiers.push(nmod);
			});
            measures.push(newMeasure);
        }
        parameters.measures = measures;
        var staff = new SmoSystemStaff(parameters);
        this.staves.push(staff);
        this.activeStaff = this.staves.length - 1;
		this._numberStaves();
    }

    // ### removeStaff
	// Remove stave at the given index
    removeStaff(index) {
        var staves = [];
        var ix = 0;
        this.staves.forEach((staff) => {
            if (ix != index) {
                staves.push(staff);
            }
            ix += 1;
        });
        this.staves = staves;
        this._numberStaves();
    }

    swapStaves(index1,index2) {
        if (this.staves.length < index1 || this.staves.length < index2) {
            return;
        }
        var tmpStaff = this.staves[index1];
        this.staves[index1] = this.staves[index2];
        this.staves[index2] = tmpStaff;
        this._numberStaves();
    }

	_updateScoreText(textObject,toAdd) {
		var texts=[];
		this.scoreText.forEach((tt) => {
			if (textObject.attrs.id !=  tt.attrs.id) {
				texts.push(tt);
			}
		});
	    if (toAdd) {
			texts.push(textObject);
		}
		this.scoreText = texts;
	}

	addScoreText(textObject) {
		this._updateScoreText(textObject,true);
	}

	getScoreText(id) {
		if (!this.scoreText.length) {
			return null;
		}
		var ar = this.scoreText.filter((tt) => {
			return tt.attrs.id=id;
		});
		if(ar.length) {
			return ar[0];
		}
		return null;
	}

	removeScoreText(textObject) {
		this._updateScoreText(textObject,false);
	}

    get measures() {
        if (this.staves.length === 0)
            return [];
        return this.staves[this.activeStaff].measures;
    }
    incrementActiveStaff(offset) {
        if (offset < 0)
            offset = (-1 * offset) + this.staves.length;
        var nextStaff = (this.activeStaff + offset) % this.staves.length;
        if (nextStaff >= 0 && nextStaff < this.staves.length) {
            this.activeStaff = nextStaff;
        }
        return this.activeStaff;
    }

    setActiveStaff(index) {
        this.activeStaff = index <= this.staves.length ? index : this.activeStaff;
    }

    getRenderedNote(id) {
        for (var i = 0; i < this.staves.length; ++i) {
            var stave = this.staves[i];
            var note = stave.getRenderedNote(id);
            if (note) {
                note.selection.staffIndex = i;
                return note;
            }
        }
        return null;
    }
}
;
// ## StaffModifiers
// ## Description:
// This file contains modifiers that might take up multiple measures, and are thus associated
// with the staff.
// ## Staff Modifier Classes:
// ---
// ## StaffModifierBase
// ## Description:
// Base class that mostly standardizes the interface and deals with serialization.
class StaffModifierBase {
    constructor(ctor) {
        this.ctor = ctor;
    }
    static deserialize(params) {
        var ctor = eval(params.ctor);
        var rv = new ctor(params);
		return rv;
    }
}
// ## SmoStaffHairpin
// ## Descpription:
// crescendo/decrescendo
class SmoStaffHairpin extends StaffModifierBase {
    constructor(params) {
        super('SmoStaffHairpin');
        Vex.Merge(this, SmoStaffHairpin.defaults);
        smoSerialize.filteredMerge(['position', 'xOffset', 'yOffset', 'hairpinType', 'height'], params, this);
        this.startSelector = params.startSelector;
        this.endSelector = params.endSelector;

        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoStaffHairpin'
            };
        } else {
            console.log('inherit attrs');
        }
    }
	static get editableAttributes() {
		return ['xOffsetLeft', 'xOffsetRight', 'yOffset', 'height'];
	}
    static get attributes() {
        return ['position', 'startSelector','endSelector','xOffset', 'yOffset', 'hairpinType', 'height'];
    }
    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoStaffHairpin.defaults,SmoStaffHairpin.attributes,this,params);
        params.ctor = 'SmoStaffHairpin';
        return params;
    }
    get id() {
        return this.attrs.id;
    }
    get type() {
        return this.attrs.type;
    }

    backupOriginal() {
        if (!this['original']) {
            this.original = {};
            smoSerialize.filteredMerge(
                ['xOffsetLeft', 'xOffsetRight', 'yOffset', 'height', 'position', 'hairpinType'],
                this, this.original);
        }
    }
    restoreOriginal() {
        if (this['original']) {
            smoSerialize.filteredMerge(
                ['xOffsetLeft', 'xOffsetRight', 'yOffset', 'height', 'position', 'hairpinType'],
                this.original, this);
            this.original = null;
        }
    }
    static get defaults() {
        return {
            xOffsetLeft: -2,
            xOffsetRight: 0,
            yOffset: -50,
            height: 10,
            position: SmoStaffHairpin.positions.BELOW,
            hairpinType: SmoStaffHairpin.types.CRESCENDO

        };
    }
    static get positions() {
        // matches VF.modifier
        return {
            LEFT: 1,
            RIGHT: 2,
            ABOVE: 3,
            BELOW: 4,
        };
    }
    static get types() {
        return {
            CRESCENDO: 1,
            DECRESCENDO: 2
        };
    }
}

// ## SmoSlur
// ## Description:
// slur staff modifier
// ## SmoSlur Methods:
// ---
class SmoSlur extends StaffModifierBase {
    static get defaults() {
        return {
            spacing: 2,
            thickness: 2,
            xOffset: -5,
            yOffset: 10,
            position: SmoSlur.positions.HEAD,
            position_end: SmoSlur.positions.HEAD,
            invert: false,
            cp1x: 0,
            cp1y: 15,
            cp2x: 0,
            cp2y: 15,
            pitchesStart:[],
            pitchesEnd:[]
        };
    }

    // matches VF curve
    static get positions() {
        return {
            HEAD: 1,
            TOP: 2
        };
    }
    static get parameterArray() {
        return ['startSelector','endSelector','spacing', 'xOffset', 'yOffset', 'position', 'position_end', 'invert',
            'cp1x', 'cp1y', 'cp2x', 'cp2y','thickness','pitchesStart','pitchesEnd'];
    }

    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoSlur.defaults,
            SmoSlur.parameterArray,this,params);

        // smoMusic.filteredMerge(SmoSlur.parameterArray, this, params);
        params.ctor = 'SmoSlur';
        return params;
    }

    backupOriginal() {
        if (!this['original']) {
            this.original = {};
            smoSerialize.filteredMerge(
                SmoSlur.parameterArray,
                this, this.original);
        }
    }
    restoreOriginal() {
        if (this['original']) {
            smoSerialize.filteredMerge(
                SmoSlur.parameterArray,
                this.original, this);
            this.original = null;
        }
    }
    get controlPoints() {
        var ar = [{
                x: this.cp1x,
                y: this.cp1y
            }, {
                x: this.cp2x,
                y: this.cp2y
            }
        ];
        return ar;
    }

    constructor(params) {
        super('SmoSlur');
        smoSerialize.serializedMerge(SmoSlur.parameterArray,SmoSlur.defaults,this);
		// Vex.Merge(this,SmoSlur.defaults);
		// smoMusic.filteredMerge(SmoSlur.parameterArray,params,this);
        smoSerialize.serializedMerge(SmoSlur.parameterArray, params, this);
        this.startSelector = params.startSelector;
        this.endSelector = params.endSelector;

        // TODO: allow user to customize these

        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoSlur'
            };
        }
    }
}
;
class SmoScoreModifierBase {
    constructor(ctor) {
        this.ctor = ctor;
		 if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: ctor
            };
        } else {
            console.log('inherit attrs');
        }
    }
    static deserialize(jsonObj) {
        var ctor = eval(jsonObj.ctor);
        var rv = new ctor(jsonObj);        
        return rv;
    }
}

// ## SmoScoreText
// Identify some text in the score, not associated with any musical element, like page
// decorations, titles etc.
class SmoScoreText extends SmoScoreModifierBase {

    static get paginations() {
		return {every:'every',even:'even',odd:'odd',once:'once'}
	}
	static get positions() {
		return {title:'title',copyright:'copyright',footer:'footer',header:'header',custom:'custom'};
	}
	static get justifications() {
		return {left:'left',right:'right',center:'center'};
	}
    static get fontFamilies() {
        return {serif:'serif',sansSerif:'sans-serif',monospace:'monospace',cursive:'cursive',
           times:'Times New Roman',arial:'Arial',helvitica:'Helvitica'};

    }
	// If box model is 'none', the font and location determine the size.
	// spacing and spacingGlyph fit the box into a container based on the svg policy
	static get boxModels() {
		return {none:'none',spacing:'spacing',spacingAndGlyphs:'spacingAndGlyphs',wrap:'wrap'};
	}
    static get defaults() {
        return {
            x:15,
			y:15,
			width:0,
			height:0,
            text: 'Smoosic',
			fontInfo: {
				size: '1em',
				family:SmoScoreText.fontFamilies.times,
				style:'normal',
				weight:'normal'
			},
			fill:'black',
			rotate:0,
			justification:SmoScoreText.justifications.left,
			classes:'score-text',
			boxModel:'none',
			scaleX:1.0,
			scaleY:1.0,
			translateX:0,
			translateY:0,
			pagination:'every',
			position:'custom',
			autoLayout:false // set to true if one of the pre-canned positions are used.
        };
    }
	static toSvgAttributes(inst) {
		var rv=[];
		var fkeys = Object.keys(inst.fontInfo);
		fkeys.forEach((key) => {
			var n='{"font-'+key+'":"'+inst.fontInfo[key]+'"}';
			rv.push(JSON.parse(n));
		});
		var attrs = SmoScoreText.attributes.filter((x) => {return x != 'fontInfo' && x != 'boxModel'});
		rv.push({fill:inst.fill});
		rv.push({x:inst.x});
		rv.push({y:inst.y});
		if (inst.boxModel != 'none' && inst.width) {
			var len = ''+inst.width+'px';
			rv.push({textLength:len});
			// rv.push({lengthAdjust:inst.boxModel});
		}
		rv.push({transform:'translate ('+inst.translateX+' '+inst.translateY+') scale ('+
		    inst.scaleX+' '+inst.scaleY+')'});
		return rv;
	}

	toSvgAttributes() {
		return SmoScoreText.toSvgAttributes(this);
	}

	// ### backupParams
	// For animation or estimation, create a copy of the attributes that can be modified without affecting settings.
	backupParams() {
		this.backup={};
		smoSerialize.serializedMerge(SmoScoreText.attributes, this, this.backup);
		return this.backup;
	}

    restoreParams() {
        smoSerialize.serializedMerge(SmoScoreText.attributes, this.backup, this);
    }

	serialize() {
		var params = {};
        smoSerialize.serializedMergeNonDefault(SmoScoreText.defaults,SmoScoreText.attributes,this,params);
        params.ctor = 'SmoScoreText';
        return params;
	}
    static get attributes() {
        return ['x','y','text','pagination','position','fontInfo','classes',
		    'boxModel','justification','fill','width','height','scaleX','scaleY','translateX','translateY','autoLayout'];
    }
	// scale the text without moving it.
	scaleInPlace(factor) {
		this.scaleX = this.scaleX*factor;
		this.scaleY = this.scaleY*factor;
		var deltax = this.x - this.x*this.scaleX;
		var deltay = this.y - this.y*this.scaleY;
		this.translateX = deltax;
		this.translateY = deltay;
	}
    scaleXInPlace(factor) {
		this.scaleX = factor;
		var deltax = this.x - this.x*this.scaleX;
		this.translateX = deltax;
    }
    scaleYInPlace(factor) {
		this.scaleY = factor;
		var deltay = this.y - this.y*this.scaleY;
		this.translateY = deltay;
    }
    constructor(parameters) {
        super('SmoScoreText');
        parameters = parameters ? parameters : {};
        this.backup={};
        this.edited = false; // indicate to UI that the actual text has not been edited.

		smoSerialize.serializedMerge(SmoScoreText.attributes, SmoScoreText.defaults, this);
        smoSerialize.serializedMerge(SmoScoreText.attributes, parameters, this);
		if (!this.classes) {
			this.classes='';
		}
        if (this.classes.indexOf(this.attrs.id) < 0) {
            this.classes += ' '+this.attrs.id;
        }
		if (!parameters.pagination) {
			this.pagination = this.position==SmoScoreText.positions.custom || this.position==SmoScoreText.positions.title ?
              SmoScoreText.paginations.every : 	SmoScoreText.paginations.once;
		}
		if (this.boxModel === SmoScoreText.boxModels.wrap) {
			this.width = parameters.width ? this.width : 200;
			this.height = parameters.height ? this.height : 150;
			if (!parameters.justification) {
				this.justification = this.position === SmoScoreText.positions.copyright
						? SmoScoreText.justifications.right : SmoScoreText.justifications.center;

			}
		}
		if (this.position != SmoScoreText.positions.custom && !parameters['autoLayout']) {
			this.autoLayout = true;
			if (this.position == SmoScoreText.positions.title) {
				this.fontInfo.size='1.8em';
			} else {
				this.fontInfo.size='.6em';
			}
		}
    }
}
;
VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

// ## smoTickIterator
// This file implements over the notes in a single measure.
// This is useful when redrawing the notes to transform them into something else.
// E.g. changing the duration of a note in a measure.  It keeps track of accidentals,
// ticks used etc.
// ### Usage:
// ``javascript``
// `var iterator=new smoTickIterator(measure)
// `iterator.iterate (actor)`
// where actor is a function that is called at each tick in the voice.
//
// ### iterator format:
//   iterator: {
//      notes:[note1,note2...],
//      delta: tick value of this note
//      totalDuration: ticks up until this point
//      note: current note,
//      index: running index
//
// ### Tickmap format
// `VX.TICKMAP(measure)`
// Iterate through all notes and creates information about the notes, like
// tuplet ticks, index-to-tick map.  The tickmap is useful for finding things out like how much
// time is left in a measure at a given note index (tickIndex).
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
// ## method documentation follows
// ---
class smoTickIterator {

    constructor(measure, options) {
        this.keySignature = measure.keySignature;

        Vex.Merge(this, options);
        this.voice = typeof(options['voice']) == 'number' ? options.voice : measure.activeVoice;
        this.notes = measure.voices[this.voice].notes;
        this.index = 0;
        this.startIndex = 0;
        this.endIndex = this.notes.length;

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
        this.deltaMap = [];

        this.tupletMap = {};
        this.accidentalMap = [];
        this.durationAccidentalMap={};

        this.hasRun = false;
        this.beattime = 4096;
    }

    // empty function for a default iterator (tickmap)
    static nullActor() {}

    // ### _getAccidentalsForKey
    // Update `map` with the correct accidental based on the key signature.
    static _getAccidentalsForKey(keySignature, map) {
        var music = new VF.Music();
        var keys = music.createScaleMap(keySignature);
        var keyKeys = Object.keys(keys);
        keyKeys.forEach((keyKey) => {
            var vexKey = keys[keyKey];
            if (vexKey.length > 1 && (vexKey[1] === 'b' || vexKey[1] === '#')) {
                var pitch = {
                    letter: vexKey[0],
                    accidental: vexKey[1]
                };
                map[vexKey[0]] = {
                    duration:0,
                    pitch:pitch
                }
            }
        });
    }

	// ### updateAccidentalMap
	// Keep a running tally of the accidentals for this voice
    // based on the key and previous accidentals.
    static updateAccidentalMap(note, iterator, keySignature, accidentalMap) {
        var sigObj = {};
        var newObj = {};
        if (iterator.index === 0) {
            smoTickIterator._getAccidentalsForKey(keySignature, newObj);
            sigObj = newObj;
        } else {
            sigObj = accidentalMap[iterator.index - 1];
        }
        for (var i = 0; i < note.pitches.length; ++i) {
            var pitch = note.pitches[i];
            var letter = pitch.letter.toLowerCase();
            var sigLetter = letter + pitch.accidental;
            var sigKey = smoMusic.getKeySignatureKey(letter, keySignature);

            if (sigObj && sigObj[letter]) {
                var currentVal = sigObj[letter].key + sigObj[letter].accidental;
                if (sigLetter != currentVal) {
                    newObj[letter] = {pitch:pitch,duration:iterator.duration};
                }
            } else {
                if (sigLetter != sigKey) {
                    newObj[letter] = {pitch:pitch,duration:iterator.duration};
                }
            }
        }
        accidentalMap.push(newObj);
        // Mark the accidental with the start of this note.
        iterator.durationAccidentalMap[iterator.durationMap[iterator.index]] = newObj;
    }

	// ### getActiveAccidental
	// return the active accidental for the given note
    getActiveAccidental(pitch, iteratorIndex, keySignature) {
		var defaultAccidental = smoMusic.getKeySignatureKey(pitch.letter, keySignature);
		defaultAccidental = defaultAccidental.length > 1 ? defaultAccidental[1] : 'n';
        if (iteratorIndex === 0)
            return defaultAccidental;
        var accidental = pitch.accidental.length > 0 ? pitch.accidental : 'n';
		var letter = pitch.letter;

        // Back up the accidental map until we have a match, or until we run out
        for (var i = iteratorIndex; i > 0; --i) {
            var map = this.accidentalMap[i - 1];
            var mapKeys = Object.keys(map);
            for (var j = 0; j < mapKeys.length; ++j) {
                var mapKey = mapKeys[j];
                // The letter name + accidental in the map
                var mapLetter = map[mapKey];
                var mapAcc = mapLetter.accidental ? mapLetter.accidental : 'n';

                // if the letters match and the accidental...
                if (mapLetter.pitch.letter.toLowerCase() === letter) {
                    return mapAcc;
                }
            }
        }
        return defaultAccidental;
    }
    getTupletInfo(index) {
        var tuplets = Object.keys(this.tupletMap);
        for (var i = 0; i < tuplets.length; ++i) {
            var tupletInfo = this.tupletMap[tuplets[i]];
            if (tupletInfo.startIndex <= index && tupletInfo.endIndex >= index) {
                return tupletInfo;
            }
        }
        return {};
    }

    // ### _iterate
    // Internal callback for iterator.
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
                if (typeof(this.tupletMap[note.tuplet.attrs.id]) == 'undefined') {
                    this.tupletMap[note.tuplet.attrs.id] = {
                        startIndex: this.index,
                        tupletIndex: 0,
                        startTick: this.totalDuration,
                        smallestDuration: normalizedTicks,
                        num_notes: note.tuplet.num_notes,
                        durations: [this.delta]
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

            smoTickIterator.updateAccidentalMap(note, this, this.keySignature, this.accidentalMap);

            var rv = actor(this, note, this.accidentalMap);
            if (rv === false) {
                break;
            }
        }
        this.state = 'COMPLETE';
    }

    // ### iterate
    // Call `actor` for each iterator tick
    iterate(actor) {
        // todo add promise
        this._iterate(actor);
    }

    // ### getTickIndex
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
    // ### skipNext
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
;
class BeamModifierBase {
    constructor() {}
    beamNote(note, tickmap, accidentalMap) {}
}

class smoBeamerFactory {
    static applyBeams(measure) {
        for (var i = 0;i < measure.voices.length;++i) {
            var beamer = new smoBeamModifier(measure,i);
            var apply = new smoBeamerIterator(measure, beamer,i);
            apply.run();
        }
    }
}

class smoBeamerIterator {
    constructor(measure, actor,voice) {
        this.actor = actor;
        this.measure = measure;
        this.voice = voice;
    }

    //  ### run
    //  ###  Description:  start the iteration on this set of notes
    run() {
        var tickmap = this.measure.tickmapForVoice(this.voice);
        for (var i = 0;i < tickmap.durationMap.length;++i) {
            this.actor.beamNote(tickmap, i,this.measure.voices[this.voice].notes[i]);
        }
    }
}

class smoBeamModifier extends BeamModifierBase {
    constructor(measure,voice) {
        super();
        this.measure = measure;
        this._removeVoiceBeam(measure,voice);
        this.duration = 0;
        this.timeSignature = measure.timeSignature;
        this.meterNumbers = this.timeSignature.split('/').map(number => parseInt(number, 10));

        this.duration = 0;
        // beam on 1/4 notes in most meter, triple time dotted quarter
        this.beamBeats = 2 * 2048;
        if (this.meterNumbers[0] % 3 == 0) {
            this.beamBeats = 3 * 2048;
        }
        this.skipNext = 0;
        this.currentGroup = [];
    }

    get beamGroups() {
        return this.measure.beamGroups;
    }
    _removeVoiceBeam(measure,voice) {
        var beamGroups = [];
        measure.beamGroups.forEach((gr) => {
            if (gr.voice != voice) {
                beamGroups.push(gr);
            }
        });

        measure.beamGroups = beamGroups;
    }

    _completeGroup(voice) {
        // don't beam groups of 1
        if (this.currentGroup.length > 1) {
            this.measure.beamGroups.push(new SmoBeamGroup({
                    notes: this.currentGroup,
                    voice:voice
                }));
        }
    }

    _advanceGroup() {
        this.currentGroup = [];
        this.duration = 0;
    }
    beamNote(tickmap, index, note, accidentalMap) {
        this.beamBeats = note.beamBeats;

        this.duration += tickmap.deltaMap[index];

        // beam tuplets
        if (note.isTuplet) {
            var tuplet = this.measure.getTupletForNote(note);
            var ult = tuplet.notes[tuplet.notes.length - 1];
            var first = tuplet.notes[0];

            if (first.endBeam) {
                this._advanceGroup();
                return note;
            }

            // is this beamable length-wise
            var vexDuration = smoMusic.closestVexDuration(note.tickCount);
            var stemTicks = VF.durationToTicks.durations[vexDuration];
            if (stemTicks < 4096) {
                this.currentGroup.push(note);
            }
            // Ultimate note in tuplet
            if (ult.attrs.id === note.attrs.id) {
                this._completeGroup(tickmap.voice);
                this._advanceGroup();
            }
            return note;
        }

        // don't beam > 1/4 note in 4/4 time
        if (tickmap.deltaMap[index] >= 4096) {
			this._completeGroup(tickmap.voice);
            this._advanceGroup();
            return note;
        }

        this.currentGroup.push(note);
        if (note.endBeam) {
            this._completeGroup(tickmap.voice);
            this._advanceGroup();
        }

        if (this.duration == this.beamBeats) {
            this._completeGroup(tickmap.voice);
            this._advanceGroup();
            return note;
        }

        // If this does not align on a beat, don't beam it
        if (this.duration > this.beamBeats) {
            this._advanceGroup()
            return note;
        }
    }
}
;VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;


class SmoDuration {
    static doubleDurationNonTuplet(selection) {
        var note = selection.note;
		var measure = selection.measure;
        var selector = selection.selector;
        var notes = measure.voices[selector.voice].notes;
		var tuplet = measure.getTupletForNote(note);
        var i;
        var nticks = note.tickCount * 2;
        var replNote = SmoNote.cloneWithDuration(note,nticks);
        var ticksUsed = note.tickCount;
        var newNotes = [];
        for (i = 0;i < selector.tick;++i) {
            newNotes.push(notes[i]);
        }
        for (i = selector.tick + 1;i < notes.length;++i) {
            var nnote = notes[i];
            ticksUsed += nnote.tickCount;
            if (ticksUsed >= nticks) {
                break;
            }
        }
        var remainder = ticksUsed - nticks;
        if (remainder < 0) {
            return;
        }
        newNotes.push(replNote);
        if (remainder > 0) {
            var lmap = smoMusic.gcdMap(remainder);
            lmap.forEach((duration) => {
                newNotes.push(SmoNote.cloneWithDuration(note,duration));
            });
        }

        for (i = i + 1;i<notes.length;++i) {
            newNotes.push(notes[i]);
        }
        measure.voices[selector.voice].notes = newNotes;
    }

    static doubleDurationTuplet(selection) {
        var notes = selection.measure.voices[selection.selector.voice].notes;
        var tuplet = selection.measure.getTupletForNote(selection.note);
        var measure = selection.measure
        var startIndex = selection.selector.tick - tuplet.startIndex;
        var tupletIndex = measure.tupletIndex(tuplet);

        var startLength = tuplet.notes.length;
        tuplet.combine(startIndex,startIndex + 1);
        if (tuplet.notes.length >= startLength) {
            return;
        }
        var newNotes = [];
        var i;

        for (i = 0;i < tuplet.startIndex;++i) {
            newNotes.push(notes[i]);
        }
        tuplet.notes.forEach((note) => {
            newNotes.push(note);
        });
        for (i = i+tuplet.notes.length+1;i<notes.length;++i) {
            newNotes.push(notes[i]);
        }
        measure.voices[selection.selector.voice].notes=newNotes;
    }
}
// this file contains utilities that change the duration of notes in a measure.

// ## SmoTickTransformer
//  Base class for duration transformations.  I call them transformations because this can
//  create and delete notes, as opposed to modifiers which act on existing notes.
class SmoTickTransformer {
    constructor(measure, actors, voiceIndex) {
        this.notes = measure.voices[voiceIndex].notes;
        this.measure = measure;
        this.voice = typeof(voiceIndex) === 'number' ?  voiceIndex : 0;
        this.vxNotes = [];
        this.actors = actors ? actors : [];
        this.keySignature = 'C';
        this.accidentalMap = [];
    }
    static nullActor(note) {
        return note;
    }
	// ## applyTransform
	// create a transform with the given actors and run it against the supplied measure
	static applyTransform(measure,actors,voiceIndex) {
		var actAr = (Array.isArray(actors)) ? actors : [actors];
		measure.clearBeamGroups();
        var transformer = new SmoTickTransformer(measure, actAr,voiceIndex);
        transformer.run();
        var vix = measure.getActiveVoice();
        measure.voices[vix].notes = transformer.notes;
	}
    // ## transformNote
    // call the actors for each note, and put the result in the note array.
    // The note from the original array is copied and sent to each actor.
    //
    // Because the resulting array can have a different number of notes than the existing
    // array, the actors communicate with the transformer in the following, jquery-ish
    // but somewhat unintuitive way:
    //
    // 1. if the actor returns null, the next actor is called and the results of that actor are used
    // 2. if all the actors return null, the copy is used.
    // 3. if a note object is returned, that is used for the current tick and no more actors are called.
    // 4. if an array of notes is returned, it is concatenated to the existing note array and no more actors are called.
    //     Note that *return note;* and *return [note];* produce the same result.
    // 5. if an empty array [] is returned, that copy is not added to the result.  The note is effectively deleted.
    transformTick(tickmap, index,note) {
        var self = this;

        for (var i = 0; i < this.actors.length; ++i) {
			var actor=this.actors[i];
            var newNote = actor.transformTick(note, tickmap, index);
            if (newNote == null) {
				this.vxNotes.push(note); // no change
                continue;
            }
            if (Array.isArray(newNote)) {
                if (newNote.length === 0) {
                    return;
                }
                this.vxNotes = this.vxNotes.concat(newNote);
                return;
            }
            this.vxNotes.push(newNote);
            return;
        }
    }

    run() {
        var self = this;
        var tickmap = this.measure.tickmapForVoice(this.voice);
        for (var i = 0;i < tickmap.durationMap.length;++i) {
            this.transformTick(tickmap,i,this.measure.voices[this.voice].notes[i]);
        }
        this.notes = this.vxNotes;
        return this.vxNotes;
    }
}

// ## A note transformer is just a function that modifies a note in some way.
// Any number of transformers can be applied to a note.
class TickTransformBase {
    constructor() {}
    transformTick(note, tickmap, index) {
        return note;
    }
}
// ## VxContractActor
// Contract the duration of a note, filling in the space with another note
// or rest.
//
class SmoContractNoteActor extends TickTransformBase {
    constructor(params) {
        super();
        Vex.Merge(this, params);
    }
    transformTick(note, tickmap, index) {
        if (index == this.startIndex) {
            var notes = [];
            var noteCount = Math.floor(note.ticks.numerator / this.newTicks);
            var notes = [];
			var remainder = note.ticks.numerator;
            /**
             *  Replace 1 note with noteCOunt notes of newTIcks duration
             *      old map:
             *     d  .  d  .  .
             *     new map:
             *     d  d  d  .  .
             */
            for (var i = 0; i < noteCount; ++i) {
                notes.push(new SmoNote({
                        clef: note.clef,
                        pitches: JSON.parse(JSON.stringify(note.pitches)),
                        ticks: {numerator:this.newTicks,denominator:1,remainder:0},
                        beamBeats:note.beamBeats
                    }));
				remainder = remainder - this.newTicks;
            }

            // make sure remnainder is not too short
			if (remainder > 0) {
                if (remainder < 128) {
                    return null;
                }
				notes.push(new SmoNote({
                        clef: note.clef,
                        pitches: JSON.parse(JSON.stringify(note.pitches)),
                        ticks: {numerator:remainder,denominator:1,remainder:0},
                        beamBeats:note.beamBeats
                    }));
			}
            return notes;
        }

        return null;
    }
}

// ## VxStretchTupletActor
// Stretch a note in a tuplet, removing or shortening other notes in the tuplet
// ## Parameters:
//   {changeIndex:changeIndex, multiplier:multiplier,measure:measure}
//
class SmoStretchTupletActor extends TickTransformBase {
    constructor(params) {
        super();
        Vex.Merge(this, params);
        this.tuplet = this.measure.getTupletForNote(this.measure.notes[this.changeIndex]);
        this.oldLength = this.tuplet.notes.length;
        this.tupletIndex = this.measure.tupletIndex(this.tuplet);

        this.tuplet.combine(this.startIndex, this.endIndex);
        this.durationMap = this.tuplet.durationMap;
    }
    transformTick(note, tickmap,index) {

        /*
        ## Strategy:
        Before A, after C, leave alone
        At A, send all notes of the tuplet
        Between A+1 and C, return empty array for removed note

        5
        ---------
        | | | | |
        n n n n n
        A | B | C
         */

        if (index < this.tupletIndex)
            return note;
        if (index >= this.tupletIndex + this.oldLength)
            return note;
        if (index === this.tupletIndex) {
            return this.tuplet.notes;
        }
        return [];

    }

}

// ## VxContractActor
// Contract the duration of a note in a tuplet by duplicate
// notes of fractional length
//
class SmoContractTupletActor extends TickTransformBase {
    constructor(params) {
        super();
        Vex.Merge(this, params);
        this.tuplet = this.measure.getTupletForNote(this.measure.voices[this.voice].notes[this.changeIndex]);
        this.oldLength = this.tuplet.notes.length;
        this.tupletIndex = this.measure.tupletIndex(this.tuplet);
        this.splitIndex = this.changeIndex - this.tupletIndex;
        this.tuplet.split(this.splitIndex);
    }
    transformTick(note, tickmap, index, accidentalMap) {
        if (index < this.tupletIndex)
            return note;
        if (index >= this.tupletIndex + this.oldLength)
            return note;
        if (index == this.changeIndex) {
            return this.tuplet.notes;
        }
        return [];
    }
}

// ## VxUnmakeTupletActor
// Turn a tuplet into a non-tuplet of the same length
// ## Parameters:
// startIndex: start index of tuplet
// endIndex: end index of tuplet
// measure: Smo measure that the tuplet is contained in.
class SmoUnmakeTupletActor extends TickTransformBase {
    constructor(parameters) {
        super();
        Vex.Merge(this, parameters);
    }
    transformTick(note, tickmap, index, accidentalMap) {
        if (index < this.startIndex || index > this.endIndex) {
            return null;
        }
        if (index == this.startIndex) {
            var tuplet = this.measure.getTupletForNote(note);
            var ticks = tuplet.totalTicks;
            var nn = SmoNote.cloneWithDuration(note, {numerator:ticks,denominator:1,remainder:0});
            nn.tuplet = {};
            this.measure.removeTupletForNote(note);
            return [nn];
        }
        return [];
    }
}

// ## VxUnmakeTupletActor
// Turn a tuplet into a non-tuplet of the same length
// parameters:
//  {tickmap:tickmap,ticks:ticks,
class SmoMakeTupletActor extends TickTransformBase {
    constructor(params) {
        super();
        Vex.Merge(this, params);
        this.measure = this.selection.measure;
        this.durationMap = [];
        var sum = 0.0; // 819.2
        for (var i = 0; i < this.numNotes; ++i) {
            this.durationMap.push(1.0);
            sum += 1.0;
        }
		/*
		var stemValue = this.totalTicks / this.numNotes;
        var stemTicks = 8192;

        // The stem value is the type on the non-tuplet note, e.g. 1/8 note
        // for a triplet.
        while (stemValue < stemTicks) {
            stemTicks = stemTicks / 2;
        }

        this.stemTicks = stemTicks * 2;
		*/
        this.stemTicks = SmoTuplet.calculateStemTicks(this.totalTicks ,this.numNotes);

        this.rangeToSkip = this._rangeToSkip();

        // special case - is this right?  this is needed for tuplets in 6/8
        /* if (this.rangeToSkip[1] > this.rangeToSkip[0]) {
            this.stemTicks = stemTicks;
        } else {
            this.stemTicks = stemTicks * 2;
        }  */

        this.vexDuration = smoMusic.ticksToDuration[this.stemTicks];
        this.tuplet = [];
        // skip notes in the original array if we are taking up
        // multiple notes

    }
    _rangeToSkip() {
        var ticks = this.selection.measure.tickmapForVoice(this.selection.selector.voice);
        var accum = 0;
        var rv = [];
        rv.push(this.index);
        for (var i = 0; i < ticks.deltaMap.length; ++i) {
            if (i >= this.index) {
                accum += ticks.deltaMap[i];
            }
            if (accum >= this.totalTicks) {
                rv.push(i);
                break;
            }
        }
        return rv;
    }
    transformTick(note, tickmap, index) {
        // if our tuplet replaces this note, make sure we make it go away.
        if (index > this.index && index <= this.rangeToSkip[1]) {
            return [];
        }
        if (index != this.index) {
            return null;
        }
        for (var i = 0; i < this.numNotes; ++i) {
            note = SmoNote.cloneWithDuration(note, {numerator:this.stemTicks,denominator:1,remainder:0});

			// Don't clone modifiers, except for first one.
			note.textModifiers = i===0 ? note.textModifiers : [];

            this.tuplet.push(note);
        }
        var tuplet = new SmoTuplet({
                notes: this.tuplet,
                stemTicks: this.stemTicks,
                totalTicks: this.totalTicks,
                ratioed: false,
                bracketed: true,
                startIndex: index,
                durationMap: this.durationMap,
                location: 1,
                voice:tickmap.voice
            });
        this.measure.tuplets.push(tuplet);
        return this.tuplet;
    }
}

class SmoStretchNoteActor extends TickTransformBase {
    constructor(parameters) {
        super();
        Vex.Merge(this, parameters);
        this.startTick = this.tickmap.durationMap[this.startIndex];
		var currentTicks = this.tickmap.deltaMap[this.startIndex];

        var endTick = this.tickmap.durationMap[this.startIndex] + this.newTicks;
        this.divisor = -1;
        this.durationMap = [];
        this.skipFromStart = this.startIndex + 1;
        this.skipFromEnd = this.startIndex + 1;
        this.durationMap.push(this.newTicks);

        var mapIx = this.tickmap.durationMap.indexOf(endTick);

        var remaining = this.tickmap.deltaMap.slice(this.startIndex, this.tickmap.durationMap.length).reduce((accum, x) => x + accum);
        if (remaining === this.newTicks) {
            mapIx = this.tickmap.deltaMap.length;
        }

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
            var npos = this.tickmap.durationMap[this.startIndex + 1];
            var ndelta = this.tickmap.deltaMap[this.startIndex + 1];
			var needed = this.newTicks - currentTicks;
			var exp = ndelta/needed;

			// Next tick does not divide evenly into this, or next tick is shorter than this
			if (Math.round(ndelta/exp)-ndelta/exp != 0 || currentTicks>ndelta) {
				this.durationMap = [];
			}
            else if (ndelta / exp + this.startTick + this.newTicks <= this.tickmap.totalDuration) {
                this.durationMap.push(ndelta - (ndelta / exp));
            } else {
                // there is no way to do this...
				this.durationMap = [];
            }
        } else {
            // If this note now takes up the space of other notes, remove those notes
            for (var i = this.startIndex + 1; i < mapIx; ++i) {
                this.durationMap.push(0);
            }
        }
    }
    transformTick(note, tickmap, index) {
        if (this.durationMap.length == 0) {
            return null;
        }
        if (index >= this.startIndex && index < this.startIndex + this.durationMap.length) {
            var mapIndex = index - this.startIndex;
            var ticks = this.durationMap[mapIndex];
            if (ticks == 0) {
                return [];
            }
            var vexDuration = smoMusic.ticksToDuration[ticks];
            var note = SmoNote.cloneWithDuration(note, {numerator:ticks,denominator:1,remainder:0});
            return [note];
        }
        return null;
    }
}
;/////////////////
// # selections.js
// Editing operations are performed on selections.  A selection can be different things, from a single pitch
// to many notes.  These classes standardize some standard selection operations.
//
//
// ## SmoSelector
// ## Description:
// There are 2 parts to a selection: the actual musical bits that are selected, and the
// indices that define what was selected.  This is the latter.  The actual object does not
// have any methods so there is no constructor.
class SmoSelector {
	// TODO:  tick in selector s/b tickIndex
	static sameNote(sel1, sel2) {
		return (sel1.staff == sel2.staff && sel1.measure == sel2.measure && sel1.voice == sel2.voice
			 && sel1.tick == sel2.tick);
	}
	static sameMeasure(sel1, sel2) {
		return (sel1.staff == sel2.staff && sel1.measure == sel2.measure);
	}

	static sameStaff(sel1, sel2) {
		return sel1.staff === sel2.staff;
	}

	// ## return true if sel1 > sel2.
	static gt(sel1, sel2) {
		// Note: voice is not considered b/c it's more of a vertical component
		return sel1.staff > sel2.staff ||
		(sel1.staff == sel2.staff && sel1.measure > sel2.measure) ||
		(sel1.staff == sel2.staff && sel1.measure == sel2.measure && sel1.tick > sel2.tick);
	}

	static eq(sel1, sel2) {
		return (sel1.staff == sel2.staff && sel1.measure == sel2.measure && sel1.tick == sel2.tick);
	}
	static neq(sel1,sel2) {
		return !(SmoSelector.eq(sel1,sel2));
	}

	static lt(sel1, sel2) {
		return SmoSelector.gt(sel2, sel1);
	}

	static gteq(sel1, sel2) {
		return SmoSelector.gt(sel1, sel2) || SmoSelector.eq(sel1, sel2);
	}
	static lteq(sel1, sel2) {
		return SmoSelector.lt(sel1, sel2) || SmoSelector.eq(sel1, sel2);
	}

    // ### getNoteKey
    // Get a key useful for a hash map of notes.
    static getNoteKey(selector) {
        return ''+selector.staff + '-' +selector.measure  + '-' + selector.voice + '-' + selector.tick;
    }

    static getMeasureKey(selector) {
        return ''+selector.staff + '-' +selector.measure;
    }

	// ## applyOffset
	// ### Description:
	// offset 'selector' the difference between src and target, return the result
	static applyOffset(src, target, selector) {
		var rv = JSON.parse(JSON.stringify(selector));
		rv.staff += target.staff - src.staff;
		rv.measure += target.measure - src.measure;
		rv.voice += target.voice - src.voice;
		rv.note += target.staff - src.staff;
		return rv;
	}

	// return true if testSel is contained in the selStart to selEnd range.
	static contains(testSel, selStart, selEnd) {
		var geStart =
			selStart.measure < testSel.measure ||
			(selStart.measure === testSel.measure && selStart.tick <= testSel.tick);
		var leEnd =
			selEnd.measure > testSel.measure ||
			(selEnd.measure === testSel.measure && testSel.tick <= selEnd.tick);

		return geStart && leEnd;
	}

	// create a hashmap key for a single note, used to organize modifiers
	static selectorNoteKey(selector) {
		return 'staff-' + selector.staff + '-measure-' + selector.measure + '-voice-' + selector.voice + '-tick-' + selector.tick;
	}
}

// ## SmoSelection
// ## Description:
// A selection is a selector and a set of references to musical elements, like measure etc.
// The staff and measure are always a part of the selection, and possible a voice and note,
// and one or more pitches.  Selections can also be made from the UI by clicking on an element
// or navigating to an element with the keyboard.
class SmoSelection {

	// ### measureSelection
	// A selection that does not contain a specific note
	static measureSelection(score, staffIndex, measureIndex) {
		staffIndex = staffIndex != null ? staffIndex : score.activeStaff;
		var selector = {
			staff: staffIndex,
			measure: measureIndex
		};
		if (score.staves.length <= staffIndex) {
			return null;
		}
		var staff = score.staves[staffIndex];
		if (staff.measures.length <= measureIndex) {
			return null;
		}
		var measure = staff.measures[measureIndex];

		return new SmoSelection
		({
			selector: selector,
			_staff: staff,
			_measure: measure,
			type: 'measure'
		});
	}

    static measuresInColumn(score,staffIndex) {
        var rv = [];
        for (var i = 0;i<score.staves.length;++i) {
            rv.push(SmoSelection.measureSelection(score,i,staffIndex));
        }
        return rv;
    }

	static noteFromSelection(score, selection) {
		return SmoSelection(score, selection.staffIndex, selection.measureIndex, selection.voiceIndex, selection.tickIndex);
	}

	// ### noteSelection
	// a selection that specifies a note in the score
	static noteSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex) {
		staffIndex = staffIndex != null ? staffIndex : score.activeStaff;
		measureIndex = measureIndex ? measureIndex : 0;
		voiceIndex = voiceIndex ? voiceIndex : 0;
		var staff = score.staves[staffIndex];
        if (!staff) {
            return null;
        }
		var measure = staff.measures[measureIndex];
        if (!measure) {
            return null;
        }
        if (measure.voices.length <= voiceIndex) {
            return null;
        }
        if (measure.voices[voiceIndex].notes.length <= tickIndex) {
            return null;
        }
		var note = measure.voices[voiceIndex].notes[tickIndex];
		var selector = {
			staff: staffIndex,
			measure: measureIndex,
			voice: voiceIndex,
			tick: tickIndex
		};
		return new SmoSelection({
			selector: selector,
			_staff: staff,
			_measure: measure,
			_note: note,
			_pitches: [],
			type: 'note'
		});
	}

	// ### renderedNoteSelection
	// this is a special selection that we associated with all he rendered notes, so that we
	// can map from a place in the display to a place in the score.
	static renderedNoteSelection(score, nel, box) {
		var elementId = nel.getAttribute('id');
		for (var i = 0; i < score.staves.length; ++i) {
			var staff = score.staves[i];
			for (var j = 0; j < staff.measures.length; ++j) {
				var measure = staff.measures[j];
				for (var k = 0; k < measure.voices.length; ++k) {
					var voice = measure.voices[k];
					for (var m = 0; m < voice.notes.length; ++m) {
						var note = voice.notes[m];
						if (note.renderId === elementId) {
							var selector = {
								staff: i,
								measure: j,
								voice: k,
								tick: m,
								pitches: []
							};
							// var box = document.getElementById(nel.id).getBBox();
							var rv = new SmoSelection({
									selector: selector,
									_staff: staff,
									_measure: measure,
									_note: note,
									_pitches: [],
									box: box,
									type: 'rendered'
								});

							return rv;
						}
					}
				}
			}
		}
		return null;
	}

	static pitchSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex, pitches) {
		staffIndex = staffIndex != null ? staffIndex : score.activeStaff;
		measureIndex = measureIndex ? measureIndex : 0;
		voiceIndex = voiceIndex ? voiceIndex : 0;
		var staff = score.staves[staffIndex];
		var measure = staff.measures[measureIndex];
		var note = measure.voices[voiceIndex].notes[tickIndex];
		pitches = pitches ? pitches : [];
		var pa = [];
		pitches.forEach((ix) => {
			pa.push(JSON.parse(JSON.stringify(note.pitches[ix])));
		});
		var selector = {
			staff: staffIndex,
			measure: measureIndex,
			voice: voiceIndex,
			tick: tickIndex,
			pitches: pitches
		};
		return new SmoSelection({
			selector: selector,
			_staff: staff,
			_measure: measure,
			_note: note,
			_pitches: pa,
			type: 'pitches'
		});
	}

	// ## nextNoteSelection
	// ## Description:
	// Return the next note in this measure, or the first note of the next measure, if it exists.
	static nextNoteSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex) {
		var nextTick = tickIndex + 1;
		var nextMeasure = measureIndex + 1;
		var staff = score.staves[staffIndex];
		var measure = staff.measures[measureIndex];
		if (measure.voices[voiceIndex].notes.length > nextTick) {
			return SmoSelection.noteSelection(score, staffIndex, measureIndex, voiceIndex, nextTick);
		}
		if (staff.measures.length > nextMeasure) {
			return SmoSelection.noteSelection(score, staffIndex, nextMeasure, voiceIndex, 0);
		}
		return null;
	}

	// ### getMeasureList
	// Gets the list of measures in an array from the selections
	static getMeasureList(selections) {
		var rv = [];
		if (!selections.length) {
			return rv;
		}
        var cur = selections[0].selector.measure;
		for (var i=0;i<selections.length;++i) {
			var sel = selections[i];
			if (i == 0 ||
                 (sel.selector.measure != cur)) {
				rv.push({
                    selector:{
                        staff:sel.selector.staff,
                        measure:sel.selector.measure
                    },
                    staff:sel.staff,
                    measure:sel.measure
                    });
			}
            cur = sel.selector.measure;
		}
		return rv;
	}

	static lastNoteSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex) {
		var lastTick = tickIndex - 1;
		var lastMeasure = measureIndex - 1;
		var staff = score.staves[staffIndex];
		var measure = staff.measures[measureIndex];
		if (tickIndex > 0) {
			return SmoSelection.noteSelection(score, staffIndex, measureIndex, voiceIndex, lastTick);
		}
		if (lastMeasure >= 0) {
			measure = staff.measures[lastMeasure];
            if (voiceIndex >= measure.voices.length) {
                return null;
            }
			var noteIndex = measure.voices[voiceIndex].notes.length - 1;
			return SmoSelection.noteSelection(score, staffIndex, lastMeasure, voiceIndex, noteIndex);
		}
		return SmoSelection.noteSelection(score, staffIndex, 0, 0,0);
	}

	// ### selectionsSameMeasure
	// Return true if the selections are all in the same measure.  Used to determine what
	// type of undo we need.
	static selectionsSameMeasure(selections) {
		if (selections.length < 2) {
			return true;
		}
		var sel1 = selections[0].selector;
		for (var i = 1; i < selections.length; ++i) {
			if (!SmoSelector.sameMeasure(sel1, selections[i].selector)) {
				return false;
			}
		}
		return true;
	}

	static selectionsSameStaff(selections) {
		if (selections.length < 2) {
			return true;
		}
		var sel1 = selections[0].selector;
		for (var i = 1; i < selections.length; ++i) {
			if (!SmoSelector.sameStaff(sel1, selections[i].selector)) {
				return false;
			}
		}
		return true;
	}

	constructor(params) {
		this.selector = {
			staff: 0,
			measure: 0,
			voice: 0,
			note: 0,
			pitches: []
		}
		this._staff = null;
		this._measure = null;
		this._note = null;
		this._pitches = [];
		this._box = svgHelpers.pointBox(0, 0);

		this.selectionGroup = {
			id: VF.Element.newID(),
			type: 'SmoSelection'
		};
		Vex.Merge(this, params);
	}

	get staff() {
		return this._staff;
	}
	get measure() {
		return this._measure;
	}

	get note() {
		return this._note;
	}
	get pitches() {
		if (this._pitches.length) {
			return this._pitches;
		} else if (this._note) {
			this._pitches = JSON.parse(JSON.stringify(this.note.pitches));
			return this._pitches;
		}
		return [];
	}
}
;
// An operation works on a selection or set of selections to edit the music
class SmoOperation {

   static setForcePageBreak(score,selection,value) {
       score.staves.forEach((staff) => {
          staff.measures[selection.selector.measure].setForcePageBreak(value);
       });
   }
   static setForceSystemBreak(score,selection,value) {
       score.staves.forEach((staff) => {
          staff.measures[selection.selector.measure].setForceSystemBreak(value);
       });
   }

	static addKeySignature(score, selection, keySignature) {
		score.addKeySignature(selection.selector.measure, keySignature);
	}

	static deleteMeasure(score, selection) {
		var measureIndex = selection.selector.measure;

		score.deleteMeasure(measureIndex);
	}

    static addPickupMeasure(score,duration) {
        score.addPickupMeasure(0,duration);
    }

    static convertToPickupMeasure(score,duration) {
        score.convertToPickupMeasure(0,duration);
    }
	static toggleBeamGroup(noteSelection) {
		noteSelection.measure.setChanged();
		noteSelection.note.endBeam = !(noteSelection.note.endBeam);
	}

    static padMeasureLeft(selection,padding) {
        selection.measure.padLeft = padding;
        selection.measure.setChanged();
    }

    static setActiveVoice(score,voiceIx) {
        score.staves.forEach((staff) => {
            staff.measures.forEach((measure) => {
                measure.setActiveVoice(voiceIx);
            });
        });
    }

    static addRemoveMicrotone(ignore,selections,tone) {
        selections.forEach((sel) => {
            if (sel.note.tones.findIndex((tt) => tt.tone==tone.tone
              && tt.pitch==tone.pitch) >= 0) {
                  sel.note.removeMicrotone(tone);
              } else {
                  sel.note.addMicrotone(tone);
              }
              sel.measure.setChanged();
        });
    }

    static moveStaffUpDown(score,selection,index) {
        var index1 = selection.selector.staff;
        var index2 = selection.selector.staff + index;
        if (index2 < score.staves.length && index2 >= 0) {
            score.swapStaves(index1,index2);
        }
    }

    static depopulateVoice(selection,voiceIx) {
        var ix = 0;
        var voices = [];
        var measure = selection.measure;
        measure.voices.forEach((voice) => {
            if (measure.voices.length <2 || ix != voiceIx)  {
                voices.push(voice);
            }
            ix += 1;
        });
        measure.voices = voices;
        smoBeamerFactory.applyBeams(measure);

        if (measure.getActiveVoice() >= measure.voices.length) {
            measure.setActiveVoice(0);
        }
    }

    static populateVoice(selection,voiceIx) {
        selection.measure.populateVoice(voiceIx);
        selection.measure.setChanged();
    }

    static setTimeSignature(score,selections,timeSignature) {
        var selectors = [];
        selections.forEach((selection) => {
            for (var i=0;i<score.staves.length;++i) {
                var measureSel = {
                    staff: i,
                    measure: selection.selector.measure
                };
                selectors.push(measureSel);
            }
        });
        var tsTicks = smoMusic.timeSignatureToTicks(timeSignature);

        selectors.forEach((selector) => {
            var params={};
            var attrs = SmoMeasure.defaultAttributes.filter((aa) => aa != 'timeSignature');
            var psel =  SmoSelection.measureSelection(score,selector.staff,selector.measure);
            if (!psel['measure']) {
                console.log('Error: score has changed in time signature change');
            } else {
                var proto = SmoSelection.measureSelection(score,selector.staff,selector.measure).measure;
                smoSerialize.serializedMerge(attrs,proto,params);
                params.timeSignature = timeSignature;
                var nm = SmoMeasure.getDefaultMeasure(params);
                var spareNotes = SmoMeasure.getDefaultNotes(params);
                var ticks = 0;
                var voices = [];
                proto.voices.forEach((voice) => {
                    var nvoice=[];
                    for (var i=0;i<voice.notes.length;++i) {
                        var pnote = voice.notes[i];
                        var nnote = SmoNote.deserialize(pnote.serialize());
                        if (ticks + pnote.tickCount <= tsTicks) {
                            nnote.ticks = JSON.parse(JSON.stringify(pnote.ticks))
                            nvoice.push(nnote);
                            ticks += nnote.tickCount;
                        } else {
                            var remain = (ticks + pnote.tickCount)-tsTicks;
                            nnote.ticks = {numerator:remain,denominator:1,remainder:0};
                            nvoice.push(nnote);
                            ticks += nnote.tickCount;
                        }
                        if (ticks >= tsTicks) {
                            break;
                        }
                    }
                    if (ticks < tsTicks) {
                        var adjNote = SmoNote.cloneWithDuration(nvoice[nvoice.length - 1],{numerator:tsTicks - ticks,denominator:1,remainder:0});
                        nvoice.push(adjNote);
                    }
                    voices.push({notes:nvoice});

                });
            }
            nm.voices=voices;
            score.replaceMeasure(selector,nm);
        });
    }

	static batchSelectionOperation(score, selections, operation) {
		var measureTicks = [];
		selections.forEach((selection) => {
			var measureSel = {
				staff: selection.selector.staff,
				measure: selection.selector.measure,
				voice: selection.selector.voice
			};
			selection.measure.setChanged();
			if (!measureTicks[measureSel]) {
				var tm = selection.measure.tickmapForVoice(selection.selector.voice);
				var tickOffset = tm.durationMap[selection.selector.tick];
				var selector = JSON.parse(JSON.stringify(selection.selector));
				measureTicks.push({
					selector: selector,
					tickOffset: tickOffset
				});
			}
		});
		measureTicks.forEach((measureTick) => {
			var selection = SmoSelection.measureSelection(score, measureTick.selector.staff, measureTick.selector.measure);
			var tickmap = selection.measure.tickmapForVoice(measureTick.selector.voice);
			var ix = tickmap.durationMap.indexOf(measureTick.tickOffset);
			if (ix >= 0) {
				var nsel = SmoSelection.noteSelection(score, measureTick.selector.staff, measureTick.selector.measure,
						measureTick.selector.voice, ix);
				SmoOperation[operation](nsel);
			}
		});
	}
	// ## doubleDuration
	// ## Description
	// double the duration of a note in a measure, at the expense of the following
	// note, if possible.  Works on tuplets also.
	static doubleDuration(selection) {
		var note = selection.note;
		var measure = selection.measure;
        var selector = selection.selector;
        var notes = measure.voices[selector.voice].notes;
		var tuplet = measure.getTupletForNote(note);
		if (!tuplet) {
            SmoDuration.doubleDurationNonTuplet(selection);

		} else {
            SmoDuration.doubleDurationTuplet(selection);
		}
		selection.measure.setChanged();
		return true;
	}

	// ## halveDuration
	// ## Description
	// Replace the note with 2 notes of 1/2 duration, if possible
	// Works on tuplets also.
	static halveDuration(selection) {
		var note = selection.note;
		var measure = selection.measure;
		var tuplet = measure.getTupletForNote(note);
		var divisor = 2;
		if (measure.numBeats % 3 === 0 && selection.note.tickCount === 6144) {
			// special behavior, if this is dotted 1/4 in 6/8, split to 3
			divisor = 3;
		}
		if (!tuplet) {
			var nticks = note.tickCount / divisor;
			if (!smoMusic.ticksToDuration[nticks]) {
				return;
			}
			var actor = new SmoContractNoteActor({
					startIndex: selection.selector.tick,
					tickmap: measure.tickmapForVoice(selection.selector.voice),
					newTicks: nticks
				});
			SmoTickTransformer.applyTransform(measure, actor,selection.selector.voice);
            smoBeamerFactory.applyBeams(measure);

		} else {
			var startIndex = measure.tupletIndex(tuplet) + tuplet.getIndexOfNote(note);
			var actor = new SmoContractTupletActor({
					changeIndex: startIndex,
					measure: measure,
                    voice:selection.selector.voice
				});
			SmoTickTransformer.applyTransform(measure, actor,selection.selector.voice);
		}
		selection.measure.setChanged();
	}

	// ## makeTuplet
	// ## Description
	// Makes a non-tuplet into a tuplet of equal value.
	static makeTuplet(selection, numNotes) {
		var note = selection.note;
		var measure = selection.measure;

		if (measure.getTupletForNote(note))
			return;
		var nticks = note.tickCount;

		var actor = new SmoMakeTupletActor({
				index: selection.selector.tick,
				totalTicks: nticks,
				numNotes: numNotes,
				selection: selection
			});
		SmoTickTransformer.applyTransform(measure, actor,selection.selector.voice);
		selection.measure.setChanged();

		return true;
	}

    static removeStaffModifier(selection,modifier) {
        selection.staff.removeStaffModifier(modifier);
    }

	static makeRest(selection) {
		selection.measure.setChanged();
		selection.note.makeRest();
	}
	static makeNote(selection) {
		selection.measure.setChanged();
		selection.note.makeNote();
	}

    static addGraceNote(selection,offset,g) {
        selection.note.addGraceNote(offset,g);
        selection.measure.changed= true;
    }

    static removeGraceNote(selection,offset) {
        selection.note.removeGraceNote(offset);
        selection.measure.changed= true;
    }

    static doubleGraceNoteDuration(selection,modifiers) {
        if (!Array.isArray(modifiers)) {
            modifiers=[modifiers];
        }
        modifiers.forEach((mm) => {
            mm.ticks.numerator = mm.ticks.numerator * 2;
        });
        selection.measure.changed = true;
    }
    static halveGraceNoteDuration(selection,modifiers) {
        if (!Array.isArray(modifiers)) {
            modifiers=[modifiers];
        }
        modifiers.forEach((mm) => {
            mm.ticks.numerator = mm.ticks.numerator / 2;
        });
        selection.measure.changed = true;
    }

    static toggleGraceNoteCourtesy(selection,modifiers) {
        if (!Array.isArray(modifiers)) {
            modifiers=[modifiers];
        }
        modifiers.forEach((mm) => {
            mm.modifiers.pitches.forEach((pitch)=> {
                pitch.cautionary = pitch.cautionary ? false : true;
            });
        });
    }

    static transposeGraceNotes(selection,modifiers,offset) {
        if (!Array.isArray(modifiers)) {
            modifiers=[modifiers];
        }
        modifiers.forEach((mm) => {
            var par = [];
            mm.pitches.forEach((pitch)=> {
                par.push(par.length);
            });
            SmoNote._transpose(mm,par, offset, selection.measure.keySignature);
        });
    }

	// ## unmakeTuplet
	// ## Description
	// Makes a tuplet into a single with the duration of the whole tuplet
	static unmakeTuplet(selection) {
		var note = selection.note;
		var measure = selection.measure;
		if (!measure.getTupletForNote(note))
			return;
		var tuplet = measure.getTupletForNote(note);
		if (tuplet === null)
			return;
		var startIndex = measure.tupletIndex(tuplet);
		var endIndex = tuplet.notes.length + startIndex - 1;

		var actor = new SmoUnmakeTupletActor({
				startIndex: startIndex,
				endIndex: endIndex,
				measure: measure
			});
		SmoTickTransformer.applyTransform(measure, actor,selection.selector.voice);
		measure.setChanged();
		return true;
	}

	// ## dotDuration
	// ## Description
	// Add a dot to a note, if possible, and make the note ahead of it shorter
	// to compensate.
	static dotDuration(selection) {

		var note = selection.note;
		var measure = selection.measure;
		var nticks = smoMusic.getNextDottedLevel(note.tickCount);
		if (nticks == note.tickCount) {
			return;
		}

        // Don't dot if the thing on the right of the . is too small
        var dotCount = smoMusic.smoTicksToVexDots(nticks);
        var multiplier = Math.pow(2,dotCount);
        var baseDot = VF.durationToTicks(smoMusic.closestVexDuration(nticks))/(multiplier*2);
        if (baseDot <= 128) {
            return;
        }

		// If this is the ultimate note in the measure, we can't increase the length
		if (selection.selector.tick + 1 === selection.measure.voices[selection.selector.voice].notes.length) {
			return;
		}
		if (selection.measure.voices[selection.selector.voice].notes[selection.selector.tick + 1].tickCount > selection.note.tickCount) {
			console.log('too long');
			return;
		}
		// is dot too short?
		if (!smoMusic.ticksToDuration[selection.measure.voices[selection.selector.voice].notes[selection.selector.tick + 1].tickCount/2]) {
			return;
		}
		var actor = new SmoStretchNoteActor({
				startIndex: selection.selector.tick,
				tickmap: measure.tickmapForVoice(selection.selector.voice),
				newTicks: nticks
			});
		SmoTickTransformer.applyTransform(measure, actor,selection.selector.voice);
		measure.setChanged();
		return true;
	}

	// ## undotDuration
	// ## Description
	// Add the value of the last dot to the note, increasing length and
	// reducing the number of dots.
	static undotDuration(selection) {
		var note = selection.note;
		var measure = selection.measure;
		var nticks = smoMusic.getPreviousDottedLevel(note.tickCount);
		if (nticks == note.tickCount) {
			return;
		}
		var actor = new SmoContractNoteActor({
				startIndex: selection.selector.tick,
				tickmap: measure.tickmapForVoice(selection.selector.voice),
				newTicks: nticks
			});
		SmoTickTransformer.applyTransform(measure, actor,selection.selector.voice);
		selection.measure.setChanged();
		return true;
	}

	// ## transpose
	// ## Description
	// Transpose the selected note, trying to find a key-signature friendly value
	static transpose(selection, offset) {
		var measure = selection.measure;
		var note = selection.note;
		if (measure && note) {
            var pitchar = [];
            var pitchIx = 0;
            var voiceIx = 0;
            var accidentalMap = {};
            var activeTm = measure.tickmapForVoice(measure.getActiveVoice());
            var targetDuration = activeTm.durationMap[selection.selector.tick];

            note.pitches.forEach((opitch) => {
                // Only translate selected pitches
                var shouldXpose = selection.selector.pitches.length == 0 ||
                   selection.selector.pitches.indexOf(pitchIx) >= 0;

                // Translate the pitch, ignoring enharmonic
                var trans =  shouldXpose ? smoMusic.getKeyOffset(opitch,offset)
                   : JSON.parse(JSON.stringify(opitch));
                if (!trans.accidental) {
                    trans.accidental = 'n';
                }
                var transInt = smoMusic.smoPitchToInt(trans);

                // Look through the earlier notes in the measure and try
                // to find an equivalent note, and convert it if it exists.
                var voiceIx = 0;
                measure.voices.forEach((voice) => {
                   for (var i = 0;i<selection.selector.tick
                         && i < voice.notes.length;++i)  {
                       var prevNote = voice.notes[i];
                       prevNote.pitches.forEach((prevPitch) => {
                           var prevInt = smoMusic.smoPitchToInt(prevPitch);
                           if (prevInt == transInt) {
                               trans = JSON.parse(JSON.stringify(prevPitch));
                           }
                       });
                   }
                });
                pitchar.push(trans);
                pitchIx += 1;
            });
            note.pitches = pitchar;
			measure.setChanged();
			return true;
		}
		return false;
	}

	// ## setPitch
	// ## Description:
	// pitches can be either an array, a single pitch, or a letter.  In the latter case,
	// the letter value appropriate for the key signature is used, e.g. c in A major becomes
	// c#
	static setPitch(selection, pitches) {
		var measure = selection.measure;
		var note = selection.note;
		measure.setChanged();
		// TODO allow hint for octave
		var octave = note.pitches[0].octave;
		note.pitches = [];
		if (!Array.isArray(pitches)) {
			pitches = [pitches];
		}
        var earlierAccidental = (pitch) => {
            selection.measure.voices.forEach((voice) => {
                for (var i=0;i<selection.selector.tick
                       && i < voice.notes.length;++i) {
                    var prevNote = voice.notes[i];
                    if (prevNote == null || prevNote.pitches == null) {
                        console.log('this will die null');
                    }
                    prevNote.pitches.forEach((prevPitch) => {
                        if (prevPitch.letter == pitch.letter) {
                            pitch.accidental = prevPitch.accidental;
                        }
                    });
                }
            });
        }
		pitches.forEach((pitch) => {
			var letter = pitch;
			if (typeof(pitch) === 'string') {
				var letter = smoMusic.getKeySignatureKey(pitch[0], measure.keySignature);
				pitch = {
					letter: letter[0],
					accidental: letter.length > 1 ? letter.substring(1) : '',
					octave: octave
				};
			}

            earlierAccidental(pitch);
			note.pitches.push(pitch);
		});
		return true;
	}

	// ## addPitch
	// add a pitch to a note chord, avoiding duplicates.
	static addPitch(selection, pitches) {
		var toAdd = [];
		pitches.forEach((pitch) => {
			var found = false;
			toAdd.forEach((np) => {
				if (np.accidental === pitch.accidental && np.letter === pitch.letter && np.octave === pitch.octave) {
					found = true;
				}
			});
			if (!found) {
				toAdd.push(pitch);
			}
		});
		toAdd.sort(function (a, b) {
			return smoMusic.smoPitchToInt(a) -
			smoMusic.smoPitchToInt(b);
		});
		selection.note.pitches = JSON.parse(JSON.stringify(toAdd));
		selection.measure.setChanged();
	}

	static toggleCourtesyAccidental(selection) {
		var toBe = false;
		var i = 0;
		if (!selection.selector['pitches'] || selection.selector.pitches.length === 0) {
			var ps = [];
			selection.note.pitches.forEach((pitch) => {
				var p = JSON.parse(JSON.stringify(pitch));
				ps.push(p);
				p.cautionary = !(pitch.cautionary);
			});
			selection.note.pitches = ps;
		} else {
			toBe = !(selection.note.pitches[selection.selector.pitches[0]].cautionary);
		}

		SmoOperation.courtesyAccidental(selection, toBe);
		selection.measure.setChanged();
	}

	static courtesyAccidental(pitchSelection, toBe) {
		pitchSelection.selector.pitches.forEach((pitchIx) => {
			pitchSelection.note.pitches[pitchIx].cautionary = toBe;
		});
		pitchSelection.measure.setChanged();
	}

	static toggleEnharmonic(pitchSelection) {
		if (pitchSelection.selector.pitches.length === 0) {
			pitchSelection.selector.pitches.push(0);
		}
		var pitch = pitchSelection.note.pitches[pitchSelection.selector.pitches[0]];
		var lastLetter = pitch.letter;
		var vexPitch = smoMusic.stripVexOctave(smoMusic.pitchToVexKey(pitch));
		vexPitch = smoMusic.getEnharmonic(vexPitch);

		pitch.letter = vexPitch[0];
		pitch.accidental = vexPitch.length > 1 ?
			vexPitch.substring(1, vexPitch.length) : 'n';
		pitch.octave += smoMusic.letterChangedOctave(lastLetter, pitch.letter);
		pitchSelection.measure.setChanged();
	}

	static addDynamic(selection, dynamic) {
		selection.note.addModifier(dynamic);
		selection.measure.setChanged();
	}

    static beamSelections(selections) {
        var start = selections[0].selector;
        var cur = selections[0].selector;
        var beamGroup = [];
        var ticks = 0;
        selections.forEach((selection) => {
            if (SmoSelector.sameNote(start,selection.selector) ||
                (SmoSelector.sameMeasure(selection.selector,cur) &&
                 cur.tick == selection.selector.tick-1)) {
                ticks += selection.note.tickCount;
                cur = selection.selector;
                beamGroup.push(selection.note);
            }
        });
        if (beamGroup.length) {
            beamGroup.forEach((note) => {
                note.beamBeats=ticks;
                note.endBeam=false;
            });
            beamGroup[beamGroup.length - 1].endBeam=true;
        }
    }

    static toggleBeamDirection(selections) {
        selections[0].note.toggleFlagState();
        selections.forEach((selection) => {
            selection.note.flagState = selections[0].note.flagState;
            selection.measure.setChanged()
        });
    }

    static toggleOrnament(selection,ornament) {
		selection.note.toggleOrnament(ornament);
		selection.measure.setChanged();
    }

	static toggleArticulation(selection, articulation) {
		selection.note.toggleArticulation(articulation);
		selection.measure.setChanged();
	}

	static addEnding(score, parameters) {
		var startMeasure = parameters.startBar;
		var endMeasure = parameters.endBar;
		var s = 0;

		// Ending ID ties all the instances of an ending across staves
		parameters.endingId=VF.Element.newID();
		score.staves.forEach((staff) => {
			var m = 0;
			staff.measures.forEach((measure) => {
				if (m === startMeasure) {
					var pp = JSON.parse(JSON.stringify(parameters));
					pp.startSelector = {
						staff: s,
						measure: startMeasure
					};
					pp.endSelector = {
						staff: s,
						measure: endMeasure
					};
					var ending = new SmoVolta(pp);
					measure.addNthEnding(ending);
				}
				measure.setChanged();
				m += 1;
			});
			s += 1;
		});
	}

	static addScoreText(score,scoreText) {
		score.addScoreText(scoreText);
	}
	static removeScoreText(score,scoreText) {
		score.removeScoreText(scoreText);
	}

	static addMeasureText(score,selection,measureText) {
        var current = selection.measure.getMeasureText();
        // TODO: should we allow multiples per position
        current.forEach((mod) => {
            selection.measure.removeMeasureText(mod.attrs.id);
        });
		selection.measure.addMeasureText(measureText);
	}

	static removeMeasureText(score,selection,mt) {
		selection.measure.removeMeasureText(mt.attrs.id);
	}

	static addSystemText(score,selection,measureText) {
		var mm = selection.selector.measure;
		score.staves.forEach((staff) => {
			var mt = new SmoMeasureText(measureText.serialize());
			staff.measures[mm].addMeasureText(mt);
		});
	}

	static addRehearsalMark(score,selection,rehearsalMark) {
		var mm = selection.selector.measure;
		score.staves.forEach((staff) => {
			var mt = new SmoRehearsalMark(rehearsalMark.serialize());
            staff.addRehearsalMark(selection.selector.measure,mt);
		});
	}

    static addLyric(score,selection,lyric) {
        selection.note.addLyric(lyric);
    }

    static removeLyric(score,selection,lyric) {
        selection.note.removeLyric(lyric);
    }

    static addTempo(score,selection,tempo) {
		score.staves.forEach((staff) => {
            staff.addTempo(tempo,selection.selector.measure);
		});
    }

    static removeTempo(score,selection) {
		score.staves.forEach((staff) => {
            staff.removeTempo();
		});
    }


    static removeRehearsalMark(score,selection,rehearsalMark) {
		score.staves.forEach((staff) => {
            staff.removeRehearsalMark(selection.selector.measure);
		});
	}

	static setMeasureBarline(score, selection, barline) {
		var mm = selection.selector.measure;
		var ix = 0;
		score.staves.forEach((staff) => {
			var s2 = SmoSelection.measureSelection(score, ix, mm);
			s2.measure.setBarline(barline);
			s2.measure.setChanged();
			ix += 1;
		});
	}

	static setRepeatSymbol(score, selection, sym) {
		var mm = selection.selector.measure;
		var ix = 0;
		score.staves.forEach((staff) => {
			var s2 = SmoSelection.measureSelection(score, ix, mm);
			s2.measure.setRepeatSymbol(sym);
			s2.measure.setChanged();
			ix += 1;
		});
	}

	// ## interval
	// Add a pitch at the specified interval to the chord in the selection.
	static interval(selection, interval) {
		var measure = selection.measure;
		var note = selection.note;
		selection.measure.setChanged();

		// TODO: figure out which pitch is selected
		var pitch = note.pitches[0];
		if (interval > 0) {
			pitch = note.pitches[note.pitches.length - 1];
		}
		var pitch = smoMusic.getIntervalInKey(pitch, measure.keySignature, interval);
		if (pitch) {
			note.pitches.push(pitch);
			note.pitches.sort((x, y) => {
				return smoMusic.smoPitchToInt(x) - smoMusic.smoPitchToInt(y);
			});
			return true;
		}
		return false;
	}

	static crescendo(fromSelection, toSelection) {
		var fromSelector = JSON.parse(JSON.stringify(fromSelection.selector));
		var toSelector = JSON.parse(JSON.stringify(toSelection.selector));
		var modifier = new SmoStaffHairpin({
				startSelector: fromSelector,
				endSelector: toSelector,
				hairpinType: SmoStaffHairpin.types.CRESCENDO,
				position: SmoStaffHairpin.positions.BELOW
			});
		fromSelection.staff.addStaffModifier(modifier);
	}

	static decrescendo(fromSelection, toSelection) {
		var fromSelector = JSON.parse(JSON.stringify(fromSelection.selector));
		var toSelector = JSON.parse(JSON.stringify(toSelection.selector));
		var modifier = new SmoStaffHairpin({
				startSelector: fromSelector,
				endSelector: toSelector,
				hairpinType: SmoStaffHairpin.types.DECRESCENDO,
				position: SmoStaffHairpin.positions.BELOW
			});
		fromSelection.staff.addStaffModifier(modifier);
	}

	static slur(fromSelection, toSelection) {
		var fromSelector = JSON.parse(JSON.stringify(fromSelection.selector));
		var toSelector = JSON.parse(JSON.stringify(toSelection.selector));
		var modifier = new SmoSlur({
				startSelector: fromSelector,
				endSelector: toSelector,
				position: SmoStaffHairpin.positions.BELOW
			});
		fromSelection.staff.addStaffModifier(modifier);
		fromSelection.measure.setChanged();
		toSelection.measure.setChanged();
	}

	static addStaff(score, parameters) {
		score.addStaff(parameters);
	}
	static removeStaff(score, index) {
		score.removeStaff(index);
	}
	static changeInstrument(score, instrument, selections) {
		var measureHash = {};
		selections.forEach((selection) => {
			if (!measureHash[selection.selector.measure]) {
				measureHash[selection.selector.measure] = 1;
				selection.measure.clef = instrument.clef;
				selection.measure.setChanged();
				selection.measure.transposeIndex = instrument.keyOffset;
				selection.measure.voices.forEach((voice) => {
					voice.notes.forEach((note) => {
						note.clef = instrument.clef;
					});
				});
			}
		});
	}

	static addMeasure(score, systemIndex, nmeasure) {
		score.addMeasure(systemIndex, nmeasure);
	}
}
;
// ## UndoBuffer
// ## Description:
// manage a set of undo or redo operations on a score.  The objects passed into
// undo must implement serialize()/deserialize()
// ## Buffer format:
// A buffer is one of 3 things:
// * A single measure,
// * A single staff
// * the whole score.
class UndoBuffer {
    constructor() {
        this.buffer = [];
		this.opCount = 0;
    }
    static get bufferMax() {
        return 100;
    }

    static get bufferTypes() {
        return ['measure', 'staff', 'score'];
    }

    // ### addBuffer
    // ### Description:
    // Add the current state of the score required to undo the next operation we
    // are about to perform.  For instance, if we are adding a crescendo, we back up the
    // staff the crescendo will go on.
    addBuffer(title, type, selector, obj) {
        if (UndoBuffer.bufferTypes.indexOf(type) < 0) {
            throw ('Undo failure: illegal buffer type ' + type);
        }
        var json = obj.serialize();
        var undoObj = {
            title: title,
            type: type,
            selector: selector,
            json: json
        };
        if (this.buffer.length >= UndoBuffer.bufferMax) {
            this.buffer.splice(0,1);
        }
		this.opCount += 1;
        this.buffer.push(undoObj);
    }

    // ### _pop
    // ### Description:
    // Internal method to pop the top buffer off the stack.
    _pop() {

        if (this.buffer.length < 1)
            return null;
        var buf = this.buffer.pop();
        return buf;
    }

    // ## Before undoing, peek at the top action in the q
    // so it can be re-rendered
    peek() {
        if (this.buffer.length < 1)
            return null;
        return this.buffer[this.buffer.length - 1];
    }

    // ## undo
    // ## Description:
    // Undo the operation at the top of the undo stack.  This is done by replacing
    // the music as it existed before the change was made.
    undo(score) {
        var buf = this._pop();
        if (!buf)
            return score;
        if (buf.type === 'measure') {
            var measure = SmoMeasure.deserialize(buf.json);
            measure.setChanged();
            score.replaceMeasure(buf.selector, measure);
        } else if (buf.type === 'score') {
            // Score expects string, as deserialized score is how saving is done.
            score = SmoScore.deserialize(JSON.stringify(buf.json));
        } else {
            // TODO: test me
            var staff = SmoSystemStaff.deserialize(buf.json);
            score.replaceStaff(buf.selector.staff, staff);
        }
        return score;
    }

}

// ## SmoUndoable
// ## Description:
// Convenience functions to save the score state before operations so we can undo the operation.
// Each undo-able knows which set of parameters the undo operation requires (measure, staff, score).
class SmoUndoable {
	static undoForSelections(score,selections,undoBuffer,operation) {
	    var staffUndo = false;
		var scoreUndo = false;
		if (!selections.length)
			return;
		var measure=selections[0].selector.measure;
		var staff = selections[0].selector.staff;
		for (var i=0;i<selections.length;++i) {
			var sel = selections[i];
			if (sel.selector.measure != measure) {
				staffUndo = true;
			} else if (sel.selector.staff != staff) {
				scoreUndo = true;
				break;
			}
		}
		if (scoreUndo) {
			undoBuffer.addBuffer('score backup for '+operation, 'score', null, score);
		} else if (staffUndo) {
			undoBuffer.addBuffer('staff backup for '+operation, 'staff', selections[0].selector, score);
		} else {
			undoBuffer.addBuffer('measure backup for '+operation, 'measure', selections[0].selector, selections[0].measure);
		}
	}
	// Add the measure/staff/score that will cover this list of selections
	static batchDurationOperation(score,selections,operation,undoBuffer) {
	    SmoUndoable.undoForSelections(score,selections,undoBuffer,operation);
		SmoOperation.batchSelectionOperation(score,selections,operation);
	}
    static multiSelectionOperation(score,selections,operation,parameter,undoBuffer) {
        SmoUndoable.undoForSelections(score,selections,undoBuffer,operation);
        SmoOperation[operation](score,selections,parameter);
    }
    static addGraceNote(selection,undoBuffer) {
        undoBuffer.addBuffer('grace note ' + JSON.stringify(selection.note.pitches, null, ' '),
            'measure', selection.selector, selection.measure);
        var pitches = JSON.parse(JSON.stringify(selection.note.pitches));
        SmoOperation.addGraceNote(selection,new SmoGraceNote({pitches:pitches,ticks:{numerator:2048,denominator:1,remainder:0}}))
    }
    static removeGraceNote(selection,params,undoBuffer) {
        undoBuffer.addBuffer('remove grace note',
            'measure', selection.selector, selection.measure);
        SmoOperation.removeGraceNote(selection,params.index);
    }

    static transposeGraceNotes(selection,params,undoBuffer) {
        undoBuffer.addBuffer('transpose grace note',
            'measure', selection.selector, selection.measure);
        SmoOperation.transposeGraceNotes(selection,params.modifiers,params.offset);
    }
    static padMeasuresLeft(selections,padding,undoBuffer) {
        if (!Array.isArray(selections)) {
            selections=[selections];
        }
        selections.forEach((selection) => {
            undoBuffer.addBuffer('pad measure','measure',selection.selector,selection.measure);
            SmoOperation.padMeasureLeft(selection,padding);
        });
    }
    static doubleGraceNoteDuration(selection,modifier,undoBuffer) {
        undoBuffer.addBuffer('double grace note duration',
            'measure', selection.selector, selection.measure);
        SmoOperation.doubleGraceNoteDuration(selection,modifier);
    }

    static halveGraceNoteDuration(selection,modifier,undoBuffer) {
        undoBuffer.addBuffer('halve grace note duration',
            'measure', selection.selector, selection.measure);
        SmoOperation.halveGraceNoteDuration(selection,modifier);
    }
    static setPitch(selection, pitches, undoBuffer)  {
        undoBuffer.addBuffer('pitch change ' + JSON.stringify(pitches, null, ' '),
            'measure', selection.selector, selection.measure);
        SmoOperation.setPitch(selection, pitches);
    }
    static addPitch(selection, pitches, undoBuffer)  {
        undoBuffer.addBuffer('pitch change ' + JSON.stringify(pitches, null, ' '),
            'measure', selection.selector, selection.measure);
        SmoOperation.addPitch(selection, pitches);
    }
    static doubleDuration(selection, undoBuffer) {
        undoBuffer.addBuffer('double duration', 'measure', selection.selector, selection.measure);
        SmoOperation.doubleDuration(selection);
    }
    static halveDuration(selection, undoBuffer) {
        undoBuffer.addBuffer('halve note duration', 'measure', selection.selector, selection.measure);
        SmoOperation.halveDuration(selection);
    }
    static makeTuplet(selection, numNotes, undoBuffer) {
        undoBuffer.addBuffer(numNotes + '-let', 'measure', selection.selector, selection.measure);
        SmoOperation.makeTuplet(selection, numNotes);
    }
    static makeRest(selection, undoBuffer) {
        undoBuffer.addBuffer('make rest', 'measure', selection.selector, selection.measure);
        SmoOperation.makeRest(selection);
    }
    static makeNote(selection, undoBuffer) {
        undoBuffer.addBuffer('make note', 'measure', selection.selector, selection.measure);
        SmoOperation.makeNote(selection);
    }
    static unmakeTuplet(selection, undoBuffer) {
        undoBuffer.addBuffer('unmake tuplet', 'measure', selection.selector, selection.measure);
        SmoOperation.unmakeTuplet(selection);
    }
    static dotDuration(selection, undoBuffer) {
        undoBuffer.addBuffer('dot duration', 'measure', selection.selector, selection.measure);
        SmoOperation.dotDuration(selection);
    }
    static populateVoice(selections,voiceIx,undoBuffer) {
        var measures = SmoSelection.getMeasureList(selections);
        measures.forEach((selection) => {
            undoBuffer.addBuffer('populate voice', 'measure',
               selection.selector, selection.measure);
            SmoOperation.populateVoice(selection,voiceIx);
        });
    }

    static depopulateVoice(selections,voiceIx,undoBuffer) {
        var measures = SmoSelection.getMeasureList(selections);
        measures.forEach((selection) => {
            undoBuffer.addBuffer('populate voice', 'measure',
               selection.selector, selection.measure);
            SmoOperation.depopulateVoice(selection,voiceIx);
        });
    }
    static toggleBeamGroups(selections, undoBuffer) {
        var measureUndoHash = {};
        selections.forEach((selection) => {
            if (!measureUndoHash[selection.selector.measure]) {
                measureUndoHash[selection.selector.measure] = true;
                undoBuffer.addBuffer('toggleBeamGroups', 'measure', selection.selector, selection.measure);
            }
            SmoOperation.toggleBeamGroup(selection);
        });
    }
    static toggleBeamDirection(selections,undoBuffer) {
        undoBuffer.addBuffer('beam notes', 'measure', selections[0].selector, selections[0].measure);
        SmoOperation.toggleBeamDirection(selections);
    }
    static beamSelections(selections,undoBuffer) {
        undoBuffer.addBuffer('beam notes', 'measure', selections[0].selector, selections[0].measure);
        SmoOperation.beamSelections(selections);
    }
    static undotDuration(selection, undoBuffer) {
        undoBuffer.addBuffer('undot duration', 'measure', selection.selector, selection.measure);
        SmoOperation.undotDuration(selection);
    }
    static transpose(selection, offset, undoBuffer) {
        undoBuffer.addBuffer('transpose pitches ' + offset, 'measure', selection.selector, selection.measure);
        SmoOperation.transpose(selection, offset);
    }
    static courtesyAccidental(pitchSelection, toBe, undoBuffer) {
        undoBuffer.addBuffer('courtesy accidental ', 'measure', pitchSelection.selector, pitchSelection.measure);
        SmoOperation.courtesyAccidental(pitchSelection, toBe);
    }
    static addDynamic(selection, dynamic, undoBuffer) {
        undoBuffer.addBuffer('add dynamic', 'measure', selection.selector, selection.measure);
        SmoOperation.addDynamic(selection, dynamic);
    }
	static toggleEnharmonic(pitchSelection,undoBuffer) {
	     undoBuffer.addBuffer('toggle enharmonic', 'measure', pitchSelection.selector, pitchSelection.measure);
		 SmoOperation.toggleEnharmonic(pitchSelection)
	}
    static interval(selection, interval, undoBuffer) {
        undoBuffer.addBuffer('add interval ' + interval, 'measure', selection.selector, selection.measure);
        SmoOperation.interval(selection, interval);
    }
    static crescendo(fromSelection, toSelection, undoBuffer) {
        undoBuffer.addBuffer('crescendo', 'staff', fromSelection.selector, fromSelection.staff);
        SmoOperation.crescendo(fromSelection, toSelection);
    }
    static decrescendo(fromSelection, toSelection, undoBuffer) {
        undoBuffer.addBuffer('decrescendo', 'staff', fromSelection.selector, fromSelection.staff);
        SmoOperation.decrescendo(fromSelection, toSelection);
    }
    static slur(fromSelection, toSelection, undoBuffer) {
        undoBuffer.addBuffer('slur', 'staff', fromSelection.selector, fromSelection.staff);
        SmoOperation.slur(fromSelection, toSelection);
    }
    // easy way to back up the score for a score-wide operation
	static noop(score,undoBuffer,label) {
        label = label ? label : 'Backup';
        undoBuffer.addBuffer(label, 'score', null, score);
	}

	static measureSelectionOp(score,selection,op,params,undoBuffer,description) {
		undoBuffer.addBuffer(description, 'measure', selection.selector, selection.measure);
		SmoOperation[op](score,selection,params);
	}

    static staffSelectionOp(score,selection,op,params,undoBuffer,description) {
		undoBuffer.addBuffer(description, 'staff', selection.selector, selection.staff);
		SmoOperation[op](selection,params);
	}

	static scoreSelectionOp(score,selection,op,params,undoBuffer,description) {
        undoBuffer.addBuffer(description, 'score', null, score);
		SmoOperation[op](score,selection,params);
	}
	static scoreOp(score,op,params,undoBuffer,description) {
		undoBuffer.addBuffer(description, 'score', null, score);
		SmoOperation[op](score,params);
	}

    static addKeySignature(score, selection, keySignature, undoBuffer) {
        undoBuffer.addBuffer('addKeySignature ' + keySignature, 'score', null, score);
        SmoOperation.addKeySignature(score, selection, keySignature);
    }
    static addMeasure(score, systemIndex, nmeasure, undoBuffer) {
        undoBuffer.addBuffer('add measure', 'score', null, score);
        SmoOperation.addMeasure(score, systemIndex, nmeasure);
    }
    static deleteMeasure(score, selection, undoBuffer) {
        undoBuffer.addBuffer('delete measure', 'score', null, score);
        var measureIndex = selection.selector.measure;
        score.deleteMeasure(measureIndex);
    }
    static addStaff(score, parameters, undoBuffer) {
        undoBuffer.addBuffer('add instrument', 'score', null, score);
        SmoOperation.addStaff(score, parameters);
    }
    static toggleGraceNoteCourtesyAccidental(selection,modifier,undoBuffer) {
        undoBuffer.addBuffer('toggle grace courtesy ','measure', selection.selector, selection.measure);
		SmoOperation.toggleGraceNoteCourtesy(selection,modifier);
    }
	static toggleCourtesyAccidental(selection,undoBuffer) {
        undoBuffer.addBuffer('toggle courtesy ','measure', selection.selector, selection.measure);
		SmoOperation.toggleCourtesyAccidental(selection);
	}
    static removeStaff(score, index, undoBuffer) {
        undoBuffer.addBuffer('remove instrument', 'score', null, score);
        SmoOperation.removeStaff(score, index);
    }
    static changeInstrument(score, instrument, selections, undoBuffer) {
        undoBuffer.addBuffer('changeInstrument', 'staff', selections[0].selector, selections[0].staff);
        SmoOperation.changeInstrument(score, instrument, selections);
    }
	static pasteBuffer(score,pasteBuffer,selections,undoBuffer,operation) {
		SmoUndoable.undoForSelections(score,selections,undoBuffer,operation);
		var pasteTarget = selections[0].selector;
        pasteBuffer.pasteSelections(this.score, pasteTarget);
	}
}
;


// ## PasteBuffer
// ### Description:
// Hold some music that can be pasted back to the score
class PasteBuffer {
	constructor() {
		this.notes = [];
		this.noteIndex = 0;
		this.measures = [];
		this.measureIndex = -1;
		this.remainder = 0;
	}

	setSelections(score, selections) {
		this.notes = [];
		this.noteIndex = 0;
		var measureIndex = -1;
		this.score = score;

		if (selections.length < 1) {
			return;
		}

		this.tupletNoteMap = {};
		var first = selections[0];
		var last = selections[selections.length - 1];

		var startTuplet = first.measure.getTupletForNote(first.note);
		if (startTuplet) {
			if (startTuplet.getIndexOfNote(first.note) != 0) {
				return; // can't paste from the middle of a tuplet
			}
		}
		var endTuplet = last.measure.getTupletForNote(last.note);
		if (endTuplet) {
			if (endTuplet.getIndexOfNote(last.note) != endTuplet.notes.length - 1) {
				return; // can't paste part of a tuplet.
			}
		}

		this._populateSelectArray(selections);

	}
	// ### _populateSelectArray
	// ### Description:
	// copy the selected notes into the paste buffer with their original locations.
	_populateSelectArray(selections) {
		var currentTupletParameters = null;
		var currentTupletNotes = [];
        this.modifiers=[];
		selections.forEach((selection) => {
			var selector = JSON.parse(JSON.stringify(selection.selector));
            var mod = selection.staff.getModifiersAt(selector);
            if (mod.length) {
                mod.forEach((modifier) => {
                    var cp = StaffModifierBase.deserialize(modifier.serialize());
                    cp.attrs.id = VF.Element.newID();
                    this.modifiers.push(cp);
                });
            }
			if (selection.note.isTuplet) {
				var tuplet = selection.measure.getTupletForNote(selection.note);
				var index = tuplet.getIndexOfNote(selection.note);
				if (index == 0) {
					var ntuplet = SmoTuplet.cloneTuplet(tuplet);
					this.tupletNoteMap[ntuplet.attrs.id] = ntuplet;
					ntuplet.notes.forEach((nnote) => {

						this.notes.push({
						selector:selector,note:nnote});
						selector = JSON.parse(JSON.stringify(selector));
						selector.tick += 1;
					});
				}
			} else {

				var note = SmoNote.clone(selection.note);
				this.notes.push({
					selector: selector,
					note: note
				});
			}
		});
		this.notes.sort((a, b) => {
			return SmoSelector.gt(a.selector, b.selector) ? 1 : -1;
		});
	}

	clearSelections() {
		this.notes = [];
	}

    _findModifier(selector) {
        var rv = this.modifiers.filter((mod) => SmoSelector.eq(selector,mod.startSelector));
        return (rv && rv.length) ? rv[0] : null;
    }
    _findPlacedModifier(selector) {
        var rv = this.modifiers.filter((mod) => SmoSelector.eq(selector,mod.endSelector));
        return (rv && rv.length) ? rv[0] : null;
    }

	// ### _populateMeasureArray
	// ### Description:
	// Before pasting, populate an array of existing measures from the paste destination
	// so we know how to place the notes.
	_populateMeasureArray() {
		this.measures = [];
        this.staffSelectors = [];
		var measureSelection = SmoSelection.measureSelection(this.score, this.destination.staff, this.destination.measure);
		var measure = measureSelection.measure;
		this.measures.push(measure);
		var tickmap = measure.tickmapForVoice(this.destination.voice);
		var startSel = this.notes[0].selector;
		var currentDuration = tickmap.durationMap[this.destination.tick];
		var rv = [];
		this.notes.forEach((selection) => {
			if (currentDuration + selection.note.tickCount > tickmap.totalDuration && measureSelection != null) {
				// If this note will overlap the measure boundary, the note will be split in 2 with the
				// remainder going to the next measure.  If they line up exactly, the remainder is 0.
				var remainder = (currentDuration + selection.note.tickCount) - tickmap.totalDuration;
				currentDuration = remainder;

				measureSelection = SmoSelection.measureSelection(this.score,
						measureSelection.selector.staff,
						measureSelection.selector.measure + 1);

				// If the paste buffer overlaps the end of the score, we can't paste (TODO:  add a measure in this case)
				if (measureSelection != null) {
					this.measures.push(measureSelection.measure);
				}
			} else if (measureSelection != null) {
				currentDuration += selection.note.tickCount;
			}
		});
	}

	// ### _populatePre
	// When we paste, we replace entire measures.  Populate the first measure up until the start of pasting.
	_populatePre(voiceIndex, measure, startTick, tickmap) {
		var voice = {
			notes: []
		};
		var ticksToFill = tickmap.durationMap[startTick];
		var filled = 0;
		// TODO: bug here, need to handle tuplets in pre-part, create new tuplet
		for (var i = 0; i < measure.voices[voiceIndex].notes.length; ++i) {

			var note = measure.voices[voiceIndex].notes[i];
			// IF this is a tuplet, clone all the notes at once.
			if (note.isTuplet) {
				var tuplet = measure.getTupletForNote(note);
                if (!tuplet) {
                    continue;  // we remove the tuplet after first iteration
                }
                var ntuplet = SmoTuplet.cloneTuplet(tuplet);
                voice.notes = voice.notes.concat(ntuplet.notes);
                measure.removeTupletForNote(note);
                measure.tuplets.push(ntuplet);
                ticksToFill -= tuplet.tickCount;
			} else if (ticksToFill >= note.tickCount) {
				ticksToFill -= note.tickCount;
				voice.notes.push(SmoNote.clone(note));
			} else {
				var duration = note.tickCount - ticksToFill;
                var durMap = smoMusic.gcdMap(duration);
                durMap.forEach((dd) => {
                    SmoNote.cloneWithDuration(note, {
    					numerator: dd,
    					denominator: 1,
    					remainder: 0
    				});
                });
				ticksToFill = 0;
			}
			if (ticksToFill < 1) {
				break;
			}
		}
		return voice;
	}

	// ### _populateVoice
	// ### Description:
	// Create a new voice for a new measure in the paste destination
	_populateVoice(voiceIndex) {
		this._populateMeasureArray();
		var measures = this.measures;
		this.measureIndex = 0;
		var measureVoices = [];

		var measure = measures[0];
		var tickmap = measure.tickmapForVoice(this.destination.voice);
		var startSelector = JSON.parse(JSON.stringify(this.destination));
		var measureTuplets = [];
		var voice = this._populatePre(voiceIndex, measure, this.destination.tick, tickmap);
		measureVoices.push(voice);
		while (this.measureIndex < measures.length) {
			measure = measures[this.measureIndex];
			tickmap = measure.tickmapForVoice(this.destination.voice);
			this._populateNew(voice, voiceIndex, measure, tickmap, startSelector);
			if (this.noteIndex < this.notes.length && this.measureIndex < measures.length) {
				voice = {
					notes: []
				};
				measureVoices.push(voice);
				startSelector = {
					staff: startSelector.staff,
					measure: startSelector.measure,
					voice: voiceIndex,
					tick: 0
				};
				this.measureIndex += 1;
                startSelector.measure += 1;
			} else {
				break;
			}
		}
		this._populatePost(voice, voiceIndex, measure, tickmap, startSelector.tick);

		return measureVoices;
	}

	static _countTicks(voice) {
		var voiceTicks = 0;
		voice.notes.forEach((note) => {
			voiceTicks += note.tickCount;
		});
		return voiceTicks;
	}

    // ### _populateModifier
    // If the destination contains a modifier start and end, copy and paste it.
    _populateModifier(srcSelector,destSelector,staff) {
        var mod = this._findModifier(srcSelector);
        // If this is the starting point of a staff modifier, update the selector
        if (mod) {
            mod.startSelector = JSON.parse(JSON.stringify(destSelector));
        }
        // If this is the ending point of a staff modifier, paste the modifier
        mod = this._findPlacedModifier(srcSelector);
        if (mod) {
            mod.endSelector = JSON.parse(JSON.stringify(destSelector));
            mod.attrs.id = VF.Element.newID();
            staff.addStaffModifier(mod);
        }
    }

	// ### _populateNew
	// Start copying the paste buffer into the destination by copying the notes and working out
	// the measure overlap
	_populateNew(voice, voiceIndex, measure, tickmap, startSelector) {
		var currentDuration = tickmap.durationMap[startSelector.tick];
		var totalDuration = tickmap.totalDuration;
		while (currentDuration < totalDuration && this.noteIndex < this.notes.length) {
            var selection = this.notes[this.noteIndex];
			var note = selection.note;
            this._populateModifier(selection.selector,startSelector,this.score.staves[selection.selector.staff]);
			if (note.isTuplet) {
				var tuplet = this.tupletNoteMap[note.tuplet.id];
                var ntuplet = SmoTuplet.cloneTuplet(tuplet);
                this.noteIndex += ntuplet.notes.length;
                startSelector.tick += ntuplet.notes.length;
                currentDuration += tuplet.tickCount;
                for (var i =  0;i < ntuplet.notes.length;++i) {
                    var tn = ntuplet.notes[i];
                    tn.clef = measure.clef;
                    voice.notes.push(tn);
                }
                measure.tuplets.push(ntuplet);
			} else if (currentDuration + note.tickCount <= totalDuration && this.remainder === 0) {
				// The whole note fits in the measure, paste it.
                var nnote = SmoNote.clone(note);
                nnote.clef = measure.clef;
				voice.notes.push(nnote);
				currentDuration += note.tickCount;
				this.noteIndex += 1;
				startSelector.tick += 1;
			} else if (this.remainder > 0) {
				// This is a note that spilled over the last measure
                var nnote = SmoNote.cloneWithDuration(note, {
						numerator: this.remainder,
						denominator: 1,
						remainder: 0
					});
                nnote.clef = measure.clef;
				voice.notes.push(nnote);

				currentDuration += this.remainder;
				this.remainder = 0;
			} else {
				// The note won't fit, so we split it in 2 and paste the remainder in the next measure.
				// TODO:  tie the last note to this one.
				var partial = totalDuration - currentDuration;
                var dar = smoMusic.gcdMap(partial);
                dar.forEach((ddd) => {
                    voice.notes.push(SmoNote.cloneWithDuration(note, {
    						numerator: ddd,
    						denominator: 1,
    						remainder: 0
    					}));
                });
				currentDuration += partial;

				// Set the remaining length of the current note, this will be added to the
				// next measure with the previous note's pitches
				this.remainder = note.tickCount - partial;
			}
		}
	}

	// ### _populatePost
	// When we paste, we replace entire measures.  Populate the last measure from the end of paste to the
	// end of the measure with notes in the existing measure.
	_populatePost(voice, voiceIndex, measure, tickmap, endTick) {
		var startTicks = PasteBuffer._countTicks(voice);
		var notes = measure.voices[voiceIndex].notes;
		var totalDuration = tickmap.totalDuration;
		while (startTicks < totalDuration) {
			// Find the point in the music where the paste area runs out, or as close as we can get.
			var existingIndex = tickmap.durationMap.indexOf(startTicks);
			existingIndex = (existingIndex < 0) ? measure.voices[voiceIndex].notes.length - 1 : existingIndex;
			var note = measure.voices[voiceIndex].notes[existingIndex];
            if (note.isTuplet) {
                var tuplet = measure.getTupletForNote(note);
                var ntuplet = null;
                var ntuplet = SmoTuplet.cloneTuplet(tuplet);
                startTicks += tuplet.tickCount;
                voice.notes = voice.notes.concat(ntuplet.notes);
                measure.tuplets.push(ntuplet);
                measure.removeTupletForNote(note);
            } else {
    			var ticksLeft = totalDuration - startTicks;
    			if (ticksLeft >= note.tickCount) {
    				startTicks += note.tickCount;
    				voice.notes.push(SmoNote.clone(note));
    			} else {
    				var remainder = totalDuration - startTicks;
    				voice.notes.push(SmoNote.cloneWithDuration(note, {
    						numerator: remainder,
    						denominator: 1,
    						remainder: 0
    					}));
    				startTicks = totalDuration;
    			}
            }
		}
	}

    _pasteVoiceSer(ser,vobj,voiceIx) {
        var voices = [];
        var ix = 0;
        ser.voices.forEach((vc) => {
            if(ix != voiceIx) {
                voices.push(vc);
            } else {
                voices.push(vobj);
            }
            ix += 1;
        });
        ser.voices = voices;
    }

	pasteSelections(score, selector) {
		this.destination = selector;
		if (this.notes.length < 1) {
			return;
		}

		var voices = this._populateVoice(this.destination.voice);
		var measureSel = JSON.parse(JSON.stringify(this.destination));
		for (var i = 0; i < this.measures.length; ++i) {
			var measure = this.measures[i];
			var nvoice = voices[i];
			var ser = measure.serialize();
			var vobj = {
				notes: []
			};
			nvoice.notes.forEach((note) => {
				vobj.notes.push(note.serialize());
			});

			// TODO: figure out how to do this with multiple voices
            this._pasteVoiceSer(ser,vobj,this.destination.voice);
			var nmeasure = SmoMeasure.deserialize(ser);
            nmeasure.renderedBox = svgHelpers.smoBox(measure.renderedBox);
            nmeasure.setBox(svgHelpers.smoBox(measure.logicalBox),'copypaste');
            nmeasure.setX(measure.logicalBox.x,'copyPaste');
            nmeasure.setWidth( measure.logicalBox.width,'copypaste');
            nmeasure.setY(measure.logicalBox.y,'copypaste');
            ['forceClef','forceKeySignature','forceTimeSignature','forceTempo'].forEach((flag) => {
                nmeasure[flag] = measure[flag];
            });
			this.score.replaceMeasure(measureSel, nmeasure);
			measureSel.measure += 1;
		}
	}
}
;VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

VX.groupCounter = 1;

// ## Description:
//   Create a staff and draw music on it usinbg VexFLow rendering engine
//
// ###  Options:
//  `{measure:measure}` - The SMO measure to render
// ### VxMeasure methods
// ---
class VxMeasure {
    constructor(context, options) {
        this.context = context;
        Vex.Merge(this, VxMeasure.defaults);
        Vex.Merge(this, options);
        this.smoMeasure = this.smoMeasure ? this.smoMeasure : new SmoMeasure(options);
        this.noteToVexMap = {};
        this.beamToVexMap = {};
        this.tupletToVexMap = {};
        this.modifierOptions = {};
        this.lyricShift = 0;

        this.vexNotes = [];
        this.vexBeamGroups = [];
        this.vexTuplets = [];
        this.vexBeamGroups = [];
        this.beamToVexMap = {};
    }

	static get adjLeftPixels() {
		return 5;
	}

	static get adjRightPixels() {
		return 5;
	}

    static get defaults() {
        // var defaultLayout = new smrfSimpleLayout();

        return {
            smoMeasure: null
        };
    }
    addCustomModifier(ctor, parameters) {
        this.smoMeasure.addCustomModifier(ctor, parameters);
    }

    applyTransform(actor) {
        SmoTickTransformer.applyTransform(this.smoMeasure, [actor]);
        smoModifierFactory.applyModifiers(this.smoMeasure);
    }
    applyModifiers() {
        smoModifierFactory.applyModifiers(this.smoMeasure);
    }

    // ## Description:
    // decide whether to force stem direction for multi-voice, or use the default.
    // ## TODO:
    // use x position of ticks in other voices, pitch of note, and consider
    // stem direction modifier.
    applyStemDirection(vxParams,voiceIx) {
        if (this.smoMeasure.voices.length === 1) {
            vxParams.auto_stem = true;
        } else if (voiceIx % 2) {
            vxParams.stem_direction = -1;
        } else {
            vxParams.stem_direction = 1;
        }
    }

    // We add microtones to the notes, without regard really to how they interact
    _createMicrotones(smoNote,vexNote) {
        var tones = smoNote.getMicrotones();
        tones.forEach((tone) => {
            var acc = new VF.Accidental(tone.toVex);
            vexNote.addAccidental(tone.pitch,acc);
        });
    }

	_createAccidentals(smoNote,vexNote,tickIndex,voiceIx) {
        var tickmap = this.smoMeasure.tickmapForVoice(voiceIx);
        for (var i = 0; i < smoNote.pitches.length; ++i) {
            var pitch = smoNote.pitches[i];
            var duration = this.tickmapObject.tickmaps[voiceIx].durationMap[tickIndex];
            var keyAccidental = smoMusic.getAccidentalForKeySignature(pitch,this.smoMeasure.keySignature);
            var accidentals = this.tickmapObject.accidentalArray.filter((ar) =>
                ar.duration < duration && ar.pitches[pitch.letter]);
            var acLen = accidentals.length;
            var declared = acLen > 0 ?
                accidentals[acLen - 1].pitches[pitch.letter].pitch.accidental: keyAccidental;

            if (declared != pitch.accidental
                || pitch.cautionary) {
                var acc = new VF.Accidental(pitch.accidental);

                if (pitch.cautionary) {
                    acc.setAsCautionary();
                }
                vexNote.addAccidental(i, acc);
            }
        }
        for (var i = 0; i < smoNote.dots; ++i) {
            vexNote.addDotToAll();
        }
        this._createMicrotones(smoNote,vexNote);
	}

    _createOrnaments(smoNote,vexNote) {
        var o  = smoNote.getOrnaments();
        var ix=0;
        o.forEach((ll) => {
            var mod = new VF.Ornament(ll.ornament);
            if (ll.offset === SmoOrnament.offsets.after) {
                mod.setDelayed(true);
            }
            vexNote.addModifier(ix, mod);
            ix += 1;
        });

    }

    _createLyric(smoNote,vexNote,x_shift) {
        var lyrics = smoNote.getModifiers('SmoLyric');
        var ix = 0;
        lyrics.forEach((ll) => {
            var y = ll.verse*10;
            var vexL = new VF.Annotation(ll.text);

            // If we adjusted this note for the lyric, adjust the lyric as well.
            vexL.setFont(ll.fontInfo.family, ll.fontInfo.size,ll.fontInfo.weight);
            vexL.setYShift(y); // need this?
			vexL.setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
            vexNote.addAnnotation(0,vexL);
            const classString = 'lyric lyric-'+ll.verse;
            vexL.addClass(classString);
        });
    }

    _createGraceNotes(smoNote,vexNote) {
        var gar = smoNote.getGraceNotes();
        var toBeam = true;
        if (gar && gar.length) {
            var group = [];
            gar.forEach((g) => {
                var gr = new VF.GraceNote(g.toVexGraceNote());
                for (var i=0;i<g.pitches.length;++i) {
                    var pitch = g.pitches[i];
                    if (pitch.accidental != 'n' || pitch.cautionary)  {
                        var accidental = new VF.Accidental(pitch.accidental);
                        if (pitch.cautionary) {
                            accidental.setAsCautionary();
                        }
                        gr.addAccidental(i,accidental);
                    }
                }
                if (g.tickCount() > 4096) {
                    toBeam = false;
                }
                gr.addClass('grace-note'); // note: this doesn't work :(

                g.renderedId = gr.attrs.id;
                group.push(gr);
            });
            var grace = new VF.GraceNoteGroup(group);
            if (toBeam) {
                grace.beamNotes();
            }

            vexNote.addModifier(0,grace);
        }
    }

    // ## Description:
    // convert a smoNote into a vxNote so it can be rasterized
    _createVexNote(smoNote, tickIndex,voiceIx,x_shift) {
		// If this is a tuplet, we only get the duration so the appropriate stem
		// can be rendered.  Vex calculates the actual ticks later when the tuplet is made
		var duration =
		   smoNote.isTuplet ?
		     smoMusic.closestVexDuration(smoNote.tickCount) :
			 smoMusic.ticksToDuration[smoNote.tickCount];

		// transpose for instrument-specific keys
		var keys=smoMusic.smoPitchesToVexKeys(smoNote.pitches,this.smoMeasure.transposeIndex);
        var noteParams = {
            clef: smoNote.clef,
            keys: keys,
            duration: duration + smoNote.noteType
        };

        this.applyStemDirection(noteParams,voiceIx);
        var vexNote = new VF.StaveNote(noteParams);
        vexNote.attrs.classes = 'voice-'+voiceIx;
        if (smoNote.tickCount >= 4096) {
            var stemDirection = smoNote.flagState == SmoNote.flagStates.auto ?
                vexNote.getStemDirection() : smoNote.toVexStemDirection();
            vexNote.setStemDirection(stemDirection);

        }
        smoNote.renderId = 'vf-' + vexNote.attrs.id; // where does 'vf' come from?
        // vexNote.x_shift=x_shift;

		this._createAccidentals(smoNote,vexNote,tickIndex,voiceIx);
        this._createLyric(smoNote,vexNote,x_shift);
        this._createOrnaments(smoNote,vexNote);
        this._createGraceNotes(smoNote,vexNote);

        return vexNote;
    }

	_renderArticulations(vix) {
		var i=0;
		this.smoMeasure.voices[vix].notes.forEach((smoNote) => {
			smoNote.articulations.forEach((art) => {
				var vx = this.noteToVexMap[smoNote.attrs.id];
				var position = SmoArticulation.positionToVex[art.position];
				var vexArt = SmoArticulation.articulationToVex[art.articulation];
				var vxArt=new VF.Articulation(vexArt).setPosition(position);
				vx.addArticulation(i,vxArt);
			});
		});
	}

	_renderNoteGlyph(smoNote,textObj) {
		var x = this.noteToVexMap[smoNote.attrs.id].getAbsoluteX();
		// the -3 is copied from vexflow textDynamics
		var y=this.stave.getYForLine(textObj.yOffsetLine-3) + textObj.yOffsetPixels;
		var group = this.context.openGroup();
        group.classList.add(textObj.attrs.id+'-'+smoNote.attrs.id);
		group.classList.add(textObj.attrs.id);
		textObj.text.split('').forEach((ch)=> {
			const glyphCode = VF.TextDynamics.GLYPHS[ch];
			const glyph=new Vex.Flow.Glyph(glyphCode.code, textObj.fontSize);
			glyph.render(this.context, x, y);
			x += VF.TextDynamics.GLYPHS[ch].width;
		});
		textObj.renderedBox = svgHelpers.smoBox(group.getBoundingClientRect());
		this.context.closeGroup();
	}

	renderDynamics(vix) {
		this.smoMeasure.voices.forEach((voice) => {

            voice.notes.forEach((smoNote) => {
    			var mods = smoNote.textModifiers.filter((mod) => {
    				return mod.attrs.type === 'SmoDynamicText';
    			});
    			mods.forEach((tm) => {
    				this._renderNoteGlyph(smoNote,tm);
    			});
            });
		});
	}


    // ## Description:
    // create an a array of VF.StaveNote objects to render the active voice.
    createVexNotes(voiceIx,active) {
        this.vexNotes = [];
        this.noteToVexMap = {};
        var voice =  this.smoMeasure.voices[voiceIx];
        var shiftIndex = 0;
        for (var i = 0;
            i < voice.notes.length; ++i) {
            var smoNote = voice.notes[i];
            // This is a bit of a hack.  Lyrics cause vex to bunch up notes
            // at the end of a measure, this resists that.
            if (smoNote.getLyricForVerse(0).length) {
                var lyric = smoNote.getLyricForVerse(0)[0];
                if (lyric.text.trim().length) {
                    shiftIndex -= 1;
                }
            }
            this.lyricShift += shiftIndex;
            var vexNote = this._createVexNote(smoNote, i,voiceIx,shiftIndex);
            this.noteToVexMap[smoNote.attrs.id] = vexNote;
            this.vexNotes.push(vexNote);
        }
		this._renderArticulations(voiceIx);
    }

    // ### createVexBeamGroups
    // create the VX beam groups. VexFlow has auto-beaming logic, but we use
	// our own because the user can specify stem directions, breaks etc.
    createVexBeamGroups(vix) {
        for (var i = 0; i < this.smoMeasure.beamGroups.length; ++i) {
            var bg = this.smoMeasure.beamGroups[i];
            if (bg.voice != vix) {
                continue;
            }
            var vexNotes = [];
            var stemDirection = VF.Stem.DOWN;
            for (var j = 0;j < bg.notes.length; ++j) {
                var note = bg.notes[j];
                var vexNote = this.noteToVexMap[note.attrs.id]
                    if (j === 0) {
                        stemDirection = note.flagState == SmoNote.flagStates.auto ?
                            vexNote.getStemDirection() : note.toVexStemDirection();
                    }
                    vexNote.setStemDirection(stemDirection);

                    vexNotes.push(this.noteToVexMap[note.attrs.id]);
            }
            var vexBeam = new VF.Beam(vexNotes);
            this.beamToVexMap[bg.attrs.id] = vexBeam;
            this.vexBeamGroups.push(vexBeam);
        }
    }

    // ### createVexTuplets
    // Create the VF tuplet objects based on the smo tuplet objects
    // that have been defined.
    createVexTuplets(vix) {
        this.vexTuplets = [];
        this.tupletToVexMap = {};
        for (var i = 0; i < this.smoMeasure.tuplets.length; ++i) {
            var tp = this.smoMeasure.tuplets[i];
            if (tp.voice != vix) {
                continue;
            }
            var vexNotes = [];
            for (var j = 0; j < tp.notes.length; ++j) {
                var smoNote = tp.notes[j];
                vexNotes.push(this.noteToVexMap[smoNote.attrs.id]);
            }
            var vexTuplet = new VF.Tuplet(vexNotes, {
                    num_notes: tp.num_notes,
                    notes_occupied: tp.notes_occupied,
                    ratioed: false,
                    bracketed: true,
                    location: 1
                });
            this.tupletToVexMap[tp.attrs.id] = vexTuplet;
            this.vexTuplets.push(vexTuplet);
        }
    }
    unrender() {
        $(this.context.svg).find('g.' + this.smoMeasure.attrs.id).remove();
    }

	handleMeasureModifiers() {
		var sb = this.smoMeasure.getStartBarline();
		var eb = this.smoMeasure.getEndBarline();
		var sym = this.smoMeasure.getRepeatSymbol();

        // don't create a begin bar for any but the 1st measure.
		if (this.smoMeasure.measureNumber.systemIndex != 0 && sb.barline === SmoBarline.barlines.singleBar
             && this.smoMeasure.padLeft === 0) {
		    this.stave.setBegBarType(VF.Barline.type.NONE);
		} else {
			this.stave.setBegBarType(sb.toVexBarline());
		}
		if (eb.barline != SmoBarline.barlines.singleBar) {
			this.stave.setEndBarType(eb.toVexBarline());
		}
		if (sym && sym.symbol != SmoRepeatSymbol.symbols.None) {
			var rep = new VF.Repetition(sym.toVexSymbol(),sym.xOffset+this.smoMeasure.staffX,sym.yOffset);
			this.stave.modifiers.push(rep);
		}
		var tms = this.smoMeasure.getMeasureText();
		// TODO: set font
		tms.forEach((tm) => {
			/* var vm = new VF.StaveText(tm.text,tm.toVexPosition(),{
				shift_x:tm.adjustX,shift_y:tm.adjustY,justification:tm.toVexJustification()
			});
			vm.setFont(tm.fontInfo);   */
            var offset = tm.position === SmoMeasureText.positions.left ? this.smoMeasure.padLeft : 0;
			this.stave.setText(
			    tm.text,tm.toVexPosition(),{
				shift_x:tm.adjustX + offset,shift_y:tm.adjustY,justification:tm.toVexJustification()
			});
			// hack - we can't create staveText directly so this is the only way I could set the font
			var ar = this.stave.getModifiers();
			var vm=ar[ar.length - 1];
			vm.setFont(tm.fontInfo);

		});

        var rm = this.smoMeasure.getRehearsalMark();
        if (rm) {
            this.stave.setSection(rm.symbol,0);
        }

        var tempo = this.smoMeasure.getTempo();
        if (tempo && this.smoMeasure.forceTempo) {
            this.stave.setTempo(tempo.toVexTempo(),tempo.yOffset);
        }

	}

    _setModifierBoxes() {
        this.smoMeasure.voices.forEach((voice) => {
			voice.notes.forEach((smoNote) =>  {
                var el = this.context.svg.getElementById(smoNote.renderId);
				svgHelpers.updateArtifactBox(this.context.svg,el,smoNote);

                // TODO: fix this, only works on the first line.
                smoNote.getModifiers('SmoLyric').forEach((lyric) => {
                    var ar = Array.from(el.getElementsByClassName('vf-lyric'));
                    ar.forEach((lbox) => {
                        svgHelpers.updateArtifactBox(this.context.svg,lbox,lyric);
                    });
                });
                smoNote.graceNotes.forEach((g) => {
                    var gel = this.context.svg.getElementById('vf-'+g.renderedId);
                    $(gel).addClass('grace-note');
                    svgHelpers.updateArtifactBox(this.context.svg,gel,g);
                });
            });
        });
    }

    // ### _updateLyricXOffsets
    // We update lyric positions twice.  Update the x position when the measure is rendered
    // so the selectable bounding box has the correct width, then the y when the whole line has been
    // rendered and we can align the lyrics.
     _updateLyricXOffsets() {
         this.smoMeasure.voices.forEach((vv) => {
             vv.notes.forEach((nn) => {
                 nn.getModifiers('SmoLyric').forEach((lyric) => {
                     lyric.selector='#'+nn.renderId+' g.lyric-'+lyric.verse;

                     var dom = $(this.context.svg).find(lyric.selector).closest('g.vf-modifiers')[0];
                     if (dom) {
                         // dom.setAttributeNS('','transform','translate('+lyric.adjX+' '+lyric.adjY+')');
                     }
                 });
             });
         });
     }

    // ## Description:
    // Render all the notes in my smoMeasure.  All rendering logic is called from here.
    render() {
        $(this.context.svg).find('g.' + this.smoMeasure.getClassId()).remove();

        var group = this.context.openGroup();
        var mmClass = this.smoMeasure.getClassId();
        group.classList.add(this.smoMeasure.attrs.id);
        group.classList.add(mmClass);
		group.id=this.smoMeasure.attrs.id;

		var key = smoMusic.vexKeySignatureTranspose(this.smoMeasure.keySignature,this.smoMeasure.transposeIndex);
		var canceledKey = this.smoMeasure.canceledKeySignature ? smoMusic.vexKeySignatureTranspose(this.smoMeasure.canceledKeySignature,this.smoMeasure.transposeIndex)
		   : this.smoMeasure.canceledKeySignature;

        var staffX = this.smoMeasure.staffX + this.smoMeasure.padLeft;

        this.stave = new VF.Stave(staffX, this.smoMeasure.staffY , this.smoMeasure.staffWidth - (1+this.smoMeasure.padLeft));
        if (this.smoMeasure.prevFrame < VxMeasure.fps) {
            this.smoMeasure.prevFrame += 1;
        }

        // If there is padLeft, draw an invisible box so the padding is included in the measure box
        if (this.smoMeasure.padLeft) {
            this.context.rect(this.smoMeasure.staffX,this.smoMeasure.staffY,this.smoMeasure.padLeft,50, {
                fill:'none','stroke-width':1,stroke:'white'
            });
        }

		this.stave.options.space_above_staff_ln=0; // don't let vex place the staff, we want to.
        //console.log('adjX is '+this.smoMeasure.adjX);

        // Add a clef and time signature.
        if (this.smoMeasure.forceClef) {
            this.stave.addClef(this.smoMeasure.clef);
        }
        if (this.smoMeasure.forceKeySignature) {
			var sig = new VF.KeySignature(key);
			if (this.smoMeasure.canceledKeySignature) {
				sig.cancelKey(canceledKey);
			}
            sig.addToStave(this.stave);
        }
        if (this.smoMeasure.forceTimeSignature) {
            this.stave.addTimeSignature(this.smoMeasure.timeSignature);
        }
        // Connect it to the rendering context and draw!
        this.stave.setContext(this.context);

		this.handleMeasureModifiers();
		this.stave.draw();

        this.tickmapObject = this.smoMeasure.createMeasureTickmaps();

        var voiceAr = [];

        // If there are multiple voices, add them all to the formatter at the same time so they don't collide
        for (var j = 0; j < this.smoMeasure.voices.length; ++j) {

            this.createVexNotes(j,this.smoMeasure.getActiveVoice());
            this.createVexTuplets(j);
            this.createVexBeamGroups(j);

            // Create a voice in 4/4 and add above notes
            var voice = new VF.Voice({
                    num_beats: this.smoMeasure.numBeats,
                    beat_value: this.smoMeasure.beatValue
                }).setMode(Vex.Flow.Voice.Mode.SOFT);
            voice.addTickables(this.vexNotes);
            voiceAr.push(voice);
        }

		// Need to format for x position, then set y position before drawing dynamics.
        this.formatter = new VF.Formatter().joinVoices(voiceAr).format(voiceAr, this.smoMeasure.staffWidth-
		    (this.smoMeasure.adjX + this.smoMeasure.adjRight + this.smoMeasure.padLeft)+this.lyricShift);

        for (var j = 0; j < voiceAr.length; ++j) {
            voiceAr[j].draw(this.context, this.stave);
        }

        var self = this;
        this.vexBeamGroups.forEach(function (b) {
            b.setContext(self.context).draw();
        });

        this.vexTuplets.forEach(function (tuplet) {
            tuplet.setContext(self.context).draw();
        });
		this.renderDynamics();
        this._updateLyricXOffsets();
        this._setModifierBoxes();
		// this.smoMeasure.adjX = this.stave.start_x - (this.smoMeasure.staffX);

        this.context.closeGroup();
        var box = svgHelpers.smoBox(group.getBoundingClientRect());
		var lbox = svgHelpers.smoBox(group.getBBox());
        this.smoMeasure.renderedBox = box;
		this.smoMeasure.setBox(lbox,'vxMeasure bounding box');
        this.smoMeasure.changed = false;
    }
}
;// ## Description:
//   Create a system of staves and draw music on it.
//
// ##  Options:
//  clef:'treble',
//  num_beats:num_beats,
//  timeSignature: '4/4',
//  smoMeasures: []
class VxSystem {
	constructor(context, topY, lineIndex,score) {
		this.context = context;
		this.leftConnector = [null, null];
		this.lineIndex = lineIndex;
        this.score = score;
		this.maxStaffIndex = -1;
		this.maxSystemIndex = -1;
		this.width = -1;
		this.smoMeasures = [];
		this.vxMeasures = [];
		this.endcaps = [];
		this.endings = [];
		this.box = {
			x: -1,
			y: -1,
			width: 0,
			height: 0
		};
		this.currentY = 0;
		this.topY = topY;
		this.clefWidth = 70;
		this.ys = [];
		this.measures = [];
		this.modifiers = [];
	}

	getVxMeasure(smoMeasure) {
		for (var i = 0; i < this.vxMeasures.length; ++i) {
			var vm = this.vxMeasures[i];
			if (vm.smoMeasure.attrs.id === smoMeasure.attrs.id) {
				return vm;
			}
		}

		return null;
	}

	getVxNote(smoNote) {
		var note;
		if (!smoNote) {
			return null;
		}
		for (var i = 0; i < this.measures.length; ++i) {
			var mm = this.measures[i];
			if (mm.noteToVexMap[smoNote.attrs.id]) {
				return mm.noteToVexMap[smoNote.attrs.id];
			}
		}
		return null;
	}

	updateLyricOffsets() {
        for (var i = 0;i < this.score.staves.length;++i) {
            var lowestYs = {};
    		var lyrics=[];
            var vxMeasures = this.vxMeasures.filter((vx) => {
                return vx.smoMeasure.measureNumber.staffId == i;
            });
            vxMeasures.forEach((mm) => {
                var smoMeasure = mm.smoMeasure;
                smoMeasure.voices.forEach((voice) => {
                    voice.notes.forEach((note) => {
                        note.getModifiers('SmoLyric').forEach((lyric) => {
                            var lowest = (lyric.logicalBox.y+lyric.logicalBox.height);
                            if (!lowestYs[lyric.verse]) {
                                lowestYs[lyric.verse] = lowest;
                            } else {
                                lowestYs[lyric.verse] = lowestYs[lyric.verse] < lowest ? lowest : lowestYs[lyric.verse];
                            }
                            lyrics.push(lyric);
                        });
                    });
                });
            });
            lyrics.forEach((lyric) => {
    			lyric.adjY = lowestYs[lyric.verse] - (lyric.logicalBox.y + lyric.logicalBox.height);
    			var dom = $(this.context.svg).find(lyric.selector)[0];
    			dom.setAttributeNS('','transform','translate('+lyric.adjX+' '+lyric.adjY+')');
    		});
        }
	}

     // ### renderModifier
     // render a line-type modifier that is associated with a staff (e.g. slur)
	renderModifier(modifier, vxStart, vxEnd,smoStart,smoEnd) {
		// if it is split between lines, render one artifact for each line, with a common class for
		// both if it is removed.
		if (vxStart) {
		    $(this.context.svg).find('g.' +  modifier.attrs.id).remove();
        }
        var artifactId = modifier.attrs.id + '-' + this.lineIndex;
		var group = this.context.openGroup();
        var xtranslate = 0;
        var ytranslate = 0;
		group.classList.add(modifier.attrs.id);
		group.classList.add(artifactId);
		if ((modifier.ctor == 'SmoStaffHairpin' && modifier.hairpinType == SmoStaffHairpin.types.CRESCENDO) ||
			(modifier.ctor == 'SmoStaffHairpin' && modifier.hairpinType == SmoStaffHairpin.types.DECRESCENDO)) {
			var hairpin = new VF.StaveHairpin({
					first_note: vxStart,
					last_note: vxEnd
				}, modifier.hairpinType);
			hairpin.setRenderOptions({
				height: modifier.height,
				y_shift: modifier.yOffset,
				left_shift_px: modifier.xOffsetLeft,
				right_shift_px: modifier.xOffsetRight
			});
			hairpin.setContext(this.context).setPosition(modifier.position).draw();
		} else if (modifier.ctor == 'SmoSlur') {
            var lyric = smoStart.note.longestLyric();
            var xoffset = 0;
            if (lyric) {
                // If there is a lyric, the bounding box of the start note is stretched to the right.
                // slide the slur left, and also make it a bit wider.
                xtranslate = (-1*lyric.text.length * 6);
                xoffset += (xtranslate/2) - SmoSlur.defaults.xOffset;
            }
			var curve = new VF.Curve(
					vxStart, vxEnd, //first_indices:[0],last_indices:[0]});
				{
					thickness: modifier.thickness,
					x_shift: modifier.xOffset,
					y_shift: modifier.yOffset,
                    spacing:modifier.spacing,
					cps: modifier.controlPoints,
					invert: modifier.invert,
					position: modifier.position
				});
            curve.setContext(this.context).draw();


/*
            var curve = new VF.StaveTie({
                first_note:vxStart,
                last_note:vxEnd,
                first_indices:[0],
                last_indices:[0],
                tie_spacing:modifier.spacing
            });
curve.setContext(this.context).draw();
*/
		}

		this.context.closeGroup();
        if (xoffset) {
            var slurBox = $('.'+artifactId)[0];
            svgHelpers.translateElement(slurBox,xoffset,0);
        }
		return svgHelpers.smoBox(group.getBoundingClientRect());
	}

	renderEndings() {
		this.smoMeasures.forEach((smoMeasure) => {
			var staffId = smoMeasure.measureNumber.staffId;
			var endings = smoMeasure.getNthEndings();
			endings.forEach((ending) => {
				$(this.context.svg).find('g.' + ending.attrs.id).remove();
				var group = this.context.openGroup(null,ending.attrs.id);
				var voAr=[];
				group.classList.add(ending.attrs.id);
				group.classList.add(ending.endingId);

				for (var i = ending.startBar; i <= ending.endBar; ++i) {
					var endMeasure = this.getMeasureByIndex(i,staffId);
					if (!endMeasure) {
						continue;
					}
					voAr.push(endMeasure);
					var vxMeasure = this.getVxMeasure(endMeasure);
					var vtype = ending.toVexVolta(endMeasure.measureNumber.measureNumber);
					var vxVolta = new VF.Volta(vtype, ending.number,ending.xOffsetStart, ending.yOffset);
					vxMeasure.stave.modifiers.push(vxVolta);
					vxVolta.setContext(this.context).draw(vxMeasure.stave, endMeasure.staffX);
				}
				this.context.closeGroup();
				ending.renderedBox = svgHelpers.smoBox(group.getBoundingClientRect());
				ending.logicalBox = svgHelpers.clientToLogical(this.context.svg, ending.renderedBox);

				// Adjust real height of measure to match volta height
				voAr.forEach((mm) => {
					var delta =  mm.logicalBox.y - ending.logicalBox.y;
					if (delta > 0) {
						mm.setBox(svgHelpers.boxPoints(
                            mm.logicalBox.x,mm.logicalBox.y - delta,mm.logicalBox.width,mm.logicalBox.height+delta),
                            'vxSystem adjust for volta');
					}
				});
			});
		});
	}

	getMeasureByIndex(measureIndex,staffId) {
		for (var i = 0; i < this.smoMeasures.length; ++i) {
			var mm = this.smoMeasures[i];
			if (measureIndex === mm.measureNumber.measureNumber && staffId === mm.measureNumber.staffId) {
				return mm;
			}
		}
		return null;
	}

	// ## renderMeasure
	// ## Description:
	// Create the graphical (VX) notes and render them on svg.  Also render the tuplets and beam
	// groups
	renderMeasure(staffIndex, smoMeasure) {
		var systemIndex = smoMeasure.measureNumber.systemIndex;
		this.smoMeasures.push(smoMeasure);

		var vxMeasure = new VxMeasure(this.context, {
				smoMeasure: smoMeasure
			});

		vxMeasure.render();
		this.vxMeasures.push(vxMeasure);

		// Keep track of the y coordinate for the nth staff


		// keep track of left-hand side for system connectors
		if (systemIndex === 0) {
			if (staffIndex === 0) {
				this.leftConnector[0] = vxMeasure.stave;
			} else if (staffIndex > this.maxStaffIndex) {
				this.maxStaffIndex = staffIndex;
				this.leftConnector[1] = vxMeasure.stave;
			}
		} else if (smoMeasure.measureNumber.systemIndex > this.maxSystemIndex) {
			this.endcaps = [];
			this.endcaps.push(vxMeasure.stave);
			this.maxSystemIndex = smoMeasure.measureNumber.systemIndex;
		} else if (smoMeasure.measureNumber.systemIndex === this.maxSystemIndex) {
			this.endcaps.push(vxMeasure.stave);
		}
		this.measures.push(vxMeasure);
		// this._adjustBox(vxMeasure.renderedSize);
	}

	// ## cap
	// ## Description:
	// draw the system brackets.  I don't know why I call them a cap.
	cap() {
		$(this.context.svg).find('g.lineBracket-' + this.lineIndex).remove();
		var group = this.context.openGroup();
		group.classList.add('lineBracket-' + this.lineIndex);
		group.classList.add('lineBracket');
		if (this.leftConnector[0] && this.leftConnector[1]) {
			var c1 = new VF.StaveConnector(this.leftConnector[0], this.leftConnector[1])
				.setType(VF.StaveConnector.type.BRACKET);
			var c2 = new VF.StaveConnector(this.leftConnector[0], this.leftConnector[1])
				.setType(VF.StaveConnector.type.SINGLE);
			c1.setContext(this.context).draw();
			c2.setContext(this.context).draw();
		}
		this.context.closeGroup();
	}
}
;
var AudioContext = window.AudioContext || window.webkitAudioContext;

// ## suiAudioPitch
// helper class to compute the frequencies of the notes.
class suiAudioPitch {
    // ### _frequencies
    // Compute the equal-temperment frequencies of the notes.
    static get _frequencies() {
        var map={};
        var letter='a';
        const octaves=[1,2,3,4,5,6,7];
        const letters = ["cn","c#", "dn", "d#","en", "fn", "f#","gn","g#","an", "a#","bn"];
        const lindex = [0,1,2,3,4,5,6];

        const just = Math.pow(2,(1.0/12));
        const baseFrequency=(440/16) * Math.pow(just,3);

        var aaccum = baseFrequency;

        octaves.forEach((octave) => {
            var oint = parseInt(octave);
            var base = baseFrequency*Math.pow(2,oint);
            var lix = 0;
            letters.forEach((letter) => {
                var freq = base*Math.pow(just,lix);
                var enharmonics = smoMusic.getEnharmonics(letter);
                enharmonics.forEach((en) => {
                    map[en+octave.toString()] = freq;
                });
                lix += 1;
            });
        });

        return map;
    }

    static get pitchFrequencyMap() {
        suiAudioPitch._pmMap = typeof(suiAudioPitch['_pmMap']) == 'undefined' ? suiAudioPitch._frequencies : suiAudioPitch._pmMap;
        return suiAudioPitch._pmMap;
    }

    static _rawPitchToFrequency(smoPitch) {
        var vx = smoPitch.letter.toLowerCase() + smoPitch.accidental + smoPitch.octave.toString();
        return suiAudioPitch.pitchFrequencyMap[vx];
    }

    static smoPitchToFrequency(smoNote,smoPitch,ix) {

        var rv = suiAudioPitch._rawPitchToFrequency(smoPitch);
        var mt = smoNote.tones.filter((tt) => tt.pitch == ix);
        if (mt.length) {
            var tone = mt[0];
            var coeff = tone.toPitchCoeff;
            var pitchInt = smoMusic.smoPitchToInt(smoPitch);
            pitchInt += (coeff > 0) ? 1 : -1;
            var otherSmo = smoMusic.smoIntToPitch(pitchInt);
            var otherPitch = suiAudioPitch._rawPitchToFrequency(otherSmo);
            rv += Math.abs(rv - otherPitch)*coeff;
        }
        return rv;
    }
}


class suiReverb {
    static get defaults() {
        return {length:0.5,
        decay:2.0 };
    }

    connect(destination) {
        this.output.connect(destination);
    }

    disconnect() {
        this.output.disconnect();
    }


    // credit: https://github.com/nick-thompson
    _buildImpulse() {
        if (suiReverb['impulse']) {
            this.input.buffer = suiReverb['impulse'];
            return;
        }

         var rate = this._context.sampleRate
           , length = rate * this.length
           , decay = this.decay
           , impulse = this._context.createBuffer(2, length, rate)
           , impulseL = impulse.getChannelData(0)
           , impulseR = impulse.getChannelData(1)
           , n, i;

         for (i = 0; i < length; i++) {
           n = this.reverse ? length - i : i;
           impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
           impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
         }
         suiReverb['impulse'] = impulse;

         this.input.buffer = impulse;
    }

    constructor(context) {
        this.input = this.output = context.createConvolver();
        this.length = suiReverb.defaults.length;
        this.decay = suiReverb.defaults.decay;
        this._context = context;
        this._buildImpulse();
    }
}
class suiOscillator {
    static get defaults() {

        var obj = {
            duration:1000,
            frequency:440,
            attackEnv:0.05,
            decayEnv:0.4,
            sustainEnv:0.65,
            releaseEnv:0.1,
            sustainLevel:0.4,
            releaseLevel:0.1,
            waveform:'triangle',
            gain:0.3
        };

        var wavetable = {
            real:[0,
                0.3,0,0,0,0,
                0.1,0,0,0,0,
                0.05,0,0,0,0,
                0.01,0,0,0,0,
                0.01,0,0,0,0,
                0,0,0,0,0,
                0,0],
            imaginary:[0,
                0,0,0,0,0,
                0,0.01,0,0,0,
                0,0,0,0,0,
                0,0,0,0,0,
                0,0,0,0,0,
                0,0,0,0,0,
                0,0]
        }
        obj.wavetable = wavetable;
        return obj;
    }

    static playSelectionNow(selection,gain) {
        // In the midst of re-rendering...
        if (!selection.note) {
            return;
        }
        setTimeout(function() {
        var ar = suiOscillator.fromNote(selection.measure,selection.note,true,gain);
        ar.forEach((osc) => {
            osc.play();
        });
        },1);
    }

    // AR contains an array of arrays of oscillators.
    // The outer array contains an array for each tick/note in a measure.
    // the inner array contains an oscillator for each note in the chord.
    static playOscillatorArray(ar) {
        function playIx(ix,oscAr) {
            var par = [];
            oscAr.forEach((osc) => {
                par.push(osc.play());
            });
            ix += 1;
            Promise.all(par).then(() => {
                if (ix < ar.length) {
                    playIx(ix,ar[ix]);
                }
            });
        }
        playIx(0,ar[0]);
    }

    static fromNote(measure,note,isSample,gain) {
        var tempo = measure.getTempo();
        tempo = tempo ? tempo : new SmoTempoText();
        var bpm = tempo.bpm;
        var beats = note.tickCount/4096;
        var duration = (beats / bpm) * 60000;

        // adjust if bpm is over something other than 1/4 note
        duration = duration * (4096/tempo.beatDuration);
        if (isSample)
            duration = 250;


        var ar = [];
        gain = gain ? gain : 0.5;
        gain = gain/note.pitches.length
        if (note.noteType == 'r') {
            gain = 0.001;
        }
        var i = 0;
        note.pitches.forEach((pitch) => {
            var frequency = suiAudioPitch.smoPitchToFrequency(note,pitch,i);
            var osc = new suiOscillator({frequency:frequency,duration:duration,gain:gain});
            ar.push(osc);
            i += 1;
        });

        return ar;
    }

    static get attributes() {
        return ['duration','frequency','pitch','attackEnv','sustainEnv','decayEnv','releaseEnv','sustainLevel','releaseLevel','waveform','wavetable','gain'];
    }

    static get audio() {
        if (typeof (suiOscillator['_audio']) == 'undefined') {
            suiOscillator._audio = new AudioContext();
        }
        return suiOscillator._audio;
    }

    _playPromise(osc,duration,gain) {
        var audio = suiOscillator.audio;
        var promise = new Promise((resolve) => {
            osc.start(0);

            setTimeout(function() {
               // gain.gain.setTargetAtTime(0, audio.currentTime, 0.015);
                resolve();
            }, duration);


            setTimeout(function() {
               // gain.gain.setTargetAtTime(0, audio.currentTime, 0.015);
                osc.stop(0);
                osc.disconnect(gain);
                gain.disconnect(audio.destination);
            }, duration+500);
        });

        return promise;
    }

    static toFloatArray(ar) {
        var rv = new Float32Array(ar.length);
        for (var i=0;i<ar.length;++i) {
            rv[i] = ar[i];
        }

        return rv;
    }

    play() {

        var audio = suiOscillator.audio;
        var gain = audio.createGain();
        var osc = audio.createOscillator();

        gain.connect(this.reverb.input);
        this.reverb.connect(audio.destination);
        gain.gain.setValueAtTime(0.01, audio.currentTime);
        var attack = this.attack / 1000;
        var decay = this.decay/1000;
        var sustain = this.sustain/1000;
        var release = this.release/1000;
        gain.gain.exponentialRampToValueAtTime(this.gain, audio.currentTime + attack);
        gain.gain.exponentialRampToValueAtTime(this.sustainLevel*this.gain, audio.currentTime + attack + decay);
        gain.gain.exponentialRampToValueAtTime(this.releaseLevel*this.gain,audio.currentTime + attack + decay + sustain );
        gain.gain.exponentialRampToValueAtTime(0.001,audio.currentTime + attack + decay + sustain + release);
        if (this.waveform != 'custom') {
            osc.type = this.waveform;
        } else {
            var wave = audio.createPeriodicWave(suiOscillator.toFloatArray(this.wavetable.real), suiOscillator.toFloatArray(this.wavetable.imaginary),
               {disableNormalization: false});
            osc.setPeriodicWave(wave);
        }
        osc.frequency.value = this.frequency;
        osc.connect(gain);
        gain.connect(audio.destination);
        return this._playPromise(osc,this.duration,gain);
    }


    constructor(parameters) {
        parameters = parameters ? parameters : {};
		smoSerialize.serializedMerge(suiOscillator.attributes, suiOscillator.defaults, this);
		smoSerialize.serializedMerge(suiOscillator.attributes, parameters, this);
        this.reverb = new suiReverb(suiOscillator.audio);
        this.attack = this.attackEnv*this.duration;
        this.decay = this.decayEnv*this.duration;
        this.sustain = this.sustainEnv*this.duration;
        this.release = this.releaseEnv*this.duration;
        this.frequency = this.frequency/2;  // Overtones below partial

        // Note: having some trouble with FloatArray and wavetable on some browsers, so I'm not using it
        // use built-in instead
        if (parameters.waveform && parameters.waveform != 'custom') {
            this.waveform = parameters.waveform;
        } else {
            this.waveform='custom';
        }
    }
}
;

// ## suiAudioPlayer
// Play the music, ja!
class suiAudioPlayer {

    static set playing(val) {
        suiAudioPlayer._playing = val;
    }

    static get instanceId() {
        if (typeof(suiAudioPlayer._instanceId) == 'undefined') {
            suiAudioPlayer._instanceId = 0;
        }
        return suiAudioPlayer._instanceId;
    }
    static incrementInstanceId() {
        var id = suiAudioPlayer.instanceId + 1;
        suiAudioPlayer._instanceId = id;
        return id;
    }
    static get playing() {
        if (typeof(suiAudioPlayer._playing) == 'undefined') {
            suiAudioPlayer._playing = false;
        }
        return suiAudioPlayer._playing;
    }

    static pausePlayer() {
        if (suiAudioPlayer._playingInstance) {
            var a = suiAudioPlayer._playingInstance;
            a.paused = true;
        }
        suiAudioPlayer.playing = false;
    }
    static stopPlayer() {
        if (suiAudioPlayer._playingInstance) {
            var a = suiAudioPlayer._playingInstance;
            a.paused = false;
        }
        suiAudioPlayer.playing = false;
    }

    static get playingInstance() {
        if (!suiAudioPlayer._playingInstance) {
            return null;
        }
        return suiAudioPlayer._playingInstance;
    }

    // the oscAr contains an oscillator for each pitch in the chord.
    // each inner oscillator is a promise, the combined promise is resolved when all
    // the beats have completed.
    static _playChord(oscAr) {
        var par = [];
        oscAr.forEach((osc) => {
            par.push(osc.play());
        });

        return Promise.all(par);
    }

    _createOscillatorsFromMusicData(ar) {
        var rv = [];
        ar.forEach((soundData) => {
            var osc = new suiOscillator({frequency:soundData.frequency,duration:soundData.duration,gain:soundData.gain});
            rv.push(osc);
        });
        return rv;
    }
    _playArrayRecurse(ix,keys,notesToPlay) {
        if (!suiAudioPlayer.playing ||
          suiAudioPlayer.instanceId != this.instanceId) {
               this.tracker.clearMusicCursor();
              return;
          }
        var self = this;
        var key = keys[ix];
        var curTime = parseInt(key);
        var proto = notesToPlay[key];
        var oscs = this._createOscillatorsFromMusicData(proto);

        // Follow the top-staff note in this tick for the cursor
        if (proto[0].selector.staff == 0) {
            this.tracker.musicCursor(proto[0].selector);
        }
        if (ix < keys.length - 1) {
            var diff = parseInt(keys[ix+1]);
            var delay = (diff - curTime);
            setTimeout(function() {
                self._playArrayRecurse(ix+1,keys,notesToPlay);
            },delay);
        } else {
            self.tracker.clearMusicCursor();
        }
        suiAudioPlayer._playChord(oscs);
    }
    _playPlayArray() {
        var startTimes = Object.keys(this.sounds).sort((a,b) => {return parseInt(a) > parseInt(b);});
        this._playArrayRecurse(0,startTimes,this.sounds);
    }
    _populatePlayArray() {
        var maxGain = 0.5/this.score.staves.length;
        this.sounds = {};
        this.score.staves.forEach((staff)  => {
            var accumulator = 0;
            var slurs = [];
            for (var i = this.startIndex;i<staff.measures.length;++i) {
                var measure=staff.measures[i];
                var oldAccumulator = accumulator;
                var voiceIx = 0;
                measure.voices.forEach((voice) => {
                    var prevObj = null;
                    if (voiceIx != 0) {
                        accumulator = oldAccumulator;
                    }
                    var tick = 0;
                    voice.notes.forEach((note) => {
                        var tempo = measure.getTempo();
                        tempo = tempo ? tempo : new SmoTempoText();
                        var bpm = tempo.bpm;
                        var beats = note.tickCount/4096;
                        var duration = (beats / bpm) * 60000;

                        // adjust if bpm is over something other than 1/4 note
                        duration = duration * (4096/tempo.beatDuration);
                        var selector = {staff:measure.measureNumber.staffId,measure:measure.measureNumber.measureIndex,voice:voiceIx,tick:tick}

                        var gain = maxGain/note.pitches.length;
                        if (note.noteType == 'n') {
                            var pitchIx = 0;
                            note.pitches.forEach((pitch) => {
                                var frequency = suiAudioPitch.smoPitchToFrequency(note,pitch,pitchIx);
                                var obj = {
                                    duration:duration,
                                    frequency: frequency,
                                    gain:gain,
                                    selector:selector,
                                    note:note,
                                    measure:measure,
                                    staff:staff
                                };
                                // Keep track of slurs, don't restart the note it is
                                // really a tie.  TODO:  deal with 1:1, 1:many etc.
                                staff.getSlursStartingAt(selector).forEach((slur) => {
                                    slurs.push({
                                        obj:obj,
                                        slur:slur
                                    });
                                });

                                var pitchTie = slurs.filter((slur) => {
                                    return (SmoSelector.sameNote(slur.slur.endSelector,selector) && slur.obj.frequency == frequency);
                                });
                                if (pitchTie.length) {
                                    pitchTie[0].duration += obj.duration;
                                } else {
                                    if (this.sounds[accumulator]) {
                                        this.sounds[accumulator].push(obj);
                                    } else {
                                        this.sounds[accumulator]=[obj];
                                    }
                                }
                                pitchIx += 1;
                            });
                        }
                        accumulator += Math.round(duration);
                        tick += 1;
                    });
                    voiceIx += 1;
                });
            }
        });
    }

    play() {
        if (suiAudioPlayer.playing) {
            return;
        }
        suiAudioPlayer._playingInstance = this;
        this._populatePlayArray();
        suiAudioPlayer.playing = true;
        this._playPlayArray();
    }

    constructor(parameters) {
        this.instanceId = suiAudioPlayer.incrementInstanceId();
        suiAudioPlayer.playing=false;
        this.paused = false;
        this.startIndex = parameters.startIndex;
        this.playIndex = 0;
        this.tracker = parameters.tracker;
        this.score = parameters.score;
        this._populatePlayArray();
    }
}
;

// ## suiScroller
// Respond to scroll events, and handle the scroll of the viewport
//
// ### class methods:
// ---
class suiScroller  {
	constructor(layout) {

        this._scroll = {x:0,y:0};
        this._scrollInitial = {x:0,y:0};
	    var scroller = $('.musicRelief');
	    this._offsetInitial = {x:$(scroller).offset().left,y:$(scroller).offset().top};

        this.viewport = svgHelpers.boxPoints(
          $('.musicRelief').offset().left,
          $('.musicRelief').offset().top,
          $('.musicRelief').width(),
          $('.musicRelief').height());
	}

    // ### setScrollInitial
    // tracker is going to remap the music, make sure we take the current scroll into account.
    setScrollInitial() {
        var scroller = $('.musicRelief');
        this._scrollInitial = {x:$(scroller)[0].scrollLeft,y:$(scroller)[0].scrollTop};
        this._offsetInitial = {x:$(scroller).offset().left,y:$(scroller).offset().top};
    }

    // ### handleScroll
    // handle scroll events.
    handleScroll(x,y) {
        this._scroll = {x:x,y:y};
        this.viewport = svgHelpers.boxPoints(
          $('.musicRelief').offset().left,
          $('.musicRelief').offset().top,
          $('.musicRelief').width(),
          $('.musicRelief').height());
    }

    scrollAbsolute(x,y) {
        $('.musicRelief')[0].scrollLeft = x;
        $('.musicRelief')[0].scrollTop = y;
        this.netScroll.x = x;
        this.netScroll.y = y;
    }

    // ### scrollVisible
    // Scroll such that the box is fully visible, if possible (if it is
    // not larger than the screen)
    scrollVisibleBox(box) {

        var xoff = 0;
        var yoff = 0;
        var curBox = this.scrollBox;
        if (box.width > curBox.width || box.height > curBox.height) {
            return;
        }
        if (box.height < curBox.height) {
            if (box.y < curBox.y) {
                yoff = box.y - curBox.y;
            }
            else if (box.y + box.height > curBox.y + curBox.height) {
                yoff = box.y + box.height - (curBox.y + curBox.height);
            }
        }

        if (box.x < curBox.width) {
            if (box.x < curBox.x) {
                xoff = box.x - curBox.x;
            } else if (box.x + box.width > curBox.x + curBox.width) {
                xoff = box.x + box.width - (curBox.x + curBox.width);
            }
        }

        if (xoff != 0 || yoff != 0) {
            this.scrollOffset(xoff,yoff);
        }
    }

    // ### scrollBox
    // get the current viewport, in scrolled coordinates.
    get scrollBox() {
        return svgHelpers.boxPoints(this.viewport.x + this.netScroll.x,
         this.viewport.y + this.netScroll.y,
         this.viewport.width,
          this.viewport.height
      );
    }

    // ### scrollOffset
    // scroll the offset from the starting scroll point
    scrollOffset(x,y) {
        var cur = {x:this._scroll.x,y:this._scroll.y};
        setTimeout(function() {
            if (x) {
                $('.musicRelief')[0].scrollLeft = cur.x + x;
            }
            if (y) {
                $('.musicRelief')[0].scrollTop = cur.y + y;
            }
        },1);
    }

    // ### netScroll
    // return the net amount we've scrolled, based on when the maps were make (initial)
    // , the offset of the container, and the absolute coordinates of the scrollbar.
    get netScroll() {
		var xoffset = $('.musicRelief').offset().left - this._offsetInitial.x;
		var yoffset = $('.musicRelief').offset().top - this._offsetInitial.y;
        return {x:this._scroll.x - (this._scrollInitial.x + xoffset),y:this._scroll.y - (this._scrollInitial.y + yoffset)};
    }

    // ### invScroll
    // invert the scroll parameters.
    get invScroll() {
        var vect = this.netScroll;
        return {x:vect.x*(-1),y:vect.y*(-1)};
    }

}
;
class TrackerBase {
}

// ## suiTracker
// A tracker maps the UI elements to the logical elements ,and allows the user to
// move through the score and make selections, for navigation and editing.
//
// ### Usage:
// `` javascript ``
// `new suiTracker(layout)`
//
// ### See also:
// `SuiSimpleLayout`, `controller`, `menu`
// ### class methods:
// ---
class suiTracker {
	constructor(layout,scroller) {
		this.layout = layout;
        this.measureMap = {};
        this.measureNoteMap = {}; // Map for tracke
        this.scroller = scroller;

		this.selections = [];
        this.modifierSelections = [];
		this.modifierTabs = [];
		this.modifierIndex = -1;
        this.localModifiers = [];
		this.modifierSuggestion=-1;
		this.suggestion = {};
		this.pitchIndex = -1;
		this.pasteBuffer = new PasteBuffer();
	}

    _fullRenderPromise() {
        var self = this;
        return new Promise((resolve) => {
            var f = function() {
                setTimeout(function() {
                    if (self.layout.passState === suiLayoutBase.passStates.clean) {
                        resolve();
                    } else {
                        f();
                    }
                },50);
            }
            f();
        });
    }

    // ### _checkBoxOffset
	// If the mapped note and actual note don't match, re-render the notes so they do.
	// Otherwise the selections are off.
	_checkBoxOffset() {
		var note = this.selections[0].note;
		var r = note.renderedBox;
		var b = this.selections[0].box;
        var preventScroll = $('body').hasClass('modal');

		if (r.y != b.y || r.x != b.x) {

            if (this.layout.passState == suiLayoutBase.passStates.replace ||
                this.layout.passState == suiLayoutBase.passStates.clean) {
                console.log('tracker: rerender conflicting map');
    			this.layout.remapAll();
            }
            if (!preventScroll) {
                console.log('prevent scroll conflicting map');
                $('body').addClass('modal');
                this._fullRenderPromise().then(() => {
                    $('body').removeClass('modal');
                });
            }
        }
	}

    replaceSelectedMeasures() {
        var mm = SmoSelection.getMeasureList(this.selections);
        this.layout.addToReplaceQueue(mm);
    }

	// ### renderElement
	// the element the score is rendered on
	get renderElement() {
		return this.layout.renderer.elementId;
	}

	get score() {
		return this.layout.score;
	}

	get context() {
		return this.layout.renderer.getContext();
	}

	_copySelections() {
		var rv = [];
		this.selections.forEach((sel) => {
			rv.push(sel.selector)
		});
		return rv;
	}

    _copySelectionsByMeasure(staffIndex,measureIndex) {
		var rv = this.selections.filter((sel) => sel.selector.staff == staffIndex && sel.selector.measure == measureIndex);
        var ticks = rv.length < 1 ? 0 : rv.map((sel) => sel.note.tickCount).reduce((a,b) => a + b);
        var sels = [];
        rv.forEach((sel) => {
            sels.push(JSON.parse(JSON.stringify(sel.selector)));
        });
        return {ticks:ticks,selectors:sels};
	}

	_getTicksFromSelections() {
		var rv = 0;
		this.selections.forEach((sel) => {
			if (sel.note) {
				rv += sel.note.tickCount;
			}
		});
		return rv;
	}
    // Hack - lyric should be handled consistently
    _reboxTextModifier(modifier) {
        var el;
        if (modifier.attrs.type === 'SmoLyric') {
            el = $(modifier.selector)[0];
        } else if (modifier.attrs.type === 'SmoGraceNote') {
            el = this.context.svg.getElementById('vf-'+modifier.renderedId);
        } else {
            el = this.context.svg.getElementsByClassName(modifier.attrs.id)[0];
        }
        if (!el) {
            console.warn('cannot rebox element '+modifier.attrs.id);
            return;
        }
        svgHelpers.updateArtifactBox(this.context.svg,el,modifier);
    }

    _updateNoteModifier(selection,modMap,modifier,ix) {
        if (!modMap[modifier.attrs.id]) {
            this.modifierTabs.push({
                modifier: modifier,
                selection: selection,
                box:svgHelpers.adjustScroll(modifier.renderedBox,this.scroller.netScroll),
                index:ix
            });
            ix += 1;
            modMap[modifier.attrs.id] = {
                exists: true
            };
        }
        return ix;
    }

	_updateModifiers() {
		this.modifierTabs = [];
		this.modifierBoxes = [];
		var modMap = {};
		var ix=0;
        this.layout.score.scoreText.forEach((modifier) => {
            if (!modMap[modifier.attrs.id]) {
                this.modifierTabs.push({
                    modifier: modifier,
							selection: null,
							box:svgHelpers.adjustScroll(modifier.renderedBox,this.scroller.netScroll),
							index:ix
                });
                ix += 1;
            }
        });
        var keys = Object.keys(this.measureNoteMap);
		keys.forEach((selKey) => {
            var selection = this.measureNoteMap[selKey];
			selection.staff.modifiers.forEach((modifier) => {
				if (SmoSelector.contains(selection.selector, modifier.startSelector, modifier.endSelector)) {
					if (!modMap[modifier.attrs.id]) {
                        if (modifier.renderedBox) {
    						this.modifierTabs.push({
    							modifier: modifier,
    							selection: selection,
    							box:svgHelpers.adjustScroll(modifier.renderedBox,this.scroller.netScroll),
    							index:ix
    						});
    						ix += 1;
    						modMap[modifier.attrs.id] = {
    							exists: true
    						};
                        }
					}
				}
			});
			selection.measure.modifiers.forEach((modifier) => {
				if (modifier.attrs.id && !modMap[modifier.attrs.id]
                   && modifier.renderedBox) {
					this.modifierTabs.push({
						modifier: modifier,
						selection: selection,
						box:svgHelpers.adjustScroll(modifier.renderedBox,this.scroller.netScroll),
						index:ix
					});
					ix += 1;
					modMap[modifier.attrs.id] = {
						exists: true
					};
				}
			});
			selection.note.textModifiers.forEach((modifier) => {
                ix = this._updateNoteModifier(selection,modMap,modifier,ix);
			});

            selection.note.graceNotes.forEach((modifier) => {
                ix = this._updateNoteModifier(selection,modMap,modifier,ix);
            });
		});
	}

    clearMusicCursor() {
        $('.workspace #birdy').remove();
    }


    musicCursor(selector) {
        var key = SmoSelector.getNoteKey(selector);
        if (this.measureNoteMap[key]) {
            var measureSel = SmoSelection.measureSelection(this.layout.score,
                this.layout.score.staves.length-1,selector.measure);
            var measure = measureSel.measure;
            var mbox = measure.renderedBox;

            var pos = this.measureNoteMap[key].scrollBox;
            // pos.y = measureSel.measure.renderedBox.y;
            var b = htmlHelpers.buildDom;
	        var r = b('span').classes('birdy icon icon-arrow-down').attr('id','birdy');
            $('.workspace #birdy').remove();
            var rd = r.dom();
            var y = pos.y - this.scroller.netScroll.y;
            var x = pos.x - this.scroller.netScroll.x;
            $(rd).css('top',y).css('left',x);
            $('.workspace').append(rd);
            // todo, need lower right for x
            var measureRight = mbox.x + mbox.width;
            var measureBottom = mbox.y +
                  mbox.height;
            this.scroller.scrollVisibleBox(svgHelpers.boxPoints(
                mbox.x,mbox.y,mbox.width,mbox.height));
        }
    }

    // ### selectModifierById
    // programatically select a modifier by ID.  Used by text editor.
    selectId(id) {
        this.modifierIndex = this.modifierTabs.findIndex((mm) =>  mm.modifier.attrs.id==id);
    }


    // used by remove dialogs to clear removed thing
    clearModifierSelections() {
        this.modifierSelections=[];
        this._createLocalModifiersList();
        this.modifierIndex = -1;
        this.eraseRect('staffModifier');
    }

	getSelectedModifier() {
        if (this.modifierSelections.length) {
            return this.modifierSelections[0];
        }
	}

    getSelectedModifiers() {
        return this.modifierSelections;
    }
    _addModifierToArray(ar) {
        ar.forEach((mod) => {
            if (mod.renderedBox) {
                this.localModifiers.push({selection:sel,modifier:mod,box:mod.renderedBox});
            }
        });
    }

    _createLocalModifiersList() {
        this.localModifiers = [];
        var staffSelMap = {};
        this.selections.forEach((sel) => {
            sel.note.getGraceNotes().forEach((gg) => {
                this.localModifiers.push({selection:sel,modifier:gg,box:gg.renderedBox});
            });
            sel.note.getModifiers('SmoDynamicText').forEach((dyn) => {
                this.localModifiers.push({selection:sel,modifier:dyn,box:dyn.renderedBox});
            });
            sel.measure.getModifiersByType('SmoVolta').forEach((volta) => {
                this.localModifiers.push({selection:sel,modifier:volta,box:volta.renderedBox});
            });
            sel.measure.getModifiersByType('SmoTempoText').forEach((tempo) => {
                this.localModifiers.push({selection:sel,modifier:tempo,box:tempo.renderedBox});
            });
            sel.staff.getModifiers().forEach((mod) => {
                if (SmoSelector.gteq(sel.selector,mod.startSelector) &&
                    SmoSelector.lteq(sel.selector,mod.endSelector) &&
                    !staffSelMap[mod.startSelector] && mod.renderedBox)  {
                    this.localModifiers.push({selection:sel,modifier:mod,box:mod.renderedBox});
                    // avoid duplicates
                    staffSelMap[mod.startSelector] = true;
                }
            });
        });
    }

	advanceModifierSelection(keyEv) {
		this.eraseRect('staffModifier');

        var offset = keyEv.key === 'ArrowLeft' ? -1 : 1;

		if (!this.modifierTabs.length) {
			return;
		}
		this.modifierIndex = this.modifierIndex + offset;
        this.modifierIndex = (this.modifierIndex == -2 && this.localModifiers.length) ?
            this.localModifiers.length - 1 : this.modifierIndex;
		if (this.modifierIndex >= this.localModifiers.length || this.modifierIndex < 0) {
			this.modifierIndex = -1;
            this.modifierSelections=[];
			return;
		}
        this.modifierSelections = [this.localModifiers[this.modifierIndex]];
		this._highlightModifier();
	}

	_findClosestSelection(selector) {
		var artifact = this._getClosestTick(selector);
		if (!artifact)
			return;
		if (this.selections.find((sel) => JSON.stringify(sel.selector)
				 === JSON.stringify(artifact.selector))) {
			return;
		}
		if (selector.pitches && selector.pitches.length && selector.pitches.length <= artifact.note.pitches.length) {
			// If the old selection had only a single pitch, try to recreate that.
			artifact.selector.pitches = JSON.parse(JSON.stringify(selector.pitches));
		}
		this.selections.push(artifact);
	}

    // ### _updateNoteBox
    // Update the svg to screen coordinates based on a change in viewport.
    _updateNoteBox(svg,smoNote,selector) {
        var el = svg.getElementById(smoNote.renderId);
        var cursorKey = '' + selector.measure + '-' + selector.tick;
        if (!el) {
            console.warn('no element to box');
            return;
        }
        svgHelpers.updateArtifactBox(svg,el,smoNote);

        // TODO: fix this, only works on the first line.
        smoNote.getModifiers('SmoLyric').forEach((lyric) => {
			var ar = Array.from(el.getElementsByClassName('vf-lyric'));
			ar.forEach((lbox) => {
                svgHelpers.updateArtifactBox(svg,lbox,lyric);
			});
		});
    }

    _updateMeasureNoteMap(artifact) {
        var noteKey = SmoSelector.getNoteKey(artifact.selector);
        var measureKey = SmoSelector.getMeasureKey(artifact.selector);
        var activeVoice = artifact.measure.getActiveVoice();
        if (artifact.selector.voice != activeVoice) {
            $('#'+artifact.note.renderId).find('.vf-notehead path').each(function(ix,el) {
                el.setAttributeNS('', 'fill', 'rgb(128,128,128)');
            });
        }

        // not has not been drawn yet.
        if (!artifact.box) {
            return;
        }

        if (!this.measureNoteMap[noteKey]) {
            this.measureNoteMap[noteKey] = artifact;
            artifact.scrollBox = {x:artifact.box.x - this.scroller.netScroll.x,y:artifact.measure.renderedBox.y - this.scroller.netScroll.y};
        } else {
            var mm = this.measureNoteMap[noteKey];
            mm.scrollBox = {x:Math.min(artifact.box.x - this.scroller.netScroll.x,mm.x),y:Math.min(artifact.measure.renderedBox.y - this.scroller.netScroll.y,mm.y)};
        }

        if (!this.measureMap[measureKey]) {
            this.measureMap[measureKey] = {keys:{}};
            this.measureMap[measureKey].keys[noteKey] = true;
        } else {
            var measureHash = this.measureMap[measureKey].keys;
            if (!measureHash[noteKey]) {
                measureHash[noteKey] = true;
            }

        }
    }

    loadScore() {
        this.measureMap = {};
        this.measureNoteMap = {};
        this.clearModifierSelections();
        this.selections=[];
    }

    // ### _clearMeasureArtifacts
    // clear the measure from the measure and note maps so we can rebuild it.
    clearMeasureMap(staff,measure) {
        var selector = {staff:measure.measureNumber.staffId,measure:measure.measureNumber.measureIndex};
        var measureKey = SmoSelector.getMeasureKey(selector);
        if (this.measureMap[measureKey]) {
            var nkeys = Object.keys(this.measureMap[measureKey].keys);
            nkeys.forEach((key) => {
                delete this.measureNoteMap[key];
            });

            delete this.measureMap[measureKey];
        }
        // Unselect selections in this measure so we can reselect them when re-tracked
        var ar = [];
        this.selections.forEach((selection) => {
            if (selection.selector.staff != selector.staff || selection.selector.measure != selector.measure) {
                ar.push(selection);
            }
        });
        this.selections = ar;
    }

    deleteMeasure(selection) {
        var selCopy = this._copySelectionsByMeasure(selection.selector.staff,selection.selector.measure)
            .selectors;

        this.clearMeasureMap(selection.staff,selection.measure);
        if (selCopy.length) {
            selCopy.forEach((selector) => {
                var nsel = JSON.parse(JSON.stringify(selector));
                if (selector.measure == 0) {
                    nsel.measure += 1;
                } else {
                    nsel.measure -= 1;
                }
                this.selections.push(this._getClosestTick(nsel));
            });
        }
    }



    // ### updateMeasure
    // A measure has changed.  Update the music geometry for it
    mapMeasure(staff,measure) {
        if (!measure.renderedBox) {
            return;
        }
        var sels = this._copySelectionsByMeasure(staff.staffId,measure.measureNumber.measureIndex);
        this.clearMeasureMap(staff,measure);
        var vix = measure.getActiveVoice();
        sels.selectors.forEach((sel) => {
            sel.voice = vix;
        });

        this.scroller.setScrollInitial();

        var voiceIx = 0;
        var selectionChanged = false;
        var selectedTicks = 0;
        measure.voices.forEach((voice) => {
            var tick = 0;
            voice.notes.forEach((note) => {
                var selector = {
                        staff: staff.staffId,
                        measure: measure.measureNumber.measureIndex,
                        voice: voiceIx,
                        tick: tick,
                        pitches: []
                    };

                var voice = measure.getActiveVoice();

                var selection = new SmoSelection({
                            selector: selector,
                            _staff: staff,
                            _measure: measure,
                            _note: note,
                            _pitches: [],
                            box: svgHelpers.adjustScroll(note.renderedBox,this.scroller.netScroll),
                            type: 'rendered'
                        });
                this._updateMeasureNoteMap(selection);
                // TODO: this just replaces the first selection...
                if (sels.selectors.length && selection.selector.tick == sels.selectors[0].tick &&
                     selection.selector.voice == vix) {
                    this.selections.push(selection);
                    // Reselect any pitches.
                    if (sels.selectors[0].pitches.length > 0) {
                        sels.selectors[0].pitches.forEach((pitchIx) => {
                            if (selection.pitches.length > pitchIx) {
                                selection.selector.pitches.push(pitchIx);
                            }
                        });
                    }
                    selectedTicks += selection.note.tickCount;
                    selectionChanged = true;
                } else if (selectedTicks > 0 && selectedTicks < sels.ticks && selection.selector.voice == vix) {
                    this.selections.push(selection);
                    selectedTicks += selection.note.tickCount;
                }

                tick += 1;
            });
            voiceIx += 1;
        });
        if (selectionChanged) {
            this.highlightSelection();
        }
    }

	// ### updateMap
	// This should be called after rendering the score.  It updates the score to
	// graphics map and selects the first object.
	_updateMap() {
		console.log('update map');
        this.mapping = true;
		var notes = [].slice.call(this.renderElement.getElementsByClassName('vf-stavenote'));

		var selCopy = this._copySelections();
		var ticksSelectedCopy = this._getTicksFromSelections();
		var firstSelection = this.getExtremeSelection(-1);

        //if (!firstSelection) {
        //    return;
        //}

		this._updateModifiers();
		this.selections = [];

        // Try to restore selection.  If there were none, just select the fist
        // thing in the score
        var keys = Object.keys(this.measureNoteMap);
		if (keys.length && !selCopy.length) {
            // If there is nothing rendered, don't update tracker
			this.selections = [this.measureNoteMap[keys[0]]];
		}  else {
            if (!firstSelection) {
                return;
            }
			this._findClosestSelection(firstSelection.selector);
            var first = this.selections[0];
			var tickSelected = first.note.tickCount;
			while (tickSelected < ticksSelectedCopy && first) {
				var delta = this.growSelectionRight();
				if (!delta)  {
					break;
				}
				tickSelected += delta;
			}
			// selCopy.forEach((sel) => this._findClosestSelection(sel));
		}
		this.highlightSelection();
        this._createLocalModifiersList();
		this.triggerSelection();
		this.pasteBuffer.clearSelections();
		this.pasteBuffer.setSelections(this.score, this.selections);
        this.mapping = false;
	}

	updateMap() {
        this._updateMap();
	}

	static stringifyBox(box) {
		return '{x:' + box.x + ',y:' + box.y + ',width:' + box.width + ',height:' + box.height + '}';
	}

	_getClosestTick(selector) {
        var measureKey = Object.keys(this.measureNoteMap).find((k) => {
            return SmoSelector.sameMeasure(this.measureNoteMap[k].selector, selector)
    				 && this.measureNoteMap[k].selector.tick === 0;
        });
        var tickKey = Object.keys(this.measureNoteMap).find((k) => {
            return SmoSelector.sameNote(this.measureNoteMap[k].selector,selector);
        });
		var firstObj = this.measureNoteMap[Object.keys(this.measureNoteMap)[0]];
		return tickKey ? this.measureNoteMap[tickKey]:
		    (measureKey ? this.measureNoteMap[measureKey] : firstObj);
	}

	// ### getExtremeSelection
	// Get the rightmost (1) or leftmost (-1) selection
	getExtremeSelection(sign) {
		var rv = this.selections[0];
		for (var i = 1; i < this.selections.length; ++i) {
			var sa = this.selections[i].selector;
			if (sa.measure * sign > rv.selector.measure * sign) {
				rv = this.selections[i];
			} else if (sa.measure === rv.selector.measure && sa.tick * sign > rv.selector.tick * sign) {
				rv = this.selections[i];
			}
		}
		return rv;
	}

	// ### _getOffsetSelection
	// Get the selector that is the offset of the first existing selection
	_getOffsetSelection(offset) {
		var increment = offset;
		var testSelection = this.getExtremeSelection(Math.sign(offset));
		var scopyTick = JSON.parse(JSON.stringify(testSelection.selector));
		var scopyMeasure = JSON.parse(JSON.stringify(testSelection.selector));
		scopyTick.tick += increment;
		scopyMeasure.measure += increment;
		var targetMeasure = SmoSelection.measureSelection(this.score, testSelection.selector.staff,
				scopyMeasure.measure);
        if (targetMeasure && targetMeasure.measure && targetMeasure.measure.voices.length <= scopyMeasure.voice) {
            scopyMeasure.voice = 0;
        }
		if (targetMeasure && targetMeasure.measure) {
			scopyMeasure.tick = (offset < 0) ? targetMeasure.measure.voices[scopyMeasure.voice].notes.length - 1 : 0;
		}

		if (testSelection.measure.voices.length > scopyTick.voice &&
            testSelection.measure.voices[scopyTick.voice].notes.length > scopyTick.tick && scopyTick.tick >= 0) {
            if (testSelection.selector.voice != testSelection.measure.getActiveVoice()) {
                scopyTick.voice = testSelection.measure.getActiveVoice();
                testSelection = this._getClosestTick(scopyTick);
                return testSelection.selector;
            }
			return scopyTick;
		} else if (targetMeasure &&
			scopyMeasure.measure < testSelection.staff.measures.length && scopyMeasure.measure >= 0) {
			return scopyMeasure;
		}
		return testSelection.selector;
	}

    getSelectedGraceNotes() {
        if (!this.modifierSelections.length) {
            return [];
        }
        var ff = this.modifierSelections.filter((mm) => {
            return mm.modifier.attrs.type == 'SmoGraceNote';
        });
        return ff;
    }

    isGraceNoteSelected() {
        if (this.modifierSelections.length) {
            var ff = this.modifierSelections.findIndex((mm)=> mm.modifier.attrs.type == 'SmoGraceNote');
            return ff >= 0;
        }
    }

    _growGraceNoteSelections(offset) {
        var far = this.modifierSelections.filter((mm)=> mm.modifier.attrs.type == 'SmoGraceNote');
        if (!far.length) {
            return;
        }
        var ix = (offset < 0) ? 0 : far.length-1;
        var sel = far[ix];
        var left = this.modifierTabs.filter((mt) => {
            return mt.modifier.attrs.type == 'SmoGraceNote' && SmoSelector.sameNote(mt.selection.selector,sel.selection.selector);
        });
        if (ix+offset < 0 || ix+offset >= left.length) {
            return;
        }
        this.modifierSelections.push(left[ix+offset]);
        this._highlightModifier();
    }

	growSelectionRight() {
        if (this.isGraceNoteSelected()) {
            this._growGraceNoteSelections(1);
            return 0;
        }
		var nselect = this._getOffsetSelection(1);
		// already selected
		var artifact = this._getClosestTick(nselect);
		if (!artifact) {
			return 0;
		}
		if (this.selections.find((sel) => SmoSelector.sameNote(sel.selector, artifact.selector))) {
			return 0;
		}
		// console.log('adding selection ' + artifact.note.id);

        if (!this.mapping) {
            suiOscillator.playSelectionNow(artifact);
        }

		this.selections.push(artifact);
		this.highlightSelection();
        this._createLocalModifiersList();
        return artifact.note.tickCount;
	}

	growSelectionLeft() {
        if (this.isGraceNoteSelected()) {
            this._growGraceNoteSelections(-1);
            return 0;
        }
		var nselect = this._getOffsetSelection(-1);
		// already selected
		var artifact = this._getClosestTick(nselect);
		if (!artifact) {
			return;
		}
		if (this.selections.find((sel) => SmoSelector.sameNote(sel.selector, artifact.selector))) {
			return;
		}

		// console.log('adding selection ' + artifact.note.id);
		this.selections.push(artifact);
        suiOscillator.playSelectionNow(artifact);
		this.highlightSelection();
        this._createLocalModifiersList();
        return artifact.note.tickCount;
	}

    // if we are being moved right programmatically, avoid playing the selected note.
	moveSelectionRight(evKey,skipPLay) {
		if (this.selections.length == 0) {
			return;
		}
		var nselect = this._getOffsetSelection(1);
		this._replaceSelection(nselect,skipPLay);
	}

	moveSelectionLeft() {
		if (this.selections.length == 0) {
			return;
		}
		var nselect = this._getOffsetSelection(-1);
		this._replaceSelection(nselect);
	}
	moveSelectionLeftMeasure() {
		this._moveSelectionMeasure(-1);
	}
	moveSelectionRightMeasure() {
		this._moveSelectionMeasure(1);
	}
	moveSelectionOffset(offset) {
		var fcn = (offset >= 0 ? 'moveSelectionRight' : 'moveSelectionLeft');
		offset = (offset < 0) ? -1 * offset : offset;
		for (var i = 0; i < offset; ++i) {
			this[fcn]();
		}
	}

	_moveSelectionMeasure(offset) {
		var selection = this.getExtremeSelection(Math.sign(offset));
		selection = JSON.parse(JSON.stringify(selection.selector));
		selection.measure += offset;
		selection.tick = 0;
		var selObj = this._getClosestTick(selection);
		if (selObj) {
			this.selections = [selObj];
		}
		this.highlightSelection();
        this._createLocalModifiersList();
		this.triggerSelection();
	}

	_moveStaffOffset(offset) {
		if (this.selections.length == 0) {
			return;
		}

		var nselector = JSON.parse(JSON.stringify(this.selections[0].selector));
		nselector.staff = this.score.incrementActiveStaff(offset);
		this.selections = [this._getClosestTick(nselector)];
		this.highlightSelection();
        this._createLocalModifiersList();
		this.triggerSelection();
	}

	// ### _moveSelectionPitch
	// Suggest a specific pitch in a chord, so we can transpose just the one note vs. the whole chord.
	_moveSelectionPitch(index) {
		if (!this.selections.length) {
			return;
		}
		var sel = this.selections[0];
		var note = sel.note;
		if (note.pitches.length < 2) {
			this.pitchIndex = -1;
			return;
		}
		this.pitchIndex = (this.pitchIndex + index) % note.pitches.length;
		sel.selector.pitches = [];
		sel.selector.pitches.push(this.pitchIndex);
		this._highlightPitchSelection(note, this.pitchIndex);
	}
	moveSelectionPitchUp() {
		this._moveSelectionPitch(1);
	}
	moveSelectionPitchDown() {
		if (!this.selections.length) {
			return;
		}
		this._moveSelectionPitch(this.selections[0].note.pitches.length - 1);
	}

	moveSelectionUp() {
		this._moveStaffOffset(-1);
	}
	moveSelectionDown() {
		this._moveStaffOffset(1);
	}

	containsArtifact() {
		return this.selections.length > 0;
	}

	_replaceSelection(nselector,skipPlay) {
		var artifact = SmoSelection.noteSelection(this.score, nselector.staff, nselector.measure, nselector.voice, nselector.tick);
        if (!artifact) {
            artifact = SmoSelection.noteSelection(this.score, nselector.staff, nselector.measure, 0, nselector.tick);
        }
        if (!artifact) {
            artifact = SmoSelection.noteSelection(this.score, nselector.staff, nselector.measure, 0,0);
        }
        if (!artifact) {
            console.log('warn: selection disappeared, default to start');
            artifact = SmoSelection.noteSelection(this.score,0,0,0,0);
        }
        if (!skipPlay) {
            suiOscillator.playSelectionNow(artifact);
        }

        // clear modifier selections
        this.clearModifierSelections();
		this.score.setActiveStaff(nselector.staff);
        var mapKey = Object.keys(this.measureNoteMap).find((k) => {
            return SmoSelector.sameNote(this.measureNoteMap[k].selector, artifact.selector);
        });
        if (!mapKey) {
            return;
        }
		var mapped = this.measureNoteMap[mapKey];

		// If this is a new selection, remove pitch-specific and replace with note-specific
		if (!nselector['pitches'] || nselector.pitches.length==0) {
			this.pitchIndex = -1;
		}
		// console.log('adding selection ' + mapped.note.id);

		this.selections = [mapped];
		this.highlightSelection();
        this._createLocalModifiersList();
		this.triggerSelection();
	}

	getFirstMeasureOfSelection() {
		if (this.selections.length) {
			return this.selections[0].measure;
		}
		return null;
	}
	// ## measureIterator
	// Description: iterate over the any measures that are part of the selection
	getSelectedMeasures() {
		var set = [];
        var rv = [];
		this.selections.forEach((sel) => {
			var measure = SmoSelection.measureSelection(this.score, sel.selector.staff, sel.selector.measure).measure;
			var ix = measure.measureNumber.measureIndex;
			if (set.indexOf(ix) === -1) {
				set.push(ix);
				rv.push(measure);
			}
		});
        return rv;

	}

	_selectFromToInStaff(sel1,sel2) {
		this.selections=[];
        var order = [sel1,sel2].sort((a,b) => {return SmoSelector.lteq(a.selector,b.selector) ? -1 : 1});

        // TODO: we could iterate directly over the selectors, that would be faster
        Object.keys(this.measureNoteMap).forEach((k) => {
            var obj = this.measureNoteMap[k];
            if (SmoSelector.gteq(obj.selector,order[0].selector) && SmoSelector.lteq(obj.selector,order[1].selector)) {
                this.selections.push(obj);
            }
        });
	}
	_addSelection(selection) {
		var ar=this.selections.filter((sel) => {
			return SmoSelector.neq(sel.selector,selection.selector);
		});
        suiOscillator.playSelectionNow(selection);

		ar.push(selection);
		this.selections=ar;
	}

	selectSuggestion(ev) {
		if (!this.suggestion['measure']) {
			return;
		}
		// console.log('adding selection ' + this.suggestion.note.id);

		if (this.modifierSuggestion >= 0) {
			if (this['suggestFadeTimer']) {
			   clearTimeout(this.suggestFadeTimer);
    		}
			this.modifierIndex = -1;
            this.modifierSelections = [this.modifierTabs[this.modifierSuggestion]];
			this.modifierSuggestion = -1;
			this._highlightModifier();
			$('body').trigger('tracker-select-modifier');
			return;
		}

		if (ev.shiftKey) {
			var sel1 = this.getExtremeSelection(-1);
			if (sel1.selector.staff === this.suggestion.selector.staff) {
				var min = SmoSelector.gt(sel1.selector,this.suggestion.selector)  ? this.suggestion : sel1;
				var max = SmoSelector.lt(min.selector,this.suggestion.selector) ? this.suggestion : sel1;
				this._selectFromToInStaff(min,max);
                this._createLocalModifiersList();
				this.highlightSelection();
				return;
			}
		}

		if (ev.ctrlKey) {
			this._addSelection(this.suggestion);
            this._createLocalModifiersList();
			this.highlightSelection();
			return;
		}

        suiOscillator.playSelectionNow(this.suggestion);

        var preselected = this.selections[0] ? SmoSelector.sameNote(this.suggestion.selector,this.selections[0].selector) && this.selections.length == 1 : false;

        if (preselected && this.selections[0].note.pitches.length > 1) {
            this.pitchIndex =  (this.pitchIndex + 1) % this.selections[0].note.pitches.length;
            this.selections[0].selector.pitches = [this.pitchIndex];
        } else {
            this.selections = [this.suggestion];
        }
        if (preselected && this.modifierTabs.length) {
            var mods  = this.modifierTabs.filter((mm) => mm.selection && SmoSelector.sameNote(mm.selection.selector,this.selections[0].selector));
            if (mods.length) {
            this.modifierSelections[0] = mods[0];
            this.modifierIndex = mods[0].index;
            this._highlightModifier();
            return;
            }
        }
		this.score.setActiveStaff(this.selections[0].selector.staff);
		if (this.selections.length == 0)
			return;
		var first = this.selections[0];
		for (var i = 0; i < this.selections.length; ++i) {
			var selection = this.selections[i];
			this.highlightSelection();
		}
        this._createLocalModifiersList();
		this.triggerSelection();
	}

	static get strokes() {
		return {
			'suggestion': {
				'stroke': '#fc9',
				'stroke-width': 2,
				'stroke-dasharray': '4,1',
				'fill': 'none'
			},
			'selection': {
				'stroke': '#99d',
				'stroke-width': 2,
				'fill': 'none'
			},
			'staffModifier': {
				'stroke': '#933',
				'stroke-width': 2,
				'fill': 'none'
			}
		}
	}

	_setFadeTimer() {
		if (this['suggestFadeTimer']) {
			clearTimeout(this.suggestFadeTimer);
		}
		var tracker=this;
		this.suggestFadeTimer = setTimeout(function () {
				if (tracker.containsArtifact()) {
					tracker.eraseRect('suggestion');
					tracker.modifierSuggestion=-1;
				}
			}, 1000);
	}


    _setModifierAsSuggestion(bb,artifact) {

		this.modifierSuggestion = artifact.index;

		this._drawRect(artifact.box, 'suggestion');
		this._setFadeTimer();
	}
	_setArtifactAsSuggestion(bb, artifact) {
		var self = this;

		var sameSel =
			this.selections.find((ss) => SmoSelector.sameNote(ss.selector, artifact.selector));

		if (sameSel) {
			return ;
		}

		this.modifierSuggestion = -1;

		this.suggestion = artifact;
		this._drawRect(artifact.box, 'suggestion');
		this._setFadeTimer();
	}

	intersectingArtifact(bb) {
        bb = svgHelpers.boxPoints(bb.x,bb.y,bb.width ? bb.width : 1 ,bb.height ? bb.height : 1);
		var artifacts = svgHelpers.findIntersectingArtifactFromMap(bb,this.measureNoteMap,this.scroller.netScroll);
		// TODO: handle overlapping suggestions
		if (!artifacts.length) {
			var sel = svgHelpers.findIntersectingArtifact(bb,this.modifierTabs,this.scroller.netScroll);
			if (sel.length) {
				sel = sel[0];
				this._setModifierAsSuggestion(bb, sel);
			}
			return;
		}
		var artifact = artifacts[0];
		this._setArtifactAsSuggestion(bb, artifact);
		return;
	}

	eraseAllSelections() {
		var strokeKeys = Object.keys(suiTracker.strokes);
		strokeKeys.forEach((key) => {
			this.eraseRect(key);
		});
	}

	eraseRect(stroke) {
		$(this.renderElement).find('g.vf-' + stroke).remove();
	}

    _highlightModifier() {
        if (!this.modifierSelections.length) {
            return;
        }
        var box=null;
        this.modifierSelections.forEach((artifact) => {
            if (!box) {
                box = artifact.modifier.renderedBox;
            }
            else {
                box = svgHelpers.unionRect(box,artifact.modifier.renderedBox);
            }
        });
        this._drawRect(box, 'staffModifier');
	}

	_highlightPitchSelection(note, index) {
		this.eraseAllSelections();
		var noteDiv = $(this.renderElement).find('#' + note.renderId);
		var heads = noteDiv.find('.vf-notehead');
		if (!heads.length) {
			return;
		}
		var headEl = heads[index];
		var box = svgHelpers.adjustScroll(svgHelpers.smoBox(headEl.getBoundingClientRect()),
          this.scroller.invScroll);
		this._drawRect(box, 'staffModifier');
	}
	triggerSelection() {
		$('body').trigger('tracker-selection');
	}

    _highlightActiveVoice(selection) {
        var selector = selection.selector;
        for (var i =1;i<=4;++i) {
            var cl = 'v'+i.toString()+'-active';
            $('body').removeClass(cl);
        }
        var cl = 'v'+(selector.voice + 1).toString()+'-active';
        $('body').addClass(cl);
    }


	highlightSelection() {
        var grace = this.getSelectedGraceNotes();
        // If this is not a note with grace notes, logically unselect the grace notes
        if (grace.length) {
            if (!SmoSelector.sameNote(grace[0].selection.selector,this.selections[0].selector)) {
                this.clearModifierSelections();
            } else {
                this._highlightModifier();
                return;
            }
        }
		if (this.pitchIndex >= 0 && this.selections.length == 1 &&
			this.pitchIndex < this.selections[0].note.pitches.length) {
			this._highlightPitchSelection(this.selections[0].note, this.pitchIndex);
            this._highlightActiveVoice(this.selections[0]);
			return;
		}
		this.pitchIndex = -1;
		this.eraseAllSelections();
		if (this.selections.length === 1 && this.selections[0].box) {
			this._checkBoxOffset();
			this._drawRect(this.selections[0].box, 'selection');
            this._highlightActiveVoice(this.selections[0]);
			return;
		}
		var sorted = this.selections.sort((a, b) => SmoSelector.gt(a.selector,b.selector) ? 1 : -1);
		var prevSel = sorted[0];
        // rendered yet?
        if (!prevSel.box)
            return;
		var curBox = svgHelpers.smoBox(prevSel.box);
		var boxes = [];
		for (var i = 1; i < sorted.length; ++i) {
			var sel = sorted[i];
			var ydiff = Math.abs(prevSel.box.y - sel.box.y);
			if (sel.selector.staff === prevSel.selector.staff && ydiff < 1.0) {
				curBox = svgHelpers.unionRect(curBox, sel.box);
			} else {
				boxes.push(curBox);
				curBox = sel.box;
			}
            this._highlightActiveVoice(sel);
			prevSel = sel;
		}
		boxes.push(curBox);
		this._drawRect(boxes, 'selection');
	}

	_drawRect(bb, stroke) {
		this.eraseRect(stroke);
		var grp = this.context.openGroup(stroke, stroke + '-');
		if (!Array.isArray(bb)) {
			bb = [bb];
		}
		bb.forEach((box) => {
            if (box) {
    			var strokes = suiTracker.strokes[stroke];
    			var strokeObj = {};
    			var margin = 5;
    			$(Object.keys(strokes)).each(function (ix, key) {
    				strokeObj[key] = strokes[key];
    			});
                box = svgHelpers.clientToLogical(this.context.svg, svgHelpers.adjustScroll(box,this.scroller.netScroll));
    			this.context.rect(box.x - margin, box.y - margin, box.width + margin * 2, box.height + margin * 2, strokeObj);
            }
		});
		this.context.closeGroup(grp);
	}
}
;
class layoutDebug {
    static get values() {
        return {
            pre:1,
            post:2,
            adjust:4,
            system:8,
            note:16,
            adjustHeight:32,
            measureHistory:64
        }
    }

    static get classes() {
        return {
            pre:'measure-place-dbg',
            post:'measure-render-dbg',
            adjust:'measure-adjust-dbg',
            system:'system-place-dbg',
            note:'measure-note-dbg',
            adjustHeight:'measure-adjustHeight-dbg',
            measureHistory:''
        }
    }

	static get mask() {
        if (typeof(layoutDebug._flags) == 'undefined') {
            layoutDebug._flags = 0;
        }
        return layoutDebug._flags;
	}

    static set mask(value) {
        layoutDebug._flags = value;
    }

    static flagSet(value) {
        return layoutDebug.mask & layoutDebug.values[value];
    }

    static clearAll(svg) {
        layoutDebug._flags = 0;
    }
    static setAll() {
        layoutDebug._flags = 1+2+4+8+16+32+64;
    }
    static clearDebugBoxes(value) {
        if (layoutDebug.flagSet(value)) {
            var selector = 'g.'+layoutDebug.classes[value];
            $(selector).remove();
        }
    }
    static debugBox(svg,box,flag) {
        if (!box.height) {
            box.height=1;
        }
        if (layoutDebug.flagSet(flag)) {
            svgHelpers.debugBox(svg, box, layoutDebug.classes[flag]);
        }
    }
    static clearFlag(value) {
        clearFlagSvg(value);

        var flag = layoutDebug.values[value];
        if (typeof(layoutDebug._flags) == 'undefined') {
            layoutDebug._flags = 0;
        }
        layoutDebug._flags = layoutDebug._flags & (~flag);
    }

	static setFlag(value) {
        var flag = layoutDebug.values[value];
        if (typeof(layoutDebug._flags) == 'undefined') {
            layoutDebug._flags = flag;
            return;
        }
        layoutDebug._flags |= flag;
	}
}
// ## suiLayoutBase
// ## Description:
// A layout maps the measures and notes to a spot on the page.  It
// manages the flow of music as an ordinary score.  We call it simple layout, because
// there may be other layouts for parts view, or output to other media.
class suiLayoutBase {
	constructor(ctor) {
		this.attrs = {
			id: VF.Element.newID(),
			type: ctor
		};
		this.dirty=true;
        this.replaceQ=[];
        this.renderTime=250;  // ms to render before time slicing
        this.partialRender = false;
        this.stateRepCount=0;
        this.viewportPages = 1;
		this.setPassState(suiLayoutBase.initial,'ctor');
		console.log('layout ctor: pstate initial');
		this.viewportChanged = false;
        this._resetViewport = false;
        this.measureMapper = null;
	}

    setMeasureMapper(mapper) {
        this.measureMapper = mapper;
    }

	static get passStates() {
		return {initial:0,pass:1,clean:2,replace:3,incomplete:4,adjustY:6,redrawMain:7};
	}

    addToReplaceQueue(selection) {
        if (this.passState == suiLayoutBase.passStates.clean ||
            this.passState == suiLayoutBase.passStates.replace) {
          if (Array.isArray(selection)) {
              this.replaceQ = this.replaceQ.concat(selection);
          } else {
              this.replaceQ.push(selection)
          }
          this.setDirty();
       }
    }


	setDirty() {
		if (!this.dirty) {
			this.dirty = true;
			if (this.passState == suiLayoutBase.passStates.clean ||
			   this.passState == suiLayoutBase.passStates.replace) {
				this.setPassState(suiLayoutBase.passStates.replace,'setDirty 2');
			} else {
				this.setPassState(suiLayoutBase.passStates.pass,'setDirty 3');
			}
		}
	}
	setRefresh() {
		this.dirty=true;
		this.setPassState(suiLayoutBase.passStates.initial,'setRefresh');
	}
    rerenderAll() {
        this.dirty=true;
		this.setPassState(suiLayoutBase.passStates.initial,'rerenderAll');
        this._resetViewport = true;
    }

    remapAll() {
        this.partialRender = false;
        this.setRefresh();
    }

    numberMeasures() {
        var staff = this.score.staves[0];
        var measures = staff.measures.filter((measure) => measure.measureNumber.systemIndex == 0);
        $('.measure-number').remove();

        measures.forEach((measure) => {
            var at = [];
            if (measure.measureNumber.measureNumber > 0) {
                at.push({y:measure.logicalBox.y - 10});
                at.push({x:measure.logicalBox.x});
                at.push({fontFamily:'Helvitica'});
                at.push({fontSize:'8pt'});
                svgHelpers.placeSvgText(this.context.svg,at,'measure-number',(measure.measureNumber.measureNumber + 1).toString());
            }
        });
    }

	_setViewport(reset,elementId) {
		// this.screenWidth = window.innerWidth;
		var layout = this._score.layout;
		this.zoomScale = layout.zoomMode === SmoScore.zoomModes.zoomScale ?
			layout.zoomScale : (window.innerWidth - 200) / layout.pageWidth;

		if (layout.zoomMode != SmoScore.zoomModes.zoomScale) {
			layout.zoomScale = this.zoomScale;
		}

		this.svgScale = layout.svgScale * this.zoomScale;
		this.orientation = this._score.layout.orientation;
		var w = Math.round(layout.pageWidth * this.zoomScale) ;
		var h = Math.round(layout.pageHeight * this.zoomScale);
		this.pageWidth =  (this.orientation  === SmoScore.orientations.portrait) ? w: h;
		this.pageHeight = (this.orientation  === SmoScore.orientations.portrait) ? h : w;
        this.totalHeight = this.pageHeight * this.score.layout.pages;
        this.viewportPages = this.score.layout.pages;

		this.leftMargin=this._score.layout.leftMargin;
        this.rightMargin = this._score.layout.rightMargin;
		$(elementId).css('width', '' + Math.round(this.pageWidth) + 'px');
		$(elementId).css('height', '' + Math.round(this.totalHeight) + 'px');
		if (reset) {
		    $(elementId).html('');
    		this.renderer = new VF.Renderer(elementId, VF.Renderer.Backends.SVG);
            this.viewportChanged = true;
            if (this.measureMapper) {
                this.measureMapper.scroller.scrollAbsolute(0,0);
            }
		}
		// this.renderer.resize(this.pageWidth, this.pageHeight);

		svgHelpers.svgViewport(this.context.svg, this.pageWidth, this.totalHeight, this.svgScale);

		this.context.setFont(this.font.typeface, this.font.pointSize, "").setBackgroundFillStyle(this.font.fillStyle);
		this.resizing = false;
		console.log('layout setViewport: pstate initial');
		this.dirty=true;
	}

    setViewport(reset) {
        this._setViewport(reset,this.elementId);
        this.score.staves.forEach((staff) => {
            staff.measures.forEach((measure) => {
                if (measure.logicalBox && reset) {
                    measure.svg.history=['reset'];
                    measure.deleteLogicalBox('reset viewport');
                }
            });
        });
        this.partialRender = false;
    }

    clearLine(measure) {
        var lineIndex = measure.lineIndex;
        var startIndex = (lineIndex > 1 ? lineIndex - 1: 0);
        for (var i = startIndex;i<lineIndex+1;++i) {
            this.score.staves.forEach((staff) => {
                var mms = staff.measures.filter((mm) => mm.lineIndex === i);
                mms.forEach((mm) => {
                    delete mm.logicalBox;
                });
            });
        }
    }

	setPassState(st,location) {
        var oldState = this.passState;
        if (oldState != st) {
            this.stateRepCount = 0;
        } else {
            this.stateRepCount += 1;
        }

        var msg = location + ': passState '+this.passState+'=>'+st;
        if (this.stateRepCount > 0) {
            msg += ' ('+this.stateRepCount+')';
        }
		console.log(msg);
		this.passState = st;
	}
	static get defaults() {
		return {
			clefWidth: 70,
			staffWidth: 250,
			totalWidth: 250,
			leftMargin: 15,
			topMargin: 15,
			pageWidth: 8 * 96 + 48,
			pageHeight: 11 * 96,
			svgScale: 0.7,
			font: {
				typeface: "Arial",
				pointSize: 10,
				fillStyle: '#eed'
			}
		};
	}

	static get debugLayout() {
		suiLayoutBase['_debugLayout'] = suiLayoutBase['_debugLayout'] ? suiLayoutBase._debugLayout : false
			return suiLayoutBase._debugLayout;
	}

	static set debugLayout(value) {
		suiLayoutBase._debugLayout = value;
        if (value) {
            $('body').addClass('layout-debug');
        } else {
            $('body').removeClass('layout-debug');
        }
	}

	// ### get context
	// ### Description:
	// return the VEX renderer context.
	get context() {
		return this.renderer.getContext();
	}
	get renderElement() {
		return this.renderer.elementId;
	}

	get svg() {
		return this.context.svg;
	}

    get score() {
        return this._score;
    }

    set score(score) {
        var shouldReset = false;
        if (this._score) {
            shouldReset = true;
        }
        this.setPassState(suiLayoutBase.passStates.initial,'load score');
        this.dirty=true;
        this._score = score;
        if (shouldReset) {
            if (this.measureMapper) {
                this.measureMapper.loadScore();
            }
            this.setViewport(true);
        }
    }


	// ### render
	// ### Description:
	// Render the current score in the div using VEX.  Rendering is actually done twice:
	// 1. Rendering is done just to the changed parts of the score.  THe first time, the whole score is rendered.
	// 2. Widths and heights are adjusted for elements that may have overlapped or exceeded their expected boundary.
	// 3. The whole score is rendered a second time with the new values.


	// ### undo
	// ### Description:
	// Undo is handled by the layout, because the layout has to first delete areas of the div that may have changed
	// , then create the modified score, then render the 'new' score.
	undo(undoBuffer) {
		var buffer = undoBuffer.peek();
		var op = 'setDirty';
		// Unrender the modified music because the IDs may change and normal unrender won't work
		if (buffer) {
			var sel = buffer.selector;
			if (buffer.type == 'measure') {
				this.unrenderMeasure(SmoSelection.measureSelection(this._score, sel.staff, sel.measure).measure);
			} else if (buffer.type === 'staff') {
				this.unrenderStaff(SmoSelection.measureSelection(this._score, sel.staff, 0).staff);
				op = 'setRefresh';
			} else {
				this.unrenderAll();
				op = 'setRefresh';
			}
			this._score = undoBuffer.undo(this._score);
			this[op]();
		}
	}

	// ### renderNoteModifierPreview
	// ### Description:
	// For dialogs that allow you to manually modify elements that are automatically rendered, we allow a preview so the
	// changes can be undone before the buffer closes.
	renderNoteModifierPreview(modifier,selection) {
		var selection = SmoSelection.noteSelection(this._score, selection.selector.staff, selection.selector.measure, selection.selector.voice, selection.selector.tick);
		if (!selection.measure.renderedBox) {
			return;
		}
		var system = new VxSystem(this.context, selection.measure.staffY, selection.measure.lineIndex,this.score);
		system.renderMeasure(selection.selector.staff, selection.measure);
	}

    // ### renderNoteModifierPreview
	// ### Description:
	// For dialogs that allow you to manually modify elements that are automatically rendered, we allow a preview so the
	// changes can be undone before the buffer closes.
	renderMeasureModifierPreview(modifier,measure) {
        var ix = measure.measureNumber.measureIndex;
        this._score.staves.forEach((staff) => {
            var cm = staff.measures[ix];
    		var system = new VxSystem(this.context, cm.staffY, cm.lineIndex,this.score);
            system.renderMeasure(staff.staffId, cm);
        });
	}

	// ### renderStaffModifierPreview
	// ### Description:
	// Similar to renderNoteModifierPreview, but lets you preveiw a change to a staff element.
	// re-render a modifier for preview during modifier dialog
	renderStaffModifierPreview(modifier) {
		// get the first measure the modifier touches
		var startSelection = SmoSelection.measureSelection(this._score, modifier.startSelector.staff, modifier.startSelector.measure);

		// We can only render if we already have, or we don't know where things go.
		if (!startSelection.measure.renderedBox) {
			return;
		}
		var system = new VxSystem(this.context, startSelection.measure.staffY, startSelection.measure.lineIndex,this.score);
		while (startSelection && startSelection.selector.measure <= modifier.endSelector.measure) {
			smoBeamerFactory.applyBeams(startSelection.measure);
            system.renderMeasure(startSelection.selector.staff, startSelection.measure);
            this._renderModifiers(startSelection.staff, system);

			var nextSelection = SmoSelection.measureSelection(this._score, startSelection.selector.staff, startSelection.selector.measure + 1);

			// If we go to new line, render this line part, then advance because the modifier is split
			if (nextSelection && nextSelection.measure && nextSelection.measure.lineIndex != startSelection.measure.lineIndex) {
				this._renderModifiers(startSelection.staff, system);
				var system = new VxSystem(this.context, startSelection.measure.staffY, startSelection.measure.lineIndex,this.score);
			}
			startSelection = nextSelection;
		}
		// this._renderModifiers(startSelection.staff, system);
	}

	// ### unrenderMeasure
	// ### Description:
	// All SVG elements are associated with a logical SMO element.  We need to erase any SVG element before we change a SMO
	// element in such a way that some of the logical elements go away (e.g. when deleting a measure).
	unrenderMeasure(measure) {
		if (!measure)
			return;

		$(this.renderer.getContext().svg).find('g.' + measure.getClassId()).remove();
		measure.setYTop(0,'unrender');
		measure.setChanged();
	}

    unrenderColumn(measure) {
        this.score.staves.forEach((staff) => {
            this.unrenderMeasure(staff.measures[measure.measureNumber.measureIndex]);
        });
    }

	// ### unrenderStaff
	// ### Description:
	// See unrenderMeasure.  Like that, but with a staff.
	unrenderStaff(staff) {
		staff.measures.forEach((measure) => {
			this.unrenderMeasure(measure);
		});
		staff.modifiers.forEach((modifier) => {
			$(this.renderer.getContext().svg).find('g.' + modifier.attrs.id).remove();
		});
	}


	// ### _renderModifiers
	// ### Description:
	// Render staff modifiers (modifiers straddle more than one measure, like a slur).  Handle cases where the destination
	// is on a different system due to wrapping.
	_renderModifiers(staff, system) {
		var svg = this.svg;
		staff.modifiers.forEach((modifier) => {
			var startNote = SmoSelection.noteSelection(this._score,
					modifier.startSelector.staff, modifier.startSelector.measure, modifier.startSelector.voice, modifier.startSelector.tick);
			var endNote = SmoSelection.noteSelection(this._score,
					modifier.endSelector.staff, modifier.endSelector.measure, modifier.endSelector.voice, modifier.endSelector.tick);
            if (!startNote || !endNote) {
                console.log('missing modifier...');
                return;
            }

			var vxStart = system.getVxNote(startNote.note);
			var vxEnd = system.getVxNote(endNote.note);

			// If the modifier goes to the next staff, draw what part of it we can on this staff.
			if (vxStart && !vxEnd) {
				var nextNote = SmoSelection.nextNoteSelection(this._score,
						modifier.startSelector.staff, modifier.startSelector.measure, modifier.startSelector.voice, modifier.startSelector.tick);
				var testNote = system.getVxNote(nextNote.note);
				while (testNote) {
					vxEnd = testNote;
					nextNote = SmoSelection.nextNoteSelection(this._score,
							nextNote.selector.staff, nextNote.selector.measure, nextNote.selector.voice, nextNote.selector.tick);
                    // last beat of the measure
                    if (!nextNote) {
                        break;
                    }
					testNote = system.getVxNote(nextNote.note);

				}
			}
			if (vxEnd && !vxStart) {
				var lastNote = SmoSelection.lastNoteSelection(this._score,
						modifier.endSelector.staff, modifier.endSelector.measure, modifier.endSelector.voice, modifier.endSelector.tick);
				var testNote = system.getVxNote(lastNote.note);
				while (testNote) {
					vxStart = testNote;
					lastNote = SmoSelection.lastNoteSelection(this._score,
							lastNote.selector.staff, lastNote.selector.measure, lastNote.selector.voice, lastNote.selector.tick);
                    if (!lastNote) {
                        break;
                    }
					testNote = system.getVxNote(lastNote.note);
				}
			}

			if (!vxStart && !vxEnd)
				return;

			// TODO: notes may have changed, get closest if these exact endpoints don't exist
			modifier.renderedBox = system.renderModifier(modifier, vxStart, vxEnd,startNote,endNote);
			modifier.logicalBox = svgHelpers.clientToLogical(svg,modifier.renderedBox);

			// TODO: consider staff height with these.
			// TODO: handle dynamics split across systems.
		});

		system.updateLyricOffsets();
	}

    _drawPageLines() {
        $(this.context.svg).find('.pageLine').remove();
        for (var i=1;i<this._score.layout.pages;++i) {
            var y = (this.pageHeight/this.svgScale)*i;
            svgHelpers.line(this.svg,0,y,this.score.layout.pageWidth/this.score.layout.svgScale,y,
                [{'stroke': '#321'},
                    {'stroke-width': '2'},
                        {'stroke-dasharray': '4,1'},
                            {'fill': 'none'}],'pageLine');
        }
    }

    _replaceMeasures() {

        this.replaceQ.forEach((change) => {
            var system = new VxSystem(this.context, change.measure.staffY, change.measure.lineIndex,this.score);
            system.renderMeasure(change.staff.staffId, change.measure);
            system.renderEndings();
            this._renderModifiers(change.staff, system);

            // Fix a bug: measure change needs to stay true so we recaltulate the width
            change.measure.changed = true;
            if (this.measureMapper) {
                this.measureMapper.mapMeasure(change.staff,change.measure);
            }
        });
        this.replaceQ = [];
    }

    _adjustHeight() {
        var curPages = this._score.layout.pages;
        // suiLayoutAdjuster.adjustHeight(this._score,this.renderer,this.pageHeight/this.svgScale);
        if (this._score.layout.pages  != curPages) {
            this.setViewport(false);
            this.setPassState(suiLayoutBase.passStates.initial,'render 2');
            // Force the viewport to update the page size
            // $('body').trigger('forceResizeEvent');
        } else {
            this.setPassState(suiLayoutBase.passStates.adjustY,'render 2');
        }
    }

	render() {
        if (this._resetViewport) {
            this.setViewport(true);
            this._resetViewport = false;
        }

		// layout iteratively until we get it right, adjusting X each time.
		var params = {useY:false,useX:false};
		if (this.passState == suiLayoutBase.passStates.pass || this.passState == suiLayoutBase.passStates.incomplete) {
			params.useX=true;
            params.useY=true;
		    suiLayoutAdjuster.adjustWidths(this._score,this.renderer);
		}
		if ((this.passState == suiLayoutBase.passStates.clean) ||
            (this.passState == suiLayoutBase.passStates.adjustY) ||
		    (this.passState == suiLayoutBase.passStates.replace) ||
            (this.passState == suiLayoutBase.passStates.redrawMain)) {
			params.useY=true;
			params.useX=true;
		}


        if (suiLayoutBase.passStates.replace == this.passState) {
            this._replaceMeasures();
        } else {
           this.layout(params);
        }

        if (this.passState == suiLayoutBase.passStates.incomplete) {
            return;
        }

        if (this.passState == suiLayoutBase.passStates.initial) {
            suiLayoutAdjuster.adjustWidths(this._score,this.renderer);
            suiLayoutAdjuster.justifyWidths(this._score,this.renderer,this.pageMarginWidth);
        }

        this._drawPageLines();

		if (this.passState == suiLayoutBase.passStates.replace) {
			this.dirty=false;
			return;
		}

        // if (this.passState == suiLayoutBase.passStates.redrawMain) {
        if (params.useX == true) {
            if (this.score.layout.pages != this.viewportPages) {
                this.setViewport(true);
                this.setPassState(suiLayoutBase.passStates.adjustY,
                    'page change reset viewport - re-render pages');
                return;
            }

            this.dirty=false;

            this.setPassState(suiLayoutBase.passStates.clean,'render complete');
            this.numberMeasures();
            // this.shadowRender = true;
            this.partialRender = true;
            return;
        }

        this.dirty=true;
        this.setPassState(suiLayoutBase.passStates.pass,'render 3');
        console.log('layout after pass: pstate pass');
	}
}
;
class suiPiano {
	constructor(parameters) {
		this.elementId = parameters.elementId;
        this.tracker = parameters.tracker;
        this.undoBuffer = parameters.undo;
		this.renderElement = document.getElementById('piano-svg')
			this.selections = [];
		this.render();
	}

	static get dimensions() {
		return {
			wwidth: 23,
			bwidth: 13,
			wheight: 120,
			bheight: 80,
			octaves:5
		};
	}
		// 7 white keys per octave
	static get wkeysPerOctave() {
		return 7;
	}
	static get owidth() {
		return suiPiano.dimensions.wwidth * suiPiano.wkeysPerOctave;
	}

	static createAndDisplay(parms) {
		// Called by ribbon button.
		// $('body').toggleClass('show-piano');
        $('body').trigger('show-piano-event');
		$('body').trigger('forceScrollEvent');
		// handle resize work area.
	}
	_mapKeys() {
		this.objects = [];
		var keys = [].slice.call(this.renderElement.getElementsByClassName('piano-key'));
		keys.forEach((key) => {
			var rect = svgHelpers.smoBox(key.getBoundingClientRect());
			var id = key.getAttributeNS('', 'id');
			var artifact = {
				keyElement: key,
				box: rect,
				id: id
			};
			this.objects.push(artifact);
		});
	}
	_removeClass(classes) {
		Array.from(this.renderElement.getElementsByClassName('piano-key')).forEach((el) => {
			$(el).removeClass(classes);
		});
	}
	_removeGlow() {
		this._removeClass('glow-key');
	}
	_fadeGlow(el) {
		if (this['suggestFadeTimer']) {
			clearTimeout(this.suggestFadeTimer);
		}
		// Make selection fade if there is a selection.
		this.suggestFadeTimer = setTimeout(function () {
				$(el).removeClass('glow-key');
			}, 1000);
	}
	bind() {
		var self = this;
        $('body').off('show-piano-event').on('show-piano-event',function() {
            $('body').toggleClass('show-piano');
            self._mapKeys();
        });

		$(this.renderElement).off('mousemove').on('mousemove', function (ev) {
			var keyPressed = svgHelpers.findSmallestIntersection({
					x: ev.clientX,
					y: ev.clientY
				}, self.objects,{x:0,y:0});
			if (!keyPressed) {
				return;
			}
			var el = self.renderElement.getElementById(keyPressed.id);
			if ($(el).hasClass('glow-key')) {
				return;
			}
			self._removeGlow();
			$(el).addClass('glow-key');
			self._fadeGlow(el);

		});
		$(this.renderElement).off('blur').on('blur',function(ev) {
			self._removeGlow();
		});
		$(this.renderElement).off('click').on('click', function (ev) {
			self._updateSelections(ev);
		});

		$('.close-piano').off('click').on('click', function () {
			$('body').removeClass('show-piano');
			// resize the work area.
			$('body').trigger('forceScrollEvent');
		});
        this.bindKeys();
	}
	_updateSelections(ev) {
		var keyPressed = svgHelpers.findSmallestIntersection({
				x: ev.clientX,
				y: ev.clientY
			}, this.objects,{x:0,y:0});
		if (!keyPressed) {
			return;
		}
		if (!ev.shiftKey) {
			this.selections = [];
			this._removeClass('glow-key pressed-key');
		} else {
			var el = this.renderElement.getElementById(keyPressed.id);
			$(el).addClass('pressed-key');
		}
		var key = keyPressed.id.substr(6, keyPressed.id.length - 6);
		var pitch = {
			letter: key[0].toLowerCase(),
			octave: parseInt(key[key.length - 1]),
			accidental: key.length == 3 ? key[1] : 'n'
		};
		this.selections.push(pitch);
		$('body').trigger('smo-piano-key', {
			selections: JSON.parse(JSON.stringify(this.selections))
		});
	}
	_renderclose() {
		var b = htmlHelpers.buildDom;
		var r = b('button').classes('icon icon-cross close close-piano');
		$(this.renderElement).closest('div').append(r.dom());
	}
	handleResize() {
		this._updateOffsets();
		this._mapKeys();
	}
	_updateOffsets() {
		var padding = Math.round(window.innerWidth - suiPiano.owidth*suiPiano.dimensions.octaves)/2;
		$(this.renderElement).closest('div').css('margin-left',''+padding+'px');
	}
    bindKeys() {
        var self = this;
        $('body').off('smo-piano-key').on('smo-piano-key',function(ev,obj) {
			obj=obj.selections;
			self.tracker.selections.forEach((sel) => {
                SmoUndoable.addPitch(sel, obj, self.undoBuffer);
                suiOscillator.playSelectionNow(sel);
			});
		});
    }
	render() {
		$('body').addClass('show-piano');
		var b = svgHelpers.buildSvg;
		var d = suiPiano.dimensions;
		// https://www.mathpages.com/home/kmath043.htm

		// Width of white key at back for C,D,E
		var b1off = d.wwidth - (d.bwidth * 2 / 3);

		// Width of other white keys at the back.
		var b2off=d.wwidth-(d.bwidth*3)/4;

		var keyAr = [];
		var xwhite = [{
				note: 'C',
				x: 0
			}, {
				note: 'D',
				x: d.wwidth
			}, {
				note: 'E',
				x: 2 * d.wwidth
			}, {
				note: 'F',
				x: 3 * d.wwidth
			}, {
				note: 'G',
				x: 4 * d.wwidth
			}, {
				note: 'A',
				x: 5 * d.wwidth
			}, {
				note: 'B',
				x: 6 * d.wwidth
			}
		];
		var xblack = [{
				note: 'Db',
				x: b1off
			}, {
				note: 'Eb',
				x: 2*b1off+d.bwidth
			}, {
				note: 'Gb',
				x: 3*d.wwidth+b2off
			}, {
				note: 'Ab',
				x: (3*d.wwidth+b2off)+b2off+d.bwidth
			}, {
				note: 'Bb',
				x: suiPiano.owidth-(b2off+d.bwidth)
			}
		];
		var wwidth = d.wwidth;
		var bwidth = d.bwidth;
		var wheight = d.wheight;
		var bheight = d.bheight;
		var owidth = suiPiano.wkeysPerOctave * wwidth;

		// Start on C2 to C6 to reduce space
		var octaveOff = 7-d.octaves;

		var x = 0;
		var y = 0;
		var r = b('g');
		for (var i = 0; i < d.octaves; ++i) {
			x = i * owidth;
			xwhite.forEach((key) => {
				var nt = key.note + (octaveOff + i + 1).toString();
				var classes = 'piano-key white-key';
				if (nt == 'C4') {
					classes += ' middle-c';
				}
				var rect = b('rect').attr('id', 'keyId-' + nt).rect(x + key.x, y, wwidth, wheight, classes);
				r.append(rect);

				var tt = b('text').text(x + key.x + (wwidth / 5), bheight + 16, 'note-text', nt);
				r.append(tt);
			});
			xblack.forEach((key) => {
				var nt = key.note + (octaveOff + i + 1).toString();
				var classes = 'piano-key black-key';
				var rect = b('rect').attr('id', 'keyId-' + nt).rect(x + key.x, 0, bwidth, bheight, classes);
				r.append(rect);
			});
		}
		var el = document.getElementById(this.elementId);
		el.appendChild(r.dom());
		this._renderclose();
		this._updateOffsets();
		this._mapKeys();
		this.bind();
	}
}
;
class SuiLayoutDemon {
    constructor(parameters) {
        this.pollTime = 100;

        this.idleRedrawTime = 5000;
        this.idleLayoutTimer = 0;
        this.undoStatus=0;

        Vex.Merge(this, parameters);
    }

    get isLayoutQuiet() {
		return ((this.layout.passState == suiLayoutBase.passStates.clean && this.layout.dirty == false)
		   || this.layout.passState == suiLayoutBase.passStates.replace);
	}

    handleRedrawTimer() {
        if ($('body').hasClass('printing')) {
            return;
        }
	    // If there has been a change, redraw the score
		if (this.undoStatus != this.undoBuffer.opCount || this.layout.dirty) {
			this.layout.dirty=true;
			this.undoStatus = this.undoBuffer.opCount;
			this.idleLayoutTimer = Date.now();
            var state = this.layout.passState;
            try {
				this.render();
            } catch (ex) {
                SuiExceptionHandler.instance.exceptionHandler(ex);
            }
		} else if (this.layout.passState === suiLayoutBase.passStates.replace) {
			// Do we need to refresh the score?
			if (Date.now() - this.idleLayoutTimer > this.idleRedrawTime) {
				this.layout.setRefresh();
			}
		}
	}

    // ### pollRedraw
	// if anything has changed over some period, prepare to redraw everything.
	pollRedraw() {
		var self=this;
		setTimeout(function() {
			self.handleRedrawTimer();
			self.pollRedraw();
		},self.pollTime);
	}

    startDemon() {
        this.pollRedraw();
    }

    render() {
		this.layout.render();
        if (this.layout.passState == suiLayoutBase.passStates.clean && this.layout.dirty == false) {
		    this.tracker.updateMap();
        }
	}

}
;
// ## suiAdjuster
// Perform adjustments on the score based on the rendered components so we can re-render it more legibly.
class suiLayoutAdjuster {

	static estimateMusicWidth(smoMeasure) {
		var widths = [];
        var voiceIx = 0;
        var tmObj = smoMeasure.createMeasureTickmaps();
		smoMeasure.voices.forEach((voice) => {
			var tickIndex = 0;
            var width = 0;
            var duration = 0;
            var tm = tmObj.tickmaps[voiceIx];
			voice.notes.forEach((note) => {
                var noteWidth = 0;
                var dots = (note.dots ? note.dots : 0);
				noteWidth += vexGlyph.dimensions.noteHead.width + vexGlyph.dimensions.noteHead.spacingRight;
				noteWidth += vexGlyph.dimensions.dot.width * dots + vexGlyph.dimensions.dot.spacingRight * dots;
				note.pitches.forEach((pitch) => {
                    var keyAccidental = smoMusic.getAccidentalForKeySignature(pitch,smoMeasure.keySignature);
                    var accidentals = tmObj.accidentalArray.filter((ar) =>
                        ar.duration < duration && ar.pitches[pitch.letter]);
                    var acLen = accidentals.length;
                    var declared = acLen > 0 ?
                        accidentals[acLen - 1].pitches[pitch.letter].pitch.accidental: keyAccidental;

                    if (declared != pitch.accidental
                        || pitch.cautionary) {
						noteWidth += vexGlyph.accidental(pitch.accidental).width;
					}
				});

                var verse = 0;
                var lyric;
                while (lyric = note.getLyricForVerse(verse)) {
                    // TODO: kerning and all that...
                    if (!lyric.length) {
                        break;
                    }
                    // why did I make this return an array?
                    // oh...because of voices
                    var lyricWidth = 6*lyric[0].text.length + 10;
                    noteWidth = Math.max(lyricWidth,noteWidth);

                    verse += 1;
                }

				tickIndex += 1;
                duration += note.tickCount;
                width += noteWidth;
			});
            voiceIx += 1;
            widths.push(width);
		});
        widths.sort((a,b) => a > b ? -1 : 1);
		return widths[0];
	}

	static estimateStartSymbolWidth(smoMeasure) {
		var width = 0;
		if (smoMeasure.forceKeySignature) {
			if ( smoMeasure.canceledKeySignature) {
			    width += vexGlyph.keySignatureLength(smoMeasure.canceledKeySignature);
			}
            width += vexGlyph.keySignatureLength(smoMeasure.keySignature);
		}
		if (smoMeasure.forceClef) {
			width += vexGlyph.clef(smoMeasure.clef).width + vexGlyph.clef(smoMeasure.clef).spacingRight;
		}
		if (smoMeasure.forceTimeSignature) {
            var digits = smoMeasure.timeSignature.split('/')[0].length;                    
			width += vexGlyph.dimensions.timeSignature.width*digits + vexGlyph.dimensions.timeSignature.spacingRight;
		}
		var starts = smoMeasure.getStartBarline();
		if (starts) {
			width += vexGlyph.barWidth(starts);
		}
		return width;
	}

	static estimateEndSymbolWidth(smoMeasure) {
		var width = 0;
		var ends  = smoMeasure.getEndBarline();
		if (ends) {
			width += vexGlyph.barWidth(ends);
		}
		return width;
	}


	static estimateTextOffset(renderer,smoMeasure) {
		var leftText = smoMeasure.modifiers.filter((mm) => mm.ctor==='SmoMeasureText' && mm.position === SmoMeasureText.positions.left);
		var rightText = smoMeasure.modifiers.filter((mm) => mm.ctor==='SmoMeasureText' && mm.position === SmoMeasureText.positions.right);
		var svg = renderer.getContext().svg;
		var xoff=0;
		var width=0;
		leftText.forEach((tt) => {
    		var testText = new SmoScoreText({text:tt.text});
    		var box = svgHelpers.getTextBox(svg,testText.toSvgAttributes(),testText.classes,testText.text);
			xoff += box.width;
		});
		rightText.forEach((tt) => {
    		var testText = new SmoScoreText({text:tt.text});
			var box = svgHelpers.getTextBox(svg,testText.toSvgAttributes(),testText.classes,testText.text);
			width += box.width;
		});
		return svgHelpers.boxPoints(xoff,0,width,0);
	}

	static estimateMeasureWidth(renderer,measure,staffBox) {

		// Calculate the existing staff width, based on the notes and what we expect to be rendered.
        var gravity = false;
        var prevWidth = measure.staffWidth;
		var measureWidth = suiLayoutAdjuster.estimateMusicWidth(measure);
		measure.adjX = suiLayoutAdjuster.estimateStartSymbolWidth(measure);
		measure.adjRight = suiLayoutAdjuster.estimateEndSymbolWidth(measure);
		measureWidth += measure.adjX + measure.adjRight;
        if (measure.changed == false && measure.logicalBox && measure.staffWidth < prevWidth) {
            measureWidth = Math.round((measure.staffWidth + prevWidth)/2);
            gravity = true;
        }
        measure.setWidth(measureWidth,'estimateMeasureWidth adjX adjRight gravity: '+gravity);

		// Calculate the space for left/right text which displaces the measure.
		// var textOffsetBox=suiLayoutAdjuster.estimateTextOffset(renderer,measure);
		// measure.setX(measure.staffX  + textOffsetBox.x,'estimateMeasureWidth');
        measure.setBox(svgHelpers.boxPoints(measure.staffX,measure.staffY,measure.staffWidth,measure.logicalBox.height),
           'estimate measure width');

	}
    static _beamGroupForNote(measure,note) {
        var rv = null;
        if (!note.beam_group) {
            return null;
        }
        measure.beamGroups.forEach((bg) => {
            if (!rv) {
                if (bg.notes.findIndex((nn) => note.beam_group && note.beam_group.id == bg.attrs.id) >= 0) {
                    rv = bg;
                }
            }
        });
        return rv;
    }

    // ### _highestLowestHead
    // highest value is actually the one lowest on the page
    static _highestLowestHead(measure,note) {
        var hilo = {hi:0,lo:9999999};
        note.pitches.forEach((pitch) => {
            // 10 pixels per line
            var px = 10*smoMusic.pitchToLedgerLine(measure.clef,pitch);
            hilo.lo = Math.min(hilo.lo,px);
            hilo.hi = Math.max(hilo.hi,px);
        });
        return hilo;
    }

    static estimateMeasureHeight(renderer,measure,layout) {
        var heightOffset = 50;  // assume 5 lines, todo is non-5-line staffs
        var yOffset = 0;
        if (measure.forceClef) {
            heightOffset += vexGlyph.clef(measure.clef).yTop + vexGlyph.clef(measure.clef).yBottom;
            yOffset = yOffset - vexGlyph.clef(measure.clef).yTop;
        }

        if (measure.forceTempo) {
            yOffset = Math.min(-1*vexGlyph.tempo.yTop,yOffset);
        }
        var hasDynamic = false;

        measure.voices.forEach((voice) => {
            voice.notes.forEach((note) => {
                var bg = suiLayoutAdjuster._beamGroupForNote(measure,note);
                var flag = SmoNote.flagStates.auto;
                if (bg && note.noteType == 'n') {
                    flag = bg.notes[0].flagState;
                    // an  auto-flag note is up if the 1st note is middle line
                    if (flag == SmoNote.flagStates.auto) {
                        var pitch = bg.notes[0].pitches[0];
                        flag = smoMusic.pitchToLedgerLine(measure.clef,pitch)
                           >= 2 ? SmoNote.flagStates.up : SmoNote.flagStates.down;
                    }
                }  else {
                    var flag = note.flagState;
                    // an  auto-flag note is up if the 1st note is middle line
                    if (flag == SmoNote.flagStates.auto) {
                        var pitch = note.pitches[0];
                        flag = smoMusic.pitchToLedgerLine(measure.clef,pitch)
                           >= 2 ? SmoNote.flagStates.up : SmoNote.flagStates.down;
                    }
                }
                var hiloHead = suiLayoutAdjuster._highestLowestHead(measure,note);
                if (flag == SmoNote.flagStates.down) {
                    yOffset = Math.min(hiloHead.lo,yOffset);
                    heightOffset = Math.max(hiloHead.hi + vexGlyph.stem.height,heightOffset);
                } else {
                    yOffset = Math.min(hiloHead.lo - vexGlyph.stem.height,yOffset);
                    heightOffset = Math.max(hiloHead.hi,heightOffset);
                }
                var dynamics = note.getModifiers('SmoDynamicText');
                dynamics.forEach((dyn) => {
                    heightOffset = Math.max((10*dyn.yOffsetLine - 50) + 11,heightOffset);
                    yOffset = Math.min(10*dyn.yOffsetLine - 50,yOffset)
                });
            });
        });
        return {heightOffset:heightOffset,yOffset:yOffset};
    }

    static adjustSystemForPage(score,lineIndex,svgScale) {
        // svgScale = 1.0;
        var ar = [];
        var pageSize = score.layout.pageHeight / svgScale;
        var bm = score.layout.bottomMargin/svgScale;
        var tm = score.layout.topMargin/svgScale;
        score.staves.forEach((staff) => {
            var mar = staff.measures.filter((mm) => mm.lineIndex == lineIndex);
            ar = ar.concat(mar);
        });
        var minMeasure  = ar[0];
        var maxMeasure = minMeasure;
        ar.forEach((mm) => {
            minMeasure = (mm.logicalBox.y < minMeasure.logicalBox.y)
               ? mm : minMeasure;
            maxMeasure =  (mm.logicalBox.y + mm.logicalBox.height >
                maxMeasure.logicalBox.y + maxMeasure.logicalBox.height)
               ? mm : maxMeasure;
        });
        var height = (maxMeasure.logicalBox.y + maxMeasure.logicalBox.height) -
            minMeasure.logicalBox.y;
        var page = Math.floor((minMeasure.logicalBox.y + pageSize)
            / pageSize);
        var thresh = pageSize * page - bm;
        var maxHeight = maxMeasure.logicalBox.y + maxMeasure.logicalBox.height;
        if (maxHeight > thresh && height < score.layout.pageHeight) {
            page += 1;
            var adj = (thresh-minMeasure.logicalBox.y)  + bm + tm;
            ar.forEach((mm) => {
                mm.setBox(svgHelpers.boxPoints(mm.logicalBox.x,mm.logicalBox.y + adj,
                    mm.logicalBox.width,mm.logicalBox.height),'adjustSystemForPage');
                mm.setY(mm.staffY + adj,'adjustSystemForPage');
            });
        }
        return page;
    }

    // ### _adjustTopYLeft
    // Adjust the start y for all the measures to the left of this systems
    // once we know that it will not wrap.
    static adjustYEstimates(score,lineIndex) {
        var rightMeasures = [];
        score.staves.forEach((staff) => {
            var mms = staff.measures.filter((mm) => mm.lineIndex == lineIndex);
            rightMeasures.push(mms.reduce((a,b) => a.measureNumber > b.measureNumber ? a : b));
        });
        rightMeasures.forEach((rightmost) => {
            var measure = rightmost;
            var staff = score.staves[measure.measureNumber.staffId];
            var index = measure.measureNumber.measureIndex;
            while (index > 0 && staff.measures[index-1].lineIndex == lineIndex) {
                var prev = staff.measures[index-1];
                index -= 1;
                if (prev.yTop > measure.yTop) {
                    prev.setY(prev.staffY + prev.yTop,'_adjustYEstimates 1');
                    var ll = prev.logicalBox;
                    prev.setBox(svgHelpers.boxPoints(ll.x,ll.y - prev.yTop,ll.width,ll.height),'_adjustYEstimates 1');
                    prev.setYTop(measure.yTop,'_adjustYEstimates');
                    prev.setY(prev.staffY - prev.yTop,'_adjustYEstimates 2');
                    prev.setBox(svgHelpers.boxPoints(ll.x,ll.y + prev.yTop,ll.width,ll.height),'_adjustYEstimates 2');
                }
            }
        });
    }

    static adjustWidthEstimates(score,lineIndex) {
        var ar = [];
        var pageSize = score.layout.pageHeight / svgScale;
        var bm = score.layout.bottomMargin/svgScale;
        var tm = score.layout.topMargin/svgScale;

        score.staves.forEach((staff) => {
            var mar = staff.measures.filter((mm) => mm.lineIndex == lineIndex);
            ar = ar.concat(mar);
        });
        var maxSystem = ar.map((mm) => {
                return mm.measureNumber.systemIndex;
            }).reduce((a, b) => {
                return a > b ? a : b
            });

        for (var i = 0;i <= maxSystem;++i) {
            var ixar = ar.filter((mm) => mm.measureNumber.systemIndex == i);
            var minx = ixar.map((mm) => mm.staffX).reduce((a,b) => {return (a < b) ? a : b});
            var minw = ixar.map((mm) => mm.staffWidth).reduce((a,b) => {return (a > b) ? a : b});
        }
    }


	// ### justifyWidths
	// After we adjust widths so each staff has enough room, evenly distribute the remainder widths to the measures.
	static justifyWidths(score,renderer,pageSize) {
		var context = renderer.getContext();
		var svg = context.svg;

		if (layoutDebug.flagSet['adjust']) {
			$(context.svg).find('g.measure-adjust-dbg').remove();
		}
		var topStaff = score.staves[0];
		var maxLine = topStaff.measures[topStaff.measures.length - 1].lineIndex;
		for (var i = 0; i <= maxLine; ++i) {
			var systemIndex = 0;

			score.staves.forEach((staff) => {
				var measures = staff.measures.filter((mm) => {
						return mm.lineIndex === i
					});
				if (measures.length > 0) {
					var width = measures.map((mm) => {
							return mm.staffWidth;
						}).reduce((a, b) => {
							return a + b
						});
                    // round justification down so it does not cause un-necessary wrapping
					var just = Math.floor((pageSize - width) / measures.length) - 1;
					if (just > 0) {
						var accum = 0;
						measures.forEach((mm) => {
							mm.setWidth(Math.floor(mm.staffWidth + just),'justifyWidths 1');
							mm.setX(mm.staffX+ accum,'justifyWidths');
							accum += just;
							if (layoutDebug.flagSet('adjust')) {
								var dbgBox = svgHelpers.boxPoints(
										mm.staffX, mm.staffY, mm.staffWidth, mm.logicalBox.height);
								svgHelpers.debugBox(svg, dbgBox, 'measure-adjust-dbg', 10);
							}
						});
					}
				}
			});
		}
	}

    // ### adjustWidths
	// Set the width of each measure in a system to the max width for that column so the measures are aligned.
	static adjustWidths(score,renderer) {
		var topStaff = score.staves[0];
		var maxLine = topStaff.measures[topStaff.measures.length - 1].lineIndex;
		var svg = renderer.getContext().svg;
		layoutDebug.clearDebugBoxes('adjust');

        // go through each system, vertically
		for (var i = 0; i <= maxLine; ++i) {
			var systemIndex = 0;
			while (true) {
				var measures = [];
                // Get all the measures on this line in this 'column'
				score.staves.forEach((staff) => {
					var ix = staff.measures.findIndex((x) => {
							return x.lineIndex === i && x.measureNumber.systemIndex === systemIndex;
						});
					if (ix >= 0) {
						measures.push(staff.measures[ix]);
					}
				});
				// Make sure each note head is not squishing
				// measures.forEach((mm) => {suiLayoutAdjuster._spaceNotes(svg,mm);});

                // find the widest measure in this column, and adjust the others accordingly
				if (measures.length) {
					var widest = measures.map((x) => {
							return x.staffWidth;
						}).reduce((a, w) => {
							return a > w ? a : w;
						});
					measures.forEach((measure) => {
						measure.setWidth(widest,'adjustWidths widest in column');
						measure.setChanged();
					});
				}
				if (!measures.length)
					break;
				systemIndex += 1;
			}
		}

		score.staves.forEach((staff) => {
			var last = null;
			staff.measures.forEach((measure) => {
				if (last && measure.measureNumber.systemIndex > 0) {
					measure.setX( last.staffX + last.staffWidth,'adjust widths');
				}
                layoutDebug.debugBox(svg,svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, measure.logicalBox.height),'adjust');
				last = measure;
			});
		});

	}

    // ### _minMaxYModifier
    // Helper function to calculate or update the min, max y of a staff
	static _minMaxYModifier(staff,minMeasure,maxMeasure,minY,maxY) {
		staff.modifiers.forEach((modifier) => {
            if (modifier.startSelector.measure >= minMeasure && modifier.startSelector <= maxMeasure) {
                minY = modifier.logicalBox.y < minY ? modifier.logicalBox.y : minY;
                var max = modifier.logicalBox.y + modifier.logicalBox.height;
                maxY = max > maxY ? max : maxY;
            }
			});

		return {minY:minY,maxY:maxY};
	}
}
;
// ## suiLayoutBase
// ## Description:
// A layout maps the measures and notes to a spot on the page.  It
// manages the flow of music as an ordinary score.  We call it simple layout, because
// there may be other layouts for parts view, or output to other media.
class suiScoreLayout extends suiLayoutBase {
	constructor(params) {
		super('suiScoreLayout');
		Vex.Merge(this, suiLayoutBase.defaults);
		Vex.Merge(this, params);

		this.setViewport(true);

		this.attrs = {
			id: VF.Element.newID(),
			type: 'testLayout'
		};
	}



	// ### createScoreLayout
	// ### Description;
	// to get the score to appear, a div and a score object are required.  The layout takes care of creating the
	// svg element in the dom and interacting with the vex library.
	static createScoreLayout(renderElement,shadowElement, score, layoutParams) {
		var ctorObj = {
			elementId: renderElement,
            shadowElement:shadowElement,
			score: score
		};
		if (layoutParams) {
			Vex.Merge(ctorObj, layoutParams);
		}
		var layout = new suiScoreLayout(ctorObj);
		return layout;
	}
	static get defaults() {
		return {
			clefWidth: 70,
			staffWidth: 250,
			totalWidth: 250,
			pageWidth: 8 * 96 + 48,
			pageHeight: 11 * 96,
			svgScale: 0.7,
			font: {
				typeface: "Arial",
				pointSize: 10,
				fillStyle: '#eed'
			}
		};
	}

	// ### unrenderAll
	// ### Description:
	// Delete all the svg elements associated with the score.
	unrenderAll() {
		this._score.staves.forEach((staff) => {
			this.unrenderStaff(staff);
		});
		$(this.renderer.getContext().svg).find('g.lineBracket').remove();
	}

    get pageMarginWidth() {
		return (this.score.layout.pageWidth -
            (this.score.layout.leftMargin +this.score.layout.rightMargin))/this.score.layout.svgScale;
	}
	get pageMarginHeight() {
		return (this.pageHeight -
            (this.score.layout.leftMargin +this.score.layout.rightMargin))/this.score.layout.svgScale;
	}

	get logicalPageWidth() {
		return this.pageMarginWidth;
	}
	get logicalPageHeight() {
		return this.pageMarginHeigh;
	}

    _previousAttrFunc(i,j,attr) {
		var staff = this._score.staves[j];
		var measure = staff.measures[i];
		return (i > 0 ? staff.measures[i - 1][attr]() : measure[attr]());
    }

	_previousAttr(i, j, attr) {
		var staff = this._score.staves[j];
		var measure = staff.measures[i];
		return (i > 0 ? staff.measures[i - 1][attr] : measure[attr]);
	}

	renderScoreText(tt) {
		var svg = this.context.svg;
		var classes = tt.attrs.id+' '+'score-text'+' '+tt.classes;
		var args = {svg:this.svg,width:this.logicalPageWidth,height:this.logicalPageHeight,layout:this._score.layout};
		if (tt.autoLayout === true) {
			var fcn = tt.position+'TextPlacement';
			suiTextLayout[fcn](tt,args);
		} else {
			suiTextLayout.placeText(tt,args);
		}
	}
	_renderScoreModifiers() {
		var svg = this.context.svg;
		$(this.renderer.getContext().svg).find('text.score-text').remove();
		this._score.scoreText.forEach((tt) => {
			this.renderScoreText(tt);
		});
	}


	calculateBeginningSymbols(systemIndex, measure, clefLast, keySigLast, timeSigLast,tempoLast) {
		var measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
		measure.forceClef = (systemIndex === 0 || measure.clef !== clefLast);
		measure.forceTimeSignature = (systemIndex === 0 || measure.timeSignature !== timeSigLast);
        measure.forceTempo = false;
		var tempo = measure.getTempo();
        if (tempo && measure.measureNumber.measureIndex == 0) {
            measure.forceTempo = tempo.display;
        }
		else if (tempo && tempoLast) {
		    if (!SmoTempoText.eq(tempo,tempoLast)) {
		    	measure.forceTempo = tempo.display;
		    }
		} else if (tempo) {
			measure.forceTempo = tempo.display;
		}
		if (measureKeySig !== keySigLast) {
			measure.canceledKeySignature = keySigLast;
			measure.setChanged();
			measure.forceKeySignature = true;
		} else if (systemIndex == 0 && measureKeySig != 'C') {
			measure.forceKeySignature = true;
		} else {
			measure.forceKeySignature = false;
		}
	}

    _resetStaffBoxes(renderState) {
        renderState.staffBoxes={};
    }
    _initStaffBoxes(renderState) {
        var s = renderState;
        var left = this._score.layout.leftMargin;
        var top = s.measure.measureNumber.measureIndex == 0 ? this._score.layout.topMargin : s.measure.staffY;
        if (!s.staffBoxes[s.staff.staffId]) {
            if (s.staff.staffId == 0) {
                s.staffBoxes[s.staff.staffId] = svgHelpers.pointBox(left,top);
            } else if (s.staffBoxes[s.staff.staffId - 1]) {
                s.staffBoxes[s.staff.staffId] =
                   svgHelpers.pointBox(s.staffBoxes[s.staff.staffId - 1].x,
                   s.staffBoxes[s.staff.staffId - 1].y + s.staffBoxes[s.staff.staffId - 1].height + this._score.layout.intraGap);
            } else {
                s.staffBoxes[s.staff.staffId] = svgHelpers.pointBox(s.measure.staffX,s.measure.staffY);
            }
        }
    }
    _updateStaffBoxes(renderState) {
        var s = renderState;

        // For x coordinate we adjust to the actual rendered size.  For Y, we want all staves at the same height
        // so we only consider the height of the first measure in the system
        if (s.measure.measureNumber.systemIndex === 0) {
            s.staffBoxes[s.staff.staffId] = svgHelpers.unionRect(s.staffBoxes[s.staff.staffId], s.measure.logicalBox);
        } else {
            s.staffBoxes[s.staff.staffId].width = (s.measure.logicalBox.x + s.measure.logicalBox.width) - s.staffBoxes[s.staff.staffId].x;
        }
        if (s.measure.measureNumber.systemIndex === 0) {
            s.staffBoxes[s.staff.staffId].y = s.measure.staffY + s.measure.yTop;
        }
    }

    _wrapLine(renderState) {
        var s = renderState;
        var measure = s.measure;
        var staff = s.staff;

        var useAdjustedY = s.calculations.useY;
		var useAdjustedX = s.calculations.useX;
        var svg = this.context.svg;

        s.system.renderEndings();
        if (useAdjustedY) {
            s.system.cap();
        } else {
            suiLayoutAdjuster.adjustYEstimates(this.score,measure.lineIndex);
        }

        this._score.staves.forEach((stf) => {
            this._renderModifiers(stf, s.system);
        });
        // If we wrapped in a row that is not top staff, start rendering
        // at the top staff
        measure = this.score.staves[0].measures[measure.measureNumber.measureIndex];
        staff = this.score.staves[0];
        s.measure = measure;
        s.staff = staff;

        // If we have wrapped at a place other than the wrap point, give up and
        // start computing X again
        // TODO: this can also be done dynamically, no need to change.
        /*
        if (useAdjustedX && measure.measureNumber.systemIndex != 0) {
            useAdjustedX = s.calculations.useX = false;
        }
        */
        measure.setX(this._score.layout.leftMargin,'scoreLayout initial');

        if (!useAdjustedY && measure.changed) {
            // var offsets = suiLayoutAdjuster.estimateMeasureHeight(this.renderer,measure,this.score.layout);
            // measure.setY(s.pageBox.y + s.pageBox.height + offsets.yOffset,'scoreLayout wrap');
            /* layoutDebug.debugBox(svg,svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, offsets.heightOffset),'pre');
            if (isNaN(measure.staffY)) {
                throw ("nan measure ");
            }  */
        }
        this._resetStaffBoxes(s);
        this._initStaffBoxes(s);
        s.lineIndex += 1;
        measure.lineIndex = s.lineIndex;
        s.system = new VxSystem(this.context, staff.staffY, s.lineIndex,this.score);
        s.systemIndex = 0;

        // If we have wrapped lines, calculate the beginning stuff again.
        this.calculateBeginningSymbols(s.systemIndex, measure, s.clefLast, s.keySigLast, s.timeSigLast,s.tempoLast);
        if (!useAdjustedX) {
            suiLayoutAdjuster.estimateMeasureWidth(this.renderer,measure,s.staffBoxes[staff.staffId]);
        }
        measure.systemIndex = 0;
    }

    _layoutColumn(renderState) {
        var s = renderState;
        var staff = s.staff;
        while (staff) {
            s = this._layoutMeasure(s);
            if (s.wrapped) {
                return s;
            }

            staff = this._score.staves.find((s) => s.staffId == staff.staffId + 1);
            if (staff) {
                s.staff = staff;
                s.measure = s.staff.measures[s.measure.measureNumber.measureIndex];
            }
        }

        return s;
    }
    // justify the columns as we go if we are calculating X, so that we wrapped
    // in the correct place.
    _adjustColumnBoxes(renderState) {
        var ar=[];
        var s = renderState;
        Object.keys(s.staffBoxes).forEach((k)=> {ar.push(s.staffBoxes[k])});
        var widths = ar.map((x) => x.width+x.x).reduce((a,b) => a > b ? a : b);
        ar.forEach((box) => {
            box.x += (widths - (box.x + box.width));
        });
    }
    _adjustPages() {
        var pageCfg = this.score.layout.pages;

    }

    _layoutSystem(renderState) {
        var s = renderState;
		var svg = this.context.svg;
        var currentLine = 0;

        while (!s.wrapped && !s.complete) {
             this._layoutColumn(s);
             if (s.wrapped) {
                 if (!s.calculations.useY) {
                      this.score.layout.pages =
                      suiLayoutAdjuster.adjustSystemForPage(this.score,s.measure.lineIndex,this.score.layout.svgScale);
                 }
                 break;
             }
             var useX = s.calculations.useX;
             if (!useX) {
                 this._adjustColumnBoxes(s);
             }
             var staff = this._score.staves[0];
             var measure = staff.measures.find((m) => m.measureNumber.measureIndex == s.measure.measureNumber.measureIndex+1);

            if (measure) {
                s.staff = staff;
                s.measure = measure;
                // If we are expecting to wrap here, do so.
                if (useX && measure.lineIndex > s.lineIndex) {
                    s.wrapped = true;
                    if (!s.calculations.useY) {
                       this.score.layout.pages =
                         suiLayoutAdjuster.adjustSystemForPage(this.score,measure.lineIndex,this.score.layout.svgScale);
                    }
                    break;
                }
                s.systemIndex += 1;
            } else {
                s.complete = true;
                if (!s.calculations.useY) {
                    suiLayoutAdjuster.adjustYEstimates(this.score,s.measure.lineIndex);
                    this.score.layout.pages =
                      suiLayoutAdjuster.adjustSystemForPage(this.score,s.lineIndex,this.score.layout.svgScale);
                }
            }
        }

        if (!s.complete && s.wrapped) {
            this._wrapLine(s);
            s.wrapped = false;
        }
    }


    _layoutMeasure(renderState) {
        var s = renderState;
        var measure = s.measure;
        var staff = s.staff;
        var useAdjustedY = s.calculations.useY;
		var useAdjustedX = s.calculations.useX;
        var svg = this.context.svg;

        if (measure.measureNumber.staffId == 0  && measure.lineIndex == 0 && measure.measureNumber.measureIndex == 0) {
           // If this is the top staff, put it on the top of the page.
               layoutDebug.clearDebugBoxes('pre');
               layoutDebug.clearDebugBoxes('post');
               layoutDebug.clearDebugBoxes('note');
        }

        measure.lineIndex = s.lineIndex;

        this._initStaffBoxes(s);

        // The SVG X,Y of this staff.  Set it initially to the UL corner of page.  Width,height filled in later.
        var staffBox = s.staffBoxes[staff.staffId];

        var staffHeight = 50;

        s.measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
        s.keySigLast = smoMusic.vexKeySignatureTranspose(this._previousAttr(measure.measureNumber.measureIndex,
            staff.staffId, 'keySignature'), measure.transposeIndex);
        s.tempoLast = this._previousAttrFunc(measure.measureNumber.measureIndex,staff.staffId,'getTempo');
        s.timeSigLast = this._previousAttr(measure.measureNumber.measureIndex,
            staff.staffId, 'timeSignature');
        s.clefLast = this._previousAttr(measure.measureNumber.measureIndex,
            staff.staffId, 'clef');

        this.calculateBeginningSymbols(s.systemIndex, measure, s.clefLast, s.keySigLast, s.timeSigLast,s.tempoLast);

        // If we are calculating the measures' location dynamically, always update the y
        // TODO: is all this code reachable
        if (!useAdjustedY) {
            // if this is not the left-most staff, get it from the previous measure
            var offsets = suiLayoutAdjuster.estimateMeasureHeight(this.renderer,measure,this.score.layout);
            if (s.systemIndex > 0) {
                /* measure.setY(this._previousAttr(measure.measureNumber.measureIndex,
                    staff.staffId,'staffY') - this._previousAttr(measure.measureNumber.measureIndex,
                        staff.staffId,'yTop'),'scoreLayout estimate index > 0');  */
                var prevYTop = this._previousAttr(measure.measureNumber.measureIndex,staff.staffId,'yTop');
                var prevY = this._previousAttr(measure.measureNumber.measureIndex,staff.staffId,'staffY') + prevYTop;
                measure.setYTop(Math.min(offsets.yOffset,prevYTop),'scoreLayout inner');
                measure.setY(
                    prevY
                     - measure.yTop,'scoreLayout match earlier measure on this staff');
                measure.setBox(svgHelpers.boxPoints(measure.staffX,measure.staffY + measure.yTop,measure.staffWidth,offsets.heightOffset)
                  ,'score layout estimate Height 2');
            } else if (measure.measureNumber.staffId == 0  && measure.lineIndex == 0) {
                // If this is the top staff, put it on the top of the page.

                measure.setYTop(offsets.yOffset,'estimate height 2');
                measure.setY(this.score.layout.topMargin +
                     (measure.lineIndex*this.score.layout.interGap) - offsets.yOffset,'score layout estimate Height 2');
                measure.setBox(svgHelpers.boxPoints(measure.staffX,measure.staffY + offsets.yOffset ,measure.staffWidth,offsets.heightOffset)
                  ,'score layout estimate Height 2');
            } else {
                // Else, get it from the measure above us.
                var previous;
                if (measure.measureNumber.staffId > 0){
                    previous = this.score.staves[measure.measureNumber.staffId - 1].measures[measure.measureNumber.measureIndex];
                }  else {
                    previous = this.score.staves[this.score.staves.length-1].measures.find((mm) => mm.lineIndex == measure.lineIndex - 1);
                }
                measure.setYTop(offsets.yOffset,'estimate height 3');

                measure.setY(previous.staffY + this.score.layout.intraGap + previous.logicalBox.height - measure.yTop ,'scoreLayout estimate height 3');
                measure.setBox(svgHelpers.boxPoints(measure.staffX,measure.staffY + offsets.yOffset,measure.staffWidth,offsets.heightOffset), 'score Layout estimateHeight 3');
            }
            if (isNaN(measure.staffY)) {
                throw ("nan measure ");
            }
        }

        if (!s.pageBox['width']) {
            s.pageBox = svgHelpers.copyBox(staffBox);
        }

        if (!useAdjustedX) {
            if (s.systemIndex > 0) {
            measure.setX(staffBox.x + staffBox.width,'scoreLayout, inner measure');
            } else {
                measure.setX(this.score.layout.leftMargin,'scoreLayout left measue');
            }
            suiLayoutAdjuster.estimateMeasureWidth(this.renderer,measure,staffBox);
        }

        // the width of this measure is the existing width, plus left margin, plus measure width
        // Don't use staffBox.x since it may have been adjusted
        var newWidth = Math.floor(measure.staffX + measure.staffWidth);
        // The left margin is included in the width, so don't add it twice
        var wrapThreshold = this.logicalPageWidth + this.score.layout.leftMargin;

        // If we have wrapped on this line previously, wrap in the same place unless the location of this staff has changed quite a bit.
        if (measure.measureNumber.systemIndex == 0 && staff.staffId == 0 && s.systemIndex > 0 && useAdjustedX) {
            wrapThreshold = wrapThreshold * 0.5;
        } else if (measure.measureNumber.systemIndex == 0 && measure.staffWidth > wrapThreshold) {
            // If we are the first line but we need to wrap, just shrink the line
            measure.setWidth(wrapThreshold - measure.staffX,'scoreLayout wrap line width');
        }

        // Do we need to start a new line?  Don't start a new line on the first measure in a line...
        if (s.systemIndex > 0 && (newWidth
             > wrapThreshold || measure.getForceSystemBreak())) {
                 console.log('wrap mm '+ measure.measureNumber.measureIndex + ' column: ' + measure.measureNumber.systemIndex +
                  ' line: '+measure.lineIndex + ' force: '+measure.getForceSystemBreak());
                 s.wrapped = true;
                 s.staff=staff;
                 s.measure=measure;
                 return s;
        }

        if (measure.measureNumber.systemIndex == 0 && staff.staffId == 0 && s.systemIndex > 0 && measure.logicalBox) {
            console.log('wrap is changing');
        }
        // guess height of staff the first time
        measure.measureNumber.systemIndex = s.systemIndex;
        layoutDebug.debugBox(svg,svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth),'pre');

        smoBeamerFactory.applyBeams(measure);

        if (measure.measureNumber.systemIndex == 0 && useAdjustedY == false && (this.passState != suiLayoutBase.passStates.initial))  {
            // currently unreachable
            s.system.renderMeasure(staff.staffId, measure);

        } else if (this.passState != suiLayoutBase.passStates.initial) {
            s.system.renderMeasure(staff.staffId, measure);
        } else if (measure.logicalBox && measure.changed && this.passState == suiLayoutBase.passStates.initial)  {
            measure.setBox(svgHelpers.boxPoints(measure.logicalBox.x,measure.logicalBox.y,measure.staffWidth,measure.logicalBox.height)
           ,'scoreLayout adjust width of rendered box');
        }


        layoutDebug.debugBox(svg,  measure.logicalBox, 'post');
        /* if (layoutDebug.flagSet('note') && measure.logicalBox) {
            measure.voices.forEach((voice) => {
                voice.notes.forEach((note) => {
                    var noteEl = svg.getElementById(note.renderId);
                    if (noteEl) {
                       layoutDebug.debugBox(svg, noteEl.getBBox(), 'note');
                    }
                });
            });
        }  */

        measure.changed = false;

        // For x coordinate we adjust to the actual rendered size.  For Y, we want all staves at the same height
        // so we only consider the height of the first measure in the system
        this._updateStaffBoxes(s);
        s.pageBox = svgHelpers.unionRect(s.pageBox, measure.logicalBox);
        s.wrapped=false;
        s.measure=measure;

        if (this.measureMapper) {
            this.measureMapper.mapMeasure(staff,measure);
        }
        return s;
    }

    _initializeRenderState(calculations) {
        var staff = this._score.staves[0];
        var measure = staff.measures[0];
        var lineIndex = 0;
		var system = new VxSystem(this.context, staff.measures[0].staffY, lineIndex,this.score);

        var renderState = {
            staff:staff,
            measure:staff.measures[0],
            lineIndex:0,
            pageBox:{},
            systemIndex:0,
            system:system,
            wrapped:false,
            complete:false,
            calculations:calculations,
            lowestWrappedMeasure:this.lowestWrappedMeasure
        }
        renderState.measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
        renderState.keySigLast = smoMusic.vexKeySignatureTranspose(this._previousAttr(measure.measureNumber.measureIndex, staff.staffId, 'keySignature'), measure.transposeIndex);
        renderState.timeSigLast = this._previousAttr(measure.measureNumber.measureIndex, staff.staffId, 'timeSignature');
        renderState.clefLast = this._previousAttr(measure.measureNumber.measureIndex, staff.staffId, 'clef');
        renderState.tempoLast = this._previousAttrFunc(measure.measureNumber.measureIndex,staff.staffId,'getTempo');

        this._resetStaffBoxes(renderState);
        return renderState;
    }

    // ### layout
	//  Render the music, keeping track of the bounding boxes of all the
	// elements.  Re-render a second time to adjust measure widths to prevent notes
	// from overlapping.  Then render all the modifiers.
	// * useAdjustedY is false if we are dynamically rendering the score, and we use other
	// measures to find our sweet spot.  If true, we assume the coordinates are correct and we use those.
    layout(calculations) {
        // bounding box of all artifacts in a system
		if (!this._score.staves.length || !this._score.staves[0].measures.length) {
			return;
		}

        var renderState = this.passState == suiLayoutBase.passStates.incomplete ?
            this.renderState :
            this._initializeRenderState(calculations);
        if (this.passState == suiLayoutBase.passStates.incomplete) {
            this.setPassState(suiLayoutBase.passStates.pass,'completing');
        }
        var ts = Date.now();
        while (renderState.complete == false) {
            this._layoutSystem(renderState);
            // Render a few lines at a time, unless in debug mode
            if (this.partialRender == true &&
                (this.passState == suiLayoutBase.passStates.pass) &&
                renderState.complete == false
                && layoutDebug.mask == 0
                && Date.now() - ts > this.renderTime) {
                this.renderState = renderState;
                this.setPassState(suiLayoutBase.passStates.incomplete,' partial '+renderState.measure.measureNumber.measureIndex);
                break;
            }
        }

        if (this.passState == suiLayoutBase.passStates.incomplete) {
            return;
        }

        this._score.staves.forEach((stf) => {
			this._renderModifiers(stf, renderState.system);
		});
		this._renderScoreModifiers();
		if (calculations.useY) {
			renderState.system.cap();
		}
    }
}
;
class suiTextLayout {
	
	static _getTextBox(scoreText,parameters) {
		var svg = parameters.svg;
		if (scoreText.width && scoreText.height && scoreText.boxModel == SmoScoreText.boxModels.wrap) {
			return svgHelpers.boxPoints(scoreText.x,scoreText.y,scoreText.width,scoreText.height);
		}
		return svgHelpers.getTextBox(svg,scoreText.toSvgAttributes(),scoreText.classes,scoreText.text);		
	}
	static _saveBox(scoreText,parameters,el) {
		var svg = parameters.svg;
		 var box = svgHelpers.smoBox(el.getBoundingClientRect());
		 var lbox = svgHelpers.clientToLogical(svg,box);
		 scoreText.renderedBox = {
			x: box.x,
			y: box.y,
			height: box.height,
			width: box.width
		};
		scoreText.logicalBox = lbox;
	}
	static titleTextPlacement(scoreText,parameters) {
		var svg = parameters.svg;
		var bbox = suiTextLayout._getTextBox(scoreText,parameters);
		scoreText.x=parameters.width/2-(bbox.width/2);
		scoreText.y=parameters.layout.topMargin;
		parameters.layout.topMargin += bbox.height;
		scoreText.autoLayout=false; // use custom placement or calculated placement next time
		suiTextLayout.placeText(scoreText,parameters);
	}
	
	static headerTextPlacement(scoreText,parameters) {
		var svg = parameters.svg;
		var bbox = suiTextLayout._getTextBox(scoreText,parameters);
		scoreText.x=parameters.width/2-(bbox.width/2);
		scoreText.y=10;
		scoreText.autoLayout=false;
		suiTextLayout.placeText(scoreText,parameters);
	}
	
	static footerTextPlacement(scoreText,parameters) {
		var svg = parameters.svg;
		var bbox = suiTextLayout._getTextBox(scoreText,parameters);
		scoreText.x=parameters.width/2-(bbox.width/2);
		scoreText.y=parameters.height-(bbox.height+10);
		scoreText.autoLayout=false;
		suiTextLayout.placeText(scoreText,parameters);
	}
	
	static copyrightTextPlacement(scoreText,parameters) {
		var svg = parameters.svg;
		var bbox = suiTextLayout._getTextBox(scoreText,parameters);
		scoreText.x=parameters.width-(bbox.width+10);
		scoreText.y=10;
		suiTextLayout.placeText(scoreText,parameters);
		scoreText.autoLayout=false;
	}
	
	static placeText(scoreText,parameters) {
		var svg = parameters.svg;
		if (scoreText.width && scoreText.height && scoreText.boxModel == SmoScoreText.boxModels.wrap) {
    		suiTextLayout.placeWithWrap(scoreText,parameters);
		} else {
			var el = svgHelpers.placeSvgText(svg,scoreText.toSvgAttributes(),scoreText.classes,scoreText.text);	
            suiTextLayout._saveBox(scoreText,parameters,el);
		}
	}
	
	
	static _placeWithWrap(scoreText,parameters,justification) {
		var justifyOnly=false;
		if (!justification.length) {
			justifyOnly=true;
		}
		var svg = parameters.svg;
		var words = scoreText.text.split(' ');		
		var curx = scoreText.x;
		var left = curx;
		var right = scoreText.x+scoreText.width;
		var top = scoreText.y;
		var params = scoreText.backupParams();
		var cury = scoreText.y;
		var width=	scoreText.width;
		var height = scoreText.height;
		var delta = 0;
		params.boxModel = SmoScoreText.boxModels.none;
		params.width=0;
		params.height = 0;
		scoreText.logicalBox=svgHelpers.boxPoints(scoreText.x,scoreText.y,scoreText.width,scoreText.height);
		scoreText.renderedBox = svgHelpers.logicalToClient(svg,scoreText.logicalBox);
		var justifyAmount = justifyOnly ? 0 : justification[0];
		if(!justifyOnly) {
		    justification.splice(0,1);
		}
		
		words.forEach((word) => {
			var bbox = svgHelpers.getTextBox(svg,SmoScoreText.toSvgAttributes(params),scoreText.classes,word);
			delta = right - (bbox.width + bbox.x);
			if (delta > 0) {
				params.x=bbox.x;
				params.y=cury;
				if (!justifyOnly) {
                   params.x += justifyAmount;					
				   svgHelpers.placeSvgText(svg,SmoScoreText.toSvgAttributes(params),scoreText.classes,word);
				} 
			} else {
				if (!justifyOnly) {
					justifyAmount = justification[0];
				    justification.splice(0,1);
				} else {
					// If we are computing for justification, do that.
					delta = right - bbox.x;
					delta = scoreText.justification === SmoScoreText.justifications.right ? delta :
					    (scoreText.justification === SmoScoreText.justifications.center ? delta/2 : 0);
					justification.push(delta);
				}
				cury += bbox.height;
				curx = left;
				params.x=curx + justifyAmount;
				params.y=cury;
				if (!justifyOnly) {
				    svgHelpers.placeSvgText(svg,SmoScoreText.toSvgAttributes(params),scoreText.classes,word);
				}
			}
			curx += bbox.width + 5;
			params.x = curx;
			// calculate delta in case this is last time			
			delta = right - curx; 
		});	
		delta = scoreText.justification === SmoScoreText.justifications.right ? delta :
					    (scoreText.justification === SmoScoreText.justifications.center ? delta/2 : 0);
        justification.push(delta-5);		
	}
	static placeWithWrap(scoreText,parameters) {
		var justification=[];
		
		// One pass is to compute justification for the box model.
		suiTextLayout._placeWithWrap(scoreText,parameters,justification);
		suiTextLayout._placeWithWrap(scoreText,parameters,justification);
	}

};


// ## editSvgText
// A class that implements very basic text editing behavior in an svg text node
class editSvgText {
    constructor(params) {
        this.target = params.target;
        var ns = svgHelpers.namespace;
        this.layout = params.layout;
        this.fontInfo = params.fontInfo;
		this.svg = document.createElementNS(ns, 'svg');
        this.editText = document.createElementNS(ns, 'text');
        this.attrAr = [];

        // create a mirror of the node under edit by copying attributes
        // and setting up a similarly-dimensioned viewbox
        editSvgText.textAttrs.forEach((attr) => {
			if (this.target.attributes[attr]) {
         		var val = this.target.attributes[attr].value;
				this.editText.setAttributeNS('',attr,val);
				this.attrAr.push(JSON.parse('{"'+attr+'":"'+val+'"}'));
			}
        });
        this.editing = this.running=false;

        // Hide the original - TODO, handle non-white background.
        this.oldFill = this.target.getAttributeNS(null,'fill');
        this.target.setAttributeNS(null,'fill','#fff');

        this.editText.textContent=this.target.textContent;
        this._value = this.editText.textContent;
        this.clientBox = svgHelpers.smoBox(svgHelpers.smoBox(this.target.getBoundingClientRect()));
        var svgBox = svgHelpers.smoBox(this.target.getBBox());
        this.editText.setAttributeNS('','y',svgBox.height);

        $('.textEdit').html('');
        this.svg.appendChild(this.editText);
        var b = htmlHelpers.buildDom;
        var r = b('span').classes('hide icon-move');
        $('.textEdit').append(r.dom());
        $('.textEdit').append(this.svg);
        $('.textEdit').removeClass('hide').attr('contentEditable','true');
        this.setEditorPosition(this.clientBox,svgBox);
    }

    setEditorPosition(clientBox,svgBox) {
        var box = svgHelpers.pointBox(this.layout.pageWidth, this.layout.pageHeight);
        svgHelpers.svgViewport(this.svg, box.x, box.y,this.layout.svgScale);

        $('.textEdit').css('top',this.clientBox.y-5)
          .css('left',this.clientBox.x-5)
          .width(this.clientBox.width+10)
          .height(this.clientBox.height+10);
    }

    endSession() {
        this.editing = false;
        this.target.setAttributeNS(null,'fill',this.oldFill);
    }

    get value() {
        return this._value;
    }

    /* moveCursorToEnd() {
       if (this.editText.getNumberOfChars() < 1)
           return;
       var content = this.editText.textContent;
       this.editText.textContent = content+content.substr(content.length-1,1);
       this.editText.selectSubString(content.length,1);
    }  */

    _updateText() {
        $('.textEdit').focus();

        if (this.editText.textContent &&
         this.editText.textContent.length &&
           this._value != this.editText.textContent) {
          // if (this.editText[0]
          // this.editText.textContent = this.editText.textContent.replace(' ','');
          /* if (this.editText.textContent.length > 1 &&
              this.editText.textContent[this.editText.textContent.length - 1] == '_') {
            this.editText.textContent = this.editText.textContent.substr(0,this.editText.textContent.length - 1);
            var self = this;
            setTimeout(function() {
                self.moveCursorToEnd();
            },1);
          }  */
          this.target.textContent = this._value = this.editText.textContent;
          this._value = this.target.textContent;
          var fontAttr = svgHelpers.fontIntoToSvgAttributes(this.fontInfo);
          var svgBox = svgHelpers.getTextBox(this.svg,this.attrAr,null,this._value);
          var nbox = svgHelpers.logicalToClient(this.svg,svgBox);
          if (nbox.width > this.clientBox.width) {
             this.clientBox.width = nbox.width + nbox.width*.3;
             this.clientBox.height = nbox.height;
             this.setEditorPosition(this.clientBox,svgBox);
           }
        }
        if (!this.editText.textContent) {
           this.editText.textContent='\xa0';
        }
    }

    startSessionPromise() {
        var self=this;
        $('body').addClass('text-edit');

        this.editing=true;
        this.running = true;
        const promise = new Promise((resolve, reject) => {
            function editTimer() {
                setTimeout(function() {
                    self._updateText();
                    if (self.editing) {
                      editTimer();
                    } else {
                      self._updateText();
                      resolve();
                    }
                },25);

            }
            editTimer();
		});

        return promise;
    }

    static get textAttrs() {
        return ['font-size','font-family','font-weight','fill','transform'];
    }
}

class editLyricSession {
	static get states() {
        return {stopped:0,started:1,minus:2,space:3,backSpace:4,stopping:5};
    }
	// tracker, selection, controller
    constructor(parameters) {
        this.tracker = parameters.tracker;
        this.selection = parameters.selection;
        this.controller = parameters.controller;
        this.verse=parameters.verse;
		this.bound = false;
        this.state=editLyricSession.states.stopped;
    }

    detach() {
        this.editor.endSession();
        this.state = editLyricSession.states.stopping;
		window.removeEventListener("keydown", this.keydownHandler, true);
        if (this.selection) {
            this.selection.measure.changed=true;
        }
    }

    detachPromise() {
        var self=this;
        return new Promise((resolve) => {
            var waiter = () => {
            setTimeout(() => {
                if (self.state == editLyricSession.states.stopping ||
                 self.state == editLyricSession.states.stopped) {
                     resolve();
                 } else {
                     waiter();
                 }

                },50);
            };
            waiter();
        });
    }

    _lyricAddedPromise() {
        var self=this;
        return new Promise((resolve) => {
            var checkAdd = function() {
                setTimeout(function() {
                    self.textElement = $(self.tracker.layout.svg).find('#'+self.selection.note.renderId).find('g.lyric-'+self.lyric.verse)[0];
                    if (self.textElement) {
                        resolve();
                    } else {
                        checkAdd();
                    }
                },50);
            }
            checkAdd();
        });
    }

    // ### _editCurrentLyric
    // If this is a new lyric, we need to maybe wait for it to be rendered.
    _editCurrentLyric() {
        this.textElement = $(this.tracker.layout.svg).find('#'+this.selection.note.renderId).find('g.lyric-'+this.lyric.verse)[0];
        this.editor = new editSvgText({target:this.textElement,layout:this.tracker.layout,fontInfo:this.fontInfo});
        this.state = editLyricSession.states.started;
        var self = this;
        function handleSkip() {
            self._handleSkip();
        }

        this.editor.startSessionPromise().then(handleSkip);
    }

	_editingSession() {
        var self = this;
		if (!this.bound) {
			this.bindEvents();
		}
        function editCurrent() {
            self._editCurrentLyric();
        }
        this._lyricAddedPromise().then(editCurrent);
	}

    _getOrCreateLyric(note) {
        var lyrics =  note.getLyricForVerse(this.verse);
        if (!lyrics.length) {
			this.lyric = new SmoLyric({text:'\xa0',verse:this.verse});
        } else {
			this.lyric = lyrics[0];
		}
    }

    _handleSkip() {
        // var tag = this.state == editLyricSession.states.minus ? '-' :'';
        this.lyric.text = this.editor.value;
        this.selection.measure.changed = true;
        if (this.state != editLyricSession.states.stopping) {
			var func = (this.state == editLyricSession.states.backSpace) ? 'lastNoteSelection' : 'nextNoteSelection';
            var sel = SmoSelection[func](
		      this.tracker.layout.score, this.selection.selector.staff,
              this.selection.selector.measure, this.selection.selector.voice, this.selection.selector.tick);
            if (sel) {
                this.selection=sel;
                this._getOrCreateLyric(this.selection.note);
                this.editNote();
            }
        } else {
            this.detach();
        }
    }
    _lyricRenderedPromise() {

    }
    editNote() {
		var self=this;
		function _startEditing() {
			self._editingSession();
		}
        this._getOrCreateLyric(this.selection.note)
		this.fontInfo = JSON.parse(JSON.stringify(this.lyric.fontInfo));
        this.selection.note.addLyric(this.lyric);
        this.selection.measure.changed = true;
        this.tracker.replaceSelectedMeasures();
		_startEditing();
        return this.detachPromise();
    }

	handleKeydown(event) {
		console.log("Lyric KeyboardEvent: key='" + event.key + "' | code='" +
			event.code + "'"
			 + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");

		if (['Space', 'Minus'].indexOf(event.code) >= 0) {
			this.state =  (event.key == '-') ? editLyricSession.states.minus :  editLyricSession.states.space;
			this.state = (this.state === editLyricSession.states.space && event.shiftKey)
			     ? editLyricSession.states.backSpace :  this.state;
            this.editor.endSession();
		}

		if (event.code == 'Escape') {
            this.state = editLyricSession.states.stopping;
            this.editor.endSession();
		}
        this.selection.measure.changed=true;
	}

    bindEvents() {
		var self = this;
        this.controller.detach();

		if (!this.bound) {
			this.keydownHandler = this.handleKeydown.bind(this);

			window.addEventListener("keydown", this.keydownHandler, true);
			this.bound = true;
		}
		this.bound = true;
	}
}
;

class suiEditor {
    constructor(params) {
        Vex.Merge(this, params);
        this.slashMode = false;
    }

	tempoDialog() {
		SuiTempoDialog.createAndDisplay(null,null,this.controller);
	}

    // ## _render
    // utility function to render the music and update the tracker map.
    _render() {
		this.tracker.replaceSelectedMeasures();
    }

	_refresh() {
		this.layout.setRefresh();
	}

    get score() {
        return this.layout.score;
    }

    _renderAndAdvance() {
		this.tracker.moveSelectionRight(null,true);
		this.tracker.replaceSelectedMeasures();
    }
    _rebeam() {
        this.tracker.getSelectedMeasures().forEach((measure) => {
            smoBeamerFactory.applyBeams(measure);
        });
    }
    _batchDurationOperation(operation) {
        SmoUndoable.batchDurationOperation(this.layout.score, this.tracker.selections, operation, this.undoBuffer);
        this._rebeam();
        this._render();
    }

	scoreSelectionOperation(selection,name,parameters,description) {
		SmoUndoable.scoreSelectionOp(this.layout.score,selection,name,parameters,
			    this.undoBuffer,description);
		this._render();

	}
	scoreOperation(name,parameters,description) {
		SmoUndoable.scoreOp(this.layout.score,name,parameters,this.undoBuffer,description);
		this._render();
	}

    _selectionOperation(selection, name, parameters) {
        if (parameters) {
            SmoUndoable[name](selection, parameters, this.undoBuffer);
        } else {
            SmoUndoable[name](selection, this.undoBuffer);
        }
		selection.measure.setChanged();
    }

    undo() {
        this.layout.undo(this.undoBuffer);
    }

    _singleSelectionOperation(name, parameters) {
        if (this.tracker.selections.length != 1) {
            return;
        }
        var selection = this.tracker.selections[0];
        if (parameters) {
            SmoUndoable[name](selection, parameters, this.undoBuffer);
        } else {
            SmoUndoable[name](selection, this.undoBuffer);
        }
        suiOscillator.playSelectionNow(selection);
        this._rebeam();
        this._render();
    }

    _transpose(selection, offset, playSelection) {
        this._selectionOperation(selection, 'transpose', offset);
        if (playSelection) {
            suiOscillator.playSelectionNow(selection);
        }
    }

    copy() {
        if (this.tracker.selections.length < 1) {
            return;
        }
        this.pasteBuffer.setSelections(this.layout.score, this.tracker.selections);
    }
    paste() {
        if (this.tracker.selections.length < 1) {
            return;
        }

        SmoUndoable.pasteBuffer(this.layout.score, this.pasteBuffer, this.tracker.selections, this.undoBuffer, 'paste')
        this._rebeam();
        this._refresh();
    }
    toggleBeamGroup() {
        if (this.tracker.selections.length < 1) {
            return;
        }
        SmoUndoable.toggleBeamGroups(this.tracker.selections, this.undoBuffer);
        this._rebeam();
        this._render();
    }

    beamSelections() {
        if (this.tracker.selections.length < 1) {
            return;
        }
        SmoUndoable.beamSelections(this.tracker.selections, this.undoBuffer);
        this._rebeam();
        this._render();
    }
    toggleBeamDirection() {
        if (this.tracker.selections.length < 1) {
            return;
        }
        SmoUndoable.toggleBeamDirection(this.tracker.selections, this.undoBuffer);
        this._render();
    }

    collapseChord() {
        SmoUndoable.noop(this.layout.score, this.undoBuffer);
        this.tracker.selections.forEach((selection) => {
            var p = selection.note.pitches[0];
            p = JSON.parse(JSON.stringify(p));
            selection.note.pitches = [p];
        });
        this._render();
    }

    playScore() {
        var mm = this.tracker.getExtremeSelection(-1);
        if (suiAudioPlayer.playingInstance && suiAudioPlayer.playingInstance.paused) {
            suiAudioPlayer.playingInstance.play();
            return;
        }

        new suiAudioPlayer({score:this.layout.score,startIndex:mm.selector.measure,tracker:this.tracker}).play();
    }

    stopPlayer() {
        suiAudioPlayer.stopPlayer();
    }
    pausePlayer() {
        suiAudioPlayer.pausePlayer();
    }

    intervalAdd(interval, direction) {
        this._singleSelectionOperation('interval', direction * interval);
    }

    interval(keyEvent) {
        if (this.tracker.selections.length != 1)
            return;
        // code='Digit3'
        var interval = parseInt(keyEvent.keyCode) - 49;  // 48 === '0', 0 indexed
        if (isNaN(interval) || interval < 1 || interval > 7) {
            return;
        }
        this.intervalAdd(interval, keyEvent.shiftKey ? -1 : 1);
    }

    transpose(offset) {
        var grace = this.tracker.getSelectedGraceNotes();
        if (grace.length) {
            grace.forEach((artifact) => {
                SmoUndoable.transposeGraceNotes(artifact.selection,{modifiers:artifact.modifier,offset:offset},this.undoBuffer);
            });

            return;
        }
        // If there are lots of selections, just play the first note
        var playSelection = true;
        this.tracker.selections.forEach((selected) => {
            this._transpose(selected, offset, playSelection);
            playSelection = false;
        });
        this._render();
    }
    transposeDown() {
        this.transpose(-1);
    }
    transposeUp() {
        this.transpose(1);
    }
    upOctave() {
        this.transpose(12);
    }
    downOctave() {
        this.transpose(-12);
    }
    makeRest() {
        this.tracker.selections.forEach((selection) => {
            this._selectionOperation(selection,'makeRest');
        });
    }

    _setPitch(selected, letter) {
        var selector = selected.selector;
        var hintSel = SmoSelection.lastNoteSelection(this.layout.score,
                selector.staff, selector.measure, selector.voice, selector.tick);
        if (!hintSel) {
            hintSel = SmoSelection.nextNoteSelection(this.layout.score,
                    selector.staff, selector.measure, selector.voice, selector.tick);
        }

        var hintNote = hintSel.note;
        var hpitch = hintNote.pitches[0];
        var pitch = JSON.parse(JSON.stringify(hpitch));
        pitch.letter = letter;

        // Make the key 'a' make 'Ab' in the key of Eb, for instance
        var vexKsKey = smoMusic.getKeySignatureKey(letter, selected.measure.keySignature);
        if (vexKsKey.length > 1) {
            pitch.accidental = vexKsKey[1];
        } else {
            pitch.accidental = 'n';
        }

        // make the octave of the new note as close to previous (or next) note as possible.
        var upv = ['bc', 'ac', 'bd', 'da', 'be', 'gc'];
        var downv = ['cb', 'ca', 'db', 'da', 'eb', 'cg'];
        var delta = hpitch.letter + pitch.letter;
        if (upv.indexOf(delta) >= 0) {
            pitch.octave += 1;
        }
        if (downv.indexOf(delta) >= 0) {
            pitch.octave -= 1;
        }
        SmoUndoable['setPitch'](selected, pitch, this.undoBuffer);
        suiOscillator.playSelectionNow(selected);
    }

    setPitchCommand(letter) {
        this.tracker.selections.forEach((selected) => this._setPitch(selected, letter));
        this._renderAndAdvance();
    }

    setPitch(keyEvent) {
        this.setPitchCommand(keyEvent.key.toLowerCase());
    }

    dotDuration(keyEvent) {
        this._batchDurationOperation('dotDuration');
    }

    undotDuration(keyEvent) {
        this._batchDurationOperation('undotDuration');
    }

    doubleDuration(keyEvent) {
        var grace = this.tracker.getSelectedGraceNotes();
        if (grace.length) {
            grace.forEach((artifact) => {
                SmoUndoable.doubleGraceNoteDuration(artifact.selection,artifact.modifier,this.undoBuffer);
            });

            return;
        }
        this._batchDurationOperation('doubleDuration');
    }

    halveDuration(keyEvent) {
        var grace = this.tracker.getSelectedGraceNotes();
        if (grace.length) {
            grace.forEach((artifact) => {
                SmoUndoable.halveGraceNoteDuration(artifact.selection,artifact.modifier,this.undoBuffer);
            });

            return;
        }
        this._batchDurationOperation('halveDuration');
    }

    addMeasure(keyEvent) {
        if (this.tracker.selections.length < 1) {
            return;
        }
        var measure = this.tracker.getFirstMeasureOfSelection();
        if (measure) {
            var nmeasure = SmoMeasure.getDefaultMeasureWithNotes(measure);
			var pos = measure.measureNumber.measureIndex;
			if (keyEvent.shiftKey) {
				pos += 1;
			}
            nmeasure.measureNumber.measureIndex = pos;
            nmeasure.setActiveVoice(0);
            SmoUndoable.addMeasure(this.layout.score, pos, nmeasure, this.undoBuffer);
            this.layout.clearLine(measure);
            this._refresh();
        }
    }
	deleteMeasure() {
        if (this.tracker.selections.length < 1) {
            return;
        }
        var selection = this.tracker.selections[0];
        var ix = selection.selector.measure;
        this.layout.score.staves.forEach((staff) => {
            this.layout.unrenderMeasure(staff.measures[ix]);
            this.layout.unrenderMeasure(staff.measures[staff.measures.length-1]);

            // A little hacky - delete the modifiers if they start or end on
            // the measure
            staff.modifiers.forEach((modifier) => {
                if (modifier.startSelector.measure == ix || modifier.endSelector.measure == ix) {
    			    $(this.layout.renderer.getContext().svg).find('g.' + modifier.attrs.id).remove();
                }
    		});
        });
        this.tracker.deleteMeasure(selection);
        // this.layout.unrenderAll();

        SmoUndoable.deleteMeasure(this.layout.score, selection, this.undoBuffer);
        this._refresh();
    }

    toggleCourtesyAccidental() {
        var grace = this.tracker.getSelectedGraceNotes();
        if (grace.length) {
            grace.forEach((artifact) => {
                SmoUndoable.toggleGraceNoteCourtesyAccidental(artifact.selection,{modifiers:artifact.modifier},this.undoBuffer);
            });

            return;
        }
        if (this.tracker.selections.length < 1) {
            return;
        }
        this.tracker.selections.forEach((selection) => {
            SmoUndoable.toggleCourtesyAccidental(selection, this.undoBuffer);
        });
        this._render();
    }
    toggleEnharmonic() {
        this.tracker.selections.forEach((selected) => this._selectionOperation(selected, 'toggleEnharmonic'));
        this._render();
    }

    rerender(keyEvent) {
        this.layout.unrenderAll();
        SmoUndoable.noop(this.layout.score, this.undoBuffer);
        this.undo();
        this._render();
    }
    makeTupletCommand(numNotes) {
        this._singleSelectionOperation('makeTuplet', numNotes);
    }
    makeTuplet(keyEvent) {
        var numNotes = parseInt(keyEvent.key);
        this.makeTupletCommand(numNotes);
    }

    unmakeTuplet(keyEvent) {
        this._singleSelectionOperation('unmakeTuplet');
    }
    removeGraceNote(keyEvent) {
        this._singleSelectionOperation('removeGraceNote',{index:0});
    }
    addGraceNote(keyEvent) {
        this._singleSelectionOperation('addGraceNote');
    }

    toggleArticulationCommand(articulation, ctor) {
        this.undoBuffer.addBuffer('change articulation ' + articulation,
            'staff', this.tracker.selections[0].selector, this.tracker.selections[0].staff);

        this.tracker.selections.forEach((sel) => {

            if (ctor === 'SmoArticulation') {
                var aa = new SmoArticulation({
                    articulation: articulation
                });
               SmoOperation.toggleArticulation(sel, aa);
            } else {
                var aa = new SmoOrnament({
                    ornament: articulation
                });
               SmoOperation.toggleOrnament(sel, aa);
            }
        });
        this._render();
    }

    addRemoveArticulation(keyEvent) {
        if (this.tracker.selections.length < 1)
            return;

        var atyp = SmoArticulation.articulations.accent;

        if (keyEvent.key.toLowerCase() === 'h') {
            atyp = SmoArticulation.articulations.accent;
        }
        if (keyEvent.key.toLowerCase() === 'i') {
            atyp = SmoArticulation.articulations.tenuto;
        }
        if (keyEvent.key.toLowerCase() === 'j') {
            atyp = SmoArticulation.articulations.staccato;
        }
        if (keyEvent.key.toLowerCase() === 'k') {
            atyp = SmoArticulation.articulations.marcato;
        }
        if (keyEvent.key.toLowerCase() === 'l') {
            atyp = SmoArticulation.articulations.pizzicato;
        }
        this.toggleArticulationCommand(atyp, 'SmoArticulation');

    }
}
;
class suiMenuBase {
	constructor(params) {
		Vex.Merge(this, params);
        this.focusIndex = -1;
	}

	complete() {
		$('body').trigger('menuDismiss');
	}
}

class suiMenuManager {
	constructor(params) {
		Vex.Merge(this, suiMenuManager.defaults);
		Vex.Merge(this, params);
		this.bound = false;
        this.hotkeyBindings={};
	}

	static get defaults() {
		return {
			menuBind: suiMenuManager.menuKeyBindingDefaults,
			menuContainer: '.menuContainer'
		};
	}

    setController(c) {
        this.controller=c;
    }

    get score() {
        return this.layout.score;
    }

	// ### Description:
	// slash ('/') menu key bindings.  The slash key followed by another key brings up
	// a menu.
	static get menuKeyBindingDefaults() {
		return [{
				event: "keydown",
				key: "k",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "suiKeySignatureMenu"
			}, {
				event: "keydown",
				key: "l",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "suiStaffModifierMenu"
			}, {
				event: "keydown",
				key: "d",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "SuiDynamicsMenu"
			}, {
				event: "keydown",
				key: "s",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "SuiAddStaffMenu"
			}, {
				event: "keydown",
				key: "f",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "SuiFileMenu"
			},
			 {
				event: "keydown",
				key: "t",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "SuiTextMenu"
			},
			 {
				event: "keydown",
				key: "m",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "SuiTimeSignatureMenu"
			}

		];
	}
    _advanceSelection(inc) {
        var options = $('.menuContainer ul.menuElement li.menuOption');
        inc = inc < 0 ? options.length - 1: 1;
        this.menu.focusIndex = (this.menu.focusIndex+inc) % options.length;
        $(options[this.menu.focusIndex]).find('button').focus();
    }

	get menuBindings() {
		return this.menuBind;
	}

	unattach() {
		window.removeEventListener("keydown", this.keydownHandler, true);
		$('body').removeClass('modal');
		$(this.menuContainer).html('');
		$('body').off('dismissMenu');
		this.bound = false;
	}

	attach(el) {
		var b = htmlHelpers.buildDom();

		$(this.menuContainer).html('');
		$(this.menuContainer).attr('z-index', '12');
		var b = htmlHelpers.buildDom;
		var r = b('ul').classes('menuElement').attr('size', this.menu.menuItems.length)
			.css('left', '' + this.menuPosition.x + 'px')
			.css('top', '' + this.menuPosition.y + 'px');
        var hotkey=0;
		this.menu.menuItems.forEach((item) => {
            var vkey = (hotkey < 10) ? String.fromCharCode(48+hotkey) :
                 String.fromCharCode(87 + hotkey) ;

			r.append(
				b('li').classes('menuOption').append(
					b('button').attr('data-value',item.value)
                    .append(b('span').classes('menuText').text(item.text))

					.append(
						b('span').classes('icon icon-' + item.icon))
                     .append(b('span').classes('menu-key').text(''+vkey))));
            item.hotkey=vkey;
            hotkey += 1;
		});
		$(this.menuContainer).append(r.dom());
		$('body').addClass('modal');
		this.bindEvents();
	}
	slashMenuMode() {
		var self = this;
		this.bindEvents();
		this.closeMenuPromise = new Promise((resolve, reject) => {
				$('body').off('menuDismiss').on('menuDismiss', function () {
					self.unattach();
                    $('body').removeClass('slash-menu');
					resolve();
				});

			});
		return this.closeMenuPromise;
	}

	createMenu(action) {
		this.menuPosition = {x:250,y:40,width:1,height:1};
		var ctor = eval(action);
		this.menu = new ctor({
				position: this.menuPosition,
				tracker: this.tracker,
				editor: this.editor,
				score: this.score,
                controller:this.controller,
                closePromise:this.closeMenuPromise
			});
		this.attach(this.menuContainer);
        this.menu.menuItems.forEach((item) => {
            if (typeof(item.hotkey) != 'undefined') {
                this.hotkeyBindings[item.hotkey] = item.value;
            }
        });
	}

	handleKeydown(event) {
		console.log("KeyboardEvent: key='" + event.key + "' | code='" +
			event.code + "'"
			 + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");
		if (['Tab', 'Enter'].indexOf(event.code) >= 0) {
			return;
		}

		event.preventDefault();

		if (event.code === 'Escape') {
			$('body').trigger('menuDismiss');
		}
		if (this.menu) {
            if (event.code == 'ArrowUp') {
                this._advanceSelection(-1);
            }
            else if (event.code == 'ArrowDown') {
                this._advanceSelection(1);
            } else  if (this.hotkeyBindings[event.key]) {
                $('button[data-value="'+this.hotkeyBindings[event.key]+'"]').click();
            } else {
			    this.menu.keydown(event);
            }
		}
		if (this.tracker.selections.length == 0) {
			this.unattach();
			return;
		}

		var binding = this.menuBind.find((ev) => {
				return ev.key === event.key
			});
		if (!binding) {
			return;
		}
		this.createMenu(binding.action);
	}

	bindEvents() {
		var self = this;
        this.hotkeyBindings={};
        $('body').addClass('slash-menu');

		if (!this.bound) {
			this.keydownHandler = this.handleKeydown.bind(this);

			window.addEventListener("keydown", this.keydownHandler, true);
			this.bound = true;
		}
		$(this.menuContainer).find('button').off('click').on('click', function (ev) {
			if ($(ev.currentTarget).attr('data-value') == 'cancel') {
				self.menu.complete();
				return;
			}
			self.menu.selection(ev);
		});
	}
}



class SuiFileMenu extends suiMenuBase {
    constructor(params) {
		params = (params ? params : {});
		Vex.Merge(params, SuiFileMenu.defaults);
		super(params);
	}
     static get defaults() {
		return {
			menuItems: [{
					icon: 'folder-new',
					text: 'New Score',
					value: 'newFile'
				},{
					icon: 'folder-open',
					text: 'Open',
					value: 'openFile'
				},{
					icon: 'folder-save',
					text: 'Save',
					value: 'saveFile'
				},{
					icon: 'folder-save',
					text: 'Quick Save',
					value: 'quickSave'
				},{
					icon: '',
					text: 'Print',
					value: 'printScore'
                },{
					icon: '',
					text: 'Bach Invention',
					value: 'bach'
                },{
					icon: '',
					text: 'Jesu Bambino',
					value: 'bambino'
                },{
					icon: '',
					text: 'Microtone Sample',
					value: 'microtone'
                },	{
					icon: '',
					text: 'Cancel',
					value: 'cancel'
				}
            ]
        };
     }
     selection(ev) {
		var text = $(ev.currentTarget).attr('data-value');
        var self=this;

		if (text == 'saveFile') {
            SuiSaveFileDialog.createAndDisplay({
			layout: this.layout,
            controller:this.controller,
            closeMenuPromise:this.closePromise
		    });
        } else if (text == 'openFile') {
            SuiLoadFileDialog.createAndDisplay({
			layout: this.layout,
            controller:this.controller,
            closeMenuPromise:this.closePromise
		    });
        } else if (text == 'newFile') {
            this.controller.undoBuffer.addBuffer('New Score', 'score', null, this.controller.layout.score);
            var score = SmoScore.getDefaultScore();
            this.controller.layout.score = score;
            setTimeout(function() {
            $('body').trigger('forceResizeEvent');
            },1);
        } else if (text == 'quickSave') {
            var scoreStr = JSON.stringify(this.controller.layout.score.serialize());
            localStorage.setItem(smoSerialize.localScore,scoreStr);
        } else if (text == 'printScore') {
            $('.printFrame').html('');
            var svgDoc = $('#boo svg')[0];
            var s = new XMLSerializer();
            var svgString = s.serializeToString(svgDoc);
            var iframe = document.createElement("iframe");
            var scale = 1.0/this.controller.layout.score.layout.zoomScale;
            var w=Math.round(scale * $('#boo').width());
            var h=Math.round(scale * $('#boo').height());
            $(iframe).attr('width',w);
            $(iframe).attr('height',h);
            iframe.srcdoc=svgString;
            $('body').addClass('printing');
            $('.printFrame')[0].appendChild(iframe);
            $('.printFrame').width(w);
            $('.printFrame').height(h);
            function resize() {
                setTimeout(function() {
                    var svg = $(window.frames[0].document.getElementsByTagName('svg'));
                    if (svg && svg.length) {
                        $(window.frames[0].document.getElementsByTagName('svg')).height(h);
                        $(window.frames[0].document.getElementsByTagName('svg')).width(w);
                        window.print();
                        SuiPrintFileDialog.createAndDisplay({
                            layout: self.controller.tracker.layout,
                            controller:self.controller,
                            closeMenuPromise:self.closePromise,
                            tracker:self.tracker
                            });
                    } else {
                        resize();
                    }
                },50);
            }

            resize();
        }
         else if (text == 'bach') {
			this.controller.undoBuffer.addBuffer('New Score', 'score', null, this.controller.layout.score);
			var score = SmoScore.deserialize(inventionJson);
			this.controller.layout.score = score;
			this.controller.layout.setViewport(true);
		}
        else if (text == 'bambino') {
           this.controller.undoBuffer.addBuffer('New Score', 'score', null, this.controller.layout.score);
           var score = SmoScore.deserialize(jesuBambino);
           this.controller.layout.score = score;
           this.controller.layout.setViewport(true);
       } else if (text == 'microtone') {
          this.controller.undoBuffer.addBuffer('New Score', 'score', null, this.controller.layout.score);
          var score = SmoScore.deserialize(microJson);
          this.controller.layout.score = score;
          this.controller.layout.setViewport(true);
      }
		this.complete();
	}
	keydown(ev) {}

}
class SuiTextMenu extends suiMenuBase {
    	constructor(params) {
		params = (params ? params : {});
		Vex.Merge(params, SuiTextMenu.defaults);
		super(params);
	}
    static get defaults() {
		return {
			menuItems: [{
					icon: '',
					text: 'Title',
					value: 'titleText'
				}, {
					icon: '',
					text: 'Page Header',
					value: 'headerText'
				}, {
					icon: '',
					text: 'Page Footer',
					value: 'footerText'
				}, {
					icon: '',
					text: 'Custom Text',
					value: 'customText'
				}, {
					icon: '',
					text: 'Composer/Copyright',
					value: 'copyrightText'
				}, {
					icon: '',
					text: 'MeasureText',
					value: 'measureText'
				}, {
					icon: '',
					text: 'Rehearsal Mark',
					value: 'rehearsalMark'
				}, {
					icon: '',
					text: 'Tempo',
					value: 'tempoText'
				}, {
					icon: '',
					text: 'Rehearsal Mark',
					value: 'rehearsalMark'
				}, {
                    icon:'',
                    text:'Lyrics',
                    value:'lyrics'
                },
				 {
					icon: '',
					text: 'Cancel',
					value: 'cancel'
				}
			]
		};
	}

    static get menuCommandMap() {
        return {
            titleText: {
                ctor:'SmoScoreText',
                operation:'addScoreText',
                params: {
                    position:'title',
                    text:'Title',
                }
            },
            headerText: {
                ctor:'SmoScoreText',
                operation:'addScoreText',
                params: {
                    position:'header',
                    text:'Header text'
                }
            },
            footerText: {
                ctor:'SmoScoreText',
                operation:'addScoreText',
                params: {
                    position:'header',
                    text:'Header text'
                }
            },
            copyrightText: {
                ctor:'SmoScoreText',
                operation:'addScoreText',
                params: {
                    position:'copyright',
                    text:'Copyright/Composer'
                }
            }
        };
    }
    bind() {
    }
    _editNewText(txtObj) {
        var self = this;
        var createDialog = () => {
            var dialog = SuiTextTransformDialog.createAndDisplay({
                modifier:txtObj,
                tracker:self.tracker,
                undo:self.controller.undoBuffer,
                layout:self.controller.layout
            });
            self.controller.unbindKeyboardForDialog(dialog);
        }



        // Wait for text to be displayed before bringing up edit dialog
        var waitForDisplay = () => {
            return new Promise((resolve) => {
                var waiter = ()  =>{
                    setTimeout(() => {
                        if (txtObj.renderedBox) {
                            resolve();
                        } else {
                            waiter();
                        }
                    },50);
                };
                waiter();
            });
        }

        // Treat a created text score like a selected text score that needs to be edited.
        this.closePromise.then(waitForDisplay).then(createDialog);
    }
    selection(ev) {
        var self = this;
		var command = $(ev.currentTarget).attr('data-value');
        var menuObj = SuiTextMenu.menuCommandMap[command];
        if (menuObj) {
            var ctor = eval(menuObj.ctor);
            var txtObj = new ctor(menuObj.params);
            SmoUndoable.scoreOp(this.editor.score,menuObj.operation,
               txtObj, this.editor.undoBuffer,'Text Menu Command');
            setTimeout(function() {
                self._editNewText(txtObj);
            },1);
        }

		this.complete();
	}
    keydown(ev) {}
}
class SuiDynamicsMenu extends suiMenuBase {
	constructor(params) {
		params = (params ? params : {});
		Vex.Merge(params, SuiDynamicsMenu.defaults);
		super(params);
	}
	static get defaults() {
		return {
			menuItems: [{
					icon: 'pianissimo',
					text: 'Pianissimo',
					value: 'pp'
				}, {
					icon: 'piano',
					text: 'Piano',
					value: 'p'
				}, {
					icon: 'mezzopiano',
					text: 'Mezzo-piano',
					value: 'mp'
				}, {
					icon: 'mezzoforte',
					text: 'Mezzo-forte',
					value: 'mf'
				}, {
					icon: 'forte',
					text: 'Forte',
					value: 'f'
				}, {
					icon: 'fortissimo',
					text: 'Fortissimo',
					value: 'ff'
				}, {
					icon: 'sfz',
					text: 'sfortzando',
					value: 'sfz'
				},
				 {
					icon: '',
					text: 'Cancel',
					value: 'cancel'
				}
			]
		};
	}

	selection(ev) {
		var text = $(ev.currentTarget).attr('data-value');

		var ft = this.tracker.getExtremeSelection(-1);
		if (!ft || !ft.note) {
			return;
		}

		SmoUndoable.addDynamic(ft, new SmoDynamicText({
				selector: ft.selector,
				text: text,
				yOffsetLine: 11,
				fontSize: 38
			}), this.editor.undoBuffer);
		this.complete();
	}
	keydown(ev) {}
}

class SuiTimeSignatureMenu extends suiMenuBase {
    constructor(params) {
		params = (params ? params : {});
		Vex.Merge(params, SuiTimeSignatureMenu.defaults);
		super(params);
	}
    static get defaults() {
		return {
			menuItems: [{
					icon: 'sixeight',
					text: '6/8',
					value: '6/8',
				},{
					icon: 'threefour',
					text: '3/4',
					value: '3/4',
				},{
					icon: 'twofour',
					text: '2/4',
					value: '2/4',
				},{
					icon: 'twelveeight',
					text: '12/8',
					value: '12/8',
				},{
					icon: 'seveneight',
					text: '7/8',
					value: '7/8',
				},{
					icon: 'fiveeight',
					text: '5/8',
					value: '5/8',
				},{
					icon: '',
					text: 'Other',
					value: 'Other',
				},{
					icon: '',
					text: 'Cancel',
					value: 'cancel'
				}
                ]
        };
    }

    selection(ev) {
        var text = $(ev.currentTarget).attr('data-value');

        if (text == 'Other') {
                SuiTimeSignatureDialog.createAndDisplay({
    			layout: this.layout,
                controller:this.controller,
                closeMenuPromise:this.closePromise
    		    });
                this.complete();
                return;
        }
		var timeSig = $(ev.currentTarget).attr('data-value');
        this.controller.layout.unrenderAll();
        SmoUndoable.scoreSelectionOp(this.controller.layout.score,this.tracker.selections,
            'setTimeSignature',timeSig,this.controller.undoBuffer,'change time signature');
        this.controller.tracker.layout.setRefresh();
		this.complete();
	}
	keydown(ev) {}
}
class suiKeySignatureMenu extends suiMenuBase {

	constructor(params) {
		params = (params ? params : {});
		Vex.Merge(params, suiKeySignatureMenu.defaults);
		super(params);
	}
	static get defaults() {
		return {
			menuItems: [{
					icon: 'key-sig-c',
					text: 'C Major',
					value: 'C',
				}, {
					icon: 'key-sig-f',
					text: 'F Major',
					value: 'F',
				}, {
					icon: 'key-sig-g',
					text: 'G Major',
					value: 'G',
				}, {
					icon: 'key-sig-bb',
					text: 'Bb Major',
					value: 'Bb'
				}, {
					icon: 'key-sig-d',
					text: 'D Major',
					value: 'D'
				}, {
					icon: 'key-sig-eb',
					text: 'Eb Major',
					value: 'Eb'
				}, {
					icon: 'key-sig-a',
					text: 'A Major',
					value: 'A'
				}, {
					icon: 'key-sig-ab',
					text: 'Ab Major',
					value: 'Ab'
				}, {
					icon: 'key-sig-e',
					text: 'E Major',
					value: 'E'
				}, {
					icon: 'key-sig-bd',
					text: 'Db Major',
					value: 'Db'
				}, {
					icon: 'key-sig-b',
					text: 'B Major',
					value: 'B'
				}, {
					icon: 'key-sig-fs',
					text: 'F# Major',
					value: 'F#'
				}, {
					icon: 'key-sig-cs',
					text: 'C# Major',
					value: 'C#'
				},
				 {
					icon: '',
					text: 'Cancel',
					value: 'cancel'
				}
			],
			menuContainer: '.menuContainer'
		};
	}

	selection(ev) {
		var keySig = $(ev.currentTarget).attr('data-value');
		var changed = [];
		this.tracker.selections.forEach((sel) => {
			if (changed.indexOf(sel.selector.measure) === -1) {
				changed.push(sel.selector.measure);
				SmoUndoable.addKeySignature(this.score, sel, keySig, this.editor.undoBuffer);
			}
		});
		this.complete();
	}
	keydown(ev) {}

}

class suiStaffModifierMenu extends suiMenuBase {

	constructor(params) {
		params = (params ? params : {});
		Vex.Merge(params, suiStaffModifierMenu.defaults);
		super(params);
	}
	static get defaults() {
		return {
			menuItems: [{
					icon: 'cresc',
					text: 'Crescendo',
					value: 'crescendo'
				}, {
					icon: 'decresc',
					text: 'Decrescendo',
					value: 'decrescendo'
				}, {
					icon: 'slur',
					text: 'Slur/Tie',
					value: 'slur'
				}, {
					icon: 'ending',
					text: 'nth ending',
					value: 'ending'
				},
				 {
					icon: '',
					text: 'Cancel',
					value: 'cancel'
				}
			],
			menuContainer: '.menuContainer'
		};
	}
	selection(ev) {
		var op = $(ev.currentTarget).attr('data-value');

		var ft = this.tracker.getExtremeSelection(-1);
		var tt = this.tracker.getExtremeSelection(1);

		if (op === 'ending') {
           SmoUndoable.scoreOp(this.score,'addEnding',
		       new SmoVolta({startBar:ft.selector.measure,endBar:tt.selector.measure,number:1}),this.editor.undoBuffer,'add ending');
		    this.complete();
			return;
		}
		if (SmoSelector.sameNote(ft.selector, tt.selector)) {
			this.complete();
			return;
		}

		SmoUndoable[op](ft, tt, this.editor.undoBuffer);
        this.tracker.replaceSelectedMeasures();
		this.complete();
	}
	keydown(ev) {}
}

class SuiAddStaffMenu extends suiMenuBase {
	constructor(params) {
		params = (params ? params : {});
		Vex.Merge(params, SuiAddStaffMenu.defaults);
		super(params);
	}
	static get defaults() {
		return {
			menuItems: [{
					icon: 'treble',
					text: 'Treble Clef Staff',
					value: 'trebleInstrument'
				}, {
					icon: 'bass',
					text: 'Bass Clef Staff',
					value: 'bassInstrument'
				}, {
					icon: 'alto',
					text: 'Alto Clef Staff',
					value: 'altoInstrument'
				}, {
					icon: 'tenor',
					text: 'Tenor Clef Staff',
					value: 'tenorInstrument'
				}, {
					icon: 'cancel-circle',
					text: 'Remove Staff',
					value: 'remove'
				},
				 {
					icon: '',
					text: 'Cancel',
					value: 'cancel'
				}
			],
			menuContainer: '.menuContainer'
		};
	}
	static get instrumentMap() {
		return {
			'trebleInstrument': {
				instrumentInfo: {
					instrumentName: 'Treble Clef Staff',
					keyOffset: 0,
					clef: 'treble'
				}
			},
			'bassInstrument': {
				instrumentInfo: {
					instrumentName: 'Bass Clef Staff',
					keyOffset: 0,
					clef: 'bass'
				}
			},
			'altoInstrument': {
				instrumentInfo: {
					instrumentName: 'Alto Clef Staff',
					keyOffset: 0,
					clef: 'alto'
				}
			},
			'tenorInstrument': {
				instrumentInfo: {
					instrumentName: 'Tenor Clef Staff',
					keyOffset: 0,
					clef: 'tenor'
				}
			},
			'remove': {
				instrumentInfo: {
					instrumentName: 'Remove clef',
					keyOffset: 0,
					clef: 'tenor'
				}
			}
		}

	}
	selection(ev) {
		var op = $(ev.currentTarget).attr('data-value');
		if (op == 'remove') {
			if (this.score.staves.length > 1 && this.tracker.selections.length > 0) {
				this.tracker.layout.unrenderAll();
				SmoUndoable.removeStaff(this.score, this.tracker.selections[0].selector.staff, this.editor.undoBuffer);
				this.tracker.layout.setRefresh();
			}

		} else if (op === 'cancel') {
			this.complete();
		}else {
			var instrument = SuiAddStaffMenu.instrumentMap[op];
			SmoUndoable.addStaff(this.score, instrument, this.editor.undoBuffer);
			this.tracker.layout.setRefresh();
		}
		this.complete();
	}
	keydown(ev) {}

}
;
// ## utController
// a simple controller object to render the unit test cases.
class utController {

	constructor(params) {

		Vex.Merge(this, utController.defaults);
		Vex.Merge(this, params);
		this.bindEvents();
		this.undoBuffer = new UndoBuffer();
        this.layoutDemon.undoBuffer = this.undoBuffer;
        this.exhandler = new SuiExceptionHandler(this);

        this.layoutDemon.startDemon();
	}

	static createUi(score, title) {
		utController.createDom();
		if (title) {
			$('h1.testTitle').text(title);
		}
		var params = {};
		params.layout = suiScoreLayout.createScoreLayout($('#boo')[0],null, score);
        params.scroller = new suiScroller();
		params.tracker = new suiTracker(params.layout,params.scroller);
        params.layoutDemon = new SuiLayoutDemon(params);
		// params.tracker = new suiTracker(params.layout);
		params.score = score;
		// params.editor = new suiEditor(params);
		// params.menus = new suiMenuManager(params);
		var keys = new utController(params);
		var h =  window.innerHeight - $('.musicRelief').offset().top;
		$('.musicRelief').css('height',''+h+'px');
		return keys;
	}

	static createDom() {
		var b = htmlHelpers.buildDom;
		$('#smoo').html('');
		var r = b('div').classes('dom-container')
			.append(b('div').classes('modes'))
			.append(b('div').classes('overlay'))
			.append(b('div').classes('attributeDialog'))
			.append(b('div').classes('helpDialog'))
			.append(b('div').classes('menuContainer'))
			.append(b('h1').classes('testTitle').text('Smoosic'))
			.append(b('h2').classes('subTitle'))
			.append(b('div').classes('piano-container')
				.append(b('div').classes('piano-keys')))
			.append(b('div').classes('workspace-container')
				.append(b('div').classes('workspace')
					.append(b('div').classes('controls-top'))
					.append(b('div').classes('controls-left'))
					.append(b('div').classes('musicRelief')
						.append(b('div').classes('musicContainer').attr('id', 'boo')))));
		$('#smoo').append(r.dom());
	}

	get renderElement() {
		return this.layout.renderElement;
	}

	static get defaults() {
		return {};
	}

	detach() {
		this.layout = null;
	}

	render() {
        var ix = 0;
        this.layout.setRefresh();
		while(this.layout.dirty) {
            this.layout.render();
            ix += 1;
            if (ix>20)
                break;
        }
	}

	bindEvents() {}

}
;
class SuiExceptionHandler {
    constructor(params) {
        this.tracker = params.tracker;
        this.layout = params.layout;
        this.score = params.score;
        this.undoBuffer = params.undoBuffer;
        this.thrown = false;
		SuiExceptionHandler._instance = this;
    }
	static get instance() {
		return SuiExceptionHandler._instance;
	}
    exceptionHandler(e) {
        var self = this;
        if (window['suiController'] && window['suiController'].reentry) {
            return;
        }

        if (window['suiController']) {
            suiController.reentry = true;
        }
        var scoreString = 'Could not serialize score.';
        try {
            scoreString = this.score.serialize();
        } catch (e) {
            scoreString += ' ' + e.message;
        }
        var message = e.message;
        var stack = 'No stack trace available';

        try {
            if (e.error && e.error.stack) {
                stack = e.error.stack;
            } else if (e['stack']) {
				stack = e.stack;
			}
        } catch (e2) {
            stack = 'Error with stack: ' + e2.message;
        }
        var doing = 'Last operation not available.';

        var lastOp = this.undoBuffer.peek();
        if (lastOp) {
            doing = lastOp.title;
        }
        var url = 'https://github.com/AaronDavidNewman/Smoosic/issues';
        var bodyObject = JSON.stringify({
                message: message,
                stack: stack,
                lastOperation: doing,
                scoreString: scoreString
            }, null, ' ');

        var b = htmlHelpers.buildDom;
        var r = b('div').classes('bug-modal').append(
                b('img').attr('src', '../styles/images/logo.png').classes('bug-logo'))
            .append(b('button').classes('icon icon-cross bug-dismiss-button'))
            .append(b('span').classes('bug-title').text('oh nooooo!  You\'ve found a bug'))
            .append(b('p').text('It would be helpful if you would submit a bug report, and copy the data below into an issue'))
            .append(b('div')
                .append(b('textarea').attr('id', 'bug-text-area').text(bodyObject))
                .append(
                    b('div').classes('button-container').append(b('button').classes('bug-submit-button').text('Submit Report'))));

        $('.bugDialog').html('');
        $('.bugDialog').append(r.dom());

        $('.bug-dismiss-button').off('click').on('click', function () {
            $('body').removeClass('bugReport');
            if (lastOp) {
                self.undoBuffer.undo(self.score);
                self.layout.render();
                suiController.reentry = false;
            }
        });
        $('.bug-submit-button').off('click').on('click', function () {
            var data = {
                title: "automated bug report",
                body: encodeURIComponent(bodyObject)
            };
            $('#bug-text-area').select();
            document.execCommand('copy');
            window.open(url, 'Report Smoosic issues');
        });
        $('body').addClass('bugReport');
        if (!this.thrown) {
            this.thrown = true;
            throw(e);
        }

    }
}
;class defaultEditorKeys {

	static get keys() {
		return [{
				event: "keydown",
				key: "=",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "transposeUp"
			}, {
				event: "keydown",
				key: "-",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "transposeDown"
			}, {
				event: "keydown",
				key: "+",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "upOctave"
			}, {
				event: "keydown",
				key: "_",
				ctrlKey:false,
				altKey: false,
				shiftKey: true,
				action: "downOctave"
			}, {
				event: "keydown",
				key: "F",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "toggleCourtesyAccidental"
			}, {
				event: "keydown",
				key: ".",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "doubleDuration"
			}, {
				event: "keydown",
				key: ",",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "halveDuration"
			}, {
				event: "keydown",
				key: ">",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "dotDuration"
			}, {
				event: "keydown",
				key: "<",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "undotDuration"
			}, {
				event: "keydown",
				key: "a",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "setPitch"
			}, {
				event: "keydown",
				key: "b",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "setPitch"
			}, {
				event: "keydown",
				key: "G",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "addGraceNote"
			}, {
				event: "keydown",
				key: "g",
				ctrlKey: false,
				altKey: true,
				shiftKey: false,
				action: "removeGraceNote"
			}, {
				event: "keydown",
				key: "c",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "setPitch"
			}, {
				event: "keydown",
				key: "d",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "setPitch"
			}, {
				event: "keydown",
				key: "e",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "setPitch"
			}, {
				event: "keydown",
				key: "f",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "setPitch"
			}, {
				event: "keydown",
				key: "g",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "setPitch"
			}, {
				event: "keydown",
				key: "r",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "makeRest"
			}, {
				event: "keydown",
				key: "r",
				ctrlKey: false,
				altKey: true,
				shiftKey: false,
				action: "rerender"
			}, {
				event: "keydown",
				key: "p",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "playScore"
			}, {
				event: "keydown",
				key: "P",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "pausePlayer"
			},
            {
				event: "keydown",
				key: "s",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "stopPlayer"
			},             {
				event: "keydown",
				key: "t",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "tempoDialog"
			}, 
			{
				event: "keydown",
				key: "3",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "makeTuplet"
			}, {
				event: "keydown",
				key: "5",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "makeTuplet"
			}, {
				event: "keydown",
				key: "7",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "makeTuplet"
			},
			// interval commands
			{
				event: "keydown",
				key: "2",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "interval"
			}, {
				event: "keydown",
				key: "3",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "interval"
			}, {
				event: "keydown",
				key: "4",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "interval"
			}, {
				event: "keydown",
				key: "5",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "interval"
			}, {
				event: "keydown",
				key: "6",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "interval"
			}, {
				event: "keydown",
				key: "7",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "interval"
			}, {
				event: "keydown",
				key: "8",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "interval"
			}, {
				event: "keydown",
				key: "@",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "interval"
			}, {
				event: "keydown",
				key: "$",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "interval"
			}, {
				event: "keydown",
				key: "#",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "interval"
			}, {
				event: "keydown",
				key: "%",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "interval"
			}, {
				event: "keydown",
				key: "^",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "interval"
			}, {
				event: "keydown",
				key: "&",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "interval"
			}, {
				event: "keydown",
				key: "*",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "interval"
			}, {
				event: "keydown",
				key: "8",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "interval"
			}, {
				event: "keydown",
				key: "0",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "unmakeTuplet"
			}, {
				event: "keydown",
				key: "Insert",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "addMeasure"
			},{
				event: "keydown",
				key: "Insert",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "addMeasure"
			} , {
				event: "keydown",
				key: "B",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "toggleBeamDirection"
			}, {
				event: "keydown",
				key: "Delete",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "deleteMeasure"
			}, {
				event: "keydown",
				key: "z",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "undo"
			}, {
				event: "keydown",
				key: "c",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "copy"
			}, {
				event: "keydown",
				key: "x",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "toggleBeamGroup"
			}, {
				event: "keydown",
				key: "X",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "beamSelections"
			},{
				event: "keydown",
				key: "v",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "paste"
			}, {
				event: "keydown",
				key: "h",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "addRemoveArticulation"
			}, {
				event: "keydown",
				key: "i",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "addRemoveArticulation"
			}, {
				event: "keydown",
				key: "j",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "addRemoveArticulation"
			}, {
				event: "keydown",
				key: "k",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "addRemoveArticulation"
			}, {
				event: "keydown",
				key: "l",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "addRemoveArticulation"
			}, {
				event: "keydown",
				key: "H",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "addRemoveArticulation"
			}, {
				event: "keydown",
				key: "I",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "addRemoveArticulation"
			}, {
				event: "keydown",
				key: "J",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "addRemoveArticulation"
			}, {
				event: "keydown",
				key: "K",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "addRemoveArticulation"
			}, {
				event: "keydown",
				key: "L",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "addRemoveArticulation"
			},{
				event: "keydown",
				key: "E",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "toggleEnharmonic"
			}
		];
	}

}
;
class defaultTrackerKeys {
	
	static get keys() {
		return [{
				event: "keydown",
				key: "ArrowRight",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "moveSelectionRight"
			}, {
				event: "keydown",
				key: "ArrowRight",
				ctrlKey: false,
				altKey: true,
				shiftKey: false,
				action: "advanceModifierSelection"
			}, {
				event: "keydown",
				key: "ArrowLeft",
				ctrlKey: false,
				altKey: true,
				shiftKey: false,
				action: "advanceModifierSelection"
			},{
				event: "keydown",
				key: "ArrowLeft",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "moveSelectionLeft"
			}, {
				event: "keydown",
				key: "ArrowRight",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "growSelectionRight"
			}, {
				event: "keydown",
				key: "ArrowLeft",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "growSelectionLeft"
			}, {
				event: "keydown",
				key: "ArrowUp",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "moveSelectionUp"
			}, {
				event: "keydown",
				key: "ArrowDown",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "moveSelectionDown"
			}, {
				event: "keydown",
				key: "ArrowRight",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "moveSelectionRightMeasure"
			}, {
				event: "keydown",
				key: "ArrowLeft",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "moveSelectionLeftMeasure"
			},{
				event: "keydown",
				key: "ArrowUp",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "moveSelectionPitchUp"
			},{
				event: "keydown",
				key: "ArrowDown",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "moveSelectionPitchDown"
			}
			];
	}
};// # Dialog base classes

// ## SuiDialogFactory
// Automatic dialog constructors for dialogs without too many parameters
// that operated on a selection.
class SuiDialogFactory {

	static createDialog(modSelection, context, tracker, layout,undoBuffer,controller) {
		var dbType = SuiDialogFactory.modifierDialogMap[modSelection.modifier.attrs.type];
		var ctor = eval(dbType);
		if (!ctor) {
			console.warn('no dialog for modifier ' + modSelection.modifier.type);
			return;
		}
		return ctor.createAndDisplay({
			modifier: modSelection.modifier,
			selection: modSelection.selection,
			context: context,
			tracker: tracker,
			layout: layout,
            undo:undoBuffer,
            controller:controller
		});
	}
	static get modifierDialogMap() {
		return {
			SmoStaffHairpin: 'SuiHairpinAttributesDialog',
			SmoSlur: 'SuiSlurAttributesDialog',
			SmoDynamicText: 'SuiTextModifierDialog',
			SmoVolta: 'SuiVoltaAttributeDialog',
            SmoScoreText: 'SuiTextTransformDialog',
            SmoLoadScore:  'SuiLoadFileDialog',
            SmoLyric:'SuiLyricDialog'
		};
	}
}

// ## SuiDialogBase
// Base class for dialogs.
class SuiDialogBase {
    // ### SuiDialogBase ctor
    // Creates the DOM element for the dialog and gets some initial elements
	constructor(dialogElements, parameters) {
		this.id = parameters.id;
        this.boundKeyboard = false;
		this.components = [];
		this.closeDialogPromise = new Promise((resolve, reject) => {
				$('body').off('dialogDismiss').on('dialogDismiss', function () {
					resolve();
				});

			});
        this.initialLeft = parameters.left
        this.initialTop = parameters.top;
		this.dialogElements = dialogElements;
		this.tracker = parameters.tracker;
		var top = parameters.top - this.tracker.scroller.netScroll.y;
		var left = parameters.left - this.tracker.scroller.netScroll.x;

		this.dgDom = this._constructDialog(dialogElements, {
				id: 'dialog-' + this.id,
				top: top,
				left: left,
				label: parameters.label
			});
	}

    // ### position
    // For dialogs based on selections, tries to place the dialog near the selection and also
    // to scroll so the dialog is in view
    static position(box,dgDom,scroller) {
        var y = (box.y + box.height) - scroller.netScroll.y;

		// TODO: adjust if db is clipped by the browser.
        var dge = $(dgDom.element).find('.attributeModal');
        var dgeHeight = $(dge).height();
        var maxY =  $('.musicRelief').height();
        var maxX = $('.musicRelief').width();

		var offset = dgeHeight + y > window.innerHeight ? (dgeHeight + y) -  window.innerHeight : 0;
		y = (y < 0) ? -y : y - offset;

        y = (y > maxY || y < 0) ? maxY / 2 : y;

		$(dge).css('top', '' + y + 'px');

        var x = box.x - scroller.netScroll.x;
        var w = $(dge).width();
        x = (x > window.innerWidth /2)  ? x - (w+25) : x + (w+25);

        x = (x < 0 || x > maxX) ? maxX/2 : x;
        $(dge).css('left', '' + x + 'px');
    }

    // ### position
    // Position the dialog near a selection.  If the dialog is not visible due
    // to scrolling, make sure it is visible.
	position(box) {
        SuiDialogBase.position(box,this.dgDom,this.tracker.scroller);
	}
    // ### build the html for the dialog, based on the instance-specific components.
	_constructDialog(dialogElements, parameters) {
		var id = parameters.id;
		var b = htmlHelpers.buildDom;
		var r = b('div').classes('attributeModal').attr('id','attr-modal-'+id)
            .css('top', parameters.top + 'px').css('left', parameters.left + 'px')
			.append(b('spanb').classes('draggable button').append(b('span').classes('icon icon-move jsDbMove')))
			.append(b('h2').text(parameters.label));

        var ctrl = b('div').classes('smoControlContainer');
		dialogElements.forEach((de) => {
			var ctor = eval(de.control);
			var control = new ctor(this, de);
			this.components.push(control);
			ctrl.append(control.html);
		});
        r.append(ctrl);
		r.append(
			b('div').classes('buttonContainer').append(
				b('button').classes('ok-button button-left').text('OK')).append(
				b('button').classes('cancel-button button-center').text('Cancel')).append(
				b('button').classes('remove-button button-right').text('Remove').append(
					b('span').classes('icon icon-cancel-circle'))));
		$('.attributeDialog').html('');

		$('.attributeDialog').append(r.dom());

		var trapper = htmlHelpers.inputTrapper('.attributeDialog');
		$('.attributeDialog').find('.cancel-button').focus();
		return {
			element: $('.attributeDialog'),
			trapper: trapper
		};
	}

    // ### _commit
    // generic logic to commit changes to a momdifier.
	_commit() {
		this.modifier.restoreOriginal();
		this.components.forEach((component) => {
			this.modifier[component.smoName] = component.getValue();
		});
	}

     // ### Complete
     // Dialogs take over the keyboard, so release that and trigger an event
     // that the dialog is closing that can resolve any outstanding promises.
	complete() {
        if (this.boundKeyboard) {
            window.removeEventListener("keydown", this.keydownHandler, true);
        }
		$('body').removeClass('showAttributeDialog');
		$('body').trigger('dialogDismiss');
		this.dgDom.trapper.close();
	}

    // ### _bindComponentNames
    // helper method to give components class names based on their static configuration
    _bindComponentNames() {
        this.components.forEach((component) => {
			var nm = component.smoName + 'Ctrl';
            this[nm] = component;
		});
    }

   // ### display
   // make3 the modal visible.  bind events and elements.
	display() {
		$('body').addClass('showAttributeDialog');
		this.components.forEach((component) => {
			component.bind();
		});
		this._bindElements();
		this.position(this.modifier.renderedBox);
        this.tracker.scroller.scrollVisibleBox(
            svgHelpers.smoBox($(this.dgDom.element)[0].getBoundingClientRect())
        );

		var cb = function (x, y) {}
		htmlHelpers.draggable({
			parent: $(this.dgDom.element).find('.attributeModal'),
			handle: $(this.dgDom.element).find('.jsDbMove'),
            animateDiv:'.draganime',
			cb: cb,
			moveParent: true
		});
	}

    // ### handleKeydown
    // allow a dialog to be dismissed by esc.
    handleKeydown(evdata) {
        if (evdata.key == 'Escape') {
            $(this.dgDom.element).find('.cancel-button').click();
            evdata.preventDefault();
            return;
        }
        return;
    }

    // ### bindKeyboard
    // generic logic to grab keyboard elements for modal
    bindKeyboard() {
        this.boundKeyboard = true;
        this.keydownHandler = this.handleKeydown.bind(this);
        window.addEventListener("keydown", this.keydownHandler, true);
    }

   // ### _bindElements
   // bing the generic controls in most dialogs.
	_bindElements() {
		var self = this;
		var dgDom = this.dgDom;
        this.bindKeyboard();

		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
			self._commit();
			self.complete();
		});

		$(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
			self.modifier.restoreOriginal();
			self.complete();
		});
		$(dgDom.element).find('.remove-button').off('click').on('click', function (ev) {
			self.handleRemove();
			self.complete();
		});
	}
}


// ## SuiLayoutDialog
// The layout dialog has page layout and zoom logic.  It is not based on a selection but score-wide
class SuiLayoutDialog extends SuiDialogBase {

   // ### dialogElements
   // all dialogs have elements define the controls of the dialog.
	static get dialogElements() {
		return [{
				smoName: 'pageSize',
				parameterName: 'pageSize',
				defaultValue: SmoScore.pageSizes.letter,
				control: 'SuiDropdownComponent',
				label:'Page Size',
				options: [{
						value: 'letter',
						label: 'Letter'
					}, {
						value: 'tabloid',
						label: 'Tabloid (11x17)'
					}, {
						value: 'A4',
						label: 'A4'
					}, {
						value: 'custom',
						label: 'Custom'
					}
				]
			}, {
				smoName: 'pageWidth',
				parameterName: 'pageWidth',
				defaultValue: SmoScore.defaults.layout.pageWidth,
				control: 'SuiRockerComponent',
				label: 'Page Width (px)'
			}, {
				smoName: 'pageHeight',
				parameterName: 'pageHeight',
				defaultValue: SmoScore.defaults.layout.pageHeight,
				control: 'SuiRockerComponent',
				label: 'Page Height (px)'
			}, {
				smoName: 'orientation',
				parameterName: 'orientation',
				defaultValue: SmoScore.orientations.portrait,
				control: 'SuiDropdownComponent',
				label: 'Orientation',
				dataType:'int',
				options:[{
					value:SmoScore.orientations.portrait,
					label:'Portrait'
				}, {
					value:SmoScore.orientations.landscape,
					label:'Landscape'
				}]
			}, {
				smoName: 'leftMargin',
				parameterName: 'leftMargin',
				defaultValue: SmoScore.defaults.layout.leftMargin,
				control: 'SuiRockerComponent',
				label: 'Left Margin (px)'
			}, {
				smoName: 'rightMargin',
				parameterName: 'rightMargin',
				defaultValue: SmoScore.defaults.layout.rightMargin,
				control: 'SuiRockerComponent',
				label: 'Right Margin (px)'
			}, {
				smoName: 'topMargin',
				parameterName: 'topMargin',
				defaultValue: SmoScore.defaults.layout.topMargin,
				control: 'SuiRockerComponent',
				label: 'Top Margin (px)'
			}, {
				smoName: 'interGap',
				parameterName: 'interGap',
				defaultValue: SmoScore.defaults.layout.interGap,
				control: 'SuiRockerComponent',
				label: 'Inter-System Margin'
			}, {
				smoName: 'intraGap',
				parameterName: 'intraGap',
				defaultValue: SmoScore.defaults.layout.intraGap,
				control: 'SuiRockerComponent',
				label: 'Intra-System Margin'
			}, {
				smoName: 'zoomScale',
				parameterName: 'zoomScale',
				defaultValue: SmoScore.defaults.layout.zoomScale,
				control: 'SuiRockerComponent',
				label: '% Zoom',
				type: 'percent'
			}, {
				smoName: 'svgScale',
				parameterName: 'svgScale',
				defaultValue: SmoScore.defaults.layout.svgScale,
				control: 'SuiRockerComponent',
				label: '% Note size',
				type: 'percent'
			}
		];
	}
    // ### backupOriginal
    // backup the original layout parameters for trial period
	backupOriginal() {
		this.backup = JSON.parse(JSON.stringify(this.modifier));;
	}
	display() {
		$('body').addClass('showAttributeDialog');
		this.components.forEach((component) => {
			component.bind();
		});
		this.components.forEach((component) => {
			var val = this.modifier[component.parameterName];
			component.setValue(val);
		});
		this._setPageSizeDefault();
		this._bindElements();

		var cb = function (x, y) {}
		htmlHelpers.draggable({
			parent: $(this.dgDom.element).find('.attributeModal'),
			handle: $(this.dgDom.element).find('.icon-move'),
            animateDiv:'.draganime',
			cb: cb,
			moveParent: true
		});
		this.controller.unbindKeyboardForDialog(this);

        var box = svgHelpers.boxPoints(250,250,1,1);
        SuiDialogBase.position(box,this.dgDom,this.tracker.scroller);

	}
    // ### _updateLayout
    // even if the layout is not changed, we re-render the entire score by resetting
    // the svg context.
    _updateLayout() {
        this.layout.rerenderAll();
    }
	_handleCancel() {
		this.layout.score.layout = this.backup;
		this._updateLayout();
		this.complete();
	}
	_bindElements() {
		var self = this;
		var dgDom = this.dgDom;
        this.bindKeyboard();

		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {

			// TODO:  allow user to select a zoom mode.
			self.layout.score.layout.zoomMode = SmoScore.zoomModes.zoomScale;
			self._updateLayout();
			self.complete();
		});

		$(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
			self._handleCancel();
		});

		$(dgDom.element).find('.remove-button').remove();
	}
	_setPageSizeDefault() {
		var value = 'custom';
		var scoreDims = this.layout.score.layout;
		SmoScore.pageSizes.forEach((sz) => {
			var dim = SmoScore.pageDimensions[sz];
			if (scoreDims.pageWidth === dim.width && scoreDims.pageHeight === dim.height) {
				value = sz;
			} else if (scoreDims.pageHeight === dim.width && scoreDims.pageWidth === dim.height) {
				value = sz;
			}
		});
		this.components.find((x)=>{return x.parameterName==='pageSize'}).setValue(value);
	}
    // ### _handlePageSizeChange
    // see if the dimensions have changed.
	_handlePageSizeChange() {
		var pageSizeComp = this.components.find((x)=>{return x.parameterName==='pageSize'});
		var sel = pageSizeComp.getValue();
		if (sel === 'custom') {
			$('.attributeModal').addClass('customPage');
		} else {
			$('.attributeModal').removeClass('customPage');
			var dim = SmoScore.pageDimensions[sel];
			var hComp = this.components.find((x)=>{return x.parameterName==='pageHeight'});
			var wComp = this.components.find((x)=>{return x.parameterName==='pageWidth'});
			hComp.setValue(dim.height);
			wComp.setValue(dim.width);
		}
	}
    // ### changed
    // One of the components has had a changed value.
	changed() {
		// this.modifier.backupOriginal();
		this._handlePageSizeChange();
		this.components.forEach((component) => {
			this.layout.score.layout[component.smoName] = component.getValue();
		});
		this.layout.setViewport();
	}

    // ### createAndDisplay
    // static method to create the object and then display it.
	static createAndDisplay(buttonElement, buttonData, controller) {
		var dg = new SuiLayoutDialog({
				layout: controller.layout,
				controller: controller
			});
		dg.display();
	}
	constructor(parameters) {
		if (!(parameters.layout && parameters.controller)) {
			throw new Error('layout  dialog must have score');
		}
		var p = parameters;

		super(SuiLayoutDialog.dialogElements, {
			id: 'dialog-layout',
			top: (p.layout.score.layout.pageWidth / 2) - 200,
			left: (p.layout.score.layout.pageHeight / 2) - 200,
			label: 'Score Layout',
			tracker:parameters.controller.tracker
		});
		this.layout = p.layout;
		this.modifier = this.layout.score.layout;
		this.controller = p.controller;
		this.backupOriginal();
	}
}

// ## SuiTextModifierDialog
// This is a poorly named class, it just allows you to placeText
// dynamic text so it doesn't collide with something.
class SuiTextModifierDialog extends SuiDialogBase {
	static get dialogElements() {
		return [{
				smoName: 'yOffsetLine',
				parameterName: 'yOffsetLine',
				defaultValue: 11,
				control: 'SuiRockerComponent',
				label: 'Y Line'
			}, {
				smoName: 'yOffsetPixels',
				parameterName: 'yOffsetPixels',
				defaultValue: 0,
				control: 'SuiRockerComponent',
				label: 'Y Offset Px'
			}, {
				smoName: 'xOffset',
				parameterName: 'yOffset',
				defaultValue: 0,
				control: 'SuiRockerComponent',
				label: 'X Offset'
			}, {
				smoName: 'text',
				parameterName: 'text',
				defaultValue: SmoDynamicText.dynamics.P,
				options: [{
						value: SmoDynamicText.dynamics.P,
						label: 'Piano'
					}, {
						value: SmoDynamicText.dynamics.PP,
						label: 'Pianissimo'
					}, {
						value: SmoDynamicText.dynamics.MP,
						label: 'Mezzo-Piano'
					}, {
						value: SmoDynamicText.dynamics.MF,
						label: 'Mezzo-Forte'
					}, {
						value: SmoDynamicText.dynamics.F,
						label: 'Forte'
					}, {
						value: SmoDynamicText.dynamics.FF,
						label: 'Fortissimo'
					}, {
						value: SmoDynamicText.dynamics.SFZ,
						label: 'Sforzando'
					}
				],
				control: 'SuiDropdownComponent',
				label: 'Text'
			}
		];
	}
	static createAndDisplay(parameters) {
		var dg = new SuiTextModifierDialog(parameters);
		dg.display();
		return dg;
	}

	constructor(parameters) {
		if (!parameters.modifier || !parameters.selection) {
			throw new Error('modifier attribute dialog must have modifier and selection');
		}

		super(SuiTextModifierDialog.dialogElements, {
			id: 'dialog-' + parameters.modifier.id,
			top: parameters.modifier.renderedBox.y,
			left: parameters.modifier.renderedBox.x,
			label: 'Dynamics Properties',
			tracker:parameters.tracker
		});
		Vex.Merge(this, parameters);
		this.components.find((x) => {
			return x.parameterName == 'text'
		}).defaultValue = parameters.modifier.text;
	}
	handleRemove() {
		$(this.context.svg).find('g.' + this.modifier.id).remove();
        this.undo.addBuffer('remove dynamic', 'measure', this.selection.selector, this.selection.measure);
		this.selection.note.removeModifier(this.modifier);
		this.tracker.clearModifierSelections();
	}
	changed() {
		this.modifier.backupOriginal();
		this.components.forEach((component) => {
			this.modifier[component.smoName] = component.getValue();
		});
		this.layout.renderNoteModifierPreview(this.modifier,this.selection);
	}
}

class helpModal {
	constructor() {}
	static createAndDisplay() {
		SmoHelp.displayHelp();
		return htmlHelpers.closeDialogPromise();
	}
}
;
class SuiFileDialog extends SuiDialogBase {
     constructor(parameters) {
		if (!(parameters.controller)) {
			throw new Error('file dialog must have score');
		}
		var p = parameters;
        var ctor = eval(parameters.ctor);
        var label = parameters.label ? parameters.label : 'Dialog Box';

		super(ctor.dialogElements, {
			id: 'dialog-file',
			top: (p.layout.score.layout.pageWidth / 2) - 200,
			left: (p.layout.score.layout.pageHeight / 2) - 200,
			label: label,
			tracker:parameters.tracker
		});
        this.startPromise=p.closeMenuPromise;
		this.layout = p.layout;
        this.value='';
		// this.modifier = this.layout.score.layout;
		this.controller = p.controller;
		// this.backupOriginal();
	}
    display() {
        $('body').addClass('showAttributeDialog');
		this.components.forEach((component) => {
			component.bind();
		});
		this._bindElements();

        // make sure keyboard is unbound or we get dupicate key events.
        var self=this;
        function getKeys() {
            self.controller.unbindKeyboardForDialog(self);
        }
        this.startPromise.then(getKeys);
        this.position($(this.dgDom.element)[0].getBoundingClientRect());
	}
    _bindElements() {
		var self = this;
		var dgDom = this.dgDom;

		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
            self.commit();
		});

		$(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
			self.complete();
		});

		$(dgDom.element).find('.remove-button').remove();
        this.bindKeyboard();
	}
    position(box) {
		var y = (window.innerHeight/3  + box.height);

		// TODO: adjust if db is clipped by the browser.
        var dge = $(this.dgDom.element).find('.attributeModal');

		$(dge).css('top', '' + y + 'px');

        var x = window.innerWidth - box.width/2;
        $(dge).css('left', '' + x + 'px');
	}
}
class SuiLoadFileDialog extends SuiFileDialog {
    static get dialogElements() {
		return [{
				smoName: 'loadFile',
				parameterName: 'jsonFile',
				defaultValue: '',
				control: 'SuiFileDownloadComponent',
				label:''
			}];
    }

    changed() {
        this.value = this.components[0].getValue();
        $(this.dgDom.element).find('.ok-button').prop('disabled',false);
    }
    commit() {
        var scoreWorks = false;
        if (this.value) {
            try {
                var score = SmoScore.deserialize(this.value);
                scoreWorks=true;
                this.layout.score = score;
                this.layout.setViewport(true);
                setTimeout(function() {
                    $('body').trigger('forceResizeEvent');
                },1);
                this.complete();
            } catch (e) {
                console.log('unable to score '+e);
            }
            if (!scoreWorks) {
                this.complete();
            }
        }
    }
    static createAndDisplay(params) {
		var dg = new SuiLoadFileDialog({
				layout: params.controller.layout,
				controller: params.controller,
				tracker:params.controller.tracker,
                closeMenuPromise:params.closeMenuPromise,
                label:'Open File'
			});
		dg.display();
         // disable until file is selected
        $(dg.dgDom.element).find('.ok-button').prop('disabled',true);
	}
    constructor(parameters) {
        parameters.ctor='SuiLoadFileDialog';
        super(parameters);
	}
}


class SuiPrintFileDialog extends SuiFileDialog {
    static get dialogElements() {
		return [];
    }
    static createAndDisplay(params) {
		var dg = new SuiPrintFileDialog({
				layout: params.controller.layout,
				controller: params.controller,
                closeMenuPromise:params.closeMenuPromise,
                label: 'Print Complete',
                tracker:params.tracker
			});
		dg.display();

	}
    constructor(parameters) {
        parameters.ctor='SuiPrintFileDialog';
        parameters.label = 'Print Complete';
        super(parameters);
	}
    changed() {}
    _bindElements() {
        var self = this;
        var dgDom = this.dgDom;

		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
            $('body').removeClass('printing');
            self.complete();
		});

		$(dgDom.element).find('.cancel-button').remove();
		$(dgDom.element).find('.remove-button').remove();
	}
}
class SuiSaveFileDialog extends SuiFileDialog {

    static get dialogElements() {
		return [{
				smoName: 'saveFileName',
				parameterName: 'saveFileName',
				defaultValue: '',
				control: 'SuiTextInputComponent',
				label:'File Name'
			}];
    }

    changed() {
        this.value = this.components[0].getValue();
    }
    commit() {
        var filename = this.value;
        if (!filename) {
            filename='myScore.json';
        }
        if (filename.indexOf('.json') < 0) {
            filename = filename + '.json';
        }
        var txt = this.layout.score.serialize();
        txt = JSON.stringify(txt);
        htmlHelpers.addFileLink(filename,txt,$('.saveLink'));
        $('.saveLink a')[0].click();
        this.complete();
    }
    static createAndDisplay(params) {
		var dg = new SuiSaveFileDialog({
				layout: params.controller.layout,
				controller: params.controller,
  				tracker:params.controller.tracker,
               closeMenuPromise:params.closeMenuPromise,
                label:'Save File'
			});
		dg.display();
	}
    constructor(parameters) {
        parameters.ctor='SuiSaveFileDialog';
        super(parameters);
	}
}
;class SuiLyricDialog extends SuiDialogBase {
    static createAndDisplay(parameters) {
		var dg = new SuiLyricDialog({
				layout: parameters.controller.layout,
				tracker:parameters.controller.tracker,
				controller: parameters.controller
			});
		dg.display();
        return dg;
	}
    static get dialogElements() {
		return [ {
            smoName: 'verse',
            parameterName: 'verse',
            defaultValue: 0,
            control: 'SuiDropdownComponent',
            label:'Verse',
            startRow:true,
            options: [{
                    value: 0,
                    label: '1'
                }, {
                    value: 1,
                    label: '2'
                }, {
                    value: 2,
                    label: '3'
                }
            ]
        },{
				smoName: 'textEditor',
				parameterName: 'text',
				defaultValue: 0,
				control: 'SuiLyricEditComponent',
				label:'Edit Text',
				options: []
		}
    ];
    }
    constructor(parameters) {
        parameters.ctor='SuiLyricDialog';
        parameters.label = 'Done Editing Lyrics';
        var p = parameters;

		super(SuiLyricDialog.dialogElements, {
			id: 'dialog-lyrics',
			top: (p.layout.score.layout.pageWidth / 2) - 200,
			left: (p.layout.score.layout.pageHeight / 2) - 200,
			label: p.label,
			tracker:parameters.tracker
		});
        this.layout = p.layout;
		this.controller = p.controller;
        this.tracker = this.controller.tracker;
        this.undo = this.controller.undoBuffer;
        SmoUndoable.noop(this.layout.score,this.undo,'Undo lyrics');
	}
    display() {
        $('body').addClass('showAttributeDialog');
		this.components.forEach((component) => {
			component.bind();
		});

        this.editor = this.components.find((c) => c.smoName === 'textEditor');
        this.verse = this.components.find((c) => c.smoName === 'verse');
		this._bindElements();

        // make sure keyboard is unbound or we get dupicate key events.
        var self=this;
        this.controller.unbindKeyboardForDialog(this);

        $(this.dgDom.element).find('.smoControl').each((ix,ctrl) => {
            if ($(ctrl).hasClass('cbLyricEdit')) {
            } else {
                $(ctrl).addClass('fold-textedit');
            }
        });

       this.position(this.tracker.selections[0].note.renderedBox);

        var cb = function (x, y) {}
        htmlHelpers.draggable({
			parent: $(this.dgDom.element).find('.attributeModal'),
			handle: $(this.dgDom.element).find('.jsDbMove'),
            animateDiv:'.draganime',
			cb: cb,
			moveParent: true
		});
	}
    changed() {
        this.editor.verse = this.verse.getValue();
    }
    _bindElements() {
        var self = this;
        var dgDom = this.dgDom;

		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
            self.complete();
            self.tracker.replaceSelectedMeasures();
		});
        $(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
            self.layout.score = self.undo.undo(self.layout.score);
            self.complete();
            self.tracker.replaceSelectedMeasures();
		});
        $(dgDom.element).find('.remove-button').remove();
        this.editor.startEditSession();
	}
}
class SuiTextTransformDialog  extends SuiDialogBase {
    static createAndDisplay(parameters) {
		var dg = new SuiTextTransformDialog(parameters);
		dg.display();
        return dg;
	}

    static get dialogElements() {
		return [{
				smoName: 'textEditor',
				parameterName: 'text',
				defaultValue: 0,
				control: 'SuiTextInPlace',
				label:'Edit Text',
				options: []
			},{
				smoName: 'textDragger',
				parameterName: 'textLocation',
				defaultValue: 0,
				control: 'SuiDragText',
				label:'Move Text',
				options: []
			},{
				smoName: 'textResizer',
				parameterName: 'textBox',
				defaultValue: 0,
				control: 'SuiResizeTextBox',
				label:'Coming Soon',
				options: []
			},
            {
				smoName: 'x',
				parameterName: 'x',
				defaultValue: 0,
				control: 'SuiRockerComponent',
				label: 'X Position (Px)',
                startRow:true,
				type: 'int'
			},{
				smoName: 'y',
				parameterName: 'y',
				defaultValue: 0,
				control: 'SuiRockerComponent',
				label: 'Y Position (Px)',
                startRow:true,
				type: 'int'
			}, {
				smoName: 'scaleX',
				parameterName: 'scaleX',
				defaultValue: 100,
				control: 'SuiRockerComponent',
				label: 'Horizontal Scale (%)',
                startRow:true,
				type: 'percent'
			}, {
				smoName: 'scaleY',
				parameterName: 'scaleY',
				defaultValue: 100,
				control: 'SuiRockerComponent',
				label: 'Vertical Scale (%)',
                startRow:true,
				type: 'percent'
			}, {
				smoName: 'justification',
				parameterName: 'justification',
				defaultValue: SmoScoreText.justifications.left,
				control: 'SuiDropdownComponent',
				label:'Justification',
                startRow:true,
				options: [{
						value: 'left',
						label: 'Left'
					}, {
						value: 'right',
						label: 'Right'
					}, {
						value: 'center',
						label: 'Center'
					}
				]
			} ,
            {
				smoName: 'fontFamily',
				parameterName: 'fontFamily',
				defaultValue: SmoScoreText.fontFamilies.times,
				control: 'SuiDropdownComponent',
				label:'Font Family',
                startRow:true,
				options: [{value:'serif',label:'Serif'},
                  {value:'sans-serif',label:'Sans-Serif'},
                  {label:'Monospace',value:'monospace'},
                  {label:'Cursive',value:'cursive'},
                  {label:'Times',value:'Times New Roman'},
                  {label:'Arial',value:'Arial'},
                  {label:'Helvetica',value:'Helvetica'}
                  ]

			},
            {
				smoName: 'fontSize',
				parameterName: 'fontSize',
				defaultValue: 1,
				control: 'SuiRockerComponent',
				label: 'Font Size',
				type: 'float',
                increment:0.1
			},
            {
				smoName: 'fontUnit',
				parameterName: 'fontUnit',
				defaultValue: 'em',
				control: 'SuiDropdownComponent',
				label: 'Units',
                options: [{value:'em',label:'em'},{value:'px',label:'px'},{value:'pt',label:'pt'}]
			}
        ];
    }

    display() {
		$('body').addClass('showAttributeDialog');
		this.components.forEach((component) => {
			component.bind();

            if (component.smoName === 'textDragger') {
                this.textDragger = component;
            }
            if (typeof(component['setValue'])=='function' && this.modifier[component.parameterName]) {
			  component.setValue(this.modifier[component.parameterName]);
            }
		});

        var dbFontSize = this.components.find((c) => c.smoName === 'fontSize');
        var dbFontUnit  = this.components.find((c) => c.smoName === 'fontUnit');
        var fontSize = this.modifier.fontInfo.size;
        fontSize=svgHelpers.getFontSize(fontSize);
        dbFontSize.setValue(fontSize.size);
        dbFontUnit.setValue(fontSize.unit);

		this._bindElements();
		this.position(this.modifier.renderedBox);

		var cb = function (x, y) {}
		htmlHelpers.draggable({
			parent: $(this.dgDom.element).find('.attributeModal'),
			handle: $(this.dgDom.element).find('span.jsDbMove'),
            animateDiv:'.draganime',
			cb: cb,
			moveParent: true
		});
        $(this.dgDom.element).find('.smoControl').each((ix,ctrl) => {
            if ($(ctrl).hasClass('cbTextInPlace')) {
                $(ctrl).addClass('fold-textmove');
            } else if ($(ctrl).hasClass('cbDragTextDialog')) {
                $(ctrl).addClass('fold-textedit');
            } else {
                $(ctrl).addClass('fold-textedit');
                $(ctrl).addClass('fold-textmove');
            }
        });
        if (!this.modifier.edited) {
            this.modifier.edited = true;
            var textEditor = this.components.find((c) => c.smoName === 'textEditor');
            textEditor.startEditSession();
        }
	}

    changed() {

        var textEditor = this.components.find((c) => c.smoName === 'textEditor');
        this.modifier.text = textEditor.getValue();
        this.components.find((x) => {
            if (typeof(x['getValue'])=='function') {
                if (x.parameterName.indexOf('scale') == 0) {
                   var val = x.getValue();
                    var fcn = x.parameterName+'InPlace';
                    this.modifier[fcn](val);
                }
            }
		});
        var xcomp = this.components.find((x) => x.smoName === 'x');
        var ycomp = this.components.find((x) => x.smoName === 'y');
        if (this.textDragger.dragging) {
            var val = this.textDragger.getValue();
            xcomp.setValue(val.x);
            ycomp.setValue(val.y);
        }
        this.modifier.x=xcomp.getValue();
        this.modifier.y=ycomp.getValue();

        var fontComp = this.components.find((c) => c.smoName === 'fontFamily');
        this.modifier.fontInfo.family = fontComp.getValue();

        var dbFontSize = this.components.find((c) => c.smoName === 'fontSize');
        var dbFontUnit  = this.components.find((c) => c.smoName === 'fontUnit');
        this.modifier.fontInfo.size=''+dbFontSize.getValue()+dbFontUnit.getValue();

        // Use layout context because render may have reset svg.
        $(this.layout.context.svg).find('.' + this.modifier.attrs.id).remove();;
        this.layout.renderScoreText(this.modifier);
    }


	constructor(parameters) {
		if (!parameters.modifier) {
			throw new Error('modifier attribute dialog must have modifier');
		}

		super(SuiTextTransformDialog.dialogElements, {
			id: 'dialog-' + parameters.modifier.attrs.id,
			top: parameters.modifier.renderedBox.y,
			left: parameters.modifier.renderedBox.x,
			label: 'Text Box Properties',
			tracker:parameters.tracker
		});

		Vex.Merge(this, parameters);

        // Do we jump right into editing?
        this.undo = parameters.undo;
        this.textElement=$(this.layout.context.svg).find('.' + parameters.modifier.attrs.id)[0];
        this.modifier.backupParams();
	}
    _commit() {

    }
    _bindElements() {
        var self = this;
        this.bindKeyboard();
		var dgDom = this.dgDom;
        var textEditor = this.components.find((c) => c.smoName === 'textEditor');
        var textDragger = this.components.find((c) => c.smoName === 'textDragger');
        var fontComp = this.components.find((c) => c.smoName === 'fontFamily');

        fontComp.setValue(this.modifier.fontInfo.family);


		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
            textEditor.endSession();
            textDragger.endSession();
			self.complete();
		});

		$(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
            textEditor.endSession();
            textDragger.endSession();
            self.modifier.restoreParams();
			self.complete();
		});
		$(dgDom.element).find('.remove-button').off('click').on('click', function (ev) {
            textEditor.endSession();
            textDragger.endSession();
            SmoUndoable.scoreOp(self.layout.score,'removeScoreText',self.modifier,self.undo,'remove text from dialog');
			self.complete();
		});
    }
}
;// ## measureDialogs.js
// This file contains dialogs that affect all measures at a certain position,
// such as tempo or time signature.

class SuiMeasureDialog extends SuiDialogBase {
    static get attributes() {
        return ['pickupMeasure', 'makePickup', 'padLeft', 'padAllInSystem',
            'measureText','measureTextPosition'];
    }
    static get dialogElements() {
        return [{
            smoName: 'pickupMeasure',
            parameterName: 'pickupMeasure',
            defaultValue: 2048,
            control: 'SuiDropdownComponent',
            label:'Pickup Measure',
            options: [{
                    value: 2048,
                    label: 'Eighth Note'
                }, {
                    value: 4096,
                    label: 'Quarter Note'
                }, {
                    value: 6144,
                    label: 'Dotted Quarter'
                }, {
                    value: 8192,
                    label: 'Half Note'
                }
                ]
			}, {
    			smoName:'makePickup',
    			parameterName:'makePickup',
    			defaultValue: false,
    			control:'SuiToggleComponent',
    			label:'Convert to Pickup Measure'
    		},{
                parameterName: 'padLeft',
                smoName: 'padLeft',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Pad Left (px)'
            },{
    			smoName:'padAllInSystem',
    			parameterName:'padAllInSystem',
    			defaultValue: false,
    			control:'SuiToggleComponent',
    			label:'Pad all measures in system'
    		},{
    				smoName: 'measureText',
    				parameterName: 'measureText',
    				defaultValue: '',
    				control: 'SuiTextInputComponent',
    				label:'Measure Text'
    		},{
                smoName: 'measureTextPosition',
                parameterName: 'measureTextPosition',
                defaultValue: SmoMeasureText.positions.above,
                control: 'SuiDropdownComponent',
                label:'Text Position',
                options: [{
                        value: SmoMeasureText.positions.left,
                        label: 'Left'
                    }, {
                        value: SmoMeasureText.positions.right,
                        label: 'Right'
                    }, {
                        value:SmoMeasureText.positions.above,
                        label: 'Above'
                    }, {
                        value: SmoMeasureText.positions.below,
                        label: 'Below'
                    }
                    ]
    			},{
        			smoName:'systemBreak',
        			parameterName:'systemBreak',
        			defaultValue: false,
        			control:'SuiToggleComponent',
        			label: 'System break before this measure'
        		}
        ];
    }
    static createAndDisplay(ignore1,ignore2,controller) {
        // SmoUndoable.scoreSelectionOp(score,selection,'addTempo',
        //      new SmoTempoText({bpm:144}),undo,'tempo test 1.3');
        var selection = controller.tracker.selections[0];
        var measure = selection.measure;
        var measureIndex = measure.measureNumber.measureIndex;

        var dg = new SuiMeasureDialog({
            measure: measure,
            measureIndex: measureIndex,
            undoBuffer:controller.undoBuffer,
            layout: controller.tracker.layout,
            tracker:controller.tracker,
            controller:controller,
            selection:selection
          });
        dg.display();
        return dg;
    }
    changed() {
        if (this.pickupCtrl.changeFlag || this.pickupMeasureCtrl.changeFlag) {
            this.layout.unrenderColumn(this.measure);
            SmoUndoable.scoreOp(this.layout.score,'convertToPickupMeasure',this.pickupMeasureCtrl.getValue(),this.undoBuffer,'Create pickup measure');
            this.selection = SmoSelection.measureSelection(this.layout.score,this.selection.selector.staff,this.selection.selector.measure);
            this.tracker.replaceSelectedMeasures();
            this.measure = this.selection.measure;
        }
        if (this.systemBreakCtrl.changeFlag) {
            SmoUndoable.scoreSelectionOp(this.layout.score,
                this.tracker.selections[0],'setForceSystemBreak',this.systemBreakCtrl.getValue(),
                  this.undoBuffer,'change system break flag');
            this.layout.setRefresh();
        }
        if (this.padLeftCtrl.changeFlag || this.padAllInSystemCtrl.changeFlag) {
            this.layout.unrenderColumn(this.measure);
            var selections = this.padAllInSystemCtrl.getValue() ?
               SmoSelection.measuresInColumn(this.layout.score,this.selection.measure.measureNumber.measureIndex) :
               SmoSelection.measureSelection(this.layout.score,this.selection.selector.staff,this.selection.selector.measure);
            SmoUndoable.padMeasuresLeft(selections,this.padLeftCtrl.getValue(),this.undoBuffer);
            this.tracker.replaceSelectedMeasures();
        }
        if (this.measureTextCtrl.changeFlag || this.measureTextPositionCtrl.changeFlag) {
            var position = this.measureTextPositionCtrl.getValue();
            var text = this.measureTextCtrl.getValue();
            if (text.length == 0) {
                var tms = this.selection.measure.getMeasureText();
                tms.forEach((tm) => {
                    SmoUndoable.measureSelectionOp(this.layout.score,
                        this.selection,'removeMeasureText',tm,this.undoBuffer,'Remove measure text');
                });

            } else {
                var mt = new SmoMeasureText({position:parseInt(position),text:this.measureTextCtrl.getValue()});
                SmoUndoable.measureSelectionOp(this.layout.score,this.selection,'addMeasureText',mt,this.undoBuffer,'Add measure text');
            }
            this.tracker.replaceSelectedMeasures();
        }
        //
        this._updateConditionals();
    }
    constructor(parameters) {
        if (!parameters.measure || !parameters.selection) {
            throw new Error('measure dialogmust have measure and selection');
        }

        super(SuiMeasureDialog.dialogElements, {
            id: 'dialog-measure',
            top: parameters.measure.renderedBox.y,
            left: parameters.measure.renderedBox.x,
            label: 'Measure Properties',
			tracker:parameters.controller.tracker
        });
        this.refresh = false;
        Vex.Merge(this, parameters);
        this.modifier = this.measure;
    }
    _updateConditionals() {
        if (this.padLeftCtrl.getValue() != 0 || this.padLeftCtrl.changeFlag) {
            $('.attributeDialog .attributeModal').addClass('pad-left-select');
        } else {
            $('.attributeDialog .attributeModal').removeClass('pad-left-select');
        }

        if (this.pickupCtrl.getValue()) {
            $('.attributeDialog .attributeModal').addClass('pickup-select');
        } else {
            $('.attributeDialog .attributeModal').removeClass('pickup-select');
        }
        var str = this.measureTextCtrl.getValue();
        if (str && str.length) {
            $('.attributeDialog .attributeModal').addClass('measure-text-set');
        } else {
            $('.attributeDialog .attributeModal').removeClass('measure-text-set');
        }
    }
    populateInitial() {
        this.padLeftCtrl.setValue(this.measure.padLeft);
        var isPickup = this.measure.isPickup();
        this.pickupCtrl.setValue(isPickup);
        if (isPickup) {
            this.pickupMeasureCtrl.setValue(this.measure.getTicksFromVoice())
        }

        var isSystemBreak = this.measure.getForceSystemBreak();
        this.systemBreakCtrl.setValue(isSystemBreak);
        this._updateConditionals();

        // TODO: handle multiples (above/below)
        var texts = this.measure.getMeasureText();
        if (texts.length) {
            this.measureTextCtrl.setValue(texts[0].text);
            this.measureTextPositionCtrl.setValue(texts[0].position);
        }
    }
    _bindElements() {
		var self = this;
		var dgDom = this.dgDom;
        this.bindKeyboard();
        this.controller.unbindKeyboardForDialog(this);
        this.padLeftCtrl = this.components.find((comp) => {return comp.smoName == 'padLeft';});
        this.padAllInSystemCtrl = this.components.find((comp) => {return comp.smoName == 'padAllInSystem';});
        this.pickupCtrl = this.components.find((comp) => {return comp.smoName == 'makePickup';});
        this.pickupMeasureCtrl = this.components.find((comp) => {return comp.smoName == 'pickupMeasure';});
        this.measureTextCtrl = this.components.find((comp) => {return comp.smoName == 'measureText';});
        this.measureTextPositionCtrl = this.components.find((comp) => {return comp.smoName == 'measureTextPosition';});
        this.systemBreakCtrl = this.components.find((comp) => {return comp.smoName == 'systemBreak';});
        this.populateInitial();

		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
            self.controller.tracker.replaceSelectedMeasures();
			self.complete();
		});

		$(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
			self.complete();
		});
		$(dgDom.element).find('.remove-button').off('click').on('click', function (ev) {
			self.complete();
		});
	}
}
class SuiTimeSignatureDialog extends SuiDialogBase {
    static get dialogElements() {
        return [{
            smoName: 'numerator',
            parameterName: 'numerator',
            defaultValue: 3,
            control: 'SuiRockerComponent',
            label:'Beats/Measure',
            },
		{
			parameterName: 'denominator',
			smoName: 'denominator',
			defaultValue: 8,
            dataType:'int',
			control: 'SuiDropdownComponent',
			label: 'Beat Value',
			options: [{
					value: 8,
					label: '8',
				}, {
					value: 4,
					label: '4'
				}, {
					value: 2,
					label: '2'
				}
			]
		} ];
     }
     populateInitial() {
         var num,den;
         var nd = this.measure.timeSignature.split('/');
         var num = parseInt(nd[0]);
         var den = parseInt(nd[1]);

         this.numeratorCtrl.setValue(num);
         this.denominatorCtrl.setValue(den);
     }

    changed() {
        // no dynamic change for time  signatures
    }
     static createAndDisplay(params) {
         // SmoUndoable.scoreSelectionOp(score,selection,'addTempo',
         //      new SmoTempoText({bpm:144}),undo,'tempo test 1.3');

         var dg = new SuiTimeSignatureDialog({
             selections: params.controller.tracker.selections,
             undoBuffer: params.controller.undoBuffer,
             layout: params.controller.tracker.layout,
             controller:params.controller,
             closeMenuPromise:params.closeMenuPromise
           });
         dg.display();
         return dg;
     }
     changeTimeSignature() {
         var ts = '' + this.numeratorCtrl.getValue() + '/'+this.denominatorCtrl.getValue();
         SmoUndoable.multiSelectionOperation(this.tracker.layout.score,
             this.tracker.selections,
             'setTimeSignature',ts,this.undoBuffer);
          this.tracker.replaceSelectedMeasures();
     }
     _bindElements() {
         var self = this;
 		var dgDom = this.dgDom;
         this.numeratorCtrl = this.components.find((comp) => {return comp.smoName == 'numerator';});
         this.denominatorCtrl = this.components.find((comp) => {return comp.smoName == 'denominator';});
         this.populateInitial();

 		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
            self.changeTimeSignature();
 			self.complete();
 		});

 		$(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
 			self.complete();
 		});
 		$(dgDom.element).find('.remove-button').off('click').on('click', function (ev) {
 			self.complete();
 		});
     }
     display() {
         $('body').addClass('showAttributeDialog');
         this.components.forEach((component) => {
             component.bind();
         });
         this._bindElements();
         this.position(this.measure.renderedBox);
         this.tracker.scroller.scrollVisibleBox(
             svgHelpers.smoBox($(this.dgDom.element)[0].getBoundingClientRect())
         );


         var cb = function (x, y) {}
         htmlHelpers.draggable({
             parent: $(this.dgDom.element).find('.attributeModal'),
             handle: $(this.dgDom.element).find('.jsDbMove'),
              animateDiv:'.draganime',
             cb: cb,
             moveParent: true
         });

         var self=this;
         function getKeys() {
             self.controller.unbindKeyboardForDialog(self);
         }
         this.startPromise.then(getKeys);
     }
     constructor(parameters) {
         var measure = parameters.selections[0].measure;

         super(SuiTimeSignatureDialog.dialogElements, {
             id: 'time-signature-measure',
             top: measure.renderedBox.y,
             left: measure.renderedBox.x,
             label: 'Custom Time Signature',
 			 tracker:parameters.controller.tracker
         });
         this.measure = measure;
         this.refresh = false;
         this.startPromise=parameters.closeMenuPromise;
         Vex.Merge(this, parameters);
     }
 }


// ## SuiTempoDialog
// Allow user to choose a tempo or tempo change.
class SuiTempoDialog extends SuiDialogBase {
    static get attributes() {
        return ['tempoMode', 'bpm', 'beatDuration', 'tempoText','yOffset'];
    }
    static get dialogElements() {
        return [{
            smoName: 'tempoMode',
            parameterName: 'tempoMode',
            defaultValue: SmoTempoText.tempoModes.durationMode,
            control: 'SuiDropdownComponent',
            label:'Tempo Mode',
            options: [{
                    value: 'duration',
                    label: 'Duration (Beats/Minute)'
                }, {
                    value: 'text',
                    label: 'Tempo Text'
                }, {
                    value: 'custom',
                    label: 'Specify text and duration'
                }
                ]
			},
			{
                parameterName: 'bpm',
                smoName: 'bpm',
                defaultValue: 120,
                control: 'SuiRockerComponent',
                label: 'Notes/Minute'
            },
		{
			parameterName: 'duration',
			smoName: 'beatDuration',
			defaultValue: 4096,
            dataType:'int',
			control: 'SuiDropdownComponent',
			label: 'Unit for Beat',
			options: [{
					value: 4096,
					label: 'Quarter Note',
				}, {
					value: 2048,
					label: '1/8 note'
				}, {
					value: 6144,
					label: 'Dotted 1/4 note'
				}, {
					value: 8192,
					label: '1/2 note'
				}
			]
		},

            {
            smoName: 'tempoText',
            parameterName: 'tempoText',
            defaultValue: SmoTempoText.tempoTexts.allegro,
            control: 'SuiDropdownComponent',
            label:'Tempo Text',
            options: [{
                value: SmoTempoText.tempoTexts.larghissimo,
                label: 'Larghissimo'
              }, {
                value: SmoTempoText.tempoTexts.grave,
                label: 'Grave'
              }, {
                value: SmoTempoText.tempoTexts.lento,
                label: 'Lento'
              }, {
                value: SmoTempoText.tempoTexts.largo,
                label: 'Largo'
              }, {
                value: SmoTempoText.tempoTexts.larghetto,
                label: 'Larghetto'
              }, {
                value: SmoTempoText.tempoTexts.adagio,
                label: 'Adagio'
              }, {
                value: SmoTempoText.tempoTexts.adagietto,
                label: 'Adagietto'
              }, {
                value: SmoTempoText.tempoTexts.andante_moderato,
                label: 'Andante moderato'
              }, {
                value: SmoTempoText.tempoTexts.andante,
                label: 'Andante'
              }, {
                value: SmoTempoText.tempoTexts.andantino,
                label: 'Andantino'
              }, {
                value: SmoTempoText.tempoTexts.moderator,
                label: 'Moderato'
              }, {
                value: SmoTempoText.tempoTexts.allegretto,
                label: 'Allegretto',
              } ,{
                value: SmoTempoText.tempoTexts.allegro,
                label: 'Allegro'
              }, {
                value: SmoTempoText.tempoTexts.vivace,
                label: 'Vivace'
              }, {
                value: SmoTempoText.tempoTexts.presto,
                label: 'Presto'
              }, {
                value: SmoTempoText.tempoTexts.prestissimo,
                label: 'Prestissimo'
              }
            ]
        },{
			smoName:'applyToAll',
			parameterName:'applyToAll',
			defaultValue: false,
			control:'SuiToggleComponent',
			label:'Apply to all future measures?'
		},{
                smoName: 'display',
                parameterName: 'display',
                defaultValue: true,
                control: 'SuiToggleComponent',
                label: 'Display Tempo'
            },
        ]
    }
    static createAndDisplay(ignore1,ignore2,controller) {
        // SmoUndoable.scoreSelectionOp(score,selection,'addTempo',
        //      new SmoTempoText({bpm:144}),undo,'tempo test 1.3');
        var measures = SmoSelection.getMeasureList(controller.tracker.selections)
           .map((sel) => sel.measure);
        var existing = measures[0].getTempo();
        if (!existing) {
            existing = new SmoTempoText();
            measures[0].addTempo(existing);
        }
        if (!existing.renderedBox) {
            existing.renderedBox = svgHelpers.copyBox(measures[0].renderedBox);
        }
        var dg = new SuiTempoDialog({
            measures: measures,
            modifier: existing,
            undoBuffer:controller.undoBuffer,
            layout: controller.tracker.layout,
            controller:controller
          });
        dg.display();
        return dg;
    }
    constructor(parameters) {
        if (!parameters.modifier || !parameters.measures) {
            throw new Error('modifier attribute dialog must have modifier and selection');
        }

        super(SuiTempoDialog.dialogElements, {
            id: 'dialog-tempo',
            top: parameters.modifier.renderedBox.y,
            left: parameters.modifier.renderedBox.x,
            label: 'Tempo Properties',
			tracker:parameters.controller.tracker
        });
        this.refresh = false;
        Vex.Merge(this, parameters);
    }
    populateInitial() {
        SmoTempoText.attributes.forEach((attr) => {
            var comp = this.components.find((cc) => {
                return cc.smoName == attr;
            });
            if (comp) {
                comp.setValue(this.modifier[attr]);
            }
        });
		this._updateModeClass();
    }
	_updateModeClass() {
        if (this.modifier.tempoMode == SmoTempoText.tempoModes.textMode) {
			$('.attributeModal').addClass('tempoTextMode');
			$('.attributeModal').removeClass('tempoDurationMode');
        } else if (this.modifier.tempoMode == SmoTempoText.tempoModes.durationMode) {
			$('.attributeModal').addClass('tempoDurationMode');
			$('.attributeModal').removeClass('tempoTextMode');
		} else {
			$('.attributeModal').removeClass('tempoDurationMode');
			$('.attributeModal').removeClass('tempoTextMode');
		}
	}
    changed() {
        this.components.forEach((component) => {
			if (SmoTempoText.attributes.indexOf(component.smoName) >= 0) {
                this.modifier[component.smoName] = component.getValue();
			}
        });
        if (this.modifier.tempoMode == SmoTempoText.tempoModes.textMode) {
            this.modifier.bpm = SmoTempoText.bpmFromText[this.modifier.tempoText];
        }
		this._updateModeClass();
        this.refresh = true;
    }
    // ### handleFuture
    // Update other measures in selection, or all future measures if the user chose that.
    handleFuture() {
        var fc = this.components.find((comp) => {return comp.smoName == 'applyToAll'});
        var toModify = [];
        if (fc.getValue()) {
            this.layout.score.staves.forEach((staff) => {
                var toAdd = staff.measures.filter((mm) => {
                    return mm.measureNumber.measureIndex >= this.measures[0].measureNumber.measureIndex;
                });
                toModify = toModify.concat(toAdd);
            });
        } else {
            this.measures.forEach((measure) => {
                this.layout.score.staves.forEach((staff) => {
                    toModify.push(staff.measures[measure.measureNumber.measureIndex]);
                });
            });
        }
        toModify.forEach((measure) => {
            measure.changed = true;
            var tempo = SmoMeasureModifierBase.deserialize(this.modifier.serialize());
            tempo.attrs.id = VF.Element.newID();
            measure.addTempo(tempo);
        });
        this.controller.tracker.replaceSelectedMeasures();
    }
    // ### handleRemove
    // Removing a tempo change is like changing the measure to the previous measure's tempo.
    // If this is the first measure, use the default value.
    handleRemove() {
        if (this.measures[0].measureNumber.measureIndex > 0) {
            var target = this.measures[0].measureNumber.measureIndex - 1;
            this.modifier = this.layout.score.staves[0].measures[target].getTempo();
            this.handleFuture();
        } else {
            this.modifier = new SmoTempoText();
        }
        this.handleFuture();
    }
    // ### _backup
    // Backup the score before changing tempo which affects score.
    _backup() {
        if (this.refresh) {
            SmoUndoable.noop(this.layout.score,this.undoBuffer,'Tempo change');
            this.layout.setDirty();
        }
    }
    // ### Populate the initial values and bind to the buttons.
    _bindElements() {
        var self = this;
        this.populateInitial();
		var dgDom = this.dgDom;
        // Create promise to release the keyboard when dialog is closed
        this.closeDialogPromise = new Promise((resolve) => {
            $(dgDom.element).find('.cancel-button').remove();
            $(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
                self._backup();
                self.handleFuture();
                self.complete();
                resolve();
            });
            $(dgDom.element).find('.remove-button').off('click').on('click', function (ev) {
                self._backup();
                self.handleRemove();
                self.complete();
                resolve();
            });
        });
        this.controller.unbindKeyboardForDialog(this);
    }
}
;// # dbComponents - components of modal dialogs.

class SuiComponentBase {
    constructor() {
        this.changeFlag = false;
    }
    handleChanged() {
        this.changeFlag = true;
        this.dialog.changed();
        this.changeFlag = false;
    }
}
// ## SuiRockerComponent
// A numeric input box with +- buttons.   Adjustable type and scale
class SuiRockerComponent extends SuiComponentBase {
	static get dataTypes() {
		return ['int','float','percent'];
	}
	static get increments() {
		return {'int':1,'float':0.1,'percent':10}
	}
	static get parsers() {
		return {'int':'_getIntValue','float':'_getFloatValue','percent':'_getPercentValue'};
	}
    constructor(dialog, parameter) {
        super();
        smoSerialize.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label','increment','type'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
		if (!this.type) {
			this.type='int';
		}
		if (!this.increment) {
		    this.increment = SuiRockerComponent.increments[this.type];
		}
		if (SuiRockerComponent.dataTypes.indexOf(this.type) < 0) {
			throw new Error('dialog element invalid type '+this.type);
		}

        this.id = this.id ? this.id : '';

		if (this.type === 'percent') {
			this.defaultValue = 100*this.defaultValue;
		}
		this.parser=SuiRockerComponent.parsers[this.type];
        this.dialog = dialog;
    }

    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('rockerControl smoControl').attr('id', id).attr('data-param', this.parameterName)
            .append(
                b('button').classes('increment').append(
                    b('span').classes('icon icon-circle-up'))).append(
                b('button').classes('decrement').append(
                    b('span').classes('icon icon-circle-down'))).append(
                b('input').attr('type', 'text').classes('rockerInput')
                .attr('id', id + '-input')).append(
                b('label').attr('for', id + '-input').text(this.label));
        return r;
    }

    get parameterId() {
        return this.dialog.id + '-' + this.parameterName;
    }
    handleChange() {
        this.changeFlag = true;
        this.dialog.changed();
        this.changeFlag = false;
    }

    bind() {
        var dialog = this.dialog;
        var pid = this.parameterId;
        var input = this._getInputElement();
        this.setValue(this.defaultValue);
        var self = this;
        $('#' + pid).find('button.increment').off('click').on('click',
            function (ev) {
            var val = self[self.parser]();
			if (self.type === 'percent') {
			    val = 100*val;
     		}
            $(input).val(val + self.increment);
            self.handleChanged();
        });
        $('#' + pid).find('button.decrement').off('click').on('click',
            function (ev) {
            var val = self[self.parser]();
			if (self.type === 'percent') {
			    val = 100*val;
     		}
            $(input).val(val - self.increment);
            self.handleChanged();
        });
        $(input).off('blur').on('blur',
            function (ev) {
            self.handleChanged();
        });
    }

    _getInputElement() {
        var pid = this.parameterId;
        return $(this.dialog.dgDom.element).find('#' + pid).find('input');
    }
    _getIntValue() {
        var pid = this.parameterId;
        var val = parseInt(this._getInputElement().val());
        val = isNaN(val) ? 0 : val;
        return val;
    }
	 _getFloatValue() {
        var pid = this.parameterId;
        var val = parseFloat(this._getInputElement().val());
        val = isNaN(val) ? 1.0 : val;
        return val;
    }
	_getPercentValue() {
        var pid = this.parameterId;
        var val = parseFloat(this._getInputElement().val());
        val = isNaN(val) ? 1 : val;
        return val/100;
	}
    _setIntValue(val) {
        this._getInputElement().val(val);
    }
    setValue(value) {
		if (this.type === 'percent') {
			value = value * 100;
		}
        this._setIntValue(value);
    }
    getValue() {
        return this[this.parser]();
    }
}

// ## SuiDragText
// A component that lets you drag the text you are editing to anywhere on the score.
// The text is not really part of the dialog but the location of the text appears
// in other dialog fields.
class SuiDragText extends SuiComponentBase {
    constructor(dialog,parameter) {
        super();
        smoSerialize.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
        this.dragging=false;

        this.dialog = dialog;
        this.value='';
    }

    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('cbDragTextDialog smoControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
            .append(b('button').attr('type', 'checkbox').classes('toggleTextEdit')
                .attr('id', id + '-input').append(
                b('span').classes('icon icon-move'))
                .append(
                b('label').attr('for', id + '-input').text(this.label)));
        return r;
    }
    get parameterId() {
        return this.dialog.id + '-' + this.parameterName;
    }
    endSession() {
        $('body').removeClass('text-move');
        $(this._getInputElement()).find('label').text(this.label);
        if (this.editor) {
          this.dragging = false;
          this.editor.endSession();
          this.dragger.disconnect();
          var button = document.getElementById(this.parameterId);
          $(button).find('span.icon').removeClass('icon-checkmark').addClass('icon-move');
          $('.dom-container .textEdit').addClass('hide').removeClass('icon-move');
          this.editor = null;
        }
    }
    getValue() {
        return this.value;
    }
    _getInputElement() {
        var pid = this.parameterId;
        return $(this.dialog.dgDom.element).find('#' + pid).find('button');
    }
    _handleEndDrag() {
        var svgBox = svgHelpers.clientToLogical(this.dialog.layout.svg,svgHelpers.smoBox(this.editor.editText.getBoundingClientRect()));
        var offsetBox = this.editor.editText.getBBox();
        var x = svgBox.x;
        var y = svgBox.y+svgBox.height-offsetBox.y;
        this.textElement.setAttributeNS('', 'x', '' + x);
        this.textElement.setAttributeNS('', 'y', '' + y);
        this.value = {x:x,y:y};
        this.dialog.changed();
    }
    startDrag() {
        $('body').addClass('text-move');
        $(this._getInputElement()).find('label').text('Done Moving Text Block');
        if (!this.dragging) {
        var self=this;
        this.dragging = true;
        var dragCb = function() {
            self._handleEndDrag();
        }
        var draggingCb = function() {
            self._handleDragging();
        }
        this.textElement=$(this.dialog.layout.svg).find('.'+this.dialog.modifier.attrs.id)[0];
        var value = this.textElement.getBBox();
        this.value = {x:value.x,y:value.y};
        this.editor = new editSvgText({target:this.textElement,layout:this.dialog.layout,fontInfo:this.fontInfo});
        var button = document.getElementById(this.parameterId);
        $(button).find('span.icon').removeClass('icon-move').addClass('icon-checkmark');
        $('.textEdit').removeClass('hide');
        $('.textEdit span.icon-move').removeClass('hide');
        this.dragger = htmlHelpers.draggable({
			parent: $('.dom-container .textEdit'),
			handle: $('.dom-container .textEdit'),
            animateDiv:'.draganime',
			cb: dragCb,
            draggingCb:draggingCb,
			moveParent: true,
            dragParent: true
		});
        } else {
          this.endSession();
        }
    }

    bind() {
        var self=this;
        this.textElement=$(this.dialog.layout.svg).find('.'+this.dialog.modifier.attrs.id)[0];
        this.fontInfo = JSON.parse(JSON.stringify(this.dialog.modifier.fontInfo));
        this.value = this.textElement.textContent;
        $(this._getInputElement()).off('click').on('click',function(ev) {
            self.startDrag();
        });
    }
}

// ## TBD: do this.
class SuiResizeTextBox extends SuiComponentBase {
    constructor(dialog,parameter) {
        super();
        smoSerialize.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
        this.editMode=false;

        this.dialog = dialog;
        this.value='';
    }

    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('cbResizeTextBox smoControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
            .append(b('button').attr('type', 'checkbox').classes('toggleTextEdit')
                .attr('id', id + '-input').append(
                b('span').classes('icon icon-enlarge'))
                .append(
                b('label').attr('for', id + '-input').text(this.label)));
        return r;
    }
    get parameterId() {
        return this.dialog.id + '-' + this.parameterName;
    }
    endSession() {
        if (this.editor) {
            this.value=this.editor.value;
            this.editor.endSession();
        }
    }
    getValue() {
        return this.value;
    }
    _getInputElement() {
        var pid = this.parameterId;
        return $(this.dialog.dgDom.element).find('#' + pid).find('button');
    }
    startEditSession() {
        var self=this;
        if (!this.editor) {
          this.textElement=$(this.dialog.layout.svg).find('.'+this.dialog.modifier.attrs.id)[0];
          this.value = this.textElement.textContent;
          this.editor = new editSvgText({target:this.textElement,layout:this.dialog.layout,fontInfo:this.fontInfo});
          var button = document.getElementById(this.parameterId);
          $(button).find('span.icon').removeClass('icon-pencil').addClass('icon-checkmark');
          this.editor.startSessionPromise().then(function() {
              self.value=self.editor.value;
              self.editor=null;
          });
        } else {
          var button = document.getElementById(this.parameterId);
          this.value=this.editor.value;
          $(button).find('span.icon').removeClass('icon-checkmark').addClass('icon-pencil');
          this.editor.endSession();
          this.handleChanged();
        }
    }

    bind() {
        var self=this;
        this.textElement=$(this.dialog.layout.svg).find('.'+this.dialog.modifier.attrs.id)[0];
        this.fontInfo = JSON.parse(JSON.stringify(this.dialog.modifier.fontInfo));
        this.value = this.textElement.textContent;
        $(this._getInputElement()).off('click').on('click',function(ev) {
            self.startEditSession();
        });
    }
}

// ## SuiTextInPlace
// Edit the text in an SVG element, in the same scale etc. as the text in the score SVG DOM.
// This component just manages the text editing component of hte renderer.
class SuiTextInPlace extends SuiComponentBase {
    constructor(dialog,parameter) {
        super();
        smoSerialize.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
        this.editMode=false;

        this.dialog = dialog;
        this.value='';
    }

    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('cbTextInPlace smoControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
            .append(b('button').attr('type', 'checkbox').classes('toggleTextEdit')
                .attr('id', id + '-input').append(
                b('span').classes('icon icon-pencil'))
                .append(
                b('label').attr('for', id + '-input').text(this.label)));
        return r;
    }
    get parameterId() {
        return this.dialog.id + '-' + this.parameterName;
    }
    endSession() {
        if (this.editor) {
            this.value=this.editor.value;
            this.editor.endSession();
        }
    }
    getValue() {
        return this.value;
    }
    _getInputElement() {
        var pid = this.parameterId;
        return $(this.dialog.dgDom.element).find('#' + pid).find('button');
    }
    startEditSession() {
        var self=this;
        $(this._getInputElement()).find('label').text('Done Editing Text Block');
        if (!this.editor) {
          this.textElement=$(this.dialog.layout.svg).find('.'+this.dialog.modifier.attrs.id)[0];
          this.value = this.textElement.textContent;
          this.editor = new editSvgText({target:this.textElement,layout:this.dialog.layout,fontInfo:this.fontInfo});
          var button = document.getElementById(this.parameterId);
          $(button).find('span.icon').removeClass('icon-pencil').addClass('icon-checkmark');
          this.editor.startSessionPromise().then(function() {
              self.value=self.editor.value;
              self.editor=null;
          });
        } else {
          var button = document.getElementById(this.parameterId);
          this.value=this.editor.value;
          $(button).find('span.icon').removeClass('icon-checkmark').addClass('icon-pencil');
          this.editor.endSession();
          $('.textEdit').addClass('hide');
          $('body').removeClass('text-edit');
          $(this._getInputElement()).find('label').text(this.label);
          this.handleChanged();
        }
    }

    bind() {
        var self=this;
        this.textElement=$(this.dialog.layout.svg).find('.'+this.dialog.modifier.attrs.id)[0];
        this.fontInfo = JSON.parse(JSON.stringify(this.dialog.modifier.fontInfo));
        this.value = this.textElement.textContent;
        $(this._getInputElement()).off('click').on('click',function(ev) {
            self.startEditSession();
        });
    }
}

class SuiLyricEditComponent extends SuiComponentBase {
    constructor(dialog,parameter) {
        super();
        smoSerialize.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
        this.editMode=false;
        this._verse = 0;

        this.dialog = dialog;
        this.value='';
    }

    set verse(val) {
        this._verse = val;
    }

    get verse() {
        return this._verse;
    }

    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('cbLyricEdit smoControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
            .append(b('button').attr('type', 'checkbox').classes('toggleTextEdit')
                .attr('id', id + '-input').append(
                b('span').classes('icon icon-pencil')))
                .append(
                b('label').attr('for', id + '-input').text(this.label));
        return r;
    }
    get parameterId() {
        return this.dialog.id + '-' + this.parameterName;
    }
    endSession() {
        if (this.editor) {
            this.value=this.editor.value;
            this.editor.detach();
        }
    }
    getValue() {
        return this.value;
    }
    _getInputElement() {
        var pid = this.parameterId;
        return $(this.dialog.dgDom.element).find('#' + pid).find('button');
    }

    _startEditor() {
        var elementDom = $('#'+this.parameterId);
        var button = $(elementDom).find('button');
        this.editor = new editLyricSession({tracker:this.tracker,verse:this.verse,selection:this.tracker.selections[0],controller:this.controller});
        $(button).find('span.icon').removeClass('icon-pencil').addClass('icon-checkmark');
        $(elementDom).find('label').text('Done Editing Lyrics');
        this.editor.editNote();
    }
    startEditSession(selection) {
        var self=this;
        var elementDom = $('#'+this.parameterId);
        var button = $(elementDom).find('button');


        if (!this.editor) {
            this._startEditor();
            $(button).off('click').on('click',function() {
                self.handleChanged();
                 if (self.editor.state == editLyricSession.states.stopped || self.editor.state == editLyricSession.states.stopping)  {
                     self._startEditor(button);
                 } else {
                     self.editor.detach();
                     $(elementDom).find('label').text('Edit Lyrics');
                     $(button).find('span.icon').removeClass('icon-checkmark').addClass('icon-pencil');
                     $('body').removeClass('text-edit');
                     $('div.textEdit').addClass('hide');
                 }
          });
        }
    }

    bind() {
        var self=this;
        this.tracker = this.dialog.tracker;
        this.selection = this.dialog.selection;
        this.controller = this.dialog.controller; // do we need this?
    }
}

// ## SuiTextInputComponent
// Just get text from an input, such as a filename.
class SuiTextInputComponent extends SuiComponentBase {
    constructor(dialog, parameter) {
        super();
        smoSerialize.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
        this.dialog = dialog;
        this.value='';
    }
    get parameterId() {
        return this.dialog.id + '-' + this.parameterName;
    }
    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('text-input smoControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
            .append(b('input').attr('type', 'text').classes('file-name')
                .attr('id', id + '-input')).append(
                b('label').attr('for', id + '-input').text(this.label));
        return r;
    }

    getValue() {
        return this.value;
    }
    setValue(val) {
        this.value = val;
        $('#'+this.parameterId).find('input').val(val);
    }
    bind() {
        var self=this;
        $('#'+this.parameterId).find('input').off('change').on('change',function(e) {
            self.value = $(this).val();
            self.handleChanged();
        });
    }
}

// ## SuiFileDownloadComponent
// Download a test file using the file input.
class SuiFileDownloadComponent extends SuiComponentBase {
    constructor(dialog, parameter) {
        super();
        smoSerialize.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
        this.dialog = dialog;
        this.value='';
    }
    get parameterId() {
        return this.dialog.id + '-' + this.parameterName;
    }
    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('select-file').attr('id', this.parameterId).attr('data-param', this.parameterName)
            .append(b('input').attr('type', 'file').classes('file-button')
                .attr('id', id + '-input')).append(
                b('label').attr('for', id + '-input').text(this.label));
        return r;
    }

    _handleUploadedFiles(evt)  {
        var reader = new FileReader();
        var self=this;
        reader.onload = function(file) {
            self.value = file.target.result;
            self.handleChanged();
        }
        reader.readAsText(evt.target.files[0]);
    }
    getValue() {
        return this.value;
    }
    bind() {
        var self=this;
        $('#'+this.parameterId).find('input').off('change').on('change',function(e) {
            self._handleUploadedFiles(e);
        });
    }

}

// ## SuiToggleComponent
// Simple on/off behavior
class SuiToggleComponent extends SuiComponentBase {
    constructor(dialog, parameter) {
        super();
        smoSerialize.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
        this.dialog = dialog;
    }
    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('toggleControl smoControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
            .append(b('input').attr('type', 'checkbox').classes('toggleInput')
                .attr('id', id + '-input')).append(
                b('label').attr('for', id + '-input').text(this.label));
        return r;
    }
    _getInputElement() {
        var pid = this.parameterId;
        return $(this.dialog.dgDom.element).find('#' + pid).find('input');
    }
    get parameterId() {
        return this.dialog.id + '-' + this.parameterName;
    }

    setValue(value) {
        $(this._getInputElement()).prop('checked', value);
    }
    getValue() {
        return $(this._getInputElement()).prop('checked');
    }

    bind() {
        var dialog = this.dialog;
        var pid = this.parameterId;
        var input = this._getInputElement();
        this.setValue(this.defaultValue);
        var self = this;
        $(input).off('change').on('change',
            function (ev) {
            self.handleChanged();
        });
    }
}

class SuiDropdownComponent  extends SuiComponentBase{
    constructor(dialog, parameter) {
        super();
        smoSerialize.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'options', 'control', 'label','dataType'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
		if (!this.dataType) {
			this.dataType = 'string';
		}

        this.dialog = dialog;
    }

    get parameterId() {
        return this.dialog.id + '-' + this.parameterName;
    }

    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('dropdownControl smoControl').attr('id', id).attr('data-param', this.parameterName);
        var s = b('select');
        this.options.forEach((option) => {
            s.append(
                b('option').attr('value', option.value).text(option.label));
        });
        r.append(s).append(
            b('label').attr('for', id + '-input').text(this.label));

        return r;
    }

    _getInputElement() {
        var pid = this.parameterId;
        return $(this.dialog.dgDom.element).find('#' + pid).find('select');
    }
    getValue() {
        var input = this._getInputElement();
        var option = this._getInputElement().find('option:selected');
		var val = $(option).val();
		val = (this.dataType.toLowerCase() === 'int') ?	parseInt(val) : val;
		val = (this.dataType.toLowerCase() === 'float') ?	parseFloat(val) : val;
        return val;
    }
    setValue(value) {
        var input = this._getInputElement();
        $(input).val(value);
    }

    bind() {
        var input = this._getInputElement();
        this.setValue(this.defaultValue);
        var self = this;
        $(input).off('change').on('change',
            function (ev) {
            self.handleChanged();
        });
    }
}
;

class defaultRibbonLayout {

	static get ribbons() {
		var left = defaultRibbonLayout.leftRibbonIds;
		var top = defaultRibbonLayout.noteButtonIds.concat(defaultRibbonLayout.navigateButtonIds)
        .concat(defaultRibbonLayout.articulateButtonIds).concat(defaultRibbonLayout.microtoneIds)
		    .concat(defaultRibbonLayout.intervalIds).concat(defaultRibbonLayout.durationIds)
            .concat(defaultRibbonLayout.beamIds).concat(defaultRibbonLayout.measureIds).concat(defaultRibbonLayout.staveIds)
              .concat(defaultRibbonLayout.textIds).concat(defaultRibbonLayout.playerIds)
              .concat(defaultRibbonLayout.voiceButtonIds).concat(defaultRibbonLayout.debugIds);

		return {
			left: left,
			top:top
		};
	}

	static get ribbonButtons() {
		return defaultRibbonLayout.leftRibbonButtons.concat(
			defaultRibbonLayout.navigationButtons).concat(
			defaultRibbonLayout.noteRibbonButtons).concat(
			defaultRibbonLayout.articulationButtons).concat(
            defaultRibbonLayout.microtoneButtons).concat(
			defaultRibbonLayout.chordButtons).concat(
			defaultRibbonLayout.durationRibbonButtons).concat(defaultRibbonLayout.beamRibbonButtons).concat(defaultRibbonLayout.measureRibbonButtons)
			.concat(defaultRibbonLayout.staveRibbonButtons)
            .concat(defaultRibbonLayout.textRibbonButtons).concat(defaultRibbonLayout.playerButtons)
            .concat(defaultRibbonLayout.voiceRibbonButtons).concat(defaultRibbonLayout.debugRibbonButtons);
	}

	static get leftRibbonIds() {
		return ['helpDialog', 'fileMenu','addStaffMenu','measureModal','tempoModal','timeSignatureMenu','keyMenu', 'staffModifierMenu', 'staffModifierMenu2','pianoModal','layoutModal'];
	}
	static get noteButtonIds() {
		return ['NoteButtons', 'ANoteButton', 'BNoteButton', 'CNoteButton', 'DNoteButton', 'ENoteButton', 'FNoteButton', 'GNoteButton','ToggleRestButton',
            'UpNoteButton', 'DownNoteButton', 'moreNoteButtons','AddGraceNote','RemoveGraceNote',
				'UpOctaveButton', 'DownOctaveButton', 'ToggleRest','ToggleAccidental', 'ToggleCourtesy'];
	}
    static get voiceButtonIds() {
        return ['VoiceButtons','V1Button','V2Button','V3Button','V4Button','VXButton'];
    }
	static get navigateButtonIds()  {
		return ['NavigationButtons', 'navLeftButton', 'navRightButton', 'navUpButton', 'navDownButton', 'moreNavButtons','navFastForward', 'navRewind',
				'navGrowLeft', 'navGrowRight'];
	}

	static get articulateButtonIds()  {
		return ['articulationButtons', 'accentButton', 'tenutoButton', 'staccatoButton', 'marcatoButton', 'fermataButton', 'pizzicatoButton','mordentButton','mordentInvertedButton','trillButton'];
	}

	static get intervalIds()  {
		return ['CreateChordButtons', 'SecondUpButton', 'SecondDownButton', 'ThirdUpButton', 'ThirdDownButton', 'FourthUpButton', 'FourthDownButton',
				'FifthUpButton', 'FifthDownButton','SixthUpButton', 'SixthDownButton'
				,'SeventhUpButton', 'SeventhDownButton','OctaveUpButton','OctaveDownButton','CollapseChordButton'];
	}

	static get debugIds() {
		return ['DebugGroup','DebugButton2'];
	}
	static get durationIds() {
		return ['DurationButtons','GrowDuration','LessDuration','GrowDurationDot','LessDurationDot','TripletButton','QuintupletButton','SeptupletButton','NoTupletButton'];
	}
	static get measureIds() {
		return ['MeasureButtons','endRepeat','startRepeat','endBar','doubleBar','singleBarEnd','singleBarStart','nthEnding','dcAlCoda','dsAlCoda','dcAlFine','dsAlFine','coda','toCoda','segno','toSegno','fine'];
	}

    static get textIds() {
		return ['TextButtons','addTextMenu','rehearsalMark','lyrics','addDynamicsMenu'];
	}

    static get beamIds() {
		return ['BeamButtons','breakBeam','beamSelections','toggleBeamDirection'];
	}
    static get staveIds() {
		return ['StaveButtons','clefTreble','clefBass','clefTenor','clefAlto','clefAddRemove','clefMoveUp','clefMoveDown'];
	}

    static get playerIds() {
        return ['playerButtons','playButton','pauseButton','stopButton'];
    }

    static get microtoneIds() {
        return ['MicrotoneButtons','flat75sz','flat25sz','flat25ar','flat125ar','sharp75','sharp125','sharp25','sori','koron'];
    }

    static get textRibbonButtons() {
        return [
        {
			leftText: '',
				rightText: '',
				classes: 'icon  collapseParent measure',
				icon: 'icon-text',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'textEdit',
				id: 'TextButtons'
		},
        {
                leftText: '',
				rightText: '/t',
				classes: 'icon collapsed textButton',
				icon: 'icon-textBasic',
				action: 'collapseChild',
				ctor: 'TextButtons',
				group: 'textEdit',
				id: 'addTextMenu'
		},{
                leftText: '',
				rightText: '',
				classes: 'icon collapsed textButton',
				icon: 'icon-rehearsemark',
				action: 'collapseChild',
				ctor: 'TextButtons',
				group: 'textEdit',
				id: 'rehearsalMark'
		},{
                leftText: '',
				rightText: '',
				classes: 'icon collapsed textButton',
				icon: 'icon-lyric',
				action: 'collapseChild',
				ctor: 'TextButtons',
				group: 'textEdit',
				id: 'lyrics'
		} ,{
                leftText: '',
				rightText: '/d',
				classes: 'icon collapsed textButton',
				icon: 'icon-mezzopiano',
				action: 'collapseChild',
				ctor: 'TextButtons',
				group: 'textEdit',
				id: 'addDynamicsMenu'
		}
        ];
    }

    static get microtoneButtons() {
        return [{
			leftText: '',
				rightText: '',
				classes: 'icon  collapseParent microtones',
				icon: 'icon-microtone',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'microtone',
				id: 'MicrotoneButtons'
		}, {
            leftText: '',
				rightText: '',
				classes: 'icon  collapsed microtones',
				icon: 'icon-flat25sz',
				action: 'collapseChild',
				ctor: 'MicrotoneButtons',
				group: 'microtone',
				id: 'flat25sz'
        }, {
            leftText: '',
				rightText: '',
				classes: 'icon  collapsed microtones',
				icon: 'icon-flat75sz',
				action: 'collapseChild',
				ctor: 'MicrotoneButtons',
				group: 'microtone',
				id: 'flat75sz'
        },{
            leftText: '',
				rightText: '',
				classes: 'icon  collapsed microtones',
				icon: 'icon-flat25ar',
				action: 'collapseChild',
				ctor: 'MicrotoneButtons',
				group: 'microtone',
				id: 'flat25ar'
        },{
            leftText: '',
				rightText: '',
				classes: 'icon  collapsed microtones',
				icon: 'icon-sharp75',
				action: 'collapseChild',
				ctor: 'MicrotoneButtons',
				group: 'microtone',
				id: 'sharp75'
        },{
            leftText: '',
				rightText: '',
				classes: 'icon  collapsed microtones',
				icon: 'icon-sharp125',
				action: 'collapseChild',
				ctor: 'MicrotoneButtons',
				group: 'microtone',
				id: 'sharp125'
        },{
            leftText: '',
				rightText: '',
				classes: 'icon  collapsed microtones',
				icon: 'icon-sharp25',
				action: 'collapseChild',
				ctor: 'MicrotoneButtons',
				group: 'microtone',
				id: 'sharp25'
        },{
            leftText: '',
				rightText: '',
				classes: 'icon  collapsed microtones',
				icon: 'icon-sori',
				action: 'collapseChild',
				ctor: 'MicrotoneButtons',
				group: 'microtone',
				id: 'sori'
        },{
            leftText: '',
				rightText: '',
				classes: 'icon  collapsed microtones',
				icon: 'icon-koron',
				action: 'collapseChild',
				ctor: 'MicrotoneButtons',
				group: 'microtone',
				id: 'koron'
        }];
    }

	static get staveRibbonButtons() {
		return [{
			leftText: '',
				rightText: '',
				classes: 'icon  collapseParent staves',
				icon: 'icon-treble',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'staves',
				id: 'StaveButtons'
		},{
			leftText: '',
				rightText: '',
				classes: 'icon  collapsed staves',
				icon: 'icon-treble',
				action: 'collapseChild',
				ctor: 'StaveButtons',
				group: 'staves',
				id: 'clefTreble'
		},{
			leftText: '',
				rightText: '',
				classes: 'icon  collapsed staves',
				icon: 'icon-bass',
				action: 'collapseChild',
				ctor: 'StaveButtons',
				group: 'staves',
				id: 'clefBass'
		},{
			leftText: '',
				rightText: '',
				classes: 'icon  collapsed staves',
				icon: 'icon-tenor',
				action: 'collapseChild',
				ctor: 'StaveButtons',
				group: 'staves',
				id: 'clefTenor'
		},{
			leftText: '',
				rightText: '',
				classes: 'icon  collapsed staves',
				icon: 'icon-alto',
				action: 'collapseChild',
				ctor: 'StaveButtons',
				group: 'staves',
				id: 'clefAlto'
		},{
			leftText: '',
				rightText: '',
				classes: 'icon  collapsed staves',
				icon: 'icon-plus',
				action: 'collapseChildMenu',
				ctor: 'SuiAddStaffMenu',
				group: 'staves',
				id: 'clefAddRemove'
		},{
			leftText: '',
				rightText: '',
				classes: 'icon  collapsed staves',
				icon: 'icon-arrow-up',
				action: 'collapseChild',
				ctor: 'StaveButtons',
				group: 'staves',
				id: 'clefMoveUp'
		},{
			leftText: '',
				rightText: '',
				classes: 'icon  collapsed staves',
				icon: 'icon-arrow-down',
				action: 'collapseChild',
				ctor: 'StaveButtons',
				group: 'staves',
				id: 'clefMoveDown'
		}
		];
	}

    static get beamRibbonButtons() {
        return [{
			leftText: '',
				rightText: '',
				classes: 'icon  collapseParent beams',
				icon: 'icon-flag',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'beams',
				id: 'BeamButtons'
		},{
				leftText: '',
				rightText: 'x',
				icon: 'icon-beamBreak',
				classes: 'collapsed beams',
				action: 'collapseChild',
				ctor: 'BeamButtons',
				group: 'beams',
				id: 'breakBeam'
			},
            {
				leftText: '',
				rightText: 'Shift-X',
				icon: 'icon-beam',
				classes: 'collapsed beams',
				action: 'collapseChild',
				ctor: 'BeamButtons',
				group: 'beams',
				id: 'beamSelections'
			},
            {
				leftText: '',
				rightText: 'Shift-B',
				icon: 'icon-flagFlip',
				classes: 'collapsed beams',
				action: 'collapseChild',
				ctor: 'BeamButtons',
				group: 'beams',
				id: 'toggleBeamDirection'
			}
        ];
    }

	static get measureRibbonButtons() {
		return [{
			leftText: '',
				rightText: '',
				classes: 'icon  collapseParent measure',
				icon: 'icon-end_rpt',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'measure',
				id: 'MeasureButtons'
		},{
				leftText: '',
				rightText: '',
				icon: 'icon-end_rpt',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'endRepeat'
			},
			{
				leftText: '',
				rightText: '',
				icon: 'icon-start_rpt',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'startRepeat'
			}
			,
			{
				leftText: '',
				rightText: '',
				icon: 'icon-end_bar',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'endBar'
			},
			{
				leftText: '',
				rightText: '',
				icon: 'icon-double_bar',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'doubleBar'
			},
			{
				leftText: '',
				rightText: '',
				icon: 'icon-single_bar',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'singleBarEnd'
			},
			{
				leftText: '',
				rightText: '',
				icon: 'icon-single_bar_start',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'singleBarStart'
			},
			{
				leftText: '',
				rightText: '',
				icon: 'icon-ending',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'nthEnding'
			},
			{
				leftText: 'DC Al Coda',
				rightText: '',
				icon: '',
				classes: 'collapsed repetext',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'dcAlCoda'
			},
			{
				leftText: 'DS Al Coda',
				rightText: '',
				icon: '',
				classes: 'collapsed repetext',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'dsAlCoda'
			},
			{
				leftText: 'DC Al Fine',
				rightText: '',
				icon: '',
				classes: 'collapsed repetext',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'dcAlFine'
			},
			{
				leftText: 'DS Al Fine',
				rightText: '',
				icon: '',
				classes: 'collapsed repetext',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'dsAlFine'
			},
			{
				leftText: '',
				rightText: '',
				icon: 'icon-coda',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'coda'
			},
			{
				leftText: 'to ',
				rightText: '',
				icon: 'icon-coda',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'toCoda'
			},
			{
				leftText: '',
				rightText: '',
				icon: 'icon-segno',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'segno'
			},
			{
				leftText: 'Fine',
				rightText: '',
				icon: '',
				classes: 'collapsed repetext',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'fine'
			}
		];
	}
	static get debugRibbonButtons() {
		return [{
				leftText: '',
				rightText: '',
				classes: 'icon  collapseParent',
				icon: 'icon-new-tab',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'debug',
				id: 'DebugGroup'
			},{
				leftText: '',
				rightText: '',
				classes: 'icon  collapsed',
				icon: 'icon-new-tab',
				action: 'collapseChild',
				ctor: 'DebugButtons',
				group: 'debug',
				id: 'DebugButton2'
			}];
	}

	static get durationRibbonButtons() {
		return [{
				leftText: '',
				rightText: '',
				classes: 'icon  collapseParent duration',
				icon: 'icon-duration',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'duration',
				id: 'DurationButtons'
			},{
				leftText: '',
				rightText: '.',
				icon: 'icon-duration_grow',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'DurationButtons',
				group: 'duration',
				id: 'GrowDuration'
			},{
				leftText: '',
				rightText: ',',
				icon: 'icon-duration_less',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'DurationButtons',
				group: 'duration',
				id: 'LessDuration'
			},{
				leftText: '',
				rightText: '>',
				icon: 'icon-duration_grow_dot',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'DurationButtons',
				group: 'duration',
				id: 'GrowDurationDot'
			},{
				leftText: '',
				rightText: '<',
				icon: 'icon-duration_less_dot',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'DurationButtons',
				group: 'duration',
				id: 'LessDurationDot'
			},{
				leftText: '',
				rightText: 'Ctrl-3',
				icon: 'icon-triplet',
				classes: 'collapsed duration tuplet',
				action: 'collapseChild',
				ctor: 'DurationButtons',
				group: 'duration',
				id: 'TripletButton'
			},{
				leftText: '',
				rightText: 'Ctrl-5',
				icon: 'icon-quint',
				classes: 'collapsed duration tuplet',
				action: 'collapseChild',
				ctor: 'DurationButtons',
				group: 'duration',
				id: 'QuintupletButton'
			},{
				leftText: '',
				rightText: 'Ctrl-7',
				icon: 'icon-septuplet',
				classes: 'collapsed duration tuplet',
				action: 'collapseChild',
				ctor: 'DurationButtons',
				group: 'duration',
				id: 'SeptupletButton'
			},
			{
				leftText: '',
				rightText: 'Ctrl-0',
				icon: 'icon-no_tuplet',
				classes: 'collapsed duration tuplet',
				action: 'collapseChild',
				ctor: 'DurationButtons',
				group: 'duration',
				id: 'NoTupletButton'
			}
			];
	}

    static get voiceRibbonButtons() {
        return [{
                leftText: '',
                rightText: '',
                classes: 'icon  collapseParent',
                icon: 'icon-Vo',
                action: 'collapseParent',
                ctor: 'CollapseRibbonControl',
                group: 'voices',
                id: 'VoiceButtons'
            }, {
                leftText: '',
                rightText: '',
                icon: 'icon-V1',
                classes: 'collapsed',
                action: 'collapseChild',
                ctor: 'VoiceButtons',
                group: 'voices',
                id: 'V1Button'
            }, {
                leftText: '',
                rightText: '',
                icon: 'icon-V2',
                classes: 'collapsed',
                action: 'collapseChild',
                ctor: 'VoiceButtons',
                group: 'voices',
                id: 'V2Button'
            }, {
                leftText: '',
                rightText: '',
                icon: 'icon-V3',
                classes: 'collapsed',
                action: 'collapseChild',
                ctor: 'VoiceButtons',
                group: 'voices',
                id: 'V3Button'
            }, {
                leftText: '',
                rightText: '',
                icon: 'icon-V4',
                classes: 'collapsed',
                action: 'collapseChild',
                ctor: 'VoiceButtons',
                group: 'voices',
                id: 'V4Button'
            }, {
                leftText: '',
                rightText: '',
                icon: 'icon-Vx',
                classes: 'collapsed',
                action: 'collapseChild',
                ctor: 'VoiceButtons',
                group: 'voices',
                id: 'VXButton'
            }
        ];
    }
	static get noteRibbonButtons() {
		return [{
				leftText: '',
				rightText: '',
				classes: 'icon  collapseParent',
				icon: 'icon-note',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'notes',
				id: 'NoteButtons'
			}, {
				leftText: 'A',
				rightText: 'a',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'ANoteButton'
			}, {
				leftText: 'B',
				rightText: 'b',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'BNoteButton'
			}, {
				leftText: 'C',
				rightText: 'c',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'CNoteButton'
			}, {
				leftText: 'D',
				rightText: 'd',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'DNoteButton'
			}, {
				leftText: 'E',
				rightText: 'e',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'ENoteButton'
			}, {
				leftText: 'F',
				rightText: 'f',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'FNoteButton'
			}, {
				leftText: 'G',
				rightText: 'g',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'GNoteButton'
			}, {
				leftText: '',
				rightText: '-',
				icon: 'icon-sharp',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'UpNoteButton'
			}, {
				leftText: '',
				rightText: '=',
				icon: 'icon-flat',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'DownNoteButton'
			}, {
				leftText: '',
				rightText: 'r',
				icon: 'icon-rest',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'ToggleRestButton'
			},{
				leftText: '...',
				rightText: '',
				icon: 'icon-circle-left',
				classes: 'collapsed expander',
				action: 'collapseMore',
				ctor: 'ExtendedCollapseParent',
				group: 'notes',
				id: 'moreNoteButtons'
			}, {
				leftText: '',
				rightText: 'G',
				icon: 'icon-grace_note',
				classes: 'collapsed',
				action: 'collapseGrandchild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'AddGraceNote'
			},{
				leftText: '',
				rightText: 'alt-g',
				icon: 'icon-grace_remove',
				classes: 'collapsed',
				action: 'collapseGrandchild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'RemoveGraceNote'
			},{
				leftText: '8va',
				rightText: 'Shift=',
				icon: '',
				classes: 'collapsed',
				action: 'collapseGrandchild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'UpOctaveButton'
			}, {
				leftText: '8vb',
				rightText: 'Shift-',
				icon: '',
				classes: 'collapsed',
				action: 'collapseGrandchild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'DownOctaveButton'
			}, {
				leftText: '',
				rightText: 'ShiftE',
				icon: 'icon-accident',
				classes: 'collapsed',
				action: 'collapseGrandchild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'ToggleAccidental'
			}, {
				leftText: '',
				rightText: 'ShiftF',
				icon: 'icon-courtesy',
				classes: 'collapsed',
				action: 'collapseGrandchild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'ToggleCourtesy'
			}

		];
	}
	static get playerButtons() {
        // .icon-play3
        return [{
				leftText: '',
				rightText: '',
				icon: 'icon-equalizer2',
				classes: 'icon collapseParent player',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'playerButtons',
				id: 'playerButtons'
			}, {
				leftText: '',
				rightText: 'p',
				icon: 'icon-play3',
				classes: 'icon collapsed player',
				action: 'collapseChild',
				ctor: 'PlayerButtons',
				group: 'playerButtons',
				id: 'playButton'
			},
            {
				leftText: '',
				rightText: 's',
				icon: 'icon-stop2',
				classes: 'icon collapsed player',
				action: 'collapseChild',
				ctor: 'PlayerButtons',
				group: 'playerButtons',
				id: 'stopButton'
			},
            {
				leftText: '',
				rightText: 'P',
				icon: 'icon-pause2',
				classes: 'icon collapsed player',
				action: 'collapseChild',
				ctor: 'PlayerButtons',
				group: 'playerButtons',
				id: 'pauseButton'
			}];
    }
    static get articulationButtons() {
		return [{
				leftText: '',
				rightText: '',
				icon: 'icon-articulation',
				classes: 'icon collapseParent articulation',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'articulations',
				id: 'articulationButtons'
			}, {
				leftText: '',
				rightText: 'h',
				icon: 'icon-accent_above',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'accentButton'
			},{
				leftText: '',
				rightText: 'i',
				icon: 'icon-tenuto_above',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'tenutoButton'
			}, {
				leftText: '',
				rightText: 'j',
				icon: 'icon-staccato_above',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'staccatoButton'
			}, {
				leftText: '',
				rightText: 'k',
				icon: 'icon-marcato_above',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'marcatoButton'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-fermata',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'fermataButton'
			},  {
				leftText: '',
				rightText: 'l',
				icon: 'icon-pitz_above',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'pizzicatoButton'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-mordent-inv',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'mordentInvertedButton'
            }, {
				leftText: '',
				rightText: '',
				icon: 'icon-mordent',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'mordentButton'
            }, {
				leftText: '',
				rightText: '',
				icon: 'icon-trill',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'trillButton'
            }
		];
	}
	static get navigationButtons() {
		return [{
				leftText: '',
				rightText: '',
				classes: 'icon  collapseParent',
				icon: 'icon-navigate',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'navigation',
				id: 'NavigationButtons'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-arrow-left',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navLeftButton'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-arrow-right',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navRightButton'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-arrow-up',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navUpButton'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-arrow-down',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navDownButton'
			}, {
				leftText: '...',
				rightText: '',
				icon: '',
				classes: 'collapsed expander',
				action: 'collapseMore',
				ctor: 'ExtendedCollapseParent',
				group: 'navigation',
				id: 'moreNavButtons'
			},{
				leftText: '',
				rightText: '',
				icon: 'icon-fforward',
				classes: 'collapsed',
				action: 'collapseGrandchild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navFastForward'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-rewind',
				classes: 'collapsed',
				action: 'collapseGrandchild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navRewind'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-note_select_left',
				classes: 'collapsed selection-icon',
				action: 'collapseGrandchild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navGrowLeft'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-note_select_right',
				classes: 'collapsed selection-icon',
				action: 'collapseGrandchild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navGrowRight'
			}
		];
	}
	static get chordButtons() {
		return [{
				icon: 'icon-chords',
				leftText: '',
				rightText: '',
				classes: 'icon collapseParent',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'chords',
				id: 'CreateChordButtons'
			}, {
				icon: 'icon-arrow-up',
				leftText: '2nd',
				rightText: '2',
				classes: 'collapsed addChord',
				action: 'collapseChild',
				dataElements: {
					interval: '1',
					direction: '1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'SecondUpButton'
			}, {
				icon: 'icon-arrow-down',
				leftText: '2nd',
				rightText: 'Shift 2',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '1',
					direction: '1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'SecondDownButton'
			}, {
				icon: 'icon-arrow-up',
				leftText: '3rd',
				rightText: '3',
				classes: 'collapsed addChord',
				action: 'collapseChild',
				dataElements: {
					interval: '2',
					direction: '1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'ThirdUpButton'
			}, {
				icon: 'icon-arrow-down',
				leftText: '3rd',
				rightText: 'Shift 3',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '2',
					direction: '-1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'ThirdDownButton'
			}, {
				icon: 'icon-arrow-up',
				leftText: '4th',
				rightText: '4',
				classes: 'collapsed addChord',
				action: 'collapseChild',
				dataElements: {
					interval: '3',
					direction: '1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'FourthUpButton'
			}, {
				icon: 'icon-arrow-down',
				leftText: '4th',
				rightText: 'Shift 4',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '3',
					direction: '-1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'FourthDownButton'
			}, {
				icon: 'icon-arrow-up',
				leftText: '5th',
				rightText: '5',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '4',
					direction: '1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'FifthUpButton'
			}, {
				icon: 'icon-arrow-down',
				leftText: '5th',
				rightText: 'Shift 5',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '4',
					direction: '-1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'FifthDownButton'
			}, {
				icon: 'icon-arrow-up',
				leftText: '6th',
				rightText: '6',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '5',
					direction: '1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'SixthUpButton'
			}, {
				icon: 'icon-arrow-down',
				leftText: '6th',
				rightText: 'Shift 6',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '5',
					direction: '-1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'SixthDownButton'
			}, {
				icon: 'icon-arrow-up',
				leftText: '7th',
				rightText: '7',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '6',
					direction: '1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'SeventhUpButton'
			}, {
				icon: 'icon-arrow-down',
				leftText: '7th',
				rightText: 'Shift 7',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '6',
					direction: '-1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'SeventhDownButton'
			}, {
				icon: 'icon-arrow-up',
				leftText: '8va',
				rightText: '8',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '7',
					direction: '1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'OctaveUpButton'
			}, {
				icon: 'icon-arrow-down',
				leftText: '7th',
				rightText: 'Shift 7',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '7',
					direction: '-1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'OctaveDownButton'
			}, {
				icon: '',
				leftText: 'Collapse',
				rightText: '',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'CollapseChordButton'
			}
		];
	}

	static get leftRibbonButtons() {
		return [{
				icon: '',
				leftText: 'Help',
				rightText: '?',
				classes: 'help-button',
				action: 'modal',
				ctor: 'helpModal',
				group: 'scoreEdit',
				id: 'helpDialog'
			}, {
				leftText: 'File',
				rightText: '/f',
				icon: '',
				classes: 'file-modify',
				action: 'menu',
				ctor: 'SuiFileMenu',
				group: 'scoreEdit',
				id: 'fileMenu'
			},
			 {
				leftText: 'Tempo',
				rightText: 't',
				icon: '',
				classes: 'icon ',
				action: 'modal',
				ctor: 'SuiTempoDialog',
				group: 'scoreEdit',
				id: 'tempoModal'
			},{
				leftText: 'Time Sig',
				rightText: '/m',
				icon: '',
				classes: 'staff-modify',
				action: 'menu',
				ctor: 'SuiTimeSignatureMenu',
				group: 'scoreEdit',
				id: 'timeSignatureMenu'
			}, {
				leftText: 'Staves',
				rightText: '/s',
				icon: '',
				classes: 'staff-modify',
				action: 'menu',
				ctor: 'SuiAddStaffMenu',
				group: 'scoreEdit',
				id: 'addStaffMenu'
			}, {
               leftText: 'Measure',
               rightText: '',
               icon: '',
               classes: 'icon ',
               action: 'modal',
               ctor: 'SuiMeasureDialog',
               group: 'scoreEdit',
               id: 'measureModal'
           },{
				leftText: 'Key',
				rightText: '/k',
				icon: '',
				classes: 'note-modify',
				action: 'menu',
				ctor: 'suiKeySignatureMenu',
				group: 'scoreEdit',
				id: 'keyMenu'
			}, {
				leftText: 'Lines',
				rightText: '/l',
				icon: '',
				classes: 'icon note-modify',
				action: 'menu',
				ctor: 'suiStaffModifierMenu',
				group: 'scoreEdit',
				id: 'staffModifierMenu'
			},
			 {
				leftText: 'Piano',
				rightText: '',
				icon: '',
				classes: 'icon keyboard',
				action: 'modal',
				ctor: 'suiPiano',
				group: 'scoreEdit',
				id: 'pianoModal'
			},
			 {
				leftText: 'Layout',
				rightText: '',
				icon: '',
				classes: 'icon ',
				action: 'modal',
				ctor: 'SuiLayoutDialog',
				group: 'scoreEdit',
				id: 'layoutModal'
			}
		];
	}
}
;

class vexGlyph {
	static accidental(a) {
       return vexGlyph.accidentals[a];
	}
	static barWidth(b) {
		var str = SmoBarline.barlineString(b);
		var cc = vexGlyph.dimensions[str];
		return cc.width+cc.spacingRight;
	}
	static get accidentals() {
		return {
		'b':vexGlyph.dimensions.flat,
		'#':vexGlyph.dimensions.sharp,
		'bb':vexGlyph.dimensions.doubleFlat,
		'##':vexGlyph.dimensions.doubleSharp,
		'n':vexGlyph.dimensions.natural
		};
	}

    static get tempo() {
        return vexGlyph.dimensions['tempo'];
    }
	static keySignatureLength(key) {
		return smoMusic.getSharpsInKeySignature(key)*vexGlyph.dimensions['sharp'].width +
		    smoMusic.getFlatsInKeySignature(key)*vexGlyph.dimensions['flat'].width +
			vexGlyph.dimensions['keySignature'].spacingRight;
	}
	static get timeSignature() {
		return vexGlyph.dimensions['timeSignature'];
	}
	static get dot() {
		return vexGlyph.dimensions['dot'];
	}

    static get stem() {
        return vexGlyph.dimensions['stem'];
    }
    static get flag() {
        return vexGlyph.dimensions['flag'];
    }

	static clef(c) {
		var key = c.toLowerCase()+'Clef';
		if (!vexGlyph.dimensions[key]) {
			return vexGlyph.dimensions['tenorClef'];
		}
		return vexGlyph.dimensions[key];
	}
	static get dimensions() {
		return {
			singleBar: {
				width:1,
				height:41,
                yTop:0,
                yBottom:0,
				spacingRight:1
			},
			endBar: {
				width:5.22,
				height:40.99,
                yTop:0,
                yBottom:0,
				spacingRight:10
			},
			doubleBar: {
				width:3.22,
				height:40.99,
                yTop:0,
                yBottom:0,
				spacingRight:0
			},
			endRepeat: {
				width:6,
				height:40.99,
                yTop:0,
                yBottom:0,
				spacingRight:0,
			},
			startRepeat: {
				width:6,
				height:40.99,
                yTop:0,
                yBottom:0,
				spacingRight:5,
			},
			noteHead: {
				width:12.02,
				height:10.48,
                yTop:0,
                yBottom:0,
				spacingRight:10,
			},
			dot: {
				width:5,
				height:5,
				spacingRight:2
			},
			trebleClef: {
				width: 25.5,
				height: 68.32,
                yTop:14,
                yBottom:14,
				spacingRight: 10,
			},
			bassClef: {
				width: 32.32,
				height: 31.88,
                yTop:0,
                yBottom:0,
				spacingRight: 5,
			},
			altoClef: {
				width: 31.5,
                yTop:0,
                yBottom:0,
				height: 85.5,
				spacingRight: 10
			},
			tenorClef: {
				width: 31.5,
                yTop:10,
                yBottom:0,
				height: 41,
				spacingRight: 10
			},
			timeSignature: {
				width: 13.48,
				height: 85,
                yTop:0,
                yBottom:0,
				spacingRight: 5
			},
            tempo : {
                width:10,
                height:37,
                yTop:37,
                yBottom:0,
                spacingRight:0
            },
			flat: {
				width: 7.44,
				height: 23.55,
                yTop:0,
                yBottom:0,
				spacingRight: 2
			},
			keySignature: {
				width: 0,
				height: 85.5,
                yTop:0,
                yBottom:0,
				spacingRight: 10
			},
			sharp: {
				width: 8.84,
				height: 62,
                yTop:0,
                yBottom:0,
				spacingRight: 2
			},
			natural: {
				width: 6.54,
				height: 53.35,
                yTop:0,
                yBottom:0,
				spacingRight: 2
			},
			doubleSharp: {
				height: 10.04,
				width: 21.63,
                yTop:0,
                yBottom:0,
				spacingRight: 2
			},
			doubleFlat: {
				width: 13.79,
				height: 49.65,
                yTop:0,
                yBottom:0,
				spacingRight:2
			},stem: {
                width:1,
                height:35,
                yTop:0,
                yBottom:0,
				spacingRight:0
            },flag: {
                width:10,
                height:35,
                yTop:0,
                yBottom:0,
				spacingRight:0
            }

		};
	}
}
;var inventionJson = `{"score":{"layout":{"leftMargin":30,"rightMargin":30,"topMargin":201.390625,"bottomMargin":40,"pageWidth":816,"pageHeight":1056,"orientation":0,"interGap":30,"intraGap":15,"svgScale":0.7,"zoomScale":1,"zoomMode":2,"pages":2,"pageSize":"letter"},"startIndex":0,"renumberingMap":{}},"staves":[{"staffId":0,"staffX":10,"staffY":40,"adjY":0,"staffWidth":1600,"staffHeight":90,"startIndex":0,"renumberingMap":{},"keySignatureMap":{},"instrumentInfo":{"instrumentName":"Treble Instrument","keyOffset":"0","clef":"treble"},"modifiers":[{"startSelector":{"staff":0,"measure":4,"voice":0,"tick":0,"pitches":[]},"endSelector":{"staff":0,"measure":4,"voice":0,"tick":1,"pitches":[]},"xOffset":-3,"cp1y":34,"cp2y":17,"attrs":{"id":"auto2051924","type":"SmoSlur"},"ctor":"SmoSlur"},{"startSelector":{"staff":0,"measure":5,"voice":0,"tick":9,"pitches":[]},"endSelector":{"staff":0,"measure":5,"voice":0,"tick":12,"pitches":[]},"xOffset":0,"position":4,"cp1y":40,"cp2y":40,"attrs":{"id":"auto2122395","type":"SmoSlur"},"ctor":"SmoSlur"},{"startSelector":{"staff":0,"measure":10,"voice":0,"tick":1,"pitches":[]},"endSelector":{"staff":0,"measure":10,"voice":0,"tick":4,"pitches":[]},"xOffset":0,"invert":true,"cp1y":40,"cp2y":40,"attrs":{"id":"auto485894","type":"SmoSlur"},"ctor":"SmoSlur"},{"startSelector":{"staff":0,"measure":10,"voice":0,"tick":5,"pitches":[]},"endSelector":{"staff":0,"measure":11,"voice":0,"tick":0,"pitches":[]},"xOffset":0,"position":4,"cp1y":40,"cp2y":40,"attrs":{"id":"auto455306","type":"SmoSlur"},"ctor":"SmoSlur"},{"startSelector":{"staff":0,"measure":11,"voice":0,"tick":1,"pitches":[]},"endSelector":{"staff":0,"measure":11,"voice":0,"tick":6,"pitches":[]},"xOffset":0,"position":4,"cp1y":40,"cp2y":40,"attrs":{"id":"auto484766","type":"SmoSlur"},"ctor":"SmoSlur"},{"startSelector":{"staff":0,"measure":15,"voice":0,"tick":8,"pitches":[]},"endSelector":{"staff":0,"measure":16,"voice":0,"tick":0,"pitches":[]},"xOffset":0,"position":4,"cp1y":40,"cp2y":40,"attrs":{"id":"auto6583884","type":"SmoSlur"},"ctor":"SmoSlur"},{"startSelector":{"staff":0,"measure":17,"voice":0,"tick":8,"pitches":[]},"endSelector":{"staff":0,"measure":18,"voice":0,"tick":0,"pitches":[]},"xOffset":0,"position":4,"cp1y":40,"cp2y":40,"attrs":{"id":"auto8069632","type":"SmoSlur"},"ctor":"SmoSlur"},{"startSelector":{"staff":0,"measure":0,"voice":0,"tick":9,"pitches":[]},"endSelector":{"staff":0,"measure":0,"voice":0,"tick":11,"pitches":[]},"attrs":{"id":"auto777669","type":"SmoStaffHairpin"},"ctor":"SmoStaffHairpin"},{"startSelector":{"staff":0,"measure":1,"voice":0,"tick":9,"pitches":[]},"endSelector":{"staff":0,"measure":1,"voice":0,"tick":11,"pitches":[]},"attrs":{"id":"auto880375","type":"SmoStaffHairpin"},"ctor":"SmoStaffHairpin"},{"startSelector":{"staff":0,"measure":6,"voice":0,"tick":4,"pitches":[]},"endSelector":{"staff":0,"measure":6,"voice":0,"tick":10,"pitches":[]},"attrs":{"id":"auto1048495","type":"SmoStaffHairpin"},"yOffset":-40,"ctor":"SmoStaffHairpin"},{"startSelector":{"staff":0,"measure":7,"voice":0,"tick":4,"pitches":[]},"endSelector":{"staff":0,"measure":7,"voice":0,"tick":10,"pitches":[]},"attrs":{"id":"auto1188531","type":"SmoStaffHairpin"},"ctor":"SmoStaffHairpin"},{"startSelector":{"staff":0,"measure":16,"voice":0,"tick":8,"pitches":[]},"endSelector":{"staff":0,"measure":17,"voice":0,"tick":0,"pitches":[]},"xOffset":0,"position":4,"cp1y":40,"cp2y":40,"attrs":{"id":"auto370817","type":"SmoSlur"},"ctor":"SmoSlur"}],"measures":[{"measureNumber":{"measureNumber":0,"measureIndex":0,"systemIndex":0,"staffId":0},"adjX":64.98,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"noteType":"r","attrs":{"id":"auto11379","type":"SmoNote"},"clef":"treble","endBeam":true},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto11380","type":"SmoNote"},"clef":"treble","beamBeats":3072},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto11383","type":"SmoNote"},"clef":"treble","beamBeats":3072},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto11384","type":"SmoNote"},"clef":"treble","endBeam":true,"beamBeats":3072},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"attrs":{"id":"auto11387","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto11388","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto11391","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto11392","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto14579","type":"SmoNote"},"clef":"treble","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto14580","type":"SmoNote"},"clef":"treble","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto59866","type":"SmoNote"},"clef":"treble","beamBeats":8192,"ornaments":[{"attrs":{"id":"auto122972","type":"SmoOrnament"},"ctor":"SmoOrnament","position":"above","offset":"on","ornament":"mordent_inverted"}]},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto59867","type":"SmoNote"},"clef":"treble","endBeam":true,"beamBeats":8192}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179416","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":1,"measureIndex":1,"systemIndex":1,"staffId":0},"adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto72748","type":"SmoNote"},"clef":"treble","articulations":[{"attrs":{"id":"auto123048","type":"SmoArticulation"},"ctor":"SmoArticulation","position":"above","articulation":"staccato"}]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto72749","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto72752","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto72753","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto72756","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto72757","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto72760","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto72761","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto96293","type":"SmoNote"},"clef":"treble","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto96294","type":"SmoNote"},"clef":"treble","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto96297","type":"SmoNote"},"clef":"treble","beamBeats":8192,"ornaments":[{"attrs":{"id":"auto167808","type":"SmoOrnament"},"ctor":"SmoOrnament","position":"above","offset":"on","ornament":"mordent_inverted"}]},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto96298","type":"SmoNote"},"clef":"treble","endBeam":true,"beamBeats":8192}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179419","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":2,"measureIndex":2,"systemIndex":2,"staffId":0},"adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto133082","type":"SmoNote"},"clef":"treble","articulations":[{"attrs":{"id":"auto212266","type":"SmoArticulation"},"ctor":"SmoArticulation","position":"above","articulation":"staccato"}]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":5}],"attrs":{"id":"auto133083","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto133086","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto133087","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto133090","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto133091","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto133094","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":5}],"attrs":{"id":"auto133095","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto133098","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto133099","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto133102","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto133103","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto133106","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto133107","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto133110","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto133111","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179422","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":3,"measureIndex":3,"systemIndex":0,"staffId":0},"adjX":64.98,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto191771","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto191772","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto191775","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto191776","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto191779","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto191780","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto191783","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto191784","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto191787","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto191788","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto191791","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto191792","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"#","octave":4}],"attrs":{"id":"auto191795","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto191796","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto191799","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto191800","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179425","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":4,"measureIndex":4,"systemIndex":1,"staffId":0},"adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto272800","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto272801","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":3072,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto953841","type":"SmoNote"},"clef":"treble","ornaments":[{"attrs":{"id":"auto259218","type":"SmoOrnament"},"ctor":"SmoOrnament","position":"above","offset":"on","ornament":"mordent_inverted"}]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto953842","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto975442","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto975443","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto975446","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"#","octave":4}],"attrs":{"id":"auto975447","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto975450","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto975451","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"#","octave":4}],"attrs":{"id":"auto975454","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto975455","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179428","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":5,"measureIndex":5,"systemIndex":0,"staffId":0},"adjX":64.98,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto1796614","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto1796615","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto1796618","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto1796619","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto1796622","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto1796623","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto1796626","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto1796627","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto1796630","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":512,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto1908916","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":512,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto1908917","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto1796634","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto1796635","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto1961759","type":"SmoNote"},"clef":"treble","ornaments":[{"attrs":{"id":"auto303694","type":"SmoOrnament"},"ctor":"SmoOrnament","position":"above","offset":"on","ornament":"mordent"}]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto1796642","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto1796643","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179431","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":6,"measureIndex":6,"systemIndex":1,"staffId":0},"adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto2137352","type":"SmoNote"},"clef":"treble","endBeam":true},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"noteType":"r","attrs":{"id":"auto2137353","type":"SmoNote"},"clef":"treble"},{"pitches":[{"letter":"b","accidental":"n","octave":4}],"noteType":"r","attrs":{"id":"auto283675","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"noteType":"r","attrs":{"id":"auto2197858","type":"SmoNote"},"clef":"treble","endBeam":true},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto2197859","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto2197862","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto2197863","type":"SmoNote"},"clef":"treble","endBeam":true},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto2197866","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto2197867","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto2197870","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto2197871","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179434","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":7,"measureIndex":7,"systemIndex":2,"staffId":0},"adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"#","octave":4}],"attrs":{"id":"auto2452562","type":"SmoNote"},"clef":"treble","endBeam":true},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"noteType":"r","attrs":{"id":"auto2452563","type":"SmoNote"},"clef":"treble"},{"pitches":[{"letter":"b","accidental":"n","octave":4}],"noteType":"r","attrs":{"id":"auto276348","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"noteType":"r","attrs":{"id":"auto2596550","type":"SmoNote"},"clef":"treble","endBeam":true},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto2596551","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto2596554","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto2596555","type":"SmoNote"},"clef":"treble","endBeam":true},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto2596558","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto2596559","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto2596562","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto2596563","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179437","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":8,"measureIndex":8,"systemIndex":0,"staffId":0},"adjX":64.98,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto4225360","type":"SmoNote"},"clef":"treble","endBeam":true},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"noteType":"r","attrs":{"id":"auto4225361","type":"SmoNote"},"clef":"treble"},{"pitches":[{"letter":"b","accidental":"n","octave":4}],"noteType":"r","attrs":{"id":"auto2716612","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"noteType":"r","attrs":{"id":"auto4300861","type":"SmoNote"},"clef":"treble","endBeam":true},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto4300862","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto4300865","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto4300866","type":"SmoNote"},"clef":"treble","endBeam":true},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto4300869","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto4300870","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto4300873","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto4300874","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179440","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":9,"measureIndex":9,"systemIndex":1,"staffId":0},"adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto4456124","type":"SmoNote"},"clef":"treble","endBeam":true},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"noteType":"r","attrs":{"id":"auto4456125","type":"SmoNote"},"clef":"treble"},{"pitches":[{"letter":"b","accidental":"n","octave":4}],"noteType":"r","attrs":{"id":"auto2698895","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"noteType":"r","attrs":{"id":"auto4545360","type":"SmoNote"},"clef":"treble","endBeam":true},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto4545361","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto4545364","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto4545365","type":"SmoNote"},"clef":"treble","endBeam":true},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto4545368","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto4545369","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"#","octave":5}],"attrs":{"id":"auto4545372","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto4545373","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179443","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":10,"measureIndex":10,"systemIndex":2,"staffId":0},"adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto4786985","type":"SmoNote"},"clef":"treble","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"#","octave":5}],"attrs":{"id":"auto4786986","type":"SmoNote"},"clef":"treble","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto4786989","type":"SmoNote"},"clef":"treble","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto4786990","type":"SmoNote"},"clef":"treble","endBeam":true,"beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto4786993","type":"SmoNote"},"clef":"treble","beamBeats":8192,"flagState":1},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto4786994","type":"SmoNote"},"clef":"treble","beamBeats":8192,"flagState":1},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto4786997","type":"SmoNote"},"clef":"treble","beamBeats":8192,"flagState":1},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"#","octave":5}],"attrs":{"id":"auto4786998","type":"SmoNote"},"clef":"treble","endBeam":true,"beamBeats":8192,"flagState":1}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179446","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":11,"measureIndex":11,"systemIndex":0,"staffId":0},"adjX":64.98,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto4928487","type":"SmoNote"},"clef":"treble","beamBeats":8192,"flagState":1},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"#","octave":4}],"attrs":{"id":"auto4928488","type":"SmoNote"},"clef":"treble","beamBeats":8192,"flagState":1},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"#","octave":4}],"attrs":{"id":"auto4928491","type":"SmoNote"},"clef":"treble","beamBeats":8192,"flagState":1},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto4928492","type":"SmoNote"},"clef":"treble","endBeam":true,"beamBeats":8192,"flagState":1},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto4928495","type":"SmoNote"},"clef":"treble","flagState":1},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto4928496","type":"SmoNote"},"clef":"treble","flagState":1},{"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto2655693","type":"SmoNote"},"clef":"treble","flagState":1}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179449","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":12,"measureIndex":12,"systemIndex":1,"staffId":0},"adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto529657","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto529658","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"attrs":{"id":"auto529661","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto529662","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto529665","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"attrs":{"id":"auto529666","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto529669","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto529670","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto529673","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto529674","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto529677","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto529678","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto529681","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto529682","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto529685","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto529686","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179452","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":13,"measureIndex":13,"systemIndex":0,"staffId":0},"adjX":64.98,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto920471","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":5}],"attrs":{"id":"auto920472","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto920475","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":5}],"attrs":{"id":"auto920476","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":5}],"attrs":{"id":"auto920479","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto920480","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto920483","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto920484","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"#","octave":4}],"attrs":{"id":"auto920487","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto920488","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto920491","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto920492","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto1414466","type":"SmoNote"},"clef":"treble","ornaments":[{"attrs":{"id":"auto1496856","type":"SmoOrnament"},"ctor":"SmoOrnament","position":"above","offset":"on","ornament":"mordent"}]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto920499","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto920500","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179455","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":14,"measureIndex":14,"systemIndex":1,"staffId":0},"adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto5091269","type":"SmoNote"},"clef":"treble","articulations":[{"attrs":{"id":"auto5420502","type":"SmoArticulation"},"ctor":"SmoArticulation","position":"below","articulation":"staccato"}]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":5}],"attrs":{"id":"auto5091270","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto5091273","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto5091274","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto5091277","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto5091278","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto5091281","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":5}],"attrs":{"id":"auto5091282","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":8192,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto5296556","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179458","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":15,"measureIndex":15,"systemIndex":2,"staffId":0},"adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto5523550","type":"SmoNote"},"clef":"treble","flagState":2},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto5523551","type":"SmoNote"},"clef":"treble","flagState":2},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto5523554","type":"SmoNote"},"clef":"treble","flagState":2},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto5523555","type":"SmoNote"},"clef":"treble","flagState":2},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":5}],"attrs":{"id":"auto5523558","type":"SmoNote"},"clef":"treble","flagState":2},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto5523559","type":"SmoNote"},"clef":"treble","flagState":2},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto5523562","type":"SmoNote"},"clef":"treble","flagState":2},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto5523563","type":"SmoNote"},"clef":"treble","flagState":2},{"ticks":{"numerator":8192,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto5944042","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179461","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":16,"measureIndex":16,"systemIndex":0,"staffId":0},"adjX":64.98,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto6028129","type":"SmoNote"},"clef":"treble","articulations":[{"attrs":{"id":"auto6626431","type":"SmoArticulation"},"ctor":"SmoArticulation","position":"above","articulation":"staccato"}]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto6028130","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto6028133","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto6028134","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto6070341","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto6070342","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto6070345","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto6070346","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":8192,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto6305344","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179464","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":17,"measureIndex":17,"systemIndex":1,"staffId":0},"adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto6712337","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto6712338","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto6712341","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto6712342","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto6712345","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto6712346","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto6712349","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto6712350","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":8192,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto7017277","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179467","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":18,"measureIndex":18,"systemIndex":2,"staffId":0},"adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto7104931","type":"SmoNote"},"clef":"treble","articulations":[{"attrs":{"id":"auto8114813","type":"SmoArticulation"},"ctor":"SmoArticulation","position":"above","articulation":"staccato"}]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto7104932","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto7104935","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto7104936","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto7104939","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto7104940","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto7104943","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto7104944","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto7104947","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto7104948","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto7104951","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto7104952","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":5}],"attrs":{"id":"auto7104955","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto7104956","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto7104959","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto7104960","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179470","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":19,"measureIndex":19,"systemIndex":0,"staffId":0},"adjX":64.98,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto8389623","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto8389624","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":5}],"attrs":{"id":"auto8389627","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":5}],"attrs":{"id":"auto8389628","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":6}],"attrs":{"id":"auto8389631","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":5}],"attrs":{"id":"auto8389632","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":5}],"attrs":{"id":"auto8389635","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto8389636","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":6}],"attrs":{"id":"auto11020982","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":5}],"attrs":{"id":"auto11020983","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto11194143","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto11243447","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto11243448","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179473","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":20,"measureIndex":20,"systemIndex":1,"staffId":0},"adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto11442900","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto11442901","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto11442904","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto11442905","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"attrs":{"id":"auto11519018","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto11519019","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto11519022","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto11519023","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto11519026","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"attrs":{"id":"auto11519027","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto11519030","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":5}],"attrs":{"id":"auto11519031","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":5}],"attrs":{"id":"auto11519034","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto11519035","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":5}],"attrs":{"id":"auto11519038","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":5}],"attrs":{"id":"auto11519039","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179476","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":21,"measureIndex":21,"systemIndex":2,"staffId":0},"adjX":11,"adjRight":15.219999999999999,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":16384,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4},{"letter":"g","accidental":"n","octave":4},{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto12055952","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"position":1,"barline":2,"ctor":"SmoBarline"},{"attrs":{"id":"auto179479","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]}]},{"staffId":1,"staffX":10,"staffY":40,"adjY":0,"staffWidth":1600,"staffHeight":90,"startIndex":0,"renumberingMap":{},"keySignatureMap":{},"instrumentInfo":{"instrumentName":"Bass Clef Staff","keyOffset":0,"clef":"bass"},"modifiers":[{"startSelector":{"staff":1,"measure":1,"voice":0,"tick":0,"pitches":[0]},"endSelector":{"staff":1,"measure":1,"voice":0,"tick":1,"pitches":[]},"xOffset":0,"position":4,"cp1y":40,"cp2y":40,"attrs":{"id":"auto504407","type":"SmoSlur"},"ctor":"SmoSlur"},{"startSelector":{"staff":1,"measure":2,"voice":0,"tick":1,"pitches":[]},"endSelector":{"staff":1,"measure":2,"voice":0,"tick":4,"pitches":[]},"xOffset":0,"position":4,"cp1y":40,"cp2y":40,"attrs":{"id":"auto905115","type":"SmoSlur"},"ctor":"SmoSlur"},{"startSelector":{"staff":1,"measure":2,"voice":0,"tick":5,"pitches":[]},"endSelector":{"staff":1,"measure":3,"voice":0,"tick":0,"pitches":[]},"xOffset":0,"position":4,"cp1y":40,"cp2y":40,"attrs":{"id":"auto915886","type":"SmoSlur"},"ctor":"SmoSlur"},{"startSelector":{"staff":1,"measure":3,"voice":0,"tick":1,"pitches":[]},"endSelector":{"staff":1,"measure":3,"voice":0,"tick":6,"pitches":[]},"xOffset":0,"position":4,"cp1y":40,"cp2y":40,"attrs":{"id":"auto926673","type":"SmoSlur"},"ctor":"SmoSlur"},{"startSelector":{"staff":1,"measure":15,"voice":0,"tick":0,"pitches":[]},"endSelector":{"staff":1,"measure":15,"voice":0,"tick":1,"pitches":[]},"xOffset":0,"position":4,"cp1y":40,"cp2y":40,"attrs":{"id":"auto3816602","type":"SmoSlur"},"ctor":"SmoSlur"},{"startSelector":{"staff":1,"measure":16,"voice":0,"tick":0,"pitches":[0]},"endSelector":{"staff":1,"measure":16,"voice":0,"tick":1,"pitches":[]},"xOffset":0,"position":4,"cp1y":40,"cp2y":40,"attrs":{"id":"auto4455383","type":"SmoSlur"},"ctor":"SmoSlur"},{"startSelector":{"staff":1,"measure":3,"voice":0,"tick":4,"pitches":[]},"endSelector":{"staff":1,"measure":3,"voice":0,"tick":6,"pitches":[]},"attrs":{"id":"auto994835","type":"SmoStaffHairpin"},"ctor":"SmoStaffHairpin"}],"measures":[{"measureNumber":{"measureNumber":0,"measureIndex":0,"systemIndex":0,"staffId":1},"clef":"bass","adjX":66.8,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":8192,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":3}],"noteType":"r","attrs":{"id":"auto310758","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":3}],"noteType":"r","attrs":{"id":"auto330436","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":3}],"attrs":{"id":"auto330437","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":3}],"attrs":{"id":"auto330440","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":3}],"attrs":{"id":"auto330441","type":"SmoNote"},"clef":"bass","endBeam":true},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":3}],"attrs":{"id":"auto330444","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":3}],"attrs":{"id":"auto330445","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":3}],"attrs":{"id":"auto330448","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":3}],"attrs":{"id":"auto330449","type":"SmoNote"},"clef":"bass","endBeam":true}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179482","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":1,"measureIndex":1,"systemIndex":1,"staffId":1},"clef":"bass","adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto420692","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":2}],"attrs":{"id":"auto420693","type":"SmoNote"},"clef":"bass","articulations":[{"attrs":{"id":"auto167397","type":"SmoArticulation"},"ctor":"SmoArticulation","position":"above","articulation":"staccato"}]},{"pitches":[{"letter":"d","accidental":"n","octave":3}],"noteType":"r","attrs":{"id":"auto7233","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":3}],"noteType":"r","attrs":{"id":"auto605720","type":"SmoNote"},"clef":"bass","endBeam":true},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto605721","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto605724","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto605725","type":"SmoNote"},"clef":"bass","endBeam":true},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto605728","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto605729","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto605732","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto605733","type":"SmoNote"},"clef":"bass","endBeam":true}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179485","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":2,"measureIndex":2,"systemIndex":2,"staffId":1},"clef":"bass","adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto715388","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto715389","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto715392","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto715393","type":"SmoNote"},"clef":"bass","endBeam":true,"beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto715396","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto715397","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto715400","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto715401","type":"SmoNote"},"clef":"bass","endBeam":true,"beamBeats":8192}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179488","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":3,"measureIndex":3,"systemIndex":0,"staffId":1},"clef":"bass","adjX":66.8,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto786266","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":3}],"attrs":{"id":"auto786267","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"#","octave":3}],"attrs":{"id":"auto786270","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto786271","type":"SmoNote"},"clef":"bass","endBeam":true,"beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto786274","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto786275","type":"SmoNote"},"clef":"bass"},{"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto937488","type":"SmoNote"},"clef":"bass"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179491","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":4,"measureIndex":4,"systemIndex":1,"staffId":1},"clef":"bass","adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto998715","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":3}],"attrs":{"id":"auto998716","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":3}],"attrs":{"id":"auto998719","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"#","octave":3}],"attrs":{"id":"auto998720","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto998723","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":3}],"attrs":{"id":"auto998724","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"#","octave":3}],"attrs":{"id":"auto998727","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":3}],"attrs":{"id":"auto998728","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto1455120","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":2}],"attrs":{"id":"auto1455121","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":3}],"attrs":{"id":"auto1455124","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":3}],"attrs":{"id":"auto1455125","type":"SmoNote"},"clef":"bass","endBeam":true,"beamBeats":8192}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179494","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":5,"measureIndex":5,"systemIndex":0,"staffId":1},"clef":"bass","adjX":66.8,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":3}],"attrs":{"id":"auto1563061","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"#","octave":3}],"attrs":{"id":"auto1563062","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto1563065","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":3}],"attrs":{"id":"auto1563066","type":"SmoNote"},"clef":"bass","endBeam":true,"beamBeats":8192},{"ticks":{"numerator":3072,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":2}],"attrs":{"id":"auto1583153","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":3}],"attrs":{"id":"auto1583154","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":3}],"attrs":{"id":"auto1563073","type":"SmoNote"},"clef":"bass","flagState":1},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":2}],"attrs":{"id":"auto1563074","type":"SmoNote"},"clef":"bass","flagState":1,"articulations":[{"attrs":{"id":"auto603153","type":"SmoArticulation"},"ctor":"SmoArticulation","position":"below","articulation":"staccato"}]}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179497","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":6,"measureIndex":6,"systemIndex":1,"staffId":1},"clef":"bass","adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":2}],"noteType":"r","attrs":{"id":"auto2833830","type":"SmoNote"},"clef":"bass","endBeam":true},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":2}],"attrs":{"id":"auto2833831","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":2}],"attrs":{"id":"auto2833834","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":2}],"attrs":{"id":"auto2833835","type":"SmoNote"},"clef":"bass","endBeam":true},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":3}],"attrs":{"id":"auto2833838","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":2}],"attrs":{"id":"auto2833839","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":2}],"attrs":{"id":"auto2833842","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":2}],"attrs":{"id":"auto2833843","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":3}],"attrs":{"id":"auto2843199","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto2843200","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"#","octave":3}],"attrs":{"id":"auto2843203","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto2843204","type":"SmoNote"},"clef":"bass","endBeam":true,"beamBeats":8192}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179500","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":7,"measureIndex":7,"systemIndex":2,"staffId":1},"clef":"bass","adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto3283509","type":"SmoNote"},"clef":"bass","articulations":[{"attrs":{"id":"auto348488","type":"SmoArticulation"},"ctor":"SmoArticulation","position":"above","articulation":"staccato"}]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":3}],"attrs":{"id":"auto3283510","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":3}],"attrs":{"id":"auto3283513","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"#","octave":3}],"attrs":{"id":"auto3283514","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto3283517","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":3}],"attrs":{"id":"auto3283518","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"#","octave":3}],"attrs":{"id":"auto3283521","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":3}],"attrs":{"id":"auto3283522","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto3463763","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto3463764","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto3463767","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto3463768","type":"SmoNote"},"clef":"bass","endBeam":true,"beamBeats":8192}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179503","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":8,"measureIndex":8,"systemIndex":0,"staffId":1},"adjX":64.98,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto3648338","type":"SmoNote"},"clef":"treble","articulations":[{"attrs":{"id":"auto395478","type":"SmoArticulation"},"ctor":"SmoArticulation","position":"below","articulation":"staccato"}]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto3648339","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4,"cautionary":true}],"attrs":{"id":"auto3648342","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto3648343","type":"SmoNote"},"clef":"treble","endBeam":true},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto3648346","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"attrs":{"id":"auto3648347","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto3648350","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto3648351","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto3988070","type":"SmoNote"},"clef":"treble","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"attrs":{"id":"auto3988071","type":"SmoNote"},"clef":"treble","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto3988074","type":"SmoNote"},"clef":"treble","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto3988075","type":"SmoNote"},"clef":"treble","endBeam":true,"beamBeats":8192}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179506","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":9,"measureIndex":9,"systemIndex":1,"staffId":1},"adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto5364704","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto5364705","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto5364708","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"attrs":{"id":"auto5364709","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto5364712","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto5364713","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"attrs":{"id":"auto5364716","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto5364717","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto5545174","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"attrs":{"id":"auto5545175","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto5545178","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto5545179","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179509","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":10,"measureIndex":10,"systemIndex":2,"staffId":1},"adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"attrs":{"id":"auto5675911","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"b","octave":4}],"attrs":{"id":"auto5675912","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto5675915","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto5675916","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"attrs":{"id":"auto5675919","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto5675920","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto5675923","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"b","octave":4}],"attrs":{"id":"auto5675924","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"attrs":{"id":"auto5675927","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto5675928","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"attrs":{"id":"auto5675931","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto5675932","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto5675935","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"attrs":{"id":"auto5675936","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto5675939","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"attrs":{"id":"auto5675940","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179512","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":11,"measureIndex":11,"systemIndex":0,"staffId":1},"adjX":64.98,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"attrs":{"id":"auto6804167","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto6804168","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto6804171","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto6804172","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto6804175","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto6804176","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto6804179","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto6804180","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto7036248","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto7036249","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto7036252","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto7036253","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"#","octave":3}],"attrs":{"id":"auto7036256","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto7036257","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto7036260","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto7036261","type":"SmoNote"},"clef":"treble"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179515","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":12,"measureIndex":12,"systemIndex":1,"staffId":1},"clef":"bass","adjX":48.32,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto1765954","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto1765955","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":3072,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto1885418","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto1885419","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto1937073","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto1937074","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto1937077","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3,"cautionary":true}],"attrs":{"id":"auto1937078","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"#","octave":3}],"attrs":{"id":"auto1937081","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto1937082","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"#","octave":3}],"attrs":{"id":"auto1937085","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto1937086","type":"SmoNote"},"clef":"bass"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179518","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":13,"measureIndex":13,"systemIndex":0,"staffId":1},"clef":"bass","adjX":66.8,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto2322310","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto2322311","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto2322314","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto2322315","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto2322318","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto2322319","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto2322322","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"attrs":{"id":"auto2322323","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto2661621","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto2661622","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto2661625","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":3}],"attrs":{"id":"auto2661626","type":"SmoNote"},"clef":"bass"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179521","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":14,"measureIndex":14,"systemIndex":1,"staffId":1},"clef":"bass","adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto2896958","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto2896959","type":"SmoNote"},"clef":"bass"},{"pitches":[{"letter":"c","accidental":"n","octave":4}],"noteType":"r","attrs":{"id":"auto5158027","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"noteType":"r","attrs":{"id":"auto2951316","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto2951317","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto2951320","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto2951321","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto2951324","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto2951325","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"#","octave":4}],"attrs":{"id":"auto2951328","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto2951329","type":"SmoNote"},"clef":"bass"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179524","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":15,"measureIndex":15,"systemIndex":2,"staffId":1},"clef":"bass","adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":8192,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto3324721","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto3436722","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto3436723","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto3436726","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto3436727","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto3436730","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto3436731","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto3436734","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto3436735","type":"SmoNote"},"clef":"bass"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179527","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":16,"measureIndex":16,"systemIndex":0,"staffId":1},"clef":"bass","adjX":66.8,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":8192,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto3854469","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto3892459","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto3892460","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto3892463","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto3892464","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto3892467","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto3892468","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"attrs":{"id":"auto3892471","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto3892472","type":"SmoNote"},"clef":"bass"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179530","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":17,"measureIndex":17,"systemIndex":1,"staffId":1},"clef":"bass","adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":8192,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto4105601","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto4513556","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto4513557","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto4513560","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"b","octave":3}],"attrs":{"id":"auto4513561","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto4513564","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto4513565","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"b","octave":3}],"attrs":{"id":"auto4513568","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto4513569","type":"SmoNote"},"clef":"bass"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179533","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":18,"measureIndex":18,"systemIndex":2,"staffId":1},"clef":"bass","adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto5009428","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"b","octave":3}],"attrs":{"id":"auto5009429","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto5009432","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto5009433","type":"SmoNote"},"clef":"bass","endBeam":true,"beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":3}],"attrs":{"id":"auto5009436","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto5009437","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"attrs":{"id":"auto5009440","type":"SmoNote"},"clef":"bass","beamBeats":8192},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"b","octave":3}],"attrs":{"id":"auto5009441","type":"SmoNote"},"clef":"bass","endBeam":true,"beamBeats":8192}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179536","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":19,"measureIndex":19,"systemIndex":0,"staffId":1},"clef":"bass","adjX":66.8,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":3}],"attrs":{"id":"auto9073798","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"attrs":{"id":"auto9073799","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto9073802","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"attrs":{"id":"auto9073803","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"attrs":{"id":"auto9430637","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":3}],"attrs":{"id":"auto9430638","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":3}],"attrs":{"id":"auto9430641","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":3}],"attrs":{"id":"auto9430642","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto9430645","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":3}],"attrs":{"id":"auto9430646","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":3}],"attrs":{"id":"auto9430649","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":3}],"attrs":{"id":"auto9430650","type":"SmoNote"},"clef":"bass"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179539","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":20,"measureIndex":20,"systemIndex":1,"staffId":1},"clef":"bass","adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":3}],"attrs":{"id":"auto9938591","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":3}],"attrs":{"id":"auto9938592","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":3}],"attrs":{"id":"auto9938595","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":3}],"attrs":{"id":"auto9938596","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":3}],"attrs":{"id":"auto9987727","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":3}],"attrs":{"id":"auto9987728","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":3}],"attrs":{"id":"auto10086062","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":3}],"attrs":{"id":"auto10086063","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":3}],"attrs":{"id":"auto10012077","type":"SmoNote"},"clef":"bass"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":2}],"attrs":{"id":"auto10012078","type":"SmoNote"},"clef":"bass","articulations":[{"attrs":{"id":"auto10504478","type":"SmoArticulation"},"ctor":"SmoArticulation","position":"above","articulation":"staccato"}]}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"attrs":{"id":"auto179542","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]},{"measureNumber":{"measureNumber":21,"measureIndex":21,"systemIndex":2,"staffId":1},"clef":"bass","adjX":11,"adjRight":15.219999999999999,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":16384,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":2},{"letter":"c","accidental":"n","octave":3}],"attrs":{"id":"auto10603140","type":"SmoNote"},"clef":"bass"}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"},{"position":1,"barline":2,"ctor":"SmoBarline"},{"attrs":{"id":"auto179545","type":"SmoTempoText"},"tempoMode":"text","bpm":96,"display":true,"beatDuration":4096,"tempoText":"Moderato","yOffset":0,"ctor":"SmoTempoText"}]}]}],"scoreText":[{"ctor":"SmoScoreText","attrs":{"id":"auto243888","type":"SmoScoreText"},"backup":{},"edited":false,"x":444,"y":113,"text":"15 Inventions a 2 voix.","pagination":"every","position":"title","fontInfo":{"size":"1.8em","family":"Times New Roman","style":"normal","weight":"normal"},"classes":"score-text auto243888 auto54106 auto20193 auto8606 auto5214 auto2848","boxModel":"none","justification":"left","fill":"black","width":0,"height":0,"scaleX":1,"scaleY":1,"translateX":0,"translateY":0,"autoLayout":false,"renderedBox":{"x":431,"y":136,"height":22,"width":185},"logicalBox":{"x":444.3946228027344,"y":86.72303771972656,"width":264.3504943847656,"height":31.436279296875}}]}` ;
;var basicJson = `{"score":{"layout":{"leftMargin":30,"rightMargin":30,"topMargin":40,"bottomMargin":40,"pageWidth":816,"pageHeight":1056,"orientation":0,"interGap":30,"intraGap":10,"svgScale":1,"zoomScale":2.107843137254902,"zoomMode":0,"pages":1},"startIndex":0,"renumberingMap":{}},"staves":[{"staffId":0,"staffX":10,"staffY":40,"adjY":0,"staffWidth":1600,"staffHeight":90,"startIndex":0,"renumberingMap":{},"keySignatureMap":{},"instrumentInfo":{"instrumentName":"Treble Instrument","keyOffset":"0","clef":"treble"},"modifiers":[],"measures":[{"timeSignature":"4/4","keySignature":"C","staffY":41,"measureNumber":{"measureNumber":0,"measureIndex":0,"systemIndex":0,"staffId":0},"activeVoice":0,"clef":"treble","transposeIndex":0,"adjX":64.98,"padLeft":0,"adjRight":11,"padRight":10,"rightMargin":2,"tuplets":[],"beamGroups":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto318077","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto318078","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto318079","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto318080","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto318081","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto318082","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto318083","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"noteType":"n","attrs":{"id":"auto318084","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto318085","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"a","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto318086","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto318087","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"f","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto318088","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto318089","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"d","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto318090","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"}]},{"timeSignature":"4/4","keySignature":"C","staffY":41,"measureNumber":{"measureNumber":1,"measureIndex":1,"systemIndex":1,"staffId":0},"activeVoice":0,"clef":"treble","transposeIndex":0,"adjX":11,"padLeft":0,"adjRight":11,"padRight":10,"rightMargin":2,"tuplets":[],"beamGroups":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto358929","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto360328","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto360329","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"noteType":"n","attrs":{"id":"auto372785","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"g","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto374186","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":1024,"denominator":1,"remainder":0},"pitches":[{"letter":"e","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto374187","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto381535","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"b","accidental":"n","octave":3}],"noteType":"n","attrs":{"id":"auto354946","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]},{"ticks":{"numerator":4096,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":4}],"noteType":"n","attrs":{"id":"auto389896","type":"SmoNote"},"clef":"treble","endBeam":false,"beamBeats":4096,"flagState":0,"noteModifiers":[],"graceNotes":[],"articulations":[],"ornaments":[]}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"}]}]}],"scoreText":[]}`
;var jesuBambino = `{"a":{"b":{"c":50,"d":50,"e":72,"f":40,"g":816,"h":1056,"i":0,"j":40,"k":30,"l":0.7,"m":1.7,"n":2,"o":5,"p":"letter"},"q":0,"r":{}},"s":[{"t":0,"u":10,"v":40,"w":0,"x":1600,"y":90,"q":0,"r":{},"z":{},"aa":{"ba":"Treble Instrument","ca":"0","da":"treble"},"ea":[{"fa":{"ga":0,"ha":1,"ia":0,"ja":0,"ka":[]},"la":{"ga":0,"ha":1,"ia":0,"ja":1,"ka":[]},"ma":0,"na":10,"oa":10,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":1,"ia":0,"ja":2,"ka":[]},"la":{"ga":0,"ha":1,"ia":0,"ja":3,"ka":[]},"ma":0,"ta":14,"na":10,"oa":30,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":3,"ia":0,"ja":0,"ka":[]},"la":{"ga":0,"ha":3,"ia":0,"ja":1,"ka":[]},"ma":0,"ua":4,"na":40,"oa":40,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":3,"ia":0,"ja":2,"ka":[]},"la":{"ga":0,"ha":3,"ia":0,"ja":3,"ka":[]},"ma":0,"ua":4,"na":40,"oa":40,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":3,"ia":0,"ja":4,"ka":[]},"la":{"ga":0,"ha":3,"ia":0,"ja":5,"ka":[]},"ma":0,"ua":4,"na":40,"oa":40,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":3,"ia":0,"ja":6,"ka":[]},"la":{"ga":0,"ha":3,"ia":0,"ja":7,"ka":[]},"ma":0,"ua":4,"na":40,"oa":40,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":4,"ia":0,"ja":0,"ka":[]},"la":{"ga":0,"ha":4,"ia":0,"ja":1,"ka":[]},"ma":0,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":4,"ia":0,"ja":2,"ka":[]},"la":{"ga":0,"ha":4,"ia":0,"ja":3,"ka":[]},"ma":0,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":4,"ia":0,"ja":4,"ka":[]},"la":{"ga":0,"ha":4,"ia":0,"ja":5,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":4,"ia":0,"ja":6,"ka":[]},"la":{"ga":0,"ha":4,"ia":0,"ja":7,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":1,"ia":0,"ja":4,"ka":[]},"la":{"ga":0,"ha":1,"ia":0,"ja":5,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":1,"ia":0,"ja":6,"ka":[]},"la":{"ga":0,"ha":1,"ia":0,"ja":7,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":16,"ia":0,"ja":0,"ka":[]},"la":{"ga":0,"ha":17,"ia":0,"ja":0,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":18,"ia":0,"ja":0,"ka":[]},"la":{"ga":0,"ha":18,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":18,"ia":0,"ja":2,"ka":[]},"la":{"ga":0,"ha":18,"ia":0,"ja":3,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":18,"ia":0,"ja":4,"ka":[]},"la":{"ga":0,"ha":18,"ia":0,"ja":5,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":18,"ia":0,"ja":6,"ka":[]},"la":{"ga":0,"ha":18,"ia":0,"ja":7,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":20,"ia":0,"ja":0,"ka":[]},"la":{"ga":0,"ha":20,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":20,"ia":0,"ja":2,"ka":[]},"la":{"ga":0,"ha":20,"ia":0,"ja":3,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":20,"ia":0,"ja":4,"ka":[]},"la":{"ga":0,"ha":20,"ia":0,"ja":5,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":20,"ia":0,"ja":6,"ka":[]},"la":{"ga":0,"ha":20,"ia":0,"ja":7,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":21,"ia":0,"ja":0,"ka":[]},"la":{"ga":0,"ha":21,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":21,"ia":0,"ja":2,"ka":[]},"la":{"ga":0,"ha":21,"ia":0,"ja":3,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":21,"ia":0,"ja":4,"ka":[]},"la":{"ga":0,"ha":21,"ia":0,"ja":5,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":21,"ia":0,"ja":6,"ka":[]},"la":{"ga":0,"ha":21,"ia":0,"ja":7,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":22,"ia":0,"ja":0,"ka":[]},"la":{"ga":0,"ha":22,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":22,"ia":0,"ja":2,"ka":[]},"la":{"ga":0,"ha":22,"ia":0,"ja":3,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":22,"ia":0,"ja":4,"ka":[]},"la":{"ga":0,"ha":22,"ia":0,"ja":5,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":22,"ia":0,"ja":6,"ka":[]},"la":{"ga":0,"ha":22,"ia":0,"ja":7,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":0,"ha":27,"ia":0,"ja":0,"ka":[]},"la":{"ga":0,"ha":27,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"}],"va":[{"wa":"12/8","xa":"G","ya":{"ya":-1,"za":0,"ab":0,"t":0},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":"2048","hb":1,"ib":0},"ka":[{"jb":"d","kb":5,"lb":"n"}],"da":"treble"}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":0,"za":1,"ab":1,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"b","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":6}],"da":"treble","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":6}],"da":"treble","rb":true,"qb":2048},{"ka":[{"jb":"b","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":6}],"da":"treble","qb":6144},{"ka":[{"jb":"c","lb":"n","kb":6}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":6}],"da":"treble","rb":true,"qb":2048}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":1,"za":2,"ab":2,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":6}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":6}],"da":"treble","qb":6144},{"ka":[{"jb":"c","lb":"n","kb":6}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":5},{"jb":"a","lb":"n","kb":5}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":2,"za":3,"ab":3,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","rb":true,"qb":2048},{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","rb":true,"qb":2048}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":3,"za":4,"ab":0,"t":0},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","rb":true,"qb":2048},{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","rb":true,"qb":2048}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":4,"za":5,"ab":1,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","rb":true,"qb":2048},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":" ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144},{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ld":true,"ya":{"ya":5,"za":6,"ab":0,"t":0},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","rb":true,"qb":6144},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":6,"za":7,"ab":1,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ld":true,"ya":{"ya":7,"za":8,"ab":0,"t":0},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":8,"za":9,"ab":1,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"g","lb":"n","kb":4},{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":4},{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"ka":[{"jb":"g","lb":"n","kb":4},{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"b","kb":4},{"jb":"d","lb":"n","kb":5}],"da":"treble","rb":true,"qb":2048},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4},{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4},{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"b","kb":4,"pc":false}],"da":"treble","rb":true,"qb":6144},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":4},{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":4},{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4},{"jb":"g","lb":"n","kb":4}],"da":"treble","rb":true,"qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":9,"za":10,"ab":0,"t":0},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"ka":[{"jb":"f","lb":"#","kb":4},{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":4},{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144},{"ka":[{"jb":"e","lb":"b","kb":4},{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":4},{"jb":"g","lb":"n","kb":4}],"da":"treble","rb":true,"qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":4},{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":4},{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4},{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4},{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4},{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":10,"za":11,"ab":1,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"c","lb":"n","kb":5},{"jb":"f","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":" ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5},{"jb":"f","lb":"n","kb":5}],"da":"treble","rb":true,"qb":6144},{"ka":[{"jb":"c","lb":"n","kb":5},{"jb":"f","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5},{"jb":"f","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"c","lb":"n","kb":5},{"jb":"f","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5},{"jb":"f","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"c","lb":"n","kb":5},{"jb":"f","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ld":true,"ya":{"ya":11,"za":12,"ab":0,"t":0},"bb":138.3,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144},{"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":4}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":12,"za":13,"ab":1,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":5}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":13,"za":14,"ab":2,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144},{"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":4}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":14,"za":15,"ab":3,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","rb":true,"qb":2048},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":5}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":15,"za":16,"ab":0,"t":0},"bb":112.02000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":16,"za":17,"ab":1,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":17,"za":18,"ab":0,"t":0},"bb":138.3,"cb":[],"db":[{"eb":[{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":18,"za":19,"ab":1,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":4},{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":19,"za":20,"ab":2,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":20,"za":21,"ab":0,"t":0},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":21,"za":22,"ab":1,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":22,"za":23,"ab":2,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","rb":true,"qb":6144},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"f","sa":"SmoDynamicText"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":23,"za":24,"ab":0,"t":0},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"ka":[{"jb":"g","lb":"n","kb":4},{"jb":"e","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4},{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"ka":[{"jb":"g","lb":"n","kb":4},{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":4},{"jb":"a","lb":"b","kb":4}],"da":"treble","qb":6144},{"ka":[{"jb":"e","lb":"b","kb":4},{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":4},{"jb":"g","lb":"n","kb":4}],"da":"treble","rb":true,"qb":2048},{"ka":[{"jb":"d","lb":"n","kb":4},{"jb":"f","lb":"#","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4},{"jb":"g","lb":"n","kb":4}],"da":"treble","rb":true,"qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":24,"za":25,"ab":1,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"c","lb":"n","kb":4},{"jb":"f","lb":"#","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":4},{"jb":"f","lb":"#","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":4},{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ld":true,"ya":{"ya":25,"za":26,"ab":0,"t":0},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":5}],"da":"treble","qb":6144}]}],"ea":[]},{"wa":"9/8","xa":"G","ya":{"ya":26,"za":27,"ab":1,"t":0},"bb":20.48,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4},{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4},{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144}]}],"ea":[]},{"wa":"9/8","xa":"G","ya":{"ya":27,"za":28,"ab":2,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3},{"jb":"b","lb":"b","kb":3}],"da":"treble","qb":6144,"qc":[{"rc":"fermata","sa":"SmoArticulation"}]},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[]},{"wa":"12/8","xa":"G","ld":true,"ya":{"ya":28,"za":29,"ab":0,"t":0},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":6}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":6}],"da":"treble","qb":6144},{"ka":[{"jb":"c","lb":"n","kb":6}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":5},{"jb":"a","lb":"n","kb":5}],"da":"treble","qb":6144}]}],"ea":[]},{"wa":"12/8","xa":"G","ya":{"ya":29,"za":30,"ab":1,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","rb":true,"qb":6144},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144}]}],"ea":[{"nb":62,"ob":true,"pb":6144,"sa":"SmoTempoText"},{"tb":"a tempo","sa":"SmoMeasureText"}]},{"wa":"12/8","xa":"G","ya":{"ya":30,"za":31,"ab":2,"t":0},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":5}],"da":"treble","qb":6144,"qc":[{"rc":"fermata","sa":"SmoArticulation"}]}]}],"ea":[{"nb":62,"ob":true,"pb":6144,"sa":"SmoTempoText"}]}]},{"t":1,"u":10,"v":40,"w":0,"x":1600,"y":90,"q":0,"r":{},"z":{},"aa":{"ba":"Bass Clef Staff","ca":0,"da":"bass"},"ea":[{"fa":{"ga":1,"ha":3,"ia":0,"ja":0,"ka":[]},"la":{"ga":1,"ha":3,"ia":0,"ja":3,"ka":[]},"ma":0,"ua":4,"na":40,"oa":40,"sa":"SmoSlur"},{"fa":{"ga":1,"ha":4,"ia":0,"ja":0,"ka":[]},"la":{"ga":1,"ha":4,"ia":0,"ja":3,"ka":[]},"ma":0,"ua":4,"na":40,"oa":40,"sa":"SmoSlur"},{"fa":{"ga":1,"ha":5,"ia":0,"ja":0,"ka":[]},"la":{"ga":1,"ha":5,"ia":0,"ja":3,"ka":[]},"ma":0,"ua":4,"na":40,"oa":40,"sa":"SmoSlur"},{"fa":{"ga":1,"ha":20,"ia":0,"ja":0,"ka":[]},"la":{"ga":1,"ha":20,"ia":0,"ja":3,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":1,"ha":21,"ia":0,"ja":0,"ka":[]},"la":{"ga":1,"ha":21,"ia":0,"ja":3,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":1,"ha":22,"ia":0,"ja":0,"ka":[]},"la":{"ga":1,"ha":22,"ia":0,"ja":3,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":1,"ha":22,"ia":0,"ja":0,"ka":[]},"la":{"ga":1,"ha":22,"ia":0,"ja":3,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":1,"ha":22,"ia":0,"ja":0,"ka":[]},"la":{"ga":1,"ha":22,"ia":0,"ja":3,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":1,"ha":23,"ia":0,"ja":0,"ka":[]},"la":{"ga":1,"ha":23,"ia":0,"ja":3,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":1,"ha":27,"ia":0,"ja":0,"ka":[]},"la":{"ga":1,"ha":27,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":1,"ha":30,"ia":0,"ja":2,"ka":[]},"la":{"ga":1,"ha":31,"ia":0,"ja":0,"ka":[]},"ua":4,"sa":"SmoSlur"}],"va":[{"wa":"12/8","xa":"G","ya":{"ya":-1,"za":0,"ab":0,"t":1},"da":"bass","bb":97.56,"cb":[],"db":[{"eb":[{"fb":{"gb":"2048","hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble"}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":0,"za":1,"ab":1,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3},{"jb":"b","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":3},{"jb":"c","lb":"n","kb":4}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3},{"jb":"b","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3},{"jb":"c","lb":"n","kb":4}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":1,"za":2,"ab":2,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3},{"jb":"b","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":3}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":2,"za":3,"ab":3,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":3,"za":4,"ab":0,"t":1},"da":"bass","bb":97.56,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":4,"za":5,"ab":1,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ld":true,"ya":{"ya":5,"za":6,"ab":0,"t":1},"da":"bass","bb":97.56,"cb":[],"db":[{"eb":[{"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":3}],"oc":"r","da":"bass","qb":6144},{"ka":[{"jb":"d","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":3}],"da":"bass","qb":6144},{"ka":[{"jb":"d","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":3}],"oc":"r","da":"bass","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":6,"za":7,"ab":1,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"oc":"r","da":"bass","qb":6144},{"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"oc":"r","da":"bass","qb":6144},{"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":3}],"da":"bass","qb":6144},{"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ld":true,"ya":{"ya":7,"za":8,"ab":0,"t":1},"da":"bass","bb":97.56,"cb":[],"db":[{"eb":[{"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"oc":"r","da":"bass","qb":6144},{"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":3}],"oc":"r","da":"bass","qb":6144},{"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":3}],"da":"bass","qb":6144},{"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":8,"za":9,"ab":1,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":4}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":9,"za":10,"ab":0,"t":1},"da":"bass","bb":97.56,"cb":[],"db":[{"eb":[{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":4},{"jb":"d","lb":"n","kb":4}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3}],"oc":"r","da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":4}],"da":"bass","qb":6144},{"ka":[{"jb":"b","lb":"b","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3}],"da":"bass","qb":6144},{"ka":[{"jb":"d","lb":"n","kb":4}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":4}],"da":"bass","qb":6144},{"ka":[{"jb":"d","lb":"n","kb":4}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":10,"za":11,"ab":1,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"a","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3}],"da":"bass","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3}],"da":"bass","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3}],"da":"bass","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3}],"oc":"r","da":"bass","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ld":true,"ya":{"ya":11,"za":12,"ab":0,"t":1},"da":"bass","bb":140.12,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3},{"jb":"d","lb":"n","kb":4}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3},{"jb":"e","lb":"b","kb":4}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3},{"jb":"e","lb":"b","kb":4}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":12,"za":13,"ab":1,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3},{"jb":"d","lb":"n","kb":4}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3},{"jb":"e","lb":"b","kb":4}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3},{"jb":"e","lb":"b","kb":4}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":13,"za":14,"ab":2,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3},{"jb":"d","lb":"n","kb":4}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3},{"jb":"e","lb":"b","kb":4}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3},{"jb":"d","lb":"n","kb":4}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3},{"jb":"e","lb":"b","kb":4}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":14,"za":15,"ab":3,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3},{"jb":"d","lb":"n","kb":4}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3},{"jb":"e","lb":"b","kb":4}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3},{"jb":"d","lb":"n","kb":4}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3},{"jb":"c","lb":"n","kb":4}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":15,"za":16,"ab":0,"t":1},"sc":1,"da":"bass","bb":113.84,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":3}],"da":"bass","qb":6144,"tc":2},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":3}],"da":"bass","qb":6144,"tc":2},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":3}],"da":"bass","qb":6144,"tc":2},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":3}],"da":"bass","qb":6144,"tc":2}]},{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":4}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":4}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":4}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":4}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":4}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":4}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":4}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":4}],"da":"bass","qb":6144,"tc":1}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":16,"za":17,"ab":1,"t":1},"sc":1,"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":3}],"da":"bass","qb":6144,"tc":2},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":3}],"da":"bass","qb":6144,"tc":2},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":3}],"da":"bass","qb":6144,"tc":2},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":3}],"da":"bass","qb":6144,"tc":2}]},{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":4}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":4}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":3}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":3}],"da":"bass","qb":6144,"tc":1},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":4}],"da":"bass","qb":6144,"tc":1}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":17,"za":18,"ab":0,"t":1},"da":"bass","bb":140.12,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3},{"jb":"b","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":3},{"jb":"c","lb":"n","kb":4}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3},{"jb":"b","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3},{"jb":"c","lb":"n","kb":4}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":18,"za":19,"ab":1,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3},{"jb":"b","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":3}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":19,"za":20,"ab":2,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":20,"za":21,"ab":0,"t":1},"da":"bass","bb":97.56,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":21,"za":22,"ab":1,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":3}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":22,"za":23,"ab":2,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144,"sb":[{"tb":" ","sa":"SmoLyric"},{"tb":"f","sa":"SmoDynamicText"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":23,"za":24,"ab":0,"t":1},"da":"bass","bb":97.56,"cb":[],"db":[{"eb":[{"ka":[{"jb":"g","lb":"n","kb":2}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":3}],"da":"bass","rb":true,"qb":6144},{"ka":[{"jb":"g","lb":"n","kb":2}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":2}],"da":"bass","qb":6144},{"ka":[{"jb":"c","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":2}],"da":"bass","qb":6144},{"ka":[{"jb":"b","lb":"b","kb":2}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":3}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":24,"za":25,"ab":1,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"a","lb":"n","kb":2}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":3}],"da":"bass","rb":true,"qb":6144},{"ka":[{"jb":"g","lb":"n","kb":2}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":2}],"da":"bass","rb":true,"qb":6144},{"ka":[{"jb":"c","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":2}],"da":"bass","qb":6144},{"ka":[{"jb":"b","lb":"b","kb":2}],"da":"bass","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":2}],"da":"bass","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ld":true,"ya":{"ya":25,"za":26,"ab":0,"t":1},"da":"bass","bb":97.56,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":3}],"oc":"r","da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":2}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":2}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"n","kb":3}],"da":"bass","qb":6144}]}],"ea":[]},{"wa":"9/8","xa":"G","ya":{"ya":26,"za":27,"ab":1,"t":1},"da":"bass","bb":20.48,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":3}],"da":"bass","qb":6144}]}],"ea":[]},{"wa":"9/8","xa":"G","ya":{"ya":27,"za":28,"ab":2,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":3}],"oc":"r","da":"bass","qb":6144}]}],"ea":[]},{"wa":"12/8","xa":"G","ld":true,"ya":{"ya":28,"za":29,"ab":0,"t":1},"da":"bass","bb":97.56,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3},{"jb":"b","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":3}],"da":"bass","qb":6144,"qc":[{"rc":"fermata","sa":"SmoArticulation"}]}]}],"ea":[]},{"wa":"12/8","xa":"G","ya":{"ya":29,"za":30,"ab":1,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144}]}],"ea":[{"nb":62,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":30,"za":31,"ab":2,"t":1},"da":"bass","bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":3}],"da":"bass","qb":6144}]}],"ea":[{"nb":62,"ob":true,"pb":6144,"sa":"SmoTempoText"}]}]},{"t":2,"u":10,"v":40,"w":0,"x":1600,"y":90,"q":0,"r":{},"z":{},"aa":{"ba":"Treble Clef Staff","ca":0,"da":"treble"},"ea":[{"fa":{"ga":2,"ha":3,"ia":0,"ja":0,"ka":[]},"la":{"ga":2,"ha":3,"ia":0,"ja":1,"ka":[]},"ma":-10,"na":10,"oa":10,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":3,"ia":0,"ja":3,"ka":[]},"la":{"ga":2,"ha":3,"ia":0,"ja":4,"ka":[]},"ma":-10,"ua":"2","na":10,"oa":10,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":3,"ia":0,"ja":6,"ka":[]},"la":{"ga":2,"ha":3,"ia":0,"ja":7,"ka":[]},"ma":-10,"na":10,"oa":10,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":4,"ia":0,"ja":5,"ka":[]},"la":{"ga":2,"ha":4,"ia":0,"ja":6,"ka":[]},"sa":"SmoSlur"},{"fa":{"ga":2,"ha":9,"ia":0,"ja":0,"ka":[]},"la":{"ga":2,"ha":9,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":8,"ia":0,"ja":6,"ka":[]},"la":{"ga":2,"ha":9,"ia":0,"ja":0,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":11,"ia":0,"ja":0,"ka":[]},"la":{"ga":2,"ha":11,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":11,"ia":0,"ja":1,"ka":[]},"la":{"ga":2,"ha":11,"ia":0,"ja":2,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":7,"ia":0,"ja":0,"ka":[]},"la":{"ga":2,"ha":7,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":7,"ia":0,"ja":3,"ka":[]},"la":{"ga":2,"ha":7,"ia":0,"ja":4,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":8,"ia":0,"ja":0,"ka":[]},"la":{"ga":2,"ha":8,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":8,"ia":0,"ja":3,"ka":[]},"la":{"ga":2,"ha":8,"ia":0,"ja":4,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":19,"ia":0,"ja":5,"ka":[]},"la":{"ga":2,"ha":19,"ia":0,"ja":6,"ka":[]},"ma":-14,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":21,"ia":0,"ja":0,"ka":[]},"la":{"ga":2,"ha":21,"ia":0,"ja":1,"ka":[]},"ma":-14,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":20,"ia":0,"ja":0,"ka":[]},"la":{"ga":2,"ha":20,"ia":0,"ja":9,"ka":[]},"uc":true,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":21,"ia":0,"ja":3,"ka":[]},"la":{"ga":2,"ha":21,"ia":0,"ja":4,"ka":[]},"ma":-10,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":21,"ia":0,"ja":6,"ka":[]},"la":{"ga":2,"ha":21,"ia":0,"ja":7,"ka":[]},"ma":-12,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":24,"ia":0,"ja":0,"ka":[]},"la":{"ga":2,"ha":24,"ia":0,"ja":1,"ka":[]},"ma":-10,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":28,"ia":0,"ja":0,"ka":[]},"la":{"ga":2,"ha":28,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":2,"ha":29,"ia":0,"ja":0,"ka":[]},"la":{"ga":2,"ha":29,"ia":0,"ja":4,"ka":[]},"ua":4,"sa":"SmoSlur"}],"va":[{"wa":"12/8","xa":"G","ya":{"ya":-1,"za":0,"ab":0,"t":2},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":"2048","hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":0,"za":1,"ab":1,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":1,"za":2,"ab":2,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"Ne-","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":2,"za":3,"ab":3,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":" ll'u-","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"u   ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"ni   ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"mile-","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"i   ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"cap-","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"a   ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"nna","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"nel ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":3,"za":4,"ab":0,"t":2},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"fre- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","rb":true,"qb":6144,"sb":[{"tb":"ddo  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"e  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"po- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","rb":true,"qb":6144,"sb":[{"tb":"ver- ","sa":"SmoLyric"}]},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"ta  ","sa":"SmoLyric"}]},{"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":4,"za":5,"ab":1,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ld":true,"ya":{"ya":5,"za":6,"ab":0,"t":2},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":8192,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"O- ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":6,"za":7,"ab":1,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"sa- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"nna  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"O  ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"sa- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"nna  ","sa":"SmoLyric"}]},{"ka":[{"jb":"e","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"can  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","rb":true,"qb":6144,"sb":[{"tb":"ta- ","sa":"SmoLyric"}]},{"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"no  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"con  ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ld":true,"ya":{"ya":7,"za":8,"ab":0,"t":2},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"gui- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":5}],"da":"treble","rb":true,"qb":6144,"sb":[{"tb":"bi  ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":" lan-","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"n","kb":5}],"da":"treble","rb":true,"qb":6144,"sb":[{"tb":"te  ","sa":"SmoLyric"}]},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"cor ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":8,"za":9,"ab":1,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","rb":true,"qb":2048,"sb":[{"tb":"I  ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"tuo  ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"i  ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"pa- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"sto- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"ri  ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":9,"za":10,"ab":0,"t":2},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"an- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"gel- ","sa":"SmoLyric"}]},{"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"i  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"o  ","sa":"SmoLyric"}]},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"re- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"di  ","sa":"SmoLyric"}]},{"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"luce  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"e'a  ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":10,"za":11,"ab":1,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"more ","sa":"SmoLyric"}]},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"f","lb":"n","kb":5}],"da":"treble","qb":6144,"qc":[{"ua":"below","rc":"fermata","sa":"SmoArticulation"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ld":true,"ya":{"ya":11,"za":12,"ab":0,"t":2},"bb":138.3,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":12,"za":13,"ab":1,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":13,"za":14,"ab":2,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":14,"za":15,"ab":3,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":15,"za":16,"ab":0,"t":2},"bb":112.02000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":16,"za":17,"ab":1,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":2048,"sb":[{"tb":"Ah- ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":17,"za":18,"ab":0,"t":2},"bb":138.3,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":" ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"  ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":" ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"Ve ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":18,"za":19,"ab":1,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"ni- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","rb":true,"qb":6144,"sb":[{"tb":"te  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"a- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"do- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"re- ","sa":"SmoLyric"}]},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"mus ","sa":"SmoLyric"}]},{"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"Ah!  ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":19,"za":20,"ab":2,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"  ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"  ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":" ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"treble","qb":2048,"sb":[{"tb":"a- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"treble","rb":true,"qb":2048,"sb":[{"tb":"do  ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":20,"za":21,"ab":0,"t":2},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"re- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"mus  ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"Do- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"mi- ","sa":"SmoLyric"}]},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"num ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","rb":true,"qb":2048},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"ve- ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":21,"za":22,"ab":1,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"ni- ","sa":"SmoLyric"}]},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"te ","sa":"SmoLyric"}]},{"ka":[{"jb":"d","lb":"n","kb":5}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"ve- ","sa":"SmoLyric"},{"tb":"p","sa":"SmoDynamicText"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":22,"za":23,"ab":2,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"ni- ","sa":"SmoLyric"}]},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"te ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":23,"za":24,"ab":0,"t":2},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","rb":true,"qb":2048,"sb":[{"tb":"ve- ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"ni- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","rb":true,"qb":6144,"sb":[{"tb":"te  ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"a  ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"dor- ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":24,"za":25,"ab":1,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"re  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"mus ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","rb":true,"qb":2048},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ld":true,"ya":{"ya":25,"za":26,"ab":0,"t":2},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"A- ","sa":"SmoLyric"}]},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"  ","sa":"SmoLyric"}]},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"do- ","sa":"SmoLyric"}]}]}],"ea":[]},{"wa":"9/8","xa":"G","ya":{"ya":26,"za":27,"ab":1,"t":2},"bb":20.48,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"re- ","sa":"SmoLyric"}]}]}],"ea":[]},{"wa":"9/8","xa":"G","ya":{"ya":27,"za":28,"ab":2,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"mus ","sa":"SmoLyric"}],"qc":[{"rc":"fermata","sa":"SmoArticulation"}]},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144}]}],"ea":[]},{"wa":"12/8","xa":"G","ld":true,"ya":{"ya":28,"za":29,"ab":0,"t":2},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"Do  ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"  ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"mi  ","sa":"SmoLyric"}]},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"num ","sa":"SmoLyric"}],"qc":[{"rc":"fermata","sa":"SmoArticulation"}]}]}],"ea":[]},{"wa":"12/8","xa":"G","ya":{"ya":29,"za":30,"ab":1,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":62,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":30,"za":31,"ab":2,"t":2},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":62,"ob":true,"pb":6144,"sa":"SmoTempoText"}]}]},{"t":3,"u":10,"v":40,"w":0,"x":1600,"y":90,"q":0,"r":{},"z":{},"aa":{"ba":"Treble Clef Staff","ca":0,"da":"treble"},"ea":[{"fa":{"ga":3,"ha":6,"ia":0,"ja":6,"ka":[]},"la":{"ga":3,"ha":6,"ia":0,"ja":7,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":6,"ia":0,"ja":6,"ka":[]},"la":{"ga":3,"ha":6,"ia":0,"ja":7,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":11,"ia":0,"ja":0,"ka":[]},"la":{"ga":3,"ha":11,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":11,"ia":0,"ja":1,"ka":[]},"la":{"ga":3,"ha":11,"ia":0,"ja":2,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":7,"ia":0,"ja":0,"ka":[]},"la":{"ga":3,"ha":7,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":7,"ia":0,"ja":3,"ka":[]},"la":{"ga":3,"ha":7,"ia":0,"ja":4,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":8,"ia":0,"ja":0,"ka":[]},"la":{"ga":3,"ha":8,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":8,"ia":0,"ja":3,"ka":[]},"la":{"ga":3,"ha":8,"ia":0,"ja":4,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":20,"ia":0,"ja":0,"ka":[]},"la":{"ga":3,"ha":20,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":22,"ia":0,"ja":6,"ka":[]},"la":{"ga":3,"ha":22,"ia":0,"ja":7,"ka":[]},"ma":-9,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":24,"ia":0,"ja":0,"ka":[]},"la":{"ga":3,"ha":24,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":25,"ia":0,"ja":0,"ka":[]},"la":{"ga":3,"ha":25,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":18,"ia":0,"ja":4,"ka":[]},"la":{"ga":3,"ha":19,"ia":0,"ja":3,"ka":[]},"uc":true,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":28,"ia":0,"ja":0,"ka":[]},"la":{"ga":3,"ha":28,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":20,"ia":0,"ja":3,"ka":[]},"la":{"ga":3,"ha":20,"ia":0,"ja":8,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":29,"ia":0,"ja":0,"ka":[]},"la":{"ga":3,"ha":29,"ia":0,"ja":4,"ka":[]},"sa":"SmoSlur"},{"fa":{"ga":3,"ha":22,"ia":0,"ja":0,"ka":[]},"la":{"ga":3,"ha":22,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":22,"ia":0,"ja":3,"ka":[]},"la":{"ga":3,"ha":22,"ia":0,"ja":4,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":23,"ia":0,"ja":0,"ka":[]},"la":{"ga":3,"ha":23,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":23,"ia":0,"ja":3,"ka":[]},"la":{"ga":3,"ha":23,"ia":0,"ja":4,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":5,"ia":0,"ja":0,"ka":[]},"la":{"ga":3,"ha":5,"ia":0,"ja":1,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":5,"ia":0,"ja":3,"ka":[]},"la":{"ga":3,"ha":5,"ia":0,"ja":4,"ka":[]},"ua":4,"sa":"SmoSlur"},{"fa":{"ga":3,"ha":5,"ia":0,"ja":6,"ka":[]},"la":{"ga":3,"ha":5,"ia":0,"ja":7,"ka":[]},"ua":4,"sa":"SmoSlur"}],"va":[{"wa":"12/8","xa":"G","ya":{"ya":-1,"za":0,"ab":0,"t":3},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":"2048","hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":0,"za":1,"ab":1,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":1,"za":2,"ab":2,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":2,"za":3,"ab":3,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":3,"za":4,"ab":0,"t":3},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":8192,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"e  ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":4,"za":5,"ab":1,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"na- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"to  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"il  ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"Sa- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"nto  ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"pa- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","rb":true,"qb":6144,"sb":[{"tb":"rgo- ","sa":"SmoLyric"}]},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"lo  ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"treble","qb":2048,"sb":[{"tb":"che- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"treble","rb":true,"qb":2048,"sb":[{"tb":"il ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ld":true,"ya":{"ya":5,"za":6,"ab":0,"t":3},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"mo- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"ndo  ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"a- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"do- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"re  ","sa":"SmoLyric"}]},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"ra  ","sa":"SmoLyric"}]},{"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":" ","sa":"SmoLyric"},{"tb":"f","sa":"SmoDynamicText"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"O- ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":6,"za":7,"ab":1,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"sa- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"nna  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"O  ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"sa- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"na  ","sa":"SmoLyric"}]},{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"can- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","rb":true,"qb":6144,"sb":[{"tb":"ta- ","sa":"SmoLyric"}]},{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"no  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"con  ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ld":true,"ya":{"ya":7,"za":8,"ab":0,"t":3},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"gui- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"n","kb":5}],"da":"treble","rb":true,"qb":6144,"sb":[{"tb":"bi  ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"lan- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","rb":true,"qb":6144,"sb":[{"tb":"te  ","sa":"SmoLyric"}]},{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":" cor ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"con  ","sa":"SmoLyric"}]},{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"bui- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"bi- ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":8,"za":9,"ab":1,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"la- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"nte  ","sa":"SmoLyric"}]},{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"core  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","rb":true,"qb":2048,"sb":[{"tb":"I  ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"tuo- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"   ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"i  ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"pa- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"sto-  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"ri  ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":9,"za":10,"ab":0,"t":3},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"ka":[{"jb":"f","lb":"#","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"an-  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"gel-  ","sa":"SmoLyric"}]},{"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"i   ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"o  ","sa":"SmoLyric"}]},{"ka":[{"jb":"f","lb":"#","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"re-  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"di   ","sa":"SmoLyric"}]},{"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"luce  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"e'a  ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":10,"za":11,"ab":1,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"more ","sa":"SmoLyric"}]},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"qc":[{"rc":"fermata","sa":"SmoArticulation"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ld":true,"ya":{"ya":11,"za":12,"ab":0,"t":3},"bb":138.3,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":12,"za":13,"ab":1,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":13,"za":14,"ab":2,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":14,"za":15,"ab":3,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":15,"za":16,"ab":0,"t":3},"bb":112.02000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"Bb","ya":{"ya":16,"za":17,"ab":1,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":17,"za":18,"ab":0,"t":3},"bb":138.3,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"treble","qb":2048,"sb":[{"tb":"Ah- ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":" ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":18,"za":19,"ab":1,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"Ve- ","sa":"SmoLyric"}]},{"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"ni- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","rb":true,"qb":2048,"sb":[{"tb":"te  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"a- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"do  ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":19,"za":20,"ab":2,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"re- ","sa":"SmoLyric"}]},{"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"mus  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"treble","rb":true,"qb":6144,"sb":[{"tb":"Ah- ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"  ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":" ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":20,"za":21,"ab":0,"t":3},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"  ","sa":"SmoLyric"}]},{"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":4}],"da":"treble","rb":true,"qb":6144,"sb":[{"tb":" ","sa":"SmoLyric"}]},{"fb":{"gb":8192,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"ve- ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":21,"za":22,"ab":1,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"ni- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"te  ","sa":"SmoLyric"}]},{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"  ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"ve- ","sa":"SmoLyric"},{"tb":"p","sa":"SmoDynamicText"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":22,"za":23,"ab":2,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"ni- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"d","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"c","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"te ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":23,"za":24,"ab":0,"t":3},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","rb":true,"qb":2048,"sb":[{"tb":"ve- ","sa":"SmoLyric"}]},{"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"ni- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","rb":true,"qb":2048,"sb":[{"tb":"te- ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"a  ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"dor  ","sa":"SmoLyric"}]}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":24,"za":25,"ab":1,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":4,"pc":true}],"da":"treble","qb":6144,"sb":[{"tb":" re-","sa":"SmoLyric"}]},{"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"mus ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":2048},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":2048}]}],"ea":[{"nb":56,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ld":true,"ya":{"ya":25,"za":26,"ab":0,"t":3},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"A  ","sa":"SmoLyric"}]},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"do- ","sa":"SmoLyric"}]}]}],"ea":[]},{"wa":"9/8","xa":"G","ya":{"ya":26,"za":27,"ab":1,"t":3},"bb":20.48,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":" ","sa":"SmoLyric"}]},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"e","lb":"b","kb":5}],"da":"treble","qb":6144,"sb":[{"tb":"re- ","sa":"SmoLyric"}]}]}],"ea":[]},{"wa":"9/8","xa":"G","ya":{"ya":27,"za":28,"ab":2,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"mus  ","sa":"SmoLyric"}],"qc":[{"rc":"fermata","sa":"SmoArticulation"}]},{"fb":{"gb":6144,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"b","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":" ","sa":"SmoLyric"}]}]}],"ea":[]},{"wa":"12/8","xa":"G","ld":true,"ya":{"ya":28,"za":29,"ab":0,"t":3},"bb":95.74000000000001,"cb":[],"db":[{"eb":[{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"da":"treble","qb":6144,"tc":2,"sb":[{"tb":"Do  ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"tc":2,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"tc":2,"sb":[{"tb":"  ","sa":"SmoLyric"}]},{"fb":{"gb":3072,"hb":1,"ib":0},"ka":[{"jb":"a","lb":"n","kb":4}],"da":"treble","qb":6144,"tc":2,"sb":[{"tb":"  ","sa":"SmoLyric"}]},{"fb":{"gb":1024,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"tc":2,"sb":[{"tb":"- ","sa":"SmoLyric"}]},{"fb":{"gb":2048,"hb":1,"ib":0},"ka":[{"jb":"f","lb":"#","kb":4}],"da":"treble","qb":6144,"tc":2,"sb":[{"tb":"mi  ","sa":"SmoLyric"}]},{"fb":{"gb":12288,"hb":1,"ib":0},"ka":[{"jb":"g","lb":"n","kb":4}],"da":"treble","qb":6144,"sb":[{"tb":"num ","sa":"SmoLyric"}],"qc":[{"rc":"fermata","sa":"SmoArticulation"}]}]}],"ea":[]},{"wa":"12/8","xa":"G","ya":{"ya":29,"za":30,"ab":1,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":62,"ob":true,"pb":6144,"sa":"SmoTempoText"}]},{"wa":"12/8","xa":"G","ya":{"ya":30,"za":31,"ab":2,"t":3},"bb":2,"cb":[],"db":[{"eb":[{"fb":{"gb":24576,"hb":1,"ib":0},"ka":[{"jb":"b","lb":"n","kb":4}],"oc":"r","da":"treble","qb":6144}]}],"ea":[{"nb":62,"ob":true,"pb":6144,"sa":"SmoTempoText"}]}]}],"yc":[{"jc":527,"kc":66,"tb":"Gesu Bambino","ua":"title","vb":{"wb":"1.8em","xb":"Times New Roman","yb":"normal","zb":"normal"},"ac":"score-text auto516289 auto6318 auto6933 auto1027477 auto8020 auto8105 auto8091 auto5430 auto403464 auto5713 auto231553 auto81467 auto87725 auto5776 auto5802 auto5879 auto80354 auto3607 auto3571 auto5528 auto7101 auto3442 auto3621 auto10362 auto3645 auto139065 auto3684 auto7371 auto6340 auto4361 auto35627","sa":"SmoScoreText"}],"dictionary":{"a":"score","b":"layout","c":"leftMargin","d":"rightMargin","e":"topMargin","f":"bottomMargin","g":"pageWidth","h":"pageHeight","i":"orientation","j":"interGap","k":"intraGap","l":"svgScale","m":"zoomScale","n":"zoomMode","o":"pages","p":"pageSize","q":"startIndex","r":"renumberingMap","s":"staves","t":"staffId","u":"staffX","v":"staffY","w":"adjY","x":"staffWidth","y":"staffHeight","z":"keySignatureMap","aa":"instrumentInfo","ba":"instrumentName","ca":"keyOffset","da":"clef","ea":"modifiers","fa":"startSelector","ga":"staff","ha":"measure","ia":"voice","ja":"tick","ka":"pitches","la":"endSelector","ma":"xOffset","na":"cp1y","oa":"cp2y","pa":"attrs","qa":"id","ra":"type","sa":"ctor","ta":"yOffset","ua":"position","va":"measures","wa":"timeSignature","xa":"keySignature","ya":"measureNumber","za":"measureIndex","ab":"systemIndex","bb":"adjX","cb":"tuplets","db":"voices","eb":"notes","fb":"ticks","gb":"numerator","hb":"denominator","ib":"remainder","jb":"letter","kb":"octave","lb":"accidental","mb":"symbol","nb":"bpm","ob":"display","pb":"beatDuration","qb":"beamBeats","rb":"endBeam","sb":"textModifiers","tb":"text","ub":"endChar","vb":"fontInfo","wb":"size","xb":"family","yb":"style","zb":"weight","ac":"classes","bc":"verse","cc":"fill","dc":"scaleX","ec":"scaleY","fc":"translateX","gc":"translateY","hc":"selector","ic":"renderedBox","jc":"x","kc":"y","lc":"width","mc":"height","nc":"logicalBox","oc":"noteType","pc":"cautionary","qc":"articulations","rc":"articulation","sc":"activeVoice","tc":"flagState","uc":"invert","vc":"fontSize","wc":"yOffsetLine","xc":"yOffsetPixels","yc":"scoreText","zc":"backup","ad":"edited","bd":"pagination","cd":"boxModel","dd":"justification","ed":"autoLayout","fd":"ornaments","gd":"offset","hd":"ornament","id":"tempoMode","jd":"tempoText","kd":"barline","ld":"systemBreak"}}`;
;var microJson = `{"score":{"layout":{"leftMargin":30,"rightMargin":30,"topMargin":40,"bottomMargin":40,"pageWidth":816,"pageHeight":1056,"orientation":0,"interGap":30,"intraGap":10,"svgScale":1,"zoomScale":2.107843137254902,"zoomMode":0,"pages":1},"startIndex":0,"renumberingMap":{}},"staves":[{"staffId":0,"staffX":10,"staffY":40,"adjY":0,"staffWidth":1600,"staffHeight":90,"startIndex":0,"renumberingMap":{},"keySignatureMap":{},"instrumentInfo":{"instrumentName":"Treble Instrument","keyOffset":"0","clef":"treble"},"modifiers":[],"measures":[{"measureNumber":{"measureNumber":0,"measureIndex":0,"systemIndex":0,"staffId":0},"adjX":64.98,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto6268","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto6269","type":"SmoNote"},"clef":"treble","tones":[{"attrs":{"id":"auto6679","type":"SmoMicrotone"},"ctor":"SmoMicrotone","tone":"flat75sz","pitch":0}]},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto6273","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto6274","type":"SmoNote"},"clef":"treble","tones":[{"attrs":{"id":"auto7062","type":"SmoMicrotone"},"ctor":"SmoMicrotone","tone":"flat25sz","pitch":0}]},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto6279","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto6280","type":"SmoNote"},"clef":"treble","tones":[{"attrs":{"id":"auto8606","type":"SmoMicrotone"},"ctor":"SmoMicrotone","tone":"flat25ar","pitch":0}]},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto6286","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto6287","type":"SmoNote"},"clef":"treble","tones":[{"attrs":{"id":"auto9475","type":"SmoMicrotone"},"ctor":"SmoMicrotone","tone":"sharp75","pitch":0}]}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"}]},{"measureNumber":{"measureNumber":1,"measureIndex":1,"systemIndex":1,"staffId":0},"adjX":11,"adjRight":11,"tuplets":[],"voices":[{"notes":[{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto9944","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto9945","type":"SmoNote"},"clef":"treble","tones":[{"attrs":{"id":"auto10352","type":"SmoMicrotone"},"ctor":"SmoMicrotone","tone":"sharp125","pitch":0}]},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto9949","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto9950","type":"SmoNote"},"clef":"treble","tones":[{"attrs":{"id":"auto10728","type":"SmoMicrotone"},"ctor":"SmoMicrotone","tone":"sharp25","pitch":0}]},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto9955","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto9956","type":"SmoNote"},"clef":"treble","tones":[{"attrs":{"id":"auto11106","type":"SmoMicrotone"},"ctor":"SmoMicrotone","tone":"sori","pitch":0}]},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto9962","type":"SmoNote"},"clef":"treble"},{"ticks":{"numerator":2048,"denominator":1,"remainder":0},"pitches":[{"letter":"c","accidental":"n","octave":5}],"attrs":{"id":"auto9963","type":"SmoNote"},"clef":"treble","tones":[{"attrs":{"id":"auto11486","type":"SmoMicrotone"},"ctor":"SmoMicrotone","tone":"koron","pitch":0}]}]}],"modifiers":[{"position":0,"barline":0,"ctor":"SmoBarline"},{"position":1,"barline":0,"ctor":"SmoBarline"},{"symbol":0,"xOffset":0,"yOffset":30,"position":0,"ctor":"SmoRepeatSymbol"}]}]}],"scoreText":[]}`;
;

// ## RibbonButtons
// Render the ribbon buttons based on group, function, and underlying UI handler.
// Also handles UI events.
// ### RibbonButton methods
// ---
class RibbonButtons {
	static get paramArray() {
		return ['ribbonButtons', 'ribbons', 'editor', 'controller', 'tracker', 'menus'];
	}
	static _buttonHtml(containerClass,buttonId, buttonClass, buttonText, buttonIcon, buttonKey) {
		var b = htmlHelpers.buildDom;
		var r = b('div').classes(containerClass).append(b('button').attr('id', buttonId).classes(buttonClass).append(
					b('span').classes('left-text').append(
					    b('span').classes('text-span').text(buttonText)).append(
					b('span').classes('ribbon-button-text icon ' + buttonIcon))).append(
					b('span').classes('ribbon-button-hotkey').text(buttonKey)));
		return r.dom();
	}
	constructor(parameters) {
		smoSerialize.filteredMerge(RibbonButtons.paramArray, parameters, this);
		this.ribbonButtons = parameters.ribbonButtons;
		this.ribbons = parameters.ribbons;
		this.collapsables = [];
		this.collapseChildren = [];
	}
	_executeButtonModal(buttonElement, buttonData) {
		var ctor = eval(buttonData.ctor);
		ctor.createAndDisplay(buttonElement, buttonData,this.controller);
	}
	_executeButtonMenu(buttonElement, buttonData) {
		var self = this;
        this.controller.unbindKeyboardForMenu(this.menus);
		this.menus.createMenu(buttonData.ctor);
	}
	_rebindController() {
		this.controller.render();
		this.controller.bindEvents();
	}
	_executeButton(buttonElement, buttonData) {
		if (buttonData.action === 'modal') {
			this._executeButtonModal(buttonElement, buttonData);
			return;
		}
		if (buttonData.action === 'menu' || buttonData.action === 'collapseChildMenu') {
			this._executeButtonMenu(buttonElement, buttonData);
			return;
		}
	}

	_bindButton(buttonElement, buttonData) {
		var self = this;
		$(buttonElement).off('click').on('click', function () {
			self._executeButton(buttonElement, buttonData);
		});
	}
    _createCollapsibleButtonGroups(selector) {
        // Now all the button elements have been bound.  Join child and parent buttons
        // For all the children of a button group, add it to the parent group
        this.collapseChildren.forEach((b) => {
            var containerClass = 'ribbonButtonContainer';
            if (b.action == 'collapseGrandchild') {
                containerClass = 'ribbonButtonContainerMore'
            }
            var buttonHtml = RibbonButtons._buttonHtml(
                containerClass,b.id, b.classes, b.leftText, b.icon, b.rightText);
            if (b.dataElements) {
                var bkeys = Object.keys(b.dataElements);
                bkeys.forEach((bkey) => {
                    var de = b.dataElements[bkey];
                    $(buttonHtml).find('button').attr('data-' + bkey, de);
                });
            }
            // Bind the child button actions
            var parent = $(selector).find('.collapseContainer[data-group="' + b.group + '"]');
            $(parent).append(buttonHtml);
            var el = $(selector).find('#' + b.id);
            this._bindButton(el, b);
        });

        this.collapsables.forEach((cb) => {
            // Bind the events of the parent button
            cb.bind();
        });
    }

    static isCollapsible(action) {
        return ['collapseChild','collapseChildMenu','collapseGrandchild','collapseMore'].indexOf(action) >= 0;
    }

    static isBindable(action) {
        return ['collapseChildMenu','menu','modal'].indexOf(action) >= 0;
    }

    // ### _createButtonHtml
    // For each button, create the html and bind the events based on
    // the button's configured action.
	_createRibbonHtml(buttonAr, selector) {
		buttonAr.forEach((buttonId) => {
			var buttonData = this.ribbonButtons.find((e) => {
					return e.id === buttonId;
				});
			if (buttonData) {
                // collapse child is hidden until the parent button is selected, exposing the button group
				if (RibbonButtons.isCollapsible(buttonData.action)) {
					this.collapseChildren.push(buttonData);
                }
				if (buttonData.action != 'collapseChild') {

                    // else the button has a specific action, such as a menu or dialog, or a parent button

					var buttonHtml = RibbonButtons._buttonHtml('ribbonButtonContainer',
                        buttonData.id, buttonData.classes, buttonData.leftText, buttonData.icon, buttonData.rightText);
					$(buttonHtml).attr('data-group', buttonData.group);

					$(selector).append(buttonHtml);
					var buttonElement = $(selector).find('#' + buttonData.id);
					this._bindButton(buttonElement, buttonData);
					if (buttonData.action == 'collapseParent') {
						$(buttonHtml).addClass('collapseContainer');
                        // collapseParent
                		this.collapsables.push(new CollapseRibbonControl({
                				ribbonButtons: this.ribbonButtons,
                				menus: this.menus,
                				tracker: this.tracker,
                				controller: this.controller,
                				editor: this.editor,
                				buttonElement: buttonElement,
                				buttonData: buttonData
                			}));
					}
				}
			}
		});
	}
    createRibbon(buttonDataArray,parentElement) {
        this._createRibbonHtml(buttonDataArray, parentElement);
        this._createCollapsibleButtonGroups(parentElement);
    }

	display() {
		$('body .controls-left').html('');
		$('body .controls-top').html('');

		var buttonAr = this.ribbons['left'];
		this.createRibbon(buttonAr, 'body .controls-left');

		buttonAr = this.ribbons['top'];
		this.createRibbon(buttonAr, 'body .controls-top');
	}
}

class DebugButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
	}
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			$('body').trigger('redrawScore');
		});
    }
}

class ExtendedCollapseParent {
    constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
	}
    bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			$(this).closest('.collapseContainer').toggleClass('expanded-more');
		});
    }
}
class BeamButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
	}
    operation() {
        if (this.buttonData.id === 'breakBeam') {
			this.editor.toggleBeamGroup();
        } else if (this.buttonData.id === 'beamSelections') {
            this.editor.beamSelections();
        } else if (this.buttonData.id === 'toggleBeamDirection') {
            this.editor.toggleBeamDirection();
        }
    }
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			self.operation();
		});
    }
}
class MicrotoneButtons {
    constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
        this.tracker = parameters.tracker
	}
    applyButton(el) {
        var pitch = 0;
        if (this.tracker.selections.length == 1 &&
            this.tracker.selections[0].selector.pitches &&
            this.tracker.selections[0].selector.pitches.length
        ) {
            pitch = this.tracker.selections[0].selector.pitches[0];
        }
        var tn = new SmoMicrotone({tone:el.id,pitch:pitch});
        SmoUndoable.multiSelectionOperation(this.tracker.layout.score,
             this.tracker.selections,'addRemoveMicrotone',tn,this.editor.undoBuffer);
        suiOscillator.playSelectionNow(this.tracker.selections[0]);
        this.tracker.layout.addToReplaceQueue(this.tracker.selections[0]);
    }
    bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
            self.applyButton(self.buttonData);
		});
	}
}
class DurationButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
	}
	setDuration() {
		if (this.buttonData.id === 'GrowDuration') {
			this.editor.doubleDuration();
		} else if (this.buttonData.id === 'LessDuration') {
			this.editor.halveDuration();
		} else if (this.buttonData.id === 'GrowDurationDot') {
			this.editor.dotDuration();
		} else if (this.buttonData.id === 'LessDurationDot') {
			this.editor.undotDuration();
		} else if (this.buttonData.id === 'TripletButton') {
			this.editor.makeTupletCommand(3);
		} else if (this.buttonData.id === 'QuintupletButton') {
			this.editor.makeTupletCommand(5);
		} else if (this.buttonData.id === 'SeptupletButton') {
			this.editor.makeTupletCommand(7);
		} else if (this.buttonData.id === 'NoTupletButton') {
			this.editor.unmakeTuplet();
		}
	}
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			self.setDuration();
		});
	}
}

class VoiceButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
        this.tracker = parameters.tracker;
	}
    _depopulateVoice() {
        var selections = SmoSelection.getMeasureList(this.tracker.selections);
        selections.forEach((selection) => {
            SmoUndoable.depopulateVoice([selection],selection.measure.getActiveVoice(),
               this.editor.undoBuffer);
            selection.measure.setChanged();
        });
        this.tracker.replaceSelectedMeasures();
    }
	setPitch() {
        var voiceIx = 0;
		if (this.buttonData.id === 'V1Button') {
            SmoOperation.setActiveVoice(this.tracker.layout.score,voiceIx);
            var ml = SmoSelection.getMeasureList(this.tracker.selections);
            ml.forEach((sel) => {
                sel.measure.setChanged();
            });
            this.tracker.replaceSelectedMeasures();
            return;
		} else if (this.buttonData.id === 'V2Button') {
			voiceIx = 1;
		} else if (this.buttonData.id === 'V3Button') {
			this.editor.upOctave();
            voiceIx = 2;
		} else if (this.buttonData.id === 'V4Button') {
			this.editor.downOctave();
            voiceIx = 3;
		} else if (this.buttonData.id === 'VXButton') {
        	return this._depopulateVoice();
        }
        SmoUndoable.populateVoice(this.tracker.selections,voiceIx,this.editor.undoBuffer);
        SmoOperation.setActiveVoice(this.tracker.layout.score,voiceIx);
        this.tracker.replaceSelectedMeasures();
    }
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			self.setPitch();
		});
	}
}
class NoteButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
	}
	setPitch() {
		if (this.buttonData.id === 'UpNoteButton') {
			this.editor.transposeUp();
		} else if (this.buttonData.id === 'DownNoteButton') {
			this.editor.transposeDown();
		} else if (this.buttonData.id === 'UpOctaveButton') {
			this.editor.upOctave();
		} else if (this.buttonData.id === 'DownOctaveButton') {
			this.editor.downOctave();
		} else if (this.buttonData.id === 'ToggleAccidental') {
			this.editor.toggleEnharmonic();
		} else if (this.buttonData.id === 'ToggleCourtesy') {
			this.editor.toggleCourtesyAccidental();
		} else if (this.buttonData.id === 'ToggleRestButton') {
			this.editor.makeRest();
		} else if (this.buttonData.id === 'AddGraceNote') {
			this.editor.addGraceNote();
		} else if (this.buttonData.id === 'RemoveGraceNote') {
			this.editor.removeGraceNote();
		} else {
			this.editor.setPitchCommand(this.buttonData.rightText);
		}
	}
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			self.setPitch();
		});
	}
}

class ChordButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
		this.tracker = parameters.tracker;
		this.score = parameters.score;
		this.interval = parseInt($(this.buttonElement).attr('data-interval'));
		this.direction = parseInt($(this.buttonElement).attr('data-direction'));
	}
	static get direction() {
		return {
			up: 1,
			down: -1
		}
	}
	static get intervalButtonMap() {}
	collapseChord() {
		this.editor.collapseChord();
	}
	setInterval() {
		this.editor.intervalAdd(this.interval, this.direction);
	}
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			if ($(self.buttonElement).attr('id') === 'CollapseChordButton') {
				self.collapseChord();
				return;
			}
			self.setInterval();
		});
	}
}

class StaveButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.tracker = parameters.tracker;
		this.editor = parameters.editor;
		this.score = this.editor.score;
	}
	addClef(clef,clefName) {
		var instrument = {
			instrumentName:clefName,
			keyOffset:0,
			clef:clef
		}
		var staff = this.tracker.selections[0].selector.staff;
		var measures = SmoSelection.getMeasureList(this.tracker.selections)
            .map((sel) => sel.measure);
		var selections=[];
		measures.forEach((measure) => {
			selections.push(SmoSelection.measureSelection(this.tracker.layout.score,staff,measure.measureNumber.measureNumber));
		});
		SmoUndoable.changeInstrument(this.tracker.layout.score,instrument,selections,this.editor.undoBuffer);
		this.tracker.replaceSelectedMeasures();
	}
	clefTreble() {
		this.addClef('treble','Treble Instrument');
	}
	clefBass() {
		this.addClef('bass','Bass Instrument');
	}
	clefAlto() {
		this.addClef('alto','Alto Instrument');
	}
	clefTenor() {
		this.addClef('tenor','Tenor Instrument');
	}
    _clefMove(index,direction) {
        SmoUndoable.scoreSelectionOp(this.tracker.layout.score,this.tracker.selections[0],'moveStaffUpDown',
           index,this.editor.undoBuffer,'Move staff '+direction);
        this.tracker.layout.rerenderAll();
    }
    clefMoveUp() {
        this._clefMove(-1,'up');
    }
    clefMoveDown() {
        this._clefMove(1,'down');
    }
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function (ev) {
			 console.log('couch');
			 var id = self.buttonData.id;
			if (typeof(self[id]) === 'function') {
				self[id]();
			}
		});
	}
}
class MeasureButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.tracker = parameters.tracker;
		this.editor = parameters.editor;
		this.score = this.editor.score;
	}
	/*
	 static get barlines() {
        return {
            singleBar: 0,
            doubleBar: 1,
            endBar: 2,
            startRepeat: 3,
            endRepeat: 4,
            none: 5
        }
    }*/
	setEnding(startBar,endBar,number) {
		this.editor.scoreOperation('addEnding',new SmoVolta({startBar:startBar,endBar:endBar,number:number}));

	}
	setBarline(selection,position,barline,description) {
		this.editor.scoreSelectionOperation(selection, 'setMeasureBarline', new SmoBarline({position:position,barline:barline})
		    ,description);
	}
	setSymbol(selection,position,symbol,description) {
		this.editor.scoreSelectionOperation(selection, 'setRepeatSymbol', new SmoRepeatSymbol({position:position,symbol:symbol})
		    ,description);
	}
	endRepeat() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setBarline(selection,SmoBarline.positions.end,SmoBarline.barlines.endRepeat,'add repeat');
	}
	startRepeat() {
		var selection = this.tracker.getExtremeSelection(-1);
		this.setBarline(selection,SmoBarline.positions.start,SmoBarline.barlines.startRepeat,'add start repeat');
	}
	singleBarStart() {
		var selection = this.tracker.getExtremeSelection(-1);
		this.setBarline(selection,SmoBarline.positions.start,SmoBarline.barlines.singleBar,'single start bar');
	}
    singleBarEnd() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setBarline(selection,SmoBarline.positions.end,SmoBarline.barlines.singleBar,'single  bar');
	}

	doubleBar() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setBarline(selection,SmoBarline.positions.end,SmoBarline.barlines.doubleBar,'double  bar');
	}
	endBar() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setBarline(selection,SmoBarline.positions.end,SmoBarline.barlines.endBar,'final  bar');
	}
	coda() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setSymbol(selection,SmoRepeatSymbol.positions.end,SmoRepeatSymbol.symbols.Coda);
	}
	toCoda() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setSymbol(selection,SmoRepeatSymbol.positions.end,SmoRepeatSymbol.symbols.ToCoda);
	}
	segno() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setSymbol(selection,SmoRepeatSymbol.positions.end,SmoRepeatSymbol.symbols.Segno);
	}
	dsAlCoda() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setSymbol(selection,SmoRepeatSymbol.positions.end,SmoRepeatSymbol.symbols.DsAlCoda);
	}
	dcAlCoda() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setSymbol(selection,SmoRepeatSymbol.positions.end,SmoRepeatSymbol.symbols.DcAlCoda);
	}
	dsAlFine() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setSymbol(selection,SmoRepeatSymbol.positions.end,SmoRepeatSymbol.symbols.DsAlFine);
	}
	dcAlFine() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setSymbol(selection,SmoRepeatSymbol.positions.end,SmoRepeatSymbol.symbols.DcAlFine);
	}
	fine() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setSymbol(selection,SmoRepeatSymbol.positions.end,SmoRepeatSymbol.symbols.Fine);
	}
	nthEnding() {
		var startSel = this.tracker.getExtremeSelection(-1);
		var endSel = this.tracker.getExtremeSelection(1);
		this.setEnding(startSel.selector.measure,endSel.selector.measure,1);
	}

	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function (ev) {
			var id = self.buttonData.id;
			if (typeof(self[id]) === 'function') {
				self[id]();
                self.tracker.replaceSelectedMeasures();
			}
		});
	}
}

class PlayerButtons {
    	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.tracker = parameters.tracker;
        this.editor = parameters.editor;
		this.controller = parameters.controller;
        this.menus=parameters.controller.menus;
	}

    playButton() {
        this.editor.playScore();
    }
    stopButton() {
        this.editor.stopPlayer();
    }
    pauseButton() {
        this.editor.pausePlayer();
    }

    bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			self[self.buttonData.id]();
		});
    }
}

class TextButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.tracker = parameters.tracker;
        this.editor = parameters.editor;
		this.controller = parameters.controller;
        this.menus=parameters.controller.menus;
	}
    lyrics() {
		SuiLyricDialog.createAndDisplay(
            {buttonElement:this.buttonElement, buttonData:this.buttonData,controller:this.controller});
		// tracker, selection, controller
    }
    rehearsalMark() {
        var selection = this.tracker.getExtremeSelection(-1);
        var cmd = selection.measure.getRehearsalMark() ? 'removeRehearsalMark' : 'addRehearsalMark';
        this.editor.scoreSelectionOperation(selection, cmd, new SmoRehearsalMark());
    }
    _invokeMenu(cmd) {
      this.controller.unbindKeyboardForMenu(this.menus);
      this.menus.createMenu(cmd);
    }
    addTextMenu() {
        this._invokeMenu('SuiTextMenu');
    }
	addDynamicsMenu() {
        this._invokeMenu('SuiDynamicsMenu');
	}
    bind() {
        var self=this;
        $(this.buttonElement).off('click').on('click', function () {
            self[self.buttonData.id]();
        });

	}
}
class NavigationButtons {
	static get directionsTrackerMap() {
		return {
			navLeftButton: 'moveSelectionLeft',
			navRightButton: 'moveSelectionRight',
			navUpButton: 'moveSelectionUp',
			navDownButton: 'moveSelectionDown',
			navFastForward: 'moveSelectionRightMeasure',
			navRewind: 'moveSelectionLeftMeasure',
			navGrowLeft: 'growSelectionLeft',
			navGrowRight: 'growSelectionRight'
		};
	}
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.tracker = parameters.tracker;
	}

	_moveTracker() {
		this.tracker[NavigationButtons.directionsTrackerMap[this.buttonData.id]]();
	}
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			self._moveTracker();
		});
	}
}
class ArticulationButtons {
	static get articulationIdMap() {
		return {
			accentButton: SmoArticulation.articulations.accent,
			tenutoButton: SmoArticulation.articulations.tenuto,
			staccatoButton: SmoArticulation.articulations.staccato,
			marcatoButton: SmoArticulation.articulations.marcato,
			pizzicatoButton: SmoArticulation.articulations.pizzicato,
			fermataButton: SmoArticulation.articulations.fermata,
            mordentButton: SmoOrnament.ornaments.mordent,
            mordentInvertedButton:SmoOrnament.ornaments.mordentInverted,
            trillButton:SmoOrnament.ornaments.trill
		};
	}
    static get constructors() {
        return {
			accentButton: 'SmoArticulation',
			tenutoButton: 'SmoArticulation',
			staccatoButton: 'SmoArticulation',
			marcatoButton: 'SmoArticulation',
			pizzicatoButton: 'SmoArticulation',
			fermataButton: 'SmoArticulation',
            mordentButton: 'SmoOrnament',
            mordentInvertedButton:'SmoOrnament',
            trillButton:'SmoOrnament'
        }
    }
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
		this.articulation = ArticulationButtons.articulationIdMap[this.buttonData.id];
        this.ctor = ArticulationButtons.constructors[this.buttonData.id];
	}
	_toggleArticulation() {
		this.showState = !this.showState;
		this.editor.toggleArticulationCommand(this.articulation, this.ctor);
	}
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			self._toggleArticulation();
		});
	}
}


class CollapseRibbonControl {
	static get paramArray() {
		return ['ribbonButtons', 'editor', 'controller', 'tracker', 'menus', 'buttonData', 'buttonElement'];
	}
	constructor(parameters) {
		smoSerialize.filteredMerge(CollapseRibbonControl.paramArray, parameters, this);
		this.childButtons = parameters.ribbonButtons.filter((cb) => {
				return cb.group === this.buttonData.group &&
                    RibbonButtons.isCollapsible(cb.action)
			});
	}
	_toggleExpand() {
		this.childButtons.forEach((cb) => {

			var el = $('#' + cb.id);
			$(el).toggleClass('collapsed');
			$(el).toggleClass('expanded');
		});

		this.buttonElement.closest('div').toggleClass('expanded');
		this.buttonElement.toggleClass('expandedChildren');
		if (this.buttonElement.hasClass('expandedChildren')) {
			var leftSpan = $(this.buttonElement).find('.ribbon-button-text');
			$(leftSpan).text('');
			$(leftSpan).removeClass(this.buttonData.icon);
			$(this.buttonElement).addClass('icon icon-circle-left');
		} else {
			$(this.buttonElement).removeClass('icon-circle-left');
			var leftSpan = $(this.buttonElement).find('.ribbon-button-text');
			$(leftSpan).addClass(this.buttonData.icon);
			$(leftSpan).text(this.buttonData.leftText);
		}

		// Expand may change music dom, redraw
		$('body').trigger('forceScrollEvent');
	}
	bind() {
		var self = this;
		$(this.buttonElement).closest('div').addClass('collapseContainer');
		$('#' + this.buttonData.id).off('click').on('click', function () {
			self._toggleExpand();
		});
		this.childButtons.forEach((cb) => {
			var ctor = eval(cb.ctor);
			var el = $('#' + cb.id);
			var btn = new ctor({
					buttonData: cb,
					buttonElement: el,
					editor: this.editor,
					tracker: this.tracker,
					controller: this.controller
				});
            if (typeof(btn.bind) == 'function') {
                btn.bind();
            }
		});
	}
}
;class SuiStaffModifierDialog extends SuiDialogBase {
	 handleRemove() {
        $(this.context.svg).find('g.' + this.modifier.attrs.id).remove();
        SmoUndoable.staffSelectionOp(this.layout.score,this.selection,'removeStaffModifier',this.modifier,this.undo,'remove slur');
        this.tracker.clearModifierSelections();
    }

    _preview() {
        this.modifier.backupOriginal();
        this.components.forEach((component) => {
            this.modifier[component.smoName] = component.getValue();
        });
        this.layout.renderStaffModifierPreview(this.modifier)
    }

    changed() {
        this.modifier.backupOriginal();
        this.components.forEach((component) => {
            this.modifier[component.smoName] = component.getValue();
        });
        this.layout.renderStaffModifierPreview(this.modifier);
    }
}


class SuiSlurAttributesDialog extends SuiStaffModifierDialog {
    static get dialogElements() {
        return [{
                parameterName: 'spacing',
                smoName: 'spacing',
                defaultValue: 2,
                control: 'SuiRockerComponent',
                label: 'Spacing'
            }, {
                smoName: 'thickness',
                parameterName: 'thickness',
                defaultValue: 2,
                control: 'SuiRockerComponent',
                label: 'Thickness'
            }, {
                smoName: 'xOffset',
                parameterName: 'xOffset',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'X Offset'
            }, {
                smoName: 'yOffset',
                parameterName: 'yOffset',
                defaultValue: 10,
                control: 'SuiRockerComponent',
                label: 'Y Offset'
            }, {
                smoName: 'position',
                parameterName: 'position',
                defaultValue: SmoSlur.positions.HEAD,
                options: [{
                        value: SmoSlur.positions.HEAD,
                        label: 'Head'
                    }, {
                        value: SmoSlur.positions.TOP,
                        label: 'Top'
                    }
                ],
                control: 'SuiDropdownComponent',
                label: 'Start Position'
            }, {
                smoName: 'position_end',
                parameterName: 'position_end',
                defaultValue: SmoSlur.positions.HEAD,
                options: [{
                        value: SmoSlur.positions.HEAD,
                        label: 'Head'
                    }, {
                        value: SmoSlur.positions.TOP,
                        label: 'Top'
                    }
                ],
                control: 'SuiDropdownComponent',
                label: 'End Position'
            }, {
                smoName: 'invert',
                parameterName: 'invert',
                defaultValue: false,
                control: 'SuiToggleComponent',
                label: 'Invert'
            }, {
                parameterName: 'cp1x',
                smoName: 'cp1x',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Control Point 1 X'
            }, {
                parameterName: 'cp1y',
                smoName: 'cp1y',
                defaultValue: 40,
                control: 'SuiRockerComponent',
                label: 'Control Point 1 Y'
            }, {
                parameterName: 'cp2x',
                smoName: 'cp2x',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Control Point 2 X'
            }, {
                parameterName: 'cp2y',
                smoName: 'cp2y',
                defaultValue: 40,
                control: 'SuiRockerComponent',
                label: 'Control Point 2 Y'
            }
        ];
    }
    static createAndDisplay(parameters) {
        var dg = new SuiSlurAttributesDialog(parameters);
        dg.display();
        return dg;
    }
    constructor(parameters) {
        if (!parameters.modifier || !parameters.selection) {
            throw new Error('modifier attribute dialog must have modifier and selection');
        }

        super(SuiSlurAttributesDialog.dialogElements, {
            id: 'dialog-' + parameters.modifier.attrs.id,
            top: parameters.modifier.renderedBox.y,
            left: parameters.modifier.renderedBox.x,
            label: 'Slur Properties',
			tracker:parameters.tracker
        });
        Vex.Merge(this, parameters);
    }
    populateInitial() {
        this.components.forEach((comp) => {
            if (typeof(this.modifier[comp.smoName]) != 'undefined') {
                comp.setValue(this.modifier[comp.smoName]);
            }
        });
    }
    display() {
        super.display();
        this.populateInitial();
    }
}

class SuiVoltaAttributeDialog extends SuiStaffModifierDialog {
	 static get dialogElements() {
        return [{
                parameterName: 'number',
                smoName: 'number',
                defaultValue: 1,
                control: 'SuiRockerComponent',
                label: 'number'
            }, {
                smoName: 'xOffsetStart',
                parameterName: 'xOffsetStart',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'X1 Offset'
            }, {
                smoName: 'xOffsetEnd',
                parameterName: 'xOffsetEnd',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'X2 Offset'
            }, {
                smoName: 'yOffset',
                parameterName: 'yOffset',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Y Offset'
            }
        ];
	 }
	 static createAndDisplay(parameters) {
        var dg = new SuiVoltaAttributeDialog(parameters);
        dg.display();
        return dg;
    }
	handleRemove() {
        this.undo.addBuffer('Remove nth ending', 'score', null, this.layout.score);
		this.layout.score.staves.forEach((staff) => {
			staff.measures.forEach((measure) => {
				if (measure.measureNumber.measureNumber === this.modifier.startBar) {
					measure.removeNthEnding(this.modifier.number);
				}
			});
		});
        $(this.context.svg).find('g.' + this.modifier.endingId).remove();
        this.selection.staff.removeStaffModifier(this.modifier);
   }
	_commit() {
        this.modifier.restoreOriginal();
		this.layout.score.staves.forEach((staff) => {
			staff.measures.forEach((measure) => {
				if (measure.measureNumber.measureNumber === this.modifier.startBar) {
					 var endings = measure.getNthEndings().filter((mm) => {
						 return mm.endingId === this.modifier.endingId;
					 });
					 if (endings.length) {
						 endings.forEach((ending) => {
							 this.components.forEach((component) => {
								ending[component.smoName] = component.getValue();
							 });
						 });
					 }
				}
			});
		});

        this.layout.renderStaffModifierPreview(this.modifier);
    }
    constructor(parameters) {
        if (!parameters.modifier || !parameters.selection) {
            throw new Error('modifier attribute dialog must have modifier and staff');
        }

        super(SuiVoltaAttributeDialog.dialogElements, {
            id: 'dialog-' + parameters.modifier.attrs.id,
            top: parameters.modifier.renderedBox.y,
            left: parameters.modifier.renderedBox.x,
            label: 'Hairpin Properties',
			tracker:parameters.tracker
        });
        Vex.Merge(this, parameters);
		SmoVolta.editableAttributes.forEach((attr) => {
			var comp = this.components.find((cc)=>{return cc.smoName===attr});
			if (comp) {
				comp.defaultValue=this.modifier[attr];
			}
		});
    }
}
class SuiHairpinAttributesDialog extends SuiStaffModifierDialog {
    static get label() {
        return 'Hairpin Properties';
    }
    static get dialogElements() {
        return [{
                parameterName: 'height',
                smoName: 'height',
                defaultValue: 10,
                control: 'SuiRockerComponent',
                label: 'Height'
            }, {
                smoName: 'yOffset',
                parameterName: 'y_shift',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Y Shift'
            }, {
                smoName: 'xOffsetRight',
                parameterName: 'right_shift_px',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Right Shift'
            }, {
                smoName: 'xOffsetLeft',
                parameterName: 'left_shift_px',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Left Shift'
            }
        ];
    }
    static createAndDisplay(parameters) {
        var dg = new SuiHairpinAttributesDialog(parameters);
        dg.display();
        return dg;
    }
    constructor(parameters) {
        if (!parameters.modifier || !parameters.selection) {
            throw new Error('modifier attribute dialog must have modifier and staff');
        }

        super(SuiHairpinAttributesDialog.dialogElements, {
            id: 'dialog-' + parameters.modifier.attrs.id,
            top: parameters.modifier.renderedBox.y,
            left: parameters.modifier.renderedBox.x,
            label: 'Hairpin Properties',
			tracker:parameters.tracker
        });
        Vex.Merge(this, parameters);
		SmoStaffHairpin.editableAttributes.forEach((attr) => {
			var comp = this.components.find((cc)=>{return cc.smoName===attr});
			if (comp) {
				comp.defaultValue=this.modifier[attr];
			}
		});
    }
}
;

class SmoHelp {

    static displayHelp() {
        $('body').addClass('showHelpDialog');
        $('.helpDialog').html('');
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('help-left');
        r.append(SmoHelp.navigationHtml);
        r.append(SmoHelp.noteHelpHtml);
        r.append(SmoHelp.durationHelpHtml);
        $('.helpDialog').append(r.dom());

        r = b('div').classes('help-right');
        r.append(SmoHelp.generalEditHtml);
        r.append(SmoHelp.menuHelpHtml);
        r.append(SmoHelp.dialogHelpHtml);
        $('.helpDialog').append(r.dom());

        $('.helpDialog').append(SmoHelp.closeButton.dom());
		$('button.help-title').off('click').on('click',function(ev) {
			$(this).closest('div.helpLine').toggleClass('showSection');
			$(this).find('span.icon').toggleClass('icon-plus');
			$(this).find('span.icon').toggleClass('icon-minus');
		});
        $('.helpDialog button.icon-cross').off('click').on('click', function () {
            $('body').removeClass('showHelpDialog');
        });
    }

    static helpControls() {
        $('body .controls-left').html('');
        $('body .controls-left').append(RibbonHtml.ribbonButton('help-button','Help','?'));
        $('.helpDialog button.icon-cross').focus();
    }

    static modeControls() {
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('control-menu-message').append(
                b('div').attr('id', 'globMode').text('Next Key Chooses Menu')).append(
                b('div').classes('mode-subtitle').append(SmoHelp.shortMenuHelpHtml));
        $('body .controls-left .controls-menu-message').html('');
        $('body .controls-left').append(r.dom());
    }

    static get closeButton() {
        var b = htmlHelpers.buildDom;
        var r = b('button').classes('icon-cross close');
        return r;
    }

    static _helpButton(buttons) {
        var b = htmlHelpers.buildDom;
        var r = b('span').classes('keyContainer');
        buttons.forEach((button) => {
            button.text = (button.text ? button.text : ' ');
            button.separator = button.separator ? button.separator : ' ';
            button.icon = button.icon ? button.icon : ' ';
            r.append(b('span').classes(button.icon + ' helpKey').text(button.text))
            .append(b('span').classes('separator').text(button.separator));
        });
        return r;
    }

    static _buttonBlock(buttons, text, id) {
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('keyBlock').attr('id', id);
        r.append(SmoHelp._helpButton(buttons)).append(
            b('label').attr('for', id).text(text));
        return r;
    }

    static _buildElements(helps, text) {
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('helpLine').append(
				b('button').append(
				b('span').classes('icon icon-plus'))
				.classes('help-title').text(text));

        helps.forEach((help) => {
            r.append(SmoHelp._buttonBlock(help.keys, help.text, help.id));
        });
        return r;
    }

    static get navigationElements() {
        return [{
                keys:
                [{
                        icon: 'icon-arrow-right'
                    }, {
                        icon: 'icon-arrow-left'
                    }
                ],
                text: 'Move note selection left or right',
                id: 'navel1'
            }, {
                keys: [{
                        icon: '',
                        text: 'Ctrl',
                        separator: '+'

                    }, {
                        icon: 'icon-arrow-right',
                        separator: ','
                    }, {
                        icon: '',
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        icon: 'icon-arrow-left'
                    }
                ],
                text: 'Jump selection to next/last measure',
                id: 'navel2'
            }, {
                keys: [ {
                        icon: 'icon-arrow-down',
                    }, {
                        icon: 'icon-arrow-up'
                    }
                ],
                text: 'Jump selection to staff above/below',
                id: 'navel3'
            }, {
                keys: [{
                        icon: '',
                        text: 'Shift',
                        separator: '+'
                    }, {
                        icon: 'icon-arrow-right',
                        separator: ','
                    }, {
                        icon: '',
                        text: 'Shift',
                        separator: '+'
                    }, {
                        icon: 'icon-arrow-left'
                    }
                ],
                text: 'Grow selection left or right',
                id: 'navel4'
            }, {
                keys: [{
                        icon: '',
                        text: 'Alt',
                        separator: '+'
                    }, {
                        icon: 'icon-arrow-right',
                        separator: ''
                    }
                ],
                text: 'Select note or staff modifier (slur, dynamic)',
                id: 'navel5'
            }, {
                keys: [{
                        icon: '',
                        text: 'Shift',
                        separator: '+'
                    }, {
                        icon: 'icon-arrow-up',
                        separator: ','
                    }, {
                        icon: '',
                        text: 'Shift',
                        separator: '+'
                    }, {
                        icon: 'icon-arrow-down'
                    }
                ],
                text: 'Iterate through the notes of a chord',
                id: 'navel6'
            }
        ];
    }
    static get noteElements() {
        return [{
                keys:
                [{
                        text: 'a'
                    }, {
                        text: '...',
                        icon: 'help-ellipsis'
                    }, {
                        text: 'g'
                    }
                ],
                text: 'Enter letter note A-G at selection',
                id: 'noteElements1'
            }, {
                keys:
                [{
                        text: 'h'
                    }, {
                        text: '...',
                        icon: 'help-ellipsis'
                    }, {
                        text: 'l',
                        separator: ','
                    }
                ],
                text: 'Various articulations',
                id: 'noteElements1'
            }, {
                keys:
                [{
                        text: 'Shift',
                        separator: '+'
                    }, {
                        text: 'h'
                    }, {
                        text: '...',
                        icon: 'help-ellipsis'
                    }, {
                        text: 'l',
                        separator: ','
                    }
                ],
                text: 'Various articulations',
                id: 'noteElements1'
            }, {
                keys:
                [{
                        text: '-',
                        separator: ','
                    }, {
                        text: '='
                    }
                ],
                text: 'Transpose selected notes down/up 1/2 step',
                id: 'noteElements2'
            }, {
                keys: [{
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        text: '-',
                        separator: ','
                    }, {
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        text: '=',
                        separator: ''
                    }
                ],
                text: 'Transpose note up/down octave',
                id: 'noteElements3'
            }, {
                keys: [{
                        text: '2',
                        separator: ''
                    }, {
                        text: '...',
                        icon: 'help-ellipsis'

                    }, {
                        text: '7',
                        separator: ''
                    }
                ],
                text: 'Enter interval 2nd through 7th',
                id: 'noteElements4'
            }, {
                keys: [{
                        text: 'Shift',
                        separator: '+'
                    }, {
                        text: '2',
                        separator: ''
                    }, {
                        text: '...',
                        icon: 'help-ellipsis'

                    }, {
                        text: 'Shift',
                        separator: '+'
                    }, {
                        text: '7'
                    }
                ],
                text: 'Enter interval down 2nd through 7th',
                id: 'noteElements5'
            }, {
                keys: [{
                        text: 'r'
                    }
                ],
                text: 'Toggle note/rest',
                id: 'noteElements6'
            }, {
                keys: [{
                        text: 'x'
                    }
                ],
                text: 'Toggle break beam group',
                id: 'noteElements7'
            },{
                keys: [{
                        text: 'Alt',
						separator:'+'
                    },{
						text:'-'
					}
                ],
                text: 'Toggle courtesy accidental',
                id: 'noteElements8'
            }
        ];
    }
    static get durationElements() {
        return [{
                keys:
                [{
                        text: ',',
                        separator: ','
                    }, {
                        text: '.',
                    }
                ],
                text: 'Double/halve note duration',
                id: 'noteDuration1'
            }, {
                keys:
                [{
                        text: '<',
                        separator: ','
                    }, {
                        text: '>'
                    }
                ],
                text: 'Remove/Add dot to note',
                id: 'noteDuration2'
            }, {
                keys: [{
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        text: '3',
                    }
                ],
                text: 'Create triplet',
                id: 'noteDuration3'
            }, {
                keys: [{
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        text: '0',
                    }
                ],
                text: 'Remove triplet',
                id: 'noteDuration4'
            }
        ];
    }
    static get generalEditElements() {
        return [{
                keys:
                [{
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        text: 'c',
                    }
                ],
                text: 'Copy selection',
                id: 'editElements1'
            }, {
                keys:
                [{
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        text: 'v'
                    }
                ],
                text: 'Paste copied selection to selection target',
                id: 'editElements2'
            }, {
                keys: [{
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        text: 'z',
                    }
                ],
                text: 'Undo previous operation',
                id: 'editElements3'
            }, {
                keys: [{
                        text: 'Insert'
                    }
                ],
                text: 'Add measure',
                id: 'editElements4'
            }, {
                keys: [{
                        text: 'Delete'
                    }
                ],
                text: 'Delete measure',
                id: 'editElements4'
            }
        ];
    }
    static get menuModeElements() {
        return [{
                keys:
                [{
                        text: '/',
                        separator: ''
                    }
                ],
                text: 'Next key chooses menu',
                id: 'menuModeElements1'
            }, {
                keys:
                [{
                        text: 'k',
                        separator: ''
                    }
                ],
                text: 'Key signature menu',
                id: 'menuModeElements2'
            }, {
                keys:
                [{
                        text: 'e',
                        separator: ''
                    }
                ],
                text: 'Expression menu (slur, hairpin dynamics)',
                id: 'menuModeElements3'
            }, {
                keys:
                [{
                        text: 'd',
                        separator: ''
                    }
                ],
                text: 'Text dynamics menu',
                id: 'menuModeElements4'
            }, {
                keys:
                [{
                        text: 's',
                        separator: ''
                    }
                ],
                text: 'Add/Remove Staff menu',
                id: 'menuModeElements5'
            }, {
                keys:
                [{
                        text: 'Esc',
                        separator: ''
                    }
                ],
                text: 'Cancel slash menu mode',
                id: 'menuModeElements6'
            }
        ];
    }
    static get menuModeShort() {
        return [{
                keys:
                [{
                        text: 'k',
                        separator: ''
                    }
                ],
                text: 'Key signatures',
                id: 'menuModeElements2'
            }, {
                keys:
                [{
                        text: 'e',
                        separator: ''
                    }
                ],
                text: 'Expressions',
                id: 'menuModeElements3'
            }, {
                keys:
                [{
                        text: 'd',
                        separator: ''
                    }
                ],
                text: 'Dynamics',
                id: 'menuModeElements4'
            }, {
                keys:
                [{
                        text: 's',
                        separator: ''
                    }
                ],
                text: 'Add/Remove Staff',
                id: 'menuModeElements5'
            },{
                keys:
                [{
                        text: 'Esc',
                        separator: ''
                    }
                ],
                text: 'Continue Editing',
                id: 'menuModeElements6'
            }
        ];
    }
    static get dialogElements() {
        return [{
                keys:
                [{
                        text: 'p',
                        separator: ''
                    }
                ],
                text: 'Property dialog for selected modifier (see Score Navigation)',
                id: 'menuModeElements1'
            }
        ];
    }

    static get navigationHtml() {
        return SmoHelp._buildElements(SmoHelp.navigationElements, 'Score Navigation');
    }
    static get noteHelpHtml() {
        return SmoHelp._buildElements(SmoHelp.noteElements, 'Note Entry');
    }
    static get durationHelpHtml() {
        return SmoHelp._buildElements(SmoHelp.durationElements, 'Note Duration');
    }
    static get menuHelpHtml() {
        return SmoHelp._buildElements(SmoHelp.menuModeElements, 'Menus');
    }
    static get generalEditHtml() {
        return SmoHelp._buildElements(SmoHelp.generalEditElements, 'Editing');
    }
    static get shortMenuHelpHtml() {
        return SmoHelp._buildElements(SmoHelp.menuModeShort, 'Menus');
    }
    static get dialogHelpHtml() {
        return SmoHelp._buildElements(SmoHelp.dialogElements, 'Property Dialogs');
    }
}
;

// ## suiController
// ## Description:
// Manages DOM events and binds keyboard and mouse events
// to editor and menu commands, tracker and layout manager.
// ### Event model:
// Events can come from the following sources:
// 1. menus or dialogs can send dialogDismiss or menuDismiss event, indicating a modal has been dismissed.
// 2. window resize events
// 3. keyboard, when in editor mode.  When modals or dialogs are active, wait for dismiss event
// 4. svg piano key events smo-piano-key
// 5. tracker change events tracker-selection
class suiController {

	constructor(params) {
		Vex.Merge(this, suiController.defaults);
		Vex.Merge(this, params);
		window.suiControllerInstance = this;
		this.undoBuffer = new UndoBuffer();
		this.pasteBuffer = this.tracker.pasteBuffer;
		this.editor.controller = this;
		this.editor.undoBuffer = this.undoBuffer;
		this.editor.pasteBuffer = this.pasteBuffer;
		this.resizing = false;
		this.undoStatus=0;
		this.trackScrolling = false;
        this.keyboardActive = false;

		this.ribbon = new RibbonButtons({
				ribbons: defaultRibbonLayout.ribbons,
				ribbonButtons: defaultRibbonLayout.ribbonButtons,
				menus: this.menus,
				editor: this.editor,
				tracker: this.tracker,
				score: this.score,
				controller: this
			});

        this.menus.setController(this);

		// create globbal exception instance
		this.exhandler = new SuiExceptionHandler(this);

		this.bindEvents();

        // Only display the ribbon one time b/c it's expensive operation
        this.ribbon.display();
		this.bindResize();
        this.layoutDemon.undoBuffer = this.undoBuffer;
        this.layoutDemon.startDemon();

		this.createPiano();
		this.updateOffsets();
	}

	static get scrollable() {
		return '.musicRelief';
	}

	get isLayoutQuiet() {
		return ((this.layout.passState == suiLayoutBase.passStates.clean && this.layout.dirty == false)
		   || this.layout.passState == suiLayoutBase.passStates.replace);
	}

	handleScrollEvent(ev) {
		var self=this;
		if (self.trackScrolling) {
				return;
		}
		self.trackScrolling = true;
		setTimeout(function() {
            try {
		    // wait until redraw is done to track scroll events.
			self.trackScrolling = false;

			// self.scrollRedrawStatus = true;
            // self.tracker.updateMap(true);
            // Thisi s a WIP...
			self.scroller.handleScroll($(suiController.scrollable)[0].scrollLeft,$(suiController.scrollable)[0].scrollTop);
            } catch(e) {
                SuiExceptionHandler.instance.exceptionHandler(e);
            }
		},500);
	}

	splash() {
		var b = htmlHelpers.buildDom;
		var r = b('div').classes('bug-modal').append(
				b('img').attr('src', '../styles/images/logo.png').classes('splash-logo'))
			.append(b('button').classes('icon icon-cross bug-dismiss-button'))
			.append(b('span').classes('splash-title').text('Sm'))
			.append(b('span').classes('splash-shine').text('ooooooooo'))
			.append(b('span').classes('splash-title').text('sic'));
		$('.bugDialog').append(r.dom());
		$('body').addClass('splashScreen modal');
		setTimeout(function () {
			$('body').removeClass('splashScreen modal');
		}, 1000);
	}
	createPiano() {
		this.piano = new suiPiano({elementId:'piano-svg',tracker:this.tracker,undo:this.undoBuffer});
        $('.close-piano').click();
	}
	updateOffsets() {
		// the 100 is for the control offsets
		var padding =  Math.round((this.layout.screenWidth-this.layout.pageWidth)/2)-100;
		$('.workspace-container').css('padding-left',''+padding+'px');

		// Keep track of the scroll bar so we can adjust the map
		// this.scrollPosition = $('body')[0].scrollTop;
	}
	resizeEvent() {
		var self = this;
		if (this.resizing)
			return;
		this.resizing = true;
		setTimeout(function () {
			console.log('resizing');
			self.resizing = false;
			$('.musicRelief').height(window.innerHeight - $('.musicRelief').offset().top);
			self.piano.handleResize();
			self.updateOffsets();

		}, 500);
	}

	// No action at present when cursor selection changes
	trackerChangeEvent() {

	}

	// If the user has selected a modifier via the mouse/touch, bring up mod dialog
	// for that modifier
	trackerModifierSelect(ev) {
		var modSelection = this.tracker.getSelectedModifier();
        this.idleLayoutTimer = Date.now();
		if (modSelection) {
			var dialog = this.showModifierDialog(modSelection);
            if (dialog) {
                this.tracker.selectSuggestion(ev);
			    this.unbindKeyboardForDialog(dialog);
            } else {
                this.tracker.advanceModifierSelection(ev);
            }
		} else {
            this.tracker.selectSuggestion(ev);
        }
		return;
	}


    // ### bindResize
	// This handles both resizing of the music area (scrolling) and resizing of the window.
	// The latter results in a redraw, the former just resets the client/logical map of elements
	// in the tracker.
	bindResize() {
		var self = this;
		var el = $(suiController.scrollable)[0];
		// unit test programs don't have resize html
		if (!el) {
			return;
		}
		$(suiController.scrollable).height(window.innerHeight - $('.musicRelief').offset().top);

		window.addEventListener('resize', function () {
			self.resizeEvent();
		});

		let scrollCallback = (ev) => {
            self.handleScrollEvent(ev);
		};
		el.onscroll = scrollCallback;
	}

	static createDom() {
		 var b = htmlHelpers.buildDom;
		 var r=b('div').classes('dom-container')
			 .append(b('div').classes('modes'))
			 .append(b('div').classes('overlay'))
			 .append(b('div').classes('draganime hide'))
			 .append(b('div').classes('textEdit hide'))
			 .append(b('div').classes('attributeDialog'))
			 .append(b('div').classes('helpDialog'))
             .append(b('div').classes('saveLink'))
			 .append(b('div').classes('bugDialog'))
			 .append(b('div').classes('printFrame'))
			 .append(b('div').classes('menuContainer'))
			 .append(b('h1').classes('testTitle').text('Smoosic'))
			 .append(b('div').classes('piano-container')
			     .append(b('div').classes('piano-keys')))
		     .append(b('div').classes('workspace-container')
			    .append(b('div').classes('workspace')
				    .append(b('div').classes('controls-top'))
					.append(b('div').classes('controls-left'))
                    .append(b('div').classes('controls-menu-message'))
					.append(b('div').classes('musicRelief')
					   .append(b('div').classes('musicContainer').attr('id','boo')))
                     .append(b('div').classes('musicReliefShadow')
					   .append(b('div').classes('musicContainerShadow').attr('id','booShadow')))));
	    $('#smoo').append(r.dom());
		var pianoDom=$('.piano-keys')[0];
		var svg=document.createElementNS(svgHelpers.namespace,'svg');
		svg.id='piano-svg';
		svg.setAttributeNS('','width',''+suiPiano.owidth*suiPiano.dimensions.octaves);
		svg.setAttributeNS('','height',''+suiPiano.dimensions.wheight);
		svg.setAttributeNS('','viewBox','0 0 '+suiPiano.owidth*suiPiano.dimensions.octaves+' '+suiPiano.dimensions.wheight);
		pianoDom.appendChild(svg);
	}
    static _nvQueryPair(str) {
        var ar = str.split('=');
        var rv = {};
        for (var i =  0;i < ar.length - 1;i += 2) {
            var name = decodeURIComponent(ar[i]);
            rv[name] = decodeURIComponent(ar[i+1]);
        }
        return rv;
    }

    static scoreFromQueryString() {
        var score = SmoScore.deserialize(basicJson);
        if (window.location.search) {
            var cmd = window.location.search.substring(1,window.location.search.length);
            var pairs = suiController._nvQueryPair(cmd);
            if (pairs['score']) {
                try {
                    score = SmoScore.deserialize(eval(pairs['score']));
                } catch (exp) {
                    console.log('could not parse '+exp);
                }
            }
        } else {
            var scoreStr = localStorage.getItem(smoSerialize.localScore);
            if (scoreStr && scoreStr.length) {
                try {
                    score = SmoScore.deserialize(scoreStr);
                } catch (exp) {
                    console.log('could not parse '+scoreStr);
                }
            }
        }
        return score;
    }

	// ## createUi
	// ### Description:
	// Convenience constructor, taking a renderElement and a score.
	static createUi(score,title) {
		suiController.createDom();
		if (title) {
			$('h1.testTitle').text(title);
		}
		var params = suiController.keyBindingDefaults;
        var score = suiController.scoreFromQueryString();
		params.layout = suiScoreLayout.createScoreLayout(document.getElementById("boo"), document.getElementById("booShadow"),score);
        params.scroller = new suiScroller();
		params.tracker = new suiTracker(params.layout,params.scroller);
        params.layout.setMeasureMapper(params.tracker);
		params.editor = new suiEditor(params);
		params.menus = new suiMenuManager(params);
        params.layoutDemon = new SuiLayoutDemon(params);
		var controller = new suiController(params);
        params.layout.score = score;
		return controller;
	}

	static createDebugUi(score) {
		suiController.createDom();
		var params = suiController.keyBindingDefaults;
		params.layout = suiScoreLayout.createScoreLayout(document.getElementById("boo"), document.getElementById("booShadow"), score);
		layoutDebug.setAll();
        params.scroller = new suiScroller();
		params.tracker = new suiTracker(params.layout,params.scroller);
		params.editor = new suiEditor(params);
		params.menus = new suiMenuManager(params);
        params.layoutDemon = new SuiLayoutDemon(params);
		var controller = new suiController(params);
        var score = SmoScore.deserialize(basicJson);
        params.layout.score = score;
		return controller;
	}

	static start(debug) {
		var score = SmoScore.getEmptyScore();
		score.addDefaultMeasureWithNotes(0, {});
		if (!debug) {
			score.addDefaultMeasureWithNotes(1, {});
			score.addDefaultMeasureWithNotes(2, {});
			score.addDefaultMeasureWithNotes(3, {});
			score.addDefaultMeasureWithNotes(4, {});
			score.addStaff();
		}

		var controller = debug ? suiController.createDebugUi(score) : suiController.createUi(score);
	}

	// ### renderElement
	// return render element that is the DOM parent of the svg
	get renderElement() {
		return this.layout.renderElement;
	}

	// ## keyBindingDefaults
	// ### Description:
	// Different applications can create their own key bindings, these are the defaults.
	// Many editor commands can be reached by a single keystroke.  For more advanced things there
	// are menus.
	static get keyBindingDefaults() {
		var editorKeys = suiController.editorKeyBindingDefaults;
		editorKeys.forEach((key) => {
			key.module = 'editor'
		});
		var trackerKeys = suiController.trackerKeyBindingDefaults;
		trackerKeys.forEach((key) => {
			key.module = 'tracker'
		});
		return trackerKeys.concat(editorKeys);
	}

	// ## editorKeyBindingDefaults
	// ## Description:
	// execute a simple command on the editor, based on a keystroke.
	static get editorKeyBindingDefaults() {
		return defaultEditorKeys.keys;
	}

	// ## trackerKeyBindingDefaults
	// ### Description:
	// Key bindings for the tracker.  The tracker is the 'cursor' in the music
	// that lets you select and edit notes.
	static get trackerKeyBindingDefaults() {
		return defaultTrackerKeys.keys;
	}

	helpControls() {
		var self = this;
		var rebind = function () {
			self.bindEvents();
		}
		/* SmoHelp.helpControls();
		$('.controls-left button.help-button').off('click').on('click', function () {
		window.removeEventListener("keydown", self.keydownHandler, true);
		SmoHelp.displayHelp();
		htmlHelpers.closeDialogPromise().then(rebind);
		});   */
	}
	static set reentry(value) {
		suiController._reentry = value;
	}
	static get reentry() {
		if (typeof(suiController['_reentry']) == 'undefined') {
			suiController._reentry = false;
		}
		return suiController._reentry;
	}

	menuHelp() {
		SmoHelp.modeControls();
	}

	static get defaults() {
		return {
			keyBind: suiController.keyBindingDefaults
		};
	}

	showModifierDialog(modSelection) {
		return SuiDialogFactory.createDialog(modSelection, this.tracker.context, this.tracker, this.layout,this.undoBuffer,this)
	}

	unbindKeyboardForDialog(dialog) {
		var self=this;
		var rebind = function () {
			self.bindEvents();
		}
		window.removeEventListener("keydown", this.keydownHandler, true);
        this.keyboardActive = false;
		dialog.closeDialogPromise.then(rebind);
	}

    unbindKeyboardForMenu(menuMgr) {

        window.removeEventListener("keydown", this.keydownHandler, true);
        var self=this;
        var rebind = function () {
            self.bindEvents();
        }
        this.keyboardActive = false;
        menuMgr.slashMenuMode().then(rebind);
    }


	handleKeydown(evdata) {
		var self = this;

		console.log("KeyboardEvent: key='" + evdata.key + "' | code='" +
			evdata.code + "'"
			 + " shift='" + evdata.shiftKey + "' control='" + evdata.ctrlKey + "'" + " alt='" + evdata.altKey + "'");
		evdata.preventDefault();

		if (evdata.key == '?') {
			SmoHelp.displayHelp();
		}

		if (evdata.key == '/') {
			this.menuHelp();
            this.unbindKeyboardForMenu(this.menus);
		}

		// TODO:  work dialogs into the scheme of things
		if (evdata.key == 'Enter') {
			self.trackerModifierSelect(evdata);
		}

		var binding = this.keyBind.find((ev) =>
				ev.event === 'keydown' && ev.key === evdata.key && ev.ctrlKey === evdata.ctrlKey &&
				ev.altKey === evdata.altKey && evdata.shiftKey === ev.shiftKey);

		if (binding) {
			try {
			this[binding.module][binding.action](evdata);
			} catch (e) {
				this.exhandler.exceptionHandler(e);
			}
		}
	}

	detach() {
		window.removeEventListener("keydown", this.keydownHandler, true);
		/* this.layout = null;
		this.tracker = null;
		this.editor = null;  */
	}


	bindEvents() {
		var self = this;
		var tracker = this.tracker;
        if (this.keyboardActive) {
            return; // already bound.
        }
        this.keyboardActive = true;

		$('body').off('redrawScore').on('redrawScore',function() {
			self.handleRedrawTimer();
		});
		$('body').off('forceScrollEvent').on('forceScrollEvent',function() {
			self.handleScrollEvent();
		});
		$('body').off('forceResizeEvent').on('forceResizeEvent',function() {
			self.resizeEvent();
		});

		$(this.renderElement).off('mousemove').on('mousemove', function (ev) {
			tracker.intersectingArtifact({
				x: ev.clientX,
				y: ev.clientY
			});
		});

		$(this.renderElement).off('click').on('click', function (ev) {
			tracker.selectSuggestion(ev);
		});

		$('body').off('tracker-selection').on('tracker-selection',function(ev) {
			self.trackerChangeEvent(ev);
		});

		$('body').off('tracker-select-modifier').on('tracker-select-modifier',function(ev) {
			self.trackerModifierSelect(ev);
		});

		this.keydownHandler = this.handleKeydown.bind(this);

		this.helpControls();

		window.addEventListener("keydown", this.keydownHandler, true);

		window.addEventListener('error', function (e) {
			SuiExceptionHandler.instance.exceptionHandler(e);
		});
	}

}
