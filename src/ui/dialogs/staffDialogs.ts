// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';
import { SmoSlur, SmoStaffHairpin, SmoTie, TieLine } from '../../smo/data/staffModifiers';
import { SmoSystemGroup } from '../../smo/data/scoreModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SvgBox } from '../../smo/data/common';
import { StaffAddRemoveComponent } from './staffComponents';
import { SmoVolta } from '../../smo/data/measureModifiers';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';

declare var $: any;

// ## SuiStaffModifierDialog
// Edit the attributes of a staff modifier (connects notes in the same staff)

export type SlurNumber = 'spacing' | 'thickness' | 'xOffset' | 'yOffset' | 'position' | 'position_end' | 'cp1x'
  | 'cp1y' | 'cp2x' | 'cp2y';
export type SlurBool = 'invert';
export class SuiSlurAdapter extends SuiComponentAdapter {
  slur: SmoSlur;
  backup: SmoSlur;
  changed: boolean = false;
  constructor(view: SuiScoreViewOperations, slur: SmoSlur) {
    super(view);
    this.slur = slur;
    this.view = view;
    this.backup = new SmoSlur(this.slur);
  }
  writeSlurNumber(view: SuiScoreViewOperations, slur: SmoSlur, key: SlurNumber, value: number) {
    const current = new SmoSlur(slur);
    slur[key] = value;
    view.addOrUpdateStaffModifier(current, slur);
    this.changed = true;
  }
  writeSlurBool(view: SuiScoreViewOperations, slur: SmoSlur, key: SlurBool, value: boolean) {
    const current = new SmoSlur(slur);
    slur[key] = value;
    view.addOrUpdateStaffModifier(current, slur);
    this.changed = true;
  }
  cancel() {
    if (!this.changed) {
      return;
    }
    this.view.addOrUpdateStaffModifier(this.slur, this.backup);
  }
  commit() {

  }
  get cp2y(): number {
    return this.slur.cp2y;
  }
  set cp2y(value: number) {
    this.writeSlurNumber(this.view, this.slur, 'cp2y', value);
  }  
  get cp2x(): number {
    return this.slur.cp2x;
  }
  set cp2x(value: number) {
    this.writeSlurNumber(this.view, this.slur, 'cp2x', value);
  }  
  get cp1y(): number {
    return this.slur.cp1y;
  }
  set cp1y(value: number) {
    this.writeSlurNumber(this.view, this.slur, 'cp1y', value);
  }  
  get cp1x(): number {
    return this.slur.cp1x;
  }
  set cp1x(value: number) {
    this.writeSlurNumber(this.view, this.slur, 'cp1x', value);
  }  
  get invert(): boolean {
    return this.slur.invert;
  }
  set invert(value: boolean) {
    this.writeSlurBool(this.view, this.slur, 'invert', value);
  }
  get position_end(): number {
    return this.slur.position_end;
  }
  set position_end(value: number) {
    this.writeSlurNumber(this.view, this.slur, 'position_end', value);
  }
  get position(): number {
    return this.slur.position;
  }
  set position(value: number) {
    this.writeSlurNumber(this.view, this.slur, 'position', value);
  }
  get yOffset(): number {
    return this.slur.yOffset;
  }
  set yOffset(value: number) {
    this.writeSlurNumber(this.view, this.slur, 'yOffset', value);
  }
  get xOffset(): number {
    return this.slur.xOffset;
  }
  set xOffset(value: number) {
    this.writeSlurNumber(this.view, this.slur, 'xOffset', value);
  }
  get thickness(): number {
    return this.slur.thickness;
  }
  set thickness(value: number) {
    this.writeSlurNumber(this.view, this.slur, 'thickness', value);
  }
  get spacing(): number {
    return this.slur.spacing;
  }
  set spacing(value: number) {
    this.writeSlurNumber(this.view, this.slur, 'spacing', value);
  }
  get renderedBox(): SvgBox {
    return this.backup.renderedBox!;
  }
  remove() {
    this.view.removeStaffModifier(this.backup);
  }
}
export class SuiSlurAttributesDialog extends SuiDialogAdapterBase<SuiSlurAdapter> {
  static dialogElements: DialogDefinition = {      
        label: 'Slur Properties', elements: [{
          smoName: 'spacing',
          defaultValue: 2,
          control: 'SuiRockerComponent',
          label: 'Spacing'
        }, {
          smoName: 'thickness',
          defaultValue: 2,
          control: 'SuiRockerComponent',
          label: 'Thickness'
        }, {
          smoName: 'xOffset',
          defaultValue: 0,
          control: 'SuiRockerComponent',
          label: 'X Offset'
        }, {
          smoName: 'yOffset',
          defaultValue: 10,
          control: 'SuiRockerComponent',
          label: 'Y Offset'
        }, {
          smoName: 'position',
          defaultValue: SmoSlur.positions.HEAD,
          options: [{
            value: SmoSlur.positions.HEAD,
            label: 'Head'
          }, {
            value: SmoSlur.positions.TOP,
            label: 'Top'
          }],
          control: 'SuiDropdownComponent',
          label: 'Start Position'
        }, {
          smoName: 'position_end',
          defaultValue: SmoSlur.positions.HEAD,
          options: [{
            value: SmoSlur.positions.HEAD,
            label: 'Head'
          }, {
            value: SmoSlur.positions.TOP,
            label: 'Top'
          }],
          control: 'SuiDropdownComponent',
          label: 'End Position'
        }, {
          smoName: 'invert',
          control: 'SuiToggleComponent',
          label: 'Invert'
        }, {
          smoName: 'cp1x',
          defaultValue: 0,
          control: 'SuiRockerComponent',
          label: 'Control Point 1 X'
        }, {
          smoName: 'cp1y',
          defaultValue: 40,
          control: 'SuiRockerComponent',
          label: 'Control Point 1 Y'
        }, {
          smoName: 'cp2x',
          defaultValue: 0,
          control: 'SuiRockerComponent',
          label: 'Control Point 2 X'
        }, {
          smoName: 'cp2y',
          defaultValue: 40,
          control: 'SuiRockerComponent',
          label: 'Control Point 2 Y'
        }], staticText: []
      };
  static createAndDisplay(parameters: SuiDialogParams) {
    if (!parameters.modifier.renderedBox) {
      return null;
    }
    var dg = new SuiSlurAttributesDialog(parameters);
    dg.display();
    return dg;
  }
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiSlurAdapter(parameters.view, parameters.modifier);
    super(SuiSlurAttributesDialog.dialogElements, { adapter, ...parameters });
  }
}

export type TieNumber = 'tie_spacing' | 'cp1' | 'cp2' | 'first_x_shift' | 'last_x_shift' | 'y_shift';

export class SuiTieAdapter extends SuiComponentAdapter {
  tie: SmoTie;
  backup: SmoTie;
  changed: boolean = false;
  constructor(view: SuiScoreViewOperations, tie: SmoTie) {
    super(view);
    this.tie = tie;
    this.backup = new SmoTie(tie);
  }
  writeTieNumber(value: number, param: TieNumber) {
    this.tie[param] = value;
    this.view.addOrUpdateStaffModifier(this.backup, this.tie);
    this.changed = true;
  }
  get lines(): TieLine[] {
    return this.tie.lines;
  }
  set lines(value: TieLine[]) {
    this.tie.lines = JSON.parse(JSON.stringify(value));
    this.view.addOrUpdateStaffModifier(this.backup, this.tie);
  }
  get tie_spacing(): number {
    return this.tie.tie_spacing;
  }
  set tie_spacing(value: number) {
    this.writeTieNumber(value, 'tie_spacing');
  }  
  get first_x_shift(): number {
    return this.tie.first_x_shift;
  }
  set first_x_shift(value: number) {
    this.writeTieNumber(value, 'first_x_shift');
  }  
  get last_x_shift(): number {
    return this.tie.last_x_shift;
  }
  set last_x_shift(value: number) {
    this.writeTieNumber(value, 'last_x_shift');
  }  
  get y_shift(): number {
    return this.tie.y_shift;
  }
  set y_shift(value: number) {
    this.writeTieNumber(value, 'y_shift');
  }  
  get cp1(): number {
    return this.tie.cp1;
  }
  set cp1(value: number) {
    this.writeTieNumber(value, 'cp1');
  }
  get cp2(): number {
    return this.tie.cp2;
  }
  set cp2(value: number) {
    this.writeTieNumber(value, 'cp2');
  }
  commit() {

  }
  cancel() {
    if (this.changed) {
      this.view.addOrUpdateStaffModifier(this.backup, this.backup);
    }
  }
  remove() {
    this.view.removeStaffModifier(this.backup);
  }
}
export class SuiTieAttributesDialog extends SuiDialogAdapterBase<SuiTieAdapter> {
  static dialogElements: DialogDefinition =
      {
        label: 'Tie Properties',

        staticText: [
          { label: 'Tie Properties' },
          { fromNote: 'From Note' },
          { toNote: 'To Note' }
        ], elements: [{
          smoName: 'lines',
          control: 'TieMappingComponent',
          label: 'Lines'
        }, {
          smoName: 'cp1',
          control: 'SuiRockerComponent',
          label: 'Control Point 1'
        }, {
          smoName: 'cp2',
          control: 'SuiRockerComponent',
          label: 'Control Point 2'
        }, {
          smoName: 'first_x_shift',
          control: 'SuiRockerComponent',
          label: 'X Offset 1'
        }, {
          smoName: 'last_x_shift',
          control: 'SuiRockerComponent',
          label: 'X Offset 2'
        }, {
          smoName: 'y_shift',
          defaultValue: 0,
          control: 'SuiRockerComponent',
          label: 'Y Offset'
        }, {
          smoName: 'tie_spacing',
          defaultValue: 40,
          control: 'SuiRockerComponent',
          label: 'Tie Spacing'
        }],
      };
  static createAndDisplay(parameters: SuiDialogParams) {
    var dg = new SuiTieAttributesDialog(parameters);
    dg.display();
    return dg;
  }
  constructor(parameters: SuiDialogParams) {
    if (!parameters.modifier) {
      throw new Error('modifier attribute dialog must have modifier');
    }
    const tie = parameters.modifier as SmoTie;
    const adapter = new SuiTieAdapter(parameters.view, tie);
    super(SuiTieAttributesDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
  }
}

export type SmoVoltaNumberParam = 'startBar' | 'endBar' | 'xOffsetStart' | 'xOffsetEnd' | 'yOffset' | 'number';

export class SuiVoltaAdapter extends SuiComponentAdapter {
  volta: SmoVolta;
  backup: SmoVolta;
  changed: boolean = false;
  constructor(view: SuiScoreViewOperations, volta: SmoVolta) {
    super(view);
    this.volta = volta;
    this.backup = new SmoVolta(this.volta);    
  }
  remove() {
    this.view.removeEnding(this.volta);
  }
  cancel() {
    if (this.changed) {
      this.view.updateEnding(this.backup);
    }
  }
  commit() {

  }
  updateVolta(param: SmoVoltaNumberParam, value: number) {
    this.volta[param] = value;
    this.view.updateEnding(this.volta);
    this.changed = true;
  }
  get startBar() {
    return this.volta.startBar;
  }
  set startBar(val: number) {
    this.updateVolta('startBar', val);
  }
  get endBar() {
    return this.volta.endBar;
  }
  set endBar(val: number) {
    this.updateVolta('endBar', val);
  }
  get xOffsetStart() {
    return this.volta.xOffsetStart;
  }
  set xOffsetStart(val: number) {
    this.updateVolta('xOffsetStart', val);
  }
  get xOffsetEnd() {
    return this.volta.xOffsetEnd;
  }
  set xOffsetEnd(val: number) {
    this.updateVolta('xOffsetEnd', val);
  }
  get yOffset() {
    return this.volta.yOffset;
  }
  set yOffset(val: number) {
    this.updateVolta('yOffset', val);
  }
  get number() {
    return this.volta.number;
  }
  set number(val: number) {
    this.updateVolta('number', val);
  }
  get renderedBox(): SvgBox {
    return this.backup.renderedBox!;
  }
}     
// ## SuiVoltaAttributeDialog
// aka first and second endings
export class SuiVoltaAttributeDialog extends SuiDialogAdapterBase<SuiVoltaAdapter> {

  static dialogElements: DialogDefinition =
      {
        label: 'Volta Properties', elements:
          [{
            smoName: 'number',
            defaultValue: 1,
            control: 'SuiRockerComponent',
            label: 'number'
          }, {
            smoName: 'xOffsetStart',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'X1 Offset'
          }, {
            smoName: 'xOffsetEnd',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'X2 Offset'
          }, {
            smoName: 'yOffset',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'Y Offset'
          }],
          staticText: []
      };
  static createAndDisplay(parameters: SuiDialogParams) {
    if (parameters.modifier.renderedBox === null) {
      return null;
    }
    const dg = new SuiVoltaAttributeDialog(parameters);
    dg.display();
    return dg;
  }
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiVoltaAdapter(parameters.view, parameters.modifier)
    super(SuiVoltaAttributeDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
    const volta = parameters.modifier;
    this.modifier = new SuiVoltaAdapter(this.view, volta);
  }
}

export type SmoHairpinNumberParams = 'xOffsetLeft' | 'xOffsetRight' | 'yOffset' | 'height' | 'position';
export class SuiHairpinAdapter extends SuiComponentAdapter {
  backup: SmoStaffHairpin;
  hairpin: SmoStaffHairpin;
  changed: boolean = false;
  constructor(view: SuiScoreViewOperations, hairpin: SmoStaffHairpin) {
    super(view);
    this.hairpin = hairpin;
    this.view = view;
    this.backup = new SmoStaffHairpin(this.hairpin);
  }
  cancel() {
    if (this.changed) {
      this.view.addOrUpdateStaffModifier(this.hairpin, this.backup);
    }
  }
  remove() {
    this.view.removeStaffModifier(this.hairpin);
  }
  commit() {
  }
  updateValue(param: SmoHairpinNumberParams, val: number) {
    const current = new SmoStaffHairpin(this.hairpin);
    this.hairpin[param] = val;
    this.view.addOrUpdateStaffModifier(current, this.hairpin);
    this.changed = true;
  }
  get xOffsetLeft() {
    return this.hairpin.xOffsetLeft;
  }
  set xOffsetLeft(val: number) {
    this.updateValue('xOffsetLeft', val);
  }
  get xOffsetRight() {
    return this.hairpin.xOffsetRight;
  }
  set xOffsetRight(val: number) {
    this.updateValue('xOffsetRight', val);
  }
  get yOffset() {
    return this.hairpin.yOffset;
  }
  set yOffset(val: number) {
    this.updateValue('yOffset', val);
  }
  get height() {
    return this.hairpin.height;
  }
  set height(val: number) {
    this.updateValue('height', val);
  }
  get position() {
    return this.hairpin.position;
  }
  set position(val: number) {
    this.updateValue('position', val);
  }
  get renderedBox(): SvgBox {
    return this.hairpin.renderedBox!;
  }
}
export class SuiHairpinAttributesDialog extends SuiDialogAdapterBase<SuiHairpinAdapter> {
  static dialogElements: DialogDefinition =
      {
        label: 'Hairpin Properties', elements:
          [{
            smoName: 'height',
            defaultValue: 10,
            control: 'SuiRockerComponent',
            label: 'Height'
          }, {
            smoName: 'yOffset',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'Y Shift'
          }, {
            smoName: 'xOffsetRight',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'Right Shift'
          }, {
            smoName: 'xOffsetLeft',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'Left Shift'
          }],
          staticText: []
      };
  static createAndDisplay(parameters: SuiDialogParams) {
    if (!parameters.modifier.renderedBox) {
      return null;
    }
    var dg = new SuiHairpinAttributesDialog(parameters);
    dg.display();
    return dg;
  }
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiHairpinAdapter(parameters.view, parameters.modifier);
    super(SuiHairpinAttributesDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
  }
}
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
