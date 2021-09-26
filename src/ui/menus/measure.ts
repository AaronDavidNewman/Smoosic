import { SuiMenuBase, SuiMenuParams } from './menu';
import { SuiMeasureDialog, SuiInsertMeasures } from '../dialogs/measureDialogs';
declare var $: any;
export class SuiMeasureMenu extends SuiMenuBase {
  static defaults = {
    label: 'Measure',
    menuItems: [
      {
        icon: '',
        text: 'Add Measures',
        value: 'addMenuCmd'
      }, {
        icon: 'icon-cross',
        text: 'Delete Selected Measures',
        value: 'deleteSelected'
      }, {
        icon: '',
        text: 'Format Measure',
        value: 'formatMeasureDialog'
      }, {
        icon: '',
        text: 'Cancel',
        value: 'cancel'
      }
    ]
  };

  getDefinition() {
    return SuiMeasureMenu.defaults;
  }
  constructor(params: SuiMenuParams) {
    super(params);
  }
  selection(ev: any) {
    const text = $(ev.currentTarget).attr('data-value');
    if (text === 'formatMeasureDialog') {
      SuiMeasureDialog.createAndDisplay({
        view: this.view,
        completeNotifier: this.completeNotifier,
        startPromise: this.closePromise,
        eventSource: this.eventSource,
        tracker: this.tracker,
        ctor: 'SuiMeasureDialog',
        id: 'measure-dialog',
        undoBuffer: this.undoBuffer,
        modifier: null
      });
      this.complete();
      return;
    }
    if (text === 'addMenuCmd') {
      SuiInsertMeasures.createAndDisplay({
        view: this.view,
        completeNotifier: this.completeNotifier,
        startPromise: this.closePromise,
        eventSource: this.eventSource,
        tracker: this.tracker,
        ctor: 'SuiMeasureDialog',
        id: 'insert-dialog',
        undoBuffer: this.undoBuffer,
        modifier: null
      });
      this.complete();
    }
    if (text === 'addMenuAfterCmd') {
      this.view.addMeasure(true);
      this.complete();
    }
    if (text === 'deleteSelected') {
      this.view.deleteMeasure();
    }
    this.complete();
  }
}