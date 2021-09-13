// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiTempoDialog } from './dialogs/measureDialogs';
import { SuiAudioPlayer } from '../render/audio/player';
import { SmoArticulation } from '../smo/data/noteModifiers';

// ## suiEditor
// KeyCommands object handles key events and converts them into commands, updating the score and
// display
export class SuiKeyCommands {
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
    if (SuiAudioPlayer.playingInstance && SuiAudioPlayer.playingInstance.paused) {
      SuiAudioPlayer.playingInstance.play();
      return;
    }
    new SuiAudioPlayer({ score: this.view.score, startIndex: mm.selector.measure, tracker: this.view.tracker }).play();
  }

  stopPlayer() {
    SuiAudioPlayer.stopPlayer();
  }
  pausePlayer() {
    SuiAudioPlayer.pausePlayer();
  }

  intervalAdd(interval, direction) {
    this.view.setInterval(direction * interval);
  }

  interval(keyEvent) {
    // code='Digit3'
    var interval = parseInt(keyEvent.keyCode, 10) - 49;  // 48 === '0', 0 indexed
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

  dotDuration() {
    this.view.batchDurationOperation('dotDuration');
  }

  undotDuration() {
    this.view.batchDurationOperation('undotDuration');
  }

  doubleDuration() {
    this.view.batchDurationOperation('doubleDuration');
  }

  halveDuration() {
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
    const numNotes = parseInt(keyEvent.key, 10);
    this.makeTupletCommand(numNotes);
  }

  unmakeTuplet() {
    this.view.unmakeTuplet();
  }
  setNoteHead() {
    this.view.setNoteHead('x2');
  }
  removeGraceNote() {
    this.view.removeGraceNote();
  }
  addGraceNote() {
    this.view.addGraceNote();
  }
  slashGraceNotes() {
    this.view.slashGraceNotes();
  }

  toggleArticulationCommand(articulation, ctor) {
    this.view.toggleArticulation(articulation, ctor);
  }

  addRemoveArticulation(keyEvent) {
    let atyp = SmoArticulation.articulations.accent;
    if (this.view.tracker.selections.length < 1) {
      return;
    }
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
