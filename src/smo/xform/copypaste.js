


// ## PasteBuffer
// ### Description:
// Hold some music that can be pasted back to the score
class PasteBuffer {
	constructor() {
		this.buffer = [];
	}

	setSelections(score, selections) {
		this.buffer = [];
		selections.forEach((selection) => {
			var selector = JSON.parse(JSON.stringify(selection.selector));
			var note = selection.note.serialize();
			var modifiers = selection.staff.getModifiersAt(selector);
			var modJson = [];
			modifiers.forEach((mod) => {
				modJson.push(mod.serialize());
			});
			this.buffer.push({
				selector: selector,
				note: note,
				modifiers: modJson
			});
		});
		this.buffer.sort((a, b) => {
			return SmoSelector.gt(a.selector, , b.selector) ? 1 : -1;
		});
	}

	clearSelections() {
		this.buffer = [];
	}
	_populatePasteArray() {
		var targetArray = [];
		var startSel = this.buffer[0].selector;
		this.buffer.forEach((selection) => {
			var targetSel = SmoSelector.applyOffset(startSel, this.destination, selection.selector);
			var existing = SmoSelection.noteSelection(this.score, targetSel);
			var tickmap = existing.measure.tickmap();
			var ticksTotal = tickmap.totalDuration;
			var ticksUsed = tickmap.deltaMap(targetSel.tick);
			var duration = selection.note.tickCount();
			var remainder = 0;
			// TODO: handle tuplets
			if (ticksUsed + duration > ticksTotal) {
				duration = ticksTotal - (ticksUsed + duration);
				remainder = selection.note.tickCount() - duration;
			}
			var note = SmoNote.cloneWithDuration(selection.note, duration);
			targetArray.push(note);
			if (remainder > 0) {
				note = SmoNote.cloneWithDuration(selection.note, remainder);
				targetArray.push(note);
			}
		});
		return targetArray;
	}

	_populateMeasureArray() {
		var measureIndex = -1;
		var measureArray = [];
		var noteIndex = 0;
		var startSel = this.buffer[0].selector;
		var noteArray = this._populatePasteArray();
		for (var b = 0; b < this.buffer.length; ++b) {
			var selection = this.buffer[b];
			if (selection.selector.measure > measureIndex) {
				var selector = selection.selector;
				var targetSel = SmoSelector.applyOffset(startSel, this.destination, selection.selector);
				measureIndex = selection.selector.measure;
				var existing = SmoSelection.measureSelection(this.score, {staff:selector.staff,measure:selector.measure});
				var tickmap = existing.tickmap();
				var voices = [];
				for (var i = 0; i < existing.voices; ++i) {
					var ev = existing.voice[i];
					var voice = {
						notes: []
					};
					for (var j = 0; j < ev.notes.length; ++j) {
						if (selection.selector.voice != i) {
							voice.notes.push(SmoNote.clone(ev.notes[j]));
						} else {
							var targetNote = noteArray(noteIndex);
							if (targetNote.tickCount() < selection.note.tickCount()) {
								voices.notes.push(noteArray[noteIndex]);
								noteIndex += 1;
							}
							voices.notes.push(noteArray[noteIndex]);
							noteIndex += 1;
						}
					}
				}

			}
		}
	}

	pasteSelections(score, selector) {
		if (this.buffer.length < 1) {
			return;
		}
		this.destination=selector;
		var startSel = this.buffer[0].selector;
		this.buffer.forEach((selection) => {
			var targetSel = SmoSelector.applyOffset(startSel, selector, selection.selector);
			var existing = SmoSelection.noteSelection(score, targetSel);
			// TODO: find closest note and adjust
			if (existing) {
				var note = SmoNote.deserialize(selection.note);
				// replace pitch
				if (note.tickCount === existing.note.tickCount) {
					existing.note.pitches = JSON.parse(JSON.stringify(note.pitches));
				}
			}
		});
	}
}
