// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SmoSlur } from '../../smo/data/staffModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SvgBox } from '../../smo/data/common';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';

declare var $: any;

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
constructor(parameters: SuiDialogParams) {
  const adapter = new SuiSlurAdapter(parameters.view, parameters.modifier);
  super(SuiSlurAttributesDialog.dialogElements, { adapter, ...parameters });
  this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
}
}