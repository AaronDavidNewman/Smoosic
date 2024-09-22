import { SuiMenuBase, SuiMenuParams, MenuDefinition, SuiMenuHandler, SuiMenuShowOption, 
  SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';
import { createAndDisplayDialog } from '../dialogs/dialog';

declare var $: any;
export class SuiVoiceMenu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, 'Voices', SuiVoiceMenuOptions);
  }  
}

const selectVoiceOneMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.populateVoice(0);
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
      const mm = menu.view.tracker.selections[i].measure;
      if (mm.voices.length > 1) {
        return true;
      }
    }
    return false;
  },
  menuChoice: {
    icon: '',
    text: 'Voice 1',
    value: 'voiceOne'
  }
}
const selectVoiceTwoMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.populateVoice(1);
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
      const mm = menu.view.tracker.selections[i].measure;
      if (mm.voices.length < 4) {
        return true;
      }
    }
    return false;
  },
  menuChoice: {
    icon: '',
    text: 'Voice 2',
    value: 'voiceTwo'
  }
}
const selectVoiceThreeMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.populateVoice(2);
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
      const mm = menu.view.tracker.selections[i].measure;
      if (mm.voices.length < 4 && mm.voices.length > 1) {
        return true;
      }
    }
    return false;
  },
  menuChoice: {
    icon: '',
    text: 'Voice 3',
    value: 'voiceThree'
  }
}
const selectVoiceFourMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.populateVoice(3);
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
      const mm = menu.view.tracker.selections[i].measure;
      if (mm.voices.length < 4 && mm.voices.length > 2) {
        return true;
      }
    }
    return false;
  },
  menuChoice: {
    icon: '',
    text: 'Voice 4',
    value: 'voiceFour'
  }
}
const removeVoiceMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.depopulateVoice();
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
      const mm = menu.view.tracker.selections[i].measure;
      if (mm.activeVoice > 0) {
        return true;
      }
    }
    return false;
  },
  menuChoice: {
    icon: '',
    text: 'Remove Voice',
    value: 'removeVoice'
  }
}
const SuiVoiceMenuOptions: SuiConfiguredMenuOption[] = [
  selectVoiceOneMenuOption, selectVoiceTwoMenuOption, selectVoiceThreeMenuOption, selectVoiceFourMenuOption,
  removeVoiceMenuOption
];
