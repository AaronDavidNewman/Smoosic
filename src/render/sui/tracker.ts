// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiMapper, LocalModifier, SuiRendererBase } from './mapper';
import { SvgHelpers, StrokeInfo, OutlineInfo } from './svgHelpers';
import { SmoSelection, SmoSelector, ModifierTab } from '../../smo/xform/selections';
import { SuiRenderState } from './renderState';
import { htmlHelpers } from '../../common/htmlHelpers';
import { smoSerialize } from '../../common/serializationHelpers';
import { SuiOscillator } from '../audio/oscillator';
import { SmoActionRecord } from '../../smo/xform/actions';
import { SmoScore } from '../../smo/data/score';
import { StaffModifierBase } from '../../smo/data/staffModifiers';
import { SvgBox, SvgPoint } from '../../smo/data/common';
import { SuiScroller } from './scroller';
import { PasteBuffer } from '../../smo/xform/copypaste';
import { SmoNote } from '../../smo/data/note';
import { SmoMeasure } from '../../smo/data/measure';
import { KeyEvent } from '../../application/common';

declare var $: any;

/**
 * SuiTracker
 A tracker maps the UI elements to the logical elements ,and allows the user to
 move through the score and make selections, for navigation and editing.
 */
export class SuiTracker extends SuiMapper {
  idleTimer: number = Date.now();
  recordBuffer: SmoActionRecord | null = null;
  // timer: NodeJS.Timer | null = null;
  suggestFadeTimer: NodeJS.Timer | null = null;
  constructor(renderer: SuiRendererBase, scroller: SuiScroller, pasteBuffer: PasteBuffer) {
    super(renderer, scroller, pasteBuffer);
  }
  // ### _checkBoxOffset
  // If the mapped note and actual note don't match, re-render the notes so they do.
  // Otherwise the selections are off.
  _checkBoxOffset() {
    const note = this.selections[0].note as SmoNote;
    const r = note.renderedBox;
    if (!r) {
      return;
    }
    const abs = SvgHelpers.logicalToClient(this.renderer.svg, SvgHelpers.smoBox(note.logicalBox), this.scroller.scrollState.scroll);
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

  // ### renderElement
  // the element the score is rendered on
  get renderElement(): Element {
    return this.renderer.renderElement;
  }

  get score(): SmoScore | null {
    return this.renderer.score;
  }

  get svg(): SVGSVGElement {
    return this.renderer.svg;
  }

  clearMusicCursor() {
    $('.workspace #birdy').remove();
  }

  // ### musicCursor
  // the little birdie that follows the music as it plays
  musicCursor(selector: SmoSelector) {
    const key = SmoSelector.getNoteKey(selector);
    if (!this.score) {
      return;
    }
    // Get note from 0th staff if we can
    if (this.measureNoteMap[key]) {
      const measureSel = SmoSelection.measureSelection(this.score,
        this.score.staves.length - 1, selector.measure);
      const zmeasureSel = SmoSelection.measureSelection(this.score,
        0, selector.measure);
      const measure = measureSel?.measure as SmoMeasure;
      const y1: number = zmeasureSel?.measure?.svg?.renderedBox?.y ?? 0;
      const y2: number = zmeasureSel?.measure?.svg?.renderedBox?.height ?? 0;
      const sy: number = this.scroller.netScroll.y;
      const y = (y1 - y2) - sy;

      const mbox = measure?.svg?.renderedBox ?? SvgBox.default;
      const noteSel = this.measureNoteMap[key] as SmoSelection;
      const pos: SvgPoint = noteSel.scrollBox ?? SvgPoint.default;
      const b = htmlHelpers.buildDom;
      const r = b('span').classes('birdy icon icon-arrow-down').attr('id', 'birdy');
      $('.workspace #birdy').remove();
      const rd = r.dom();
      const x = pos.x;
      $(rd).css('top', y).css('left', x);
      $('.workspace').append(rd);
      // todo, need lower right for x
      if (mbox) {
      this.scroller.scrollVisibleBox(SvgHelpers.boxPoints(
        mbox.x, mbox.y, mbox.width, mbox.height));
      }
    }
  }

  // ### selectModifierById
  // programatically select a modifier by ID.  Used by text editor.
  selectId(id: string) {
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

  static serializeEvent(evKey: KeyEvent | null): any {
    if (!evKey) {
      return [];
    }
    const rv = {};
    smoSerialize.serializedMerge(['type', 'shiftKey', 'ctrlKey', 'altKey', 'key', 'keyCode'], evKey, rv);
    return rv;
  }

  advanceModifierSelection(keyEv: KeyEvent | null) {
    if (!keyEv) {
      return;
    }
    if (this.recordBuffer) {
      this.recordBuffer.addAction('advanceModifierSelection', SuiTracker.serializeEvent(keyEv));
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
    const local: LocalModifier = this.localModifiers[this.modifierIndex];
    const box: SvgBox = SvgHelpers.smoBox(local.box) as SvgBox;
    this.modifierSelections = [{ index: 0, box, modifier: local.modifier, selection: local.selection }];
    this._highlightModifier();
  }

  static stringifyBox(box: SvgBox): string {
    return '{x:' + box.x + ',y:' + box.y + ',width:' + box.width + ',height:' + box.height + '}';
  }

  // ### _getOffsetSelection
  // Get the selector that is the offset of the first existing selection
  _getOffsetSelection(offset: number): SmoSelector {
    if (!this.score) {
      return SmoSelector.default;
    }
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

  getSelectedGraceNotes(): ModifierTab[] {
    if (!this.modifierSelections.length) {
      return [];
    }
    const ff = this.modifierSelections.filter((mm) =>
      mm.modifier.attrs.type === 'SmoGraceNote'
    );
    return ff;
  }

  isGraceNoteSelected(): boolean {
    if (this.modifierSelections.length) {
      const ff = this.modifierSelections.findIndex((mm) => mm.modifier.attrs.type === 'SmoGraceNote');
      return ff >= 0;
    }
    return false;
  }

  _growGraceNoteSelections(offset: number) {
    this.idleTimer = Date.now();
    const far = this.modifierSelections.filter((mm) => mm.modifier.attrs.type === 'SmoGraceNote');
    if (!far.length) {
      return;
    }
    const ix = (offset < 0) ? 0 : far.length - 1;
    const sel: ModifierTab = far[ix] as ModifierTab;
    const left = this.modifierTabs.filter((mt) =>
      mt.modifier?.attrs?.type === 'SmoGraceNote' && sel.selection && mt.selection &&
      SmoSelector.sameNote(mt.selection.selector, sel.selection.selector)
    );
    if (ix + offset < 0 || ix + offset >= left.length) {
      return;
    }
    this.modifierSelections.push(left[ix + offset]);
    this._highlightModifier();
  }
  get autoPlay(): boolean {
    return this.renderer.score ? this.renderer.score.preferences.autoPlay : false;
  }

  growSelectionRight() {
    if (this.recordBuffer) {
      this.recordBuffer.addAction('growSelectionRight');
    }
    this._growSelectionRight(false);
  }
  _growSelectionRight(skipPlay: boolean): number {
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
      SuiOscillator.playSelectionNow(artifact, 1);
    }
    this.selections.push(artifact);
    this.deferHighlight();
    this._createLocalModifiersList();
    return (artifact.note as SmoNote).tickCount;
  }
  moveHome(evKey: KeyEvent) {
    if (this.recordBuffer) {
      this.recordBuffer.addAction('moveHome', SuiTracker.serializeEvent(evKey));
    }
    this.idleTimer = Date.now();
    const ls = this.selections[0].staff;
    if (evKey.ctrlKey) {
      const mm = ls.measures[0];
      const homeSel = this._getClosestTick({ staff: ls.staffId,
        measure: 0, voice: mm.getActiveVoice(), tick: 0, pitches: [] });
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
      const system = this.selections[0].measure.svg.lineIndex;
      const lm = ls.measures.find((mm) =>
        mm.svg.lineIndex === system && mm.measureNumber.systemIndex === 0);
      const mm = lm as SmoMeasure;
      const homeSel = this._getClosestTick({ staff: ls.staffId,
        measure: mm.measureNumber.measureIndex, voice: mm.getActiveVoice(),
        tick: 0, pitches: [] });
      if (evKey.shiftKey) {
        this._selectBetweenSelections(this.selections[0], homeSel);
      } else if (homeSel?.measure?.svg?.renderedBox) {
        this.selections = [homeSel];
        this.scroller.scrollVisibleBox(homeSel.measure.svg.renderedBox);
        this.deferHighlight();
        this._createLocalModifiersList();
      }
    }
  }
  moveEnd(evKey: KeyEvent) {
    if (this.recordBuffer) {
      this.recordBuffer.addAction('moveEnd', SuiTracker.serializeEvent(evKey));
    }
    this.idleTimer = Date.now();
    const ls = this.selections[0].staff;
    if (evKey.ctrlKey) {
      const lm = ls.measures[ls.measures.length - 1];
      const voiceIx = lm.getActiveVoice();
      const voice = lm.voices[voiceIx];
      const endSel = this._getClosestTick({ staff: ls.staffId,
        measure: ls.measures.length - 1, voice: voiceIx, tick: voice.notes.length - 1, pitches: [] });
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
      const system = this.selections[0].measure.svg.lineIndex;
      // find the largest measure index on this staff in this system
      const measures = ls.measures.filter((mm) =>
        mm.svg.lineIndex === system);
      const lm = measures.reduce((a, b) =>
        b.measureNumber.measureIndex > a.measureNumber.measureIndex ? b : a);
      const ticks = lm.voices[lm.getActiveVoice()].notes.length;
      const endSel = this._getClosestTick({ staff: ls.staffId,
        measure: lm.measureNumber.measureIndex, voice: lm.getActiveVoice(), tick: ticks - 1, pitches: [] });
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

  growSelectionLeft(): number {
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
      SuiOscillator.playSelectionNow(artifact, 1);
    }
    this.deferHighlight();
    this._createLocalModifiersList();
    return (artifact.note as SmoNote).tickCount;
  }

  // if we are being moved right programmatically, avoid playing the selected note.
  moveSelectionRight(evKey: KeyEvent | null, skipPlay: boolean) {
    if (this.selections.length === 0) {
      return;
    }
    if (this.recordBuffer) {
      this.recordBuffer.addAction('moveSelectionRight', SuiTracker.serializeEvent(evKey));
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
    this._replaceSelection(nselect, false);
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
  moveSelectionOffset(offset: number) {
    let i = 0;
    const fcn = (offset >= 0 ? 'moveSelectionRight' : 'moveSelectionLeft');
    offset = (offset < 0) ? -1 * offset : offset;
    for (i = 0; i < offset; ++i) {
      this[fcn](null, false);
    }
  }

  _moveSelectionMeasure(offset: number) {
    const selection = this.getExtremeSelection(Math.sign(offset));
    this.idleTimer = Date.now();
    const selector = JSON.parse(JSON.stringify(selection.selector));
    selector.measure += offset;
    selector.tick = 0;
    const selObj = this._getClosestTick(selector);
    if (selObj) {
      this.selections = [selObj];
    }
    this.deferHighlight();
    this._createLocalModifiersList();
  }

  setSelection(selection: SmoSelector) {
    const selObj = this._getClosestTick(selection);
    this.idleTimer = Date.now();
    if (selObj) {
      this.selections = [selObj];
    }
    this.deferHighlight();
  }

  _moveStaffOffset(offset: number) {
    if (this.selections.length === 0 || this.score === null) {
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
  _moveSelectionPitch(index: number) {
    this.idleTimer = Date.now();
    if (!this.selections.length) {
      return;
    }
    const sel = this.selections[0];
    const note = sel.note as SmoNote;
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
    this._moveSelectionPitch((this.selections[0].note as SmoNote).pitches.length - 1);
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

  containsArtifact(): boolean {
    return this.selections.length > 0;
  }

  _replaceSelection(nselector: SmoSelector, skipPlay: boolean) {
    if (this.score === null) {
      return;
    }
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
    if (!skipPlay && this.autoPlay && artifact) {
      SuiOscillator.playSelectionNow(artifact, 1);
    }
    if (!artifact) {
      return;
    }

    // clear modifier selections
    this.clearModifierSelections();
    this.score.setActiveStaff(nselector.staff);
    const mapKey = Object.keys(this.measureNoteMap).find((k) =>
      artifact && SmoSelector.sameNote(this.measureNoteMap[k].selector, artifact.selector)
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
  getSelectedMeasures(): SmoSelection[] {
    const set: number[] = [];
    const rv: SmoSelection[] = [];
    if (!this.score) {
      return [];
    }
    this.selections.forEach((sel) => {
      const measure = SmoSelection.measureSelection(this.score!, sel.selector.staff, sel.selector.measure);
      if (measure) {
        const ix = measure.selector.measure;
        if (set.indexOf(ix) === -1) {
          set.push(ix);
          rv.push(measure);
        }
      }
    });
    return rv;
  }

  _selectFromToInStaff(sel1: SmoSelection, sel2: SmoSelection) {
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

  _addSelection(selection: SmoSelection) {
    const ar: SmoSelection[] = this.selections.filter((sel) =>
      SmoSelector.neq(sel.selector, selection.selector)
    );
    if (this.autoPlay) {
      SuiOscillator.playSelectionNow(selection, 1);
    }
    ar.push(selection);
    this.selections = ar;
  }

  recordSelectSuggestion(ev: KeyEvent, selector: SmoSelector) {
    if (this.recordBuffer) {
      this.recordBuffer.addAction('selectSuggestionNote', selector, SuiTracker.serializeEvent(ev));
    }
  }
  recordModifierSelectSuggestion(ev: KeyEvent) {
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
        SuiTracker.serializeEvent(ev), modKey);
    }
  }
  _selectBetweenSelections(s1: SmoSelection, s2: SmoSelection) {
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
    if ((mod as StaffModifierBase).startSelector && (mod as StaffModifierBase).endSelector && this.score) {
      const sm = mod as StaffModifierBase;
      const s1: SmoSelection | null = SmoSelection.noteFromSelector(this.score, sm.startSelector);
      const s2: SmoSelection | null = SmoSelection.noteFromSelector(this.score, sm.endSelector);
      if (s1 && s2) {
        this._selectBetweenSelections(s1, s2);
      }
    }
  }
  selectSuggestion(ev: KeyEvent) {
    if (!this.suggestion || !this.suggestion.measure || this.score === null) {
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
      SuiOscillator.playSelectionNow(this.suggestion,1);
    }

    const preselected = this.selections[0] ?
      SmoSelector.sameNote(this.suggestion.selector, this.selections[0].selector) && this.selections.length === 1 : false;

    const note = this.selections[0].note as SmoNote;
    if (preselected && note.pitches.length > 1) {
      this.pitchIndex =  (this.pitchIndex + 1) % note.pitches.length;
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

  static get strokes(): Record<string, StrokeInfo> {
    return {
      suggestion: {
        stroke: '#fc9',
        strokeWidth: 2,
        strokeDasharray: '4,1',
        fill: 'none',
        opacity: 1.0
      },
      selection: {
        stroke: '#99d',
        strokeWidth: 2,
        strokeDasharray: 2,
        fill: 'none',
        opacity: 1.0
      },
      staffModifier: {
        stroke: '#933',
        strokeWidth: 2,
        fill: 'none',
        strokeDasharray: 0,
        opacity: 1.0
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

  _setModifierAsSuggestion(artifact: ModifierTab): void {
    if (!artifact.box) {
      return;
    }
    this.modifierSuggestion = artifact.index;
    this._drawRect(artifact.box, 'suggestion');
    this._setFadeTimer();
  }

  _setArtifactAsSuggestion(artifact: SmoSelection) {
    const sameSel =
      this.selections.find((ss) => SmoSelector.sameNote(ss.selector, artifact.selector));

    if (sameSel || !artifact.box) {
      return;
    }
    this.modifierSuggestion = -1;

    this.suggestion = artifact;
    this._drawRect(artifact.box, 'suggestion');
    this._setFadeTimer();
  }

  eraseAllSelections() {
    const strokeKeys = Object.keys(SuiTracker.strokes);
    strokeKeys.forEach((key) => {
      this.eraseRect(key);
    });
  }

  eraseRect(stroke: string) {
    $(this.renderElement).find('g.vf-' + stroke).remove();
  }

  _highlightModifier() {
    let box: SvgBox | null = null;
    if (!this.modifierSelections.length) {
      return;
    }
    this.modifierSelections.forEach((artifact) => {
      if (box === null) {
        box = artifact.modifier.renderedBox ?? null;
      } else {
        box = SvgHelpers.unionRect(box, SvgHelpers.smoBox(artifact.modifier.renderedBox));
      }
    });
    if (box === null) {
      return;
    }
    this._drawRect(box, 'staffModifier');
  }

  _highlightPitchSelection(note: SmoNote, index: number) {
    this.eraseAllSelections();
    const noteDiv = $(this.renderElement).find('#' + note.renderId);
    const heads = noteDiv.find('.vf-notehead');
    if (!heads.length) {
      return;
    }
    const headEl = heads[index];
    const lbox = SvgHelpers.smoBox(headEl.getBBox());
    const box: SvgBox = SvgHelpers.smoBox(SvgHelpers.logicalToClient(this.svg, lbox, this.scroller.scrollState.scroll));
    this._drawRect(box, 'staffModifier');
  }

  _highlightActiveVoice(selection: SmoSelection) {
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
    let prevSel: SmoSelection | null = null;
    let curBox: SvgBox = SvgBox.default;
    this.idleTimer = Date.now();
    const grace = this.getSelectedGraceNotes();
    // If this is not a note with grace notes, logically unselect the grace notes
    if (grace && grace.length && grace[0].selection && this.selections.length) {
      if (!SmoSelector.sameNote(grace[0].selection.selector, this.selections[0].selector)) {
        this.clearModifierSelections();
      } else {
        this._highlightModifier();
        return;
      }
    }
    // If there is a race condition with a change, avoid referencing null note
    if (!this.selections[0].note) {
      return;
    }
    const note = this.selections[0].note as SmoNote;
    if (this.pitchIndex >= 0 && this.selections.length === 1 &&
      this.pitchIndex < note.pitches.length) {
      this._highlightPitchSelection(note, this.pitchIndex);
      this._highlightActiveVoice(this.selections[0]);
      return;
    }

    this.pitchIndex = -1;
    this.eraseAllSelections();
    if (this.selections.length === 1 && note.renderedBox) {
      this._checkBoxOffset();
      this._drawRect(note.renderedBox, 'selection');
      this._highlightActiveVoice(this.selections[0]);
      return;
    }
    const sorted = this.selections.sort((a, b) => SmoSelector.gt(a.selector, b.selector) ? 1 : -1);
    prevSel = sorted[0];
    // rendered yet?
    if (!prevSel || !prevSel.box) {
      return;
    }
    curBox = SvgHelpers.smoBox(prevSel.box);
    const boxes: SvgBox[] = [];
    for (i = 1; i < sorted.length; ++i) {
      const sel = sorted[i];
      if (!sel.box || !prevSel.box) {
        continue;
      }
      const ydiff = Math.abs(prevSel.box.y - sel.box.y);
      if (sel.selector.staff === prevSel.selector.staff && ydiff < 1.0) {
        curBox = SvgHelpers.unionRect(curBox, sel.box);
      } else if (curBox) {
        boxes.push(curBox);
        curBox = SvgHelpers.smoBox(sel.box);
      }
      this._highlightActiveVoice(sel);
      prevSel = sel;
    }
    boxes.push(curBox);
    if (this.modifierSelections.length) {
      boxes.push(this.modifierSelections[0].box);
    }
    this._drawRect(boxes, 'selection');
  }

  _suggestionParameters(box: SvgBox | SvgBox[], strokeName: string): OutlineInfo {
    const stroke: StrokeInfo = (SuiTracker.strokes as any)[strokeName];
    return {
      context: this.renderer.context, box, classes: strokeName,
      stroke, scroll: this.scroller.scrollState.scroll, clientCoordinates: false
    };
  }

  _drawRect(bb: SvgBox | SvgBox[], stroke: string) {
    SvgHelpers.outlineRect(this._suggestionParameters(bb, stroke));
  }
}
