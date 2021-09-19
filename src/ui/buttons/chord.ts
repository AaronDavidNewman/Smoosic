import { SuiButton, SuiButtonParams } from './button';
declare var $: any;

export class ChordButtons extends SuiButton {
  interval: number;
  direction: number;
  constructor(parameters: SuiButtonParams) {
    super(parameters);
    this.interval = parseInt($(this.buttonElement).attr('data-interval'), 10);
    this.direction = parseInt($(this.buttonElement).attr('data-direction'), 10);
  }
  collapseChord() {
    this.view.collapseChord();
  }
  setInterval() {
    this.view.setInterval(this.interval * this.direction);
  }
  bind() {
    $(this.buttonElement).off('click').on('click', () => {
      if ($(this.buttonElement).attr('id') === 'CollapseChordButton') {
        this.collapseChord();
        return;
      }
      this.setInterval();
    });
  }
}