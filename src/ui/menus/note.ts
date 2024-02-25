import { createAndDisplayDialog } from '../dialogs/dialog';
import {SuiArpeggioDialog } from '../dialogs/arpeggio';
import { SuiClefChangeDialog } from '../dialogs/clefChange';
import { SuiMenuBase, SuiMenuParams, MenuDefinition } from './menu';
declare var $: any;
export class SuiNoteMenu extends SuiMenuBase {
  static defaults: MenuDefinition = {
    label: 'Measure',
    menuItems: [
      {
        icon: '',
        text: 'Toggle Cue',
        value: 'toggleCueCmd'
      }, {
        icon: '',
        text: 'Arpeggio',
        value: 'arpeggioDialog'
      },{
        icon: '',
        text: 'Change Clef',
        value: 'clefNoteDialog'
      }, {
        icon: '',
        text: 'Cancel',
        value: 'cancel'
      }
    ]
  };

  getDefinition() {
    return SuiNoteMenu.defaults;
  }
  constructor(params: SuiMenuParams) {
    super(params);
  }
  async selection(ev: any) {
    const text = $(ev.currentTarget).attr('data-value');
    if (text === 'toggleCueCmd') {
      await this.view.toggleCue();
    } else if (text === 'arpeggioDialog') {
      createAndDisplayDialog(SuiArpeggioDialog, {
        view: this.view,
        completeNotifier: this.completeNotifier,
        startPromise: this.closePromise,
        eventSource: this.eventSource,
        tracker: this.tracker,
        ctor: 'SuiArpeggioDialog',
        id: 'insert-dialog',
        modifier: null
      });
      this.complete();
    } else if (text === 'clefNoteDialog') {
      createAndDisplayDialog(SuiClefChangeDialog, {
        view: this.view,
        completeNotifier: this.completeNotifier,
        startPromise: this.closePromise,
        eventSource: this.eventSource,
        tracker: this.tracker,
        ctor: 'SuiClefChangeDialog',
        id: 'insert-dialog',
        modifier: null
      });
      this.complete();
    }
    this.complete();    
  }
}