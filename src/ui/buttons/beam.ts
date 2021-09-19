import { SuiButton, SuiButtonParams } from './button';
declare var $: any;

export class BeamButtons extends SuiButton {
    constructor(parameters: SuiButtonParams) {
      super(parameters);
    }
    operation() {
      if (this.buttonData.id === 'breakBeam') {
        this.view.toggleBeamGroup();
      } else if (this.buttonData.id === 'beamSelections') {
        this.view.beamSelections();
      } else if (this.buttonData.id === 'toggleBeamDirection') {
        this.view.toggleBeamDirection();
      }
    }
    bind() {
      $(this.buttonElement).off('click').on('click', () => {
        this.operation();
      });
    }
  }