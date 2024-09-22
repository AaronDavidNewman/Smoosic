import { SuiMenuBase, SuiMenuParams, MenuDefinition,  SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SuiEndingsDialog } from '../dialogs/endings';
import { SuiInsertMeasures } from '../dialogs/addMeasure';
import { SuiMeasureDialog } from '../dialogs/measureFormat';
import { SmoMeasureFormat } from '../../smo/data/measureModifiers';
declare var $: any;
export class SuiMeasureMenu extends SuiConfiguredMenu {
  static defaults: MenuDefinition = {
    label: 'Measure Menu',
    menuItems: [],
  }
  constructor(params: SuiMenuParams) {
    super(params, 'Notes', SuiMeasureMenuConfig);
  }  
}
const formatMeasureMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    createAndDisplayDialog(SuiMeasureDialog, {
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiMeasureDialog',
      id: 'measure-dialog',
      modifier: null
    });
  },
  display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Format Measure',
    value: 'formatMeasure'
  }
}
const addMeasureMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    createAndDisplayDialog(SuiInsertMeasures, {
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiMeasureDialog',
      id: 'insert-dialog',
      modifier: null
    });
  },
  display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Add Measures',
    value: 'addMeasures'
  }
}
const endingsMeasureMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    createAndDisplayDialog(SuiEndingsDialog, {
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiEndingsDialog',
      id: 'endings-dialog',
      modifier: null
    });
  },
  display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Endings',
    value: 'endings'
  }
}
const deleteSelectedMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.deleteMeasure();
  },
  display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Delete Selected Measures',
    value: 'deleteSelected'
  }
}
const resetSystemBreaksMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    await menu.view.removeSystemBreaks();
  },
  display: (menu: SuiMenuBase) => {
    const selections = menu.tracker.getSelectedMeasures();
    for (let i = 0; i < selections.length; ++i) {
      const sel = selections[i];
      if (sel.measure.format.systemBreak) {
        return true;
      }
    }
    return false;
  },
  menuChoice: {
    icon: '',
    text: 'Reset system breaks',
    value: 'resetFormatting'
  }
}
const resetFormattingMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    await menu.view.setMeasureFormat(new SmoMeasureFormat(SmoMeasureFormat.defaults));
  },
  display: (menu: SuiMenuBase) => {
    const selections = menu.tracker.getSelectedMeasures();
    for (let i = 0; i < selections.length; ++i) {
      const selection = selections[i];
      if (!selection.measure.format.isDefault) {
        return true;
      }
    }
    return false;
  },
  menuChoice: {
    icon: '',
    text: 'Reset formatting selection',
    value: 'resetFormatting'
  }
}
const SuiMeasureMenuConfig: SuiConfiguredMenuOption[] = [
  addMeasureMenuOption, formatMeasureMenuOption, endingsMeasureMenuOption, deleteSelectedMenuOption, 
  resetSystemBreaksMenuOption, resetFormattingMenuOption];