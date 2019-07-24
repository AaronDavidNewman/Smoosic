
// ## UndoBuffer
// ## Description:
// manage a set of undo or redo operations on a score.  The objects passed into
// undo must implement serialize()/deserialize()
// ## Buffer format:
// A buffer is one of 3 things:
// A single measure,
// A single staff
// the whole score.
class UndoBuffer {
    constructor() {
        this.buffer = [];
    }
    static get bufferMax() {
        return 100;
    }

    static get bufferTypes() {
        return ['measure', 'staff', 'score'];
    }

    // ## addBuffer
    // ## Description:
    // Add the current state of the score required to undo the next operation we
    // are about to perform.  For instance, if we are adding a crescendo, we back up the
    // staff the crescendo will go on.
    addBuffer(title, type, selector, obj) {
        if (UndoBuffer.bufferTypes.indexOf(type) < 0) {
            throw ('Undo failure: illegal buffer type ' + type);
        }
        var json = obj.serialize();
        var undoObj = {
            title: title,
            type: type,
            selector: selector,
            json: json
        };
        if (this.buffer.length >= UndoBuffer.bufferMax) {
            this.buffer.pop();
        }
        this.buffer.push(undoObj);
    }

    _pop() {

        if (this.buffer.length < 1)
            return null;
        var buf = this.buffer.pop();
        return buf;
    }

    // ## Before undoing, peek at the top action in the q
    // so it can be re-rendered
    peek() {
        if (this.buffer.length < 1)
            return null;
        return this.buffer[this.buffer.length - 1];
    }

    // ## undo
    // ## Description:
    // Undo the operation at the top of the undo stack.  This is done by replacing
    // the music as it existed before the change was made.
    undo(score) {
        var buf = this._pop();
        if (!buf)
            return score;
        if (buf.type === 'measure') {
            var measure = SmoMeasure.deserialize(buf.json);
            measure.changed = true;
            score.replaceMeasure(buf.selector, measure);
        } else if (buf.type === 'score') {
            // Score expects string, as deserialized score is how saving is done.
            score = SmoScore.deserialize(JSON.stringify(buf.json));
        } else {
            // TODO: test me
            var staff = SmoSystemStaff.deserialize(buf.json);
            score.replaceStaff(buf.selector.staff, staff);
        }
        return score;
    }

}

// ## SmoUndoable
// ## Description:
// Convenience functions to save the score state before operations so we can undo the operation.
// Each undo-able knows which set of parameters the undo operation requires (measure, staff, score). 
class SmoUndoable {
    static setPitch(selection, pitches, undoBuffer) {
        undoBuffer.addBuffer('pitch change ' + JSON.stringify(pitches, null, ' '),
            'measure', selection.selector, selection.measure);
        SmoOperation.setPitch(selection, pitches);
    }
    static doubleDuration(selection, undoBuffer) {
        undoBuffer.addBuffer('double duration', 'measure', selection.selector, selection.measure);
        SmoOperation.doubleDuration(selection);
    }
    static halveDuration(selection, undoBuffer) {
        undoBuffer.addBuffer('halve note duration', 'measure', selection.selector, selection.measure);
        SmoOperation.halveDuration(selection);
    }
    static makeTuplet(selection, numNotes, undoBuffer) {
        undoBuffer.addBuffer(numNotes + '-let', 'measure', selection.selector, selection.measure);
        SmoOperation.makeTuplet(selection, numNotes);
    }
    static makeRest(selection, undoBuffer) {
        undoBuffer.addBuffer('make rest', 'measure', selection.selector, selection.measure);
        SmoOperation.makeRest(selection);
    }
    static makeNote(selection, undoBuffer) {
        undoBuffer.addBuffer('make note', 'measure', selection.selector, selection.measure);
        SmoOperation.makeNote(selection);
    }
    static unmakeTuplet(selection, undoBuffer) {
        undoBuffer.addBuffer('unmake tuplet', 'measure', selection.selector, selection.measure);
        SmoOperation.unmakeTuplet(selection);
    }
    static dotDuration(selection, undoBuffer) {
        undoBuffer.addBuffer('dot duration', 'measure', selection.selector, selection.measure);
        SmoOperation.dotDuration(selection);
    }
	static toggleBeamGroups(selections,undoBuffer) {
		var measureUndoHash={};
		selections.forEach((selection)=> {
			if (!measureUndoHash[selection.selector.measure]) {
				measureUndoHash[selection.selector.measure]=true;
				undoBuffer.addBuffer('toggleBeamGroups', 'measure', selection.selector, selection.measure);
			}
			SmoOperation.toggleBeamGroup(selection);
		});
	}
    static undotDuration(selection, undoBuffer) {
        undoBuffer.addBuffer('undot duration', 'measure', selection.selector, selection.measure);
        SmoOperation.undotDuration(selection);
    }
    static transpose(selection, offset, undoBuffer) {
        undoBuffer.addBuffer('transpose pitches ' + offset, 'measure', selection.selector, selection.measure);
        SmoOperation.transpose(selection, offset);
    }
    static courtesyAccidental(pitchSelection, toBe, undoBuffer) {
        undoBuffer.addBuffer('courtesy accidental ', 'measure', pitchSelection.selector, pitchSelection.measure);
        SmoOperation.courtesyAccidental(pitchSelection, toBe);
    }
    static addDynamic(selection, dynamic, undoBuffer) {
        undoBuffer.addBuffer('add dynamic', 'measure', selection.selector, selection.measure);
        SmoOperation.addDynamic(selection,dynamic);
    }
    static interval(selection, interval, undoBuffer) {
        undoBuffer.addBuffer('add interval ' + interval, 'measure', selection.selector, selection.measure);
        SmoOperation.interval(selection, interval);
    }
    static crescendo(fromSelection, toSelection, undoBuffer) {
        undoBuffer.addBuffer('crescendo', 'staff', fromSelection.selector, fromSelection.staff);
        SmoOperation.crescendo(fromSelection, toSelection);
    }
    static decrescendo(fromSelection, toSelection, undoBuffer) {
        undoBuffer.addBuffer('decrescendo', 'staff', fromSelection.selector, fromSelection.staff);
        SmoOperation.decrescendo(fromSelection, toSelection);
    }
    static slur(fromSelection, toSelection, undoBuffer) {
        undoBuffer.addBuffer('slur', 'staff', fromSelection.selector, fromSelection.staff);
        SmoOperation.slur(fromSelection, toSelection);
    }
    static addInstrument(score, undoBuffer) {
        undoBuffer.addBuffer('addInstrument', 'score', null, score);
        SmoOperation.addInstrument(score);
    }
	static removeInstrument(score,index,undoBuffer) {
        undoBuffer.addBuffer('removeInstrument', 'score', null, score);
        SmoOperation.removeInstrument(score,index);
	}
    static addKeySignature(score, selection, keySignature, undoBuffer) {
        undoBuffer.addBuffer('addKeySignature ' + keySignature, 'score', null, score);
        SmoOperation.addKeySignature(score, selection, keySignature);
    }
	static addMeasure(score,systemIndex, nmeasure,undoBuffer) {
        undoBuffer.addBuffer('add measure', 'score', null, score);
		SmoOperation.addMeasure(score,systemIndex, nmeasure);
	}
	static deleteMeasure(score, selection,undoBuffer) {
        undoBuffer.addBuffer('delete measure', 'score', null, score);
		var measureIndex = selection.selector.measure;		
		score.deleteMeasure(measureIndex);
	}
	static addInstrument(score, parameters,undoBuffer) {
        undoBuffer.addBuffer('add instrument', 'score', null, score);
		SmoOperation.addInstrument(score,parameters);
	}
	static removeInstrument(score, index,undoBuffer) {
        undoBuffer.addBuffer('remove instrument', 'score', null, score);
		SmoOperation.removeInstrument(score,index);
	}
	static changeInstrument(score,instrument, selections,undoBuffer) {		
		undoBuffer.addBuffer('changeInstrument', 'staff', selections[0].selector, score);
		SmoOperation.changeInstrument(score,instrument,selections);
	}
}
