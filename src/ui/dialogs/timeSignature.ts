// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMeasure } from '../../smo/data/measure';
import { TimeSignature } from '../../smo/data/measureModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { PromiseHelpers } from '../../common/promiseHelpers';

declare var $: any;

export class SuiTimeSignatureAdapter extends SuiComponentAdapter {
  measure: SmoMeasure;
  backup: TimeSignature;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.measure = this.view.tracker.selections[0].measure;
    this.backup = new TimeSignature(this.measure.timeSignature);
  }
  get numerator() {
    return this.measure.timeSignature.actualBeats;
  }
  set numerator(value: number) {
    this.measure.timeSignature.actualBeats = value;
  }
  get denominator() {
    return this.measure.timeSignature.beatDuration;
  }
  set denominator(value: number) {
    this.measure.timeSignature.beatDuration = value;
  }
  get display() {
    return this.measure.timeSignature.display;
  }
  set display(value: boolean) {
    this.measure.timeSignature.display = value;
  }
  get useSymbol() {
    return this.measure.timeSignature.useSymbol;
  }
  set useSymbol(value: boolean) {
    this.measure.timeSignature.useSymbol = value;
  }
  get customString() {
    return this.measure.timeSignature.displayString;
  }
  set customString(value: string) {
    const tr = value.trim();
    if (!(tr.indexOf('/') >= 0)) {
      if (tr === 'C' || tr === 'C|') {
        this.measure.timeSignature.displayString = tr;
        return;
      }
    }
    const ar = tr.split('/');
    if (isNaN(parseInt(ar[0], 10)) || isNaN(parseInt(ar[1], 10))) {
      this.measure.timeSignature.displayString = '';
      return;
    }
    this.measure.timeSignature.displayString = tr;
  }
  async commit() {
    await this.view.setTimeSignature(this.measure.timeSignature);
  }
  async cancel() {
    this.measure.timeSignature = this.backup;
    return PromiseHelpers.emptyPromise();
  }
}
export class SuiTimeSignatureDialog extends SuiDialogAdapterBase<SuiTimeSignatureAdapter> {
  static dialogElements: DialogDefinition =
    {
        label: 'Custom Time Signature',
        elements:
          [
            {
              smoName: 'numerator',
              defaultValue: 3,
              control: 'SuiRockerComponent',
              label: 'Beats/Measure',
            },
            {
              smoName: 'denominator',
              defaultValue: 8,
              dataType: 'int',
              control: 'SuiDropdownComponent',
              label: 'Beat Value',
              options: [{
                value: 16,
                label: '16',
              }, {
                value: 8,
                label: '8',
              }, {
                value: 4,
                label: '4'
              }, {
                value: 2,
                label: '2'
              }]
            }, {
              smoName: 'display',
              control: 'SuiToggleComponent',
              label: 'Display',
            }, {
              smoName: 'useSymbol',
              control: 'SuiToggleComponent',
              label: 'Common/Cut',
            }, {
              smoName: 'customString',
              control: 'SuiTextInputComponent',
              label: 'Custom',
            }
          ],
          staticText: []
      };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiTimeSignatureAdapter(parameters.view);
    super(SuiTimeSignatureDialog.dialogElements, { adapter, ...parameters });
  }
}