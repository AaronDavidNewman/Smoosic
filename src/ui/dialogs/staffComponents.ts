// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiTextInputComposite, SuiToggleComposite, SuiComponentBase, SuiDropdownComposite, SuiToggleComponent, 
  SuiDialogNotifier, DialogDefinitionElement, SuiComponentParent, SuiToggleCompositeParams, SuiDropdownCompositeParams } from '../dialogComponents';
import { htmlHelpers } from '../../common/htmlHelpers';
import { SmoSelection } from '../../smo/xform/selections';
import { SmoTie, TieLine } from '../../smo/data/staffModifiers';
import { SmoNote } from '../../smo/data/note';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SmoSystemGroup } from '../../smo/data/scoreModifiers';
declare var $: any;

export interface CheckboxDropdownComponentParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string,
  toggleElement: DialogDefinitionElement,
  dropdownElement: DialogDefinitionElement
}

// ## CheckboxDropdownComponent
// A checkbox that enables a dropdown component, for optional or dependent parameter
export class CheckboxDropdownComponent extends SuiComponentParent {
  // { dropdownElement: {...}, toggleElement: }
  toggleCtrl: SuiToggleComposite;
  dropdownCtrl: SuiDropdownComposite;
  constructor(dialog: SuiDialogNotifier, parameter: CheckboxDropdownComponentParams) {
    super(dialog, parameter);
    const toggleParams: SuiToggleCompositeParams = {
      id: this.id + parameter.toggleElement.smoName,
      classes: '',
      parentControl: this,
      ...parameter.toggleElement
    }
    const dropdownParams: SuiDropdownCompositeParams = {
      id: this.id + parameter.dropdownElement.smoName,
      classes: '',
      defaultValue: '',
      parentControl: this,
      ...parameter.dropdownElement
    }
    this.toggleCtrl = new SuiToggleComposite(this.dialog, toggleParams);
    this.dropdownCtrl = new SuiDropdownComposite(this.dialog, dropdownParams);
  }
  get html() {
    const b = htmlHelpers.buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl checkboxDropdown'))
      .attr('id', this.parameterId);
    q.append(this.toggleCtrl.html);
    q.append(this.dropdownCtrl.html);
    return q;
  }

  bind() {
    this.toggleCtrl.bind();
    this.dropdownCtrl.bind();
  }
  changed() {
    if (this.toggleCtrl.getValue()) {
      $('#' + this.parameterId).addClass('checked');
    } else {
      $('#' + this.parameterId).removeClass('checked');
    }
    this.handleChanged();
  }
}

export interface PitchTieControlRow {
  leftControl: SuiDropdownComposite,
  rightControl: SuiDropdownComposite
}
export interface TieMappingComponentParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string,
  toggleElement: DialogDefinitionElement,
  dropdownElement: DialogDefinitionElement
}
// ## TieMappingComponent
// Represent the pitches in 2 notes that can be individually tied together
export class TieMappingComponent extends SuiComponentParent {
  // { dropdownElement: {...}, toggleElement: }
  startSelection: SmoSelection | null;
  endSelection: SmoSelection | null;
  modifier: SmoTie;
  controlRows: PitchTieControlRow[] = [];
  constructor(dialog: SuiDialogNotifier, parameter: TieMappingComponentParams) {
    super(dialog, parameter);
    let i = 0;
    const modifier = this.dialog.getModifier();
    if (modifier && SmoTie.isTie(modifier)) {
      this.modifier = modifier;
    } else { // should not happen
      this.modifier = new SmoTie(SmoTie.defaults);
    }
    this.startSelection = SmoSelection.noteFromSelector(
      this.dialog.getView().score, this.modifier.startSelector);
    this.endSelection = SmoSelection.noteFromSelector(
      this.dialog.getView().score, this.modifier.endSelector);
    if (this.startSelection === null || this.startSelection.note === null ||
      this.endSelection === null || this.endSelection.note === null) {
      return;
    }
    const pitchCount = Math.max(this.startSelection.note.pitches.length, this.endSelection.note.pitches.length);

    this.controlRows = [];
    for (i = 0; i < pitchCount; ++i) {
      const smoName = 'Line-' + (i + 1);
      const defaultValue = -1;
      const leftParams: SuiDropdownCompositeParams = {
        id: this.id + smoName + '-left',
        smoName: smoName + '-left',
        classes: 'leftControl',
        defaultValue,
        control: 'SuiDropdownComposite',
        label: dialog.getStaticText()['fromNote'],
        options: this._generateOptions(this.startSelection.note),
        parentControl: this
      }
      const leftControl = new SuiDropdownComposite(this.dialog, leftParams);
      const rightParams: SuiDropdownCompositeParams = {
        id: this.id + smoName + '-right',
        smoName: smoName + '-right',
        classes: 'rightControl',
        control: 'SuiDropdownComposite',
        label: dialog.getStaticText()['toNote'],
        defaultValue,
        options: this._generateOptions(this.endSelection.note),
        parentControl: this

      }
      const rightControl = new SuiDropdownComposite(this.dialog, rightParams);
      this.controlRows.push({ leftControl, rightControl });
    }
  }
  bind() {
    this.controlRows.forEach((row) => {
      row.rightControl.bind();
      row.leftControl.bind();
    });
  }

  _generateOptions(note: SmoNote) {
    const options = [];
    let index = 0;
    let label = '';
    options.push({ value: -1, label: 'No Line' });
    note.pitches.forEach((pitch) => {
      const value = index;
      label = pitch.letter.toUpperCase();
      if (pitch.accidental !== 'n') {
        label += pitch.accidental;
      }
      label += pitch.octave;
      options.push({ value, label });
      index += 1;
    });
    return options;
  }
  getValue() {
    const lines: TieLine[] = [];
    this.controlRows.forEach((row) => {
      const left: number = parseInt(row.leftControl.getValue().toString(), 10);
      const right: number = parseInt(row.rightControl.getValue().toString(), 10);
      if (left >= 0 && right >= 0) {
        lines.push({ from: left, to: right });
      }
    });
    return lines;
  }
  setValue(modifier: TieLine[]) {
    let i = 0;
    for (i = 0; i < this.controlRows.length; ++i) {
      const row = this.controlRows[i];
      if (modifier.length > i) {
        row.leftControl.setValue(modifier[i].from);
        row.rightControl.setValue(modifier[i].to);
      }
    }
  }
  changed() {
    this.handleChanged();
  }
  get html() {
    const b = htmlHelpers.buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl dropdownPair'))
      .attr('id', this.parameterId);
    this.controlRows.forEach((row) => {
      q.append(row.leftControl.html).append(row.rightControl.html);
    });
    return q;
  }
}
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
  modifier: SmoSystemGroup;
  constructor(dialog: SuiDialogNotifier, parameter: StaffAddRemoveComponentParams) {
    super(dialog, parameter);
    this.view = this.dialog.getView();
    this.staticText = dialog.getStaticText();
    this.label = this.staticText['includeStaff'];
    const mod = this.dialog.getModifier();
    if (mod && SmoSystemGroup.isSystemGroup(mod)) {
      this.modifier = mod;
    } else {
      this.modifier = new SmoSystemGroup(SmoSystemGroup.defaults);
    }
  }
  setControlRows() {
    let i = this.modifier.startSelector.staff;
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
      if (staff.staffId === this.modifier.endSelector.staff + 1) {

        const rowElement = new SuiToggleComposite(this.dialog, elementParams);
        rowElement.parentControl = this;
        this.staffRows.push({
          showCtrl: rowElement
        });
      } else if (staff.staffId > this.modifier.startSelector.staff &&
        staff.staffId === this.modifier.endSelector.staff) {
        elementParams.classes = 'toggle-remove-row';
        // toggle remove of ultimate row, other than first row
        const rowElement = new SuiToggleComposite(this.dialog, elementParams);
        this.staffRows.push({
          showCtrl: rowElement
        });
      } else if ((staff.staffId <= this.modifier.endSelector.staff) &&
        (staff.staffId >= this.modifier.startSelector.staff)) {
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
    const b = htmlHelpers.buildDom;
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
    let nextStaff = this.modifier.startSelector.staff;
    const maxMeasure = this.modifier.endSelector.measure;
    this.modifier.endSelector = JSON.parse(JSON.stringify(this.modifier.startSelector));
    this.staffRows.forEach((staffRow) => {
      if (staffRow.showCtrl.getValue()) {
        this.modifier.endSelector = { staff: nextStaff, measure: maxMeasure, voice: 0, tick: 0, pitches: [] };
        nextStaff += 1;
      }
    });
    return this.modifier;
  }
  setValue(staffGroup: SmoSystemGroup) {
    this.modifier = staffGroup; // would this be used?
    this.updateGroupMembership();
  }
  changed() {
    this.getValue(); // update modifier
    this.handleChanged();
    this.updateGroupMembership();
  }
  bind() {
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
    this.view.storeScore.staves.forEach((staff) => {
      const name = 'View Staff ' + (staff.staffId + 1);
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
    const b = htmlHelpers.buildDom;
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
export interface TextCheckComponentParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string
}
export interface TextCheckComponentParamsValue {
  checked: boolean,
  text: string
}
export class TextCheckComponent extends SuiComponentBase {
  view: SuiScoreViewOperations;
  staticText: Record<string, string>;
  toggleCtrl: SuiToggleComposite;
  textCtrl: SuiTextInputComposite;
  defaultValue: string;
  constructor(dialog: SuiDialogNotifier, parameter: TextCheckComponentParams) {
    super(dialog, parameter);
    this.dialog = dialog;
    this.view = this.dialog.getView();
    this.defaultValue = '';
    const toggleName = this.smoName + 'Toggle';
    const textName = this.smoName + 'Text';
    this.staticText = this.dialog.getStaticText();
    const label = this.staticText[textName];
    const show = this.staticText.show;
    this.toggleCtrl = new SuiToggleComposite(this.dialog, {
      smoName: toggleName,
      control: 'SuiToggleComposite',
      label: show,
      parentControl: this,
      classes: '',
      id: toggleName
    });
    this.textCtrl = new SuiTextInputComposite(this.dialog, {
      smoName: textName,
      defaultValue: this.defaultValue,
      control: 'SuiTextInputComposite',
      label,
      parentControl: this,
      classes: '',
      id: toggleName
    });
  }
  get html() {
    const b = htmlHelpers.buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl textCheckContainer'))
      .attr('id', this.parameterId);
    q.append(this.textCtrl.html);
    q.append(this.toggleCtrl.html);
    return q;
  }
  getInputElement() {
    var pid = this.parameterId;
    return $('#' + pid);
  }
  getValue(): TextCheckComponentParamsValue {
    return {
      checked: this.toggleCtrl.getValue(),
      text: this.textCtrl.getValue()
    };
  }
  setValue(val: TextCheckComponentParamsValue) {
    this.toggleCtrl.setValue(val.checked);
    this.textCtrl.setValue(val.text);
  }
  changed() {
    this.handleChanged();
  }
  bind() {
    this.toggleCtrl.bind();
    this.textCtrl.bind();
  }
}
