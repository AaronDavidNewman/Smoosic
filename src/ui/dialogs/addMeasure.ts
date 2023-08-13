// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMeasure } from '../../smo/data/measure';
import { SmoSelection } from '../../smo/xform/selections';
import { SuiToggleComponent } from './components/toggle';

import { SuiRockerComponent } from './components/rocker';
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';

declare var $: any;

/**
 * Insert some number of measures
 * @category SuiDialog
 */
export class SuiInsertMeasures extends SuiDialogBase {
  static dialogElements: DialogDefinition =
      {
        label: 'Insert Measures',
        elements:
          [{
            smoName: 'measureCount',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'Measures to Insert'
          }, {
            smoName: 'append',
            control: 'SuiToggleComponent',
            label: 'Append to Selection'
          }],
          staticText: []
      };
  measure: SmoMeasure;
  selection: SmoSelection;
  constructor(parameters: SuiDialogParams) {
    super(SuiInsertMeasures.dialogElements,
      parameters);
    this.selection = this.view.tracker.selections[0];
    const selection = parameters.view.tracker.selections[0];
    const measure = selection.measure;
    this.measure = measure;
    if (!this.startPromise) {
      this.startPromise = new Promise((resolve) => {
        resolve();
      });
    }
  }
  async commit() { 
    await this.view.addMeasures(this.appendCtrl.getValue(), this.measureCountCtrl.getValue());
  }

  get measureCountCtrl(): SuiRockerComponent {
    return this.cmap.measureCountCtrl as SuiRockerComponent;
  }
  get appendCtrl(): SuiToggleComponent {
    return this.cmap.appendCtrl as SuiToggleComponent;
  }
  populateInitial() {
    this.measureCountCtrl.setValue(1);
  }
  // noop
}