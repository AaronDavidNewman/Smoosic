
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
	      noteSelection.note.endBeam =  !(noteSelection.note.endBeam);
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
		return true;
	}

	static makeRest(selection) {
		selection.note.makeRest();
	}
	static makeNote(selection) {
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
		if (selection.selector.tick === selection.measure.notes.length) {
			return;
		}
		if (selection.measure.notes[selection.selector.tick+1].tickCount > selection.note.tickCount) {
			console.log('too long');
			return;
		}
		var actor = new SmoStretchNoteActor({
				startIndex: selection.selector.tick,
				tickmap: measure.tickmap(),
				newTicks: nticks
			});
		SmoTickTransformer.applyTransform(measure, actor);
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
	
	static toggleCourtesyAccidental(selection) {
		var toBe=false;
		var i=0;
		if (!selection.selector['pitches'] || selection.selector.pitches.length === 0) {
			var ps=[];
			selection.note.pitches.forEach((pitch) => {
				var p = JSON.parse(JSON.stringify(pitch));
				ps.push(p);
				p.cautionary = !(pitch.cautionary);
			});
			selection.note.pitches=ps;
		} else {
			toBe = !(selection.note.pitches[selection.selector.pitches[0]].cautionary);
		}
		
		SmoOperation.courtesyAccidental(selection, toBe);
	}

	static courtesyAccidental(pitchSelection, toBe) {
		pitchSelection.selector.pitches.forEach((pitchIx) => {
			pitchSelection.note.pitches[pitchIx].cautionary = toBe;
		});
	}

	static addDynamic(selection, dynamic) {
		selection.note.addModifier(dynamic);
	}

	static toggleArticulation(selection, articulation) {
		selection.note.toggleArticulation(articulation);
	}

	// ## interval
	// ## Description:
	// Add a pitch at the specified interval to the chord in the selection.
	static interval(selection, interval) {
		var measure = selection.measure;
		var note = selection.note;

		// TODO: figure out which pitch is selected
		var pitch = note.pitches[0];
		var pitch = smoMusic.getIntervalInKey(pitch, measure.keySignature, interval);
		if (pitch) {
			note.pitches.push(pitch);
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
