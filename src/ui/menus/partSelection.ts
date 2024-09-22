import { SuiMenuBase, SuiMenuParams, MenuChoiceDefinition, MenuDefinition } from './menu';
import { SmoPartInfo } from '../../smo/data/partInfo';
declare var $: any;

export class SuiPartSelectionMenu extends SuiMenuBase {
  partMap: { keys: number[], partMap: Record<number, SmoPartInfo> } = { keys: [], partMap: {} };
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static defaults: MenuDefinition = {
    label: 'Parts',
    menuItems: [
       {
        icon: '',
        text: 'Cancel',
        value: 'cancel'
      }
    ]
  };
  getDefinition() {
    return SuiPartSelectionMenu.defaults;
  }
  selectPart(val: number) {
    if (val < 0) {
      this.view.viewAll();
      this.complete();
      return;
    }
    const partInfo = this.partMap.partMap[val];
    this.view.exposePart(this.view.storeScore.staves[partInfo.associatedStaff]);
    this.complete();
  }  
  preAttach() {
    const defs: MenuChoiceDefinition[] = [];
    this.partMap = this.view.getPartMap();
    if (this.view.score.staves.length < this.view.storeScore.staves.length) {
      defs.push({
        icon: '',
        text: 'View All',
        value: '-1'
      });
    }
    this.partMap.keys.forEach((key) => {
      defs.push({
        icon: '',
        text: this.partMap.partMap[key].partName,
        value: key.toString()
      });
    });
    defs.push({
      icon: '',
      text: 'Cancel',
      value: 'cancel'
    });
    this.menuItems = defs;
  }

  async selection(ev: any) {
    const op: string = $(ev.currentTarget).attr('data-value');
    const choice = parseInt(op);
    if (isNaN(choice)) {
      this.complete(); // cancel
    }
    this.selectPart(choice);
  }
  keydown() { }
}
