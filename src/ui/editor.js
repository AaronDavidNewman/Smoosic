

class suiEditor {
    constructor(params) {
        Vex.Merge(this, params);
        this.slashMode = false;
    }

    // ## _render
    // utility function to render the music and update the tracker map.
    _render() {
        this.layout.render();
        this.tracker.updateMap();
    }

    _renderAndAdvance() {
        this._render();
        this.tracker.moveSelectionRight();
    }

    _selectionOperation(selection, name, parameters) {
        if (parameters) {
            SmoUndoable[name](selection, parameters, this.undoBuffer);
        } else {
            SmoUndoable[name](selection, this.undoBuffer);
        }
        this._render();
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
		if (this.tracker.selections.length <1) {
			return;
		}
		this.pasteBuffer.setSelections(this.score,this.tracker.selections);
	}
	paste() {
		if (this.tracker.selections.length <1) {
			return;
		}
		var pasteTarget = this.tracker.selections[0].selector;
		this.layout.unrenderAll();
		this.pasteBuffer.pasteSelections(this.score, pasteTarget);
		this.layout.render();
	}
	
	deleteMeasure() {
		if (this.tracker.selections.length < 1) {
			return;
		}
		var selection = this.tracker.selections[0];
		this.layout.unrenderAll();
		SmoUndoable.deleteMeasure(this.score,selection,this.undoBuffer);
		this.tracker.selections=[];
		this.tracker.clearModifierSelections();
		this.layout.render();
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
            nmeasure.measureNumber.measureIndex = measure.measureNumber.measureIndex;
            SmoUndoable.addMeasure(this.score, measure.measureNumber.systemIndex, nmeasure, this.undoBuffer);
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
