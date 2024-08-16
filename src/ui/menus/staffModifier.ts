import { SuiMenuBase, SuiMenuParams, MenuDefinition } from './menu';
import { SmoPedalMarking } from '../../smo/data/staffModifiers';

declare var $: any;

export class SuiStaffModifierMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static defaults: MenuDefinition = {
    label: 'Lines',
    menuItems: [{
      icon: 'cresc',
      text: 'Cresc. Hairpin',
      value: 'crescendo'
    }, {
      icon: 'decresc',
      text: 'Dim. Hairpin',
      value: 'decrescendo'
    }, {
      icon: 'slur',
      text: 'Slur',
      value: 'slur'
    }, {
      icon: 'slur',
      text: 'Tie',
      value: 'tie'
    }, {
      icon: 'pedal',
      text: 'Pedal Marking',
      value: 'pedalMarking'
    }, {
      icon: 'ending',
      text: 'nth ending',
      value: 'ending'
    }, {
      icon: '',
      text: 'Dim. Bracket',
      value: 'dimenuendo'
    }, {
      icon: '',
      text: 'Cresc. Bracket',
      value: 'crescendoBracket'
    }, {
      icon: '',
      text: 'Accelerando',
      value: 'accel'
    }, {
      icon: '',
      text: 'Ritard',
      value: 'ritard'
    }, {
      icon: 'slur',
      text: 'Reset slurs',
      value: 'resetSlurs'
    }, {
      icon: '',
      text: 'Cancel',
      value: 'cancel'
    }]
  };

  getDefinition() {
    return SuiStaffModifierMenu.defaults;
  }
  selection(ev: any) {
    var op = $(ev.currentTarget).attr('data-value');
    if (op === 'ending') {
      this.view.addEnding();
    } else if (op === 'slur') {
      this.view.addSlur();
    } else if (op === 'tie') {
      this.view.tie();
    } else if (op === 'accel') {
      this.view.accelerando();
    } else if (op === 'dimenuendo') {
      this.view.dimenuendo();
    } else if (op === 'ritard') {
      this.view.ritard();
    } else if (op === 'crescendoBracket') {
      this.view.crescendoBracket();
    } else if (op === 'pedalMarking') {
      const ft = this.tracker.getExtremeSelection(-1);
      const tt = this.tracker.getExtremeSelection(1);
      const defaults = SmoPedalMarking.defaults;
      defaults.startSelector = ft.selector;
      defaults.endSelector = tt.selector;
      const pedalMarking = new SmoPedalMarking(defaults);
      this.view.addOrReplaceStaffModifier((score, fromSelection, toSelection) => {
        const modifier = new SmoPedalMarking(pedalMarking.serialize());
        modifier.startSelector = fromSelection.selector;
        modifier.endSelector = toSelection.selector;
        score.staves[modifier.startSelector.staff].addStaffModifier(modifier);
      }, pedalMarking);
    } else if (op === 'crescendo') {
      this.view.crescendo();
    } else if (op === 'decrescendo') {
      this.view.decrescendo();
    } else if (op === 'resetSlurs') {
      const self = this;
      this.view.refreshViewport().then(() => {
        self.complete();
      });
      return;
    }
    // else cancel...
    this.complete();
  }
  keydown() {
  }
}
