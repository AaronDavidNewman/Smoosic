import { SuiButton, ButtonDefinition, SuiButtonParams } from './button';
import { SuiAudioPlayer } from '../../render/audio/player';
declare var $: any;

export class PlayerButtons extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
  }
  playButton() {
    this.view.playFromSelection();
  }
  stopButton() {
    this.view.stopPlayer();
  }
  pauseButton() {
    this.view.pausePlayer();
  }
  bind() {
    this.eventSource.domClick(this.buttonElement, this, this.buttonData.id, null);
  }
}