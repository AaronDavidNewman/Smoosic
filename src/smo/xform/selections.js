
class SmoSelection {
    static measureSelection(score, staffIndex, measureIndex) {
        staffIndex = staffIndex ? staffIndex : score.activeStaff;
        var selector = {
            staff: staffIndex,
            measure: measureIndex
        };
        var staff = score.staves[staffIndex];
        var measure = staff.measures[measureIndex];

        return new SmoSelection
        ({
            selector: selector,
            _staff: staff,
            _measure: measure,
			type:'measure'
        });
    }

    static noteSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex) {
        staffIndex = staffIndex ? staffIndex : score.activeStaff;
        measureIndex = measureIndex ? measureIndex : 0;
        voiceIndex = voiceIndex ? voiceIndex : 0;
        var staff = score.staves[staffIndex];
        var measure = staff.measures[measureIndex];
        var note = measure.voices[voiceIndex].notes[noteIndex];
        var selector = {
            staff: staffIndex,
            measure: measureIndex,
            voice: voiceIndex,
            tick: tickIndex
        };
        return new SmoSelection({
            selector: selector,
            _staff: staff,
            _measure: measure,
            _note: note,
            _pitches: [],
			type:'note'
        });
    }

    static pitchSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex, pitches) {
        staffIndex = staffIndex ? staffIndex : score.activeStaff;
        measureIndex = measureIndex ? measureIndex : 0;
        voiceIndex = voiceIndex ? voiceIndex : 0;
        var staff = score.staves[staffIndex];
        var measure = staff.measures[measureIndex];
        var note = measure.voices[voiceIndex].notes[tickIndex];
		pitches = pitches ? pitches : [];
		var pa=[];
        pitches.forEach((ix) => {
            pa.push(JSON.parse(JSON.stringify(note.keys[ix])));
        });
        var selector = {
            staff: staffIndex,
            measure: measureIndex,
            voice: voiceIndex,
            tick: tickIndex,
            pitches: pitches
        };
        return new SmoSelection({
            selector: selector,
            _staff: staff,
            _measure: measure,
            _note: note,
            _pitches: pa,
			type:'pitches'
        });
    }

    constructor(params) {
        this.selector = {
            staff: 0,
            measure: 0,
            voice: 0,
            note: 0,
            pitches: []
        }
        this._staff = null;
        this._measure = null;
        this._note = null;
        this._pitches = [];		
        this._box = svgHelpers.pointBox(0, 0);

        this.selectionGroup = {
            id: VF.Element.newID(),
            type: 'SmoSelection'
        };
        Vex.Merge(this, params);
    }

    get staff() {
        return this._staff;
    }
    get measure() {
        return this._measure;
    }

    get note() {
        return this._note;
    }
    get pitches() {
        if (this._pitches.length) {
            return this._pitches;
        } else if (this._note) {
            this._pitches = JSON.parse(JSON.stringify(this.note.keys));
			return this._pitches;
        }
        return [];
    }
}
