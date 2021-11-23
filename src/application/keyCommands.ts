// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiTempoDialog } from '../ui/dialogs/tempo';
import { createAndDisplayDialog } from '../ui/dialogs/dialog';
import { SuiAudioPlayer } from '../render/audio/player';
import { SmoArticulation } from '../smo/data/noteModifiers';
import { SuiScoreViewOperations } from '../render/sui/scoreViewOperations';
import { BrowserEventSource } from '../ui/eventSource';
import { SuiTracker } from '../render/sui/tracker';
import { KeyCommandParams } from './common';
import { CompleteNotifier } from '../ui/common';
import { PitchLetter, IsPitchLetter, KeyEvent } from '../smo/data/common';

/**
 * KeyCommands object handles key events and converts them into commands, updating the score and
 * display
 * @category SuiApplication
 * */
export class SuiKeyCommands {
  view: SuiScoreViewOperations;
  slashMode: boolean = false;
  completeNotifier: CompleteNotifier;
  tracker: SuiTracker;
  eventSource: BrowserEventSource;
  constructor(params: KeyCommandParams) {
    this.slashMode = false;
    this.view = params.view;
    this.tracker = params.view.tracker;
    this.completeNotifier = params.completeNotifier;
    this.eventSource = params.eventSource;
  }

  tempoDialog() {
    const tempo = this.tracker.selections[0].measure.getTempo();
    createAndDisplayDialog(SuiTempoDialog,
      {
        id: 'tempoDialog',
        ctor: 'SuiTempoDialog',
        completeNotifier: this.completeNotifier,
        view: this.view,
        eventSource: this.eventSource,
        tracker: this.tracker,
        startPromise: null,
        undoBuffer: this.view.undoBuffer,
        modifier: tempo
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
  addRemoveAccent() {
    this.toggleArticulationCommand(SmoArticulation.articulations.accent, 'SmoArticulation');
  }
  addRemoveTenuto() {
    this.toggleArticulationCommand(SmoArticulation.articulations.tenuto, 'SmoArticulation');
  }
  addRemoveStaccato() {
    this.toggleArticulationCommand(SmoArticulation.articulations.staccato, 'SmoArticulation');
  }
  addRemoveMarcato() {
    this.toggleArticulationCommand(SmoArticulation.articulations.marcato, 'SmoArticulation');
  }
  addRemovePizzicato() {
    this.toggleArticulationCommand(SmoArticulation.articulations.pizzicato, 'SmoArticulation');
  }
}
