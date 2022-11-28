import { SuiMenuBase, SuiMenuParams, MenuChoiceDefinition, MenuDefinition } from './menu';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SuiScoreViewDialog } from '../dialogs/scoreView';
import { SuiInstrumentDialog } from '../dialogs/instrument';
import { SuiPartInfoDialog } from '../dialogs/partInfo';
import { SuiPageLayoutDialog } from '../dialogs/pageLayout';
import { SuiNewPartDialog } from '../dialogs/newPart';
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
        text: 'Create New Part/Stave',
        value: 'createPart'
      }, {
        icon: 'cancel-circle',
        text: 'Remove Selected Parts/Staves',
        value: 'removePart'
      }, {
        icon: '',
        text: 'Part Properties',
        value: 'editPart'
      },  {
        icon: '',
        text: 'Page Layout',
        value: 'pageLayout'
      }, {
        icon: '',
        text: 'View Partial Score',
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
  createPart() {
    createAndDisplayDialog(SuiNewPartDialog,
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        id: 'newPartDialog',
        ctor: 'SuiNewPartDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      });
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
    const selection = this.view.tracker.selections[0];
    const self = this;

    if (this.view.score.staves.length !== selection.staff.partInfo.stavesAfter + selection.staff.partInfo.stavesBefore + 1) {
      this.view.exposePart(selection.staff);
    }
    this.view.renderPromise().then(() => {
      createAndDisplayDialog(SuiPartInfoDialog,
        {
          completeNotifier: self.completeNotifier!,
          view: self.view,
          undoBuffer: self.view.undoBuffer,
          eventSource: self.eventSource,
          id: 'editPart',
          ctor: 'SuiPartInfoDialog',
          tracker: self.view.tracker,
          modifier: null,
          startPromise: self.closePromise
        }
      );
    });
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
      });
  }
  removePart() {
    this.view.removeStaff();
    this.complete();
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
        if (this.view.isPartExposed()) {
          defs.push(item);
        }
      } else if (item.value === 'view') {
        if (this.view.isPartExposed() === false) {
          // don't let the user restrict the view if we are already viewing a part.
          defs.push(item);
        }
      } else if (item.value === 'editPart') {
        if (this.view.isPartExposed() === false) {
          // TODO: use language-specific text for both of these
          item.text = 'Edit Part';
        } else {
          item.text = 'Part Properties';
        }
        defs.push(item);
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
    } else if (op === 'createPart') {
      this.createPart();
      this.complete();
    } else if (op === 'removePart') {
      this.removePart();
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
