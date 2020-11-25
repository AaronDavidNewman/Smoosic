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

  batchDurationOperation(operation) {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections();
    const grace = this.tracker.getSelectedGraceNotes();
    const graceMap = { doubleDuration: 'doubleGraceNoteDuration',
      halveDuration: 'halveGraceNoteDuration' };
    if (grace.length && typeof(graceMap[operation]) !== 'undefined') {
      operation = graceMap[operation];
      grace.forEach((artifact) => {
        SmoOperation[operation](artifact.selection, artifact.modifier);
        const altSelection = this._getEquivalentSelection(artifact.selection);
        SmoOperation[operation](this._getEquivalentSelection(artifact.selection),
          this._getEquivalentGraceNote(altSelection, artifact.modifier));
      });
    } else {
      const altAr = [];
      selections.forEach((sel) => {
        altAr.push(this._getEquivalentSelection(sel));
      });
      SmoOperation.batchSelectionOperation(this.score, selections, operation);
      SmoOperation.batchSelectionOperation(this.storeScore, altAr, operation);
    }
    this._renderChangedMeasures(measureSelections);
  }
  toggleArticulation(articulation, ctor) {
    const measureSelections = this._undoTrackerMeasureSelections();
    this.tracker.selections.forEach((sel) => {
      if (ctor === 'SmoArticulation') {
        const aa = new SmoArticulation({ articulation });
        const altAa = new SmoArticulation({ articulation });
        altAa.attrs.id = aa.attrs.id;
        SmoOperation.toggleArticulation(sel, aa);
        SmoOperation.toggleArticulation(this._getEquivalentSelection(sel), altAa);
      } else {
        const aa = new SmoOrnament({ ornament: articulation });
        const altAa = new SmoOrnament({ ornament: articulation });
        altAa.attrs.id = aa.attrs.id;
        SmoOperation.toggleOrnament(sel,  aa);
        SmoOperation.toggleOrnament(this._getEquivalentSelection(sel), altAa);
      }
    });
    this._renderChangedMeasures(measureSelections);
  }

  makeTuplet(numNotes) {
    const selection = this.tracker.selections[0];
    const measureSelections = this._undoTrackerMeasureSelections();
    SmoOperation.makeTuplet(selection, numNotes);
    SmoOperation.makeTuplet(this._getEquivalentSelection(selection), numNotes);
    this._renderChangedMeasures(measureSelections);
  }
  unmakeTuplet() {
    const selection = this.tracker.selections[0];
    const measureSelections = this._undoTrackerMeasureSelections();
    SmoOperation.unmakeTuplet(selection);
    SmoOperation.unmakeTuplet(this._getEquivalentSelection(selection));
    this._renderChangedMeasures(measureSelections);
  }

  setInterval(interval) {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections();
    selections.forEach((selected) => {
      SmoOperation.interval(selected, interval);
      SmoOperation.interval(this._getEquivalentSelection(selected), interval);
    });
    this._renderChangedMeasures(measureSelections);
  }

  collapseChord() {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections();
    selections.forEach((selected) => {
      const pp = JSON.parse(JSON.stringify(selected.note.pitches[0]));
      const altpp = JSON.parse(JSON.stringify(selected.note.pitches[0]));
      // No operation for this?
      selected.note.pitches = [pp];
      const altSelection = this._getEquivalentSelection(selected);
      altSelection.note.pitches = [altpp];
    });
    this._renderChangedMeasures(measureSelections);
  }

  makeRest() {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections();
    selections.forEach((selection) => {
      SmoOperation.makeRest(selection);
    });
    this._renderChangedMeasures(measureSelections);
  }
  toggleBeamGroup() {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections();
    selections.forEach((selection) => {
      SmoOperation.toggleBeamGroup(selection);
    });
    this._renderChangedMeasures(measureSelections);
  }
  toggleBeamDirection() {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections();
    SmoOperation.toggleBeamDirection(selections);
    this._renderChangedMeasures(measureSelections);
  }
  beamSelections() {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections();
    SmoOperation.beamSelections(selections);
    this._renderChangedMeasures(measureSelections);
  }

  setPitch(letter) {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections();
    selections.forEach((selected) => {
      var selector = selected.selector;
      var hintSel = SmoSelection.lastNoteSelection(this.score,
        selector.staff, selector.measure, selector.voice, selector.tick);
      if (!hintSel) {
        hintSel = SmoSelection.nextNoteSelection(this.score,
          selector.staff, selector.measure, selector.voice, selector.tick);
      }
      // The selection no longer exists, possibly deleted
      if (!hintSel) {
        return;
      }
      const pitch = smoMusic.getLetterNotePitch(hintSel.note.pitches[0],
        letter, hintSel.measure.keySignature);
      SmoOperation.setPitch(selected, pitch);
      SmoOperation.setPitch(this._getEquivalentSelection(selected), pitch);
      this.tracker.moveSelectionRight(null, true);
    });
    if (selections.length === 1) {
      suiOscillator.playSelectionNow(selections[0].note);
    }
    this._renderChangedMeasures(measureSelections);
  }
  copy() {
    this.pasteBuffer.setSelections(this.score, this.tracker.selections);
    const altAr = [];
    this.tracker.selections.forEach((sel) => {
      const noteSelection = this._getEquivalentSelection(sel);
      altAr.push(noteSelection);
    });
    this.storePaste.setSelections(this.storeScore, altAr);
  }
  paste() {
    // We undo the whole score on a paste, since we don't yet know the
    // extent of the overlap
    this._undoScore('paste');
    const firstSelection = this.tracker.selections[0];
    const pasteTarget = firstSelection.selector;
    const altSelection = this._getEquivalentSelection(firstSelection);
    const altTarget = altSelection.selector;
    this.pasteBuffer.pasteSelections(this.score, pasteTarget);
    this.storePaste.pasteSelections(this.storeScore, altTarget);
    this._renderChangedMeasures(this.pasteBuffer.replacementMeasures);
  }
  setNoteHead(head) {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections();
    SmoOperation.setNoteHead(selections, head);
    this._renderChangedMeasures(measureSelections);
  }

  deleteMeasure() {
    this._undoScore('Delete Measure');
    const selection = this.tracker.selections[0];
    const index = selection.selector.measure;
    // Unrender the deleted measure
    this.score.staves.forEach((staff) => {
      this.renderer.unrenderMeasure(staff.measures[index]);
      this.renderer.unrenderMeasure(staff.measures[staff.measures.length - 1]);

      // A little hacky - delete the modifiers if they start or end on
      // the measure
      staff.modifiers.forEach((modifier) => {
        if (modifier.startSelector.measure === index || modifier.endSelector.measure === index) {
          $(this.renderer.context.svg).find('g.' + modifier.attrs.id).remove();
        }
      });
    });
    this.tracker.deleteMeasure(selection);
    this.score.deleteMeasure(index);
    this.storeScore.deleteMeasure(index);
    this.tracker.loadScore();
    this.renderer.setRefresh();
  }
  addMeasure(append) {
    this._undoScore('Add Measure');
    let pos = 0;
    const measure = this.tracker.getFirstMeasureOfSelection();
    const nmeasure = SmoMeasure.getDefaultMeasureWithNotes(measure);
    const altMeasure = SmoMeasure.deserialize(nmeasure.serialize());

    pos = measure.measureNumber.measureIndex;
    if (append) {
      pos += 1;
    }
    nmeasure.measureNumber.measureIndex = pos;
    nmeasure.setActiveVoice(0);
    this.score.addMeasure(pos, nmeasure);
    this.storeScore.addMeasure(pos, altMeasure);

    this.renderer.clearLine(measure);
    this.renderer.setRefresh();
  }

  // ### _undoTrackerSelections
  // Add to the undo buffer the current set of measures selected.
  _undoTrackerMeasureSelections() {
    const measureSelections = SmoSelection.getMeasureList(this.tracker.selections);
    measureSelections.forEach((measureSelection) => {
      const equiv = this._getEquivalentSelection(measureSelection);
      this.undoBuffer.addBuffer('transpose selections', UndoBuffer.bufferTypes.MEASURE, measureSelection.selector, measureSelection.measure);
      this.storeUndo.addBuffer('transpose selections', UndoBuffer.bufferTypes.MEASURE, equiv.selector, equiv.measure);
    });
    return measureSelections;
  }
  _renderChangedMeasures(measureSelections) {
    measureSelections.forEach((measureSelection) => {
      this.renderer.addToReplaceQueue(measureSelection);
    });
  }

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
    this.storePaste = new PasteBuffer();
    this.tracker = new suiTracker(this.renderer, scroller, this.pasteBuffer);
    this.renderer.setMeasureMapper(this.tracker);

    this.storeScore = SmoScore.deserialize(JSON.stringify(scoreJson));
    this.undoBuffer = new UndoBuffer();
    this.storeUndo = new UndoBuffer();
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
    this.storeScore = this.storeUndo.undo(this.storeScore);
  }
}
