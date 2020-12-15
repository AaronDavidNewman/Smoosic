// ## ScoreViewOperations
// MVVM-like operations on the displayed score.
// All operations that can be performed on a 'live' score go through this
// module.  It maps the score view to the actual score and makes sure the
// model and view stay in sync.
/* global: SmoSelection */
// eslint-disable-next-line no-unused-vars
class SuiScoreViewOperations extends SuiScoreView {
  addTextGroup(textGroup) {
    const altNew = SmoTextGroup.deserialize(textGroup.serialize());
    SmoUndoable.changeTextGroup(this.score, this.undoBuffer, textGroup,
      UndoBuffer.bufferSubtypes.ADD);
    SmoUndoable.changeTextGroup(this.storeScore, this.storeUndo, altNew,
      UndoBuffer.bufferSubtypes.ADD);
    this.renderer.renderScoreModifiers();
  }

  removeTextGroup(textGroup) {
    const index = this.score.textGroups.findIndex((grp) => textGroup.attrs.id === grp.attrs.id);
    const altGroup = this.storeScore.textGroups[index];
    SmoUndoable.changeTextGroup(this.score, this.undoBuffer, textGroup,
      UndoBuffer.bufferSubtypes.REMOVE);
    SmoUndoable.changeTextGroup(this.storeScore, this.storeUndo, altGroup,
      UndoBuffer.bufferSubtypes.REMOVE);
    this.renderer.renderScoreModifiers();
  }

  updateTextGroup(oldVersion, newVersion) {
    const index = this.score.textGroups.findIndex((grp) => oldVersion.attrs.id === grp.attrs.id);
    SmoUndoable.changeTextGroup(this.score, this.undoBuffer, oldVersion,
      UndoBuffer.bufferSubtypes.UPDATE);
    SmoUndoable.changeTextGroup(this.storeScore, this.storeUndo, this.storeScore.textGroups[index], UndoBuffer.bufferSubtypes.UPDATE);
    const altNew = SmoTextGroup.deserialize(newVersion.serialize());
    this.storeScore.textGroups[index] = altNew;

    // TODO: only render the one TG.
    this.renderer.renderScoreModifiers();
  }

  addRemoveMicrotone(tone) {
    const selections = this.tracker.selections;
    const altSelections = this._getEquivalentSelections(selections);
    const measureSelections = this._undoTrackerMeasureSelections('add/remove microtone');

    SmoOperation.addRemoveMicrotone(null, selections, tone);
    SmoOperation.addRemoveMicrotone(null, altSelections, tone);
    this._renderChangedMeasures(measureSelections);
  }
  // ### removeLyric
  // The lyric editor moves around, so we can't depend on the tracker for the
  // correct selection.  We get it directly from the editor.
  removeLyric(selection, lyric) {
    this._undoSelection('remove lyric', selection);
    selection.note.removeLyric(lyric);
    const equiv = this._getEquivalentSelection(selection);
    const storeLyric = equiv.note.getLyricForVerse(lyric.verse, lyric.parser);
    if (typeof(storeLyric) !== 'undefined') {
      equiv.note.removeLyric(lyric);
    }
    this.renderer.addToReplaceQueue(selection);
  }

  addOrUpdateLyric(selection, lyric) {
    this._undoSelection('update lyric', selection);
    selection.note.addLyric(lyric);
    const equiv = this._getEquivalentSelection(selection);
    equiv.note.addLyric(SmoNoteModifierBase.deserialize(lyric.serialize()));
    this.renderer.addToReplaceQueue(selection);
  }

  depopulateVoice() {
    const measureSelections = this._undoTrackerMeasureSelections('depopulate voice');
    measureSelections.forEach((selection) => {
      const ix = selection.measure.getActiveVoice();
      if (ix !== 0) {
        SmoOperation.depopulateVoice(selection, ix);
        SmoOperation.depopulateVoice(this._getEquivalentSelection(selection), ix);
      }
    });
    SmoOperation.setActiveVoice(this.score, 0);
    this._renderChangedMeasures(measureSelections);
  }
  populateVoice(index) {
    const measureSelections = this._undoTrackerMeasureSelections('populate voice');
    measureSelections.forEach((selection) => {
      SmoOperation.populateVoice(selection, index);
      SmoOperation.populateVoice(this._getEquivalentSelection(selection), index);
    });
    SmoOperation.setActiveVoice(this.score, index);
    this._renderChangedMeasures(measureSelections);
  }
  changeInstrument(instrument) {
    const measureSelections = this._undoTrackerMeasureSelections('change instrument');
    const selections = this.tracker.selections;
    const altSelections = this._getEquivalentSelections(selections);
    SmoOperation.changeInstrument(instrument, selections);
    SmoOperation.changeInstrument(instrument, altSelections);
    this._renderChangedMeasures(measureSelections);
  }
  setTimeSignature(timeSignature) {
    this._undoScore('Set time signature');
    const selections = this.tracker.selections;
    const altSelections = this._getEquivalentSelections(selections);
    SmoOperation.setTimeSignature(this.score, selections, timeSignature);
    SmoOperation.setTimeSignature(this.storeScore, altSelections, timeSignature);
    this.renderer.setDirty();
  }
  moveStaffUpDown(index) {
    this._undoScore('re-order staves');
    // Get staff to move
    const selection = this._getEquivalentSelection(this.tracker.selections[0]);
    // Make the move in the model, and reset the view so we can see the new
    // arrangement
    SmoOperation.moveStaffUpDown(this.storeScore, selection, index);
    const newScore = SmoScore.deserialize(JSON.stringify(this.storeScore.serialize()));
    this.changeScore(newScore);
  }
  addStaffGroupDown(braceType) {
    this._undoScore('group staves');
    const ft = this._getEquivalentSelection(this.tracker.getExtremeSelection(-1));
    const tt = this._getEquivalentSelection(this.tracker.getExtremeSelection(1));
    const selections = this._getEquivalentSelections(this.tracker.selections);
    SmoOperation.addConnectorDown(this.storeScore, selections, {
      startSelector: ft.selector, endSelector: tt.selector,
      mapType: SmoSystemGroup.mapTypes.allMeasures, leftConnector: braceType,
      rightConnector: SmoSystemGroup.connectorTypes.single
    });
    const newScore = SmoScore.deserialize(JSON.stringify(this.storeScore.serialize()));
    this.changeScore(newScore);
  }
  // ### updateTempoScore
  // Update the tempo for the entire score
  updateTempoScore(tempo, scoreMode) {
    let measureIndex = 0;
    this._undoScore('update score tempo');
    let startSelection = this.tracker.selections[0];
    if (!scoreMode) {
      startSelection = this.tracker.getExtremeSelection(-1);
    }
    const measureCount = this.score.staves[0].measures.length;
    let endSelection = SmoSelection.measureSelection(this.score,
      startSelection.selector.staff, measureCount - 1);
    if (!scoreMode) {
      endSelection = this.tracker.getExtremeSelection(1);
    }
    measureIndex = startSelection.selector.measure;
    while (measureIndex < endSelection.selector.measure) {
      const mi = measureIndex;
      this.score.staves.forEach((staff) => {
        SmoOperation.addTempo(this.score,
          SmoSelection.measureSelection(this.score,
            staff.staffId, mi), tempo);
      });
      measureIndex++;
    }
    measureIndex = startSelection.selector.measure;
    while (measureIndex < endSelection.selector.measure) {
      const mi = measureIndex;
      this.storeScore.staves.forEach((staff) => {
        SmoOperation.addTempo(this.storeScore,
          SmoSelection.measureSelection(this.storeScore,
            staff.staffId, mi), tempo);
      });
      measureIndex++;
    }
    this.renderer.setRefresh();
  }
  removeTempo(scoreMode) {
    const startSelection = this.tracker.selections[0];
    if (startSelection.selector.measure > 0) {
      const target = this.measures[0].measureNumber.measureIndex - 1;
      const tempo = this.score.staves[0].measures[target].getTempo();
      this.updateTempoScore(tempo, scoreMode);
    } else {
      this.updateTempoScore(new SmoTempoText(), scoreMode);
    }
  }
  addGraceNote() {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('add grace note');
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
    const measureSelections = this._undoTrackerMeasureSelections('remove grace note');
    selections.forEach((selection) => {
      // TODO: get the correct offset
      SmoOperation.removeGraceNote(selection, 0);
      SmoOperation.removeGraceNote(this._getEquivalentSelection(selection), 0);
    });
    this._renderChangedMeasures(measureSelections);
  }

  slashGraceNotes() {
    const grace = this.tracker.getSelectedGraceNotes();
    const measureSelections = this._undoTrackerMeasureSelections('slash grace note toggle');
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
    const measureSelections = this._undoTrackerMeasureSelections('transpose');
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
    if (selections.length === 1) {
      suiOscillator.playSelectionNow(selections[0]);
    }
    this._renderChangedMeasures(measureSelections);
  }
  toggleEnharmonic() {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('toggle enharmonic');
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
    const measureSelections = this._undoTrackerMeasureSelections('toggle courtesy accidental');
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
    const measureSelections = this._undoTrackerMeasureSelections('change duration');
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
      const altAr = this._getEquivalentSelections(selections);
      SmoOperation.batchSelectionOperation(this.score, selections, operation);
      SmoOperation.batchSelectionOperation(this.storeScore, altAr, operation);
    }
    this._renderChangedMeasures(measureSelections);
  }
  toggleArticulation(articulation, ctor) {
    const measureSelections = this._undoTrackerMeasureSelections('toggle articulation');
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
    const measureSelections = this._undoTrackerMeasureSelections('make tuplet');
    SmoOperation.makeTuplet(selection, numNotes);
    SmoOperation.makeTuplet(this._getEquivalentSelection(selection), numNotes);
    this._renderChangedMeasures(measureSelections);
  }
  unmakeTuplet() {
    const selection = this.tracker.selections[0];
    const measureSelections = this._undoTrackerMeasureSelections('unmake tuplet');
    SmoOperation.unmakeTuplet(selection);
    SmoOperation.unmakeTuplet(this._getEquivalentSelection(selection));
    this._renderChangedMeasures(measureSelections);
  }

  setInterval(interval) {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('set interval');
    selections.forEach((selected) => {
      SmoOperation.interval(selected, interval);
      SmoOperation.interval(this._getEquivalentSelection(selected), interval);
    });
    this._renderChangedMeasures(measureSelections);
  }

  collapseChord() {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('collapse chord');
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
    const measureSelections = this._undoTrackerMeasureSelections('make rest');
    selections.forEach((selection) => {
      SmoOperation.makeRest(selection);
    });
    this._renderChangedMeasures(measureSelections);
  }
  toggleBeamGroup() {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('toggle beam group');
    selections.forEach((selection) => {
      SmoOperation.toggleBeamGroup(selection);
      SmoOperation.toggleBeamGroup(this._getEquivalentSelection(selection));
    });
    this._renderChangedMeasures(measureSelections);
  }
  toggleBeamDirection() {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('toggle beam direction');
    SmoOperation.toggleBeamDirection(selections);
    SmoOperation.toggleBeamDirection(this._getEquivalentSelections(selections));
    this._renderChangedMeasures(measureSelections);
  }
  beamSelections() {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('beam selections');
    SmoOperation.beamSelections(selections);
    SmoOperation.beamSelections(this._getEquivalentSelections(selections));
    this._renderChangedMeasures(measureSelections);
  }
  addKeySignature(keySignature) {
    const measureSelections = this._undoTrackerMeasureSelections('set key signature ' + keySignature);
    measureSelections.forEach((sel) => {
      SmoOperation.addKeySignature(this.score, sel, keySignature);
      SmoOperation.addKeySignature(this.storeScore, this._getEquivalentSelection(sel), keySignature);
    });
    this._renderChangedMeasures(measureSelections);
  }

  setPitch(letter) {
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('set pitch ' + letter);
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
      suiOscillator.playSelectionNow(selections[0]);
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
    const measureSelections = this._undoTrackerMeasureSelections('set note head');
    SmoOperation.setNoteHead(selections, head);
    SmoOperation.setNoteHead(this._getEquivalentSelections(selections), head);
    this._renderChangedMeasures(measureSelections);
  }
  setMeasureProportion(value) {
    let i = 0;
    let j = 0;
    const selection = this.tracker.selections[0];
    const rect = this._getRectangleFromStaffGroup(selection);
    this._undoRectangle('Set measure proportion', rect.startSelector, rect.endSelector);
    for (i = rect.startSelector.staff; i <= rect.endSelector.staff; i++) {
      for (j = rect.startSelector.measure; j <= rect.endSelector.measure; j++) {
        const target = SmoSelection.measureSelection(this.score, i, j);
        const altTarget = this._getEquivalentSelection(target);
        this.renderer.addToReplaceQueue(target);
        SmoOperation.setMeasureProportion(target, value);
        SmoOperation.setMeasureProportion(altTarget, value);
      }
    }
  }
  setAutoJustify(value) {
    let i = 0;
    let j = 0;
    const selection = this.tracker.selections[0];
    const rect = this._getRectangleFromStaffGroup(selection);
    this._undoRectangle('Set measure proportion', rect.startSelector, rect.endSelector);
    for (i = rect.startSelector.staff; i <= rect.endSelector.staff; i++) {
      for (j = rect.startSelector.measure; j <= rect.endSelector.measure; j++) {
        const target = SmoSelection.measureSelection(this.score, i, j);
        const altTarget = this._getEquivalentSelection(target);
        this.renderer.addToReplaceQueue(target);
        SmoOperation.setAutoJustify(this.score, target, value);
        SmoOperation.setAutoJustify(this.storeScore, altTarget, value);
      }
    }
  }
  setCollisionAvoidance(value) {
    const selection = this.tracker.selections[0];
    this._undoColumn('set collision iterations', selection.selector.measure);
    const altSelection = this._getEquivalentSelection(selection);
    SmoOperation.setFormattingIterations(this.score, selection, value);
    SmoOperation.setFormattingIterations(this.storeScore, altSelection, value);
    this._renderChangedMeasures(selection);
  }
  // ### padMeasure
  // spacing to the left, and column means all measures in system.
  padMeasure(spacing, column) {
    let selection = this.tracker.selections[0];
    if (column) {
      this._undoColumn('set measure padding', selection.selector.measure);
      this.storeScore.staves.forEach((staff) => {
        const altSel = SmoSelection.measureSelection(this.storeScore, staff.staffId, selection.selector.measure);
        const viewSel = this._reverseMapSelection(altSel);
        SmoOperation.padMeasureLeft(altSel, spacing);
        if (viewSel) {
          SmoOperation.padMeasureLeft(viewSel, spacing);
          this.renderer.addToReplaceQueue(viewSel);
        }
      });
    } else {
      selection = this._undoFirstMeasureSelection('add dynamic');
      const altSel = this._getEquivalentSelection(selection);
      SmoOperation.padMeasureLeft(selection, spacing);
      SmoOperation.padMeasureLeft(altSel, spacing);
    }
  }
  addDynamic(dynamicText) {
    const selection = this._undoFirstMeasureSelection('add dynamic');
    const dynamic = new SmoDynamicText({
      selector: selection.selector,
      text: dynamicText,
      yOffsetLine: 11,
      fontSize: 38
    });
    SmoOperation.addDynamic(selection, dynamic);
    this._renderChangedMeasures(selection);
  }
  addEnding() {
    // TODO: we should have undo for columns
    this._undoScore('Add Volta');
    const ft = this.tracker.getExtremeSelection(-1);
    const tt = this.tracker.getExtremeSelection(1);
    const volta = new SmoVolta({ startBar: ft.selector.measure, endBar: tt.selector.measure, number: 1 });
    const altVolta = new SmoVolta({ startBar: ft.selector.measure, endBar: tt.selector.measure, number: 1 });
    SmoOperation.addEnding(this.storeScore, altVolta);
    SmoOperation.addEnding(this.score, volta);
    this.renderer.setRefresh();
  }
  setBarline(position, barline) {
    const obj = new SmoBarline({ position, barline });
    const altObj = new SmoBarline({ position, barline });
    const selection = this.tracker.selections[0];
    this._undoColumn('set barline', selection.selector.measure);
    SmoOperation.setMeasureBarline(this.score, selection, obj);
    SmoOperation.setMeasureBarline(this.storeScore, this._getEquivalentSelection(selection), altObj);
    this._renderChangedMeasures([selection]);
  }
  setRepeatSymbol(position, symbol) {
    const obj = new SmoRepeatSymbol({ position, symbol });
    const altObj = new SmoRepeatSymbol({ position, symbol });
    const selection = this.tracker.selections[0];
    this._undoColumn('set repeat symbol', selection.selector.measure);
    SmoOperation.setRepeatSymbol(this.score, selection, obj);
    SmoOperation.setRepeatSymbol(this.storeScore, this._getEquivalentSelection(selection), altObj);
    this._renderChangedMeasures(selection);
  }
  toggleRehearsalMark() {
    const selection = this.tracker.getExtremeSelection(-1);
    const altSelection = this._getEquivalentSelection(selection);
    const cmd = selection.measure.getRehearsalMark() ? 'removeRehearsalMark' : 'addRehearsalMark';
    SmoOperation[cmd](this.score, selection, new SmoRehearsalMark());
    SmoOperation[cmd](this.storeScore, altSelection, new SmoRehearsalMark());
    this._renderChangedMeasures(selection);
  }
  _lineOperation(op) {
    if (this.tracker.selections.length < 2) {
      return;
    }
    const measureSelections = this._undoTrackerMeasureSelections(op);
    const ft = this.tracker.getExtremeSelection(-1);
    const tt = this.tracker.getExtremeSelection(1);
    const ftAlt = this._getEquivalentSelection(ft);
    const ttAlt = this._getEquivalentSelection(tt);
    SmoOperation[op](ft, tt);
    SmoOperation[op](ftAlt, ttAlt);
    this._renderChangedMeasures(measureSelections);
  }
  crescendo() {
    this._lineOperation('crescendo');
  }
  decrescendo() {
    this._lineOperation('decrescendo');
  }
  slur() {
    this._lineOperation('slur');
  }
  setScoreLayout(layout) {
    this.score.layout = JSON.parse(JSON.stringify(layout));
    this.storeScore.layout = JSON.parse(JSON.stringify(layout));
    this.renderer.setViewport();
  }
  setEngravingFontFamily(family) {
    const engrave = this.score.fonts.find((fn) => fn.purpose === SmoScore.fontPurposes.ENGRAVING);
    const altEngrave = this.storeScore.fonts.find((fn) => fn.purpose === SmoScore.fontPurposes.ENGRAVING);
    engrave.family = family;
    altEngrave.family = family;
    SuiRenderState.setFont(engrave.family);
  }
  setLyricFont(fontInfo) {
    this._undoScore('Set Lyric Font');
    this.score.setLyricFont(fontInfo);
    this.storeScore.setLyricFont(fontInfo);
    this.renderer.setRefresh();
  }
  setLyricAdjustWidth(value) {
    this._undoScore('Set Lyric Adj Width');
    this.score.setLyricAdjustWidth(value);
    this.storeScore.setLyricAdjustWidth(value);
    this.renderer.setRefresh();
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
  removeStaff() {
    this._undoScore('Remove Instrument');
    // if we are looking at a subset of the score,
    // revert to the full score view before removing the staff.
    const newScore = SmoScore.deserialize(JSON.stringify(this.storeScore.serialize()));
    const sel = this.tracker.selections[0];
    const scoreSel = this._getEquivalentSelection(sel);
    const staffIndex = scoreSel.selector.staff;
    SmoOperation.removeStaff(newScore, staffIndex);
    this.changeScore(newScore);
    this.renderer.setRefresh();
  }
  addStaff(instrument) {
    this._undoScore('Add Instrument');
    // if we are looking at a subset of the score, we won't see the new staff.  So
    // revert to the full view
    const newScore = SmoScore.deserialize(JSON.stringify(this.storeScore.serialize()));
    SmoOperation.addStaff(newScore, instrument);
    this.changeScore(newScore);
    this.renderer.setRefresh();
  }
  saveScore(filename) {
    const json = this.storeScore.serialize();
    const jsonText = JSON.stringify(json);
    htmlHelpers.addFileLink(filename, jsonText, $('.saveLink'));
    $('.saveLink a')[0].click();
  }
  quickSave() {
    const scoreStr = JSON.stringify(this.storeScore.serialize());
    localStorage.setItem(smoSerialize.localScore, scoreStr);
  }
  createPickup(duration) {
    this._undoScore('create pickup');
    this.score.convertToPickupMeasure(0, duration);
    this.storeScore.convertToPickupMeasure(0, duration);
    this.renderer.setRefresh();
  }
  // ### stretchWidth
  // Stretch the width of a measure, including all columns in the measure since they are all
  // the same width
  setMeasureStretch(measureIndex, stretch) {
    this._undoColumn('Stretch measure', measureIndex);
    this.storeScore.staves.forEach((staff) => {
      const selection = SmoSelection.measureSelection(this.storeScore, staff.staffId, measureIndex);
      const delta = selection.measure.customStretch;
      selection.measure.customStretch = stretch;
      const nwidth = selection.measure.staffWidth - (delta - selection.measure.customStretch);
      selection.measure.setWidth(nwidth);
      const viewSelection = this._reverseMapSelection(selection);
      if (viewSelection) {
        viewSelection.measure.customStretch = stretch;
        viewSelection.measure.setWidth(nwidth);
        this.renderer.addToReplaceQueue(viewSelection);
      }
    });
  }
  forceSystemBreak(value) {
    const measureSelection = this.tracker.selections[0];
    this._undoColumn('System break', measureSelection.selector.measure);
    SmoOperation.setForceSystemBreak(this.score, measureSelection, value);
    SmoOperation.setForceSystemBreak(this.storeScore, this._getEquivalentSelection(measureSelection), value);
    this.renderer.setRefresh();
  }
}