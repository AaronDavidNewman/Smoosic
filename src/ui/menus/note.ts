import { createAndDisplayDialog } from '../dialogs/dialog';
import {SuiArpeggioDialog } from '../dialogs/arpeggio';
import { SuiClefChangeDialog } from '../dialogs/clefChange';
import { SuiNoteHeadDialog } from '../dialogs/noteHead';
import { SuiOrnamentDialog } from '../dialogs/ornament';
import { SuiArticulationDialog } from '../dialogs/articulation';
import { SuiMenuBase, SuiMenuParams, MenuDefinition, SuiMenuHandler, SuiMenuShowOption, 
  SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';
declare var $: any;
export class SuiNoteMenu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, 'Notes', SuiNoteMenuOptions);
  }  
}

const toggleCueMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    await menu.view.toggleCue();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Toggle Cue',
    value: 'toggleCueMenuOption'
  }
}
const arpeggioMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    createAndDisplayDialog(SuiArpeggioDialog, {
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiArpeggioDialog',
      id: 'insert-dialog',
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Arpeggio',
    value: 'arpeggioDialog'
  }
}

const noteHeadMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    createAndDisplayDialog(SuiNoteHeadDialog, {
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiNoteHeadDialog',
      id: 'insert-dialog',
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Note Head',
    value: 'noteHeadDialog'
  }
}

const clefNoteDialogMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    createAndDisplayDialog(SuiClefChangeDialog, {
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiClefChangeDialog',
      id: 'insert-dialog',
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Change Clef',
    value: 'clefNoteDialog'
  }
}

const ornamentNoteDialogMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    createAndDisplayDialog(SuiOrnamentDialog, {
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiOrnamentDialog',
      id: 'ornament-dialog',
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Ornaments',
    value: 'ornamentDialog'
  }
}
const articulationNoteDialogMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    createAndDisplayDialog(SuiArticulationDialog, {
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiArticulationDialog',
      id: 'ornament-dialog',
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Articulations',
    value: 'articulationDialog'
  }
}
const SuiNoteMenuOptions: SuiConfiguredMenuOption[] = [
  toggleCueMenuOption, arpeggioMenuOption, clefNoteDialogMenuOption, noteHeadMenuOption, ornamentNoteDialogMenuOption,
  articulationNoteDialogMenuOption
]