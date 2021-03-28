// ## SuiScoreView
// Do a thing to the music.  Save in undo buffer before.  Render the score to reflect
// the change after.  Map the operation on the score view to the actual score.
// eslint-disable-next-line no-unused-vars
class SuiScoreView {
  // ### _reverseMapSelection
  // For operations that affect all columns, we operate on the
  // entire score and update the view score.  Some selections
  // will not have an equivalent in the reverse map since the
  // view can be a subset.
  _reverseMapSelection(selection) {
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
  _reverseMapSelections(selections) {
    const rv = [];
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
  _getEquivalentSelections(selections) {
    const rv = [];
    selections.forEach((selection) => {
      rv.push(this._getEquivalentSelection(selection));
    });
    return rv;
  }
  _undoStaffModifier(label, staffModifier, subtype) {
    const copy = StaffModifierBase.deserialize(staffModifier.serialize());
    copy.startSelector = this._getEquivalentSelector(copy.startSelector);
    copy.endSelector = this._getEquivalentSelector(copy.endSelector);
    this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.STAFF_MODIFIER, null,
      staffModifier.serialize(), subtype);
    this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.STAFF_MODIFIER, null,
      copy.serialize(), subtype);
  }
  // ### _undoRectangle
  // Create a rectangle undo, like a multiple columns but not necessarily the whole
  // score.
  _undoRectangle(label, startSelector, endSelector, score, undoBuffer) {
    undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.RECTANGLE, null, { score, topLeft: startSelector, bottomRight: endSelector });
  }
  _undoColumn(label, measureIndex) {
    this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.COLUMN, null, { score: this.score, measureIndex });
    this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.COLUMN, null, { score: this.storeScore, measureIndex });
  }
  _undoScorePreferences(label) {
    this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.SCORE_ATTRIBUTES, null, this.score);
    this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.SCORE_ATTRIBUTES, null, this.storeScore);
  }
  // ### _getRectangleFromStaffGroup
  // For selections that affect a system of staves, find the rectangle based on one of the
  // staves and return the selectors.
  _getRectangleFromStaffGroup(selection, staffMap) {
    let startSelector = {};
    let endSelector = {};
    let staffFilter = [];
    const sygrp = this.score.getSystemGroupForStaff(selection);
    if (sygrp) {
      startSelector = { staff: sygrp.startSelector.staff, measure: selection.selector.measure };
      endSelector = { staff: sygrp.endSelector.staff, measure: selection.selector.measure };
      // Because of the staff map, some staves may not be in the view,
      // so only include staves actually in the map.
      // staffFilter is all the staves eligible for the group in the view.
      staffFilter = staffMap.filter((map) => map >= sygrp.startSelector.staff && map <= sygrp.endSelector.staff);
      // min is start staff
      startSelector.staff = staffFilter.reduce((a, b) => a < b ? a : b);
      // max is end staff
      endSelector.staff = staffFilter.reduce((a, b) => a > b ? a : b);
    } else {
      startSelector = { staff: selection.selector.staff, measure: selection.selector.measure };
      endSelector = JSON.parse(JSON.stringify(startSelector));
    }
    return { startSelector, endSelector };
  }

  // ### _undoTrackerSelections
  // Add to the undo buffer the current set of measures selected.
  _undoTrackerMeasureSelections(label) {
    const measureSelections = SmoSelection.getMeasureList(this.tracker.selections);
    measureSelections.forEach((measureSelection) => {
      const equiv = this._getEquivalentSelection(measureSelection);
      this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.MEASURE, measureSelection.selector, measureSelection.measure);
      this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.MEASURE, equiv.selector, equiv.measure);
    });
    return measureSelections;
  }
  // ### _undoFirstMeasureSelection
  // operation that only affects the first selection.  Setup undo for the measure
  _undoFirstMeasureSelection(label) {
    const sel = this.tracker.selections[0];
    const equiv = this._getEquivalentSelection(sel);
    this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.MEASURE, sel.selector, sel.measure);
    this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.MEASURE, equiv.selector, equiv.measure);
    return sel;
  }
  _undoSelection(label, selection) {
    const equiv = this._getEquivalentSelection(selection);
    this.undoBuffer.addBuffer(label,
      UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    this.storeUndo.addBuffer(label,
      UndoBuffer.bufferTypes.MEASURE, equiv.selector, equiv.measure);
  }
  // ###_renderChangedMeasures
  // Update renderer for measures that have changed
  _renderChangedMeasures(measureSelections) {
    if (!Array.isArray(measureSelections)) {
      measureSelections = [measureSelections];
    }
    measureSelections.forEach((measureSelection) => {
      this.renderer.addToReplaceQueue(measureSelection);
    });
  }
  _renderRectangle(fromSelector, toSelector) {
    this._getRectangleSelections(fromSelector, toSelector, this.score).forEach((s) => {
      this.renderer.addToReplaceQueue(s);
    });
  }

  // ###_renderChangedMeasures
  // Setup undo for operation that affects the whole score
  _undoScore(label) {
    this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.SCORE, null, this.score);
    this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.SCORE, null, this.storeScore);
  }
  _getEquivalentSelector(selector) {
    const rv = JSON.parse(JSON.stringify(selector));
    rv.staff = this.staffMap[selector.staff];
    return rv;
  }
  _getEquivalentSelection(selection) {
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
  _removeStandardModifier(modifier) {
    $(this.renderer.context.svg).find('g.' + modifier.attrs.id).remove();
  }

  _getEquivalentGraceNote(selection, gn) {
    return selection.note.getGraceNotes().find((gg) => gg.attrs.id === gn.attrs.id);
  }
  _getRectangleSelections(startSelector, endSelector, score) {
    const rv = [];
    let i = 0;
    let j = 0;
    for (i = startSelector.staff; i <= endSelector.staff; i++) {
      for (j = startSelector.measure; j <= endSelector.measure; j++) {
        const target = SmoSelection.measureSelection(score, i, j);
        rv.push(target);
      }
    }
    return rv;
  }

  static get Instance() {
    if (typeof(SuiScoreView._instance) !== 'undefined') {
      return SuiScoreView._instance;
    }
    return null;
  }
  // ### groupUndo
  // Indicate we want to group the undo operations into one undo
  groupUndo(val) {
    this.undoBuffer.grouping = val;
    this.storeUndo.grouping = val;
  }

  // ### defaultStaffMap
  // Show all staves, 1:1 mapping of view score staff to stored score staff
  get defaultStaffMap() {
    let i = 0;
    const rv = [];
    for (i = 0; i < this.storeScore.staves.length; ++i) {
      rv.push(i);
    }
    return rv;
  }
  constructor(renderer, score, scrollSelector) {
    this.score = score;
    this.renderer = renderer;
    const scoreJson = score.serialize();
    this.scroller = new suiScroller(scrollSelector);
    this.pasteBuffer = new PasteBuffer();
    this.storePaste = new PasteBuffer();
    this.tracker = new suiTracker(this.renderer, this.scroller, this.pasteBuffer);
    this.renderer.setMeasureMapper(this.tracker);

    this.storeScore = SmoScore.deserialize(JSON.stringify(scoreJson));
    this.undoBuffer = new UndoBuffer();
    this.layoutDemon = new SuiRenderDemon({ view: this, undoBuffer: this.undoBuffer });
    this.storeUndo = new UndoBuffer();
    this.staffMap = this.defaultStaffMap;
    SuiScoreView._instance = this; // for debugging
    this.setMappedStaffIds();
    this.actionBuffer = new SmoActionRecord();
    this.tracker.recordBuffer = this.actionBuffer;
  }
  startRenderingEngine() {
    this.layoutDemon.startDemon();
  }
  static debugUnitTest() {
    const dbg = SuiScoreView.Instance;
    if (dbg === null) {
      return;
    }
    dbg.changeScore(SmoScore.getDefaultScore());
    dbg.actionBuffer.actions = JSON.parse(testCase1);
    dbg.actionBuffer.executeIndex = SuiScoreView.Instance.actionBuffer.actions.length;
    dbg.replayActions();
  }

  getView() {
    const rv = [];
    let i = 0;
    for (i = 0; i < this.storeScore.staves.length; ++i) {
      const show = this.staffMap.indexOf(i) >= 0;
      rv.push({ show });
    }
    return rv;
  }
  playActions(actionJson) {
    if (!this.actionBuffer.endCondition) {
      return;
    }
    this.oldActions = JSON.parse(JSON.stringify(this.actionBuffer.actions));
    this.actionBuffer.actions = actionJson;
    this.actionBuffer.resetRunner();
    this.replayActions();
  }
  setMappedStaffIds() {
    this.score.staves.forEach((staff) => {
      staff.mappedStaffId = this.staffMap[staff.staffId];
    });
  }

  // ### setView
  // Send a list of rows with a 'show' boolean in each, we display that line
  // in the staff and hide the rest
  setView(rows) {
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
    this.renderer.score = this.score;
    this.renderer.setViewport(true);
  }
  // ### changeScore
  // Update the view after loading or restoring a completely new score
  changeScore(score) {
    this._undoScore('load new score');
    this.renderer.score = score;
    this.renderer.setViewport(true);
    this.storeScore = SmoScore.deserialize(JSON.stringify(score.serialize()));
    this.score = score;
    this.staffMap = this.defaultStaffMap;
    this.actionBuffer.clearActions();
    setTimeout(() => {
      $('body').trigger('forceResizeEvent');
    }, 1);
  }
  preserveScroll() {
    const scrollState = this.scroller.scrollState;
    this.renderer.renderPromise().then(() => {
      this.scroller.restoreScrollState(scrollState);
    });
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
