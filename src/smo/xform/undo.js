
// # UndoBuffer
// # Description:
// manage a set of undo or redo operations on a score.
// # Buffer format:
// A buffer is one of 3 things:
// A single measure,
// A single staff
// the whole score.
// In the set of measures, the serialization is split into 2 parts:
// staffModifiers: a set of modifiers that start or end on one the measures, and 2:
// measures: a set of measures.
class UndoBuffer {
    constructor() {
        this.buffer = [];
        this.index = -1;
    }
    static get bufferMax() {
        return 100;
    }

    static get bufferTypes() {
        return ['measure', 'staff','score'];
    }

    addBuffer(title, type, selector, json) {
        if (UndoBuffer.bufferTypes.indexOf(type) < 0) {
            throw ('Undo failure: illegal buffer type ' + type);
        }
        var undoObj = {
            title: title,
            type: type,
            selector: selector,
            json: json
        };
        if (this.buffer.length < UndoBuffer.bufferMax) {
            this.buffer.push(undoObj);
            this.index += 1;
        } else {
            this.index = (this.index + 1) % this.buffer.length - 1;
            this.buffer[this.index] = undoObj;
        }
    }

    _pop() {
        if (this.index < 0)
            return null;
        var buf = this.buffer[this.index];
        if (this.buffer.length >= UndoBuffer.bufferMax) {
            this.index = (this.index + bufferMax - 1) % bufferMax;
        } else {
            this.index -= 1;
        }
		return buf;
    }

    undo(score) {
        var buf = this._pop();
        if (!buf)
            return score;
        if (buf.type === 'measure') {
			var measure = SmoMeasure.deserialize(buf.json);
            score.replaceMeasure(buf.selector, measure);
        } else if (buf.type === 'score') {
            score = SmoScore.deserialize(buf.json);
        } else {
			// TODO: test me
			var staff  =SmoSystemStaff.deserialize(buf.json);
			score.replaceStaff(buf.selector.staff,staff);			
		}
        return score;
    }
}
