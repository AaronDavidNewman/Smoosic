import { SuiButton, SuiButtonParams } from './button';
import { SuiLyricDialog, SuiChordChangeDialog, SuiTextTransformDialog } from '../dialogs/textDialogs';
import { SmoLyric } from '../../smo/data/noteModifiers';
declare var $: any;

export class TextButtons extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
  }
  lyrics() {
    SuiLyricDialog.createAndDisplay(
      {
        buttonElement: this.buttonElement,
        buttonData: this.buttonData,
        completeNotifier: this.completeNotifier,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        parser: SmoLyric.parsers.lyric
      }
    );
    // tracker, selection, controller
  }
  chordChanges() {
    SuiChordChangeDialog.createAndDisplay(
      {
        buttonElement: this.buttonElement,
        buttonData: this.buttonData,
        completeNotifier: this.completeNotifier,
        view: this.view,
        eventSource: this.eventSource,
        parser: SmoLyric.parsers.chord
      }
    );
  }
  rehearsalMark() {
    this.view.toggleRehearsalMark();
  }
  _invokeMenu(cmd: string) {
    this.menus.slashMenuMode(this.completeNotifier);
    this.menus.createMenu(cmd);
  }

  addTextMenu() {
    SuiTextTransformDialog.createAndDisplay(
      {
        buttonElement: this.buttonElement,
        buttonData: this.buttonData,
        completeNotifier: this.completeNotifier,
        tracker: this.view.tracker,
        view: this.view,
        eventSource: this.eventSource
      });
  }
  addDynamicsMenu() {
    this._invokeMenu('SuiDynamicsMenu');
  }
  bind() {
    this.eventSource.domClick(this.buttonElement, this, this.buttonData.id, null);
  }
}
