import { SuiMenuBase, SuiMenuParams } from './menu';
import { SmoSystemStaffParams, SmoSystemStaff } from '../../smo/data/systemStaff';
import { SuiStaffGroupDialog } from '../dialogs/staffGroup';
import { createAndDisplayDialog } from '../dialogs/dialog';

declare var $: any;

export class SuiStaffMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static defaults = {
    label: 'Add Staff',
    menuItems: [
      {
        icon: 'treble',
        text: 'Treble Clef Staff',
        value: 'trebleInstrument'
      }, {
        icon: 'bass',
        text: 'Bass Clef Staff',
        value: 'bassInstrument'
      }, {
        icon: 'alto',
        text: 'Alto Clef Staff',
        value: 'altoInstrument'
      }, {
        icon: 'tenor',
        text: 'Tenor Clef Staff',
        value: 'tenorInstrument'
      }, {
        icon: 'percussion',
        text: 'Percussion Clef Staff',
        value: 'percussionInstrument'
      }, {
        icon: '',
        text: 'Staff Groups',
        value: 'staffGroups'
      }, {
        icon: 'cancel-circle',
        text: 'Remove Staff',
        value: 'remove'
      }, {
        icon: '',
        text: 'Cancel',
        value: 'cancel'
      }
    ],
    menuContainer: '.menuContainer'
  };

  static get instrumentMap(): Record<string, Partial<SmoSystemStaffParams>> {
    return {
      'trebleInstrument': {
        instrumentInfo: {
          instrumentName: 'Treble Clef Staff',
          keyOffset: 0,
          clef: 'treble'
        }
      },
      'bassInstrument': {
        instrumentInfo: {
          instrumentName: 'Bass Clef Staff',
          keyOffset: 0,
          clef: 'bass'
        }
      },
      'altoInstrument': {
        instrumentInfo: {
          instrumentName: 'Alto Clef Staff',
          keyOffset: 0,
          clef: 'alto'
        }
      },
      'tenorInstrument': {
        instrumentInfo: {
          instrumentName: 'Tenor Clef Staff',
          keyOffset: 0,
          clef: 'tenor'
        }
      },
      'percussionInstrument': {
        instrumentInfo: {
          instrumentName: 'Percussion Clef Staff',
          keyOffset: 0,
          clef: 'percussion'
        }
      },
      'remove': {
        instrumentInfo: {
          instrumentName: 'Remove clef',
          keyOffset: 0,
          clef: 'tenor'
        }
      }
    };
  }
  getDefinition() {
    return SuiStaffMenu.defaults;
  }
  execStaffGroups() {
    createAndDisplayDialog(SuiStaffGroupDialog,
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        id: 'staffGroups',
        ctor: 'SuiStaffGroupDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      }
    );
  }

  selection(ev: any) {
    const op: string = $(ev.currentTarget).attr('data-value');
    if (op === 'remove') {
      this.view.removeStaff();
      this.complete();
    } else if (op === 'staffGroups') {
      this.execStaffGroups();
      this.complete();
    } else if (op === 'cancel') {
      this.complete();
    } else {
      const instrument: SmoSystemStaffParams = SmoSystemStaff.defaults;
      const params = SuiStaffMenu.instrumentMap[op];
      if (params.instrumentInfo) {
        instrument.instrumentInfo = params.instrumentInfo;
        this.view.addStaff(instrument);
      }
      this.complete();
    }
  }
  keydown() { }
}
