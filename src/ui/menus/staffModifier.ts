import { SuiMenuBase, SuiMenuParams, MenuDefinition } from './menu';
import { SuiTabStaveDialog, SuiTabStaveAdapter } from '../dialogs/tabStave';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { getId } from '../../smo/data/common';
import { SuiScoreView } from '../../render/sui/scoreView';
import { SmoOperation } from '../../smo/xform/operations';

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
      icon: 'none',
      text: 'Tab Stave',
      value: 'setTabStave'
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
      this.view.slur();
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
    } else if (op === 'setTabStave') {
      createAndDisplayDialog<SuiTabStaveDialog>(SuiTabStaveDialog, {
        ctor: 'SuiTabStaveDialog',
        id: getId(),
        tracker: this.view.tracker,
        completeNotifier: this.completeNotifier,
        startPromise: null,
        view: this.view,
        eventSource: this.eventSource,
  // definition: DialogDefinition,
      });
    }
    // else cancel...
    this.complete();
  }
  keydown() {
  }
}
