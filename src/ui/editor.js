

class suiEditor {
    constructor(params) {
        Vex.Merge(this, params);
        this.slashMode = false;
    }

    // ## _render
    // utility function to render the music and update the tracker map.
    _render() {
		this.layout.setDirty();
    }
    
    get score() {
        return this.layout.score;
    }

    _renderAndAdvance() {
		this.tracker.moveSelectionRight();
		this.layout.setDirty();
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
    
    beamSelections() {
        if (this.tracker.selections.length < 1) {
            return;
        }
        SmoUndoable.beamSelections(this.tracker.selections, this.undoBuffer);
    }
    toggleBeamDirection() {
        if (this.tracker.selections.length < 1) {
            return;
        }
        SmoUndoable.toggleBeamDirection(this.tracker.selections, this.undoBuffer);
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
        if (isNaN(interval) || interval < 2 || interval > 7) {
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
            SmoUndoable.addMeasure(this.score, measure.measureNumber.measureIndex, nmeasure, this.undoBuffer);
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
    removeGraceNote(keyEvent) {
        this._singleSelectionOperation('removeGraceNote',{index:0});
    }
    addGraceNote(keyEvent) {
        this._singleSelectionOperation('addGraceNote');
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
