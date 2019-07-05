
// # UndoBuffer
// # Description:
// manage a set of undo or redo operations on a score.  The objects passed into 
// undo must implement serialize()/deserialize()
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
    }
    static get bufferMax() {
        return 100;
    }

    static get bufferTypes() {
        return ['measure', 'staff','score'];
    }

    addBuffer(title, type, selector, obj) {
        if (UndoBuffer.bufferTypes.indexOf(type) < 0) {
            throw ('Undo failure: illegal buffer type ' + type);
        }
		var json=obj.serialize();
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
        return this.buffer[this.buffer.length-1];
	}
	
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
			var staff  =SmoSystemStaff.deserialize(buf.json);
			score.replaceStaff(buf.selector.staff,staff);			
		}
        return score;
    }
}
