

class suiEditor {
    constructor(params) {
        Vex.Merge(this, params);
        this.changed = false; // set to true if the score has changed.
        this.slashMode = false;
    }

    // ## _render
    // utility function to render the music and update the tracker map.
    _render() {
        this.layout.render();
        this.tracker.updateMap();
    }

    _renderAndAdvance() {
        if (this.changed) {
            this._render();
            this.tracker.moveSelectionRight();
        }
    }

    _selectionOperation(selection, name, parameters) {
        selection.measure.changed = true;
        SmoOperation[name](selection, parameters);
        this._render();
    }

    _singleSelectionOperation(name, parameters) {
        if (this.tracker.selections.length != 1) {
            return;
        }
        var selection = this.tracker.selections[0];
        SmoOperation[name](selection, parameters);
        this.changed = true;
        this._render();
    }

    _transpose(selection, offset) {
        this._selectionOperation(selection, 'transpose', offset);
    }    

    interval(keyEvent) {
        if (this.tracker.selections.length != 1)
            return;
        // code='Digit3'
        var interval = parseInt(keyEvent.code[5]) - 1;
        if (keyEvent.shiftKey) {
            interval = -interval;
        }
        this._singleSelectionOperation('interval', interval);
    }

    transpose(offset) {
        this.tracker.selections.forEach((selected) => this._transpose(selected, offset));
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
		   selector.staff,selector.measure,selector.voice,selector.tick);
		if (!hintSel) {
			hintSel = SmoSelection.nextNoteSelection(this.score,
			selector.staff,selector.measure,selector.voice,selector.tick);
		}
		var hintNote = hintSel.note;
		var hpitch = hintNote.pitches[0];
		var pitch = JSON.parse(JSON.stringify(hpitch));
		pitch.letter = letter;

		// make the octave of the new note as close to previous (or next) note as possible.
		var upv=['bc','ac','bd','da','be','gc'];
		var downv=['cb','ca','db','da','eb','cg'];
		var delta = hpitch.letter+pitch.letter;
		if (upv.indexOf(delta) >= 0) {
			pitch.octave += 1;
		} 
		if (downv.indexOf(delta) >= 0) {
			pitch.octave -= 1;
		}
        this._selectionOperation(selected, 'setPitch', pitch);
    }

    setPitch(keyEvent) {
        this.tracker.selections.forEach((selected) => this._setPitch(selected, keyEvent.key.toLowerCase()));
        this._renderAndAdvance();
    }

    dotDuration(keyEvent) {
        this._singleSelectionOperation('dotDuration');
    }

    undotDuration(keyEvent) {
        this._singleSelectionOperation('undotDuration');
    }

    doubleDuration(keyEvent) {
        this._singleSelectionOperation('doubleDuration');
    }

    halveDuration(keyEvent) {
        this._singleSelectionOperation('halveDuration');
    }

    addMeasure(keyEvent) {
        if (this.tracker.selections.length < 1) {
            return;
        }
        var measure = this.tracker.getFirstMeasureOfSelection();
        if (measure) {
            var nmeasure = SmoMeasure.getDefaultMeasureWithNotes(measure);
            this.score.addMeasure(measure.measureNumber.systemIndex, nmeasure);
            this.changed = true;
            this._render();
        }
    }
    makeTuplet(keyEvent) {
        var numNotes = parseInt(keyEvent.key);
        this._singleSelectionOperation('makeTuplet', numNotes);
    }

    unmakeTuplet(keyEvent) {
        this._singleSelectionOperation('unmakeTuplet');
    }
}
