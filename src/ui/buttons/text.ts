import { SuiButton, SuiButtonParams } from './button';
import { SuiTextBlockDialog } from '../dialogs/textBlock';
import { SuiLyricDialog } from '../dialogs/lyric';
import { SuiChordChangeDialog } from '../dialogs/chordChange';
import { createAndDisplayDialog } from '../dialogs/dialog';
declare var $: any;

export class TextButtons extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
  }
  lyrics() {
    const sel = this.view.tracker.selections[0];
    const note = sel.note;
    if (!note) {
      return;
    }
    const lyrics = note.getTrueLyrics();
    const lyric = lyrics.length > 0 ? null : lyrics[0];

    createAndDisplayDialog(SuiLyricDialog, 
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        id: 'lyricDialog',
        ctor: 'SuiLyricDialog',
        tracker: this.view.tracker,
        startPromise: null,
        modifier: lyric
      }
    );
    // tracker, selection, controller
  }
  chordChanges() {
    const sel = this.view.tracker.selections[0];
    const note = sel.note;
    if (!note) {
      return;
    }
    const lyrics = note.getChords();
    const lyric = lyrics.length > 0 ? null : lyrics[0];
    createAndDisplayDialog(SuiChordChangeDialog,
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        id: 'chordDialog',
        ctor: 'SuiChordChangeDialog',
        tracker: this.view.tracker,
        startPromise: null,
        modifier: lyric
      }
    );
  }
  rehearsalMark() {
    this.view.toggleRehearsalMark();
  }
  _invokeMenu(cmd: string) {
    if (!this.completeNotifier) {
      return;
    }
    this.menus.slashMenuMode(this.completeNotifier);
    this.menus.createMenu(cmd);
  }

  addTextMenu() {
    createAndDisplayDialog(SuiTextBlockDialog, {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        id: 'chordDialog',
        ctor: 'SuiChordChangeDialog',
        tracker: this.view.tracker,
        startPromise: null,
        modifier: null
      });
  }
  addDynamicsMenu() {
    this._invokeMenu('SuiDynamicsMenu');
  }
  bind() {
    this.eventSource.domClick(this.buttonElement, this, this.buttonData.id, null);
  }
}
