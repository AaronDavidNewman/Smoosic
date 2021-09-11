// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { UndoBuffer } from '../../smo/xform/undo';
import { StaffModifierBase } from '../../smo/data/staffModifiers';
import { SuiScroller } from './scroller';
import { svgHelpers } from '../../common/svgHelpers';
import { PasteBuffer } from '../../smo/xform/copypaste';
import { SuiTracker } from './tracker';
import { SmoScore } from '../../smo/data/score';
import { SmoActionRecord } from '../../smo/xform/actions';
import { SuiRenderDemon } from './layoutDemon';
import { testCase1 } from '../../music/utActions';
import { SmoModifierBase } from '../../smo/data/common';
import { SmoGraceNote } from '../../smo/data/noteModifiers';
import { SuiRenderState } from './renderState';
import { SmoMeasure } from '../../smo/data/measure';
import { Action } from '../../smo/xform/actions';

declare var $: any;

export interface ViewMapEntry {
  show: boolean;
}

// ## SuiScoreView
// Do a thing to the music.  Save in undo buffer before.  Render the score to reflect
// the change after.  Map the operation on the score view to the actual score.
export abstract class SuiScoreView {
  static Instance: SuiScoreView | null = null;
  abstract replayActions(): void;

  // ### _reverseMapSelection
  // For operations that affect all columns, we operate on the
  // entire score and update the view score.  Some selections
  // will not have an equivalent in the reverse map since the
  // view can be a subset.
  score: SmoScore;
  storeScore: SmoScore;
  staffMap: number[];
  storeUndo: UndoBuffer;
  undoBuffer: UndoBuffer;
  tracker: SuiTracker;
  renderer: any;
  scroller: SuiScroller;
  pasteBuffer: PasteBuffer;
  storePaste: PasteBuffer;
  actionBuffer: SmoActionRecord;
  layoutDemon: SuiRenderDemon;
  constructor(renderer: SuiRenderState, score: SmoScore, scrollSelector: string) {
    this.score = score;
    this.renderer = renderer;
    const scoreJson = score.serialize();
    this.scroller = new SuiScroller(scrollSelector);
    this.pasteBuffer = new PasteBuffer();
    this.storePaste = new PasteBuffer();
    this.tracker = new SuiTracker(this.renderer, this.scroller, this.pasteBuffer);
    this.renderer.setMeasureMapper(this.tracker);

    this.storeScore = SmoScore.deserialize(JSON.stringify(scoreJson));
    this.undoBuffer = new UndoBuffer();
    this.layoutDemon = new SuiRenderDemon(this.renderer, this.undoBuffer, this.tracker);
    this.storeUndo = new UndoBuffer();
    this.staffMap = this.defaultStaffMap;
    SuiScoreView.Instance = this; // for debugging
    this.setMappedStaffIds();
    this.actionBuffer = new SmoActionRecord();
    this.tracker.recordBuffer = this.actionBuffer;
  }

  _reverseMapSelection(selection: SmoSelection) {
    const staffIndex = this.staffMap.indexOf(selection.selector.staff);
    if (staffIndex < 0) {
      return null;
    }
    if (typeof(selection.selector.tick) === 'undefined') {
      return SmoSelection.measureSelection(this.score, staffIndex, selection.selector.measure);
    }
    if (typeof(selection.selector.pitches) === 'undefined') {
      return SmoSelection.noteSelection(this.score, staffIndex, selection.selector.measure, selection.selector.voice,
        selection.selector.tick);
    }
    return SmoSelection.pitchSelection(this.score, staffIndex, selection.selector.measure, selection.selector.voice,
      selection.selector.tick, selection.selector.pitches);
  }
  _reverseMapSelections(selections: SmoSelection[]): SmoSelection[] {
    const rv: SmoSelection[] = [];
    selections.forEach((selection) => {
      const rsel = this._reverseMapSelection(selection);
      if (rsel !== null) {
        rv.push(rsel);
      }
    });
    return rv;
  }

  // ### _getEquivalentSelections
  // The plural form of _getEquivalentSelection
  _getEquivalentSelections(selections: SmoSelection[]): SmoSelection[] {
    const rv: SmoSelection[] = [];
    selections.forEach((selection) => {
      const sel = this._getEquivalentSelection(selection);
      if (sel !== null) {
        rv.push(sel);
      }
    });
    return rv;
  }
  _undoStaffModifier(label: string, staffModifier: StaffModifierBase, subtype: number) {
    const copy = StaffModifierBase.deserialize(staffModifier.serialize());
    copy.startSelector = this._getEquivalentSelector(copy.startSelector);
    copy.endSelector = this._getEquivalentSelector(copy.endSelector);
    this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.STAFF_MODIFIER, SmoSelector.default,
      staffModifier.serialize(), subtype);
    this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.STAFF_MODIFIER, SmoSelector.default,
      copy.serialize(), subtype);
  }
  // ### getFocusedPage
  // Return the index of the page that is in the center of the client screen.
  getFocusedPage() {
    if (this.score.layoutManager === undefined) {
      return;
    }
    const scrollAvg = this.tracker.scroller.netScroll.y + (this.tracker.scroller.viewport.height / 2);
    const midY = scrollAvg;
    const layoutManager = this.score.layoutManager.getGlobalLayout();
    const lh = layoutManager.pageHeight / layoutManager.svgScale;
    const lw = layoutManager.pageWidth / layoutManager.svgScale;
    const pt = svgHelpers.logicalToClient(this.renderer.svg, svgHelpers.smoBox({ x: lw, y: lh }), this.tracker.scroller.scrollState.scroll);
    return Math.round(midY / pt.y);
  }
  // ### _undoRectangle
  // Create a rectangle undo, like a multiple columns but not necessarily the whole
  // score.
  _undoRectangle(label: string, startSelector: SmoSelector, endSelector: SmoSelector, score: SmoScore, undoBuffer: UndoBuffer) {
    undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.RECTANGLE, SmoSelector.default, { score, topLeft: startSelector, bottomRight: endSelector },
      UndoBuffer.bufferSubtypes.NONE);
  }
  _undoColumn(label: string, measureIndex: number) {
    this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.COLUMN, SmoSelector.default, { score: this.score, measureIndex }, 
      UndoBuffer.bufferSubtypes.NONE);
    this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.COLUMN, SmoSelector.default, { score: this.storeScore, measureIndex }, UndoBuffer.bufferSubtypes.NONE);
  }
  _undoScorePreferences(label: string) {
    this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.SCORE_ATTRIBUTES, SmoSelector.default, this.score, UndoBuffer.bufferSubtypes.NONE);
    this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.SCORE_ATTRIBUTES, SmoSelector.default, this.storeScore, UndoBuffer.bufferSubtypes.NONE);
  }
  // ### _getRectangleFromStaffGroup
  // For selections that affect a system of staves, find the rectangle based on one of the
  // staves and return the selectors.
  _getRectangleFromStaffGroup(selection: SmoSelection, staffMap: number[]): { startSelector: SmoSelector, endSelector: SmoSelector } {
    const startSelector: SmoSelector = SmoSelector.default;
    let endSelector: SmoSelector = SmoSelector.default;;
    let staffFilter = [];
    const sygrp = this.score.getSystemGroupForStaff(selection);
    if (sygrp) {
      startSelector.staff = sygrp.startSelector.staff;
      startSelector.measure = selection.selector.measure;      
      endSelector.staff = sygrp.endSelector.staff;
      endSelector.measure = selection.selector.measure;
      // Because of the staff map, some staves may not be in the view,
      // so only include staves actually in the map.
      // staffFilter is all the staves eligible for the group in the view.
      staffFilter = staffMap.filter((map) => map >= sygrp.startSelector.staff && map <= sygrp.endSelector.staff);
      // min is start staff
      startSelector.staff = staffFilter.reduce((a, b) => a < b ? a : b);
      // max is end staff
      endSelector.staff = staffFilter.reduce((a, b) => a > b ? a : b);
    } else {
      startSelector.staff = selection.selector.staff;
      startSelector.measure = selection.selector.measure;
      endSelector = JSON.parse(JSON.stringify(startSelector));
    }
    return { startSelector, endSelector };
  }

  // ### _undoTrackerSelections
  // Add to the undo buffer the current set of measures selected.
  _undoTrackerMeasureSelections(label: string): SmoSelection[] {
    const measureSelections = SmoSelection.getMeasureList(this.tracker.selections);
    measureSelections.forEach((measureSelection) => {
      const equiv = this._getEquivalentSelection(measureSelection);
      if (equiv !== null) {
        this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.MEASURE, measureSelection.selector, measureSelection.measure,
          UndoBuffer.bufferSubtypes.NONE);
        this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.MEASURE, equiv.selector, equiv.measure,
          UndoBuffer.bufferSubtypes.NONE);
      }
    });
    return measureSelections;
  }
  // ### _undoFirstMeasureSelection
  // operation that only affects the first selection.  Setup undo for the measure
  _undoFirstMeasureSelection(label: string): SmoSelection {
    const sel = this.tracker.selections[0];
    const equiv = this._getEquivalentSelection(sel);
    if (equiv !== null) {
      this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.MEASURE, sel.selector, sel.measure,
        UndoBuffer.bufferSubtypes.NONE);
      this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.MEASURE, equiv.selector, equiv.measure,
        UndoBuffer.bufferSubtypes.NONE);
    }
    return sel;
  }
  _undoSelection(label: string, selection: SmoSelection) {
    const equiv = this._getEquivalentSelection(selection);
    if (equiv !== null) {
      this.undoBuffer.addBuffer(label,
        UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure,
        UndoBuffer.bufferSubtypes.NONE);
      this.storeUndo.addBuffer(label,
        UndoBuffer.bufferTypes.MEASURE, equiv.selector, equiv.measure,
        UndoBuffer.bufferSubtypes.NONE);
    }
  }
  _undoSelections(label: string, selections: SmoSelection[]) {
    this.undoBuffer.grouping = true;
    this.storeUndo.grouping = true;
    selections.forEach((selection) => {
      this._undoSelection(label, selection);
    });
    this.undoBuffer.grouping = false;
    this.storeUndo.grouping = false;
  }

  // ###_renderChangedMeasures
  // Update renderer for measures that have changed
  _renderChangedMeasures(measureSelections: SmoSelection[]) {
    if (!Array.isArray(measureSelections)) {
      measureSelections = [measureSelections];
    }
    measureSelections.forEach((measureSelection) => {
      this.renderer.addToReplaceQueue(measureSelection);
    });
  }
  _renderRectangle(fromSelector: SmoSelector, toSelector: SmoSelector) {
    this._getRectangleSelections(fromSelector, toSelector, this.score).forEach((s) => {
      this.renderer.addToReplaceQueue(s);
    });
  }

  // ###_renderChangedMeasures
  // Setup undo for operation that affects the whole score
  _undoScore(label: string) {
    this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.SCORE, SmoSelector.default, this.score,
      UndoBuffer.bufferSubtypes.NONE);
    this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.SCORE, SmoSelector.default, this.storeScore,
      UndoBuffer.bufferSubtypes.NONE);
  }
  _getEquivalentSelector(selector: SmoSelector) {
    const rv = JSON.parse(JSON.stringify(selector));
    rv.staff = this.staffMap[selector.staff];
    return rv;
  }
  _getEquivalentSelection(selection: SmoSelection): SmoSelection | null {
    try {
      if (typeof(selection.selector.tick) === 'undefined') {
        return SmoSelection.measureSelection(this.storeScore, this.staffMap[selection.selector.staff], selection.selector.measure);
      }
      if (typeof(selection.selector.pitches) === 'undefined') {
        return SmoSelection.noteSelection(this.storeScore, this.staffMap[selection.selector.staff], selection.selector.measure, selection.selector.voice,
          selection.selector.tick);
      }
      return SmoSelection.pitchSelection(this.storeScore, this.staffMap[selection.selector.staff], selection.selector.measure, selection.selector.voice,
        selection.selector.tick, selection.selector.pitches);
    } catch (ex) {
      console.warn(ex);
      return null;
    }
  }
  _removeStandardModifier(modifier: SmoModifierBase) {
    $(this.renderer.context.svg).find('g.' + modifier.attrs.id).remove();
  }

  _getEquivalentGraceNote(selection: SmoSelection, gn: SmoGraceNote): SmoGraceNote {
    if (selection.note !== null) {
      const rv = selection.note.getGraceNotes().find((gg) => gg.attrs.id === gn.attrs.id);
      if (rv) {
        return rv;
      }
    }
    return gn;
  }
  _getRectangleSelections(startSelector: SmoSelector, endSelector: SmoSelector, score: SmoScore): SmoSelection[] {
    const rv: SmoSelection[] = [];
    let i = 0;
    let j = 0;
    for (i = startSelector.staff; i <= endSelector.staff; i++) {
      for (j = startSelector.measure; j <= endSelector.measure; j++) {
        const target = SmoSelection.measureSelection(score, i, j);
        if (target !== null) {
          rv.push(target);
        }
      }
    }
    return rv;
  }
  // ### groupUndo
  // Indicate we want to group the undo operations into one undo
  groupUndo(val: boolean) {
    this.undoBuffer.grouping = val;
    this.storeUndo.grouping = val;
  }

  // ### defaultStaffMap
  // Show all staves, 1:1 mapping of view score staff to stored score staff
  get defaultStaffMap(): number[] {
    let i = 0;
    const rv: number[] = [];
    for (i = 0; i < this.storeScore.staves.length; ++i) {
      rv.push(i);
    }
    return rv;
  }
  startRenderingEngine() {
    this.layoutDemon.startDemon();
  }
  static debugUnitTest() {
    const dbg = SuiScoreView.Instance;
    if (dbg === null) {
      return;
    }
    dbg.changeScore(SmoScore.getDefaultScore(SmoScore.defaults, SmoMeasure.defaults));
    dbg.actionBuffer.actions = JSON.parse(testCase1);
    if (SuiScoreView.Instance !== null) {
      dbg.actionBuffer.executeIndex = SuiScoreView.Instance.actionBuffer.actions.length;
    }
    dbg.replayActions();
  }

  getView(): ViewMapEntry[] {
    const rv = [];
    let i = 0;
    for (i = 0; i < this.storeScore.staves.length; ++i) {
      const show = this.staffMap.indexOf(i) >= 0;
      rv.push({ show });
    }
    return rv;
  }
  playActions(actionJson: Action[]) {
    if (!this.actionBuffer.endCondition) {
      return;
    }
    this.actionBuffer.actions = actionJson;
    this.actionBuffer.resetRunner();
    this.replayActions();
  }
  setMappedStaffIds() {
    this.score.staves.forEach((staff) => {
      staff.setMappedStaffId(this.staffMap[staff.staffId]);
    });
  }

  // ### setView
  // Send a list of rows with a 'show' boolean in each, we display that line
  // in the staff and hide the rest
  setView(rows: ViewMapEntry[]) {
    let i = 0;
    const any = rows.find((row) => row.show === true);
    if (!any) {
      return;
    }
    this._undoScore('change view');
    const nscore = SmoScore.deserialize(JSON.stringify(this.storeScore.serialize()));
    const staveScore =  SmoScore.deserialize(JSON.stringify(this.storeScore.serialize()));
    nscore.staves = [];
    const staffMap = [];
    for (i = 0; i < rows.length; ++i) {
      const row = rows[i];
      if (row.show) {
        nscore.staves.push(staveScore.staves[i]);
        staffMap.push(i);
      }
    }
    nscore.numberStaves();
    this.staffMap = staffMap;
    this.score = nscore;
    // Indicate which score staff view staves are mapped to, to decide to display
    // modifiers.
    this.setMappedStaffIds();
    this.renderer.score = nscore;
    this.renderer.setViewport(true);
    setTimeout(() => {
      $('body').trigger('forceResizeEvent');
    }, 1);
  }
  // ### viewAll
  // view all the staffs in score mode.
  viewAll() {
    this.score = SmoScore.deserialize(JSON.stringify(this.storeScore.serialize()));
    this.staffMap = this.defaultStaffMap;
    this.setMappedStaffIds();
    this.renderer.score = this.score;
    this.renderer.setViewport(true);
  }
  // ### changeScore
  // Update the view after loading or restoring a completely new score
  changeScore(score: SmoScore) {
    this._undoScore('load new score');
    this.renderer.score = score;
    this.renderer.setViewport(true);
    this.storeScore = SmoScore.deserialize(JSON.stringify(score.serialize()));
    this.score = score;
    this.staffMap = this.defaultStaffMap;
    this.setMappedStaffIds();
    this.actionBuffer.clearActions();
    setTimeout(() => {
      $('body').trigger('forceResizeEvent');
    }, 1);
  }

  // ### undo
  // for the view score, we the renderer decides what to render
  // depending on what is undone.
  undo() {
    this.renderer.undo(this.undoBuffer);
    // A score-level undo might have changed the score.
    this.score = this.renderer.score;
    this.storeScore = this.storeUndo.undo(this.storeScore);
  }
}
