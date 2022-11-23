// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiMapper, SuiRendererBase } from './mapper';
import { SvgHelpers, StrokeInfo, OutlineInfo } from './svgHelpers';
import { SmoSelection, SmoSelector, ModifierTab } from '../../smo/xform/selections';
import { smoSerialize } from '../../common/serializationHelpers';
import { SuiOscillator } from '../audio/oscillator';
import { SmoScore } from '../../smo/data/score';
import { SvgBox, KeyEvent } from '../../smo/data/common';
import { SuiScroller } from './scroller';
import { PasteBuffer } from '../../smo/xform/copypaste';
import { SmoNote } from '../../smo/data/note';
import { SmoMeasure } from '../../smo/data/measure';
import { SvgPage } from './svgPageMap';
import { layoutDebug } from './layoutDebug';
declare var $: any;
/**
 * SuiTracker
 A tracker maps the UI elements to the logical elements ,and allows the user to
 move through the score and make selections, for navigation and editing.
 */
export class SuiTracker extends SuiMapper {
  idleTimer: number = Date.now();
  musicCursorGlyph: SVGSVGElement | null = null;
  // timer: NodeJS.Timer | null = null;
  suggestFadeTimer: NodeJS.Timer | null = null;
  strokeMemory: Record<string, SvgPage> = {};
  static get strokes(): Record<string, StrokeInfo> {
    return {
      suggestion: {
        strokeName: 'suggestion',
        stroke: '#fc9',
        strokeWidth: 3,
        strokeDasharray: '4,1',
        fill: 'none',
        opacity: 1.0
      },
      selection: {
        strokeName: 'selection',
        stroke: '#99d',
        strokeWidth: 3,
        strokeDasharray: 2,
        fill: 'none',
        opacity: 1.0
      },
      staffModifier: {
        strokeName: 'staffModifier',
        stroke: '#933',
        strokeWidth: 3,
        fill: 'none',
        strokeDasharray: 0,
        opacity: 1.0
      }
    };
  }

  constructor(renderer: SuiRendererBase, scroller: SuiScroller, pasteBuffer: PasteBuffer) {
    super(renderer, scroller, pasteBuffer);
  }

  // ### renderElement
  // the element the score is rendered on
  get renderElement(): Element {
    return this.renderer.renderElement;
  }

  get score(): SmoScore | null {
    return this.renderer.score;
  }

  getIdleTime(): number {
    return this.idleTimer;
  }
  clearMusicCursor(delay: number) {
    if (delay < 1) {
      const ell = document.getElementById('vf-music-cursor');
      if (ell) {
        ell.remove();
      }
    } else {
      setTimeout(() => {
        this.clearMusicCursor(0);
      }, delay);
    }
  }

  /**
   * the little birdie that follows the music as it plays
   * @param selector 
   * @returns 
   */
  musicCursor(selector: SmoSelector, offsetPct: number, durationPct: number) {
    if (!this.score) {
      return;
    }
    // Get note from 0th staff if we can
    const measureSel = SmoSelection.measureSelection(this.score,
      this.score.staves.length - 1, selector.measure);
    const zmeasureSel = SmoSelection.measureSelection(this.score,
      0, selector.measure);
    const measure = measureSel?.measure as SmoMeasure;
    if (measure.svg.logicalBox && zmeasureSel?.measure?.svg?.logicalBox) {
      const context = this.renderer.pageMap.getRenderer(measure.svg.logicalBox);
      const topBox = SvgHelpers.smoBox(zmeasureSel.measure.svg.logicalBox);
      topBox.y -= context.box.y;
      const botBox = SvgHelpers.smoBox(measure.svg.logicalBox);
      botBox.y -= context.box.y;
      const height = (botBox.y + botBox.height) - topBox.y;
      const measureWidth = botBox.width - measure.svg.adjX;
      const nhWidth = 10 / this.score.layoutManager!.getGlobalLayout().svgScale;
      let width = measureWidth * durationPct - 10 / this.score.layoutManager!.getGlobalLayout().svgScale;
      width = Math.max(nhWidth, width);
      const y = topBox.y;
      let x = topBox.x + measure.svg.adjX + offsetPct * measureWidth;
      const noteBox = this.score.staves[selector.staff].measures[selector.measure].voices[selector.voice].notes[selector.tick];
      if (noteBox && noteBox.logicalBox) {
        x = noteBox.logicalBox.x;
      }
      const screenBox = SvgHelpers.boxPoints(x, y, width, height);
      const fillParams: Record<string, string> = {};
      fillParams['fill-opacity'] = '0.5';
      fillParams['fill'] = '#4444ff';
      const ctx = context.getContext();
      this.clearMusicCursor(0);
      ctx.save();
      ctx.openGroup('music-cursor', 'music-cursor');
      ctx.rect(x, screenBox.y, width, screenBox.height, fillParams);
      ctx.closeGroup();
      ctx.restore();
      layoutDebug.updatePlayDebug(selector, measure.svg.logicalBox);
      this.scroller.scrollVisibleBox(zmeasureSel.measure.svg.logicalBox);        
    }
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

  advanceModifierSelection(score: SmoScore,keyEv: KeyEvent | null) {
    if (!keyEv) {
      return;
    }
    this.idleTimer = Date.now();
    if (this.strokeMemory['staffModifier']) {
      SvgHelpers.eraseOutline(this.strokeMemory['staffModifier'].svg, SuiTracker.strokes['staffModifier']);
      delete this.strokeMemory['staffModifier'];
    }
    const offset = keyEv.key === 'ArrowLeft' ? -1 : 1;
    this.modifierIndex = this.modifierIndex + offset;
    this.modifierIndex = (this.modifierIndex === -2 && this.localModifiers.length) ?
      this.localModifiers.length - 1 : this.modifierIndex;
    if (this.modifierIndex >= this.localModifiers.length || this.modifierIndex < 0) {
      this.modifierIndex = -1;
      this.modifierSelections = [];
      return;
    }
    const local: ModifierTab = this.localModifiers[this.modifierIndex];
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
      mm.modifier?.attrs?.type === 'SmoGraceNote'
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
    const left = this.localModifiers.filter((mt) =>
      mt.modifier?.attrs?.type === 'SmoGraceNote' && sel.selection && mt.selection &&
      SmoSelector.sameNote(mt.selection.selector, sel.selection.selector)
    );
    if (ix + offset < 0 || ix + offset >= left.length) {
      return;
    }
    const leftSel = left[ix + offset];
    if (!leftSel) {
      console.warn('bad selector in _growGraceNoteSelections');
    }
    leftSel.box = leftSel.box ?? SvgBox.default;
    this.modifierSelections.push(leftSel);
    this._highlightModifier();
  }
  get autoPlay(): boolean {
    return this.renderer.score ? this.renderer.score.preferences.autoPlay : false;
  }

  growSelectionRight() {
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
    if (!this.mapping && this.autoPlay && skipPlay === false && this.score) {
      SuiOscillator.playSelectionNow(artifact, this.score, 1);
    }
    this.selections.push(artifact);
    this.deferHighlight();
    this._createLocalModifiersList();
    return (artifact.note as SmoNote).tickCount;
  }
  moveHome(score: SmoScore, evKey: KeyEvent) {
    this.idleTimer = Date.now();
    const ls = this.selections[0].staff;
    if (evKey.ctrlKey) {
      const mm = ls.measures[0];
      const homeSel = this._getClosestTick({ staff: ls.staffId,
        measure: 0, voice: mm.getActiveVoice(), tick: 0, pitches: [] });
      if (evKey.shiftKey) {
        this._selectBetweenSelections(score, this.selections[0], homeSel);
      } else {
        this.selections = [homeSel];
        this.deferHighlight();
        this._createLocalModifiersList();
        if (homeSel.measure.svg.logicalBox) {
          this.scroller.scrollVisibleBox(homeSel.measure.svg.logicalBox);
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
        this._selectBetweenSelections(score, this.selections[0], homeSel);
      } else if (homeSel?.measure?.svg?.logicalBox) {
        this.selections = [homeSel];
        this.scroller.scrollVisibleBox(homeSel.measure.svg.logicalBox);
        this.deferHighlight();
        this._createLocalModifiersList();
      }
    }
  }
  moveEnd(score: SmoScore, evKey: KeyEvent) {
    this.idleTimer = Date.now();
    const ls = this.selections[0].staff;
    if (evKey.ctrlKey) {
      const lm = ls.measures[ls.measures.length - 1];
      const voiceIx = lm.getActiveVoice();
      const voice = lm.voices[voiceIx];
      const endSel = this._getClosestTick({ staff: ls.staffId,
        measure: ls.measures.length - 1, voice: voiceIx, tick: voice.notes.length - 1, pitches: [] });
      if (evKey.shiftKey) {
        this._selectBetweenSelections(score, this.selections[0], endSel);
      } else {
        this.selections = [endSel];
        this.deferHighlight();
        this._createLocalModifiersList();
        if (endSel.measure.svg.logicalBox) {
          this.scroller.scrollVisibleBox(endSel.measure.svg.logicalBox);
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
        this._selectBetweenSelections(score, this.selections[0], endSel);
      } else {
        this.selections = [endSel];
        this.deferHighlight();
        this._createLocalModifiersList();
        if (endSel.measure.svg.logicalBox) {
          this.scroller.scrollVisibleBox(endSel.measure.svg.logicalBox);
        }
      }
    }
  }
  growSelectionRightMeasure() {
    let toSelect = 0;
    const rightmost = this.getExtremeSelection(1);
    const ticksLeft = rightmost.measure.voices[rightmost.measure.activeVoice]
      .notes.length - rightmost.selector.tick;
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
    if (this.autoPlay && this.score) {
      SuiOscillator.playSelectionNow(artifact, this.score, 1);
    }
    this.deferHighlight();
    this._createLocalModifiersList();
    return (artifact.note as SmoNote).tickCount;
  }

  // if we are being moved right programmatically, avoid playing the selected note.
  moveSelectionRight(score: SmoScore, evKey: KeyEvent | null, skipPlay: boolean) {
    if (this.selections.length === 0 || this.score === null) {
      return;
    }
    // const original = JSON.parse(JSON.stringify(this.getExtremeSelection(-1).selector));
    const nselect = this._getOffsetSelection(1);
    // skip any measures that are not displayed due to rest or repetition
    const mselect = SmoSelection.measureSelection(this.score, nselect.staff, nselect.measure);
    if (mselect?.measure.svg.multimeasureLength) {
      nselect.measure += mselect?.measure.svg.multimeasureLength;
    }
    this._replaceSelection(nselect, skipPlay);
  }

  moveSelectionLeft() {
    if (this.selections.length === 0 || this.score === null) {
      return;
    }
    const nselect = this._getOffsetSelection(-1);
    // Skip multimeasure rests in parts
    const mselect = SmoSelection.measureSelection(this.score, nselect.staff, nselect.measure);
    while (nselect.measure > 0 && mselect && (mselect.measure.svg.hideMultimeasure || mselect.measure.svg.multimeasureLength > 0)) {
      nselect.measure -= 1;
    }
    this._replaceSelection(nselect, false);
  }
  moveSelectionLeftMeasure() {
    this._moveSelectionMeasure(-1);
  }
  moveSelectionRightMeasure() {
    this._moveSelectionMeasure(1);
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
    this._moveSelectionPitch(1);
  }
  moveSelectionPitchDown() {
    if (!this.selections.length) {
      return;
    }
    this._moveSelectionPitch((this.selections[0].note as SmoNote).pitches.length - 1);
  }

  moveSelectionUp() {
    this._moveStaffOffset(-1);
  }
  moveSelectionDown() {
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
      SuiOscillator.playSelectionNow(artifact, this.score, 1);
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

  _addSelection(selection: SmoSelection) {
    const ar: SmoSelection[] = this.selections.filter((sel) =>
      SmoSelector.neq(sel.selector, selection.selector)
    );
    if (this.autoPlay && this.score) {
      SuiOscillator.playSelectionNow(selection, this.score, 1);
    }
    ar.push(selection);
    this.selections = ar;
  }

  _selectFromToInStaff(score: SmoScore, sel1: SmoSelection, sel2: SmoSelection) {
    const selections = SmoSelection.innerSelections(score, sel1.selector, sel2.selector).filter((ff) => 
      ff.selector.voice === sel1.measure.activeVoice
    );
    this.selections = [];
    // Get the actual selections from our map, since the client bounding boxes are already computed
    selections.forEach((sel) => {
      const key = SmoSelector.getNoteKey(sel.selector);
      if (this.measureNoteMap) {
        this.selections.push(this.measureNoteMap[key]);
      }
    });

    if (this.selections.length === 0) {
      this.selections = [sel1];
    }
    this.idleTimer = Date.now();
  }
  _selectBetweenSelections(score: SmoScore, s1: SmoSelection, s2: SmoSelection) {
    const min = SmoSelector.gt(s1.selector, s2.selector) ? s2 : s1;
    const max = SmoSelector.lt(min.selector, s2.selector) ? s2 : s1;
    this._selectFromToInStaff(score, min, max);
    this._createLocalModifiersList();
    this.highlightQueue.selectionCount = this.selections.length;
    this.deferHighlight();
  }
  selectSuggestion(score: SmoScore,ev: KeyEvent) {
    if (!this.suggestion || !this.suggestion.measure || this.score === null) {
      return;
    }
    this.idleTimer = Date.now();

    if (this.modifierSuggestion) {
      if (this.suggestFadeTimer) {
        clearTimeout(this.suggestFadeTimer);
        this.suggestFadeTimer = null;
      }
      this.modifierIndex = -1;
      this.modifierSelections = [this.modifierSuggestion];
      this.modifierSuggestion = null;
      this.createLocalModifiersFromModifierTabs(this.modifierSelections);
      // If we selected due to a mouse click, move the selection to the
      // selected modifier
      this._highlightModifier();
      return;
    } else if (ev.type === 'click') {
      this.clearModifierSelections(); // if we click on a non-modifier, clear the
      // modifier selections
    }

    if (ev.shiftKey) {
      const sel1 = this.getExtremeSelection(-1);
      if (sel1.selector.staff === this.suggestion.selector.staff) {
        this._selectBetweenSelections(score, sel1, this.suggestion);
        return;
      }
    }

    if (ev.ctrlKey) {
      this._addSelection(this.suggestion);
      this._createLocalModifiersList();
      this.deferHighlight();
      return;
    }
    if (this.autoPlay) {
      SuiOscillator.playSelectionNow(this.suggestion, this.score, 1);
    }

    const preselected = this.selections[0] ?
      SmoSelector.sameNote(this.suggestion.selector, this.selections[0].selector) && this.selections.length === 1 : false;

    if (this.selections.length === 0) {
      this.selections.push(this.suggestion);
    }
    const note = this.selections[0].note as SmoNote;
    if (preselected && note.pitches.length > 1) {
      this.pitchIndex =  (this.pitchIndex + 1) % note.pitches.length;
      this.selections[0].selector.pitches = [this.pitchIndex];
    } else {
      const selection = SmoSelection.noteFromSelector(this.score, this.suggestion.selector);
      if (selection) {
        selection.box = JSON.parse(JSON.stringify(this.suggestion.box));
        selection.scrollBox = JSON.parse(JSON.stringify(this.suggestion.scrollBox));
        this.selections = [selection];
      }
    }
    if (preselected && this.modifierSelections.length) {
      const mods  = this.modifierSelections.filter((mm) => mm.selection && SmoSelector.sameNote(mm.selection.selector, this.selections[0].selector));
      if (mods.length) {
        const modToAdd = mods[0];
        if (!modToAdd) {
          console.warn('bad modifier selection in selectSuggestion 2');
        }
        this.modifierSelections[0] = modToAdd;
        this.modifierIndex = mods[0].index;
        this._highlightModifier();
        return;
      }
    }
    this.score.setActiveStaff(this.selections[0].selector.staff);
    this.deferHighlight();
    this._createLocalModifiersList();
  }

  _setFadeTimer() {
    if (this.suggestFadeTimer) {
      clearTimeout(this.suggestFadeTimer);
    }
    const tracker = this;
    this.suggestFadeTimer = setTimeout(() => {
      if (tracker.containsArtifact()) {
        if (this.strokeMemory['suggestion']) {
          SvgHelpers.eraseOutline(this.strokeMemory['suggestion'].svg, SuiTracker.strokes['suggestion']);
          delete this.strokeMemory['suggestion'];
        }
        tracker.modifierSuggestion = null;
      }
    }, 1000);
  }

  _setModifierAsSuggestion(artifact: ModifierTab): void {
    if (!artifact.box) {
      return;
    }
    this.modifierSuggestion = artifact;
    this._drawRect(artifact.box, 'suggestion');
    this._setFadeTimer();
  }

  _setArtifactAsSuggestion(artifact: SmoSelection) {
    let sameSel: SmoSelection | null = null;
    let i = 0;
    for (i = 0; i < this.selections.length; ++i) {
      const ss = this.selections[i];
      if (ss && SmoSelector.sameNote(ss.selector, artifact.selector)) {
        sameSel = ss;
        break;
      }
    }
    if (sameSel || !artifact.box) {
      return;
    }
    this.modifierSuggestion = null;

    this.suggestion = artifact;
    this._drawRect(artifact.box, 'suggestion');
    this._setFadeTimer();
  }

  eraseAllSelections() {
    Object.keys(SuiTracker.strokes).forEach((key) => {
      if (this.strokeMemory[key]) {
        SvgHelpers.eraseOutline(this.strokeMemory[key].svg, SuiTracker.strokes[key]);
      }
    });
    this.strokeMemory = {};
  }
  _highlightModifier() {
    let box: SvgBox | null = null;
    if (!this.modifierSelections.length) {
      return;
    }
    this.modifierSelections.forEach((artifact) => {
      if (box === null) {
        box = artifact.modifier.logicalBox ?? null;
      } else {
        box = SvgHelpers.unionRect(box, SvgHelpers.smoBox(artifact.modifier.logicalBox));
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
    const pageContext = this.renderer.pageMap.getRendererFromModifier(note);
    const box = pageContext.offsetBbox(headEl);
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
    if (this.selections.length === 1 && note.logicalBox) {
      this._drawRect(note.logicalBox, 'selection');
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
      // const ydiff = Math.abs(prevSel.box.y - sel.box.y);
      if (sel.selector.staff === prevSel.selector.staff && sel.measure.svg.lineIndex === prevSel.measure.svg.lineIndex) {
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
    let testBox: SvgBox = SvgHelpers.smoBox(box);
    let context = this.renderer.pageMap.getRenderer(testBox);
    if (!context) {
      context = this.renderer.pageMap.getRendererForPage(0);
    }
    testBox.y -= context.box.y;
    this.strokeMemory[strokeName] = context;
    return {
      context: context, box: testBox, classes: '',
      stroke, scroll: this.scroller.scrollState, clientCoordinates: false
    };
  }

  _drawRect(bb: SvgBox | SvgBox[], stroke: string) {
    SvgHelpers.outlineRect(this._suggestionParameters(bb, stroke));
  }
}
