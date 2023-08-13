// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SmoStaffHairpin, } from '../../smo/data/staffModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SvgBox } from '../../smo/data/common';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { PromiseHelpers } from '../../common/promiseHelpers';

declare var $: any;

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
    this.backup.attrs.id = hairpin.attrs.id;
    this.backup.associatedStaff = hairpin.associatedStaff;
  }
  async cancel() {
    if (this.changed) {
      await this.view.addOrUpdateStaffModifier(this.hairpin, this.backup);
    }
  }
  async remove() {
    await this.view.removeStaffModifier(this.hairpin);
  }
  async commit() {
    return PromiseHelpers.emptyPromise();
  }
  async updateValue(param: SmoHairpinNumberParams, val: number) {
    const current = new SmoStaffHairpin(this.hairpin);
    this.hairpin[param] = val;
    await this.view.addOrUpdateStaffModifier(current, this.hairpin);
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
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiHairpinAdapter(parameters.view, parameters.modifier);
    super(SuiHairpinAttributesDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
  }
}