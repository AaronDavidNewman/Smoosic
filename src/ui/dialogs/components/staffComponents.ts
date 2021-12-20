// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiComponentBase, SuiDialogNotifier } from './baseComponent';
import { SuiToggleCompositeParams, SuiToggleComposite } from './toggle';

import { buildDom } from '../../../common/htmlHelpers';
import { SuiScoreViewOperations } from '../../../render/sui/scoreViewOperations';
import { SmoSystemGroup } from '../../../smo/data/scoreModifiers';
declare var $: any;
export interface StaffAddControlRow {
  showCtrl: SuiToggleComposite
}
export interface StaffAddRemoveComponentParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string
}
export class StaffAddRemoveComponent extends SuiComponentBase {
  staffRows: StaffAddControlRow[] = [];
  view: SuiScoreViewOperations;
  createdShell: boolean = false;
  staticText: Record<string, string>;
  modifier: SmoSystemGroup | null = null;
  constructor(dialog: SuiDialogNotifier, parameter: StaffAddRemoveComponentParams) {
    super(dialog, parameter);
    this.view = this.dialog.getView();
    this.staticText = dialog.getStaticText();
    this.label = this.staticText['includeStaff'];
  }
  setControlRows() {
    const mod = this.modifier!;
    let i = mod.startSelector.staff;
    this.staffRows = [];
    this.view.storeScore.staves.forEach((staff) => {
      const name = this.label + ' ' + (staff.staffId + 1);
      const id = 'show-' + i;
      const elementParams: SuiToggleCompositeParams = {
        smoName: id,
        classes: 'toggle-add-row',
        control: 'SuiToggleComponent',
        label: name,
        parentControl: this,
        id: id
      }      
      // Toggle add of last row + 1
      if (staff.staffId === mod.endSelector.staff + 1) {

        const rowElement = new SuiToggleComposite(this.dialog, elementParams);
        rowElement.parentControl = this;
        this.staffRows.push({
          showCtrl: rowElement
        });
      } else if (staff.staffId > mod.startSelector.staff &&
        staff.staffId === mod.endSelector.staff) {
        elementParams.classes = 'toggle-remove-row';
        // toggle remove of ultimate row, other than first row
        const rowElement = new SuiToggleComposite(this.dialog, elementParams);
        this.staffRows.push({
          showCtrl: rowElement
        });
      } else if ((staff.staffId <= mod.endSelector.staff) &&
        (staff.staffId >= mod.startSelector.staff)) {
        // toggle remove of ultimate row, other than first row
        elementParams.classes = 'toggle-disabled';
        const rowElement = new SuiToggleComposite(this.dialog,elementParams);
        this.staffRows.push({
          showCtrl: rowElement
        });
      }
      i += 1;
    });
  }
  get html() {
    const b = buildDom;
    // a little hacky.  The first time we create an empty html shell for the control
    // subsequent times, we fill the html with the row information
    if (!this.createdShell) {
      this.createdShell = true;
      const q = b('div').classes(this.makeClasses('multiControl smoControl staffContainer')).attr('id', this.parameterId);
      return q;
    } else {
      const q = b('div').classes(this.makeClasses('smoControl'));
      this.staffRows.forEach((row) => {
        q.append(row.showCtrl.html);
      });
      return q;
    }
  }
  getInputElement() {
    var pid = this.parameterId;
    return $('#' + pid);
  }
  getValue() {
    if (!this.modifier) {
      throw 'No staff groups set for staff group component';
    }
    const mod = this.modifier;
    let nextStaff = mod.startSelector.staff;
    const maxMeasure = mod.endSelector.measure;
    mod.endSelector = JSON.parse(JSON.stringify(mod.startSelector));
    this.staffRows.forEach((staffRow) => {
      if (staffRow.showCtrl.getValue()) {
        mod.endSelector = { staff: nextStaff, measure: maxMeasure, voice: 0, tick: 0, pitches: [] };
        nextStaff += 1;
      }
    });
    return this.modifier;
  }
  setValue(staffGroup: SmoSystemGroup) {
    this.modifier = staffGroup;
    this.updateGroupMembership();
  }
  changed() {
    this.getValue(); // update modifier
    this.handleChanged();
    this.updateGroupMembership();
  }
  bind() {
    if (!this.modifier) {
      return;
    }
    // Can't bind before initial set of modifier
    this.staffRows.forEach((row) => {
      row.showCtrl.bind();
    });
  }
  updateGroupMembership() {
    const updateEl = this.getInputElement();
    this.setControlRows();
    $(updateEl).html('');
    $(updateEl).append(this.html.dom());
    $(updateEl).find('input').prop('disabled', false);
    $(updateEl).find('.toggle-disabled input').prop('checked', true);
    $(updateEl).find('.toggle-remove-row input').prop('checked', true);
    $(updateEl).find('.toggle-add-row input').prop('checked', false);
    $(updateEl).find('.toggle-disabled input').prop('disabled', true);
    this.bind();
  }
}
export interface StaffCheckComponentParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string
}
export interface StaffCheckControlRow {
  showCtrl: SuiToggleComposite
}
export interface StaffCheckValue {
  show: boolean;
}
export class StaffCheckComponent extends SuiComponentBase {
  view: SuiScoreViewOperations;
  staffRows: StaffCheckControlRow[];
  constructor(dialog: SuiDialogNotifier, parameter: StaffCheckComponentParams) {
    super(dialog, parameter);
    this.dialog = dialog;
    this.view = this.dialog.getView();
    this.staffRows = [];
    let previousStaff: string | null = null;
    this.view.storeScore.staves.forEach((staff) => {
      ;
      let name = 'View ' + staff.partInfo.partName;
      if (staff.partInfo.stavesBefore > 0 && previousStaff) {
        name = previousStaff + ' (2)';
      }
      previousStaff = name;
      const id = 'show-' + staff.staffId;
      const toggleParams: SuiToggleCompositeParams = {
        smoName: id,
        classes: 'hide-when-editing',
        control: 'SuiToggleComponent',
        label: name,
        id: id,
        parentControl: this
      }
      const rowElement = new SuiToggleComposite(this.dialog, toggleParams);
      this.staffRows.push({
        showCtrl: rowElement
      });
    });
  }
  get html() {
    const b = buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl staffContainer'));
    this.staffRows.forEach((row) => {
      q.append(row.showCtrl.html);
    });
    return q;
  }
  // Is this used for compound controls?
  _getInputElement() {
    var pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('.staffContainer');
  }
  /* export interface StaffCheckValue {
  show: boolean;
}*/
  getValue(): StaffCheckValue[] {
    const rv = [];
    let i = 0;
    for (i = 0; i < this.staffRows.length; ++i) {
      const show = this.staffRows[i].showCtrl.getValue();
      rv.push({ show });
    }
    return rv;
  }
  setValue(rows: StaffCheckValue[]) {
    let i = 0;
    rows.forEach((row) => {
      this.staffRows[i].showCtrl.setValue(row.show);
      i += 1;
    });
  }
  changed() {
    this.handleChanged();
  }
  bind() {
    this.staffRows.forEach((row) => {
      row.showCtrl.bind();
    });
  }
}

