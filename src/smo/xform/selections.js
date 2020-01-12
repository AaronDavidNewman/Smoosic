/////////////////
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
		var cur = selections[0];
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
