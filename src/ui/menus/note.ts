import { SmoSelection } from '../../../release/smoosic';
import { SuiMenuBase, SuiMenuParams, MenuDefinition } from './menu';
declare var $: any;
export class SuiNoteMenu extends SuiMenuBase {
  static defaults: MenuDefinition = {
    label: 'Measure',
    menuItems: [
      {
        icon: '',
        text: 'Toggle Cue',
        value: 'toggleCueCmd'
      }, {
        icon: '',
        text: 'Cancel',
        value: 'cancel'
      }
    ]
  };

  getDefinition() {
    return SuiNoteMenu.defaults;
  }
  constructor(params: SuiMenuParams) {
    super(params);
  }
  async selection(ev: any) {
    const text = $(ev.currentTarget).attr('data-value');
    if (text === 'toggleCueCmd') {
      await this.view.toggleCue();
    }
    this.complete();    
  }
}