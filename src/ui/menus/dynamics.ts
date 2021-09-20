import { SuiMenuBase, SuiMenuParams } from './menu';
declare var $: any;
export class SuiDynamicsMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static get defaults() {
    return {
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
  }
  getDefinition() {
    return SuiDynamicsMenu.defaults;
  }

  selection(ev: any) {
    const text = $(ev.currentTarget).attr('data-value');
    this.view.addDynamic(text);
    this.complete();
  }
  keydown() {}
}
