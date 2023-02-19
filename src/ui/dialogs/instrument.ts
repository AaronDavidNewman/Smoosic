// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { Clef } from '../../smo/data/common';
import { SmoInstrument, SmoInstrumentNumParamType, SmoInstrumentStringParamType } from '../../smo/data/staffModifiers';
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
    this.instrument = new SmoInstrument(this.view.score.getStaffInstrument(selection.selector));
    this.selections = SmoSelection.getMeasureList(this.view.tracker.selections);
    this.selector = JSON.parse(JSON.stringify(this.selections[0].selector));
    this.backup = new SmoInstrument(this.instrument);
  }
  writeNumParam(paramName: SmoInstrumentNumParamType, value: number) {
    this.instrument[paramName] = value;
    this.view.changeInstrument(this.instrument, this.selections);
    this.instrument = new SmoInstrument(this.instrument);
  }
  writeStringParam(paramName: SmoInstrumentStringParamType, value: string) {
    this.instrument[paramName] = value;
    this.view.changeInstrument(this.instrument, this.selections);
    this.instrument = new SmoInstrument(this.instrument);
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
    this.view.changeInstrument(this.instrument, this.selections);
    this.instrument = new SmoInstrument(this.instrument);
  }
  get applyTo() {
    return this.applies;
  }
  set applyTo(value: number) {
    this.applies = value;
    if (value === SuiInstrumentDialog.applyTo.score) {
      this.selections = SmoSelection.selectionsToEnd(this.view.score, this.selector.staff, 0);
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
    this.view.changeInstrument(this.backup, this.selections);
  }
  remove() { }
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
            smoName: 'subFamily',
            control: 'SuiDropdownComponent',
            label: 'Sample Sound',
            options: [{
              value: 'piano',
              label:'Grand Piano'
            }, {
              value: 'bass',
              label: 'Bass (bowed)'
            }, {
              value: 'jazzBass',
              label: 'Bass (plucked)'
            }, {
              value: 'eGuitar',
              label: 'Electric Guitar'
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
              value: 'trombone',
              label: 'Trombone'
            }, {
              value: 'tuba',
              label: 'Tuba'
            }, {
              value: 'clarinet',
              label: 'Bb Clarinet'
            },  {
              value: 'altoSax',
              label: 'Eb Alto Sax'
            },  {
              value: 'tenorSax',
              label: 'Bb Tenor Sax'
            },  {
              value: 'bariSax',
              label: 'Eb Bari Sax'
            },  {
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
            }, {
              label: 'Percussion',
              value: 'percussion'
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