/////////////////
// # selections.js
// Editing operations are performed on selections.  A selection can be different things, from a single pitch
// to many notes.  These classes standardize some standard selection operations.
//
//
// ## SmoSelector
// ## Description:
// There are 2 parts to a selection: the actual musical bits that are selected, and the
// indices that define what was selected.  This is the latter.  The actual object does not
// have any methods so there is no constructor.
// eslint-disable-next-line no-unused-vars
class SmoSelector {
  // TODO:  tick in selector s/b tickIndex
  static sameNote(sel1, sel2) {
    return (sel1.staff === sel2.staff && sel1.measure === sel2.measure && sel1.voice === sel2.voice
       && sel1.tick === sel2.tick);
  }
  static sameMeasure(sel1, sel2) {
    return (sel1.staff === sel2.staff && sel1.measure === sel2.measure);
  }

  static sameStaff(sel1, sel2) {
    return sel1.staff === sel2.staff;
  }

  // ## return true if sel1 > sel2.
  static gt(sel1, sel2) {
    // Note: voice is not considered b/c it's more of a vertical component
    return sel1.staff > sel2.staff ||
      (sel1.staff === sel2.staff && sel1.measure > sel2.measure) ||
      (sel1.staff === sel2.staff && sel1.measure === sel2.measure && sel1.tick > sel2.tick);
  }

  static eq(sel1, sel2) {
    return (sel1.staff === sel2.staff && sel1.measure === sel2.measure && sel1.tick === sel2.tick);
  }
  static neq(sel1, sel2) {
    return !(SmoSelector.eq(sel1, sel2));
  }

  static lt(sel1, sel2) {
    return SmoSelector.gt(sel2, sel1);
  }

  static gteq(sel1, sel2) {
    return SmoSelector.gt(sel1, sel2) || SmoSelector.eq(sel1, sel2);
  }
  static lteq(sel1, sel2) {
    return SmoSelector.lt(sel1, sel2) || SmoSelector.eq(sel1, sel2);
  }

  // ### getNoteKey
  // Get a key useful for a hash map of notes.
  static getNoteKey(selector) {
    return '' + selector.staff + '-' + selector.measure + '-' + selector.voice + '-' + selector.tick;
  }

  static getMeasureKey(selector) {
    return '' + selector.staff + '-' + selector.measure;
  }

  // ## applyOffset
  // ### Description:
  // offset 'selector' the difference between src and target, return the result
  static applyOffset(src, target, selector) {
    const rv = JSON.parse(JSON.stringify(selector));
    rv.staff += target.staff - src.staff;
    rv.measure += target.measure - src.measure;
    rv.voice += target.voice - src.voice;
    rv.note += target.staff - src.staff;
    return rv;
  }

  // return true if testSel is contained in the selStart to selEnd range.
  static contains(testSel, selStart, selEnd) {
    const geStart =
      selStart.measure < testSel.measure ||
      (selStart.measure === testSel.measure && selStart.tick <= testSel.tick);
    const leEnd =
      selEnd.measure > testSel.measure ||
      (selEnd.measure === testSel.measure && testSel.tick <= selEnd.tick);

    return geStart && leEnd;
  }

  // create a hashmap key for a single note, used to organize modifiers
  static selectorNoteKey(selector) {
    return 'staff-' + selector.staff + '-measure-' + selector.measure + '-voice-' + selector.voice + '-tick-' + selector.tick;
  }
}

// ## SmoSelection
// ## Description:
// A selection is a selector and a set of references to musical elements, like measure etc.
// The staff and measure are always a part of the selection, and possible a voice and note,
// and one or more pitches.  Selections can also be made from the UI by clicking on an element
// or navigating to an element with the keyboard.
// eslint-disable-next-line no-unused-vars
class SmoSelection {
  // ### measureSelection
  // A selection that does not contain a specific note
  static measureSelection(score, staffIndex, measureIndex) {
    staffIndex = staffIndex !== null ? staffIndex : score.activeStaff;
    const selector = {
      staff: staffIndex,
      measure: measureIndex
    };
    if (score.staves.length <= staffIndex) {
      return null;
    }
    const staff = score.staves[staffIndex];
    if (staff.measures.length <= measureIndex) {
      return null;
    }
    const measure = staff.measures[measureIndex];

    return new SmoSelection({
      selector,
      _staff: staff,
      _measure: measure,
      type: 'measure'
    });
  }

  static measuresInColumn(score, staffIndex) {
    let i = 0;
    const rv = [];
    for (i = 0; i < score.staves.length; ++i) {
      rv.push(SmoSelection.measureSelection(score, i, staffIndex));
    }
    return rv;
  }

  static noteFromSelection(score, selection) {
    return SmoSelection(score, selection.staffIndex, selection.measureIndex, selection.voiceIndex, selection.tickIndex);
  }

  // ### noteSelection
  // a selection that specifies a note in the score
  static noteSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex) {
    staffIndex = staffIndex != null ? staffIndex : score.activeStaff;
    measureIndex = typeof(measureIndex) !== 'undefined' ? measureIndex : 0;
    voiceIndex = typeof(voiceIndex) !== 'undefined' ? voiceIndex : 0;
    const staff = score.staves[staffIndex];
    if (!staff) {
      return null;
    }
    const measure = staff.measures[measureIndex];
    if (!measure) {
      return null;
    }
    if (measure.voices.length <= voiceIndex) {
      return null;
    }
    if (measure.voices[voiceIndex].notes.length <= tickIndex) {
      return null;
    }
    const note = measure.voices[voiceIndex].notes[tickIndex];
    const selector = {
      staff: staffIndex,
      measure: measureIndex,
      voice: voiceIndex,
      tick: tickIndex
    };
    return new SmoSelection({
      selector,
      _staff: staff,
      _measure: measure,
      _note: note,
      _pitches: [],
      type: 'note'
    });
  }

  static noteFromSelector(score, selector) {
    return SmoSelection.noteSelection(score,
      selector.staff, selector.measure, selector.voice, selector.tick);
  }

  // ### renderedNoteSelection
  // return the appropriate type of selection from the selector, based on the selector.
  static selectionFromSelector(score, selector) {
    if (typeof(selector.pitches) !== 'undefined' && selector.pitches.length) {
      return SmoSelection.pitchSelection(score,
        selector.staff, selector.measure, selector.voice, selector.tick, selector.pitch);
    }
    if (typeof(selector.tick) === 'number') {
      return SmoSelection.noteFromSelector(score, selector);
    }
    return SmoSelection.measureSelection(score, selector.staff, selector.measure);
  }

  // ### renderedNoteSelection
  // this is a special selection that we associated with all he rendered notes, so that we
  // can map from a place in the display to a place in the score.
  static renderedNoteSelection(score, nel, box) {
    let i = 0;
    let j = 0;
    let k = 0;
    let m = 0;
    const elementId = nel.getAttribute('id');
    for (i = 0; i < score.staves.length; ++i) {
      const staff = score.staves[i];
      for (j = 0; j < staff.measures.length; ++j) {
        const measure = staff.measures[j];
        for (k = 0; k < measure.voices.length; ++k) {
          const voice = measure.voices[k];
          for (m = 0; m < voice.notes.length; ++m) {
            const note = voice.notes[m];
            if (note.renderId === elementId) {
              const selector = {
                staff: i,
                measure: j,
                voice: k,
                tick: m,
                pitches: []
              };
              // var box = document.getElementById(nel.id).getBBox();
              const rv = new SmoSelection({
                selector,
                _staff: staff,
                _measure: measure,
                _note: note,
                _pitches: [],
                box,
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
    staffIndex = staffIndex !== null ? staffIndex : score.activeStaff;
    measureIndex = typeof(measureIndex) !== 'undefined' ? measureIndex : 0;
    voiceIndex = typeof(voiceIndex) !== 'undefined' ? voiceIndex : 0;
    const staff = score.staves[staffIndex];
    const measure = staff.measures[measureIndex];
    const note = measure.voices[voiceIndex].notes[tickIndex];
    pitches = typeof(pitches) !== 'undefined' ? pitches : [];
    const pa = [];
    pitches.forEach((ix) => {
      pa.push(JSON.parse(JSON.stringify(note.pitches[ix])));
    });
    const selector = {
      staff: staffIndex,
      measure: measureIndex,
      voice: voiceIndex,
      tick: tickIndex,
      pitches
    };
    return new SmoSelection({
      selector,
      _staff: staff,
      _measure: measure,
      _note: note,
      _pitches: pa,
      type: 'pitches'
    });
  }

  // ## nextNoteSelection
  // ## Description:
  // Return the next note in this measure, or the first note of the next measure, if it exists.
  static nextNoteSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex) {
    const nextTick = tickIndex + 1;
    const nextMeasure = measureIndex + 1;
    const staff = score.staves[staffIndex];
    const measure = staff.measures[measureIndex];
    if (measure.voices[voiceIndex].notes.length > nextTick) {
      return SmoSelection.noteSelection(score, staffIndex, measureIndex, voiceIndex, nextTick);
    }
    if (staff.measures.length > nextMeasure) {
      return SmoSelection.noteSelection(score, staffIndex, nextMeasure, voiceIndex, 0);
    }
    return null;
  }

  static nextNoteSelectionFromSelector(score, selector) {
    return SmoSelection.nextNoteSelection(score, selector.staff, selector.measure, selector.voice, selector.tick);
  }
  static lastNoteSelectionFromSelector(score, selector) {
    return SmoSelection.lastNoteSelection(score, selector.staff, selector.measure, selector.voice, selector.tick);
  }

  // ### getMeasureList
  // Gets the list of measures in an array from the selections
  static getMeasureList(selections) {
    let i = 0;
    let cur = {};
    const rv = [];
    if (!selections.length) {
      return rv;
    }
    cur = selections[0].selector.measure;
    for (i = 0; i < selections.length; ++i) {
      const sel = selections[i];
      if (i === 0 || (sel.selector.measure !== cur)) {
        rv.push({
          selector: {
            staff: sel.selector.staff,
            measure: sel.selector.measure
          },
          staff: sel.staff,
          measure: sel.measure
        });
      }
      cur = sel.selector.measure;
    }
    return rv;
  }

  static lastNoteSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex) {
    const lastTick = tickIndex - 1;
    const lastMeasure = measureIndex - 1;
    const staff = score.staves[staffIndex];
    let measure = staff.measures[measureIndex];
    if (tickIndex > 0) {
      return SmoSelection.noteSelection(score, staffIndex, measureIndex, voiceIndex, lastTick);
    }
    if (lastMeasure >= 0) {
      measure = staff.measures[lastMeasure];
      if (voiceIndex >= measure.voices.length) {
        return null;
      }
      const noteIndex = measure.voices[voiceIndex].notes.length - 1;
      return SmoSelection.noteSelection(score, staffIndex, lastMeasure, voiceIndex, noteIndex);
    }
    if (measureIndex === 0 && voiceIndex === 0 && tickIndex === 0) {
      return null;
    }
    return SmoSelection.noteSelection(score, staffIndex, 0, 0, 0);
  }

  // ### selectionsSameMeasure
  // Return true if the selections are all in the same measure.  Used to determine what
  // type of undo we need.
  static selectionsSameMeasure(selections) {
    let i = 0;
    if (selections.length < 2) {
      return true;
    }
    const sel1 = selections[0].selector;
    for (i = 1; i < selections.length; ++i) {
      if (!SmoSelector.sameMeasure(sel1, selections[i].selector)) {
        return false;
      }
    }
    return true;
  }

  static selectionsSameStaff(selections) {
    let i = 0;
    if (selections.length < 2) {
      return true;
    }
    const sel1 = selections[0].selector;
    for (i = 1; i < selections.length; ++i) {
      if (!SmoSelector.sameStaff(sel1, selections[i].selector)) {
        return false;
      }
    }
    return true;
  }

  constructor(params) {
    this.selector = {
      staff: 0,
      measure: 0,
      voice: 0,
      note: 0,
      pitches: []
    };
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
