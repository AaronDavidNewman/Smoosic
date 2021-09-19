// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiTempoDialog } from '../ui/dialogs/measureDialogs';
import { SuiAudioPlayer } from '../render/audio/player';
import { SmoArticulation } from '../smo/data/noteModifiers';
import { SuiScoreViewOperations } from '../render/sui/scoreViewOperations';
import { BrowserEventSource } from './eventSource';
import { SuiTracker, KeyEvent } from '../render/sui/tracker';
import { CompleteNotifier, DialogParams } from './common';
import { PitchLetter, IsPitchLetter } from '../smo/data/common';

// ## suiEditor
// KeyCommands object handles key events and converts them into commands, updating the score and
// display
export class SuiKeyCommands {
  view: SuiScoreViewOperations;
  slashMode: boolean = false;
  completeNotifier: CompleteNotifier;
  tracker: SuiTracker;
  eventSource: BrowserEventSource;
  constructor(params: DialogParams) {
    this.slashMode = false;
    this.view = params.view;
    this.tracker = params.tracker;
    this.completeNotifier = params.completeNotifier;
    this.eventSource = params.eventSource;
  }

  tempoDialog() {
    SuiTempoDialog.createAndDisplay(
      {
        completeNotifier: this.completeNotifier,
        view: this.view,
        eventSource: this.eventSource
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
    this.view.playFromSelection();
  }

  stopPlayer() {
    this.view.stopPlayer();
  }
  pausePlayer() {
    SuiAudioPlayer.pausePlayer();
  }

  intervalAdd(interval: number, direction: number) {
    this.view.setInterval(direction * interval);
  }

  interval(keyEvent: KeyEvent) {
    // code='Digit3'
    var interval = parseInt(keyEvent.keyCode, 10) - 49;  // 48 === '0', 0 indexed
    if (isNaN(interval) || interval < 1 || interval > 7) {
      return;
    }
    this.intervalAdd(interval, keyEvent.shiftKey ? -1 : 1);
  }

  transpose(offset: number) {
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

  setPitchCommand(letter: PitchLetter) {
    this.view.setPitch(letter);
  }

  setPitch(keyEvent: KeyEvent) {
    const letter = keyEvent.key.toLowerCase();
    if (IsPitchLetter(letter)) {
      this.setPitchCommand(letter);
    }
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

  addMeasure(keyEvent: KeyEvent) {
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

  makeTupletCommand(numNotes: number) {
    this.view.makeTuplet(numNotes);
  }
  makeTuplet(keyEvent: KeyEvent) {
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

  toggleArticulationCommand(articulation: string, ctor: string) {
    this.view.toggleArticulation(articulation, ctor);
  }

  addRemoveArticulation(keyEvent: KeyEvent) {
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
