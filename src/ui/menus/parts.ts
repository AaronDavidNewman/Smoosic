import { SuiMenuBase, SuiMenuParams, MenuChoiceDefinition, MenuDefinition } from './menu';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SuiScoreViewDialog } from '../dialogs/scoreView';
import { SuiInstrumentDialog } from '../dialogs/instrument';
import { SuiPartInfoDialog } from '../dialogs/partInfo';

declare var $: any;

export class SuiPartMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static defaults: MenuDefinition = {
    label: 'Parts',
    menuItems: [
      {
        icon: '',
        text: 'Part Properties',
        value: 'editPart'
      }, {
        icon: '',
        text: 'View Parts/Staves',
        value: 'view'
      }, {
        icon: '',
        text: 'View All',
        value: 'viewAll'
      }, {
        icon: '',
        text: 'Instrument Properties',
        value: 'editInstrument'
      }, {
        icon: '',
        text: 'Cancel',
        value: 'cancel'
      }
    ]
  };
  getDefinition() {
    return SuiPartMenu.defaults;
  }
  execView() {
    createAndDisplayDialog(SuiScoreViewDialog,
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        id: 'scoreViewDialog',
        ctor: 'SuiScoreViewDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      });
  }
  editPart() {
    createAndDisplayDialog(SuiPartInfoDialog,
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        id: 'editPart',
        ctor: 'SuiPartInfoDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      }
    );
  }
  editInstrument() {
    createAndDisplayDialog(SuiInstrumentDialog,
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        id: 'instrumentModal',
        ctor: 'SuiInstrumentDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      }
    );
  }
  preAttach() {
    if (this.view.storeScore.staves.length !== this.view.score.staves.length) {
      return;
    }
    const defs: MenuChoiceDefinition[] = [];
    this.menuItems.forEach((item) => {
      if (item.value !== 'viewAll') {
        defs.push(item);
      }
    });
    this.menuItems = defs;
  }

  selection(ev: any) {
    const op: string = $(ev.currentTarget).attr('data-value');
    if (op === 'view') {
      this.execView();
      this.complete();
    } else if (op === 'editPart') {
      this.editPart();
      this.complete();
    } else if (op === 'editInstrument') {
      this.editInstrument();
      this.complete();
    } else if (op === 'cancel') {
      this.complete();
    } else if (op === 'viewAll') {
      this.view.viewAll();
      this.complete();
    }
  }
  keydown() { }
}
