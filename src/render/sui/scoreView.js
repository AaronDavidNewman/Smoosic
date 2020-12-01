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
    return this.score.staves.find((st) => selection.staff.attrs.id === st.attrs.id);
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
  _undoColumn(label, measureIndex) {
    this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.COLUMN, null, { score: this.score, measureIndex });
    this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.COLUMN, null, { score: this.storeScore, measureIndex });
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
    this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.MEASURE, sel.selector, sel.measure);
    return sel;
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

  // ###_renderChangedMeasures
  // Setup undo for operation that affects the whole score
  _undoScore(label) {
    this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.SCORE, null, this.score);
    this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.SCORE, null, this.storeScore);
  }

  _getEquivalentSelection(selection) {
    if (typeof(selection.selector.tick) === 'undefined') {
      return SmoSelection.measureSelection(this.storeScore, this.staffMap[selection.selector.staff], selection.selector.measure);
    }
    if (typeof(selection.selector.pitches) === 'undefined') {
      return SmoSelection.noteSelection(this.storeScore, this.staffMap[selection.selector.staff], selection.selector.measure, selection.selector.voice,
        selection.selector.tick);
    }
    return SmoSelection.pitchSelection(this.storeScore, this.staffMap[selection.selector.staff], selection.selector.measure, selection.selector.voice,
      selection.selector.tick, selection.selector.pitches);
  }

  _getEquivalentGraceNote(selection, gn) {
    return selection.note.getGraceNotes().find((gg) => gg.attrs.id === gn.attrs.id);
  }

  static get Instance() {
    if (typeof(SuiScoreView._instance) !== 'undefined') {
      return SuiScoreView._instance;
    }
    return null;
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
  constructor(renderer, score) {
    this.score = score;
    this.renderer = renderer;
    const scoreJson = score.serialize();
    const scroller = new suiScroller();
    this.pasteBuffer = new PasteBuffer();
    this.storePaste = new PasteBuffer();
    this.tracker = new suiTracker(this.renderer, scroller, this.pasteBuffer);
    this.renderer.setMeasureMapper(this.tracker);

    this.storeScore = SmoScore.deserialize(JSON.stringify(scoreJson));
    this.undoBuffer = new UndoBuffer();
    this.storeUndo = new UndoBuffer();
    this.staffMap = this.defaultStaffMap;
    SuiScoreView._instance = this;
  }
  static debugSwapScore() {
    const dbg = SuiScoreView.Instance;
    if (dbg === null) {
      return;
    }
    const newScore = SmoScore.deserialize(JSON.stringify(dbg.storeScore.serialize()));
    dbg.changeScore(newScore);
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

  // ### setView
  // Send a list of rows with a 'show' boolean in each, we display that line
  // in the staff and hide the rest
  setView(rows) {
    let i = 0;
    const any = rows.find((row) => row.show === true);
    if (!any) {
      return;
    }
    const nscore = SmoScore.deserialize(JSON.stringify(this.storeScore.serialize()));
    nscore.staves = [];
    const staffMap = [];
    for (i = 0; i < rows.length; ++i) {
      const row = rows[i];
      if (row.show) {
        const staff = SmoSystemStaff.deserialize(this.storeScore.staves[i].serialize());
        nscore.staves.push(staff);
        staffMap.push(i);
      }
    }
    nscore.numberStaves();
    this.staffMap = staffMap;
    this.score = nscore;
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
    this._undoScore();
    this.renderer.score = score;
    this.renderer.setViewport(true);
    this.storeScore = SmoScore.deserialize(JSON.stringify(score.serialize()));
    this.score = score;
    this.staffMap = this.defaultStaffMap;
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
