// ## ScoreViewOperations
// MVVM-like operations on the displayed score.
// All operations that can be performed on a 'live' score go through this
// module.  It maps the score view to the actual score and makes sure the
// model and view stay in sync.
/* global: SmoSelection */
// eslint-disable-next-line no-unused-vars
class SuiScoreViewOperations extends SuiScoreView {
  addTextGroup(textGroup) {
    this.actionBuffer.addAction('addTextGroup', textGroup);
    const altNew = SmoTextGroup.deserialize(textGroup.serialize());
    SmoUndoable.changeTextGroup(this.score, this.undoBuffer, textGroup,
      UndoBuffer.bufferSubtypes.ADD);
    SmoUndoable.changeTextGroup(this.storeScore, this.storeUndo, altNew,
      UndoBuffer.bufferSubtypes.ADD);
    this.renderer.renderScoreModifiers();
  }

  removeTextGroup(textGroup) {
    this.actionBuffer.addAction('removeTextGroup', textGroup);
    const index = this.score.textGroups.findIndex((grp) => textGroup.attrs.id === grp.attrs.id);
    const altGroup = this.storeScore.textGroups[index];
    SmoUndoable.changeTextGroup(this.score, this.undoBuffer, textGroup,
      UndoBuffer.bufferSubtypes.REMOVE);
    SmoUndoable.changeTextGroup(this.storeScore, this.storeUndo, altGroup,
      UndoBuffer.bufferSubtypes.REMOVE);
    this.renderer.renderScoreModifiers();
  }

  updateTextGroup(oldVersion, newVersion) {
    this.actionBuffer.addAction('updateTextGroup', oldVersion, newVersion);
    const index = this.score.textGroups.findIndex((grp) => oldVersion.attrs.id === grp.attrs.id);
    SmoUndoable.changeTextGroup(this.score, this.undoBuffer, oldVersion,
      UndoBuffer.bufferSubtypes.UPDATE);
    SmoUndoable.changeTextGroup(this.storeScore, this.storeUndo, this.storeScore.textGroups[index], UndoBuffer.bufferSubtypes.UPDATE);
    const altNew = SmoTextGroup.deserialize(newVersion.serialize());
    this.storeScore.textGroups[index] = altNew;
    // TODO: only render the one TG.
    this.renderer.renderScoreModifiers();
  }
  updateProportionDefault(oldValue, newValue) {
    this.actionBuffer.addAction('updateProportionDefault', oldValue, newValue);
    this._undoScorePreferences('Update proportion');
    SmoOperation.updateProportionDefault(this.score, oldValue, newValue);
    SmoOperation.updateProportionDefault(this.storeScore, oldValue, newValue);
    this.renderer.setDirty();
  }
  // ### updateScorePreferences
  // The score preferences for view score have changed, sync them
  updateScorePreferences() {
    this._undoScorePreferences('Update preferences');
    // TODO: add action buffer here?
    smoSerialize.serializedMerge(SmoScore.preferences, this.score, this.storeScore);
    this.renderer.setDirty();
  }
  // ### updateScorePreferences
  // The score preferences for view score have changed, sync them
  updateScoreInfo(scoreInfo) {
    this._undoScorePreferences('Update preferences');
    // TODO: add action buffer here?
    this.score.scoreInfo = scoreInfo;
    this.storeScore.scoreInfo = JSON.parse(JSON.stringify(scoreInfo));
    this.renderer.setDirty();
  }

  addRemoveMicrotone(tone) {
    this.actionBuffer.addAction('addRemoveMicrotone', tone);
    const selections = this.tracker.selections;
    const altSelections = this._getEquivalentSelections(selections);
    const measureSelections = this._undoTrackerMeasureSelections('add/remove microtone');

    SmoOperation.addRemoveMicrotone(null, selections, tone);
    SmoOperation.addRemoveMicrotone(null, altSelections, tone);
    this._renderChangedMeasures(measureSelections);
  }
  addDynamic(dynamic) {
    const sel = this.tracker.selections[0];
    if (typeof(dynamic) === 'string') {
      dynamic = new SmoDynamicText({
        selector: sel.selector,
        text: dynamic,
        yOffsetLine: 11,
        fontSize: 38
      });
    }
    this.actionBuffer.addAction('addDynamic', dynamic);
    this._undoFirstMeasureSelection('add dynamic');
    this._removeDynamic(sel, dynamic);
    const equiv = this._getEquivalentSelection(sel);
    SmoOperation.addDynamic(sel, dynamic);
    SmoOperation.addDynamic(equiv, SmoNoteModifierBase.deserialize(dynamic.serialize()));
    this.renderer.addToReplaceQueue(sel);
  }
  _removeDynamic(selection, dynamic) {
    const equiv = this._getEquivalentSelection(selection);
    const altModifiers = equiv.note.getModifiers('SmoDynamicText');
    SmoOperation.removeDynamic(selection, dynamic);
    if (altModifiers.length) {
      SmoOperation.removeDynamic(equiv, altModifiers[0]);
    }
  }
  removeDynamic(dynamic) {
    const sel = this.tracker.modifierSelections[0];
    if (!sel) {
      return;
    }
    this.tracker.selections = [sel.selection];
    this.actionBuffer.addAction('removeDynamic', dynamic);
    this._undoFirstMeasureSelection('remove dynamic');
    this._removeDynamic(sel.selection, dynamic);
    this.renderer.addToReplaceQueue(sel.selection);
  }
  // ### deleteNote
  // we never really delete a note, but we will convert it into a rest and if it's
  // already a rest we will try to hide it.
  deleteNote() {
    this.actionBuffer.addAction('deleteNote');
    const measureSelections = this._undoTrackerMeasureSelections('delete note');
    this.tracker.selections.forEach((sel) => {
      const altSel = this._getEquivalentSelection(sel);

      // set the pitch to be a good position for the rest
      const pitch = JSON.parse(JSON.stringify(
        SmoMeasure.defaultPitchForClef[sel.measure.clef]));
      const altPitch = JSON.parse(JSON.stringify(
        SmoMeasure.defaultPitchForClef[altSel.measure.clef]));
      sel.note.pitches = [pitch];
      altSel.note.pitches = [altPitch];

      // If the note is a note, make it into a rest.  If the note is a rest already,
      // make it invisible.  If it is invisible already, make it back into a rest.
      if (sel.note.isRest() && !sel.note.hidden) {
        sel.note.makeHidden(true);
        altSel.note.makeHidden(true);
      } else {
        sel.note.makeRest();
        altSel.note.makeRest();
        sel.note.makeHidden(false);
        altSel.note.makeHidden(false);
      }
    });
    this._renderChangedMeasures(measureSelections);
  }
  // ### removeLyric
  // The lyric editor moves around, so we can't depend on the tracker for the
  // correct selection.  We get it directly from the editor.
  removeLyric(selector, lyric) {
    this.actionBuffer.addAction('removeLyric', selector, lyric);
    const selection = SmoSelection.noteFromSelector(this.score, selector);
    this._undoSelection('remove lyric', selection);
    selection.note.removeLyric(lyric);
    const equiv = this._getEquivalentSelection(selection);
    const storeLyric = equiv.note.getLyricForVerse(lyric.verse, lyric.parser);
    if (typeof(storeLyric) !== 'undefined') {
      equiv.note.removeLyric(lyric);
    }
    this.renderer.addToReplaceQueue(selection);
  }

  addOrUpdateLyric(selector, lyric) {
    this.actionBuffer.addAction('addOrUpdateLyric', selector, lyric);
    const selection = SmoSelection.noteFromSelector(this.score, selector);
    this._undoSelection('update lyric', selection);
    selection.note.addLyric(lyric);
    const equiv = this._getEquivalentSelection(selection);
    equiv.note.addLyric(SmoNoteModifierBase.deserialize(lyric.serialize()));
    this.renderer.addToReplaceQueue(selection);
  }

  depopulateVoice() {
    this.actionBuffer.addAction('depopulateVoice');
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
  _changeActiveVoice(index) {
    const measuresToAdd = [];
    const measureSelections = SmoSelection.getMeasureList(this.tracker.selections);
    measureSelections.forEach((measureSelection) => {
      if (index === measureSelection.measure.voices.length) {
        measuresToAdd.push(measureSelection);
      }
    });
    return measuresToAdd;
  }
  populateVoice(index) {
    const measuresToAdd = this._changeActiveVoice(index);
    if (measuresToAdd.length === 0) {
      SmoOperation.setActiveVoice(this.score, index);
      this.tracker.selectActiveVoice();
      return;
    }
    this.actionBuffer.addAction('populateVoice', index);
    measuresToAdd.forEach((selection) => {
      this._undoSelection('popualteVoice', selection);
      SmoOperation.populateVoice(selection, index);
      SmoOperation.populateVoice(this._getEquivalentSelection(selection), index);
    });
    SmoOperation.setActiveVoice(this.score, index);
    this._renderChangedMeasures(measuresToAdd);
  }
  changeInstrument(instrument) {
    this.actionBuffer.addAction('changeInstrument', instrument);
    const measureSelections = this._undoTrackerMeasureSelections('change instrument');
    const selections = this.tracker.selections;
    const altSelections = this._getEquivalentSelections(selections);
    SmoOperation.changeInstrument(instrument, selections);
    SmoOperation.changeInstrument(instrument, altSelections);
    this._renderChangedMeasures(measureSelections);
  }
  setTimeSignature(timeSignature) {
    this.actionBuffer.addAction('setTimeSignature', timeSignature);
    this._undoScore('Set time signature');
    const selections = this.tracker.selections;
    const altSelections = this._getEquivalentSelections(selections);
    SmoOperation.setTimeSignature(this.score, selections, timeSignature);
    SmoOperation.setTimeSignature(this.storeScore, altSelections, timeSignature);
    this._renderChangedMeasures(SmoSelection.getMeasureList(this.tracker.selections));
  }
  moveStaffUpDown(index) {
    this.actionBuffer.addAction('moveStaffUpDown', index);
    this._undoScore('re-order staves');
    // Get staff to move
    const selection = this._getEquivalentSelection(this.tracker.selections[0]);
    // Make the move in the model, and reset the view so we can see the new
    // arrangement
    SmoOperation.moveStaffUpDown(this.storeScore, selection, index);
    const newScore = SmoScore.deserialize(JSON.stringify(this.storeScore.serialize()));
    this.viewAll(newScore);
  }
  addOrUpdateStaffGroup(staffGroup) {
    this.actionBuffer.addAction('addOrUpdateStaffGroup', staffGroup);
    this._undoScore('group staves');
    // Assume that the view is now set to full score
    this.score.addOrReplaceSystemGroup(staffGroup);
    this.storeScore.addOrReplaceSystemGroup(staffGroup);
    this.renderer.setDirty();
  }
  addStaffGroupDown(braceType) {
    this.actionBuffer.addAction('addStaffGroupDown', braceType);
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
    this.viewAll(newScore);
  }
  // ### updateTempoScore
  // Update the tempo for the entire score
  updateTempoScore(tempo, scoreMode) {
    let measureIndex = 0;
    let startSelection = this.tracker.selections[0];
    this._undoScore('update score tempo');
    this.actionBuffer.addAction('updateTempoScore', tempo, scoreMode);
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
    while (measureIndex <= endSelection.selector.measure) {
      const mi = measureIndex;
      this.score.staves.forEach((staff) => {
        SmoOperation.addTempo(this.score,
          SmoSelection.measureSelection(this.score,
            staff.staffId, mi), tempo);
      });
      measureIndex++;
    }
    measureIndex = startSelection.selector.measure;
    while (measureIndex <= endSelection.selector.measure) {
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
    this.actionBuffer.addAction('removeTempo', scoreMode);
    const startSelection = this.tracker.selections[0];
    if (startSelection.selector.measure > 0) {
      const measureIx = startSelection.selector.measure - 1;
      const target = startSelection.staff.measures[measureIx];
      const tempo = target.getTempo();
      this.updateTempoScore(tempo, scoreMode);
    } else {
      this.updateTempoScore(new SmoTempoText(), scoreMode);
    }
  }
  addGraceNote() {
    this.actionBuffer.addAction('addGraceNote');
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('add grace note');
    selections.forEach((selection) => {
      const index = selection.note.getGraceNotes().length;
      const pitches = JSON.parse(JSON.stringify(selection.note.pitches));
      const grace = new SmoGraceNote({ pitches, ticks:
        { numerator: 2048, denominator: 1, remainder: 0 } });
      SmoOperation.addGraceNote(selection, grace, index);

      const altPitches = JSON.parse(JSON.stringify(selection.note.pitches));
      const altGrace =  new SmoGraceNote({ pitches: altPitches, ticks:
        { numerator: 2048, denominator: 1, remainder: 0 } });
      altGrace.attrs.id = grace.attrs.id;
      const altSelection = this._getEquivalentSelection(selection);
      SmoOperation.addGraceNote(altSelection, altGrace, index);
    });
    this._renderChangedMeasures(measureSelections);
  }

  removeGraceNote() {
    this.actionBuffer.addAction('removeGraceNote');
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
    this.actionBuffer.addAction('slashGraceNotes');
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
    this.actionBuffer.addAction('transposeSelections', offset);
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
      if (selections.length === 1 && this.score.preferences.autoPlay) {
        suiOscillator.playSelectionNow(selections[0]);
      }
    }
    this._renderChangedMeasures(measureSelections);
  }
  toggleEnharmonic() {
    this.actionBuffer.addAction('toggleEnharmonic');
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
    this.actionBuffer.addAction('toggleCourtesyAccidentals');
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
    this.actionBuffer.addAction('batchDurationOperation', operation);
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
    this.actionBuffer.addAction('toggleArticulation', articulation, ctor);
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
    this.actionBuffer.addAction('makeTuplet', numNotes);
    const selection = this.tracker.selections[0];
    const measureSelections = this._undoTrackerMeasureSelections('make tuplet');
    SmoOperation.makeTuplet(selection, numNotes);
    SmoOperation.makeTuplet(this._getEquivalentSelection(selection), numNotes);
    this._renderChangedMeasures(measureSelections);
  }
  unmakeTuplet() {
    this.actionBuffer.addAction('unmakeTuplet');
    const selection = this.tracker.selections[0];
    const measureSelections = this._undoTrackerMeasureSelections('unmake tuplet');
    SmoOperation.unmakeTuplet(selection);
    SmoOperation.unmakeTuplet(this._getEquivalentSelection(selection));
    this._renderChangedMeasures(measureSelections);
  }

  setInterval(interval) {
    this.actionBuffer.addAction('setInterval', interval);
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('set interval');
    selections.forEach((selected) => {
      SmoOperation.interval(selected, interval);
      SmoOperation.interval(this._getEquivalentSelection(selected), interval);
    });
    this._renderChangedMeasures(measureSelections);
  }

  collapseChord() {
    this.actionBuffer.addAction('collapseChord');
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
    this.actionBuffer.addAction('makeRest');
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('make rest');
    selections.forEach((selection) => {
      SmoOperation.toggleRest(selection);
      const altSel = this._getEquivalentSelection(selection);
      SmoOperation.toggleRest(altSel);
    });
    this._renderChangedMeasures(measureSelections);
  }
  toggleBeamGroup() {
    this.actionBuffer.addAction('toggleBeamGroup');
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('toggle beam group');
    selections.forEach((selection) => {
      SmoOperation.toggleBeamGroup(selection);
      SmoOperation.toggleBeamGroup(this._getEquivalentSelection(selection));
    });
    this._renderChangedMeasures(measureSelections);
  }
  toggleBeamDirection() {
    this.actionBuffer.addAction('toggleBeamDirection');
    const selections = this.tracker.selections;
    if (selections.length < 1) {
      return;
    }
    const measureSelections = this._undoTrackerMeasureSelections('toggle beam direction');
    SmoOperation.toggleBeamDirection(selections);
    SmoOperation.toggleBeamDirection(this._getEquivalentSelections(selections));
    this._renderChangedMeasures(measureSelections);
  }
  beamSelections() {
    this.actionBuffer.addAction('beamSelections');
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('beam selections');
    SmoOperation.beamSelections(this.score, selections);
    SmoOperation.beamSelections(this.storeScore, this._getEquivalentSelections(selections));
    this._renderChangedMeasures(measureSelections);
  }
  addKeySignature(keySignature) {
    this.actionBuffer.addAction('addKeySignature', keySignature);
    const measureSelections = this._undoTrackerMeasureSelections('set key signature ' + keySignature);
    measureSelections.forEach((sel) => {
      SmoOperation.addKeySignature(this.score, sel, keySignature);
      SmoOperation.addKeySignature(this.storeScore, this._getEquivalentSelection(sel), keySignature);
    });
    this._renderChangedMeasures(measureSelections);
  }
  setPitchPiano(pitch, chordPedal) {
    this.actionBuffer.addAction('setAbsolutePitch', pitch);
    const measureSelections = this._undoTrackerMeasureSelections(
      'setAbsolutePitch ' + pitch.letter + '/' + pitch.accidental);
    this.tracker.selections.forEach((selected) => {
      const npitch = { letter: pitch.letter,
        accidental: pitch.accidental, octave: pitch.octave };
      const octave = SmoMeasure.defaultPitchForClef[selected.measure.clef].octave;
      npitch.octave += octave;
      const altSel = this._getEquivalentSelection(selected);
      if (chordPedal) {
        selected.note.toggleAddPitch(npitch);
        altSel.note.toggleAddPitch(npitch);
      } else {
        SmoOperation.setPitch(selected, npitch);
        SmoOperation.setPitch(altSel, npitch);
      }
    });
    this._renderChangedMeasures(measureSelections);
  }

  setPitch(letter) {
    this.actionBuffer.addAction('setPitch', letter);
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('set pitch ' + letter);
    selections.forEach((selected) => {
      const selector = selected.selector;
      let hintSel = SmoSelection.lastNoteSelection(this.score,
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
      if (this.score.preferences.autoAdvance) {
        this.tracker.moveSelectionRight(null, true);
      }
    });
    if (selections.length === 1 && this.score.preferences.autoPlay) {
      suiOscillator.playSelectionNow(selections[0]);
    }
    this._renderChangedMeasures(measureSelections);
  }
  copy() {
    this.actionBuffer.addAction('copy');
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
    this.actionBuffer.addAction('paste');
    this._undoScore('paste');
    this.preserveScroll();
    const firstSelection = this.tracker.selections[0];
    const pasteTarget = firstSelection.selector;
    const altSelection = this._getEquivalentSelection(firstSelection);
    const altTarget = altSelection.selector;
    this.pasteBuffer.pasteSelections(this.score, pasteTarget);
    this.storePaste.pasteSelections(this.storeScore, altTarget);
    this._renderChangedMeasures(this.pasteBuffer.replacementMeasures);
  }
  setNoteHead(head) {
    this.actionBuffer.addAction('setNoteHead', head);
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('set note head');
    SmoOperation.setNoteHead(selections, head);
    SmoOperation.setNoteHead(this._getEquivalentSelections(selections), head);
    this._renderChangedMeasures(measureSelections);
  }

  setAutoJustify(value) {
    this.actionBuffer.addAction('setAutoJustify', value);
    const selection = this.tracker.selections[0];
    const altSelection = this._getEquivalentSelection(selection);
    const rect = this._getRectangleFromStaffGroup(selection, this.staffMap);
    const altRect = this._getRectangleFromStaffGroup(altSelection, this.defaultStaffMap);
    this._undoRectangle('Set measure proportion', rect.startSelector, rect.endSelector, this.score, this.undoBuffer);
    this._undoRectangle('Set measure proportion', altRect.startSelector, altRect.endSelector, this.storeScore, this.storeUndo);
    const rs = this._getRectangleSelections(rect.startSelector, rect.endSelector, this.score);
    const altRs = this._getRectangleSelections(altRect.startSelector, altRect.endSelector, this.storeScore);
    rs.forEach((s) => {
      this.renderer.addToReplaceQueue(s);
      SmoOperation.setAutoJustify(this.score, s, value);
    });
    altRs.forEach((s) => {
      SmoOperation.setAutoJustify(this.storeScore, s, value);
    });
  }
  // ### padMeasure
  // spacing to the left, and column means all measures in system.
  padMeasure(spacing, column) {
    let selection = this.tracker.selections[0];
    this.actionBuffer.addAction('padMeasure', spacing, column);
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

  addEnding() {
    // TODO: we should have undo for columns
    this._undoScore('Add Volta');
    this.actionBuffer.addAction('addEnding');
    const ft = this.tracker.getExtremeSelection(-1);
    const tt = this.tracker.getExtremeSelection(1);
    const volta = new SmoVolta({ startBar: ft.selector.measure, endBar: tt.selector.measure, number: 1 });
    const altVolta = new SmoVolta({ startBar: ft.selector.measure, endBar: tt.selector.measure, number: 1 });
    SmoOperation.addEnding(this.storeScore, altVolta);
    SmoOperation.addEnding(this.score, volta);
    this.renderer.setRefresh();
  }
  updateEnding(ending) {
    this.actionBuffer.addAction('updateEnding', ending);
    this._undoScore('Change Volta');
    $(this.renderer.context.svg).find('g.' + ending.attrs.id).remove();
    SmoOperation.removeEnding(this.storeScore, ending);
    SmoOperation.removeEnding(this.score, ending);
    const altVolta = new SmoVolta(ending);
    SmoOperation.addEnding(this.storeScore, altVolta);
    SmoOperation.addEnding(this.score, ending);
    this.renderer.setRefresh();
  }
  removeEnding(ending) {
    this.actionBuffer.addAction('removeEnding', ending);
    this._undoScore('Remove Volta');
    $(this.renderer.context.svg).find('g.' + ending.attrs.id).remove();
    SmoOperation.removeEnding(this.storeScore, ending);
    SmoOperation.removeEnding(this.score, ending);
    this.renderer.setRefresh();
  }
  setBarline(position, barline) {
    this.actionBuffer.addAction('setBarline', position, barline);
    const obj = new SmoBarline({ position, barline });
    const altObj = new SmoBarline({ position, barline });
    const selection = this.tracker.selections[0];
    this._undoColumn('set barline', selection.selector.measure);
    SmoOperation.setMeasureBarline(this.score, selection, obj);
    SmoOperation.setMeasureBarline(this.storeScore, this._getEquivalentSelection(selection), altObj);
    this._renderChangedMeasures([selection]);
  }
  setRepeatSymbol(position, symbol) {
    this.actionBuffer.addAction('setRepeatSymbol', position, symbol);
    const obj = new SmoRepeatSymbol({ position, symbol });
    const altObj = new SmoRepeatSymbol({ position, symbol });
    const selection = this.tracker.selections[0];
    this._undoColumn('set repeat symbol', selection.selector.measure);
    SmoOperation.setRepeatSymbol(this.score, selection, obj);
    SmoOperation.setRepeatSymbol(this.storeScore, this._getEquivalentSelection(selection), altObj);
    this._renderChangedMeasures(selection);
  }
  toggleRehearsalMark() {
    this.actionBuffer.addAction('toggleRehearsalMark');
    const selection = this.tracker.getExtremeSelection(-1);
    const altSelection = this._getEquivalentSelection(selection);
    const cmd = selection.measure.getRehearsalMark() ? 'removeRehearsalMark' : 'addRehearsalMark';
    SmoOperation[cmd](this.score, selection, new SmoRehearsalMark());
    SmoOperation[cmd](this.storeScore, altSelection, new SmoRehearsalMark());
    this._renderChangedMeasures(selection);
  }
  _removeStaffModifier(modifier) {
    this.score.staves[modifier.startSelector.staff].removeStaffModifier(modifier);
    const altModifier = StaffModifierBase.deserialize(modifier.serialize());
    altModifier.startSelector = this._getEquivalentSelector(altModifier.startSelector);
    altModifier.endSelector = this._getEquivalentSelector(altModifier.endSelector);
    this.storeScore.staves[altModifier.startSelector.staff].removeStaffModifier(altModifier);
  }
  removeStaffModifier(modifier) {
    this.actionBuffer.addAction('removeStaffModifier', modifier);
    this._undoStaffModifier('Set measure proportion', modifier,
      UndoBuffer.bufferSubtypes.REMOVE);
    this._removeStaffModifier(modifier);
    this._removeStandardModifier(modifier);
    this._renderRectangle(modifier.startSelector, modifier.endSelector);
  }
  addOrUpdateStaffModifier(original, modifier) {
    if (!modifier) {
      if (original) {
        // Handle legacy API changed
        modifier = StaffModifierBase.deserialize(original);
      } else {
        console.warn('update modifier: bad modifier');
        return;
      }
    }
    this.actionBuffer.addAction('addOrUpdateStaffModifier', modifier);
    const existing = this.score.staves[modifier.startSelector.staff]
      .getModifier(modifier);
    const subtype = existing === null ? UndoBuffer.bufferSubtypes.ADD :
      UndoBuffer.bufferSubtypes.UPDATE;
    this._undoStaffModifier('Set measure proportion', original,
      subtype);
    this._removeStaffModifier(modifier);
    const copy = StaffModifierBase.deserialize(modifier.serialize());
    copy.startSelector = this._getEquivalentSelector(copy.startSelector);
    copy.endSelector = this._getEquivalentSelector(copy.endSelector);
    const sel = SmoSelection.noteFromSelector(this.score, modifier.startSelector);
    const altSel = this._getEquivalentSelection(sel);
    SmoOperation.addStaffModifier(sel, modifier);
    SmoOperation.addStaffModifier(altSel, copy);
    this._renderRectangle(modifier.startSelector, modifier.endSelector);
  }
  _lineOperation(op) {
    // if (this.tracker.selections.length < 2) {
    //   return;
    // }
    const measureSelections = this._undoTrackerMeasureSelections(op);
    const ft = this.tracker.getExtremeSelection(-1);
    const tt = this.tracker.getExtremeSelection(1);
    const ftAlt = this._getEquivalentSelection(ft);
    const ttAlt = this._getEquivalentSelection(tt);
    const modifier = SmoOperation[op](ft, tt);
    SmoOperation[op](ftAlt, ttAlt);
    this._undoStaffModifier('add ' + op, modifier, UndoBuffer.bufferSubtypes.ADD);
    this._renderChangedMeasures(measureSelections);
  }
  crescendo() {
    this.actionBuffer.addAction('crescendo');
    this._lineOperation('crescendo');
  }
  decrescendo() {
    this.actionBuffer.addAction('decrescendo');
    this._lineOperation('decrescendo');
  }
  slur() {
    this.actionBuffer.addAction('slur');
    this._lineOperation('slur');
  }
  tie() {
    this.actionBuffer.addAction('tie');
    this._lineOperation('tie');
  }
  setScoreLayout(layout) {
    const oldLayout = JSON.stringify(this.score.layout);
    const curLayout = JSON.stringify(layout);
    if (oldLayout === curLayout) {
      return;
    }
    this.actionBuffer.addAction('setScoreLayout', layout);
    this.score.setLayout(layout);
    this.storeScore.setLayout(layout);
    this.renderer.rerenderAll();
  }
  setEngravingFontFamily(family) {
    this.actionBuffer.addAction('setEngravingFontFamily', family);
    const engrave = this.score.fonts.find((fn) => fn.purpose === SmoScore.fontPurposes.ENGRAVING);
    const altEngrave = this.storeScore.fonts.find((fn) => fn.purpose === SmoScore.fontPurposes.ENGRAVING);
    engrave.family = family;
    altEngrave.family = family;
    SuiRenderState.setFont(engrave.family);
  }
  setLyricFont(fontInfo) {
    this.actionBuffer.addAction('setLyricFont', fontInfo);
    this._undoScore('Set Lyric Font');
    this.score.setLyricFont(fontInfo);
    this.storeScore.setLyricFont(fontInfo);
    this.renderer.setRefresh();
  }
  setLyricAdjustWidth(value) {
    this.actionBuffer.addAction('setLyricAdjustWidth', value);
    this._undoScore('Set Lyric Adj Width');
    this.score.setLyricAdjustWidth(value);
    this.storeScore.setLyricAdjustWidth(value);
    this.renderer.setRefresh();
  }
  deleteMeasure() {
    this.actionBuffer.addAction('deleteMeasure');
    this._undoScore('Delete Measure');
    if (this.storeScore.staves[0].measures.length < 2) {
      return;
    }
    const selections = SmoSelection.getMeasureList(this.tracker.selections);
    // THe measures get renumbered, so keep the index at 0
    const index = selections[0].selector.measure;
    selections.forEach((selection) => {
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
      // Remove the SVG artifacts mapped to this measure.
      this.tracker.deleteMeasure(selection);
      this.score.deleteMeasure(index);
      this.storeScore.deleteMeasure(index);
    });
    this.tracker.loadScore();
    this.renderer.setRefresh();
  }
  addMeasures(append, numberToAdd) {
    let pos = 0;
    let ix = 0;
    this.actionBuffer.addAction('addMeasures', append, numberToAdd);
    this._undoScore('Add Measure');
    for (ix = 0; ix < numberToAdd; ++ix) {
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
    }
    this.renderer.setRefresh();
  }
  addMeasure(append) {
    this.actionBuffer.addAction('addMeasure', append);
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
    this.actionBuffer.addAction('removeStaff');
    this._undoScore('Remove Instrument');
    if (this.storeScore.staves.length < 2 || this.score.staves.length < 2) {
      return;
    }
    // if we are looking at a subset of the score,
    // revert to the full score view before removing the staff.
    const sel = this.tracker.selections[0];
    const scoreSel = this._getEquivalentSelection(sel);
    const staffIndex = scoreSel.selector.staff;
    SmoOperation.removeStaff(this.storeScore, staffIndex);
    this.viewAll();
    this.renderer.setRefresh();
  }
  addStaff(instrument) {
    this.actionBuffer.addAction('addStaff', instrument);
    this._undoScore('Add Instrument');
    // if we are looking at a subset of the score, we won't see the new staff.  So
    // revert to the full view
    SmoOperation.addStaff(this.storeScore, instrument);
    this.viewAll();
  }
  saveScore(filename) {
    const json = this.storeScore.serialize();
    const jsonText = JSON.stringify(json);
    htmlHelpers.addFileLink(filename, jsonText, $('.saveLink'));
    $('.saveLink a')[0].click();
  }
  saveXml(filename) {
    const dom = SmoToXml.convert(this.storeScore);
    const ser = new XMLSerializer();
    const xmlText = ser.serializeToString(dom);
    htmlHelpers.addFileLink(filename, xmlText, $('.saveLink'));
    $('.saveLink a')[0].click();
  }
  saveActions(filename) {
    const jsonText = JSON.stringify(this.actionBuffer.actions);
    htmlHelpers.addFileLink(filename, jsonText, $('.saveLink'));
    $('.saveLink a')[0].click();
  }
  quickSave() {
    const scoreStr = JSON.stringify(this.storeScore.serialize());
    localStorage.setItem(smoSerialize.localScore, scoreStr);
  }
  createPickup(duration) {
    const sel = this.tracker.selections[0];
    const measureIndex = sel.selector.measure;
    this._undoColumn('create pickup', measureIndex);
    this.actionBuffer.addAction('createPickup', duration);
    this.score.convertToPickupMeasure(sel.selector.measure, duration);
    this.storeScore.convertToPickupMeasure(sel.selector.measure, duration);
    this.renderer.setRefresh();
  }
  _columnAction(label, value, method) {
    this.actionBuffer.addAction(label, value);
    const fromSelector = this.tracker.getExtremeSelection(-1).selector;
    const toSelector = this.tracker.getExtremeSelection(1).selector;
    const measureSelections = this.tracker.getSelectedMeasures();
    measureSelections.forEach((m) => {
      this._undoColumn(label + value.toString(), m.selector.measure);
      SmoOperation[method](this.score, m, value);
      const alt = this._getEquivalentSelection(m);
      SmoOperation[method](this.storeScore, alt, value);
    });
    this._renderRectangle(fromSelector, toSelector);
  }
  setCollisionAvoidance(value) {
    this._columnAction('Collision avoidance', value, 'setFormattingIterations');
  }

  // ### stretchWidth
  // Stretch the width of a measure, including all columns in the measure since they are all
  // the same width
  setMeasureStretch(stretch) {
    this._columnAction('Stretch Measure', stretch, 'setMeasureStretch');
  }
  forceSystemBreak(value) {
    this._columnAction('forceSystemBreak', value, 'setForceSystemBreak');
  }
  // For these rectangle ones, treat view score and store score differently
  // b/c the rectangles may be different
  setMeasureProportion(value) {
    this._columnAction('Measure proportion', value, 'setMeasureProportion');
  }

  replayActions() {
    if (!this.actionBuffer.endCondition) {
      return;
    }
    const prefs = JSON.parse(JSON.stringify(this.score.preferences));
    this.storeScore.preferences.autoPlay = false;
    this.storeScore.preferences.autoAdvance = false;
    this.score.preferences = JSON.parse(JSON.stringify(this.storeScore.preferences));
    const oldPollTime = SmoConfig.demonPollTime;
    const oldRedrawTime = SmoConfig.idleRedrawTime;
    const recover = () => {
      this.score.preferences = prefs;
      this.storeScore.preferences = JSON.parse(JSON.stringify(prefs));
      SmoConfig.demonPollTime = oldPollTime;
      SmoConfig.idleRedrawTime = oldRedrawTime;
    };
    SmoConfig.demonPollTime = 50;
    SmoConfig.idleRedrawTime = 3000;
    const playback = new SuiActionPlayback(this.actionBuffer, this);
    playback.start().then(recover);
  }

  // Tracker operations, used for macro replay
  moveHome(ev) {
    this.tracker.moveHome(ev);
  }
  moveEnd(ev) {
    this.tracker.moveEnd(ev);
  }
  growSelectionLeft() {
    this.tracker.growSelectionLeft();
  }
  growSelectionRight() {
    this.tracker.growSelectionRight();
  }
  advanceModifierSelection(keyEv) {
    this.tracker.advanceModifierSelection(keyEv);
  }
  growSelectionRightMeasure() {
    this.tracker.growSelectionRightMeasure();
  }
  moveSelectionRight(ev) {
    this.tracker.moveSelectionRight(ev);
  }
  moveSelectionLeft() {
    this.tracker.moveSelectionLeft();
  }
  moveSelectionLeftMeasure() {
    this.tracker.moveSelectionLeftMeasure();
  }
  moveSelectionRightMeasure() {
    this.tracker.moveSelectionRightMeasure();
  }
  moveSelectionPitchUp() {
    this.tracker.moveSelectionPitchUp();
  }
  moveSelectionPitchDown() {
    this.tracker.moveSelectionPitchDown();
  }
  moveSelectionUp() {
    this.tracker.moveSelectionUp();
  }
  moveSelectionDown() {
    this.tracker.moveSelectionDown();
  }
  selectSuggestion(evData) {
    this.tracker.selectSuggestion(evData);
  }
  intersectingArtifact(evData) {
    this.tracker.intersectingArtifact(evData);
  }
  setSelection(selector) {
    view.tracker.selections = [SmoSelection.selectionFromSelector(this.score, selector)];
  }
  selectSuggestionNote(selector, evData) {
    const key = SmoSelector.getNoteKey(selector);
    if (typeof(this.tracker.measureNoteMap[key]) !== 'undefined') {
      this.tracker.suggestion = this.tracker.measureNoteMap[SmoSelector.getNoteKey(selector)];
      this.tracker.selectSuggestion(evData);
    }
  }
  selectSuggestionModifier(selector, evData, modifierObj) {
    let modIndex = -1;
    if (typeof(modifierObj.startSelector) !== 'undefined' && typeof(modifierObj.endSelector) !== 'undefined') {
      modIndex = this.tracker.modifierTabs.findIndex((tb) =>
        modifierObj.ctor === tb.modifier.ctor &&
        SmoSelector.eq(tb.selection.selector, selector) && SmoSelector.eq(tb.modifier.startSelector, modifierObj.startSelector) &&
        SmoSelector.eq(tb.modifier.endSelector, modifierObj.endSelector));
    } else {
      // TODO: grace notes have multiple per note and no selector
      modIndex = this.tracker.modifierTabs.findIndex((tb) =>
        modifierObj.ctor === tb.modifier.ctor &&
          SmoSelector.eq(tb.selection.selector, selector));
    }
    if (modIndex >= 0) {
      this.tracker.modifierSuggestions = [modIndex];
      this.tracker.selectSuggestion(evData);
    }
  }
  refreshViewport() {
    this.preserveScroll();
    this.renderer.setViewport(true);
    this.renderer.setRefresh();
  }
}
