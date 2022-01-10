import { SuiMenuBase, SuiMenuParams, MenuDefinition } from './menu';
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
      text: 'Crescendo',
      value: 'crescendo'
    }, {
      icon: 'decresc',
      text: 'Decrescendo',
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
      this.view.slur();
    } else if (op === 'tie') {
      this.view.tie();
    } else if (op === 'crescendo') {
      this.view.crescendo();
    } else if (op === 'decrescendo') {
      this.view.decrescendo();
    } else if (op === 'resetSlurs') {
      const self = this;
      SuiScoreView.resetSlursHack(this.view.score);
      SuiScoreView.resetSlursHack(this.view.storeScore);
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
