import { SuiButton, SuiButtonParams } from './button';
declare var $: any;

export class VoiceButtons extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
  }
  doAction() {
    let voiceIx = 0;
    if (this.buttonData.id === 'V2Button') {
      voiceIx = 1;
    } else if (this.buttonData.id === 'V3Button') {
      voiceIx = 2;
    } else if (this.buttonData.id === 'V4Button') {
      voiceIx = 3;
    } else if (this.buttonData.id === 'VXButton') {
      this.view.depopulateVoice();
      return;
    }
    this.view.populateVoice(voiceIx);
  }
  bind() {
    $(this.buttonElement).off('click').on('click', () => {
      this.doAction();
    });
  }
}