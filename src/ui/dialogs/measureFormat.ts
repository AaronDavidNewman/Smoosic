// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMeasure } from '../../smo/data/measure';
import { SmoMeasureFormat, SmoMeasureFormatNumberAttributes, SmoMeasueFormatBooleanAttributes } from '../../smo/data/measureModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';

declare var $: any;

export class SuiMeasureFormatAdapter extends SuiComponentAdapter {
  format: SmoMeasureFormat;
  backup: SmoMeasureFormat;
  edited: boolean = false;
  constructor(view: SuiScoreViewOperations, measure: SmoMeasure) {
    super(view);
    this.format = measure.format;
    this.backup = new SmoMeasureFormat(this.format);
  }
  writeNumber(param: SmoMeasureFormatNumberAttributes, value: number) {
    this.format[param] = value;
    this.view.setMeasureFormat(this.format);
    this.edited = true;
  }
  writeBoolean(param: SmoMeasueFormatBooleanAttributes, value: boolean) {
    this.format[param] = value;
    this.view.setMeasureFormat(this.format);
    this.edited = true;
  }
  commit(){}
  cancel() {
    if (this.edited) {
      this.view.setMeasureFormat(this.backup);
    }      
  }
  get padLeft() {
    return this.format.padLeft;
  }
  set padLeft(value: number) {
    if (value >  0) {
      $('.attributeDialog .attributeModal').addClass('pad-left-select');
    } else {
      $('.attributeDialog .attributeModal').removeClass('pad-left-select');
    }
    this.writeNumber('padLeft', value);
  }
  get customStretch() {
    return this.format.customStretch;
  }
  set customStretch(value: number) {
    this.writeNumber('customStretch', value);
  }
  get customProportion() {
    return this.format.customProportion;
  }
  set customProportion(value: number) {
    this.writeNumber('customProportion', value);
  }
  get autoJustify() {
    return this.format.autoJustify;
  }
  set autoJustify(value: boolean) {
    this.writeBoolean('autoJustify', value);
  }
  get padAllInSystem() {
    return this.format.padAllInSystem;
  }
  set padAllInSystem(value: boolean) {
    this.writeBoolean('padAllInSystem', value);
  }
  get systemBreak() {
    return this.format.systemBreak;
  }
  set systemBreak(value: boolean) {
    this.writeBoolean('systemBreak', value);
  }
}
// ## measureDialogs.js
// This file contains dialogs that affect all measures at a certain position,
// such as tempo or time signature.
export class SuiMeasureDialog extends SuiDialogAdapterBase<SuiMeasureFormatAdapter> {
  static dialogElements: DialogDefinition = 
      {
        label: 'Measure Properties',
        elements:
          [{
            smoName: 'padLeft',
            control: 'SuiRockerComponent',
            label: 'Pad Left (px)'
          }, {
            smoName: 'customStretch',
            control: 'SuiRockerComponent',
            label: 'Stretch Contents'
          }, {
            smoName: 'customProportion',
            control: 'SuiRockerComponent',
            increment: 10,
            label: 'Proportionalality'
          }, {
            smoName: 'padAllInSystem',
            control: 'SuiToggleComponent',
            label: 'Pad all measures in system'
          }, {
            smoName: 'autoJustify',
            control: 'SuiToggleComponent',
            label: 'Justify Columns'
          }, {
            smoName: 'systemBreak',
            control: 'SuiToggleComponent',
            label: 'System break before this measure'
          }],
          staticText: []
      };
  constructor(parameters: SuiDialogParams) {
    const selection = parameters.view.tracker.selections[0];
    const measure = selection.measure;
    const adapter = new SuiMeasureFormatAdapter(parameters.view, measure);
    super(SuiMeasureDialog.dialogElements, { adapter, ...parameters });
  }
}