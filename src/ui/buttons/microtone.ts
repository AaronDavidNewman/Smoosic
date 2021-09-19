import { SuiButton, ButtonDefinition, SuiButtonParams } from './button';
import { SmoMicrotone } from '../../smo/data/noteModifiers';
import { SuiOscillator } from '../../render/audio/oscillator';
declare var $: any;

export class MicrotoneButtons extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
  }
  applyButton(el: ButtonDefinition) {
    const defs = SmoMicrotone.defaults;
    defs.tone = el.id;
    const tn = new SmoMicrotone(defs);
    this.view.addRemoveMicrotone(tn);
    SuiOscillator.playSelectionNow(this.view.tracker.selections[0], 1);
  }
  bind() {
    $(this.buttonElement).off('click').on('click', () => {
      this.applyButton(this.buttonData);
    });
  }
}