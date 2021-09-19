import { SuiButton, SuiButtonParams } from './button';
declare var $: any;

export class DurationButtons extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
    this.buttonData = parameters.buttonData;
  }
  setDuration() {
    if (this.buttonData.id === 'GrowDuration') {
      this.view.batchDurationOperation('doubleDuration');
    } else if (this.buttonData.id === 'LessDuration') {
      this.view.batchDurationOperation('halveDuration');
    } else if (this.buttonData.id === 'GrowDurationDot') {
      this.view.batchDurationOperation('dotDuration');
    } else if (this.buttonData.id === 'LessDurationDot') {
      this.view.batchDurationOperation('undotDuration');
    } else if (this.buttonData.id === 'TripletButton') {
      this.view.makeTuplet(3);
    } else if (this.buttonData.id === 'QuintupletButton') {
      this.view.makeTuplet(5);
    } else if (this.buttonData.id === 'SeptupletButton') {
      this.view.makeTuplet(7);
    } else if (this.buttonData.id === 'NoTupletButton') {
      this.view.unmakeTuplet();
    }
  }
  bind() {
    $(this.buttonElement).off('click').on('click', () => {
      this.setDuration();
    });
  }
}
