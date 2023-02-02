import { SuiMenuBase, SuiMenuParams, MenuDefinition } from './menu';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SuiInsertMeasures } from '../dialogs/addMeasure';
import { SuiMeasureDialog } from '../dialogs/measureFormat';
import { SmoMeasureFormat } from '../../smo/data/measureModifiers';
declare var $: any;
export class SuiMeasureMenu extends SuiMenuBase {
  static defaults: MenuDefinition = {
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
        text: 'Remove system breaks selection',
        value: 'removeSystemBreaks'
      },  {
        icon: '',
        text: 'Reset formatting selection',
        value: 'resetFormatting'
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
      createAndDisplayDialog(SuiMeasureDialog, {
        view: this.view,
        completeNotifier: this.completeNotifier,
        startPromise: this.closePromise,
        eventSource: this.eventSource,
        tracker: this.tracker,
        ctor: 'SuiMeasureDialog',
        id: 'measure-dialog',
        modifier: null
      });
      this.complete();
      return;
    }
    if (text === 'addMenuCmd') {
      createAndDisplayDialog(SuiInsertMeasures, {
        view: this.view,
        completeNotifier: this.completeNotifier,
        startPromise: this.closePromise,
        eventSource: this.eventSource,
        tracker: this.tracker,
        ctor: 'SuiMeasureDialog',
        id: 'insert-dialog',
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
    if (text === 'removeSystemBreaks') {
      this.view.removeSystemBreaks();
    }
    if (text === 'resetFormatting') {
      this.view.setMeasureFormat(new SmoMeasureFormat(SmoMeasureFormat.defaults));
    }
    this.complete();
  }
}