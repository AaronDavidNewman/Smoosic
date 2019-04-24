

class suiEditor {
    constructor(params) {
        Vex.Merge(this, params);
        this.changed = false; // set to true if the score has changed.
        this.slashMode = false;
    }
	
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
        var selection = selected.artifact.selection;
        var measure = this.score.getMeasureAtSelection(selected.artifact.selection);
        if (measure) {
            var pitchArray = [];
            var target = measure.getSelection(measure.activeVoice, selection.tick, pitchArray);
            if (target) {
                target.note.transpose(pitchArray, offset,measure.keySignature);
                smoModifierFactory.applyModifiers(measure);
                this.changed = true;
            }
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
        var measure = selected.artifact.smoMeasure;
        var note = selected.artifact.smoNote;
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
        var note = selObj.artifact.smoNote;
        var measure = selObj.artifact.smoMeasure;
        var nticks = vexMusic.getNextDottedLevel(note.tickCount);
        if (nticks == note.tickCount) {
            return;
        }
        var actor = new SmoStretchNoteActor({
                startIndex: selObj.artifact.selection.tick,
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
        var note = selObj.artifact.smoNote;
        var measure = selObj.artifact.smoMeasure;
        var nticks = vexMusic.getPreviousDottedLevel(note.tickCount);
        if (nticks == note.tickCount) {
            return;
        }
        var actor = new SmoContractNoteActor({
                startIndex: selObj.artifact.selection.tick,
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
        var note = selObj.artifact.smoNote;
        var measure = selObj.artifact.smoMeasure;
        var tuplet = measure.getTupletForNote(note);
        if (!tuplet) {
            var nticks = note.tickCount * 2;
            var actor = new SmoStretchNoteActor({
                    startIndex: selObj.artifact.selection.tick,
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
        var note = selObj.artifact.smoNote;
        var measure = selObj.artifact.smoMeasure;
        var tuplet = measure.getTupletForNote(note);
        if (!tuplet) {
            var nticks = note.tickCount / 2;
            var actor = new SmoContractNoteActor({
                    startIndex: selObj.artifact.selection.tick,
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
        var note = selObj.artifact.smoNote;
        var measure = selObj.artifact.smoMeasure;
        if (measure.getTupletForNote(note))
            return;
        var nticks = note.tickCount;

        var actor = new SmoMakeTupletActor({
                index: selObj.artifact.selection.tick,
                totalTicks: nticks,
                numNotes: numNotes,
                measure: measure
            });
        SmoTickTransformer.applyTransform(measure, actor);
		this.changed=true;
		this._render();
    }

    unmakeTuplet(keyEvent) {
        if (this.tracker.selections.length != 1) {
            return;
        }
        var selObj = this.tracker.selections[0];
        var numNotes = parseInt(keyEvent.key);
        var note = selObj.artifact.smoNote;
        var measure = selObj.artifact.smoMeasure;
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
		this.changed=true;
		this._render();
    }
}
