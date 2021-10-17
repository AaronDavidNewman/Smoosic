// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SmoSystemGroup } from '../../smo/data/scoreModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';

declare var $: any;

export class SuiStaffGroupDialogAdapter extends SuiComponentAdapter {
  staffGroup: SmoSystemGroup;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    const selection = this.view.tracker.selections[0];
    // Reset the view so we can see all the staves
    this.view.viewAll();
    const staffGroup = this.view.score.getSystemGroupForStaff(selection);
    if (!staffGroup) {
      const params = SmoSystemGroup.defaults;
      params.startSelector = JSON.parse(JSON.stringify(selection.selector));
      params.endSelector = JSON.parse(JSON.stringify(selection.selector));
      this.staffGroup = new SmoSystemGroup(params);
    } else {
      this.staffGroup = staffGroup;
    }
  }
  commit() {

  }
  cancel() {

  }
  get leftConnector() {
    return this.staffGroup.leftConnector;
  }
  set leftConnector(val: number) {
    this.staffGroup.leftConnector = val;
    this.view.addOrUpdateStaffGroup(this.staffGroup);
  }
  get staffGroups() {
    return this.staffGroup;
  }
  set staffGroups(val: SmoSystemGroup) {
    this.staffGroup = val;
    this.view.addOrUpdateStaffGroup(this.staffGroup);
  }
}
// ## SuiStaffGroupDialog
// A staff group is a grouping of staves that can be bracketed and justified
export class SuiStaffGroupDialog extends SuiDialogAdapterBase<SuiStaffGroupDialogAdapter> {
  static dialogElements: DialogDefinition = 
      {
        label: 'Staff Group', elements:
          [{
            smoName: 'staffGroups',
            control: 'StaffAddRemoveComponent',
            label: 'Staves in Group',
          }, {
            smoName: 'leftConnector',
            control: 'SuiDropdownComponent',
            label: 'Left Connector',
            options: [
              {
                value: SmoSystemGroup.connectorTypes.bracket,
                label: 'Bracket'
              }, {
                value: SmoSystemGroup.connectorTypes.brace,
                label: 'Brace'
              }, {
                value: SmoSystemGroup.connectorTypes.single,
                label: 'Single'
              }, {
                value: SmoSystemGroup.connectorTypes.double,
                label: 'Double'
              }]
          }],
        staticText: [
          { includeStaff: 'Include Staff' }
        ]
      };
  static createAndDisplay(parameters: SuiDialogParams) {
    const dg = new SuiStaffGroupDialog(parameters);
    dg.display();
  }
  getModifier() {
    return this.adapter.staffGroups;
  }
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiStaffGroupDialogAdapter(parameters.view);
    super(SuiStaffGroupDialog.dialogElements, { adapter, ...parameters });
  }
}
