// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { DialogDefinition,SuiDialogParams } from './dialog';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SvgBox } from '../../smo/data/common';
import { SmoVolta } from '../../smo/data/measureModifiers';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';

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