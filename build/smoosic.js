
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
		return {
			letter: noteKey[0],
			accidental: noteKey.substring(1, noteKey.length),
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
	// 'f#' => {letter:'f',accidental:'#'}
	static vexToSmoPitch(vexPitch) {
		var accidental = vexPitch.length < 2 ? 'n' : vexPitch.substring(1, vexPitch.length);
		return {
			letter: vexPitch[0].toLowerCase(),
			accidental: accidental
		};
	}

	static stripVexOctave(vexKey) {
		if (vexKey.indexOf('/') > 0) {
			vexKey = vexKey.substring(0, vexKey.indexOf('/'))
		}
		return vexKey;
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

	// ### filteredMerge
	// Like vexMerge, but only for specific attributes.
	static filteredMerge(attrs, src, dest) {
		attrs.forEach(function (attr) {
			if (typeof(src[attr]) != 'undefined') {
				dest[attr] = src[attr];
			}
		});
	}
	// ### serializedMerge
	// serialization-friendly, so merged, copied objects are deep-copied
	static serializedMerge(attrs, src, dest) {
		attrs.forEach(function (attr) {
			if (typeof(src[attr]) != 'undefined') {
				// copy the number 0
				if (typeof(src[attr]) === 'number' ||
					typeof(src[attr]) === 'boolean') {
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

	static debugBox(svg, box, classes, voffset) {
		voffset = voffset ? voffset : 0;
		classes = classes ? classes : '';
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

	// ### findIntersectionArtifact
	// find all object that intersect with the rectangle
	static findIntersectingArtifact(clientBox, objects) {
		var obj = null;
		var box = clientBox; //svgHelpers.untransformSvgPoint(this.context.svg,clientBox);

		// box.y = box.y - this.renderElement.offsetTop;
		// box.x = box.x - this.renderElement.offsetLeft;
		var rv = [];
		objects.forEach((object) => {
			var i1 = box.x - object.box.x;
			/* console.log('client coords: ' + svgHelpers.stringify(clientBox));
			console.log('find box '+svgHelpers.stringify(box));
			console.log('examine obj: '+svgHelpers.stringify(object.box));  */
			var i2 = box.y - object.box.y;
			if (i1 > 0 && i1 < object.box.width && i2 > 0 && i2 < object.box.height) {
				rv.push(object);
			}
		});

		return rv;
	}
	static findSmallestIntersection(clientBox, objects) {
		var ar = svgHelpers.findIntersectingArtifact(clientBox, objects);
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
		return ({
			x: box.x,
			y: box.y,
			width: box.width,
			height: box.height
		});
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
		pt.x = point.x;
		pt.y = point.y;
		var sp = pt.matrixTransform(svg.getScreenCTM().inverse());
		if (!point['width']) {
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
	static get animeClass() {
		return '.draganime';
	}
	constructor(parameters) {

		this.parent = parameters.parent;
		this.handle = parameters.handle;
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
	_animate(e) {
		this.lastX = e.clientX;
		this.lastY = e.clientY;
		console.log(e.clientY);
		$(draggable.animeClass).css('left', this.lastX);
		$(draggable.animeClass).css('top', this.lastY);
	}
	mousedown(e) {
		if (!this.dragging) {
			$(draggable.animeClass).removeClass('hide');

			$(draggable.animeClass).css('width', this.width);
			$(draggable.animeClass).css('height', this.height);
		}

		this.dragging = true;
		this._animate(e);
	}
	enddrag(e) {

		if (this.moveParent) {
			$(this.parent).css('left', this.lastX + 'px');
			$(this.parent).css('top', this.lastY + 'px');
		}
		$(draggable.animeClass).addClass('hide');
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
        smoMusic.serializedMerge(SmoNote.parameterArray, params, this);

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
    static get parameterArray() {
        return ['ticks', 'pitches', 'noteType', 'tuplet', 'attrs', 'clef', 'endBeam'];
    }
    get id() {
        return this.attrs.id;
    }

    get dots() {
        if (this.isTuplet) {
            return 0;
        }
        var vexDuration = smoMusic.ticksToDuration[this.tickCount];
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

    toggleArticulation(articulation) {
        if (this.articulations.findIndex((a) => {
                return a.articulation === articulation.articulation;
            }) < 0) {
            this._addArticulation(articulation, true);
        } else {
            this._addArticulation(articulation, false);
        }
    }

    _sortPitches() {
        var canon = VF.Music.canonical_notes;
        var keyIndex = ((pitch) => {
            return canon.indexOf(pitch.letter) + pitch.octave * 12;
        });
        this.pitches.sort((a, b) => {
            return keyIndex(a) - keyIndex(b);
        });
    }
    addPitchOffset(offset) {
        if (this.pitches.length == 0) {
            return this;
        }
        this.noteType = 'n';
        var pitch = this.pitches[0];
        this.pitches.push(smoMusic.getKeyOffset(pitch, offset));

        this._sortPitches();
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

    transpose(pitchArray, offset, keySignature) {
        var pitches = [];
        this.noteType = 'n';
        if (pitchArray.length == 0) {
            this.pitches.forEach((m) => {
                pitchArray.push(this.pitches.indexOf(m));
            });
        }
        for (var j = 0; j < pitchArray.length; ++j) {
            var index = pitchArray[j];
            if (index + 1 > this.pitches.length) {
                this.addPitchOffset(offset);
            } else {
                var pitch = smoMusic.getKeyOffset(this.pitches[index], offset);
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
                this.pitches[index] = pitch;
            }
        }
        this._sortPitches();
        return this;
    }
    get tickCount() {
        return this.ticks.numerator / this.ticks.denominator + this.ticks.remainder;
    }

    describe() {
        return this.id + ' ' + this.tickCount;
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
        var rv = SmoNote.clone(note);

        rv.ticks = ticks;

        return rv;
    }

    _serializeModifiers() {
        return JSON.parse(JSON.stringify(this.textModifiers));
    }
    serialize() {
        var params = {};
        smoMusic.serializedMerge(SmoNote.parameterArray, this, params);
        params.ticks = JSON.parse(JSON.stringify(params.ticks));
        params.noteModifiers = this._serializeModifiers();
        return params;
    }

    static get defaults() {
        return {
            noteType: 'n',
            textModifiers: [],
            articulations: [],
            endBeam: false,
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
        note.attrs.id = jsonObj.attrs.id;
        jsonObj.noteModifiers.forEach((mod) => {
            note.textModifiers.push(SmoNoteModifierBase.deserialize(mod));
        });
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
            console.log('inherit attrs');
        }
        this._adjustTicks();
    }
	
	static get longestTuplet() {
		return 8192;
	}

    get clonedParams() {
        var paramAr = ['stemTicks', 'ticks', 'totalTicks', 'durationMap']
        var rv = {};
        smoMusic.serializedMerge(paramAr, this, rv);
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
        var durationMap = tuplet.durationMap.flat(1); // deep copy array

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
            if (note.id === tn.id) {
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
            console.log('inherit attrs');
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
        this.ctor = ctor;
    }
    static deserialize(jsonObj) {
        var ctor = eval(jsonObj.ctor);
        var rv = new ctor(jsonObj);
        rv.attrs.id = jsonObj.attrs.id;
        rv.attrs.type = jsonObj.attrs.type;
		return rv;
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
			fermata:'fermata'
        };
    }
	static get positions() {
		return {above:'above',below:'below'};
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
			fermata:'a@a'
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
			'a@a':"fermata"
        };
    }
    static get attrArray() {
        return ['position', 'articulation'];
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
    constructor(parameters) {
        super('SmoArticulation');
        Vex.Merge(this, SmoArticulation.defaults);
        smoMusic.filteredMerge(SmoArticulation.attrArray, parameters, this);
        this.selector = parameters.selector;

        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoArticulation'
            };
        } else {
            console.log('inherit attrs');
        }
    }
    get id() {
        return this.attrs.id;
    }
    set id(ignore) {}
    get type() {
        return this.attrs.type;
    }
    set type(ignore) {}
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

    constructor(parameters) {
        super('SmoDynamicText');
        Vex.Merge(this, SmoDynamicText.defaults);
        smoMusic.filteredMerge(SmoDynamicText.attrArray, parameters, this);
        this.selector = parameters.selector;

        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoDynamicText'
            };
        } else {
            console.log('inherit attrs');
        }
    }
    get id() {
        return this.attrs.id;
    }
    set id(ignore) {}
    get type() {
        return this.attrs.type;
    }
    set type(ignore) {}
    static get attrArray() {
        return ['xOffset', 'fontSize', 'yOffsetLine', 'yOffsetPixels', 'text'];
    }
    backupOriginal() {
        if (!this['original']) {
            this.original = {};
            smoMusic.filteredMerge(
                SmoDynamicText.attrArray,
                this, this.original);
        }
    }
    restoreOriginal() {
        if (this['original']) {
            smoMusic.filteredMerge(
                SmoDynamicText.attrArray,
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
		this.beamGroups = [];
		this.modifiers = [];
		this.changed = true;
		var defaults = SmoMeasure.defaults;

		smoMusic.serializedMerge(SmoMeasure.defaultAttributes, defaults, this);
		smoMusic.serializedMerge(SmoMeasure.defaultAttributes, params, this);
		this.voices = params.voices ? params.voices : [];
		this.tuplets = params.tuplets ? params.tuplets : [];
		this.modifiers = params.modifiers ? params.modifiers : defaults.modifiers;
		this.adjY = 0;

		if (!this['attrs']) {
			this.attrs = {
				id: VF.Element.newID(),
				type: 'SmoMeasure'
			};
		} else {
			// inherit attrs id for deserialized
		}
	}
	get notes() {
		return this.voices[this.activeVoice].notes;
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

	set notes(val) {
		this.voices[this.activeVoice].notes = val;
	}
	get stemDirection() {
		return this.activeVoice % 2 ? -1 : 1;
	}

	// ### defaultAttributes
	// attributes that are to be serialized for a measure.
	static get defaultAttributes() {
		return [
			'timeSignature', 'keySignature', 'staffX', 'staffY', 'customModifiers',
			'measureNumber', 'staffWidth',
			'activeVoice', 'clef', 'transposeIndex', 'activeVoice', 'adjX','adjRight', 'padRight', 'rightMargin'];
	}

	// ### serialize
	// Convert this measure object to a JSON object, recursively serializing all the notes,
	// note modifiers, etc.
	serialize() {
		var params = {};
		smoMusic.serializedMerge(SmoMeasure.defaultAttributes, this, params);
		params.tuplets = [];
		params.beamGroups = [];
		params.voices = [];

		this.tuplets.forEach((tuplet) => {
			params.tuplets.push(JSON.parse(JSON.stringify(tuplet)));
		});

		this.beamGroups.forEach((beam) => {
			params.beamGroups.push(JSON.parse(JSON.stringify(beam)));
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
		return params;
	}

	// ### deserialize
	// restore a serialized measure object.  Usually called as part of deserializing a score,
	// but can also be used to restore a measure due to an undo operation.
	static deserialize(jsonObj) {
		var voices = [];
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
			}
		}

		var tuplets = [];
		for (j = 0; j < jsonObj.tuplets.length; ++j) {
			var tuplet = new SmoTuplet(jsonObj.tuplets[j]);
			tuplets.push(tuplet);
		}

		var beamGroups = [];
		for (j = 0; j < jsonObj.beamGroups.length; ++j) {
			var smoBeam = new SmoBeamGroup(jsonObj.beamGroups[j]);
			beamGroups.push(smoBeam);
		}

		var params = {
			voices: voices,
			tuplets: tuplets,
			beamGroups: beamGroups
		};

		smoMusic.serializedMerge(SmoMeasure.defaultAttributes, jsonObj, params);

		return new SmoMeasure(params);
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
		if (meterNumbers[0] % 3 == 0) {
			ticks = {
				numerator: 2048,
				denominator: 1,
				remainder: 0
			};
		}
		var pitches = SmoMeasure.defaultPitchForClef[params.clef];
		var rv = [];

		for (var i = 0; i < meterNumbers[0]; ++i) {
			var note = new SmoNote({
					clef: params.clef,
					pitches: [pitches],
					ticks: ticks,
					timeSignature: params.timeSignature
				});
			rv.push(note);
		}
		return rv;
	}

	// ### getDefaultMeasure
	// For create the initial or new measure, get a measure with notes.
	static getDefaultMeasure(params) {
		var obj = {};
		smoMusic.serializedMerge(SmoMeasure.defaultAttributes, SmoMeasure.defaults, obj);
		smoMusic.serializedMerge(SmoMeasure.defaultAttributes, params, obj);
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
		// modifiers.push(new SmoRepeatSymbol({symbol:SmoRepeatSymbol.symbols.None});
		return {
			timeSignature: '4/4',
			keySignature: "C",
			canceledKeySignature: null,
			staffX: 10,
			adjX: 0,
			adjRight:0,
			padRight: 10,
			transposeIndex: 0,
			modifiers: modifiers,
			rightMargin: 2,
			customModifiers: [],
			staffY: 40,
			// bars: [1, 1], // follows enumeration in VF.Barline
			measureNumber: {
				localIndex: 0,
				systemIndex: 0,
				measureNumber: 0,
				staffId: 0
			},
			staffWidth: 200,
			clef: 'treble',
			changed: true,
			forceClef: false,
			forceKeySignature: false,
			forceTimeSignature: false,
			voices: [],
			activeVoice: 0
		};
	}
	tickmap() {
		return VX.TICKMAP(this);
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
	addCustomModifier(ctor, parameters) {
		this.customModifiers.push({
			ctor: ctor,
			parameters: parameters
		});
	}
	get numBeats() {
		return this.timeSignature.split('/').map(number => parseInt(number, 10))[0];
	}
	setKeySignature(sig) {
		this.keySignature = sig;
		this.changed=true;
		this.voices.forEach((voice) => {
			voice.notes.forEach((note) => {
				note.keySignature = sig;
			});
		});
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
        rv.attrs.id = jsonObj.attrs.id;
        rv.attrs.type = jsonObj.attrs.type;
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

    constructor(parameters) {
        super('SmoBarline');
        parameters = parameters ? parameters : {};
        smoMusic.serializedMerge(['position', 'barline'], SmoBarline.defaults, this);
        smoMusic.serializedMerge(['position', 'barline'], parameters, this);
       
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
    constructor(parameters) {
        super('SmoRepeatSymbol');
        smoMusic.serializedMerge(SmoRepeatSymbol.attributes, SmoRepeatSymbol.defaults, this);
		this.xOffset = SmoRepeatSymbol.defaultXOffset[parameters.symbol];
        smoMusic.serializedMerge(SmoRepeatSymbol.attributes, parameters, this);
    }
}

class SmoVolta extends SmoMeasureModifierBase {
    constructor(parameters) {
        super('SmoVolta');
		this.original={};

		if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoVolta'
            };
        } else {
            console.log('inherit attrs');
        }
        smoMusic.serializedMerge(SmoVolta.attributes, SmoVolta.defaults, this);
		smoMusic.serializedMerge(SmoVolta.attributes, parameters, this);
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
            smoMusic.filteredMerge(
                SmoVolta.attributes,
                this, this.original);
        }
    }
    restoreOriginal() {
        if (this['original']) {
            smoMusic.filteredMerge(
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
;

// ## SmoSystemStaff
// ## Description:
// A staff is a line of music that can span multiple measures.
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
	
	static get defaultParameters() {
		return [
		'staffId','staffX','staffY','adjY','staffWidth','staffHeight','startIndex',
            'renumberingMap','keySignatureMap','instrumentInfo'];
	}
	
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
	
	serialize() {
		var params={};
		smoMusic.serializedMerge(SmoSystemStaff.defaultParameters,this,params);
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

    static deserialize(jsonObj) {
        var params = {};
        smoMusic.serializedMerge(
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

    addStaffModifier(modifier) {
        this.removeStaffModifier(modifier);
        this.modifiers.push(modifier);
    }

    removeStaffModifier(modifier) {
        var mods = [];
        this.modifiers.forEach((mod) => {
            if (mod.id != modifier.id) {
                mods.push(mod);
            }
        });
        this.modifiers = mods;
    }
	
	getModifiesrAt(selector) {
		var rv = [];
		this.modifiers.forEach((mod) => {
			if (SmoSelector.sameNote(mod.startSelector,selector)) {
				rv.push(mod);
			}
		});
		return rv;
	}

    getModifierMeasures(modifier) {
        return {
            startMeasure: this.measures.find((measure) => measure.attrs.id === modifier.startMeasure),
            endMeasure: this.measures.find((measure) => measure.attrs.id === modifier.endMeasure),
        }
    }

    applyBeams() {
        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];
            smoBeamerFactory.applyBeams(measure);
        }
    }

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
                    id: note.smoNote.id
                };
        }
        return null;
    }
	
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
			if (mod.startSelector.measure != index && mod.endSelector.measure != index) {
				sm.push(mod);
			}
		});
		this.measures=nm;
		this.modifiers=sm;
		this.numberMeasures();
	}

    getMaxTicksMeasure(measure) {
        if (this.measures.length < measure) {
            return 0;
        }
        return this.measures[measure].notes.length;
    }
    addKeySignature(measureIndex, key) {
        this.keySignatureMap[measureIndex] = key;
		var target = this.measures[measureIndex];
		target.keySignature = key;		
        // this._updateKeySignatures();
    }
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
    numberMeasures() {
        this.renumberIndex = this.startIndex;

        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];

            this.renumberIndex = this.renumberingMap[i] ? this.renumberingMap[i].startIndex : this.renumberIndex;
            var localIndex = this.renumberIndex + i;
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
				interGap: 30,
				intraGap:10,
				svgScale: 1.0,
				zoomScale: 2.0,
				zoomMode:SmoScore.zoomModes.zoomScale
			},
            staffWidth: 1600,
            startIndex: 0,
            renumberingMap: {},
            keySignatureMap: {},
            measureTickmap: [],
            staves: [],
            activeStaff: 0,
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
	
	static get orientations() {
		return ['portrait','landscape'];
	}
	
    static get defaultAttributes() {
        return ['layout' ,'startIndex',  'renumberingMap', 'renumberIndex'];
    }

    // ### serialize
    // ### Serialize the score.  The resulting JSON string will contain all the staves, measures, etc.
    serialize() {
        var params = {};
        smoMusic.serializedMerge(SmoScore.defaultAttributes, this, params);
        var obj = {
            score: params,
            staves: []
        };
        this.staves.forEach((staff) => {
            obj.staves.push(staff.serialize());
        });
        return obj;
    }
    // ### deserialize
    // ### Restore an earlier JSON string.  Unlike other deserialize methods, this one expects the string.
    static deserialize(jsonString) {
        var jsonObj = JSON.parse(jsonString);
        var params = {};
        var staves = [];
        smoMusic.serializedMerge(
            SmoScore.defaultAttributes,
            jsonObj, params);
        jsonObj.staves.forEach((staffObj) => {
            var staff = SmoSystemStaff.deserialize(staffObj);
            staves.push(staff);
        });
        params.staves = staves;

        return new SmoScore(params);
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
    // ### Description:
    // Delete the measure at the supplied index in all the staves.
    deleteMeasure(measureIndex) {
        this.staves.forEach((staff) => {
            staff.deleteMeasure(measureIndex);
        });

    }
    // ### addMeasure
    // ### Description:
    // Give a measure prototype, create a new measure and add it to each staff, with the
    // correct settings for current time signature/clef.
    addMeasure(measureIndex, measure) {

        for (var i = 0; i < this.staves.length; ++i) {
            var protomeasure = measure;
            var staff = this.staves[i];
            // Since this staff may already have instrument settings, use the
            // immediately precending or post-ceding measure if it exists.
            if (measureIndex < staff.measures.length) {
                protomeasure = staff.measures[measureIndex];
            } else if (staff.measures.length) {
                protomeasure = staff.measures[staff.measure.length - 1];
            }
            var nmeasure = SmoMeasure.getDefaultMeasureWithNotes(protomeasure);
            staff.addMeasure(measureIndex, nmeasure);
        }
        this._numberStaves();
    }

    // ### replaceMeasure
    // ### Description:
    // Replace the measure at the given location.  Probably due to an undo operation or paste.
    replaceMeasure(selector, measure) {
        var staff = this.staves[selector.staff];
        staff.measures[selector.measure] = measure;
    }
	
    // ### replace staff
	// ### Description:
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
    // ### Add a key signature at the specified index in all staves.
    addKeySignature(measureIndex, key) {
        this.staves.forEach((staff) => {
            staff.addKeySignature(measureIndex, key);
        });
    }

    // ### addInstrument
    // ### Description:
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
            smoMusic.serializedMerge(SmoMeasure.defaultAttributes, measure, newParams);
            newParams.clef = parameters.instrumentInfo.clef;
            newParams.transposeIndex = parameters.instrumentInfo.keyOffset;
            var newMeasure = SmoMeasure.getDefaultMeasureWithNotes(newParams);
            newMeasure.measureNumber = measure.measureNumber;
            measures.push(newMeasure);
        }
        parameters.measures = measures;
        var staff = new SmoSystemStaff(parameters);
        this.staves.push(staff);
        this.activeStaff = this.staves.length - 1;
		this._numberStaves();
    }

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

    getMaxTicksMeasure(measure) {
        return this.staves[this.activeStaff].getMaxTicksMeasure(measure);
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
        var ctor = eval(params.attrs.type);
        var rv = new ctor(params);
        rv.attrs.id = params.attrs.id;
        rv.attrs.type = params.attrs.type;
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
        smoMusic.filteredMerge(['position', 'xOffset', 'yOffset', 'hairpinType', 'height'], params, this);
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
    serialize() {
        var params = {};
        smoMusic.filteredMerge(['position', 'startSelector','endSelector','attrs','xOffset', 'yOffset', 'hairpinType', 'height'], this, params);
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
            smoMusic.filteredMerge(
                ['xOffsetLeft', 'xOffsetRight', 'yOffset', 'height', 'position', 'hairpinType'],
                this, this.original);
        }
    }
    restoreOriginal() {
        if (this['original']) {
            smoMusic.filteredMerge(
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
            xOffset: 0,
            yOffset: 10,			
            position: SmoSlur.positions.HEAD,
            position_end: SmoSlur.positions.HEAD,
            invert: false,
            cp1x: 0,
            cp1y: 40,
            cp2x: 0,
            cp2y: 40
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
            'cp1x', 'cp1y', 'cp2x', 'cp2y','attrs','thickness'];
    }

    serialize() {
        var params = {};
        smoMusic.filteredMerge(SmoSlur.parameterArray, this, params);
        params.ctor = 'SmoSlur';
        return params;
    }

    backupOriginal() {
        if (!this['original']) {
            this.original = {};
            smoMusic.filteredMerge(
                SmoSlur.parameterArray,
                this, this.original);
        }
    }
    restoreOriginal() {
        if (this['original']) {
            smoMusic.filteredMerge(
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
		
    get type() {
        return this.attrs.type;
    }
    get id() {
        return this.attrs.id;
    }

    constructor(params) {
        super('SmoSlur');
        smoMusic.serializedMerge(SmoSlur.parameterArray,SmoSlur.defaults,this);
		Vex.Merge(this,SmoSlur.defaults);
		smoMusic.filteredMerge(SmoSlur.parameterArray,params,this);
        smoMusic.serializedMerge(SmoSlur.parameterArray, params, this);
        this.startSelector = params.startSelector;
        this.endSelector = params.endSelector;
        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoSlur'
            };
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
        this.notes = measure.notes;
        this.keySignature = measure.keySignature;
        this.index = 0;
        this.startIndex = 0;
        this.endIndex = this.notes.length;

        Vex.Merge(this, options);

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

        this.hasRun = false;
        this.beattime = 4096;
        if (this.voice)
            this.beattime = this.voice.time.resolution / this.voice.time.num_beats;

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
                map[vexKey[0]] = {
                    letter: vexKey[0],
                    accidental: vexKey[1]
                };
            }
        });
    }
	
	// ### updateAccidentalMap
	// Keep a running tally of the accidentals based on the key and previous accidentals.
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
                    newObj[letter] = pitch;
                }
            } else {
                if (sigLetter != sigKey) {
                    newObj[letter] = pitch;
                }
            }
        }
        accidentalMap.push(newObj);
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
                if (mapLetter.letter.toLowerCase() === letter) {
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

class smoMeasureIterator {
    constructor(system, options) {
        this.measures = system.measures;
        this.index = this.startIndex = 0;
        this.endIndex = this.measures.length;
        Vex.Merge(this, options);
    }

    iterate(actor) {
        for (this.index = this.startIndex; this.index < this.endIndex; this.index += 1) {
            var measure = this.measures[this.index];
            actor(this, measure);
        }
    }
}

/* iterate over a set of notes, creating a map of notes to ticks */
VX.TICKMAP = (measure) => {
    var iterator = new smoTickIterator(measure);
    iterator.iterate(smoTickIterator.nullActor, measure);
    return iterator;
}
;
class BeamModifierBase {
    constructor() {}
    beamNote(note, iterator, accidentalMap) {}
}

class smoBeamerFactory {
    static applyBeams(measure) {
        var beamer = new smoBeamModifier(measure);
        var apply = new smoBeamerIterator(measure, [beamer]);
        apply.run();
    }
}

class smoBeamerIterator {
    constructor(measure, actors) {
        this.actors = actors;
        this.measure = measure;
    }

    get iterator() {
        return this._iterator;
    }

    //  ### run
    //  ###  Description:  start the iteration on this set of notes
    run() {
        var self = this;
        var iterator = new smoTickIterator(this.measure);
        iterator.iterate((iterator, note, accidentalMap) => {
            for (var i = 0; i < self.actors.length; ++i) {
                self.actors[i].beamNote(iterator, note, accidentalMap);
            }
        });
    }
}

class smoBeamModifier extends BeamModifierBase {
    constructor(measure) {
        super();
        this.measure = measure;
        this.measure.beamGroups = [];
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

    _completeGroup() {
        // don't beam groups of 1
        if (this.currentGroup.length > 1) {
            this.measure.beamGroups.push(new SmoBeamGroup({
                    notes: this.currentGroup
                }));
        }
    }

    _advanceGroup() {
        this.currentGroup = [];
        this.duration = 0;
    }
    beamNote(iterator, note, accidentalMap) {

        this.duration += iterator.delta;

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
                this._completeGroup();
                this._advanceGroup();
            }
            return note;
        }

        // don't beam > 1/4 note in 4/4 time
        if (iterator.delta >= this.beamBeats) {
			this._completeGroup();
            this._advanceGroup();
            return note;
        }

        this.currentGroup.push(note);
        if (note.endBeam) {
            this._completeGroup();
            this._advanceGroup();
        }

        if (this.duration == this.beamBeats) {
            this._completeGroup();
            this._advanceGroup();
            return note;
        }

        // If this does not align on a beat, don't beam it
        if (this.duration > this.beamBeats) {
			// ||            ((iterator.totalDuration - this.duration) % this.beamBeats != 0)) {
            this._advanceGroup()
            return note;
        }
    }
}
;VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

// this file contains utilities that change the duration of notes in a measure.

// ## SmoTickTransformer
//  Base class for duration transformations.  I call them transformations because this can
//  create and delete notes, as opposed to modifiers which act on existing notes.
class SmoTickTransformer {
    constructor(measure, actors, options) {
        this.notes = measure.notes;
        this.measure = measure;
        this.vxNotes = [];
        this.actors = actors ? actors : [];
        this.keySignature = 'C';
        this.accidentalMap = [];
        Vex.Merge(this, options);
    }
    static nullActor(note) {
        return note;
    }
	// ## applyTransform
	// create a transform with the given actors and run it against the supplied measure
	static applyTransform(measure,actors) {
		var actAr = (Array.isArray(actors)) ? actors : [actors];
		measure.clearBeamGroups();
        var transformer = new SmoTickTransformer(measure, actAr);
        transformer.run();
        measure.notes = transformer.notes;
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
    transformTick(iterator, note) {
        var self = this;
       
        for (var i = 0; i < this.actors.length; ++i) {
			var actor=this.actors[i];
            var newNote = actor.transformTick(note, iterator, iterator.accidentalMap);
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
        var iterator = new smoTickIterator(this.measure);
        iterator.iterate((iterator, note, accidentalMap) => {
            self.transformTick(iterator, note, accidentalMap);
        });

        this.notes = this.vxNotes;
        return this.vxNotes;
    }
}

// ## A note transformer is just a function that modifies a note in some way.
// Any number of transformers can be applied to a note.
class TickTransformBase {
    constructor() {}
    transformTick(note, iterator, accidentalMap) {
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
    transformTick(note, iterator, accidentalMap) {
        if (iterator.index == this.startIndex) {
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
                        ticks: {numerator:this.newTicks,denominator:1,remainder:0}
                    }));
				remainder = remainder - this.newTicks;
            }
			
			if (remainder > 0) {
				notes.push(new SmoNote({
                        clef: note.clef,
                        pitches: JSON.parse(JSON.stringify(note.pitches)),
                        ticks: {numerator:remainder,denominator:1,remainder:0}
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
    transformTick(note, iterator, accidentalMap) {

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

        if (iterator.index < this.tupletIndex)
            return note;
        if (iterator.index >= this.tupletIndex + this.oldLength)
            return note;
        if (iterator.index === this.tupletIndex) {
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
        this.tuplet = this.measure.getTupletForNote(this.measure.notes[this.changeIndex]);
        this.oldLength = this.tuplet.notes.length;
        this.tupletIndex = this.measure.tupletIndex(this.tuplet);
        this.splitIndex = this.changeIndex - this.tupletIndex;
        this.tuplet.split(this.splitIndex);
    }
    transformTick(note, iterator, accidentalMap) {
        if (iterator.index < this.tupletIndex)
            return note;
        if (iterator.index >= this.tupletIndex + this.oldLength)
            return note;
        if (iterator.index == this.changeIndex) {
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
    transformTick(note, iterator, accidentalMap) {
        if (iterator.index < this.startIndex || iterator.index > this.endIndex) {
            return null;
        }
        if (iterator.index == this.startIndex) {
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
        var ticks = this.measure.tickmap();
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
    transformTick(note, iterator, accidentalMap) {
        // if our tuplet replaces this note, make sure we make it go away.
        if (iterator.index > this.index && iterator.index <= this.rangeToSkip[1]) {
            return [];
        }
        if (iterator.index != this.index) {
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
                startIndex: iterator.index,
                durationMap: this.durationMap,
                location: 1
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
    transformTick(note, iterator, accidentalMap) {
        if (this.durationMap.length == 0) {
            return null;
        }
        if (iterator.index >= this.startIndex && iterator.index < this.startIndex + this.durationMap.length) {
            var mapIndex = iterator.index - this.startIndex;
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
		var measure = staff.measures[measureIndex];
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
		var cur = selections;
		rv.push(cur.measure);
		for (var i=1;i<selections.length;++i) {
			var sel = selections[i];
			if (sel.selector.measure != cur.selector.measure) {
				rv.push(sel.measure);
				cur=sel;
			}
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
		if (measureIndex > 0) {
			measure = staff.measures[lastMeasure];
			var noteIndex = staff.measures[lastMeasure].voices[voiceIndex].notes.length - 1;
			return SmoSelection.noteSelection(score, staffIndex, lastMeasure, voiceIndex, noteIndex);
		}
		return null;
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

	static addKeySignature(score, selection, keySignature) {
		score.addKeySignature(selection.selector.measure, keySignature);
	}

	static deleteMeasure(score, selection) {
		var measureIndex = selection.selector.measure;

		score.deleteMeasure(measureIndex);
	}

	static toggleBeamGroup(noteSelection) {
		noteSelection.measure.changed = true;
		noteSelection.note.endBeam = !(noteSelection.note.endBeam);
	}

	static batchSelectionOperation(score, selections, operation) {
		var measureTicks = [];
		selections.forEach((selection) => {
			var measureSel = {
				staff: selection.selector.staff,
				measure: selection.selector.measure,
				voice: selection.selector.voice
			};
			selection.measure.changed = true;
			if (!measureTicks[measureSel]) {
				var tm = selection.measure.tickmap();
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
			var tickmap = selection.measure.tickmap();
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
		var tuplet = measure.getTupletForNote(note);
		if (!tuplet) {
			if (selection.note.dots > 0) {
				return;
			}
			var nticks = note.tickCount * 2;
			var actor = new SmoStretchNoteActor({
					startIndex: selection.selector.tick,
					tickmap: measure.tickmap(),
					newTicks: nticks
				});
			SmoTickTransformer.applyTransform(measure, actor);
		} else {
			var startIndex = tuplet.getIndexOfNote(note);
			var endIndex = startIndex + 1;
			if (endIndex >= tuplet.notes.length) {
				return;
			}
			var actor = new SmoStretchTupletActor({
					changeIndex: measure.tupletIndex(tuplet),
					startIndex: startIndex,
					endIndex: endIndex,
					measure: measure
				});
			SmoTickTransformer.applyTransform(measure, actor);
		}
		selection.measure.changed = true;
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
					tickmap: measure.tickmap(),
					newTicks: nticks
				});
			SmoTickTransformer.applyTransform(measure, actor);

		} else {
			var startIndex = measure.tupletIndex(tuplet) + tuplet.getIndexOfNote(note);
			var actor = new SmoContractTupletActor({
					changeIndex: startIndex,
					measure: measure
				});
			SmoTickTransformer.applyTransform(measure, actor);
		}
		selection.measure.changed = true;
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
				measure: measure
			});
		SmoTickTransformer.applyTransform(measure, actor);
		selection.measure.changed = true;

		return true;
	}

	static makeRest(selection) {
		selection.measure.changed = true;
		selection.note.makeRest();
	}
	static makeNote(selection) {
		selection.measure.changed = true;
		selection.note.makeNote();
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
		SmoTickTransformer.applyTransform(measure, actor);
		measure.changed = true;
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
		// If this is the ultimate note in the measure, we can't increase the length
		if (selection.selector.tick + 1 === selection.measure.notes.length) {
			return;
		}
		if (selection.measure.notes[selection.selector.tick + 1].tickCount > selection.note.tickCount) {
			console.log('too long');
			return;
		}
		// is dot too short?
		if (!smoMusic.ticksToDuration[selection.measure.notes[selection.selector.tick + 1].tickCount/2]) {
			return;
		}
		var actor = new SmoStretchNoteActor({
				startIndex: selection.selector.tick,
				tickmap: measure.tickmap(),
				newTicks: nticks
			});
		SmoTickTransformer.applyTransform(measure, actor);
		measure.changed = true;
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
				tickmap: measure.tickmap(),
				newTicks: nticks
			});
		SmoTickTransformer.applyTransform(measure, actor);
		selection.measure.changed = true;
		return true;
	}

	// ## transpose
	// ## Description
	// Transpose the selected note, trying to find a key-signature friendly value
	static transpose(selection, offset) {
		var measure = selection.measure;
		var note = selection.note;
		if (measure && note) {
			note.transpose(selection.selector.pitches, offset, measure.keySignature);
			measure.changed = true;
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
		measure.changed = true;
		// TODO allow hint for octave
		var octave = note.pitches[0].octave;
		note.pitches = [];
		if (!Array.isArray(pitches)) {
			pitches = [pitches];
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
		selection.measure.changed = true;
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
		selection.measure.changed = true;
	}

	static courtesyAccidental(pitchSelection, toBe) {
		pitchSelection.selector.pitches.forEach((pitchIx) => {
			pitchSelection.note.pitches[pitchIx].cautionary = toBe;
		});
		pitchSelection.measure.changed = true;
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
		pitchSelection.measure.changed = true;
	}

	static addDynamic(selection, dynamic) {
		selection.note.addModifier(dynamic);
		selection.measure.changed = true;
	}

	static toggleArticulation(selection, articulation) {
		selection.note.toggleArticulation(articulation);
		selection.measure.changed = true;
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
				measure.changed = true;
				m += 1;
			});
			s += 1;
		});
	}

	static setMeasureBarline(score, selection, barline) {
		var mm = selection.selector.measure;
		var ix = 0;
		score.staves.forEach((staff) => {
			var s2 = SmoSelection.measureSelection(score, ix, mm);
			s2.measure.setBarline(barline);
			s2.measure.changed = true;
			ix += 1;
		});
	}

	static setRepeatSymbol(score, selection, sym) {
		var mm = selection.selector.measure;
		var ix = 0;
		score.staves.forEach((staff) => {
			var s2 = SmoSelection.measureSelection(score, ix, mm);
			s2.measure.setRepeatSymbol(sym);
			s2.measure.changed = true;
			ix += 1;
		});
	}

	// ## interval
	// ## Description:
	// Add a pitch at the specified interval to the chord in the selection.
	static interval(selection, interval) {
		var measure = selection.measure;
		var note = selection.note;
		selection.measure.changed = true;

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
				selection.measure.changed = true;
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
            measure.changed = true;
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
    static setPitch(selection, pitches, undoBuffer) {
        undoBuffer.addBuffer('pitch change ' + JSON.stringify(pitches, null, ' '),
            'measure', selection.selector, selection.measure);
        SmoOperation.setPitch(selection, pitches);
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
	static noop(score,undoBuffer) {
        undoBuffer.addBuffer('Backup', 'score', null, score);		
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
	static toggleCourtesyAccidental(selection,undoBuffer) {
        undoBuffer.addBuffer('toggle courtesy ','measure', selection.selector, selection.measure);
		SmoOperation.toggleCourtesyAccidental(selection);		
	}
    static removeStaff(score, index, undoBuffer) {
        undoBuffer.addBuffer('remove instrument', 'score', null, score);
        SmoOperation.removeStaff(score, index);
    }
    static changeInstrument(score, instrument, selections, undoBuffer) {
        undoBuffer.addBuffer('changeInstrument', 'staff', selections[0].selector, score);
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
		selections.forEach((selection) => {
			var selector = JSON.parse(JSON.stringify(selection.selector));
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

	// ### _populateMeasureArray
	// ### Description:
	// Before pasting, populate an array of existing measures from the paste destination
	// so we know how to place the notes.
	_populateMeasureArray() {
		this.measures = [];
		var measureSelection = SmoSelection.measureSelection(this.score, this.destination.staff, this.destination.measure);
		var measure = measureSelection.measure;
		this.measures.push(measure);
		var tickmap = measure.tickmap();
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
				// create a new tuplet array for the new measure.
				if (tuplet.getIndexOfNote(note) === 0) {
					var ntuplet = SmoTuplet.cloneTuplet(tuplet);
					this.tupletNoteMap[ntuplet.attrs.id] = ntuplet;
					ticksToFill -= tuplet.tickCount;
					voice.notes = voice.notes.concat(ntuplet.notes);
				}
			} else if (ticksToFill >= note.tickCount) {
				ticksToFill -= note.tickCount;
				voice.notes.push(SmoNote.clone(note));
			} else {
				var duration = note.tickCount - ticksToFill;
				SmoNote.cloneWithDuration(note, {
					numerator: duration,
					denominator: 1,
					remainder: 0
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
		var tickmap = measure.tickmap();
		var startSelector = JSON.parse(JSON.stringify(this.destination));
		var measureTuplets = [];
		var voice = this._populatePre(voiceIndex, measure, this.destination.tick, tickmap);
		measureVoices.push(voice);
		while (this.measureIndex < measures.length) {
			measure = measures[this.measureIndex];
			tickmap = measure.tickmap();
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

	// ### _populateNew
	// ### Description:
	// Start copying the paste buffer into the destination by copying the notes and working out
	// the measure overlap
	_populateNew(voice, voiceIndex, measure, tickmap, startSelector) {
		var currentDuration = tickmap.durationMap[startSelector.tick];
		var totalDuration = tickmap.totalDuration;
		while (currentDuration < totalDuration && this.noteIndex < this.notes.length) {
			var note = this.notes[this.noteIndex].note;
			if (note.isTuplet) {
				var tuplet = this.tupletNoteMap[note.tuplet.id];
				var index = tuplet.getIndexOfNote(note);
				// If the tuplet fits in the rest of the measure, just paste all the notes
				// Note they are not cloned.
				if (index === 0) {
					if (currentDuration + tuplet.tickCount <= totalDuration && this.remainder === 0) {
						currentDuration += tuplet.tickCount;
						tuplet.notes.forEach((tnote) => {
							voice.notes.push(tnote);
						});
						this.noteIndex += 1;
						measure.tuplets.push(tuplet);
						startSelector.tick += tuplet.notes.length;
					} else {
						// The tuplet won't fit.  There is no way to split up a tuplet, we
						// should try to prevent this.  Just paste the first note to the
						// last spot in the measure
						var partial = totalDuration - currentDuration;
						var snote = SmoNote.cloneWithDuration(tuplet.notes[0], {
								numerator: partial,
								denominator: 1,
								remainder: 0
							});
						snote.tuplet = null;
						totalDuration = currentDuration;
						voice.notes.push(snote);
						this.noteIndex += 1;
						this.startSelector.tick += 1;
					}
				} else {
					this.noteIndex += 1;
				}
			} else if (currentDuration + note.tickCount <= totalDuration && this.remainder === 0) {
				// The whole note fits in the measure, paste it.
				voice.notes.push(SmoNote.clone(note));
				currentDuration += note.tickCount;
				this.noteIndex += 1;
				startSelector.tick += 1;
			} else if (this.remainder > 0) {
				// This is a note that spilled over the last measure
				voice.notes.push(SmoNote.cloneWithDuration(note, {
						numerator: this.remainder,
						denominator: 1,
						remainder: 0
					}));

				currentDuration += this.remainder;
				this.remainder = 0;
			} else {
				// The note won't fit, so we split it in 2 and paste the remainder in the next measure.
				// TODO:  tie the last note to this one.
				var partial = totalDuration - currentDuration;
				voice.notes.push(SmoNote.cloneWithDuration(note, {
						numerator: partial,
						denominator: 1,
						remainder: 0
					}));
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
			ser.voices = [vobj];
			var nmeasure = SmoMeasure.deserialize(ser);
			var tupletKeys = Object.keys(this.tupletNoteMap);
			nmeasure.tuplets = [];
			// since we are deserializing the measure that had different tuplets, need to create the correct tuplet.
			tupletKeys.forEach((key) => {
				if (vobj.notes.findIndex((nn) => {return nn.tuplet && nn.tuplet.id===key}) >= 0) {
				    nmeasure.tuplets.push(this.tupletNoteMap[key]);
				}
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
        this.tickmap = this.smoMeasure.tickmap();

        this.vexNotes = [];
        this.vexBeamGroups = [];
        this.vexTuplets = [];
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
    tickmap() {
        return VX.TICKMAP(this.smoMeasure);
    }

    // ## Description:
    // decide whether to force stem direction for multi-voice, or use the default.
    // ## TODO:
    // use x position of ticks in other voices, pitch of note, and consider
    // stem direction modifier.
    applyStemDirection(vxParams) {
        if (this.smoMeasure.voices.length === 1) {
            vxParams.auto_stem = true;
        } else if (this.smoMeasure.activeVoice % 2) {
            vxParams.stem_direction = -1;
        } else {
            vxParams.stem_direction = 1;
        }
    }
		
	_createAccidentals(smoNote,vexNote,tickIndex) {		
        for (var i = 0; i < smoNote.pitches.length; ++i) {
            var pitch = smoNote.pitches[i];
            var accidental = pitch.accidental ? pitch.accidental : 'n';

            // was this accidental declared earlier in the measure?
            var declared = this.tickmap.getActiveAccidental(pitch,tickIndex,this.smoMeasure.keySignature);

            if (accidental != declared || pitch.cautionary) {
                var acc = new VF.Accidental(accidental);

                if (pitch.cautionary) {
                    acc.setAsCautionary();
                }
                vexNote.addAccidental(i, acc);
            }
        }
        for (var i = 0; i < smoNote.dots; ++i) {
            vexNote.addDotToAll();
        }	
	}

    // ## Description:
    // convert a smoNote into a vxNote so it can be rasterized
    _createVexNote(smoNote, tickIndex) {
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
		
        this.applyStemDirection(noteParams);
        var vexNote = new VF.StaveNote(noteParams);
        smoNote.renderId = 'vf-' + vexNote.attrs.id; // where does 'vf' come from?

		this._createAccidentals(smoNote,vexNote,tickIndex);
		
        return vexNote;
    }
	
	_renderArticulations(smoNote,articulation) {
		var i=0;
		this.smoMeasure.notes.forEach((smoNote) => {
			smoNote.articulations.forEach((art) => {
				var vx = this.noteToVexMap[smoNote.id];
				var position = SmoArticulation.positionToVex[art.position];
				var vexArt = SmoArticulation.articulationToVex[art.articulation];
				var vxArt=new VF.Articulation(vexArt).setPosition(position);
				vx.addArticulation(i,vxArt);
			});
		});		
	}
	
	_renderNoteGlyph(smoNote,textObj) {		
		var x = this.noteToVexMap[smoNote.id].getAbsoluteX();
		// the -3 is copied from vexflow textDynamics
		var y=this.stave.getYForLine(textObj.yOffsetLine-3) + textObj.yOffsetPixels; 
		var group = this.context.openGroup();
        group.classList.add(textObj.id+'-'+smoNote.id);
		group.classList.add(textObj.id);
		textObj.text.split('').forEach((ch)=> {
			const glyphCode = VF.TextDynamics.GLYPHS[ch];
			const glyph=new Vex.Flow.Glyph(glyphCode.code, textObj.fontSize);
			glyph.render(this.context, x, y);
			x += VF.TextDynamics.GLYPHS[ch].width;
		});
		textObj.renderedBox = group.getBoundingClientRect();
		this.context.closeGroup();
	}
	
	renderDynamics() {
		this.smoMeasure.notes.forEach((smoNote) => {
			smoNote.textModifiers.forEach((tm) => {
				this._renderNoteGlyph(smoNote,tm);
			});
		});
	}
	

    // ## Description:
    // create an a array of VF.StaveNote objects to render the active voice.
    createVexNotes() {
        this.vexNotes = [];
        this.noteToVexMap = {};

        for (var i = 0; i < this.smoMeasure.notes.length; ++i) {
            var smoNote = this.smoMeasure.notes[i];           
            var vexNote = this._createVexNote(smoNote, i);
            this.noteToVexMap[smoNote.attrs.id] = vexNote;
            this.vexNotes.push(vexNote);
        }
		this._renderArticulations();
    }

    // ### createVexBeamGroups
    // create the VX beam groups. VexFlow has auto-beaming logic, but we use 
	// our own because the user can specify stem directions, breaks etc.
    createVexBeamGroups() {
        this.vexBeamGroups = [];
        this.beamToVexMap = {};
        for (var i = 0; i < this.smoMeasure.beamGroups.length; ++i) {
            var bg = this.smoMeasure.beamGroups[i];
            var vexNotes = [];
            var stemDirection = -1;
            for (var j = 0; j < bg.notes.length; ++j) {
                var note = bg.notes[j];
                var vexNote = this.noteToVexMap[note.attrs.id]
                    if (j === 0) {
                        stemDirection = vexNote.getStemDirection();
                    } else {
                        vexNote.setStemDirection(stemDirection);
                    }
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
    createVexTuplets() {
        this.vexTuplets = [];
        this.tupletToVexMap = {};
        for (var i = 0; i < this.smoMeasure.tuplets.length; ++i) {
            var tp = this.smoMeasure.tuplets[i];
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
		if (this.smoMeasure.measureNumber.systeIndex != 0 && sb.barline === SmoBarline.barlines.singleBar) {
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
	}

    // ## Description:
    // Render all the notes in my smoMeasure.  All rendering logic is called from here.
    render() {
        $(this.context.svg).find('g.' + this.smoMeasure.attrs.id).remove();

        var group = this.context.openGroup();
        group.classList.add(this.smoMeasure.attrs.id);
		group.id=this.smoMeasure.attrs.id;
		
		var key = smoMusic.vexKeySignatureTranspose(this.smoMeasure.keySignature,this.smoMeasure.transposeIndex);
		var canceledKey = this.smoMeasure.canceledKeySignature ? smoMusic.vexKeySignatureTranspose(this.smoMeasure.canceledKeySignature,this.smoMeasure.transposeIndex)
		   : this.smoMeasure.canceledKeySignature;

        var staffWidth = this.smoMeasure.staffWidth;
		

        //console.log('measure '+JSON.stringify(this.smoMeasure.measureNumber,null,' ')+' x: ' + this.smoMeasure.staffX + ' y: '+this.smoMeasure.staffY
        // + 'width: '+staffWidth);
        this.stave = new VF.Stave(this.smoMeasure.staffX, this.smoMeasure.staffY, staffWidth-1);
		
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

        var voiceAr = [];

        // If there are multiple voices, add them all to the formatter at the same time so they don't collide
        for (var j = 0; j < this.smoMeasure.voices.length; ++j) {

            this.smoMeasure.activeVoice = j;
            this.createVexNotes();
            this.createVexTuplets();
            this.createVexBeamGroups();

            // Create a voice in 4/4 and add above notes
            var voice = new VF.Voice({
                    num_beats: this.smoMeasure.numBeats,
                    beat_value: this.smoMeasure.beatValue
                });
            voice.addTickables(this.vexNotes);
            voiceAr.push(voice);
        }
		
		// Need to format for x position, then set y position before drawing dynamics.
        this.formatter = new VF.Formatter().joinVoices(voiceAr).format(voiceAr, this.smoMeasure.staffWidth-
		    (this.smoMeasure.adjX + this.smoMeasure.adjRight));
		
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
		// this.smoMeasure.adjX = this.stave.start_x - (this.smoMeasure.staffX);

        this.context.closeGroup();
        var box = group.getBoundingClientRect();
		var lbox = svgHelpers.clientToLogical(this.context.svg,box);
        this.smoMeasure.renderedBox = {
            x: box.x,
            y: box.y,
            height: box.height,
            width: box.width
        };
		
		this.smoMeasure.logicalBox = lbox;
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
	constructor(context, topY, lineIndex) {
		this.context = context;
		this.leftConnector = [null, null];
		this.lineIndex = lineIndex;
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
			if (mm.noteToVexMap[smoNote.id]) {
				return mm.noteToVexMap[smoNote.id];
			}
		}
		return null;
	}

	renderModifier(modifier, vxStart, vxEnd) {
		// if it is split between lines, render one artifact for each line, with a common class for
		// both if it is removed.
		var artifactId = modifier.attrs.id + '-' + this.lineIndex;
		$(this.context.svg).find('g.' + artifactId).remove();
		var group = this.context.openGroup();
		group.classList.add(modifier.id);
		group.classList.add(artifactId);
		if ((modifier.type == 'SmoStaffHairpin' && modifier.hairpinType == SmoStaffHairpin.types.CRESCENDO) ||
			(modifier.type == 'SmoStaffHairpin' && modifier.hairpinType == SmoStaffHairpin.types.DECRESCENDO)) {
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
		} else if (modifier.type == 'SmoSlur') {
			var curve = new VF.Curve(
					vxStart, vxEnd, //first_indices:[0],last_indices:[0]});
				{
					thickness: modifier.thickness,
					x_shift: modifier.xOffset,
					y_shift: modifier.yOffset,
					cps: modifier.controlPoints,
					invert: modifier.invert,
					position: modifier.position
				});
			curve.setContext(this.context).draw();

		}

		this.context.closeGroup();
		return group.getBoundingClientRect();
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
				ending.renderedBox = group.getBoundingClientRect();
				ending.logicalBox = svgHelpers.clientToLogical(this.context.svg, ending.renderedBox);
				
				// Adjust real height of measure to match volta height
				voAr.forEach((mm) => {
					var delta =  mm.logicalBox.y - ending.logicalBox.y;
					if (delta > 0) {
						mm.logicalBox.y -= delta;
						mm.logicalBox.height += delta;
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
	constructor(layout) {
		this.layout = layout;
		this.groupObjectMap = {};
		this.objectGroupMap = {};
		this.objects = [];
		this.selections = [];
		this.modifierTabs = {};
		this.modifierIndex = -1;
		this.modifierSuggestion=-1;
		this.suggestion = {};
		this.pitchIndex = -1;
		this.pasteBuffer = new PasteBuffer();
	}

	// ### renderElement
	// the element the score is rendered on
	get renderElement() {
		return this.layout.renderElement;
	}

	get score() {
		return this.layout.score;
	}

	get context() {
		return this.layout.context;
	}

	_copySelections() {
		var rv = [];
		this.selections.forEach((sel) => {
			rv.push(sel.selector)
		});
		return rv;
	}

	_updateModifiers() {
		this.modifierTabs = [];
		this.modifierBoxes = [];
		var modMap = {};
		var ix=0;
		this.objects.forEach((selection) => {
			selection.staff.modifiers.forEach((modifier) => {
				if (SmoSelector.contains(selection.selector, modifier.startSelector, modifier.endSelector)) {
					if (!modMap[modifier.id]) {
						this.modifierTabs.push({
							modifier: modifier,
							selection: selection,
							box:modifier.renderedBox,
							index:ix
						});
						ix += 1;
						modMap[modifier.id] = {
							exists: true
						};
					}
				}
			});
			selection.measure.modifiers.forEach((modifier) => {
				if (modifier.id && !modMap[modifier.id]) {
					this.modifierTabs.push({
						modifier: modifier,
						selection: selection,
						box:modifier.renderedBox,
						index:ix
					});
					ix += 1;
					modMap[modifier.id] = {
						exists: true
					};
				}
			});
			selection.note.textModifiers.forEach((modifier) => {
				if (!modMap[modifier.id]) {
					this.modifierTabs.push({
						modifier: modifier,
						selection: selection,
						box:modifier.renderedBox,
						index:ix
					});
					ix += 1;
					modMap[modifier.id] = {
						exists: true
					};
				}
			});
		});
		
		this.modifierTabs.forEach((mod) => {
			
		});
	}

	_highlightModifier() {
		if (this.modifierIndex >= 0 && this.modifierIndex < this.modifierTabs.length) {
			var modSelection = this.modifierTabs[this.modifierIndex];
			if (modSelection.modifier.renderedBox) {
				this._drawRect(modSelection.modifier.renderedBox, 'staffModifier');
			}
		}
	}

	clearModifierSelections() {
		this.modifierTabs = [];
		this.modifierIndex = -1;
		this.eraseRect('staffModifier');
		this.pasteBuffer.clearSelections();
	}
	getSelectedModifier() {
		if (this.modifierIndex >= 0) {
			return this.modifierTabs[this.modifierIndex];
		}
	}

	advanceModifierSelection() {
		this.eraseRect('staffModifier');

		if (!this.modifierTabs.length) {
			return;
		}
		this.modifierIndex = this.modifierIndex + 1;
		if (this.modifierIndex >= this.modifierTabs.length) {
			this.modifierIndex = -1;
			return;
		}
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
	
	// ### updateMap
	// This should be called after rendering the score.  It updates the score to
	// graphics map and selects the first object.
	//
	// ### TODO:
	// try to preserve the previous selection
	_updateMap() {
		var notes = [].slice.call(this.renderElement.getElementsByClassName('vf-stavenote'));
		this.groupObjectMap = {};
		this.objectGroupMap = {};
		this.objects = [];
		var selCopy = this._copySelections();
		notes.forEach((note) => {
			var box = note.getBoundingClientRect();
			// box = svgHelpers.untransformSvgBox(this.context.svg,box);
			var selection = SmoSelection.renderedNoteSelection(this.score, note, box);
			if (selection) {
				this.objects.push(selection);
			}
		});
		this._updateModifiers();
		this.selections = [];
		if (this.objects.length && !selCopy.length) {
			console.log('adding selection ' + this.objects[0].note.id);
			this.selections = [this.objects[0]];
		} else {
			selCopy.forEach((sel) => this._findClosestSelection(sel));
		}
		this.highlightSelection();
		this.triggerSelection();
		this.pasteBuffer.clearSelections();
		this.pasteBuffer.setSelections(this.score, this.selections);
	}
	
	updateMap() {
		const promise = new Promise((resolve, reject) => {
             this._updateMap();
			 resolve();
                });
            return promise;
	}

	static stringifyBox(box) {
		return '{x:' + box.x + ',y:' + box.y + ',width:' + box.width + ',height:' + box.height + '}';
	}

	// ### _mapNoteElementToNote
	// given a svg note group, find the smo element that defines this note;
	_mapNoteElementToNote(nel) {
		var id = nel.getAttribute('id');
		var artifact = SmoSelection.renderedNoteSelection(this.score, nel);
		if (!artifact) {
			console.log('note ' + id + ' not found');
		} else {
			//console.log('note '+JSON.stringify(artifact.smoMeasure.measureNumber,null,' ')+' box: '+
			// suiTracker.stringifyBox(box));
			this.groupObjectMap[id] = artifact;
			this.objectGroupMap[artifact.note.id] = artifact;
			this.objects.push({
				artifact: artifact
			});
		}
	}

	_getClosestTick(selector) {
		var measureObj = this.objects.find((e) => SmoSelector.sameMeasure(e.selector, selector)
				 && e.selector.tick === 0);
		var tickObj = this.objects.find((e) => SmoSelector.sameNote(e.selector, selector));
		var firstObj = this.objects[0];
		return (tickObj) ? tickObj: 
		    (measureObj ? measureObj : firstObj);
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
		if (targetMeasure && targetMeasure.measure) {
			scopyMeasure.tick = (offset < 0) ? targetMeasure.measure.notes.length - 1 : 0;
		}

		if (testSelection.measure.notes.length > scopyTick.tick && scopyTick.tick >= 0) {
			return scopyTick;
		} else if (targetMeasure &&
			scopyMeasure.measure < testSelection.staff.measures.length && scopyMeasure.measure >= 0) {
			return scopyMeasure;
		}
		return testSelection.selector;
	}

	static unionRect(b1, b2) {
		return svgHelpers.unionRect(b1, b2);
	}

	get selectedArtifact() {
		for (var i = 0; i < this.selections.length; ++i) {
			var selection = this.selections[i];
			if (selection['artifact']) {
				return selection.artifact;
			}
		}
		return {};
	}

	growSelectionRight() {
		var nselect = this._getOffsetSelection(1);
		// already selected
		var artifact = this._getClosestTick(nselect);
		if (!artifact) {
			return;
		}
		if (this.selections.find((sel) => SmoSelector.sameNote(sel.selector, artifact.selector))) {
			return;
		}
		console.log('adding selection ' + artifact.note.id);

		this.selections.push(artifact);
		this.highlightSelection();
		this.triggerSelection();
	}

	growSelectionLeft() {
		var nselect = this._getOffsetSelection(-1);
		// already selected
		var artifact = this._getClosestTick(nselect);
		if (!artifact) {
			return;
		}
		if (this.selections.find((sel) => SmoSelector.sameNote(sel.selector, artifact.selector))) {
			return;
		}

		console.log('adding selection ' + artifact.note.id);
		this.selections.push(artifact);
		this.highlightSelection();
		this.triggerSelection();
	}

	moveSelectionRight() {
		if (this.selections.length == 0) {
			return;
		}
		var nselect = this._getOffsetSelection(1);
		this._replaceSelection(nselect);
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

	_replaceSelection(nselector) {
		var artifact = SmoSelection.noteSelection(this.score, nselector.staff, nselector.measure, nselector.voice, nselector.tick);
		this.score.setActiveStaff(nselector.staff);
		var mapped = this.objects.find((el) => {
				return SmoSelector.sameNote(el.selector, artifact.selector);
			});
		if (!mapped) {
			return;
		}
		// If this is a new selection, remove pitch-specific and replace with note-specific
		if (!nselector['pitches'] || nselector.pitches.length==0) {
			this.pitchIndex = -1;
		}
		console.log('adding selection ' + mapped.note.id);

		this.selections = [mapped];
		this.highlightSelection();
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
	iterateMeasures(callback) {
		var set = [];
		this.selections.forEach((sel) => {
			var measure = SmoSelection.measureSelection(this.score, sel.selector.staff, sel.selector.measure).measure;
			var ix = measure.measureNumber.measureIndex;
			if (set.indexOf(ix) === -1) {
				set.push(ix);
				callback(measure);
			}
		});
	}
	
	_selectFromToInStaff(sel1,sel2) {
		this.selections=[];
		this.objects.forEach((obj) => {
			if (SmoSelector.gteq(obj.selector,sel1.selector) && SmoSelector.lteq(obj.selector,sel2.selector)) {
				this.selections.push(obj);
			}
		});
	}
	_addSelection(selection) {
		var ar=this.selections.filter((sel) => {
			return SmoSelector.neq(sel.selector,selection.selector);
		});
		ar.push(selection);
		this.selections=ar;
	}
	
	selectSuggestion(ev) {
		if (!this.suggestion['measure']) {
			return;
		}
		console.log('adding selection ' + this.suggestion.note.id);
		
		if (this.modifierSuggestion >= 0) {
			if (this['suggestFadeTimer']) {
			   clearTimeout(this.suggestFadeTimer);
    		}	
			this.modifierIndex = this.modifierSuggestion;
			this.modifierSuggestion = -1;
			console.log('ms -1');
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
				this.highlightSelection();
				return;
			}
		}
		
		if (ev.ctrlKey) {
			this._addSelection(this.suggestion);
			this.highlightSelection();
			return;
		}

		this.selections = [this.suggestion];
		this.score.setActiveStaff(this.selections[0].selector.staff);
		if (this.selections.length == 0)
			return;
		var first = this.selections[0];
		for (var i = 0; i < this.selections.length; ++i) {
			var selection = this.selections[i];
			this.highlightSelection();
		}
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
					console.log('ms -1');
					tracker.modifierSuggestion=-1;
				}
			}, 1000);
	}
	

    _setModifierAsSuggestion(bb,artifact) {
		
		this.modifierSuggestion = artifact.index;
		console.log('ms '+ artifact.index);

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
		console.log('ms -1');

		this.suggestion = artifact;
		this._drawRect(artifact.box, 'suggestion');
		this._setFadeTimer();
	}

	intersectingArtifact(bb) {
		var artifacts = svgHelpers.findIntersectingArtifact(bb,this.objects);
		// TODO: handle overlapping suggestions
		if (!artifacts.length) {
			var sel = svgHelpers.findIntersectingArtifact(bb,this.modifierTabs);
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

	_highlightPitchSelection(note, index) {
		this.eraseAllSelections();
		var noteDiv = $(this.renderElement).find('#' + note.renderId);
		var heads = noteDiv.find('.vf-notehead');
		if (!heads.length) {
			return;
		}
		var headEl = heads[index];
		var box = headEl.getBoundingClientRect();
		this._drawRect(box, 'staffModifier');
	}
	triggerSelection() {
		$('body').trigger('tracker-selection');
	}

	highlightSelection() {
		if (this.pitchIndex >= 0 && this.selections.length == 1 &&
			this.pitchIndex < this.selections[0].note.pitches.length) {
			this._highlightPitchSelection(this.selections[0].note, this.pitchIndex);
			return;
		}
		this.pitchIndex = -1;
		this.eraseAllSelections();
		if (this.selections.length === 1) {
			this._drawRect(this.selections[0].box, 'selection');			
			return;
		}
		var sorted = this.selections.sort((a, b) => a.box.y - b.box.y);
		var prevSel = sorted[0];
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
			prevSel = sel;
		}
		boxes.push(curBox);
		this._drawRect(boxes, 'selection');
	}
	_outerSelection() {
		if (this.selections.length == 0)
			return null;
		var rv = this.selections[0].box;
		for (var i = 1; i < this.selections.length; ++i) {
			rv = suiTracker.unionRect(rv, this.selections[i].box);
		}
		return rv;
	}
	_drawRect(bb, stroke) {
		this.eraseRect(stroke);
		var grp = this.context.openGroup(stroke, stroke + '-');
		if (!Array.isArray(bb)) {
			bb = [bb];
		}
		bb.forEach((box) => {
			var strokes = suiTracker.strokes[stroke];
			var strokeObj = {};
			var margin = 5;
			$(Object.keys(strokes)).each(function (ix, key) {
				strokeObj[key] = strokes[key];
			});
			box = svgHelpers.clientToLogical(this.context.svg, box);
			this.context.rect(box.x - margin, box.y - margin, box.width + margin * 2, box.height + margin * 2, strokeObj);
		});
		this.context.closeGroup(grp);
	}
}
;
// ## suiSimpleLayout
// ## Description:
// A layout maps the measures and notes to a spot on the page.  It
// manages the flow of music as an ordinary score.  We call it simple layout, because
// there may be other layouts for parts view, or output to other media.
class suiSimpleLayout {
	constructor(params) {
		Vex.Merge(this, suiSimpleLayout.defaults);
		Vex.Merge(this, params);
		
		this.setViewport(true);

		this.attrs = {
			id: VF.Element.newID(),
			type: 'testLayout'
		};
	}

	setViewport(reset) {
		this.screenWidth = window.innerWidth;
		var layout = this.score.layout;
		var zoomScale = layout.zoomMode === SmoScore.zoomModes.zoomScale ?
			layout.zoomScale : (window.innerWidth - 200) / layout.pageWidth;

		this.svgScale = layout.svgScale * zoomScale;
		this.pageWidth = Math.round(layout.pageWidth * zoomScale);
		this.pageHeight = Math.round(layout.pageHeight * zoomScale);
		this.leftMargin=this.score.layout.leftMargin;
        this.rightMargin = this.score.layout.rightMargin;
		$(this.elementId).css('width', '' + Math.round(this.pageWidth) + 'px');
		$(this.elementId).css('height', '' + Math.round(this.pageHeight) + 'px');
		if (reset) {
		    $(this.elementId).html('');
    		this.renderer = new VF.Renderer(this.elementId, VF.Renderer.Backends.SVG);
		}
		// this.renderer.resize(this.pageWidth, this.pageHeight);

		svgHelpers.svgViewport(this.context.svg, this.pageWidth, this.pageHeight, this.svgScale);

		this.context.setFont(this.font.typeface, this.font.pointSize, "").setBackgroundFillStyle(this.font.fillStyle);
		var self = this;
		this.resizing = false;

	}

	// ### createScoreLayout
	// ### Description;
	// to get the score to appear, a div and a score object are required.  The layout takes care of creating the
	// svg element in the dom and interacting with the vex library.
	static createScoreLayout(renderElement, score, layoutParams) {
		var ctorObj = {
			elementId: renderElement,
			score: score
		};
		if (layoutParams) {
			Vex.Merge(ctorObj, layoutParams);
		}
		var layout = new suiSimpleLayout(ctorObj);
		return layout;
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
		suiSimpleLayout['_debugLayout'] = suiSimpleLayout['_debugLayout'] ? suiSimpleLayout._debugLayout : false
			return suiSimpleLayout._debugLayout;
	}

	static set debugLayout(value) {
		suiSimpleLayout._debugLayout = value;
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

	renderAndAdvance() {
		this.render();
	}
	// ### render
	// ### Description:
	// Render the current score in the div using VEX.  Rendering is actually done twice:
	// 1. Rendering is done just to the changed parts of the score.  THe first time, the whole score is rendered.
	// 2. Widths and heights are adjusted for elements that may have overlapped or exceeded their expected boundary.
	// 3. The whole score is rendered a second time with the new values.
	render() {
		const promise = new Promise((resolve, reject) => {
				this._render();
				resolve();
			});

		return promise;
	}
	redraw() {
		const promise = new Promise((resolve, reject) => {
				this._redraw();
				resolve();
			});

		return promise;
	}


	// ### undo
	// ### Description:
	// Undo is handled by the layout, because the layout has to first delete areas of the div that may have changed
	// , then create the modified score, then render the 'new' score.
	undo(undoBuffer) {
		var buffer = undoBuffer.peek();
		// Unrender the modified music because the IDs may change and normal unrender won't work
		if (buffer) {
			var sel = buffer.selector;
			if (buffer.type == 'measure') {
				this.unrenderMeasure(SmoSelection.measureSelection(this.score, sel.staff, sel.measure).measure);
			} else if (buffer.type === 'staff') {
				this.unrenderStaff(SmoSelection.measureSelection(this.score, sel.staff, 0).staff);
			} else {
				this.unrenderAll();
			}
			this.score = undoBuffer.undo(this.score);
			this.render();
		}
	}

	// ### renderNoteModifierPreview
	// ### Description:
	// For dialogs that allow you to manually modify elements that are automatically rendered, we allow a preview so the
	// changes can be undone before the buffer closes.
	renderNoteModifierPreview(modifier) {
		var selection = SmoSelection.noteSelection(this.score, modifier.selector.staff, modifier.selector.measure, modifier.selector.voice, modifier.selector.tick);
		if (!selection.measure.renderedBox) {
			return;
		}
		var system = new VxSystem(this.context, selection.measure.staffY, selection.measure.lineIndex);
		system.renderMeasure(selection.selector.staff, selection.measure);
	}
	
	// ### renderStaffModifierPreview
	// ### Description:
	// Similar to renderNoteModifierPreview, but lets you preveiw a change to a staff element.
	// re-render a modifier for preview during modifier dialog
	renderStaffModifierPreview(modifier) {
		// get the first measure the modifier touches
		var startSelection = SmoSelection.measureSelection(this.score, modifier.startSelector.staff, modifier.startSelector.measure);

		// We can only render if we already have, or we don't know where things go.
		if (!startSelection.measure.renderedBox) {
			return;
		}
		var system = new VxSystem(this.context, startSelection.measure.staffY, startSelection.measure.lineIndex);
		while (startSelection && startSelection.selector.measure <= modifier.endSelector.measure) {
			smoBeamerFactory.applyBeams(startSelection.measure);
			system.renderMeasure(startSelection.selector.staff, startSelection.measure);
			var nextSelection = SmoSelection.measureSelection(this.score, startSelection.selector.staff, startSelection.selector.measure + 1);

			// If we go to new line, render this line part, then advance because the modifier is split
			if (nextSelection && nextSelection.measure && nextSelection.measure.lineIndex != startSelection.measure.lineIndex) {
				this._renderModifiers(startSelection.staff, system);
				var system = new VxSystem(this.context, startSelection.measure.staffY, startSelection.measure.lineIndex);
			}
			startSelection = nextSelection;
		}
		this._renderModifiers(startSelection.staff, system);
	}

	_spaceNotes(smoMeasure) {
		var g = this.context.svg.getElementById(smoMeasure.attrs.id);
		var notes = Array.from(g.getElementsByClassName('vf-stavenote'));
		var acc = 0;
		for (var i = 1; i < notes.length; ++i) {
			var b1 = notes[i - 1].getBBox();
			var b2 = notes[i].getBBox();
			var dif = b2.x - (b1.x + b1.width);
			if (dif < 10) {
				acc += 10 - dif;
			}
		}
		smoMeasure.logicalBox.width += acc;
	}

	// ### justifyWidths
	// After we adjust widths so each staff has enough room, evenly distribute the remainder widths to the measures.
	justifyWidths() {
		var svg = this.context.svg;
		if (suiSimpleLayout.debugLayout) {
			$(this.context.svg).find('g.measure-adjust-dbg').remove();
		}
		var topStaff = this.score.staves[0];
		var maxLine = topStaff.measures[topStaff.measures.length - 1].lineIndex - 1;
		for (var i = 0; i <= maxLine; ++i) {
			var systemIndex = 0;

			this.score.staves.forEach((staff) => {
				var measures = staff.measures.filter((mm) => {
						return mm.lineIndex === i
					});
				if (measures.length > 0) {
					var width = measures.map((mm) => {
							return mm.staffWidth;
						}).reduce((a, b) => {
							return a + b
						});
					width += measures[0].staffX + this.score.layout.leftMargin;
					var just = Math.round(((this.pageMarginWidth / this.svgScale) - width) / measures.length) - 1;
					if (just > 0) {
						var accum = 0;
						measures.forEach((mm) => {
							mm.staffWidth += just;
							mm.staffX += accum;
							accum += just;
							if (suiSimpleLayout.debugLayout) {
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
	adjustWidths() {
		var topStaff = this.score.staves[0];
		var maxLine = topStaff.measures[topStaff.measures.length - 1].lineIndex;
		var svg = this.context.svg;
		if (suiSimpleLayout.debugLayout) {
			$(this.renderer.getContext().svg).find('g.measure-adjust-dbg').remove();
		}

		for (var i = 0; i <= maxLine; ++i) {
			var systemIndex = 0;
			while (true) {
				var measures = [];
				this.score.staves.forEach((staff) => {
					var ix = staff.measures.findIndex((x) => {
							return x.lineIndex === i && x.measureNumber.systemIndex === systemIndex;
						});
					if (ix >= 0) {
						measures.push(staff.measures[ix]);
					}
				});
				// Make sure each note head is not squishing
				measures.forEach((mm) => {this._spaceNotes(mm);});

				if (measures.length) {
					var widest = measures.map((x) => {
							return x.logicalBox.width;
						}).reduce((a, w) => {
							return a > w ? a : w;
						});
					measures.forEach((measure) => {
						measure.staffWidth = widest;
						measure.changed = true;
					});
				}
				if (!measures.length)
					break;
				systemIndex += 1;
			}
		}

		this.score.staves.forEach((staff) => {
			var last = null;
			staff.measures.forEach((measure) => {
				if (last && measure.measureNumber.systemIndex > 0) {
					measure.staffX = last.staffX + last.staffWidth;
				}
				if (suiSimpleLayout.debugLayout) {
					var dbgBox = svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, measure.logicalBox.height);
					svgHelpers.debugBox(svg, dbgBox, 'measure-adjust-dbg', 10);
				}
				last = measure;
			});
		});

	}

	estimateMusicWidth(smoMeasure) {
		var width = 0;
		var tm = smoMeasure.tickmap();
		smoMeasure.voices.forEach((voice) => {
			var tickIndex = 0;
			voice.notes.forEach((note) => {
				width += vexGlyph.dimensions.noteHead.width + vexGlyph.dimensions.noteHead.spacingRight;
				width += vexGlyph.dimensions.dot.width * note.dots + vexGlyph.dimensions.dot.spacingRight * note.dots;
				note.pitches.forEach((pitch) => {
					var declared = tm.getActiveAccidental(pitch, tickIndex, smoMeasure.keySignature);

					if (pitch.accidental != declared || pitch.cautionary) {
						width += vexGlyph.accidental(pitch.accidental).width;
					}
				});
				tickIndex += 1;
			});
		});
		return width;
	}

	estimateStartSymbolWidth(smoMeasure) {
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
			width += vexGlyph.dimensions.timeSignature.width + vexGlyph.dimensions.timeSignature.spacingRight;
		}
		var starts = smoMeasure.getStartBarline();
		if (starts) {
			width += vexGlyph.barWidth(starts);
		}
		return width;
	}
	
	estimateEndSymbolWidth(smoMeasure) {
		var width = 0;
		var ends  = smoMeasure.getEndBarline();
		if (ends) {
			width += vexGlyph.barWidth(ends);
		}
		return width;
	}
	
	_minMaxYModifier(staff,minY,maxY) {
		staff.modifiers.forEach((modifier) => {
			minY = modifier.logicalBox.y < minY ? modifier.logicalBox.y : minY;
			var max = modifier.logicalBox.y + modifier.logicalBox.height;
			maxY = max > maxY ? max : maxY;	 
			});

		return {minY:minY,maxY:maxY};
	}

	// ### adjustHeight
	// Handle measure bumping into each other, vertically.
	adjustHeight() {
		var topStaff = this.score.staves[0];
		var maxLine = topStaff.measures[topStaff.measures.length - 1].lineIndex;
		var svg = this.context.svg;
		// array of the max Y measure per line, used to space next line down
		var maxYPerLine = [];
		var lineIndexPerLine = [];

		if (suiSimpleLayout.debugLayout) {
			$(this.renderer.getContext().svg).find('g.measure-adjust-dbg').remove();
		}
		var accum = 0;
		for (var i = 0; i <= maxLine; ++i) {
			for (var j = 0; j < this.score.staves.length; ++j) {
				var absLine = this.score.staves.length * i + j;
				var staff = this.score.staves[j];
				var measures = staff.measures.filter((mm) => {
						return mm.lineIndex === i
					});

				if (measures.length === 0) {
					continue;
				}

				// maxYMeasure is measure on this line with y closest to bottom of page (maxYMeasure y point)
				var maxYMeasure = measures.reduce((a, b) => {
						if (a.logicalBox.y + a.logicalBox.height >
							b.logicalBox.y + b.logicalBox.height) {
							return a;
						}
						return b;
					});
				// minYMeasure is measure on this line with y closest to top of the page
				var minYMeasure = measures.reduce((a, b) => {
						return a.logicalBox.y < b.logicalBox.y ? a : b;
					});
					
				var minYRenderedY = minYMeasure.logicalBox.y;
				var minYStaffY = minYMeasure.staffY;
				
				var thisLineMaxY = maxYMeasure.logicalBox.y + maxYMeasure.logicalBox.height;
				
				var modAdj = this._minMaxYModifier(staff,minYRenderedY,thisLineMaxY);
				minYRenderedY=modAdj.minY;
				thisLineMaxY=modAdj.maxY;

				maxYPerLine.push(thisLineMaxY);
				lineIndexPerLine.push(maxYMeasure.lineIndex);

				if (absLine == 0) {
					accum = this.score.layout.topMargin - minYRenderedY;					
					var staffY = minYStaffY+ accum;					
					measures.forEach((measure) => {
						measure.staffY = staffY;
						if (suiSimpleLayout.debugLayout) {
							var dbgBox = svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, measure.logicalBox.height);
							svgHelpers.debugBox(svg, dbgBox, 'measure-adjust-dbg', 10);
						}
					});
				} else {
					var my = maxYPerLine[absLine - 1]  + this.score.layout.intraGap;
					var delta = my - minYRenderedY;
					if (lineIndexPerLine[absLine - 1] < minYMeasure.lineIndex) {
						delta += this.score.layout.interGap;
					}
					accum += delta;
					var staffY = minYStaffY + accum;					
					measures.forEach((measure) => {
						var ll = measures.logicalBox;
						measure.staffY = staffY;
						if (suiSimpleLayout.debugLayout) {
							var dbgBox = svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, measure.logicalBox.height);
							svgHelpers.debugBox(svg, dbgBox, 'measure-adjust-dbg', 10);
						}
					});
				}
			}
		}
	}

	// ### unrenderMeasure
	// ### Description:
	// All SVG elements are associated with a logical SMO element.  We need to erase any SVG element before we change a SMO
	// element in such a way that some of the logical elements go away (e.g. when deleting a measure).
	unrenderMeasure(measure) {
		if (!measure)
			return;

		$(this.renderer.getContext().svg).find('g.' + measure.attrs.id).remove();
		measure.staffX = SmoMeasure.defaults.staffX;
		measure.staffY = SmoMeasure.defaults.staffY;
		measure.staffWidth = SmoMeasure.defaults.staffWidth;
		measure.adjY = 0;
		measure.changed = true;
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

	// ### unrenderAll
	// ### Description:
	// Delete all the svg elements associated with the score.
	unrenderAll() {
		this.score.staves.forEach((staff) => {
			this.unrenderStaff(staff);
		});
		$(this.renderer.getContext().svg).find('g.lineBracket').remove();
	}
	get pageMarginWidth() {
		return this.pageWidth - this.rightMargin * 2;
	}
	_previousAttr(i, j, attr) {
		var staff = this.score.staves[j];
		var measure = staff.measures[i];
		return (i > 0 ? staff.measures[i - 1][attr] : measure[attr]);
	}

	// ### _renderModifiers
	// ### Description:
	// Render staff modifiers (modifiers straddle more than one measure, like a slur).  Handle cases where the destination
	// is on a different system due to wrapping.
	_renderModifiers(staff, system) {
		var svg = this.context.svg;
		staff.modifiers.forEach((modifier) => {
			var startNote = SmoSelection.noteSelection(this.score,
					modifier.startSelector.staff, modifier.startSelector.measure, modifier.startSelector.voice, modifier.startSelector.tick);
			var endNote = SmoSelection.noteSelection(this.score,
					modifier.endSelector.staff, modifier.endSelector.measure, modifier.endSelector.voice, modifier.endSelector.tick);

			var vxStart = system.getVxNote(startNote.note);
			var vxEnd = system.getVxNote(endNote.note);

			// If the modifier goes to the next staff, draw what part of it we can on this staff.
			if (vxStart && !vxEnd) {
				var nextNote = SmoSelection.nextNoteSelection(this.score,
						modifier.startSelector.staff, modifier.startSelector.measure, modifier.startSelector.voice, modifier.startSelector.tick);
				var testNote = system.getVxNote(nextNote.note);
				while (testNote) {
					vxEnd = testNote;
					nextNote = SmoSelection.nextNoteSelection(this.score,
							nextNote.selector.staff, nextNote.selector.measure, nextNote.selector.voice, nextNote.selector.tick);
					testNote = system.getVxNote(nextNote.note);

				}
			}
			if (vxEnd && !vxStart) {
				var lastNote = SmoSelection.lastNoteSelection(this.score,
						modifier.endSelector.staff, modifier.endSelector.measure, modifier.endSelector.voice, modifier.endSelector.tick);
				var testNote = system.getVxNote(lastNote.note);
				while (testNote) {
					vxStart = testNote;
					lastNote = SmoSelection.lastNoteSelection(this.score,
							lastNote.selector.staff, lastNote.selector.measure, lastNote.selector.voice, lastNote.selector.tick);
					testNote = system.getVxNote(lastNote.note);
				}
			}

			if (!vxStart || !vxEnd)
				return;

			// TODO: notes may have changed, get closest if these exact endpoints don't exist
			modifier.renderedBox = system.renderModifier(modifier, vxStart, vxEnd);
			modifier.logicalBox = svgHelpers.clientToLogical(svg,modifier.renderedBox);

			// TODO: consider staff height with these.
			// TODO: handle dynamics split across systems.
		});
	}

	calculateBeginningSymbols(systemIndex, measure, clefLast, keySigLast, timeSigLast) {
		var measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
		measure.forceClef = (systemIndex === 0 || measure.clef !== clefLast);
		measure.forceTimeSignature = (systemIndex === 0 || measure.timeSignature !== timeSigLast);
		if (measureKeySig !== keySigLast) {
			measure.canceledKeySignature = keySigLast;
			measure.changed=true;
			measure.forceKeySignature = true;
		} else if (measure.measureNumber.measureIndex == 0 && measureKeySig != 'C') {
			measure.forceKeySignature = true;
		} else {
			measure.forceKeySignature = false;
		}
	}
	
	_redraw() {
		this.unrenderAll();
		this._render();
	}
	_render() {

		// layout a second time to adjust for issues.
		// this.adjustWidths();
		// this.adjustWidths();
		var params = {useY:false,useX:false};
		this.layout(params);
		for (var i=0;i<10;++i) {
			params.useX=true;
			console.log('adjust width '+i);
		    this.adjustWidths();
			this.layout(params);
			
			// If useX is still true, there was no wrapping and we
			// can stop
			if (params.useX) {
				break;
			}
			params.useX = true;
		}
		this.justifyWidths();
		this.adjustHeight();
		params.useY=true;
		this.layout(params);
	}

	// ### layout
	//  Render the music, keeping track of the bounding boxes of all the
	// elements.  Re-render a second time to adjust measure widths to prevent notes
	// from overlapping.  Then render all the modifiers.
	// * useAdjustedY is false if we are dynamically rendering the score, and we use other
	// measures to find our sweet spot.  If true, we assume the coordinates are correct and we use those.
	layout(params) {
		var useAdjustedY = params.useY;
		var useAdjustedX = params.useX;
		var svg = this.context.svg;

		if (suiSimpleLayout.debugLayout) {
			$(this.renderer.getContext().svg).find('g.measure-place-dbg').remove();
			$(this.renderer.getContext().svg).find('g.measure-render-dbg').remove();
			$(this.renderer.getContext().svg).find('g.measure-note-dbg').remove();
		}

		// bounding box of all artifacts on the page
		var pageBox = {};
		// bounding box of all artifacts in a system
		var systemBoxes = {};
		var staffBoxes = {};
		if (!this.score.staves.length) {
			return;
		}
		var topStaff = this.score.staves[0];
		var topStaffY = topStaff.staffY;
		if (!topStaff.measures.length) {
			return;
		}

		// Note: line index is index of this line on a page
		// System index is index of current measure from the left of the system
		var lineIndex = 0;
		var system = new VxSystem(this.context, topStaff.measures[0].staffY, lineIndex);
		var systemIndex = 0;

		for (var i = 0; i < topStaff.measures.length; ++i) {
			var staffWidth = 0;
			for (var j = 0; j < this.score.staves.length; ++j) {
				var staff = this.score.staves[j];
				var measure = staff.measures[i];

				measure.lineIndex = lineIndex;

				// The SVG X,Y of this staff.  Set it initially to the UL corner of page.  Width,height filled in later.
				var staffBox = svgHelpers.pointBox(this.score.layout.leftMargin, this.score.layout.topMargin);

				// The left-most measure sets the y for the row, top measure sets the x for the column.
				// Other measures get the x, y from previous measure on this row.  Once the music is rendered we will adjust
				// based on actual rendered dimensions.
				if (!staffBoxes[j]) {
					if (j == 0) {
						staffBoxes[j] = svgHelpers.copyBox(staffBox);
					} else {
						staffBoxes[j] = svgHelpers.pointBox(staffBoxes[j - 1].x, staffBoxes[j - 1].y + staffBoxes[j - 1].height + this.score.layout.intraGap);
					}
				}

				staffBox = staffBoxes[j];
				
				// If we are calculating the measures' location dynamically, always update the y
				if (!useAdjustedY && measure.changed) { // && systemIndex === 0) {
					measure.staffY = staffBox.y;
						if (isNaN(measure.staffY)) {
							throw ("nan measure ");
						}
				}

				if (!systemBoxes[lineIndex] || j > 0) {
					systemBoxes[lineIndex] = svgHelpers.copyBox(staffBox);
				}

				if (!pageBox['width']) {
					pageBox = svgHelpers.copyBox(staffBox);
				}
				var measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
				var keySigLast = smoMusic.vexKeySignatureTranspose(this._previousAttr(i, j, 'keySignature'), measure.transposeIndex);
				var timeSigLast = this._previousAttr(i, j, 'timeSignature');
				var clefLast = this._previousAttr(i, j, 'clef');

				this.calculateBeginningSymbols(systemIndex, measure, clefLast, keySigLast, timeSigLast);

				if (!useAdjustedX) {
    				measure.staffX = staffBox.x + staffBox.width;
	
                	// Calculate the existing staff width, based on the notes and what we expect to be rendered.
					measure.staffWidth = this.estimateMusicWidth(measure);
					measure.adjX = this.estimateStartSymbolWidth(measure);
					measure.adjRight = this.estimateEndSymbolWidth(measure);
					measure.staffWidth = measure.staffWidth  + measure.adjX + measure.adjRight;
				}

				// Do we need to start a new line?  Don't start a new line on the first measure in a line...
				if (j == 0 && systemIndex > 0 && staffBox.x + staffBox.width + measure.staffWidth
					 > this.pageMarginWidth / this.svgScale) {
					system.renderEndings();
					if (useAdjustedY) {
						system.cap();
					}
					// If we have wrapped at a place other than the wrap point, give up and 
					// start computing X again
					if (useAdjustedX && measure.measureNumber.systemIndex != 0) {
						useAdjustedX = params.useX = false;
    				}
					measure.staffX = this.score.layout.leftMargin;

					this.score.staves.forEach((stf) => {
						this._renderModifiers(stf, system);
					});
					if (!useAdjustedY && measure.changed) {
						measure.staffY = pageBox.y + pageBox.height + this.score.layout.interGap;
						if (isNaN(measure.staffY)) {
							throw ("nan measure ");
						}
					}
					staffBoxes = {};
					staffBoxes[j] = svgHelpers.boxPoints(this.score.layout.leftMargin, measure.staffY, 1, 1);
					lineIndex += 1;
					measure.lineIndex = lineIndex;
					system = new VxSystem(this.context, staff.staffY, lineIndex);
					systemIndex = 0;
					systemBoxes[lineIndex] = staffBoxes[j];

					// If we have wrapped lines, calculate the beginning stuff again.
					this.calculateBeginningSymbols(systemIndex, measure, clefLast, keySigLast, timeSigLast);
					if (!useAdjustedX) {
						measure.staffWidth = this.estimateMusicWidth(measure);
						measure.adjX = this.estimateStartSymbolWidth(measure);
						measure.adjRight = this.estimateEndSymbolWidth(measure);
						measure.staffWidth = measure.staffWidth + measure.adjX + measure.adjRight;
					}
				}

				
				// guess height of staff the first time
				measure.measureNumber.systemIndex = systemIndex;

				if (suiSimpleLayout.debugLayout) {
					svgHelpers.debugBox(
						svg, svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, 1), 'measure-place-dbg');
				}
				// WIP
				if (useAdjustedY || useAdjustedX || measure.changed) {
					smoBeamerFactory.applyBeams(measure);
					system.renderMeasure(j, measure);

					if (suiSimpleLayout.debugLayout) {
						svgHelpers.debugBox(svg, svgHelpers.clientToLogical(svg, measure.renderedBox), 'measure-render-dbg');
						measure.voices.forEach((voice) => {
							voice.notes.forEach((note) => {
								var noteEl = svg.getElementById(note.renderId);
								svgHelpers.debugBox(svg, noteEl.getBBox(), 'measure-note-dbg');
							});
						});
					}
					measure.changed = false;
				}
				// Rendered box is in client coordinates, convert it to SVG
				var logicalRenderedBox = measure.logicalBox;

				// Keep a running tally of the page, system, and staff dimensions as we draw.
				systemBoxes[lineIndex] = svgHelpers.unionRect(systemBoxes[lineIndex], logicalRenderedBox);

				// For x coordinate we adjust to the actual rendered size.  For Y, we want all staves at the same height
				// so we only consider the height of the first measure in the system
				if (systemIndex === 0) {
					staffBoxes[j] = svgHelpers.unionRect(staffBoxes[j], logicalRenderedBox);
				} else {
					staffBoxes[j].width = (logicalRenderedBox.x + logicalRenderedBox.width) - staffBoxes[j].x;
				}
				staffBoxes[j].y = measure.staffY;
				pageBox = svgHelpers.unionRect(pageBox, logicalRenderedBox);
			}
			++systemIndex;
		}
		system.renderEndings();
		this.score.staves.forEach((stf) => {
			this._renderModifiers(stf, system);
		});
		if (useAdjustedY) {
			system.cap();
		}
	}
}
;
class suiPiano {
	constructor(parameters) {
		this.elementId = parameters.elementId;
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
		$('body').toggleClass('show-piano');
		// handle resize work area.
		window.dispatchEvent(new Event('resize'));
	}
	_mapKeys() {
		this.objects = [];
		var keys = [].slice.call(this.renderElement.getElementsByClassName('piano-key'));
		keys.forEach((key) => {
			var rect = key.getBoundingClientRect();
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
		$(this.renderElement).off('mousemove').on('mousemove', function (ev) {
			var keyPressed = svgHelpers.findSmallestIntersection({
					x: ev.clientX,
					y: ev.clientY
				}, self.objects);
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
			window.dispatchEvent(new Event('resize'));
		});
	}
	_updateSelections(ev) {
		var keyPressed = svgHelpers.findSmallestIntersection({
				x: ev.clientX,
				y: ev.clientY
			}, this.objects);
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

class suiEditor {
    constructor(params) {
        Vex.Merge(this, params);
        this.slashMode = false;
    }

    // ## _render
    // utility function to render the music and update the tracker map.
    _render() {
        var self = this;
        var remap = function () {
            return self.tracker.updateMap();
        }
        this.layout.render().catch(function (e) {
            // make to non-promise exception format
            e.error = e;
            SuiExceptionHandler.instance.exceptionHandler(e);
        })
        .then(remap);
    }

    _renderAndAdvance() {
        var self = this;
        var remap = function () {
            return self.tracker.updateMap();
        }
        var mover = function () {
            return self.tracker.moveSelectionRight();
        }
        this.layout.render().then(remap).then(mover);
        // TODO: make this promise-based
    }
    _batchDurationOperation(operation) {
        SmoUndoable.batchDurationOperation(this.score, this.tracker.selections, operation, this.undoBuffer);
        this._render();
    }
	
	scoreSelectionOperation(selection,name,parameters,description) {
		SmoUndoable.scoreSelectionOp(this.score,selection,name,parameters,
			    this.undoBuffer,description);
		this._render();
				
	}
	scoreOperation(name,parameters,description) {
		SmoUndoable.scoreOp(this.score,name,parameters,this.undoBuffer,description);
		this._render();
	}

    _selectionOperation(selection, name, parameters) {
        if (parameters) {
            SmoUndoable[name](selection, parameters, this.undoBuffer);
        } else {
            SmoUndoable[name](selection, this.undoBuffer);
        }
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
        this._render();
    }

    _transpose(selection, offset) {
        this._selectionOperation(selection, 'transpose', offset);
    }

    copy() {
        if (this.tracker.selections.length < 1) {
            return;
        }
        this.pasteBuffer.setSelections(this.score, this.tracker.selections);
    }
    paste() {
        if (this.tracker.selections.length < 1) {
            return;
        }
        this.layout.unrenderAll();
        SmoUndoable.pasteBuffer(this.score, this.pasteBuffer, this.tracker.selections, this.undoBuffer, 'paste')
        this._render();
    }
    toggleBeamGroup() {
        if (this.tracker.selections.length < 1) {
            return;
        }
        SmoUndoable.toggleBeamGroups(this.tracker.selections, this.undoBuffer);
        this._render();
    }

    deleteMeasure() {
        if (this.tracker.selections.length < 1) {
            return;
        }
        var selection = this.tracker.selections[0];
        this.layout.unrenderAll();
        SmoUndoable.deleteMeasure(this.score, selection, this.undoBuffer);
        this.tracker.selections = [];
        this.tracker.clearModifierSelections();
        this._render();
    }

    collapseChord() {
        SmoUndoable.noop(this.score, this.undoBuffer);
        this.tracker.selections.forEach((selection) => {
            var p = selection.note.pitches[0];
            p = JSON.parse(JSON.stringify(p));
            selection.note.pitches = [p];
        });
        this._render();
    }

    intervalAdd(interval, direction) {
        this._singleSelectionOperation('interval', direction * interval);
    }

    interval(keyEvent) {
        if (this.tracker.selections.length != 1)
            return;
        // code='Digit3'
        var interval = parseInt(keyEvent.code[5]) - 1;
        this.intervalAdd(interval, keyEvent.shiftKey ? -1 : 1);
    }

    transpose(offset) {
        this.tracker.selections.forEach((selected) => this._transpose(selected, offset,false));
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
        this._singleSelectionOperation('makeRest');
    }

    _setPitch(selected, letter) {
        var selector = selected.selector;
        var hintSel = SmoSelection.lastNoteSelection(this.score,
                selector.staff, selector.measure, selector.voice, selector.tick);
        if (!hintSel) {
            hintSel = SmoSelection.nextNoteSelection(this.score,
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
        this._batchDurationOperation('doubleDuration');
    }

    halveDuration(keyEvent) {
        this._batchDurationOperation('halveDuration');
    }

    addMeasure(keyEvent) {
        if (this.tracker.selections.length < 1) {
            return;
        }
        var measure = this.tracker.getFirstMeasureOfSelection();
        if (measure) {
            var nmeasure = SmoMeasure.getDefaultMeasureWithNotes(measure);
            nmeasure.measureNumber.measureIndex = measure.measureNumber.measureIndex;
            SmoUndoable.addMeasure(this.score, measure.measureNumber.systemIndex, nmeasure, this.undoBuffer);
            this._render();
        }
    }
    toggleCourtesyAccidental() {
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
        SmoUndoable.noop(this.score, this.undoBuffer);
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

    toggleArticulationCommand(articulation, position) {
        this.undoBuffer.addBuffer('change articulation ' + articulation,
            'staff', this.tracker.selections[0].selector, this.tracker.selections[0].staff);

        this.tracker.selections.forEach((sel) => {
            var aa = new SmoArticulation({
                    articulation: articulation,
                    position: position
                });
            SmoOperation.toggleArticulation(sel, aa);
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
        var pos = keyEvent.shiftKey ? SmoArticulation.positions.below : SmoArticulation.positions.above;
        this.toggleArticulationCommand(atyp, pos);

    }
}
;
class suiMenuBase {
	constructor(params) {
		Vex.Merge(this, params);
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
	}

	static get defaults() {
		return {
			menuBind: suiMenuManager.menuKeyBindingDefaults,
			menuContainer: '.menuContainer'
		};
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
			}

		];
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
			.css('top', '' + this.menuPosition.y + 'px')
			.css('height', '' + this.menu.menuItems.length * 35 + 'px');
		this.menu.menuItems.forEach((item) => {
			r.append(
				b('li').classes('menuOption').append(
					b('button')
					.text(item.text).attr('data-value', item.value)
					.append(
						b('span').classes('icon icon-' + item.icon))));
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
					resolve();
				});

			});
		return this.closeMenuPromise;
	}

	createMenu(action) {
		this.menuPosition = this.tracker.selections[0].box;
		var ctor = eval(action);
		this.menu = new ctor({
				position: this.menuPosition,
				tracker: this.tracker,
				editor: this.editor,
				score: this.score
			});
		this.attach(this.menuContainer);
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
			this.menu.keydown(event);
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
					value: 'C'
				}, {
					icon: 'key-sig-f',
					text: 'F Major',
					value: 'F'
				}, {
					icon: 'key-sig-g',
					text: 'G Major',
					value: 'G'
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
			}

		} else if (op === 'cancel') {
			this.complete();
		}else {
			var instrument = SuiAddStaffMenu.instrumentMap[op];

			SmoUndoable.addStaff(this.score, instrument, this.editor.undoBuffer);
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
	}

	static createUi(score, title) {
		utController.createDom();
		if (title) {
			$('h1.testTitle').text(title);
		}
		var params = {};
		params.layout = suiSimpleLayout.createScoreLayout($('#boo')[0], score);
		params.tracker = new suiTracker(params.layout);
		// params.tracker = new suiTracker(params.layout);
		params.score = score;
		// params.editor = new suiEditor(params);
		// params.menus = new suiMenuManager(params);
		var keys = new utController(params);
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
		return this.layout.render();
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
		SuiExceptionHandler._instance = this;
    }
	static get instance() {
		return SuiExceptionHandler._instance;
	}
    exceptionHandler(e) {
        var self = this;
        if (suiController.reentry) {
            return;
        }
        suiController.reentry = true;
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
        } catch (e) {
            stack = 'Error with stack: ' + e.message;
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
};
class SuiDialogFactory {

	static createDialog(modSelection, context, tracker, layout) {
		var dbType = SuiDialogFactory.modifierDialogMap[modSelection.modifier.type];
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
			layout: layout
		});
	}
	static get modifierDialogMap() {
		return {
			SmoStaffHairpin: 'SuiHairpinAttributesDialog',
			SmoSlur: 'SuiSlurAttributesDialog',
			SmoDynamicText: 'SuiTextModifierDialog',
			SmoVolta: 'SuiVoltaAttributeDialog'
		};
	}
}

class SuiDialogBase {
	constructor(dialogElements, parameters) {
		this.id = parameters.id;
		this.components = [];
		this.closeDialogPromise = new Promise((resolve, reject) => {
				$('body').off('dialogDismiss').on('dialogDismiss', function () {
					resolve();
				});

			});
		this.dialogElements = dialogElements;
		this.dgDom = this._constructDialog(dialogElements, {
				id: 'dialog-' + this.id,
				top: parameters.top,
				left: parameters.left,
				label: parameters.label
			});
	}
	position(box) {
		var y = box.y + box.height;

		// TODO: adjust if db is clipped by the browser.
		$(this.dgDom.element).find('.attributeDialog').css('top', '' + y + 'px');
	}
	_constructDialog(dialogElements, parameters) {
		var id = parameters.id;
		var b = htmlHelpers.buildDom;
		var r = b('div').classes('attributeModal').css('top', parameters.top + 'px').css('left', parameters.left + 'px')
			.append(b('spanb').classes('draggable button').append(b('span').classes('icon icon-move')))
			.append(b('h2').text(parameters.label));
		dialogElements.forEach((de) => {
			var ctor = eval(de.control);
			var control = new ctor(this, de);
			this.components.push(control);
			r.append(control.html);
		});
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

	_commit() {
		this.modifier.restoreOriginal();
		this.components.forEach((component) => {
			this.modifier[component.smoName] = component.getValue();
		});
	}

	complete() {
		$('body').removeClass('showAttributeDialog');
		$('body').trigger('dialogDismiss');
		this.dgDom.trapper.close();
	}

	display() {
		$('body').addClass('showAttributeDialog');
		this.components.forEach((component) => {
			component.bind();
		});
		this._bindElements();
		this.position(this.modifier.renderedBox);

		var cb = function (x, y) {}
		htmlHelpers.draggable({
			parent: $(this.dgDom.element).find('.attributeModal'),
			handle: $(this.dgDom.element).find('.icon-move'),
			cb: cb,
			moveParent: true
		});
	}

	_bindElements() {
		var self = this;
		var dgDom = this.dgDom;

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

class SuiLayoutDialog extends SuiDialogBase {
	static get attributes() {
		return ['pageWidth', 'pageHeight', 'leftMargin', 'topMargin', 'rightMargin', 'interGap', 'intraGap', 'zoomScale', 'svgScale'];
	}
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
	backupOriginal() {
		this.backup = {};
		SuiLayoutDialog.attributes.forEach((attr) => {
			this.backup[attr] = this.modifier[attr];
		});
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
			cb: cb,
			moveParent: true
		});
		this.controller.unbindKeyboardForDialog(this);

	}
	_bindElements() {
		var self = this;
		var dgDom = this.dgDom;

		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
			self.layout.setViewport();
			var complete = function () {
				self.complete();
			}
			self.layout.render().then(complete);
		});

		$(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
			SuiLayoutDialog.attributes.forEach((attr) => {
				self.modifier[attr] = self.backup[attr];
			});
			self.layout.setViewport();
			var complete = function () {
				self.complete();
			}
			self.layout.redraw().then(complete);
		});

		$(dgDom.element).find('.remove-button').remove();
	}
	_setPageSizeDefault() {
		var value = 'custom';
		var scoreDims = this.score.layout;
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
	changed() {
		// this.modifier.backupOriginal();
		this._handlePageSizeChange();
		this.components.forEach((component) => {
			this.score.layout[component.smoName] = component.getValue();
		});
		this.layout.setViewport();
		this.layout.render();
	}
	static createAndDisplay(buttonElement, buttonData, controller) {
		var dg = new SuiLayoutDialog({
				score: controller.score,
				layout: controller.layout,
				controller: controller
			});
		dg.display();
	}
	constructor(parameters) {
		if (!(parameters.score && parameters.layout && parameters.controller)) {
			throw new Error('layout  dialog must have score');
		}
		var p = parameters;

		super(SuiLayoutDialog.dialogElements, {
			id: 'dialog-layout',
			top: (p.score.layout.pageWidth / 2) - 200,
			left: (p.score.layout.pageHeight / 2) - 200,
			label: 'Score Layout'
		});
		this.score = p.score;
		this.modifier = this.score.layout;
		this.layout = p.layout;
		this.controller = p.controller;
		this.backupOriginal();
	}
}

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
			label: 'Dynamics Properties'
		});
		Vex.Merge(this, parameters);
		this.components.find((x) => {
			return x.parameterName == 'text'
		}).defaultValue = parameters.modifier.text;
	}
	handleRemove() {
		$(this.context.svg).find('g.' + this.modifier.id).remove();
		this.selection.note.removeModifier(this.modifier);
		this.tracker.clearModifierSelections();
	}
	changed() {
		this.modifier.backupOriginal();
		this.components.forEach((component) => {
			this.modifier[component.smoName] = component.getValue();
		});
		this.layout.renderNoteModifierPreview(this.modifier);
	}
}

class helpModal {
	constructor() {}
	static createAndDisplay() {
		SmoHelp.displayHelp();
		return htmlHelpers.closeDialogPromise();
	}
}
;// # dbComponents - components of modal dialogs.

// ## SuiRockerComponent
// ## An integer input box with +- buttons.
class SuiRockerComponent {
	static get dataTypes() {
		return ['int','float','percent'];
	}
	static get increments() {
		return {'int':1,'float':0.1,percent:1}
	}
	static get parsers() {
		return {'int':'_getIntValue','float':'_getFloatValue','percent':'_getPercentValue'};
	}
    constructor(dialog, parameter) {
        smoMusic.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label','scale','type'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
		if (!this.type) {
			this.type='int';
		}
		if (SuiRockerComponent.dataTypes.indexOf(this.type) < 0) {
			throw new Error('dialog element invalid type '+this.type);
		}
		this.increment = SuiRockerComponent.increments[this.type];
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

    bind() {
        var dialog = this.dialog;
        var pid = this.parameterId;
        var input = this._getInputElement();
        this.setValue(this.defaultValue);
        var self = this;
        $('#' + pid).find('button.increment').off('click').on('click',
            function (ev) {
            var val = self[self.parser]();
            $(input).val(val + self.increment);
            dialog.changed();
        });
        $('#' + pid).find('button.decrement').off('click').on('click',
            function (ev) {
            var val = self[self.parser]();
            $(input).val(val - self.increment);
            dialog.changed();
        });
        $(input).off('blur').on('blur',
            function (ev) {
            dialog.changed();
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

class SuiToggleComponent {
    constructor(dialog, parameter) {
        smoMusic.filteredMerge(
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
            dialog.changed();
        });
    }
}

class SuiDropdownComponent {
    constructor(dialog, parameter) {
        smoMusic.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'options', 'control', 'label'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
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
        return $(option).val();
    }
    setValue(value) {
        var input = this._getInputElement();
        $(input).val(value);
    }

    bind() {
        var dialog = this.dialog;
        var pid = this.parameterId;
        var input = this._getInputElement();
        this.setValue(this.defaultValue);
        var self = this;
        $(input).off('change').on('change',
            function (ev) {
            dialog.changed();
        });
    }
}
;

class defaultRibbonLayout {

	static get ribbons() {
		var left = defaultRibbonLayout.leftRibbonIds;
		var top = defaultRibbonLayout.noteButtonIds.concat(defaultRibbonLayout.navigateButtonIds).concat(defaultRibbonLayout.articulateButtonIds)
		    .concat(defaultRibbonLayout.intervalIds).concat(defaultRibbonLayout.durationIds).concat(defaultRibbonLayout.measureIds);
			
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
			defaultRibbonLayout.chordButtons).concat(
			defaultRibbonLayout.durationRibbonButtons).concat(
			defaultRibbonLayout.measureRibbonButtons);
	}
	
	static get leftRibbonIds() {
		return ['helpDialog', 'addStaffMenu', 'dynamicsMenu', 'keyMenu', 'staffModifierMenu', 'staffModifierMenu2','pianoModal','layoutModal'];
	}
	static get noteButtonIds() {
		return ['NoteButtons', 'ANoteButton', 'BNoteButton', 'CNoteButton', 'DNoteButton', 'ENoteButton', 'FNoteButton', 'GNoteButton','ToggleRestButton',
				'UpNoteButton', 'DownNoteButton', 'UpOctaveButton', 'DownOctaveButton', 'ToggleRest','ToggleAccidental', 'ToggleCourtesy'];
	}	
	static get navigateButtonIds()  {
		return ['NavigationButtons', 'navLeftButton', 'navRightButton', 'navUpButton', 'navDownButton', 'navFastForward', 'navRewind',
				'navGrowLeft', 'navGrowRight'];
	}
	
	static get articulateButtonIds()  {
		return ['articulationButtons', 'accentAboveButton', 'accentBelowButton', 'tenutoAboveButton', 'tenutoBelowButton',
				'staccatoAboveButton', 'staccatoBelowButton', 'marcatoAboveButton', 'marcatoBelowButton', 'pizzicatoAboveButton', 'pizzicatoBelowButton'];
	}
	
	static get intervalIds()  {
		return ['CreateChordButtons', 'SecondUpButton', 'SecondDownButton', 'ThirdUpButton', 'ThirdDownButton', 'FourthUpButton', 'FourthDownButton',
				'FifthUpButton', 'FifthDownButton','SixthUpButton', 'SixthDownButton'
				,'SeventhUpButton', 'SeventhDownButton','OctaveUpButton','OctaveDownButton','CollapseChordButton'];
	}
	static get durationIds() {
		return ['DurationButtons','GrowDuration','LessDuration','GrowDurationDot','LessDurationDot','TripletButton','QuintupletButton','SeptupletButton','NoTupletButton'];
	}
	static get measureIds() {
		return ['MeasureButtons','endRepeat','startRepeat','endBar','doubleBar','singleBarEnd','singleBarStart','nthEnding','dcAlCoda','dsAlCoda','dcAlFine','dsAlFine','coda','toCoda','segno','toSegno','fine'];
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
			}, {
				leftText: '8va',
				rightText: 'Shift=',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'UpOctaveButton'
			}, {
				leftText: '8vb',
				rightText: 'Shift-',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'DownOctaveButton'
			}, {
				leftText: '',
				rightText: 'ShiftE',
				icon: 'icon-accident',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'ToggleAccidental'
			}, {
				leftText: '',
				rightText: 'ShiftF',
				icon: 'icon-courtesy',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'ToggleCourtesy'
			}

		];
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
				id: 'accentAboveButton'
			}, {
				leftText: '',
				rightText: 'H',
				icon: 'icon-accent_below',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'accentBelowButton'
			}, {
				leftText: '',
				rightText: 'i',
				icon: 'icon-tenuto_above',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'tenutoAboveButton'
			}, {
				leftText: '',
				rightText: 'I',
				icon: 'icon-tenuto_below',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'tenutoBelowButton'
			}, {
				leftText: '',
				rightText: 'j',
				icon: 'icon-staccato_above',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'staccatoAboveButton'
			}, {
				leftText: '',
				rightText: 'J',
				icon: 'icon-staccato_below',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'staccatoBelowButton'
			}, {
				leftText: '',
				rightText: 'k',
				icon: 'icon-marcato_above',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'marcatoAboveButton'
			}, {
				leftText: '',
				rightText: 'K',
				icon: 'icon-marcato_below',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'marcatoBelowButton'
			}, {
				leftText: '',
				rightText: 'l',
				icon: 'icon-pitz_above',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'pizzicatoAboveButton'
			}, {
				leftText: '',
				rightText: 'L',
				icon: 'icon-pitz_below',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'pizzicatoBelowButton'
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
				leftText: '',
				rightText: '',
				icon: 'icon-fforward',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navFastForward'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-rewind',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navRewind'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-note_select_left',
				classes: 'collapsed selection-icon',
				action: 'collapseChild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navGrowLeft'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-note_select_right',
				classes: 'collapsed selection-icon',
				action: 'collapseChild',
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
				leftText: 'Staves',
				rightText: '/s',
				icon: '',
				classes: 'staff-modify',
				action: 'menu',
				ctor: 'SuiAddStaffMenu',
				group: 'scoreEdit',
				id: 'addStaffMenu'
			}, {
				leftText: 'Dynamics',
				rightText: '/d',
				icon: '',
				classes: 'note-modify',
				action: 'menu',
				ctor: 'SuiDynamicsMenu',
				group: 'scoreEdit',
				id: 'dynamicsMenu'
			}, {
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
				spacingRight:10
			},
			endBar: {
				width:5.22,
				height:40.99,
				spacingRight:10
			},			
			doubleBar: {
				width:3.22,
				height:40.99,
				spacingRight:0
			},
			endRepeat: {
				width:6,
				height:40.99,
				spacingRight:0,
			},
			startRepeat: {
				width:6,
				height:40.99,
				spacingRight:5,
			},
			noteHead: {
				width:12.02,
				height:10.48,
				spacingRight:15,
			},
			dot: {
				width:5,
				height:5,
				spacingRight:2
			},
			trebleClef: {
				width: 25.5,
				height: 68.32,
				spacingRight: 10,
			},
			bassClef: {
				width: 32.32,
				height: 31.88,
				spacingRight: 5,
			},
			altoClef: {
				width: 31.5,
				height: 85.5,
				spacingRight: 10
			},
			tenorClef: {
				width: 31.5,
				height: 41,
				spacingRight: 10
			},
			timeSignature: {
				width: 13.48,
				height: 85,
				spacingRight: 5
			},
			flat: {
				width: 7.44,
				height: 23.55,
				spacingRight: 2
			},
			keySignature: {
				width: 0,
				height: 85.5,
				spacingRight: 10
			},
			sharp: {
				width: 8.84,
				height: 62,
				spacingRight: 2
			},
			natural: {
				width: 6.54,
				height: 53.35,
				spacingRight: 2
			},
			doubleSharp: {
				height: 10.04,
				width: 21.63,
				spacingRight: 2
			},
			doubleFlat: {
				width: 13.79,
				height: 49.65,
				spacingRight:2
			}
		};
	}
}
;

// ## RibbonButtons
// Render the ribbon buttons based on group, function, and underlying UI handler.
// Also handles UI events.
// ## RibbonButton methods
// ---
class RibbonButtons {
	static get paramArray() {
		return ['ribbonButtons', 'ribbons', 'editor', 'controller', 'tracker', 'menus'];
	}
	static ribbonButton(buttonId, buttonClass, buttonText, buttonIcon, buttonKey) {
		var b = htmlHelpers.buildDom;
		var r = b('div').classes('ribbonButtonContainer').append(b('button').attr('id', buttonId).classes(buttonClass).append(
					b('span').classes('left-text').append(
					    b('span').classes('text-span').text(buttonText)).append(
					b('span').classes('ribbon-button-text icon ' + buttonIcon))).append(
					b('span').classes('ribbon-button-hotkey').text(buttonKey)));
		return r.dom();
	}
	constructor(parameters) {
		smoMusic.filteredMerge(RibbonButtons.paramArray, parameters, this);
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
		this.controller.detach();
		var rebind = function () {
			self._rebindController();
		}
		this.menuPromise = this.menus.slashMenuMode().then(rebind);
		this.menus.createMenu(buttonData.ctor);
	}
	_bindCollapsibleAction(buttonElement, buttonData) {
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

	_rebindController() {
		this.controller.render();
		this.controller.bindEvents();
	}
	_executeButton(buttonElement, buttonData) {
		if (buttonData.action === 'modal') {
			this._executeButtonModal(buttonElement, buttonData);
			return;
		}
		if (buttonData.action === 'menu') {
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
	_createButtonHtml(buttonAr, selector) {
		buttonAr.forEach((buttonId) => {
			var b = this.ribbonButtons.find((e) => {
					return e.id === buttonId;
				});
			if (b) {
				if (b.action === 'collapseChild') {
					this.collapseChildren.push(b);
				} else {

					var buttonHtml = RibbonButtons.ribbonButton(b.id, b.classes, b.leftText, b.icon, b.rightText);
					$(buttonHtml).attr('data-group', b.group);

					$(selector).append(buttonHtml);
					var el = $(selector).find('#' + b.id);
					this._bindButton(el, b);
					if (b.action == 'collapseParent') {
						$(buttonHtml).addClass('collapseContainer');
						this._bindCollapsibleAction(el, b);
					}
				}
			}
		});
		this.collapseChildren.forEach((b) => {
			var buttonHtml = RibbonButtons.ribbonButton(b.id, b.classes, b.leftText, b.icon, b.rightText);
			if (b.dataElements) {
				var bkeys = Object.keys(b.dataElements);
				bkeys.forEach((bkey) => {
					var de = b.dataElements[bkey];
					$(buttonHtml).find('button').attr('data-' + bkey, de);
				});
			}
			var parent = $(selector).find('.collapseContainer[data-group="' + b.group + '"]');
			$(parent).append(buttonHtml);
			var el = $(selector).find('#' + b.id);
			this._bindButton(el, b);
		});
		this.collapsables.forEach((cb) => {
			cb.bind();
		});
	}
	display() {
		$('body .controls-left').html('');
		$('body .controls-top').html('');

		var buttonAr = this.ribbons['left'];
		this._createButtonHtml(buttonAr, 'body .controls-left');

		buttonAr = this.ribbons['top'];
		this._createButtonHtml(buttonAr, 'body .controls-top');
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
			}
			 console.log('couch');
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
			accentAboveButton: SmoArticulation.articulations.accent,
			accentBelowButton: SmoArticulation.articulations.accent,
			tenutoAboveButton: SmoArticulation.articulations.tenuto,
			tenutoBelowButton: SmoArticulation.articulations.tenuto,
			staccatoAboveButton: SmoArticulation.articulations.staccato,
			staccatoBelowButton: SmoArticulation.articulations.staccato,
			marcatoAboveButton: SmoArticulation.articulations.marcato,
			marcatoBelowButton: SmoArticulation.articulations.marcato,
			pizzicatoAboveButton: SmoArticulation.articulations.pizzicato,
			pizzicatoBelowButton: SmoArticulation.articulations.pizzicato,
			fermataAboveButton: SmoArticulation.articulations.fermata,
			fermataBelowButton: SmoArticulation.articulations.fermata
		};
	}
	static get placementIdMap() {
		return {
			accentAboveButton: SmoArticulation.positions.above,
			accentBelowButton: SmoArticulation.positions.below,
			tenutoAboveButton: SmoArticulation.positions.above,
			tenutoBelowButton: SmoArticulation.positions.below,
			staccatoAboveButton: SmoArticulation.positions.above,
			staccatoBelowButton: SmoArticulation.positions.below,
			marcatoAboveButton: SmoArticulation.positions.above,
			marcatoBelowButton: SmoArticulation.positions.below,
			pizzicatoAboveButton: SmoArticulation.positions.above,
			pizzicatoBelowButton: SmoArticulation.positions.below,
			fermataAboveButton: SmoArticulation.positions.above,
			fermataBelowButton: SmoArticulation.positions.below
		};
	}
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
		this.articulation = ArticulationButtons.articulationIdMap[this.buttonData.id];
		this.placement = ArticulationButtons.placementIdMap[this.buttonData.id];
	}
	_toggleArticulation() {
		this.showState = !this.showState;

		this.editor.toggleArticulationCommand(this.articulation, this.placement);
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
		smoMusic.filteredMerge(CollapseRibbonControl.paramArray, parameters, this);
		this.childButtons = parameters.ribbonButtons.filter((cb) => {
				return cb.group === this.buttonData.group && cb.action === 'collapseChild';
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
		this.controller.resizeEvent();
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
			btn.bind();
		});
	}
}
;class SuiStaffModifierDialog extends SuiDialogBase {
	 handleRemove() {
        $(this.context.svg).find('g.' + this.modifier.id).remove();
        this.selection.staff.removeStaffModifier(this.modifier);
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
            id: 'dialog-' + parameters.modifier.id,
            top: parameters.modifier.renderedBox.y,
            left: parameters.modifier.renderedBox.x,
            label: 'Slur Properties'
        });
        Vex.Merge(this, parameters);
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
		this.layout.score.staves.forEach((staff) => {
			staff.measures.forEach((measure) => {
				if (measure.measureNumber.measureNumber === this.modifier.startBar) {
					measure.removeNthEnding(this.modifier.number);
				}
			});
		});
        $(this.context.svg).find('g.' + this.modifier.endingId).remove();
        this.selection.staff.removeStaffModifier(this.modifier);
        this.tracker.clearModifierSelections();
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
            id: 'dialog-' + parameters.modifier.id,
            top: parameters.modifier.renderedBox.y,
            left: parameters.modifier.renderedBox.x,
            label: 'Hairpin Properties'
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
            id: 'dialog-' + parameters.modifier.id,
            top: parameters.modifier.renderedBox.y,
            left: parameters.modifier.renderedBox.x,
            label: 'Hairpin Properties'
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
        var r = b('div').classes('menu-status').append(
                b('div').attr('id', 'globMode').text('Next Key Chooses Menu')).append(
                b('div').classes('mode-subtitle').append(SmoHelp.shortMenuHelpHtml));
        $('body .controls-left').html('');
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
		this.undoBuffer = new UndoBuffer();
		this.pasteBuffer = this.tracker.pasteBuffer;
		this.editor.undoBuffer = this.undoBuffer;
		this.editor.pasteBuffer = this.pasteBuffer;
		this.resizing = false;
		this.undoStatus=0;

		this.ribbon = new RibbonButtons({
				ribbons: defaultRibbonLayout.ribbons,
				ribbonButtons: defaultRibbonLayout.ribbonButtons,
				menus: this.menus,
				editor: this.editor,
				tracker: this.tracker,
				score: this.score,
				controller: this
			});

		// create globbal exception instance
		this.exhandler = new SuiExceptionHandler(this);

		this.bindEvents();
		this.bindResize();
		if (!suiSimpleLayout.debugLayout) {
			this.splash();
		    this.pollRedraw();
		}

		this.piano();
		this.updateOffsets();
	}
	
	// ### pollIdleRedraw
	// redraw after the user has been idle for some period
	pollIdleRedraw() {
		var self=this;
		setTimeout(function() {
			if (self.undoStatus == self.undoBuffer.opCount) {				
				self.resizeEvent();
				self.pollRedraw();
				return;
			}
			self.undoStatus = self.undoBuffer.opCount;
			self.pollIdleRedraw();
		},5000);
	}
	
	// ### pollRedraw
	// if anything has changed over some period, prepare to redraw everything.
	pollRedraw() {
		var self=this;
		setTimeout(function() {
			if (self.undoStatus != self.undoBuffer.opCount) {
				self.undoStatus = self.undoBuffer.opCount;
				self.pollIdleRedraw();
			}
			self.pollRedraw();
		},1000);
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
	piano() {
		this.piano = new suiPiano({elementId:'piano-svg'});
	}
	updateOffsets() {
		// the 100 is for the control offsets
		var padding =  Math.round((this.layout.screenWidth-this.layout.pageWidth)/2)-100;
		$('.workspace-container').css('padding-left',''+padding+'px');
		
		// Keep track of the scroll bar so we can adjust the map
		this.scrollPosition = $('body')[0].scrollTop;
	}
	resizeEvent() {
		var self = this;
		var remap = function () {
			return self.tracker.updateMap();
		}
		if (this.resizing)
			return;
		this.resizing = true;
		setTimeout(function () {
			console.log('resizing');
			self.resizing = false;
			self.layout.setViewport(true);
			$('.musicRelief').height(window.innerHeight - $('.musicRelief').offset().top);
			self.piano.handleResize();
			self.updateOffsets();
			self.layout.redraw().then(remap);
			
		}, 500);
	}
	
	trackerChangeEvent() {
		var scroll =  $('body')[0].scrollTop;
		if (scroll != this.scrollPosition && !this.resizing) {
			this.scrollPosition = $('body')[0].scrollTop;
			this.resizeEvent();
		}
	}
	
	trackerModifierSelect() {
		var modSelection = this.tracker.getSelectedModifier();
		if (modSelection) {
			window.removeEventListener("keydown", this.keydownHandler, true);
			var dialog = this.showModifierDialog(modSelection);
			this.unbindKeyboardForDialog(dialog);
		}
		return;
	}

	bindResize() {
		var self = this;
		$('.musicRelief').height(window.innerHeight - $('.musicRelief').offset().top);
		window.addEventListener('resize', function () {
			self.resizeEvent();
		});
	}
	
	static createDom() {
		 var b = htmlHelpers.buildDom;
		 var r=b('div').classes('dom-container')
			 .append(b('div').classes('modes'))
			 .append(b('div').classes('overlay'))
			 .append(b('div').classes('draganime hide'))
			 .append(b('div').classes('attributeDialog'))
			 .append(b('div').classes('helpDialog'))
			 .append(b('div').classes('bugDialog'))
			 .append(b('div').classes('menuContainer'))
			 .append(b('h1').classes('testTitle').text('Smoosic'))
			 .append(b('div').classes('piano-container')
			     .append(b('div').classes('piano-keys')))
		     .append(b('div').classes('workspace-container')
			    .append(b('div').classes('workspace')
				    .append(b('div').classes('controls-top'))
					.append(b('div').classes('controls-left'))
					.append(b('div').classes('musicRelief')
					   .append(b('div').classes('musicContainer').attr('id','boo')))));
	    $('#smoo').append(r.dom());
		var pianoDom=$('.piano-keys')[0];
		var svg=document.createElementNS(svgHelpers.namespace,'svg');
		svg.id='piano-svg';
		svg.setAttributeNS('','width',''+suiPiano.owidth*suiPiano.dimensions.octaves);
		svg.setAttributeNS('','height',''+suiPiano.dimensions.wheight);
		svg.setAttributeNS('','viewBox','0 0 '+suiPiano.owidth*suiPiano.dimensions.octaves+' '+suiPiano.dimensions.wheight);
		pianoDom.appendChild(svg);
	}

	// ## createUi
	// ### Description:
	// Convenience constructor, taking a renderElement and a score.
	static createUi(score) {
		suiController.createDom();
		var params = suiController.keyBindingDefaults;
		params.layout = suiSimpleLayout.createScoreLayout(document.getElementById("boo"), score);
		params.tracker = new suiTracker(params.layout);
		params.score = score;
		params.editor = new suiEditor(params);
		params.menus = new suiMenuManager(params);
		var controller = new suiController(params);
		return controller;
	}
	
	static createDebugUi(score) {
		suiController.createDom();
		var params = suiController.keyBindingDefaults;
		params.layout = suiSimpleLayout.createScoreLayout(document.getElementById("boo"), score);
		suiSimpleLayout.debugLayout=true;
		params.tracker = new suiTracker(params.layout);
		params.score = score;
		params.editor = new suiEditor(params);
		params.menus = new suiMenuManager(params);
		var controller = new suiController(params);
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
		var remap = function () {
			return controller.tracker.updateMap();
		}
		controller.layout.render().then(remap);

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
			self.render();
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
		return SuiDialogFactory.createDialog(modSelection, this.tracker.context, this.tracker, this.layout)
	}
	
	unbindKeyboardForDialog(dialog) {
		var self=this;
		var rebind = function () {
			self.render();
			self.bindEvents();
		}
		window.removeEventListener("keydown", this.keydownHandler, true);
		dialog.closeDialogPromise.then(rebind);		
	}

	handleKeydown(evdata) {
		var self = this;

		console.log("KeyboardEvent: key='" + event.key + "' | code='" +
			event.code + "'"
			 + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");
		event.preventDefault();

		if (evdata.key == '?') {
			SmoHelp.displayHelp();
		}

		if (evdata.key == '/') {
			window.removeEventListener("keydown", this.keydownHandler, true);
			this.menuHelp();
			var rebind = function () {
				self.render();
				self.bindEvents();
            }
			this.menuPromise = this.menus.slashMenuMode().then(rebind);
		}

		// TODO:  work dialogs into the scheme of things
		if (evdata.key == 'p') {
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

	render() {
		var controller = this;
		var remap = function () {
			return controller.tracker.updateMap();
		}
		this.layout.render().then(remap);
	}

	bindEvents() {
		var self = this;
		var tracker = this.tracker;
		$(this.renderElement).off('mousemove').on('mousemove', function (ev) {
			tracker.intersectingArtifact({
				x: ev.clientX,
				y: ev.clientY
			});
		});

		$(this.renderElement).off('click').on('click', function (ev) {
			tracker.selectSuggestion(ev);
		});
		$('body').off('smo-piano-key').on('smo-piano-key',function(ev,obj) {
			obj=obj.selections;
			self.tracker.selections.forEach((sel) => {
				SmoOperation.addPitch(sel,obj);
				// sel.note.pitches=JSON.parse(JSON.stringify(obj));
			});
			self.render();
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
		this.ribbon.display();

		window.addEventListener('error', function (e) {
			SuiExceptionHandler.instance.exceptionHandler(e);
		});
	}

}
