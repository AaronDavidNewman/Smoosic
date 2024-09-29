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

  async copy() {
    await this.view.copy();
  }
  async paste() {
    await this.view.paste();
  }
  async toggleBeamGroup() {
    await this.view.toggleBeamGroup();
  }

  async beamSelections() {
    await this.view.beamSelections();
  }
  async toggleBeamDirection() {
    await this.view.toggleBeamDirection();
  }

  async collapseChord() {
    await this.view.collapseChord();
  }

  togglePlayer() {
    if (SuiAudioPlayer.playing) {
      this.stopPlayer();
    } else {
      this.playScore();
    }
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

  async intervalAdd(interval: number, direction: number) {
    await this.view.setInterval(direction * interval);
  }

  async  interval(keyEvent: KeyEvent) {
    // code='Digit3'
    var interval = parseInt(keyEvent.keyCode.toString(), 10) - 49;  // 48 === '0', 0 indexed
    if (isNaN(interval) || interval < 1 || interval > 7) {
      return;
    }
    await this.intervalAdd(interval, keyEvent.shiftKey ? -1 : 1);
  }

  async transpose(offset: number) {
    await this.view.transposeSelections(offset);
  }
  async transposeDown() {
    await this.transpose(-1);
  }
  async transposeUp() {
    await this.transpose(1);
  }
  async upOctave() {
    await this.transpose(12);
  }
  async downOctave() {
    await this.transpose(-12);
  }
  async makeRest() {
    await this.view.makeRest();
  }

  async setPitchCommand(letter: PitchLetter) {
    await this.view.setPitch(letter);
  }

  async setPitch(keyEvent: KeyEvent) {
    const letter = keyEvent.key.toLowerCase();
    if (IsPitchLetter(letter)) {
      await this.setPitchCommand(letter);
    }
  }

  async dotDuration() {
    await this.view.batchDurationOperation('dotDuration');
  }

  async undotDuration() {
    await this.view.batchDurationOperation('undotDuration');
  }

  async doubleDuration() {
    await this.view.batchDurationOperation('doubleDuration');
  }

  async halveDuration() {
    await this.view.batchDurationOperation('halveDuration');
  }

  async addMeasure(keyEvent: KeyEvent) {
    await this.view.addMeasure(keyEvent.shiftKey);
  }
  async deleteNote() {
    await this.view.deleteNote();
  }

  async toggleCourtesyAccidental() {
    await this.view.toggleCourtesyAccidentals();
  }
  async toggleEnharmonic() {
    await this.view.toggleEnharmonic();
  }

  async makeTupletCommand(numNotes: number) {
    await this.view.makeTuplet(numNotes);
  }
  async makeTuplet(keyEvent: KeyEvent) {
    const numNotes = parseInt(keyEvent.key, 10);
    await this.makeTupletCommand(numNotes);
  }

  async unmakeTuplet() {
    await this.view.unmakeTuplet();
  }
  async setNoteHead() {
    await this.view.setNoteHead('x2');
  }
  async removeGraceNote() {
    await this.view.removeGraceNote();
  }
  async addGraceNote() {
    await this.view.addGraceNote();
  }
  async slashGraceNotes() {
    await this.view.slashGraceNotes();
  }

  async toggleArticulationCommand(articulation: string, ctor: string) {
    await this.view.toggleArticulation(articulation, ctor);
  }
  async addRemoveAccent() {
    await this.toggleArticulationCommand(SmoArticulation.articulations.accent, 'SmoArticulation');
  }
  async addRemoveTenuto() {
    await this.toggleArticulationCommand(SmoArticulation.articulations.tenuto, 'SmoArticulation');
  }
  async addRemoveStaccato() {
    await this.toggleArticulationCommand(SmoArticulation.articulations.staccato, 'SmoArticulation');
  }
  async addRemoveMarcato() {
    await this.toggleArticulationCommand(SmoArticulation.articulations.marcato, 'SmoArticulation');
  }
  async addRemovePizzicato() {
    await this.toggleArticulationCommand(SmoArticulation.articulations.pizzicato, 'SmoArticulation');
  }
}
