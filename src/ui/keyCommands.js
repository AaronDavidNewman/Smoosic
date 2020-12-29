

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

  get score() {
    return this.view.score;
  }

  undo() {
    this.view.undo();
  }

  copy() {
    this.view.copy();
  }
  paste() {
    this.view.paste();
  }
  toggleBeamGroup() {
    this.view.toggleBeamGroup();
  }

  beamSelections() {
    this.view.beamSelections();
  }
  toggleBeamDirection() {
    this.view.toggleBeamDirection();
  }

  collapseChord() {
    this.view.collapseChord();
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
    this.view.setInterval(direction * interval);
  }

  interval(keyEvent) {
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
    this.view.makeRest();
  }

  setPitchCommand(letter) {
    this.view.setPitch(letter);
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
    this.view.addMeasure(keyEvent.shiftKey);
  }
  deleteNote() {
   this.view.deleteNote();
  }

  toggleCourtesyAccidental() {
    this.view.toggleCourtesyAccidentals();
  }
  toggleEnharmonic() {
    this.view.toggleEnharmonic();
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
    this.view.setNoteHead('x2');
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
