import { SuiMenuBase, SuiMenuParams, MenuDefinition } from './menu';
import { SmoPedalMarking } from '../../smo/data/staffModifiers';
import { SmoSelector } from '../../smo/xform/selections';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';

declare var $: any;

export async function addOrReplacePedalMarking(view: SuiScoreViewOperations, obj: SmoPedalMarking) {
  await view.addOrReplaceStaffModifier((score, fromSelection, toSelection) => {
    const modifier = new SmoPedalMarking(obj.serialize());
    modifier.startSelector = fromSelection.selector;
    modifier.endSelector = toSelection.selector;
    score.staves[modifier.startSelector.staff].addStaffModifier(modifier);
  }, obj);
}
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
    },{
      icon: 'icon-ending',
      text: 'Repeate Endings',
      value: 'endings'
    },
     {
      icon: '',
      text: 'Cancel',
      value: 'cancel'
    }]
  };

  getDefinition() {
    return SuiStaffModifierMenu.defaults;
  }
  async selection(ev: any) {
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
    } else if (op === 'endings') {
      this.view.addEnding();
    } else if (op === 'pedalMarking') {
      const ft = this.tracker.getExtremeSelection(-1);
      const tt = this.tracker.getExtremeSelection(1);
      const defaults = SmoPedalMarking.defaults;
      defaults.startSelector = ft.selector;
      defaults.endSelector = tt.selector;
      const pedalMarking = new SmoPedalMarking(defaults);
      const overlaps = this.score.staves[pedalMarking.startSelector.staff].findSimlarOverlap(pedalMarking);
      if (overlaps.length) {
        const minSelector = SmoSelector.order(overlaps[0].startSelector, pedalMarking.startSelector)[0];
        const maxSelector = SmoSelector.order(overlaps[0].endSelector, pedalMarking.endSelector)[1];
        pedalMarking.startSelector = minSelector;
        pedalMarking.endSelector = maxSelector;
        await this.view.removeStaffModifier(overlaps[0]);
      }
      await addOrReplacePedalMarking(this.view, pedalMarking);
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
