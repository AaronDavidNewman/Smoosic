

// ## suiEditor
// KeyCommands object handles key events and converts them into commands, updating the score and
// display
class SuiKeyCommands {
  constructor(params) {
    Vex.Merge(this, params);
    this.slashMode = false;
  }

  tempoDialog() {
    SuiTempoDialog.createAndDisplay(
      {
        buttonElement: this.buttonElement,
        buttonData: this.buttonData,
        completeNotifier: this.controller,
        view: this.view,
        eventSource: this.eventSource,
        editor: this
      }
    );
  }

  // ## _render
  // utility function to render the music and update the tracker map.
  _render() {
    this.view.tracker.replaceSelectedMeasures();
  }

  _refresh() {
    this.view.renderer.setRefresh();
  }

  get score() {
      return this.view.score;
  }

  _renderAndAdvance() {
    this.view.tracker.replaceSelectedMeasures();
    this.view.tracker.moveSelectionRight(null, true);
  }
  _rebeam() {
    this.view.tracker.getSelectedMeasures().forEach((measure) => {
      smoBeamerFactory.applyBeams(measure);
    });
  }
  _batchDurationOperation(operation) {
    SmoUndoable.batchDurationOperation(this.view.score, this.view.tracker.selections, operation, this.view.undoBuffer);
    this._rebeam();
    this._render();
  }

  scoreSelectionOperation(selection, name, parameters, description) {
    SmoUndoable.scoreSelectionOp(this.view.score, selection, name, parameters,
      this.undoBuffer, description);
    this._render();
  }

  scoreOperation(name,parameters,description) {
    SmoUndoable.scoreOp(this.view.score, name, parameters, this.undoBuffer, description);
    this._render();
  }

  _selectionOperation(selection, name, parameters) {
    if (parameters) {
      SmoUndoable[name](selection, parameters, this.view.undoBuffer);
    } else {
      SmoUndoable[name](selection, this.view.undoBuffer);
    }
    this._render();
  }

  undo() {
    this.view.undo();
  }

  _singleSelectionOperation(name, parameters) {
    var selection = this.view.tracker.selections[0];
    if (parameters) {
      SmoUndoable[name](selection, parameters, this.view.undoBuffer);
    } else {
      SmoUndoable[name](selection, this.view.undoBuffer);
    }
    suiOscillator.playSelectionNow(selection);
    this._rebeam();
    this._render();
  }

  _transpose(selection, offset, playSelection) {
    this._selectionOperation(selection, 'transpose', offset);
    if (playSelection) {
      suiOscillator.playSelectionNow(selection);
    }
  }

  copy() {
    if (this.view.tracker.selections.length < 1) {
      return;
    }
    this.view.pasteBuffer.setSelections(this.view.score, this.view.tracker.selections);
  }
  paste() {
    if (this.view.tracker.selections.length < 1) {
      return;
    }
    SmoUndoable.pasteBuffer(this.view.score, this.view.pasteBuffer, this.view.tracker.selections, this.view.undoBuffer, 'paste')
    this._rebeam();
    this._refresh();
  }
  toggleBeamGroup() {
    if (this.view.tracker.selections.length < 1) {
      return;
    }
    SmoUndoable.toggleBeamGroups(this.view.tracker.selections, this.view.undoBuffer);
    this._rebeam();
    this._render();
  }

  beamSelections() {
    if (this.view.tracker.selections.length < 1) {
      return;
    }
    SmoUndoable.beamSelections(this.view.tracker.selections, this.view.undoBuffer);
    this._rebeam();
    this._render();
  }
  toggleBeamDirection() {
    if (this.view.tracker.selections.length < 1) {
      return;
    }
    SmoUndoable.toggleBeamDirection(this.view.tracker.selections, this.view.undoBuffer);
    this._render();
  }

  collapseChord() {
    SmoUndoable.noop(this.view.score, this.view.undoBuffer);
    this.view.tracker.selections.forEach((selection) => {
        var p = selection.note.pitches[0];
        p = JSON.parse(JSON.stringify(p));
        selection.note.pitches = [p];
    });
    this._render();
  }

  playScore() {
    var mm = this.view.tracker.getExtremeSelection(-1);
    if (suiAudioPlayer.playingInstance && suiAudioPlayer.playingInstance.paused) {
      suiAudioPlayer.playingInstance.play();
      return;
    }
    new suiAudioPlayer({ score: this.view.score, startIndex: mm.selector.measure, tracker: this.view.tracker }).play();
  }

  stopPlayer() {
    suiAudioPlayer.stopPlayer();
  }
  pausePlayer() {
    suiAudioPlayer.pausePlayer();
  }

  intervalAdd(interval, direction) {
    this._singleSelectionOperation('interval', direction * interval);
  }

  interval(keyEvent) {
    if (this.view.tracker.selections.length != 1)
      return;
    // code='Digit3'
    var interval = parseInt(keyEvent.keyCode) - 49;  // 48 === '0', 0 indexed
    if (isNaN(interval) || interval < 1 || interval > 7) {
      return;
    }
    this.intervalAdd(interval, keyEvent.shiftKey ? -1 : 1);
  }

  transpose(offset) {
    this.view.transposeSelections(offset);
  }
  transposeDown() {
    this.transpose(-1);
  }
  transposeUp() {
    this.transpose(1);
  }
  upOctave() {
    this.transpose(12);
  }
  downOctave() {
    this.transpose(-12);
  }
  makeRest() {
    this.view.tracker.selections.forEach((selection) => {
      this._selectionOperation(selection,'makeRest');
    });
    this.view.tracker.replaceSelectedMeasures();
  }

  _setPitch(selected, letter) {
    var selector = selected.selector;
    var hintSel = SmoSelection.lastNoteSelection(this.view.score,
      selector.staff, selector.measure, selector.voice, selector.tick);
    if (!hintSel) {
      hintSel = SmoSelection.nextNoteSelection(this.view.score,
        selector.staff, selector.measure, selector.voice, selector.tick);
    }
    // The selection no longer exists, possibly deleted
    if (!hintSel) {
      return;
    }

    var hintNote = hintSel.note;
    var hpitch = hintNote.pitches[0];
    var pitch = JSON.parse(JSON.stringify(hpitch));
    pitch.letter = letter;

    // Make the key 'a' make 'Ab' in the key of Eb, for instance
    var vexKsKey = smoMusic.getKeySignatureKey(letter, selected.measure.keySignature);
    if (vexKsKey.length > 1) {
        pitch.accidental = vexKsKey[1];
    } else {
        pitch.accidental = 'n';
    }

    // make the octave of the new note as close to previous (or next) note as possible.
    var upv = ['bc', 'ac', 'bd', 'da', 'be', 'gc'];
    var downv = ['cb', 'ca', 'db', 'da', 'eb', 'cg'];
    var delta = hpitch.letter + pitch.letter;
    if (upv.indexOf(delta) >= 0) {
        pitch.octave += 1;
    }
    if (downv.indexOf(delta) >= 0) {
      pitch.octave -= 1;
    }
    SmoUndoable['setPitch'](selected, pitch, this.view.undoBuffer);
    suiOscillator.playSelectionNow(selected);
  }

  setPitchCommand(letter) {
    this.view.tracker.selections.forEach((selected) => this._setPitch(selected, letter));
    this._renderAndAdvance();
  }

  setPitch(keyEvent) {
    this.setPitchCommand(keyEvent.key.toLowerCase());
  }

  dotDuration(keyEvent) {
    this.view.batchDurationOperation('dotDuration');
  }

  undotDuration(keyEvent) {
    this.view.batchDurationOperation('undotDuration');
  }

  doubleDuration(keyEvent) {
    this.view.batchDurationOperation('doubleDuration');
  }

  halveDuration(keyEvent) {
    this.view.batchDurationOperation('halveDuration');
  }

  addMeasure(keyEvent) {
    if (this.view.tracker.selections.length < 1) {
      return;
    }
    var measure = this.view.tracker.getFirstMeasureOfSelection();
    if (measure) {
      var nmeasure = SmoMeasure.getDefaultMeasureWithNotes(measure);
      var pos = measure.measureNumber.measureIndex;
      if (keyEvent.shiftKey) {
        pos += 1;
      }
      nmeasure.measureNumber.measureIndex = pos;
      nmeasure.setActiveVoice(0);
      SmoUndoable.addMeasure(this.view.score, pos, nmeasure, this.view.undoBuffer);
      this.view.renderer.clearLine(measure);
      this._refresh();
    }
  }
  deleteMeasure() {
    if (this.view.tracker.selections.length < 1) {
      return;
    }
    // don't delete the last measure
    if (this.view.score.staves[0].measures.length < 2) {
      return;
    }
    var selection = this.view.tracker.selections[0];
    var ix = selection.selector.measure;
    this.view.score.staves.forEach((staff) => {
      this.view.renderer.unrenderMeasure(staff.measures[ix]);
      this.view.renderer.unrenderMeasure(staff.measures[staff.measures.length-1]);

      // A little hacky - delete the modifiers if they start or end on
      // the measure
      staff.modifiers.forEach((modifier) => {
        if (modifier.startSelector.measure == ix || modifier.endSelector.measure == ix) {
            $(this.view.renderer.renderer.getContext().svg).find('g.' + modifier.attrs.id).remove();
        }
      });
    });
    this.view.tracker.deleteMeasure(selection);
    // this.layout.unrenderAll();

    SmoUndoable.deleteMeasure(this.view.score, selection, this.view.undoBuffer);
    this.view.tracker.loadScore();
    this._refresh();
  }

  toggleCourtesyAccidental() {
    this.view.toggleCourtesyAccidentals();
  }
  toggleEnharmonic() {
    this.view.toggleEnharmonic();
  }

  rerender(keyEvent) {
    this.view.renderer.unrenderAll();
    SmoUndoable.noop(this.view.score, this.view.undoBuffer);
    this.undo();
    this._render();
  }
  makeTupletCommand(numNotes) {
    this.view.makeTuplet(numNotes);
  }
  makeTuplet(keyEvent) {
    var numNotes = parseInt(keyEvent.key);
    this.makeTupletCommand(numNotes);
  }

  unmakeTuplet(keyEvent) {
    this.view.unmakeTuplet();
  }
  setNoteHead(keyEvent) {
     SmoUndoable.setNoteHead(this.view.score, this.view.tracker.selections, 'x2', this.view.undoBuffer);
     this._render();
  }
  removeGraceNote(keyEvent) {
    this.view.removeGraceNote();
  }
  addGraceNote(keyEvent) {
    this.view.addGraceNote();
  }
  slashGraceNotes(keyEvent) {
    this.view.slashGraceNotes();
  }

  toggleArticulationCommand(articulation, ctor) {
    this.view.toggleArticulation(articulation, ctor);
  }

  addRemoveArticulation(keyEvent) {
    if (this.view.tracker.selections.length < 1) {
      return;
    }
    var atyp = SmoArticulation.articulations.accent;

    if (keyEvent.key.toLowerCase() === 'h') {
      atyp = SmoArticulation.articulations.accent;
    }
    if (keyEvent.key.toLowerCase() === 'i') {
      atyp = SmoArticulation.articulations.tenuto;
    }
    if (keyEvent.key.toLowerCase() === 'j') {
      atyp = SmoArticulation.articulations.staccato;
    }
    if (keyEvent.key.toLowerCase() === 'k') {
      atyp = SmoArticulation.articulations.marcato;
    }
    if (keyEvent.key.toLowerCase() === 'l') {
      atyp = SmoArticulation.articulations.pizzicato;
    }
    this.toggleArticulationCommand(atyp, 'SmoArticulation');
  }
}
