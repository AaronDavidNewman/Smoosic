

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
            this.changed = false;
        }
    }
    _transpose(selected, offset) {
        var measure = selected.measure;
        var note = selected.note;
        if (measure && note) {
            note.transpose(selected.selector.pitches, offset, measure.keySignature);
            smoModifierFactory.applyModifiers(measure);
            this.changed = true;
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
        var selected = this.tracker.selections[0];
        var measure = selected.measure;
        var note = selected.note;

        // TODO: figure out which pitch is selected
        var key = note.keys[0];
        var pitch = vexMusic.getIntervalInKey(key, measure.keySignature, interval);
        if (pitch) {
            note.keys.push(pitch);
            smoModifierFactory.applyModifiers(measure);
            this._render();
        }
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
        var measure = selected.measure;
        var note = selected.note;
        var key = vexMusic.getKeySignatureKey(letter, measure.keySignature);
        var prop = {
            key: key[0],
            accidental: '',
            octave: note.keys[0].octave
        };
        if (key.length > 1) {
            prop.accidental = key.substring(1);
        } else {
            prop.accidental = '';
        }
        note.keys = [prop];
        this.changed = true;
    }

    setPitch(keyEvent) {
        this.tracker.selections.forEach((selected) => this._setPitch(selected, keyEvent.key.toLowerCase()));
        this._renderAndAdvance();
    }
    dotDuration(keyEvent) {
        if (this.tracker.selections.length != 1) {
            return;
        }
        var selObj = this.tracker.selections[0];
        var note = selObj.note;
        var measure = selObj.measure;
        var nticks = vexMusic.getNextDottedLevel(note.tickCount);
        if (nticks == note.tickCount) {
            return;
        }
        var actor = new SmoStretchNoteActor({
                startIndex: selObj.selector.tick,
                tickmap: measure.tickmap(),
                newTicks: nticks
            });
        SmoTickTransformer.applyTransform(measure, actor);
        this.changed = true;
        this._render();
    }

    undotDuration(keyEvent) {
        if (this.tracker.selections.length != 1) {
            return;
        }
        var selObj = this.tracker.selections[0];
        var note = selObj.note;
        var measure = selObj.measure;
        var nticks = vexMusic.getPreviousDottedLevel(note.tickCount);
        if (nticks == note.tickCount) {
            return;
        }
        var actor = new SmoContractNoteActor({
                startIndex: selObj.selector.tick,
                tickmap: measure.tickmap(),
                newTicks: nticks
            });
        SmoTickTransformer.applyTransform(measure, actor);
        this.changed = true;
        this._render();
    }

    doubleDuration(keyEvent) {
        if (this.tracker.selections.length != 1) {
            return;
        }
        var selObj = this.tracker.selections[0];
        var note = selObj.note;
        var measure = selObj.measure;
        var tuplet = measure.getTupletForNote(note);
        if (!tuplet) {
            var nticks = note.tickCount * 2;
            var actor = new SmoStretchNoteActor({
                    startIndex: selObj.selector.tick,
                    tickmap: measure.tickmap(),
                    newTicks: nticks
                });
            SmoTickTransformer.applyTransform(measure, actor);
            this.changed = true;
            this._render();
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
            this.changed = true;
            this._render();
        }
    }
	
    halveDuration(keyEvent) {
        if (this.tracker.selections.length != 1) {
            return;
        }
        var selObj = this.tracker.selections[0];
        var note = selObj.note;
        var measure = selObj.measure;
        var tuplet = measure.getTupletForNote(note);
        if (!tuplet) {
            var nticks = note.tickCount / 2;
            var actor = new SmoContractNoteActor({
                    startIndex: selObj.selector.tick,
                    tickmap: measure.tickmap(),
                    newTicks: nticks
                });
            SmoTickTransformer.applyTransform(measure, actor);
            this.changed = true;
            this._render();

        } else {
            var startIndex = measure.tupletIndex(tuplet) + tuplet.getIndexOfNote(note);
            var actor = new SmoContractTupletActor({
                    changeIndex: startIndex,
                    measure: measure
                });
            SmoTickTransformer.applyTransform(measure, actor);
            this.changed = true;
            this._render();

        }
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
        if (this.tracker.selections.length != 1) {
            return;
        }
        var selObj = this.tracker.selections[0];
        var numNotes = parseInt(keyEvent.key);
        var note = selObj.note;
        var measure = selObj.measure;
        if (measure.getTupletForNote(note))
            return;
        var nticks = note.tickCount;

        var actor = new SmoMakeTupletActor({
                index: selObj.selector.tick,
                totalTicks: nticks,
                numNotes: numNotes,
                measure: measure
            });
        SmoTickTransformer.applyTransform(measure, actor);
        this.changed = true;
        this._render();
    }

    unmakeTuplet(keyEvent) {
        if (this.tracker.selections.length != 1) {
            return;
        }
        var selObj = this.tracker.selections[0];
        var numNotes = parseInt(keyEvent.key);
        var note = selObj.note;
        var measure = selObj.measure;
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
        this.changed = true;
        this._render();
    }
}
