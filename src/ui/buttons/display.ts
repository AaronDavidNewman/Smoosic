import { SuiButton, SuiButtonParams } from './button';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SuiKeySignatureDialog } from '../dialogs/keySignature';
import { SuiTimeSignatureDialog } from '../dialogs/timeSignature';
import { SuiTempoDialog } from '../dialogs/tempo';
import { KeyEvent } from '../../smo/data/common';
declare var $: any;

/**
 * These are the quick-buttons that show up on the left of the button ribbon.
 * @category SuiButton
 */
export class DisplaySettings extends SuiButton {
  hotKey: string | undefined;
  constructor(parameters: SuiButtonParams) {
    super(parameters);
    this.hotKey = parameters.buttonData.hotKey;
    if (this.buttonData.id === 'selectPart') {
      this.eventSource.bindScoreChangeHandler(this, 'handleScoreChange');
      this.enablePartSelection();
    }
    if (this.hotKey) {
      this.eventSource.bindKeydownHandler(this, 'handleKeyDown');
    }
  }
  handleKeyDown(ev: KeyEvent) {
    if (ev.altKey && this.buttonData.hotKey && this.buttonData.hotKey === ev.key) {
      $('#' + this.buttonData.id).trigger('click');
    }
  }  
  enablePartSelection() {
    const partMap = this.view.getPartMap();
    const disable = partMap.keys.length < 1;
    $(this.buttonElement[0]).prop('disabled', disable);
  }
  handleScoreChange(ev: any) {
    if (this.view.isPartExposed()) {
      this.buttonData.rightText = this.view.score.staves[0].partInfo.partName;
    } else {
      this.buttonData.rightText = 'Select Part';
    }
    $(this.buttonElement[0]).find('.ribbon-button-hotkey').text(this.buttonData.rightText);
    this.enablePartSelection();
  }

  refresh() {
    this.view.refreshViewport();
  }
  zoomout() {
    const globalLayout = this.view.score.layoutManager!.getGlobalLayout();
    globalLayout.zoomScale *= 1.1;
    this.view.updateZoom(globalLayout.zoomScale);
  }
  zoomin() {
    const globalLayout = this.view.score.layoutManager!.getGlobalLayout();
    globalLayout.zoomScale = globalLayout.zoomScale / 1.1;
    this.view.updateZoom(globalLayout.zoomScale);
  }
  playButton2() {
    this.view.playFromSelection();
  }
  stopButton2() {
    this.view.stopPlayer();
  }
  keySignature() {
    if (!this.completeNotifier) {
      return;
    }
    createAndDisplayDialog(SuiKeySignatureDialog, {
      view: this.view,
      completeNotifier: this.completeNotifier,
      startPromise: null,
      eventSource: this.eventSource,
      tracker: this.view.tracker,
      ctor: 'SuiKeySignatureDialog',
      id: 'key-signature-dialog',
      modifier: null
    });
  }
  ribbonTime() {
    if (!this.completeNotifier) {
      return;
    }
    createAndDisplayDialog(SuiTimeSignatureDialog, {
      completeNotifier: this.completeNotifier,
      view: this.view,
      eventSource: this.eventSource,
      id: 'staffGroups',
      ctor: 'SuiStaffGroupDialog',
      tracker: this.view.tracker,
      modifier: null,
      startPromise: null
    });
  }
  ribbonTempo() {
    if (!this.completeNotifier) {
      return;
    }
    const tempo = this.view.tracker.selections[0].measure.getTempo();
    createAndDisplayDialog(SuiTempoDialog,
      {
        id: 'tempoDialog',
        ctor: 'SuiTempoDialog',
        completeNotifier: this.completeNotifier,
        view: this.view,
        eventSource: this.eventSource,
        tracker: this.view.tracker,
        startPromise: null,
        modifier: tempo
      }
    );
  }
  async selectPart() {
    if (!this.completeNotifier) {
      return;
    }
    await this.view.renderPromise();
    this.menus.createMenu('SuiPartSelectionMenu', this.completeNotifier);
  }
  bind() {
    this.eventSource.domClick(this.buttonElement, this, this.buttonData.id, null);
  }
}
