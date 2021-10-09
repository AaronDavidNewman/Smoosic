// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';
import { SmoSlur, SmoStaffHairpin, SmoTie } from '../../smo/data/staffModifiers';
import { SmoSystemGroup } from '../../smo/data/scoreModifiers';
import { TieMappingComponent } from './staffComponents';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SvgBox } from '../../smo/data/common';
import { SmoVolta } from '../../smo/data/measureModifiers';

declare var $: any;

// ## SuiStaffModifierDialog
// Edit the attributes of a staff modifier (connects notes in the same staff)

export type SlurNumber = 'spacing' | 'thickness' | 'xOffset' | 'yOffset' | 'position' | 'position_end' | 'cp1x'
  | 'cp1y' | 'cp2x' | 'cp2y';
export function writeSlurNumber(view: SuiScoreViewOperations, slur: SmoSlur, key: SlurNumber, value: number) {
  const current = new SmoSlur(slur);
  slur[key] = value;
  view.addOrUpdateStaffModifier(current, slur);
}
export type SlurBool = 'invert';
export function writeSlurBool(view: SuiScoreViewOperations, slur: SmoSlur, key: SlurBool, value: boolean) {
  const current = new SmoSlur(slur);
  slur[key] = value;
  view.addOrUpdateStaffModifier(current, slur);
}
export class SuiSlurAdapter {
  slur: SmoSlur;
  backup: SmoSlur;
  view: SuiScoreViewOperations;
  changed: boolean = false;
  constructor(view: SuiScoreViewOperations, slur: SmoSlur) {
    this.slur = slur;
    this.view = view;
    this.backup = new SmoSlur(this.slur);
  }
  cancel() {
    if (!this.changed) {
      return;
    }
    this.view.addOrUpdateStaffModifier(this.slur, this.backup);
  }
  get cp2y(): number {
    return this.slur.cp2y;
  }
  set cp2y(value: number) {
    writeSlurNumber(this.view, this.slur, 'cp2y', value);
  }  
  get cp2x(): number {
    return this.slur.cp2x;
  }
  set cp2x(value: number) {
    writeSlurNumber(this.view, this.slur, 'cp2x', value);
  }  
  get cp1y(): number {
    return this.slur.cp1y;
  }
  set cp1y(value: number) {
    writeSlurNumber(this.view, this.slur, 'cp1y', value);
  }  
  get cp1x(): number {
    return this.slur.cp1x;
  }
  set cp1x(value: number) {
    writeSlurNumber(this.view, this.slur, 'cp1x', value);
  }  
  get invert(): boolean {
    return this.slur.invert;
  }
  set invert(value: boolean) {
    writeSlurBool(this.view, this.slur, 'invert', value);
  }
  get position_end(): number {
    return this.slur.position_end;
  }
  set position_end(value: number) {
    writeSlurNumber(this.view, this.slur, 'position_end', value);
  }
  get position(): number {
    return this.slur.position;
  }
  set position(value: number) {
    writeSlurNumber(this.view, this.slur, 'position', value);
  }
  get yOffset(): number {
    return this.slur.yOffset;
  }
  set yOffset(value: number) {
    writeSlurNumber(this.view, this.slur, 'yOffset', value);
  }
  get xOffset(): number {
    return this.slur.xOffset;
  }
  set xOffset(value: number) {
    writeSlurNumber(this.view, this.slur, 'xOffset', value);
  }
  get thickness(): number {
    return this.slur.thickness;
  }
  set thickness(value: number) {
    writeSlurNumber(this.view, this.slur, 'thickness', value);
  }
  get spacing(): number {
    return this.slur.spacing;
  }
  set spacing(value: number) {
    writeSlurNumber(this.view, this.slur, 'spacing', value);
  }
  get renderedBox(): SvgBox {
    return this.backup.renderedBox!;
  }
  remove() {
    this.view.removeStaffModifier(this.backup);
  }
}
export class SuiSlurAttributesDialog extends SuiDialogBase {
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
  modifier: SuiSlurAdapter;
  constructor(parameters: SuiDialogParams) {
    parameters.modifier = new SuiSlurAdapter(parameters.view, parameters.modifier);
    super(SuiSlurAttributesDialog.dialogElements, { autobind: true, ...parameters });
    this.modifier = parameters.modifier;
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
  }
    // ### bindElements
  // bing the generic controls in most dialogs.
  bindElements() {
    var dgDom = this.dgDom;

    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.modifier.cancel();
      this.complete();
    });
    $(dgDom.element).find('.remove-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.complete();
    });
  }
}

export class SuiTieAttributesDialog extends SuiDialogBase {
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
        }],
      };
  static createAndDisplay(parameters: SuiDialogParams) {
    var dg = new SuiTieAttributesDialog(parameters);
    dg.display();
    return dg;
  }
  modifier: SmoTie;
  backup: SmoTie;
  edited: boolean;
  constructor(parameters: SuiDialogParams) {
    if (!parameters.modifier) {
      throw new Error('modifier attribute dialog must have modifier');
    }
    super(SuiTieAttributesDialog.dialogElements, parameters);
    this.modifier = parameters.modifier;
    this.backup = new SmoTie(this.modifier);
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
    this.edited = false;
  }
  get linesCtrl() {
    return this.cmap.linesCtrl as TieMappingComponent;
  }
  initialValue() {
    this.linesCtrl.setValue(this.modifier);
  }
  changed() {
    if (this.linesCtrl.changeFlag) {
      const current = new SmoTie(this.modifier);
      this.modifier.lines = JSON.parse(JSON.stringify(this.linesCtrl.getValue()));
      this.view.addOrUpdateStaffModifier(current, this.modifier);
      this.edited = true;
    }
  }
    // ### bindElements
  // bing the generic controls in most dialogs.
  bindElements() {
    var dgDom = this.dgDom;

    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      if (this.edited) {
        this.view.undo();
      }
      this.complete();
    });
    $(dgDom.element).find('.remove-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.view.removeStaffModifier(this.backup);
      this.complete();
    });
  }
}

export type SmoVoltaNumberParam = 'startBar' | 'endBar' | 'xOffsetStart' | 'xOffsetEnd' | 'yOffset' | 'number' ; 
export class SuiVoltaAdapter {
  volta: SmoVolta;
  backup: SmoVolta;
  view: SuiScoreViewOperations;
  changed: boolean = false;
  constructor(view: SuiScoreViewOperations, volta: SmoVolta) {
    this.volta = volta;
    this.view = view;
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
  /*       startBar: 1,
      endBar: 1,
      xOffsetStart: 0,
      xOffsetEnd: 0,
      yOffset: 20,
      number: 1
      */
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
export class SuiVoltaAttributeDialog extends SuiDialogBase {

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
    if (!parameters.modifier) {
      throw new Error('modifier attribute dialog must have modifier');
    }
    super(SuiVoltaAttributeDialog.dialogElements, parameters);
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
    const volta = parameters.modifier;
    this.modifier = new SuiVoltaAdapter(this.view, volta);
  }
  handleRemove() {
    this.view.removeEnding(this.modifier);
  }

  // ### bindElements
  // bing the generic controls in most dialogs.
  bindElements() {
    var dgDom = this.dgDom;

    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.modifier.cancel();
      this.complete();
    });
    $(dgDom.element).find('.remove-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.modifier.remove();
      this.complete();
    });
  }
}

export type SmoHairpinNumberParams = 'xOffsetLeft' | 'xOffsetRight' | 'yOffset' | 'height' | 'position';
export class SuiHairpinAdapter {
  backup: SmoStaffHairpin;
  hairpin: SmoStaffHairpin;
  view: SuiScoreViewOperations;
  changed: boolean = false;
  constructor(view: SuiScoreViewOperations, hairpin: SmoStaffHairpin) {
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
export class SuiHairpinAttributesDialog extends SuiDialogBase {
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
  modifier: SuiHairpinAdapter;
  constructor(parameters: SuiDialogParams) {
    super(SuiHairpinAttributesDialog.dialogElements, parameters);
    this.modifier = new SuiHairpinAdapter(this.view, parameters.modifier);
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
  }
  bindElements() {
    var dgDom = this.dgDom;

    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.modifier.cancel();
      this.complete();
    });
    $(dgDom.element).find('.remove-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.modifier.remove();
      this.complete();
    });
  }
}
export class SuiStaffGroupDialogAdapter {
  /*       leftConnector: SmoSystemGroup.connectorTypes.single,
      rightConnector: SmoSystemGroup.connectorTypes.single,
      mapType: SmoSystemGroup.mapTypes.allMeasures,
      text: '',
      shortText: '',
      justify: true, */
  staffGroup: SmoSystemGroup;
  view: SuiScoreViewOperations;
  constructor(view: SuiScoreViewOperations) {
    this.view = view;
    const selection = this.view.tracker.selections[0];
    // Reset the view so we can see all the staves
    this.view.viewAll();
    const staffGroup = this.view.score.getSystemGroupForStaff(selection);
    this.staffGroup = staffGroup ?? new SmoSystemGroup(SmoSystemGroup.defaults);
  }
  get leftConnector() {
    return this.staffGroup.leftConnector;
  }
  set leftConnector(val: number) {
    this.staffGroup.leftConnector = val;
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
export class SuiStaffGroupDialog extends SuiDialogBase {
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
  modifier: SuiStaffGroupDialogAdapter;
  constructor(parameters: SuiDialogParams) {
    super(SuiStaffGroupDialog.dialogElements, parameters);
    this.modifier = new SuiStaffGroupDialogAdapter(this.view);
  }
  bindElements() {
    const dgDom = this.dgDom;
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.complete();
    });

    $(dgDom.element).find('.remove-button').remove();
  }
  // TODO: this behavior should be in the dialog component
  /* _updateGroupMembership() {
    const updateEl = this.staffGroupsCtrl.getInputElement();
    this.staffGroupsCtrl.setControlRows();
    $(updateEl).html('');
    $(updateEl).append(this.staffGroupsCtrl.html.dom());
    this.staffGroupsCtrl.bind();
    $(this.staffGroupsCtrl.getInputElement()).find('input').prop('disabled', false);
    $(this.staffGroupsCtrl.getInputElement()).find('.toggle-disabled input').prop('disabled', true);
  } */
}
