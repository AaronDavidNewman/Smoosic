// ## SuiScoreView
// Do a thing to the music.  Save in undo buffer before.  Render the score to reflect
// the change after.  Map the operation on the score view to the actual score.
// eslint-disable-next-line no-unused-vars
class SuiScoreView {
  addTextGroup(textGroup) {
    SmoUndoable.changeTextGroup(this.score, this.undoBuffer, textGroup,
      UndoBuffer.bufferSubtypes.ADD);
    this.renderer.renderScoreModifiers();
  }

  removeTextGroup(textGroup) {
    SmoUndoable.changeTextGroup(this.score, this.undoBuffer, textGroup,
      UndoBuffer.bufferSubtypes.REMOVE);
    this.renderer.renderScoreModifiers();
  }

  updateTextGroup(oldVersion) {
    SmoUndoable.changeTextGroup(this.score, this.undoBuffer, oldVersion,
      UndoBuffer.bufferSubtypes.UPDATE);
    // TODO: only render the one TG.
    this.renderer.renderScoreModifiers();
  }

  addGraceNote() {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections();
    selections.forEach((selection) => {
      const index = selection.note.getGraceNotes().length;
      const pitches = JSON.parse(JSON.stringify(selection.note.pitches));
      const grace = new SmoGraceNote({ pitches, ticks:
        { numerator: 2048, denominator: 1, remainder: 0 } });
      SmoOperation.addGraceNote(selection, grace, index);

      const altPitches = JSON.parse(JSON.stringify(selection.note.pitches));
      const altGrace =  new SmoGraceNote({ altPitches, ticks:
        { numerator: 2048, denominator: 1, remainder: 0 } });
      altGrace.attrs.id = grace.attrs.id;
      const altSelection = this._getEquivalentSelection(selection);
      SmoOperation.addGraceNote(altSelection, altGrace, index);
    });
    this._renderChangedMeasures(measureSelections);
  }

  removeGraceNote() {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections();
    selections.forEach((selection) => {
      // TODO: get the correct offset
      SmoOperation.removeGraceNote(selection, 0);
      SmoOperation.removeGraceNote(this._getEquivalentSelection(selection), 0);
    });
    this._renderChangedMeasures(measureSelections);
  }

  slashGraceNotes() {
    const grace = this.tracker.getSelectedGraceNotes();
    const measureSelections = this._undoTrackerMeasureSelections();
    grace.forEach((gn) => {
      SmoOperation.slashGraceNotes(gn);
      const altSelection = this._getEquivalentSelection(gn.selection);
      const altGn = this._getEquivalentGraceNote(altSelection, gn.modifier);
      SmoOperation.slashGraceNotes({ selection: altSelection, modifier: altGn });
    });
    this._renderChangedMeasures(measureSelections);
  }

  // ### transposeSelections
  // tranpose whatever is selected in tracker the given offset.
  transposeSelections(offset) {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections();
    const grace = this.tracker.getSelectedGraceNotes();
    if (grace.length) {
      grace.forEach((artifact) => {
        const altSelection = this._getEquivalentSelection(artifact.selection);
        SmoOperation.transposeGraceNotes(artifact.selection, artifact.modifier, offset);
        SmoOperation.transposeGraceNotes(altSelection,
          this._getEquivalentGraceNote(altSelection, artifact.modifier), offset);
      });
    } else {
      selections.forEach((selected) => {
        SmoOperation.transpose(selected, offset);
        SmoOperation.transpose(this._getEquivalentSelection(selected), offset);
      });
      if (selections.length === 1) {
        suiOscillator.playSelectionNow(selections[0]);
      }
    }
    this._renderChangedMeasures(measureSelections);
  }
  toggleEnharmonic() {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections();
    const grace = this.tracker.getSelectedGraceNotes();
    if (grace.length) {
      grace.forEach((artifact) => {
        SmoOperation.toggleGraceNoteEnharmonic(artifact.selection, artifact.modifier);
        const altSelection = this._getEquivalentSelection(artifact.selection);
        SmoOperation.toggleGraceNoteEnharmonic(this._getEquivalentSelection(artifact.selection),
          this._getEquivalentGraceNote(altSelection, artifact.modifier));
      });
    } else {
      selections.forEach((selected) => {
        if (typeof(selected.selector.pitches) === 'undefined') {
          selected.selector.pitches = [];
        }
        SmoOperation.toggleEnharmonic(selected);
        SmoOperation.toggleEnharmonic(this._getEquivalentSelection(selected));
      });
    }
    this._renderChangedMeasures(measureSelections);
  }

  toggleCourtesyAccidentals() {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections();
    const grace = this.tracker.getSelectedGraceNotes();
    if (grace.length) {
      grace.forEach((artifact) => {
        SmoOperation.toggleGraceNoteCourtesy(artifact.selection, artifact.modifier);
        SmoUndoable.toggleGraceNoteCourtesyAccidental(
          this._getEquivalentSelection(artifact.selection), artifact.modifier);
      });
    } else {
      selections.forEach((selection) => {
        SmoOperation.toggleCourtesyAccidental(selection);
        SmoOperation.toggleCourtesyAccidental(this._getEquivalentSelection(selection));
      });
    }
    this._renderChangedMeasures(measureSelections);
  }
  // ### _undoTrackerSelections
  // Add to the undo buffer the current set of measures selected.
  _undoTrackerMeasureSelections() {
    const measureSelections = SmoSelection.getMeasureList(this.tracker.selections);
    measureSelections.forEach((measureSelection) => {
      const equiv = this._getEquivalentSelection(measureSelection);
      this.undoBuffer.addBuffer('transpose selections', UndoBuffer.bufferTypes.MEASURE, measureSelection.selector, measureSelection.measure);
      this.storeBuffer.addBuffer('transpose selections', UndoBuffer.bufferTypes.MEASURE, equiv.selector, equiv.measure);
    });
    return measureSelections;
  }
  _renderChangedMeasures(measureSelections) {
    measureSelections.forEach((measureSelection) => {
      this.renderer.addToReplaceQueue(measureSelection);
    });
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

  // ### _createStaveMap
  // create a map for staves from the view score (this.score) to the model score
  // (this.storeScore)
  _createStaveMap() {
    let i = 0;
    let j = 0;
    this.staffMap = [];
    for (i = 0; i < this.score.staves.length; ++i) {
      const istaff = this.score.staves[i];
      for (j = 0; j < this.storeScore.staves.length; ++j) {
        const jstaff = this.storeScore.staves[j];
        if (jstaff.attrs.id === istaff.attrs.id) {
          rv.push(j);
          break;
        }
      }
    }
  }
  constructor(renderer, score) {
    this.score = score;
    this.renderer = renderer;
    const scoreJson = score.serialize();
    const scroller = new suiScroller();
    this.pasteBuffer = new PasteBuffer();
    this.tracker = new suiTracker(this.renderer, scroller, this.pasteBuffer);
    this.renderer.setMeasureMapper(this.tracker);

    this.storeScore = SmoScore.deserialize(JSON.stringify(scoreJson));
    this.undoBuffer = new UndoBuffer();
    this.storeBuffer = new UndoBuffer();
    this._createStaveMap();
  }

  changeScore(score) {
    this.renderer.score = score;
    this.renderer.setViewport(true);
    setTimeout(() => {
      $('body').trigger('forceResizeEvent');
    }, 1);
  }

  undo() {
    this.renderer.undo(this.undoBuffer);
    this.storeScore = this.storeBuffer.undo(this.storeScore);
  }
}
