import { SuiMenuBase, SuiMenuParams, MenuDefinition, SuiMenuHandler, SuiMenuShowOption, 
  SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';

  declare var $: any;
export class SuiBeamMenu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, 'Beams', SuiBeamMenuOptions);
  }  
}

const toggleBeamGroupMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.toggleBeamGroup();
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
      const mm = menu.view.tracker.selections[i].measure;
      for (let j = 0; j < mm.voices.length; ++j) {
        const vv = mm.voices[j];
        for (let k = 0; k < vv.notes.length; ++k) {
          const nn = vv.notes[k];
          if (nn) {
            if (nn.noteType === 'n' &&  nn.tickCount < 4096) {
              return true;
            }
          }
        }
      }
    }
    return false;
  },
  menuChoice: {
    icon: 'icon smo-icon icon-beamBreak',
    text: 'Toggle Beam Group',
    hotkey: 'x',
    value: 'toggleBeamMenuOption'
  }
}
const beamSelectionsMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.beamSelections();
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
      const mm = menu.view.tracker.selections[i].measure;
      for (let j = 0; j < mm.voices.length; ++j) {
        const vv = mm.voices[j];
        for (let k = 0; k < vv.notes.length; ++k) {
          const nn = vv.notes[k];
          if (nn) {
            if (nn.noteType === 'n' &&  nn.tickCount < 4096) {
              return true;
            }
          }
        }
      }
    }
    return false;
  },
  menuChoice: {
    icon: 'icon smo-icon icon-beam',
    text: 'Beam Selections',
    hotkey: 'Shift-X',
    value: 'beamSelectionsMenuOption'
  }
}
const toggleBeamDirectionMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.toggleBeamDirection();
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
      const mm = menu.view.tracker.selections[i].measure;
      for (let j = 0; j < mm.voices.length; ++j) {
        const vv = mm.voices[j];
        for (let k = 0; k < vv.notes.length; ++k) {
          const nn = vv.notes[k];
          if (nn) {
            if (nn.noteType === 'n') {
              return true;
            }
          }
        }
      }
    }
    return false;
  },
  menuChoice: {
    icon: 'icon icon-smo icon-flagFlip',
    text: 'Toggle Stem Direction (auto, up, down)',
    hotkey: 'Shift-B',
    value: 'toggleBeamDirection'
  }
}
const tripletMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.makeTuplet(3);
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {      
      const mm = menu.view.tracker.selections[i].measure;
      for (let j = 0; j < mm.voices.length; ++j) {
        const vv = mm.voices[j];
        for (let k = 0; k < vv.notes.length; ++k) {
          const nn = vv.notes[k];
          if (nn) {
            if (nn.noteType === 'n') {
             return true;
            }
          }
        }
      }
    }
    return false;
  },
  menuChoice: {
    icon: ' icon icon-smo icon-triplet',
    text: 'Make Triplet',
    hotkey: 'Ctrl-3',
    value: 'tripletMenuOption'
  }
}
const quintupletMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.makeTuplet(3);
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {      
      const mm = menu.view.tracker.selections[i].measure;
      for (let j = 0; j < mm.voices.length; ++j) {
        const vv = mm.voices[j];
        for (let k = 0; k < vv.notes.length; ++k) {
          const nn = vv.notes[k];
          if (nn) {
            if (nn.noteType === 'n') {
             return true;
            }
          }
        }
      }
    }
    return false;
  },
  menuChoice: {
    icon: 'icon-smo icon-quint',
    text: 'Make 5-tuplet',
    hotkey: 'Ctrl-5',
    value: 'quintupletMenuOption'
  }
}
const sevenTupletMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.makeTuplet(3);
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {      
      const mm = menu.view.tracker.selections[i].measure;
      for (let j = 0; j < mm.voices.length; ++j) {
        const vv = mm.voices[j];
        for (let k = 0; k < vv.notes.length; ++k) {
          const nn = vv.notes[k];
          if (nn) {
            if (nn.noteType === 'n') {
             return true;
            }
          }
        }
      }
    }
    return false;
  },
  menuChoice: {
    icon: 'icon-smo icon icon-septuplet',
    hotkey: 'Ctrl-7',
    text: 'Make 7-tuplet',
    value: 'sevenTupletMenuOption'
  }
}
const removeTupletMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.unmakeTuplet();
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {      
      const mm = menu.view.tracker.selections[i].measure;
      for (let j = 0; j < mm.voices.length; ++j) {
        const vv = mm.voices[j];
        for (let k = 0; k < vv.notes.length; ++k) {
          const nn = vv.notes[k];
          if (nn) {
            if (nn.isTuplet) {
             return true;
            }
          }
        }
      }
    }
    return false;
  },
  menuChoice: {
    icon: 'icon icon-smo icon-no_tuplet',
    text: 'Unmake tuplet',
    hotkey: 'Ctrl-0',
    value: 'unmakeTuplet'
  }
}
const SuiBeamMenuOptions: SuiConfiguredMenuOption[] = [toggleBeamGroupMenuOption,
  beamSelectionsMenuOption, toggleBeamDirectionMenuOption, tripletMenuOption, quintupletMenuOption,
  sevenTupletMenuOption, removeTupletMenuOption
];