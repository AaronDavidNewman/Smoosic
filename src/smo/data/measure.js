
// ## SmoMeasure - data for a measure of music
// ## Description:
// Many rules of musical engraving are enforced at a measure level, e.g. the duration of
// notes, accidentals, etc.
// ## See Also:
// Measures contain *notes*, *tuplets*, and *beam groups*.  So see `SmoNote`, etc.
// Measures are contained in staves, see also `SystemStaff.js`
// ## SmoMeasure Methods:
class SmoMeasure {
	constructor(params) {
		this.tuplets = [];
		this.beamGroups = [];
		this.changed = true;

		smoMusic.serializedMerge(SmoMeasure.attributeArray, SmoMeasure.defaults, this);
		smoMusic.serializedMerge(SmoMeasure.attributeArray, params, this);
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
			'measureNumber', 'staffWidth', 'modifierOptions',
			'activeVoice', 'clef', 'transposeIndex'];
	}

	static get attributeArray() {
		return SmoMeasure.defaultAttributes.concat(['voices', 'tuplets', 'beamGroups', 'activeVoice', 'adjX', 'rightMargin']);
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

	static getDefaultMeasure(params) {
		var obj = {};
		smoMusic.serializedMerge(SmoMeasure.defaultAttributes,SmoMeasure.defaults,obj);
		smoMusic.serializedMerge(SmoMeasure.defaultAttributes, obj, params);
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

	static _cloneParameters(measure) {
		var keys = Object.keys(measure);
		var clone = {};
		for (var i = 0; i < keys.length; ++i) {
			var key = keys[i];
			clone[key] = measure[key];
		}
		return clone;
	}

	static get defaultVoice44() {
		return SmoMeasure.getDefaultNotes({
			clef: 'treble',
			timeSignature: '4/4'
		});
	}
	static get defaults() {
		// var noteDefault = SmoMeasure.defaultVoice44;
		return {
			timeSignature: '4/4',
			keySignature: "C",
			canceledKeySignature: null,
			staffX: 10,
			adjX: 0,
			transposeIndex: 0,
			rightMargin: 2,
			customModifiers: [],
			staffY: 40,
			bars: [1, 1], // follows enumeration in VF.Barline
			measureNumber: {
				localIndex: 0,
				systemIndex: 0,
				measureNumber: 0
			},
			staffWidth: 200,
			modifierOptions: {},
			clef: 'treble',
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
