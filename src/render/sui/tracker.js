// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { suiMapper } from './mapper';
import { svgHelpers } from '../../common/svgHelpers';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { SuiRenderState } from './renderState';
import { htmlHelpers } from '../../common/htmlHelpers';
import { smoSerialize } from '../../common/serializationHelpers';
import { suiOscillator } from '../audio/oscillator';

// ## suiTracker
// A tracker maps the UI elements to the logical elements ,and allows the user to
// move through the score and make selections, for navigation and editing.
//
// ### See also:
// `suiBaseLayout`, `controller`, `menu`
// ### class methods:
// ---
export class suiTracker extends suiMapper {
  constructor(renderer, scroller, pasteBuffer) {
    super(renderer, scroller, pasteBuffer);
    this.idleTimer = Date.now();
  }
  // ### _checkBoxOffset
  // If the mapped note and actual note don't match, re-render the notes so they do.
  // Otherwise the selections are off.
  _checkBoxOffset() {
    const note = this.selections[0].note;
    const r = note.renderedBox;
    const abs = svgHelpers.logicalToClient(this.renderer.context.svg, note.logicalBox, this.scroller);
    const ydiff = Math.abs(r.y - abs.y);
    const xdiff = Math.abs(r.x - abs.x);
    const preventScroll = $('body').hasClass('modal');

    if (ydiff > 1 || xdiff > 1) {
      if (this.renderer.passState === SuiRenderState.passStates.replace ||
        this.renderer.passState === SuiRenderState.passStates.clean) {
        console.log('tracker: rerender conflicting map');
        this.renderer.remapAll();
      }
      if (!preventScroll) {
        console.log('prevent scroll conflicting map');
        $('body').addClass('modal');
        this.renderer.renderPromise().then(() => {
          $('body').removeClass('modal');
        });
      }
    }
  }

  replaceSelectedMeasures() {
    const mm = SmoSelection.getMeasureList(this.selections);
    this.renderer.addToReplaceQueue(mm);
  }

  setDialogModifier(notifier) {
    this.modifierDialogFactory = notifier;
  }

  // ### renderElement
  // the element the score is rendered on
  get renderElement() {
    return this.renderer.renderer.elementId;
  }

  get score() {
    return this.renderer.score;
  }

  get context() {
    return this.renderer.renderer.getContext();
  }

  // Hack - lyric should be handled consistently
  _reboxTextModifier(modifier) {
    let el = null;
    if (modifier.attrs.type === 'SmoGraceNote') {
      el = this.context.svg.getElementById('vf-' + modifier.renderId);
    } else if (modifier.attrs.type !== 'SmoLyric') {
      el = this.context.svg.getElementsByClassName(modifier.attrs.id)[0];
    }
    if (!el) {
      return;
    }
    svgHelpers.updateArtifactBox(this.context.svg, el, modifier, this.scroller);
  }

  clearMusicCursor() {
    $('.workspace #birdy').remove();
  }

  // ### musicCursor
  // the little birdie that follows the music as it plays
  musicCursor(selector) {
    const key = SmoSelector.getNoteKey(selector);
    // Get note from 0th staff if we can
    if (this.measureNoteMap[key]) {
      const measureSel = SmoSelection.measureSelection(this.renderer.score,
        this.renderer.score.staves.length - 1, selector.measure);
      const zmeasureSel = SmoSelection.measureSelection(this.renderer.score,
        0, selector.measure);
      const measure = measureSel.measure;
      const mbox = measure.svg.renderedBox;
      const pos = this.measureNoteMap[key].scrollBox;
      const b = htmlHelpers.buildDom;
      const r = b('span').classes('birdy icon icon-arrow-down').attr('id', 'birdy');
      $('.workspace #birdy').remove();
      const rd = r.dom();
      const y = (zmeasureSel.measure.svg.renderedBox.y - zmeasureSel.measure.svg.renderedBox.height) - this.scroller.netScroll.y;
      const x = pos.x;
      $(rd).css('top', y).css('left', x);
      $('.workspace').append(rd);
      // todo, need lower right for x
      this.scroller.scrollVisibleBox(svgHelpers.boxPoints(
        mbox.x, mbox.y, mbox.width, mbox.height));
    }
  }

  // ### selectModifierById
  // programatically select a modifier by ID.  Used by text editor.
  selectId(id) {
    this.modifierIndex = this.modifierTabs.findIndex((mm) =>  mm.modifier.attrs.id === id);
  }

  getSelectedModifier() {
    if (this.modifierSelections.length) {
      return this.modifierSelections[0];
    }
    return null;
  }

  getSelectedModifiers() {
    return this.modifierSelections;
  }

  static serializeEvent(evKey) {
    const rv = {};
    smoSerialize.serializedMerge(['type', 'shiftKey', 'ctrlKey', 'altKey', 'key', 'keyCode'], evKey, rv);
    return rv;
  }

  advanceModifierSelection(keyEv) {
    if (this.recordBuffer) {
      this.recordBuffer.addAction('advanceModifierSelection', suiTracker.serializeEvent(keyEv));
    }

    this.idleTimer = Date.now();
    this.eraseRect('staffModifier');
    const offset = keyEv.key === 'ArrowLeft' ? -1 : 1;

    if (!this.modifierTabs.length) {
      return;
    }
    this.modifierIndex = this.modifierIndex + offset;
    this.modifierIndex = (this.modifierIndex === -2 && this.localModifiers.length) ?
      this.localModifiers.length - 1 : this.modifierIndex;
    if (this.modifierIndex >= this.localModifiers.length || this.modifierIndex < 0) {
      this.modifierIndex = -1;
      this.modifierSelections = [];
      return;
    }
    this.modifierSelections = [this.localModifiers[this.modifierIndex]];
    this._highlightModifier();
  }

  static stringifyBox(box) {
    return '{x:' + box.x + ',y:' + box.y + ',width:' + box.width + ',height:' + box.height + '}';
  }

  // ### _getOffsetSelection
  // Get the selector that is the offset of the first existing selection
  _getOffsetSelection(offset) {
    let testSelection = this.getExtremeSelection(Math.sign(offset));
    const scopyTick = JSON.parse(JSON.stringify(testSelection.selector));
    const scopyMeasure = JSON.parse(JSON.stringify(testSelection.selector));
    scopyTick.tick += offset;
    scopyMeasure.measure += offset;
    const targetMeasure = SmoSelection.measureSelection(this.score, testSelection.selector.staff,
      scopyMeasure.measure);
    if (targetMeasure && targetMeasure.measure && targetMeasure.measure.voices.length <= scopyMeasure.voice) {
      scopyMeasure.voice = 0;
    }
    if (targetMeasure && targetMeasure.measure) {
      scopyMeasure.tick = (offset < 0) ? targetMeasure.measure.voices[scopyMeasure.voice].notes.length - 1 : 0;
    }

    if (testSelection.measure.voices.length > scopyTick.voice &&
      testSelection.measure.voices[scopyTick.voice].notes.length > scopyTick.tick && scopyTick.tick >= 0) {
      if (testSelection.selector.voice !== testSelection.measure.getActiveVoice()) {
        scopyTick.voice = testSelection.measure.getActiveVoice();
        testSelection = this._getClosestTick(scopyTick);
        return testSelection.selector;
      }
      return scopyTick;
    } else if (targetMeasure &&
      scopyMeasure.measure < testSelection.staff.measures.length && scopyMeasure.measure >= 0) {
      return scopyMeasure;
    }
    return testSelection.selector;
  }

  getSelectedGraceNotes() {
    if (!this.modifierSelections.length) {
      return [];
    }
    const ff = this.modifierSelections.filter((mm) =>
      mm.modifier.attrs.type === 'SmoGraceNote'
    );
    return ff;
  }

  isGraceNoteSelected() {
    if (this.modifierSelections.length) {
      const ff = this.modifierSelections.findIndex((mm) => mm.modifier.attrs.type === 'SmoGraceNote');
      return ff >= 0;
    }
    return false;
  }

  _growGraceNoteSelections(offset) {
    this.idleTimer = Date.now();
    const far = this.modifierSelections.filter((mm) => mm.modifier.attrs.type === 'SmoGraceNote');
    if (!far.length) {
      return;
    }
    const ix = (offset < 0) ? 0 : far.length - 1;
    const sel = far[ix];
    const left = this.modifierTabs.filter((mt) =>
      mt.modifier.attrs.type === 'SmoGraceNote' && SmoSelector.sameNote(mt.selection.selector, sel.selection.selector)
    );
    if (ix + offset < 0 || ix + offset >= left.length) {
      return;
    }
    this.modifierSelections.push(left[ix + offset]);
    this._highlightModifier();
  }
  get autoPlay() {
    return this.renderer.score.preferences.autoPlay;
  }

  growSelectionRight() {
    if (this.recordBuffer) {
      this.recordBuffer.addAction('growSelectionRight');
    }
    this._growSelectionRight(false);
  }
  _growSelectionRight(skipPlay) {
    this.idleTimer = Date.now();
    if (this.isGraceNoteSelected()) {
      this._growGraceNoteSelections(1);
      return 0;
    }
    const nselect = this._getOffsetSelection(1);
    // already selected
    const artifact = this._getClosestTick(nselect);
    if (!artifact) {
      return 0;
    }
    if (this.selections.find((sel) => SmoSelector.sameNote(sel.selector, artifact.selector))) {
      return 0;
    }
    if (!this.mapping && this.autoPlay && skipPlay === false) {
      suiOscillator.playSelectionNow(artifact);
    }
    this.selections.push(artifact);
    this.deferHighlight();
    this._createLocalModifiersList();
    return artifact.note.tickCount;
  }
  moveHome(evKey) {
    evKey = typeof(evKey) === 'undefined' || evKey === null ? {} : evKey;
    if (this.recordBuffer) {
      this.recordBuffer.addAction('moveHome', suiTracker.serializeEvent(evKey));
    }
    this.idleTimer = Date.now();
    const ls = this.selections[0].staff;
    if (evKey.ctrlKey) {
      const mm = ls.measures[0];
      const homeSel = this._getClosestTick({ staff: ls.staffId,
        measure: 0, voice: mm.getActiveVoice(), tick: 0 });
      if (evKey.shiftKey) {
        this._selectBetweenSelections(this.selections[0], homeSel);
      } else {
        this.selections = [homeSel];
        this.deferHighlight();
        this._createLocalModifiersList();
        if (homeSel.measure.svg.renderedBox) {
          this.scroller.scrollVisibleBox(homeSel.measure.svg.renderedBox);
        }
      }
    } else {
      const system = this.selections[0].measure.lineIndex;
      const lm = ls.measures.find((mm) =>
        mm.lineIndex === system && mm.measureNumber.systemIndex === 0);
      const homeSel = this._getClosestTick({ staff: ls.staffId,
        measure: lm.measureNumber.measureIndex, voice: lm.getActiveVoice(),
        tick: 0 });
      if (evKey.shiftKey) {
        this._selectBetweenSelections(this.selections[0], homeSel);
      } else {
        this.selections = [homeSel];
        this.scroller.scrollVisibleBox(homeSel.measure.svg.renderedBox);
        this.deferHighlight();
        this._createLocalModifiersList();
      }
    }
  }
  moveEnd(evKey) {
    evKey = typeof(evKey) === 'undefined' || evKey === null ? {} : evKey;
    if (this.recordBuffer) {
      this.recordBuffer.addAction('moveEnd', suiTracker.serializeEvent(evKey));
    }
    this.idleTimer = Date.now();
    const ls = this.selections[0].staff;
    if (evKey.ctrlKey) {
      const lm = ls.measures[ls.measures.length - 1];
      const voiceIx = lm.getActiveVoice();
      const voice = lm.voices[voiceIx];
      const endSel = this._getClosestTick({ staff: ls.staffId,
        measure: ls.measures.length - 1, voice: voiceIx, tick: voice.notes.length - 1 });
      if (evKey.shiftKey) {
        this._selectBetweenSelections(this.selections[0], endSel);
      } else {
        this.selections = [endSel];
        this.deferHighlight();
        this._createLocalModifiersList();
        if (endSel.measure.svg.renderedBox) {
          this.scroller.scrollVisibleBox(endSel.measure.svg.renderedBox);
        }
      }
    } else {
      const system = this.selections[0].measure.lineIndex;
      // find the largest measure index on this staff in this system
      const measures = ls.measures.filter((mm) =>
        mm.lineIndex === system);
      const lm = measures.reduce((a, b) =>
        b.measureNumber.measureIndex > a.measureNumber.measureIndex ? b : a);
      const ticks = lm.voices[lm.getActiveVoice()].notes.length;
      const endSel = this._getClosestTick({ staff: ls.staffId,
        measure: lm.measureNumber.measureIndex, voice: lm.getActiveVoice(), tick: ticks - 1 });
      if (evKey.shiftKey) {
        this._selectBetweenSelections(this.selections[0], endSel);
      } else {
        this.selections = [endSel];
        this.deferHighlight();
        this._createLocalModifiersList();
        if (endSel.measure.svg.renderedBox) {
          this.scroller.scrollVisibleBox(endSel.measure.svg.renderedBox);
        }
      }
    }
  }
  growSelectionRightMeasure() {
    let toSelect = 0;
    const rightmost = this.getExtremeSelection(1);
    const ticksLeft = rightmost.measure.voices[rightmost.measure.activeVoice]
      .notes.length - rightmost.selector.tick;
    if (this.recordBuffer) {
      this.recordBuffer.addAction('growSelectionRightMeasure');
    }
    if (ticksLeft === 0) {
      if (rightmost.selector.measure < rightmost.staff.measures.length) {
        const mix = rightmost.selector.measure + 1;
        toSelect = rightmost.staff.measures[mix]
          .voices[rightmost.staff.measures[mix].activeVoice].notes.length;
      }
    } else {
      toSelect = ticksLeft;
    }
    while (toSelect > 0) {
      this._growSelectionRight(true);
      toSelect -= 1;
    }
  }

  growSelectionLeft() {
    if (this.isGraceNoteSelected()) {
      this._growGraceNoteSelections(-1);
      return 0;
    }
    if (this.recordBuffer) {
      this.recordBuffer.addAction('growSelectionLeft');
    }
    this.idleTimer = Date.now();
    const nselect = this._getOffsetSelection(-1);
    // already selected
    const artifact = this._getClosestTick(nselect);
    if (!artifact) {
      return 0;
    }
    if (this.selections.find((sel) => SmoSelector.sameNote(sel.selector, artifact.selector))) {
      return 0;
    }
    this.selections.push(artifact);
    if (this.autoPlay) {
      suiOscillator.playSelectionNow(artifact);
    }
    this.deferHighlight();
    this._createLocalModifiersList();
    return artifact.note.tickCount;
  }

  // if we are being moved right programmatically, avoid playing the selected note.
  moveSelectionRight(evKey, skipPlay) {
    evKey = typeof(evKey) === 'undefined' || evKey === null ? {} : evKey;
    if (this.selections.length === 0) {
      return;
    }
    if (this.recordBuffer) {
      this.recordBuffer.addAction('moveSelectionRight', suiTracker.serializeEvent(evKey));
    }
    const nselect = this._getOffsetSelection(1);
    this._replaceSelection(nselect, skipPlay);
  }

  moveSelectionLeft() {
    if (this.selections.length === 0) {
      return;
    }
    if (this.recordBuffer) {
      this.recordBuffer.addAction('moveSelectionLeft');
    }
    const nselect = this._getOffsetSelection(-1);
    this._replaceSelection(nselect);
  }
  moveSelectionLeftMeasure() {
    if (this.recordBuffer) {
      this.recordBuffer.addAction('moveSelectionLeftMeasure');
    }
    this._moveSelectionMeasure(-1);
  }
  moveSelectionRightMeasure() {
    if (this.recordBuffer) {
      this.recordBuffer.addAction('moveSelectionRightMeasure');
    }
    this._moveSelectionMeasure(1);
  }
  moveSelectionOffset(offset) {
    let i = 0;
    const fcn = (offset >= 0 ? 'moveSelectionRight' : 'moveSelectionLeft');
    offset = (offset < 0) ? -1 * offset : offset;
    for (i = 0; i < offset; ++i) {
      this[fcn]();
    }
  }

  _moveSelectionMeasure(offset) {
    let selection = this.getExtremeSelection(Math.sign(offset));
    this.idleTimer = Date.now();
    selection = JSON.parse(JSON.stringify(selection.selector));
    selection.measure += offset;
    selection.tick = 0;
    const selObj = this._getClosestTick(selection);
    if (selObj) {
      this.selections = [selObj];
    }
    this.deferHighlight();
    this._createLocalModifiersList();
  }

  setSelection(selection) {
    const selObj = this._getClosestTick(selection);
    this.idleTimer = Date.now();
    if (selObj) {
      this.selections = [selObj];
    }
    this.deferHighlight();
  }

  _moveStaffOffset(offset) {
    if (this.selections.length === 0) {
      return;
    }
    this.idleTimer = Date.now();
    const nselector = JSON.parse(JSON.stringify(this.selections[0].selector));
    nselector.staff = this.score.incrementActiveStaff(offset);
    this.selections = [this._getClosestTick(nselector)];
    this.deferHighlight();
    this._createLocalModifiersList();
  }

  // ### _moveSelectionPitch
  // Suggest a specific pitch in a chord, so we can transpose just the one note vs. the whole chord.
  _moveSelectionPitch(index) {
    this.idleTimer = Date.now();
    if (!this.selections.length) {
      return;
    }
    const sel = this.selections[0];
    const note = sel.note;
    if (note.pitches.length < 2) {
      this.pitchIndex = -1;
      return;
    }
    this.pitchIndex = (this.pitchIndex + index) % note.pitches.length;
    sel.selector.pitches = [];
    sel.selector.pitches.push(this.pitchIndex);
    this._highlightPitchSelection(note, this.pitchIndex);
  }
  moveSelectionPitchUp() {
    if (this.recordBuffer) {
      this.recordBuffer.addAction('moveSelectionPitchUp');
    }
    this._moveSelectionPitch(1);
  }
  moveSelectionPitchDown() {
    if (!this.selections.length) {
      return;
    }
    if (this.recordBuffer) {
      this.recordBuffer.addAction('moveSelectionPitchDown');
    }
    this._moveSelectionPitch(this.selections[0].note.pitches.length - 1);
  }

  moveSelectionUp() {
    if (this.recordBuffer) {
      this.recordBuffer.addAction('moveSelectionUp');
    }
    this._moveStaffOffset(-1);
  }
  moveSelectionDown() {
    if (this.recordBuffer) {
      this.recordBuffer.addAction('moveSelectionDown');
    }
    this._moveStaffOffset(1);
  }

  containsArtifact() {
    return this.selections.length > 0;
  }

  _replaceSelection(nselector, skipPlay) {
    var artifact = SmoSelection.noteSelection(this.score, nselector.staff, nselector.measure, nselector.voice, nselector.tick);
    if (!artifact) {
      artifact = SmoSelection.noteSelection(this.score, nselector.staff, nselector.measure, 0, nselector.tick);
    }
    if (!artifact) {
      artifact = SmoSelection.noteSelection(this.score, nselector.staff, nselector.measure, 0, 0);
    }
    if (!artifact) {
      // disappeared - default to start
      artifact = SmoSelection.noteSelection(this.score, 0, 0, 0, 0);
    }
    if (!skipPlay && this.autoPlay) {
      suiOscillator.playSelectionNow(artifact);
    }

    // clear modifier selections
    this.clearModifierSelections();
    this.score.setActiveStaff(nselector.staff);
    const mapKey = Object.keys(this.measureNoteMap).find((k) =>
      SmoSelector.sameNote(this.measureNoteMap[k].selector, artifact.selector)
    );
    if (!mapKey) {
      return;
    }
    const mapped = this.measureNoteMap[mapKey];
    // If this is a new selection, remove pitch-specific and replace with note-specific
    if (!nselector.pitches || nselector.pitches.length === 0) {
      this.pitchIndex = -1;
    }

    this.selections = [mapped];
    this.deferHighlight();
    this._createLocalModifiersList();
  }

  getFirstMeasureOfSelection() {
    if (this.selections.length) {
      return this.selections[0].measure;
    }
    return null;
  }
  // ## measureIterator
  // Description: iterate over the any measures that are part of the selection
  getSelectedMeasures() {
    const set = [];
    const rv = [];
    this.selections.forEach((sel) => {
      const measure = SmoSelection.measureSelection(this.score, sel.selector.staff, sel.selector.measure);
      const ix = measure.selector.measure;
      if (set.indexOf(ix) === -1) {
        set.push(ix);
        rv.push(measure);
      }
    });
    return rv;
  }

  _selectFromToInStaff(sel1, sel2) {
    this.selections = [];
    this.idleTimer = Date.now();
    const order = [sel1, sel2].sort((a, b) => SmoSelector.lteq(a.selector, b.selector) ? -1 : 1);

    // TODO: we could iterate directly over the selectors, that would be faster
    Object.keys(this.measureNoteMap).forEach((k) => {
      const obj = this.measureNoteMap[k];
      if (SmoSelector.gteq(obj.selector, order[0].selector) && SmoSelector.lteq(obj.selector, order[1].selector)) {
        this.selections.push(obj);
      }
    });
  }

  _addSelection(selection) {
    const ar = this.selections.filter((sel) =>
      SmoSelector.neq(sel.selector, selection.selector)
    );
    if (this.autoPlay) {
      suiOscillator.playSelectionNow(selection);
    }
    ar.push(selection);
    this.selections = ar;
  }

  recordSelectSuggestion(ev, selector) {
    if (this.recordBuffer) {
      this.recordBuffer.addAction('selectSuggestionNote', selector, suiTracker.serializeEvent(ev));
    }
  }
  recordModifierSelectSuggestion(ev) {
    if (this.recordBuffer) {
      const artifact = this.modifierTabs[this.modifierSuggestion];
      if (!artifact) {
        this.clearModifierSelections();
        return; // in SVG but not in model, ignore.
      }
      const modKey = artifact.modifier.serialize();
      if (artifact === null || artifact.selection === null) {
        return;
      }
      const selector = artifact.selection.selector;
      this.recordBuffer.addAction('selectSuggestionModifier', selector,
        suiTracker.serializeEvent(ev), modKey);
    }
  }
  _selectBetweenSelections(s1, s2) {
    const min = SmoSelector.gt(s1.selector, s2.selector) ? s2 : s1;
    const max = SmoSelector.lt(min.selector, s2.selector) ? s2 : s1;
    this._selectFromToInStaff(min, max);
    this._createLocalModifiersList();
    this.deferHighlight();
  }
  // ### _matchSelectionToModifier
  // assumes a modifier is selected
  _matchSelectionToModifier() {
    const mod = this.modifierSelections[0].modifier;
    if (mod.startSelector && mod.endSelector) {
      const s1 = SmoSelection.noteFromSelector(this.score, mod.startSelector);
      const s2 = SmoSelection.noteFromSelector(this.score, mod.endSelector);
      this._selectBetweenSelections(s1, s2);
    }
  }
  selectSuggestion(ev) {
    if ((!this.suggestion || this.suggestion.measure) && this.modifierSuggestion < 0) {
      return;
    }
    this.idleTimer = Date.now();

    if (this.modifierSuggestion >= 0) {
      if (this.suggestFadeTimer) {
        clearTimeout(this.suggestFadeTimer);
      }
      this.recordModifierSelectSuggestion(ev);
      this.modifierIndex = -1;
      this.modifierSelections = [this.modifierTabs[this.modifierSuggestion]];
      this.modifierSuggestion = -1;
      // If we selected due to a mouse click, move the selection to the
      // selected modifier
      // this._matchSelectionToModifier();
      this._highlightModifier();
      return;
    } else if (ev.type === 'click') {
      this.clearModifierSelections(); // if we click on a non-modifier, clear the
      // modifier selections
    }

    if (ev.shiftKey) {
      const sel1 = this.getExtremeSelection(-1);
      if (sel1.selector.staff === this.suggestion.selector.staff) {
        this.recordSelectSuggestion(ev, this.suggestion.selector);
        this._selectBetweenSelections(sel1, this.suggestion);
        return;
      }
    }

    if (ev.ctrlKey) {
      this.recordSelectSuggestion(ev, this.suggestion.selector);
      this._addSelection(this.suggestion);
      this._createLocalModifiersList();
      this.deferHighlight();
      return;
    }
    if (this.autoPlay) {
      suiOscillator.playSelectionNow(this.suggestion);
    }

    const preselected = this.selections[0] ?
      SmoSelector.sameNote(this.suggestion.selector, this.selections[0].selector) && this.selections.length === 1 : false;

    if (preselected && this.selections[0].note.pitches.length > 1) {
      this.pitchIndex =  (this.pitchIndex + 1) % this.selections[0].note.pitches.length;
      this.selections[0].selector.pitches = [this.pitchIndex];
      this.recordSelectSuggestion(ev, this.selections[0].selector);
    } else {
      this.recordSelectSuggestion(ev, this.suggestion.selector);
      this.selections = [this.suggestion];
    }
    if (preselected && this.modifierTabs.length) {
      const mods  = this.modifierTabs.filter((mm) => mm.selection && SmoSelector.sameNote(mm.selection.selector, this.selections[0].selector));
      if (mods.length) {
        this.modifierSelections[0] = mods[0];
        this.modifierIndex = mods[0].index;
        this._highlightModifier();
        return;
      }
    }
    this.score.setActiveStaff(this.selections[0].selector.staff);
    this.deferHighlight();
    this._createLocalModifiersList();
  }

  static get strokes() {
    return {
      'suggestion': {
        'stroke': '#fc9',
        'stroke-width': 2,
        'stroke-dasharray': '4,1',
        'fill': 'none'
      },
      'selection': {
        'stroke': '#99d',
        'stroke-width': 2,
        'fill': 'none'
      },
      'staffModifier': {
        'stroke': '#933',
        'stroke-width': 2,
        'fill': 'none'
      }
    };
  }

  _setFadeTimer() {
    if (this.suggestFadeTimer) {
      clearTimeout(this.suggestFadeTimer);
    }
    const tracker = this;
    this.suggestFadeTimer = setTimeout(() => {
      if (tracker.containsArtifact()) {
        tracker.eraseRect('suggestion');
        tracker.modifierSuggestion = -1;
      }
    }, 1000);
  }

  _setModifierAsSuggestion(bb, artifact) {
    this.modifierSuggestion = artifact.index;
    this._drawRect(artifact.box, 'suggestion');
    this._setFadeTimer();
  }

  _setArtifactAsSuggestion(bb, artifact) {
    const sameSel =
      this.selections.find((ss) => SmoSelector.sameNote(ss.selector, artifact.selector));

    if (sameSel) {
      return;
    }
    this.modifierSuggestion = -1;

    this.suggestion = artifact;
    this._drawRect(artifact.box, 'suggestion');
    this._setFadeTimer();
  }

  eraseAllSelections() {
    const strokeKeys = Object.keys(suiTracker.strokes);
    strokeKeys.forEach((key) => {
      this.eraseRect(key);
    });
  }

  eraseRect(stroke) {
    $(this.renderElement).find('g.vf-' + stroke).remove();
  }

  _highlightModifier() {
    let box = null;
    if (!this.modifierSelections.length) {
      return;
    }
    this.modifierSelections.forEach((artifact) => {
      if (!box) {
        box = artifact.modifier.renderedBox;
      } else {
        box = svgHelpers.unionRect(box, artifact.modifier.renderedBox);
      }
    });
    this._drawRect(box, 'staffModifier');
  }

  _highlightPitchSelection(note, index) {
    this.eraseAllSelections();
    const noteDiv = $(this.renderElement).find('#' + note.renderId);
    const heads = noteDiv.find('.vf-notehead');
    if (!heads.length) {
      return;
    }
    const headEl = heads[index];
    const lbox = svgHelpers.smoBox(headEl.getBBox());
    const box = svgHelpers.logicalToClient(this.context.svg, lbox, this.scroller);
    this._drawRect(box, 'staffModifier');
  }

  _highlightActiveVoice(selection) {
    let i = 0;
    const selector = selection.selector;
    for (i = 1; i <= 4; ++i) {
      const cl = 'v' + i.toString() + '-active';
      $('body').removeClass(cl);
    }
    const c2 = 'v' + (selector.voice + 1).toString() + '-active';
    $('body').addClass(c2);
  }
  // The user has just switched voices, select the active voice
  selectActiveVoice() {
    const selection = this.selections[0];
    const selector = JSON.parse(JSON.stringify(selection.selector));
    selector.voice = selection.measure.activeVoice;
    this.selections = [this._getClosestTick(selector)];
    this.deferHighlight();
  }

  highlightSelection() {
    let i = 0;
    let prevSel = {};
    let curBox = {};
    this.idleTimer = Date.now();
    const grace = this.getSelectedGraceNotes();
    // If this is not a note with grace notes, logically unselect the grace notes
    if (grace.length) {
      if (!SmoSelector.sameNote(grace[0].selection.selector, this.selections[0].selector)) {
        this.clearModifierSelections();
      } else {
        this._highlightModifier();
        return;
      }
    }
    if (this.pitchIndex >= 0 && this.selections.length === 1 &&
      this.pitchIndex < this.selections[0].note.pitches.length) {
      this._highlightPitchSelection(this.selections[0].note, this.pitchIndex);
      this._highlightActiveVoice(this.selections[0]);
      return;
    }

    this.pitchIndex = -1;
    this.eraseAllSelections();
    if (this.selections.length === 1 && this.selections[0].note.renderedBox) {
      this._checkBoxOffset();
      this._drawRect(this.selections[0].note.renderedBox, 'selection');
      this._highlightActiveVoice(this.selections[0]);
      return;
    }
    const sorted = this.selections.sort((a, b) => SmoSelector.gt(a.selector, b.selector) ? 1 : -1);
    prevSel = sorted[0];
    // rendered yet?
    if (!prevSel || !prevSel.box) {
      return;
    }
    curBox = svgHelpers.smoBox(prevSel.box);
    const boxes = [];
    for (i = 1; i < sorted.length; ++i) {
      const sel = sorted[i];
      const ydiff = Math.abs(prevSel.box.y - sel.box.y);
      if (sel.selector.staff === prevSel.selector.staff && ydiff < 1.0) {
        curBox = svgHelpers.unionRect(curBox, sel.box);
      } else {
        boxes.push(curBox);
        curBox = sel.box;
      }
      this._highlightActiveVoice(sel);
      prevSel = sel;
    }
    boxes.push(curBox);
    this._drawRect(boxes, 'selection');
  }

  _suggestionParameters(box, strokeName) {
    const outlineStroke = suiTracker.strokes[strokeName];
    return {
      context: this.context, box, classes: strokeName,
      outlineStroke, scroller: this.scroller
    };
  }

  _drawRect(bb, stroke) {
    svgHelpers.outlineRect(this._suggestionParameters(bb, stroke));
  }
}
