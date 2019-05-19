

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

    showModifierDialog(keyEvent) {
        var modSelection = this.tracker.getSelectedModifier();
        if (modSelection) {
            var dbType = SuiAttributeDialog.modifierDialogMap[modSelection.modifier.type];
            var ctor = eval(dbType);
            return ctor.createAndDisplay({
                staffModifier: modSelection.modifier,
                selection: modSelection.selection,
				context:this.tracker.context,
				tracker:this.tracker
            });
        }
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

    _setPitch(selected, letter) {
        this._selectionOperation(selected, 'setPitch', letter);
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
            var nmeasure = SmoMeasure.cloneMeasure(measure);
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
