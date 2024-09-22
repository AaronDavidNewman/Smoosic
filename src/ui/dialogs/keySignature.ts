// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoTempoText, SmoTempoNumberAttribute, SmoTempoStringAttribute, SmoTempoBooleanAttribute } from '../../smo/data/measureModifiers';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoOperation } from '../../smo/xform/operations';
import { PromiseHelpers } from '../../common/promiseHelpers';

declare var $: any;



export class SuiKeySignatureAdapter extends SuiComponentAdapter {
  keySignature: string;
  applyToAll: boolean = false;  
  applyToSelections: boolean = false;
  applyToRemaining: boolean = false;
  edited: boolean = false;
  measure: SmoMeasure;
  constructor(view: SuiScoreViewOperations, measure: SmoMeasure) {
    super(view);
    this.measure = measure;
    this.keySignature = measure.keySignature;
  }

  async cancel() {
  }
  applySelections(selections: SmoSelection[]) {
    this.view.groupUndo(true);
    this.view.modifyColumnsSelectionsNoWait('keySignature', selections, (score, selection) => {
      SmoOperation.addKeySignature(score, selection, this.keySignature);
    });
    this.view.groupUndo(false);
  }
  async apply() {
    let minSel = this.view.tracker.getExtremeSelection(-1).selector.measure;
    let maxSel = minSel;
    const maxMeasure = this.view.score.staves[0].measures.length - 1;
    if (this.applyToAll) {
      minSel = 0;
      maxSel = maxMeasure;
    } else if (this.applyToRemaining) {
      maxSel = maxMeasure;
    }
    const selections = SmoSelection.getMeasuresBetween(this.view.score, 
      SmoSelector.measureSelector(0, minSel), SmoSelector.measureSelector(0, maxSel));
    this.applySelections(selections);
    await this.view.updatePromise();
  }
  get applyTo() {
    if (this.applyToAll) {
      return 'all';
    }
    if (this.applyToRemaining) {
      return 'remaining';
    }
    return 'selections';
  }
  set applyTo(val: string) {
    const orig = this.applyTo;
    if (orig === val) {
      return;
    }
    this.applyToAll = false;
    this.applyToRemaining = false;
    this.applyToSelections = false;
    if (val === 'all') {
      this.applyToAll = true;
    } else if (val === 'remaining') {
      this.applyToRemaining = true;
    } else {
      this.applyToSelections = true;
    }
  }
  async commit(){
    await this.apply();
  }
  get key() {
    return this.keySignature;
  }
  set key(value: string) {
    this.keySignature = value;
  }
}
// ## SuiTempoDialog
// Allow user to choose a tempo or tempo change.
export class SuiKeySignatureDialog extends SuiDialogAdapterBase<SuiKeySignatureAdapter> {
  static dialogElements: DialogDefinition = 
      {
        label: 'Key Signature',
        staticText: [],
        elements: [
          {
            smoName: 'key',
            defaultValue: 'C',
            control: 'SuiDropdownComponent',
            label: 'Tempo Mode',
            options: [{
              label: 'C Major',
              value: 'c',
            }, {
              label: 'F Major',
              value: 'f',
            }, {
              label: 'G Major',
              value: 'g',
            }, {
              label: 'Bb Major',
              value: 'bb'
            }, {
              label: 'D Major',
              value: 'd'
            }, {
              label: 'Eb Major',
              value: 'eb'
            }, {
              label: 'A Major',
              value: 'a'
            }, {
              label: 'Ab Major',
              value: 'ab'
            }, {
              label: 'E Major',
              value: 'e'
            }, {
              label: 'Db Major',
              value: 'db'
            }, {
              label: 'B Major',
              value: 'b'
            }, {
              label: 'F# Major',
              value: 'f#'
            }, {
              label: 'C# Major',
              value: 'c#'
            }, {
              label: 'Gb Major',
              value: 'gb'
            }
            ]
          },          {
            smoName: 'applyTo',
            defaultValue: 'selections',
            control: 'SuiDropdownComponent',
            label: 'Apply to:',
            options: [{
              label: 'Current Selections',
              value: 'selections',
            }, {
              label: 'Future Measures',
              value: 'remaining',
            },{
              label: 'Full Score',
              value: 'all',
            }]
          }
        ]
      };
  async changed() {
    await super.changed();
  }
  constructor(parameters: SuiDialogParams) {
    const measures = SmoSelection.getMeasureList(parameters.view.tracker.selections)
      .map((sel) => sel.measure);
    const measure = measures[0];
    const adapter = new SuiKeySignatureAdapter(parameters.view, measure);
    super(SuiKeySignatureDialog.dialogElements, { adapter, ...parameters });
  }
}
