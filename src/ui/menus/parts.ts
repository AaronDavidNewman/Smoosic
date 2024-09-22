import { SuiMenuBase, SuiMenuParams, MenuChoiceDefinition, MenuDefinition, 
  SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SuiScoreViewDialog } from '../dialogs/scoreView';
import { SuiInstrumentDialog } from '../dialogs/instrument';
import { SuiPartInfoDialog } from '../dialogs/partInfo';
import { SuiPageLayoutDialog } from '../dialogs/pageLayout';
import { SuiNewPartDialog } from '../dialogs/newPart';
import { SuiTabStaveDialog } from '../dialogs/tabStave';
declare var $: any;

export const createNotePartMenuOption: SuiConfiguredMenuOption = {
  menuChoice: {
    icon: '',
        text: 'Create New Part/Stave',
        value: 'createPart'
  }, display: () => true,
  handler: async(menu: SuiMenuBase) => {
    createAndDisplayDialog(SuiNewPartDialog,
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'newPartDialog',
        ctor: 'SuiNewPartDialog',
        tracker: menu.view.tracker,
        modifier: menu,
        startPromise: menu.closePromise
      });
  }
}
export const removePartMenuOption: SuiConfiguredMenuOption = {
  menuChoice: {    
      icon: 'cancel-circle',
      text: 'Remove Selected Parts/Staves',
      value: 'removePart'
  }, display: () => true,
  handler: async (menu: SuiMenuBase) => {
    await menu.view.removeStaff();
  }
}
export const partPropertiesMenuOption: SuiConfiguredMenuOption = {
  menuChoice: {    
    icon: '',
    text: 'Part Properties',
    value: 'editPart'
  }, display: (menu: SuiMenuBase) => menu.view.isPartExposed(),
  handler: async (menu: SuiMenuBase) => {
    const selection = menu.view.tracker.selections[0];
    if (menu.view.score.staves.length !== selection.staff.partInfo.stavesAfter + selection.staff.partInfo.stavesBefore + 1) {
      menu.view.exposePart(selection.staff);
    }
    await menu.view.renderPromise();
    createAndDisplayDialog(SuiPartInfoDialog,
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'editPart',
        ctor: 'SuiPartInfoDialog',
        tracker: menu.view.tracker,
        modifier: null,
        startPromise: menu.closePromise
      }
    );
  }
}
export const pageLayoutMenuOption: SuiConfiguredMenuOption = {
  menuChoice: {
    icon: '',
    text: 'Page Layout',
    value: 'pageLayout'
  }, display: (menu: SuiMenuBase) => menu.view.isPartExposed(),
  handler: async (menu: SuiMenuBase) => {
    createAndDisplayDialog(SuiPageLayoutDialog,
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'layoutDialog',
        ctor: 'SuiPageLayoutDialog',
        tracker: menu.view.tracker,
        modifier: null,
        startPromise: menu.closePromise
      });
  }
}

export const viewPartialScoreMenuOption: SuiConfiguredMenuOption = {
  menuChoice: {
    icon: '',
    text: 'View Partial Score',
    value: 'view'
  }, display: (menu: SuiMenuBase) => !menu.view.isPartExposed(),
  handler: async (menu: SuiMenuBase) => {
    createAndDisplayDialog(SuiScoreViewDialog,
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'scoreViewDialog',
        ctor: 'SuiScoreViewDialog',
        tracker: menu.view.tracker,
        modifier: null,
        startPromise: menu.closePromise
      });
  }
}
export const viewFullScoreMenuOption: SuiConfiguredMenuOption = {
  menuChoice: {
    icon: '',
    text: 'View All',
    value: 'viewAll'
  }, display: (menu: SuiMenuBase) => menu.view.score.staves.length < menu.view.storeScore.staves.length,
  handler: async (menu: SuiMenuBase) => {
    await menu.view.viewAll();
  }
}

export const editInstrumentMenuOption: SuiConfiguredMenuOption = {
  menuChoice: {
    icon: '',
    text: 'Instrument Properties',
    value: 'editInstrument'
  }, display: (menu: SuiMenuBase) => true,
  handler: async (menu: SuiMenuBase) => {
    createAndDisplayDialog(SuiInstrumentDialog,
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'instrumentModal',
        ctor: 'SuiInstrumentDialog',
        tracker: menu.view.tracker,
        modifier: menu,
        startPromise: menu.closePromise
      });
  }
}
export const tabStaveMenuOption: SuiConfiguredMenuOption = {
  menuChoice:  {
    icon: '',
    text: 'Guitar Tablature',
    value: 'tabStave'
  }, display: (menu: SuiMenuBase) => true,
  handler: async (menu: SuiMenuBase) => {
    createAndDisplayDialog<SuiTabStaveDialog>(SuiTabStaveDialog, {
      ctor: 'SuiTabStaveDialog',
      id: 'tabStaveDialog',
      tracker: menu.view.tracker,
      completeNotifier: menu.completeNotifier,
      startPromise: null,
      view: menu.view,
      eventSource: menu.eventSource
    });
  }
}
export const moveUpMenuOption: SuiConfiguredMenuOption = {
  menuChoice:  {
    icon: 'icon-smo icon-arrow-up',
    text: 'Move Part Up',
    value: 'partUp'
  }, display: (menu: SuiMenuBase) =>  {
    return menu.view.score.staves.length > 1;
  },
  handler: async (menu: SuiMenuBase) => {
    await menu.view.moveStaffUpDown(-1);
  }
}
export const moveDownMenuOption: SuiConfiguredMenuOption = {
  menuChoice:  {
    icon: 'icon-smo icon-arrow-up',
    text: 'Move Part Down',
    value: 'partDown'
  }, display: (menu: SuiMenuBase) =>  {
    return menu.view.score.staves.length > 1;
  },
  handler: async (menu: SuiMenuBase) => {
    await menu.view.moveStaffUpDown(1);
  }
}
export const SuiPartMenuOptions: SuiConfiguredMenuOption[] = [
  createNotePartMenuOption, removePartMenuOption, partPropertiesMenuOption, pageLayoutMenuOption, viewPartialScoreMenuOption, 
  editInstrumentMenuOption, viewFullScoreMenuOption, tabStaveMenuOption, moveUpMenuOption, moveDownMenuOption
];

export class SuiPartMenu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, 'Parts', SuiPartMenuOptions);
  }  
}
