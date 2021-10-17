// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { Clef } from '../../smo/data/common';
import { SmoInstrument } from '../../smo/data/staffModifiers';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';

declare var $: any;

export class SuiInstrumentAdapter extends SuiComponentAdapter {
  instrument: SmoInstrument;
  backup: SmoInstrument;
  selections: SmoSelection[];
  selector: SmoSelector;
  applies: number = SuiInstrumentDialog.applyTo.selected;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    const selection = this.view.tracker.selections[0];
    this.instrument = selection.staff.instrumentInfo;
    this.selections = this.view.tracker.selections;
    this.selector = JSON.parse(JSON.stringify(this.selections[0].selector));
    this.backup = new SmoInstrument(this.instrument);
  }
  get transposeIndex() {
    return this.instrument.keyOffset;
  }
  set transposeIndex(value: number) {
    this.instrument.keyOffset = value;
    this.view.changeInstrument(this.instrument, [this.selections[0]]);
  }
  get instrumentName() {
    return this.instrument.instrumentName;
  }
  set instrumentName(value: string) {
    this.instrument.instrumentName = value;
    this.view.changeInstrument(this.instrument, [this.selections[0]]);
  }
  get clef(): Clef {
    return this.instrument.clef;
  }
  set clef(value: Clef)  {
    this.instrument.clef = value;
    this.view.changeInstrument(this.instrument, [this.selections[0]]);
  }
  get applyTo() {
    return this.applies;
  }
  set applyTo(value: number) {
    this.applies = value;
    if (value === SuiInstrumentDialog.applyTo.score) {
      this.selections = SmoSelection.measuresInColumn(this.view.score, this.selector.staff);
    } else if (this.applyTo === SuiInstrumentDialog.applyTo.remaining) {
      this.selections = SmoSelection.selectionsToEnd(this.view.score, this.selector.staff, this.selector.measure);
    } else {
      this.selections = this.view.tracker.selections;
    }
  }
  commit() {
    this.view.changeInstrument(this.instrument, this.selections);
  }
  cancel() {
    this.view.changeInstrument(this.backup, [this.selections[0]]);
  }
  remove() {
    this.view.changeInstrument(new SmoInstrument(SmoInstrument.defaults), this.selections);
  }
}
export class SuiInstrumentDialog extends SuiDialogAdapterBase<SuiInstrumentAdapter> {
  static get applyTo() {
    return {
      score: 0, selected: 1, remaining: 3
    };
  }
  // export type Clef = 'treble' | 'bass' | 'tenor' | 'alto' | 'soprano' | 'percussion'
    //| 'mezzo-soprano' | 'baritone-c' | 'baritone-f' | 'subbass' | 'french';
  static dialogElements: DialogDefinition = 
      {
        label: 'Instrument Properties',
        elements:
          [{
            smoName: 'transposeIndex',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'Transpose Index (1/2 steps)',
          }, {
            smoName: 'instrumentName',
            control: 'SuiTextInputComponent',
            label: 'Name'
          }, {
            smoName: 'clef',
            control: 'SuiDropdownComponent',
            label: 'Clef',
            options: [{
              value: 'treble',
              label:'Treble'
            }, {
              value: 'bass',
              label: 'Bass'
            }, {
              value: 'tenor',
              label: 'Tenor'
            }, {
              value: 'alto',
              label: 'Alto'
            }]
          }, {
            smoName: 'applyTo',
            defaultValue: SuiInstrumentDialog.applyTo.score,
            dataType: 'int',
            control: 'SuiDropdownComponent',
            label: 'Apply To',
            options: [{
              value: SuiInstrumentDialog.applyTo.score,
              label: 'Score'
            }, {
              value: SuiInstrumentDialog.applyTo.selected,
              label: 'Selected Measures'
            }, {
              value: SuiInstrumentDialog.applyTo.remaining,
              label: 'Remaining Measures'
            }]
          }
          ],
          staticText: []
      };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiInstrumentAdapter(parameters.view);
    super(SuiInstrumentDialog.dialogElements, { adapter, ...parameters });
  }
}