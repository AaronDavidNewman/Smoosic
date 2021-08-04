// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScore } from '../data/score';
import { SmoMeasure } from '../data/measure';
import { SmoNote } from '../data/note';
import { SmoSystemStaff } from '../data/systemStaff';
// import { selectionHtmlar } from '../../ui/i18n/language_ar';
// const VF = eval('Vex.Flow');

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
export class SmoSelector {
  static get default(): SmoSelector {
    return {
      staff: 0,
      measure: 0,
      voice: 0,
      tick: 0,
      pitches: []
    };
  }
  staff: number = 0;
  measure: number = 0;
  voice: number = 0;
  tick: number = 0;
  pitches: number[] = [];

  // TODO:  tick in selector s/b tickIndex
  static sameNote(sel1: SmoSelector, sel2: SmoSelector) {
    return (sel1.staff === sel2.staff && sel1.measure === sel2.measure && sel1.voice === sel2.voice
      && sel1.tick === sel2.tick);
  }
  static sameMeasure(sel1: SmoSelector, sel2: SmoSelector) {
    return (sel1.staff === sel2.staff && sel1.measure === sel2.measure);
  }

  static sameStaff(sel1: SmoSelector, sel2: SmoSelector) {
    return sel1.staff === sel2.staff;
  }

  // ## return true if sel1 > sel2.
  static gt(sel1: SmoSelector, sel2: SmoSelector) {
    // Note: voice is not considered b/c it's more of a vertical component
    return sel1.staff > sel2.staff ||
      (sel1.staff === sel2.staff && sel1.measure > sel2.measure) ||
      (sel1.staff === sel2.staff && sel1.measure === sel2.measure && sel1.tick > sel2.tick);
  }

  static eq(sel1: SmoSelector, sel2: SmoSelector) {
    return (sel1.staff === sel2.staff && sel1.measure === sel2.measure && sel1.tick === sel2.tick);
  }
  static neq(sel1: SmoSelector, sel2: SmoSelector) {
    return !(SmoSelector.eq(sel1, sel2));
  }

  static lt(sel1: SmoSelector, sel2: SmoSelector) {
    return SmoSelector.gt(sel2, sel1);
  }

  static gteq(sel1: SmoSelector, sel2: SmoSelector) {
    return SmoSelector.gt(sel1, sel2) || SmoSelector.eq(sel1, sel2);
  }
  static lteq(sel1: SmoSelector, sel2: SmoSelector) {
    return SmoSelector.lt(sel1, sel2) || SmoSelector.eq(sel1, sel2);
  }

  // ### getNoteKey
  // Get a key useful for a hash map of notes.
  static getNoteKey(selector: SmoSelector) {
    return '' + selector.staff + '-' + selector.measure + '-' + selector.voice + '-' + selector.tick;
  }

  static getMeasureKey(selector: SmoSelector) {
    return '' + selector.staff + '-' + selector.measure;
  }

  // ## applyOffset
  // ### Description:
  // offset 'selector' the difference between src and target, return the result
  static applyOffset(src: SmoSelector, target: SmoSelector, selector: SmoSelector) {
    const rv = JSON.parse(JSON.stringify(selector));
    rv.staff += target.staff - src.staff;
    rv.measure += target.measure - src.measure;
    rv.voice += target.voice - src.voice;
    rv.note += target.staff - src.staff;
    return rv;
  }

  // return true if testSel is contained in the selStart to selEnd range.
  static contains(testSel: SmoSelector, selStart: SmoSelector, selEnd: SmoSelector) {
    const geStart =
      selStart.measure < testSel.measure ||
      (selStart.measure === testSel.measure && selStart.tick <= testSel.tick);
    const leEnd =
      selEnd.measure > testSel.measure ||
      (selEnd.measure === testSel.measure && testSel.tick <= selEnd.tick);

    return geStart && leEnd;
  }

  // create a hashmap key for a single note, used to organize modifiers
  static selectorNoteKey(selector: SmoSelector) {
    return 'staff-' + selector.staff + '-measure-' + selector.measure + '-voice-' + selector.voice + '-tick-' + selector.tick;
  }
}
export interface SmoSelectionParams {
  selector: SmoSelector,
  _staff: SmoSystemStaff,
  _measure: SmoMeasure,
  _note?: SmoNote,
  _pitches?: number[],
  type?: string
}
// ## SmoSelection
// ## Description:
// A selection is a selector and a set of references to musical elements, like measure etc.
// The staff and measure are always a part of the selection, and possible a voice and note,
// and one or more pitches.  Selections can also be made from the UI by clicking on an element
// or navigating to an element with the keyboard.
export class SmoSelection {
  selector: SmoSelector = {
    staff: 0,
    measure: 0,
    voice: 0,
    tick: 0,
    pitches: []
  };
  _staff: SmoSystemStaff;
  _measure: SmoMeasure;
  _note: SmoNote | null;
  _pitches: number[] = [];
  // ### measureSelection
  // A selection that does not contain a specific note
  static measureSelection(score: SmoScore, staffIndex: number, measureIndex: number): SmoSelection | null {
    staffIndex = staffIndex !== null ? staffIndex : score.activeStaff;
    const selector = {
      staff: staffIndex,
      measure: measureIndex,
      voice: 0,
      tick: 0,
      pitches: []
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

  static measuresInColumn(score: SmoScore, staffIndex: number) {
    let i = 0;
    const rv = [];
    for (i = 0; i < score.staves.length; ++i) {
      rv.push(SmoSelection.measureSelection(score, i, staffIndex));
    }
    return rv;
  }

  // ### noteSelection
  // a selection that specifies a note in the score
  static noteSelection(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number) {
    staffIndex = staffIndex != null ? staffIndex : score.activeStaff;
    measureIndex = typeof (measureIndex) !== 'undefined' ? measureIndex : 0;
    voiceIndex = typeof (voiceIndex) !== 'undefined' ? voiceIndex : 0;
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
    const selector: SmoSelector = {
      staff: staffIndex,
      measure: measureIndex,
      voice: voiceIndex,
      tick: tickIndex,
      pitches: []
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

  // ### noteFromSelector
  // return a selection based on the passed-in selector
  static noteFromSelector(score: SmoScore, selector: SmoSelector) {
    return SmoSelection.noteSelection(score,
      selector.staff, selector.measure, selector.voice, selector.tick);
  }

  // ### selectionsToEnd
  // Select all the measures from startMeasure to the end of the score in the given staff.
  static selectionsToEnd(score: SmoScore, staff: number, startMeasure: number) {
    let i = 0;
    const rv = [];
    for (i = startMeasure; i < score.staves[staff].measures.length; ++i) {
      rv.push(SmoSelection.measureSelection(score, staff, i));
    }
    return rv;
  }

  // ### renderedNoteSelection
  // return the appropriate type of selection from the selector, based on the selector.
  static selectionFromSelector(score: SmoScore, selector: SmoSelector) {
    if (typeof (selector.pitches) !== 'undefined' && selector.pitches.length) {
      return SmoSelection.pitchSelection(score,
        selector.staff, selector.measure, selector.voice, selector.tick, selector.pitches);
    }
    if (typeof (selector.tick) === 'number') {
      return SmoSelection.noteFromSelector(score, selector);
    }
    return SmoSelection.measureSelection(score, selector.staff, selector.measure);
  }

  static pitchSelection(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number, pitches: number[]) {
    staffIndex = staffIndex !== null ? staffIndex : score.activeStaff;
    measureIndex = typeof (measureIndex) !== 'undefined' ? measureIndex : 0;
    voiceIndex = typeof (voiceIndex) !== 'undefined' ? voiceIndex : 0;
    const staff = score.staves[staffIndex];
    const measure = staff.measures[measureIndex];
    const note = measure.voices[voiceIndex].notes[tickIndex];
    pitches = typeof (pitches) !== 'undefined' ? pitches : [];
    const pa: number[] = [];
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
  static nextNoteSelection(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number) {
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

  static nextNoteSelectionFromSelector(score: SmoScore, selector: SmoSelector) {
    return SmoSelection.nextNoteSelection(score, selector.staff, selector.measure, selector.voice, selector.tick);
  }
  static lastNoteSelectionFromSelector(score: SmoScore, selector: SmoSelector) {
    return SmoSelection.lastNoteSelection(score, selector.staff, selector.measure, selector.voice, selector.tick);
  }

  static lastNoteSelection(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number) {
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
  // ### getMeasureList
  // Gets the list of measures in an array from the selections
  static getMeasureList(selections: SmoSelection[]): SmoSelection[] {
    let i = 0;
    let cur = {};
    const rv: SmoSelection[] = [];
    if (!selections.length) {
      return rv;
    }
    cur = selections[0].selector.measure;
    for (i = 0; i < selections.length; ++i) {
      const sel: SmoSelection = selections[i];
      if (i === 0 || (sel.selector.measure !== cur)) {
        const _staff: SmoSystemStaff = sel._staff;
        const _measure: SmoMeasure = sel._measure;
        rv.push(
          new SmoSelection({
            selector: {
              staff: sel.selector.staff,
              measure: sel.selector.measure,
              voice: 0,
              tick: 0,
              pitches: []
            },
            _staff,
            _measure
          }));
      }
      cur = sel.selector.measure;
    }
    return rv;
  }
  // ### selectionsSameMeasure
  // Return true if the selections are all in the same measure.  Used to determine what
  // type of undo we need.
  static selectionsSameMeasure(selections: SmoSelection[]) {
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

  static selectionsSameStaff(selections: SmoSelection[]) {
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

  constructor(params: SmoSelectionParams) {
    this.selector = {
      staff: 0,
      measure: 0,
      voice: 0,
      tick: 0,
      pitches: []
    };
    this._staff = params._staff;
    this._measure = params._measure;
    this._note = null;
    this._pitches = [];
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
    return this.selector.pitches;
  }
}
