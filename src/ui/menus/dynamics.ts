import { SmoDynamicText } from '../../smo/data/noteModifiers';
import { SuiMenuBase, SuiMenuParams, MenuDefinition } from './menu';
declare var $: any;
export class SuiDynamicsMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static defaults: MenuDefinition = {
    label: 'Dynamics',
    menuItems: [{
      icon: 'pianissimo',
      text: 'Pianissimo',
      value: 'pp'
    }, {
      icon: 'piano',
      text: 'Piano',
      value: 'p'
    }, {
      icon: 'mezzopiano',
      text: 'Mezzo-piano',
      value: 'mp'
    }, {
      icon: 'mezzoforte',
      text: 'Mezzo-forte',
      value: 'mf'
    }, {
      icon: 'forte',
      text: 'Forte',
      value: 'f'
    }, {
      icon: 'fortissimo',
      text: 'Fortissimo',
      value: 'ff'
    }, {
      icon: 'sfz',
      text: 'sfortzando',
      value: 'sfz'
    }, {
      icon: '',
      text: 'Cancel',
      value: 'cancel'
    }]
  };

  getDefinition() {
    return SuiDynamicsMenu.defaults;
  }

  selection(ev: any) {
    const text: string = $(ev.currentTarget).attr('data-value');
    const props = SmoDynamicText.defaults;
    props.text = text;
    const dynamic = new SmoDynamicText(props);
    this.view.addDynamic(this.tracker.selections[0], dynamic);
    this.complete();
  }
  keydown() { }
}
