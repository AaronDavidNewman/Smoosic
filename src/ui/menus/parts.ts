import { SuiMenuBase, SuiMenuParams, MenuChoiceDefinition, MenuDefinition } from './menu';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SuiScoreViewDialog } from '../dialogs/scoreView';
import { SuiInstrumentDialog } from '../dialogs/instrument';
import { SuiPartInfoDialog } from '../dialogs/partInfo';
import { SuiPageLayoutDialog } from '../dialogs/pageLayout';
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
      },  {
        icon: '',
        text: 'Page Layout',
        value: 'pageLayout'
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
  pageLayout() {
    createAndDisplayDialog(SuiPageLayoutDialog,
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        id: 'layoutDialog',
        ctor: 'SuiPageLayoutDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      });
  }
  preAttach() {
    const fullScore = this.view.storeScore.staves.length === this.view.score.staves.length;
    const defs: MenuChoiceDefinition[] = [];
    this.menuItems.forEach((item) => {
      // Only show 'display all' if the full score is not already displayed
      if (item.value === 'viewAll') {
        if (!fullScore) {
          defs.push(item);
        }
      } else if (item.value === 'pageLayout') {
        // only show the page layout in part menu if we are in part mode
        if (this.view.score.isPartExposed() && fullScore === false) {
          defs.push(item);
        }
      } else if (item.value === 'view') {
        if (this.view.score.isPartExposed() === false) {
          // don't let the user restrict the view if we are already viewing a part.
          defs.push(item);
        }
      } else {
        defs.push(item);
      }
    });
    this.menuItems = defs;
  }

  selection(ev: any) {
    const op: string = $(ev.currentTarget).attr('data-value');
    if (op === 'pageLayout') {
      this.pageLayout();
      this.complete();
    } else if (op === 'view') {
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
