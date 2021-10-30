import { SuiMenuBase, SuiMenuParams } from './menu';
import { SmoSystemStaffParams, SmoSystemStaff } from '../../smo/data/systemStaff';
import { SuiStaffGroupDialog } from '../dialogs/staffGroup';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SmoSelector } from '../../smo/xform/selections';
import { SmoInstrumentParams } from '../../smo/data/staffModifiers';
import { SuiPartInfoDialog } from '../dialogs/partInfo';

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

  static get instrumentMap(): Record<string, SmoInstrumentParams> {
    return {
      'trebleInstrument': {
        instrumentName: 'Treble Clef Staff',
        keyOffset: 0,
        abbreviation: 'treble',
        midichannel: 0,
        midiport: 0,
        clef: 'treble',
        startSelector: SmoSelector.default,
        endSelector: SmoSelector.default
      },
      'bassInstrument': {
        instrumentName: 'Bass Clef Staff',
        keyOffset: 0,
        abbreviation: 'treble',
        midichannel: 0,
        midiport: 0,
        clef: 'bass',
        startSelector: SmoSelector.default,
        endSelector: SmoSelector.default
      },
      'altoInstrument': {
        instrumentName: 'Alto Clef Staff',
        keyOffset: 0,
        abbreviation: 'treble',
        midichannel: 0,
        midiport: 0,
        clef: 'alto',
        startSelector: SmoSelector.default,
        endSelector: SmoSelector.default
      },
      'tenorInstrument': {
        instrumentName: 'Tenor Clef Staff',
        keyOffset: 0,
        abbreviation: 'treble',
        midichannel: 0,
        midiport: 0,
        clef: 'tenor',
        startSelector: SmoSelector.default,
        endSelector: SmoSelector.default
      },
      'percussionInstrument': {
        instrumentName: 'Percussion Clef Staff',
        keyOffset: 0,
        abbreviation: 'treble',
        midichannel: 0,
        midiport: 0,
        clef: 'percussion',
        startSelector: SmoSelector.default,
        endSelector: SmoSelector.default
      }
    };
  }
  getDefinition() {
    return SuiStaffMenu.defaults;
  }

  selection(ev: any) {
    const op: string = $(ev.currentTarget).attr('data-value');
    if (op === 'remove') {
      this.view.removeStaff();
      this.complete();
    } else if (op === 'cancel') {
      this.complete();
    } else {
      const params = SuiStaffMenu.instrumentMap[op];
      this.view.addStaffSimple(params);
      this.complete();
    }
  }
  keydown() { }
}
