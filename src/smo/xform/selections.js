/////////////////
// Editing operations are performed on selections.  A selection can be different things, from a single pitch
// to many notes.  These classes standardize what can be in a selection.
//
//
// ## SmoSelector
// ## Description:
// There are 2 parts to a selection: the actual musical bits that are selected, and the
// indices that define what was selected.  This is the latter.  The actual object does not
// have any methods so there is no constructor.
class SmoSelector {
    static sameNote(sel1, sel2) {
        return (sel1.staff == sel2.staff && sel1.measure == sel2.measure && sel1.voice == sel2.voice
             && sel1.tick == sel2.tick);
    }
    static sameMeasure(sel1, sel2) {
        return (sel1.staff == sel2.staff && sel1.measure == sel2.measure);
    }
}

// ## SmoSelection
// ## Description:
// A selection is a selector and a set of references to musical elements, like measure etc.
// The staff and measure are always a part of the selection, and possible a voice and note,
// and one or more pitches.  Selections can also be made from the UI by clicking on an element
// or navigating to an element with the keyboard.
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
            type: 'measure'
        });
    }

    static noteSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex) {
        staffIndex = staffIndex ? staffIndex : score.activeStaff;
        measureIndex = measureIndex ? measureIndex : 0;
        voiceIndex = voiceIndex ? voiceIndex : 0;
        var staff = score.staves[staffIndex];
        var measure = staff.measures[measureIndex];
        var note = measure.voices[voiceIndex].notes[tickIndex];
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
            type: 'note'
        });
    }

    static renderedNoteSelection(score, nel) {
        var elementId = nel.getAttribute('id');
        for (var i = 0; i < score.staves.length; ++i) {
            var staff = score.staves[i];
            for (var j = 0; j < staff.measures.length; ++j) {
                var measure = staff.measures[j];
                for (var k = 0; k < measure.voices.length; ++k) {
                    var voice = measure.voices[k];
                    for (var m = 0; m < voice.notes.length; ++m) {
                        var note = voice.notes[m];
                        if (note.renderId === elementId) {
                            var selector = {
                                staff: i,
                                measure: j,
                                voice: k,
                                tick: m,
                                pitches: []
                            };
                            var box = document.getElementById(nel.id).getBBox();
                            var rv = new SmoSelection({
                                    selector: selector,
                                    _staff: staff,
                                    _measure: measure,
                                    _note: note,
                                    _pitches: [],
                                    box: box,
                                    type: 'rendered'
                                });

                            return rv;
                        }
                    }
                }
            }
        }
        return null;
    }

    static pitchSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex, pitches) {
        staffIndex = staffIndex ? staffIndex : score.activeStaff;
        measureIndex = measureIndex ? measureIndex : 0;
        voiceIndex = voiceIndex ? voiceIndex : 0;
        var staff = score.staves[staffIndex];
        var measure = staff.measures[measureIndex];
        var note = measure.voices[voiceIndex].notes[tickIndex];
        pitches = pitches ? pitches : [];
        var pa = [];
        pitches.forEach((ix) => {
            pa.push(JSON.parse(JSON.stringify(note.pitches[ix])));
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
            type: 'pitches'
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
            this._pitches = JSON.parse(JSON.stringify(this.note.pitches));
            return this._pitches;
        }
        return [];
    }
}

