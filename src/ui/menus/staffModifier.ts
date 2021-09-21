import { SuiMenuBase, SuiMenuParams } from './menu';

declare var $: any;

export class SuiStaffModifierMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static defaults = {
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
      icon: '',
      text: 'Cancel',
      value: 'cancel'
    }],
    menuContainer: '.menuContainer'
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
    }
    // else cancel...
    this.complete();
  }
  keydown() {
  }
}
