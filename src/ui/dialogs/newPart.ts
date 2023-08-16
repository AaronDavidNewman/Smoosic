// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { Clef } from '../../smo/data/common';
import { SmoInstrument, SmoInstrumentNumParamType, SmoInstrumentStringParamType } from '../../smo/data/staffModifiers';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { SmoSystemStaffParams, SmoSystemStaff } from '../../smo/data/systemStaff';
import { SmoPartInfo } from '../../smo/data/partInfo';
import { PromiseHelpers } from '../../common/promiseHelpers';

declare var $: any;

export class SuiNewPartAdapter extends SuiComponentAdapter {
  instrument: SmoInstrument;
  alignWithPreviousVal: boolean = true;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    const selection = this.view.tracker.selections[0];
    this.instrument = new SmoInstrument(this.view.score.getStaffInstrument(selection.selector));
  }
  writeNumParam(paramName: SmoInstrumentNumParamType, value: number) {
    this.instrument[paramName] = value;
  }
  writeStringParam(paramName: SmoInstrumentStringParamType, value: string) {
    this.instrument[paramName] = value;
  }
  set alignWithPrevious(val: boolean) {
    this.alignWithPreviousVal = val;
  }
  get alignWithPrevious() {
    return this.alignWithPreviousVal;
  }
  get transposeIndex() {
    return this.instrument.keyOffset;
  }
  set transposeIndex(value: number) {
    this.writeNumParam('keyOffset', value);
  }
  get instrumentName() {
    return this.instrument.instrumentName;
  }
  get subFamily() {
    return this.instrument.instrument;
  }
  set subFamily(value: string) {
    this.writeStringParam('instrument', value);
  }
  set instrumentName(value: string) {
    this.writeStringParam('instrumentName', value);
  }
  get clef(): Clef {
    return this.instrument.clef;
  }
  set clef(value: Clef)  {
    this.instrument.clef = value;
  }
  async commit() {
    const staffParams: SmoSystemStaffParams = SmoSystemStaff.defaults;
    staffParams.staffId = this.view.storeScore.staves.length;
    staffParams.measureInstrumentMap[0] = this.instrument;
    staffParams.alignWithPrevious = this.alignWithPreviousVal;
    await this.view.addStaff(staffParams);
  }
  async cancel() {
    return PromiseHelpers.emptyPromise();
  }
}
export class SuiNewPartDialog extends SuiDialogAdapterBase<SuiNewPartAdapter> {
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
            label: 'Part Name'
          },  {
            smoName: 'alignWithPrevious',
            control: 'SuiToggleComponent',
            label: 'Align Notes with Previous Staff'
          }, {
            smoName: 'subFamily',
            control: 'SuiDropdownComponent',
            label: 'Sample Sound',
            options: [{
              value: 'piano',
              label:'Grand Piano'
            }, {
              value: 'bass',
              label: 'Bass'
            }, {
              value: 'cello',
              label: 'Cello'
            }, {
              value: 'violin',
              label: 'Violin'
            }, {
              value: 'trumpet',
              label: 'Bb Trumpet'
            }, {
              value: 'horn',
              label: 'F Horn'
            }, {
              value: 'tuba',
              label: 'Tuba'
            }, {
              value: 'clarinet',
              label: 'Bb Clarinet'
            }, {
              value: 'pad',
              label: 'Synth Pad'
            }, {
              value: 'percussion',
              label: 'Percussion'
            }, {
              value: 'none',
              label: 'None'
            }]
          }, {
            smoName: 'clef',
            control: 'SuiDropdownComponent',
            label: 'Clef',
            options: [ {
              label: 'Treble Clef Staff',
              value: 'treble'
            }, {
              label: 'Bass Clef Staff',
              value: 'bass'
            }, {
              label: 'Alto Clef Staff',
              value: 'alto'
            }, {
              label: 'Tenor',
              value: 'tenor'
            }, {
              label: 'Percussion',
              value: 'percussion'
            }]          
          }
          ],
          staticText: []
      };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiNewPartAdapter(parameters.view);
    super(SuiNewPartDialog.dialogElements, { adapter, ...parameters });
  }
}