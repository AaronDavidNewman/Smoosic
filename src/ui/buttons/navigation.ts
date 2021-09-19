import { SuiButton, SuiButtonParams } from './button';
declare var $: any;

export class NavigationButtons extends SuiButton {
  static get directionsTrackerMap(): Record<string, string> {
    return {
      navLeftButton: 'moveSelectionLeft',
      navRightButton: 'moveSelectionRight',
      navUpButton: 'moveSelectionUp',
      navDownButton: 'moveSelectionDown',
      navFastForward: 'moveSelectionRightMeasure',
      navRewind: 'moveSelectionLeftMeasure',
      navGrowLeft: 'growSelectionLeft',
      navGrowRight: 'growSelectionRight'
    };
  }
  constructor(parameters: SuiButtonParams) {
    super(parameters);
  }
  _moveTracker() {
    (this.view.tracker as any)[NavigationButtons.directionsTrackerMap[this.buttonData.id]]();
  }
  bind() {
    this.eventSource.domClick(this.buttonElement, this, '_moveTracker', null);
  }
}