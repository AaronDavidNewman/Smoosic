// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoTabStave } from '../../smo/data/staffModifiers';
import { Pitch } from '../../smo/data/common';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';

export class SuiTabStaveAdapter extends SuiComponentAdapter {
  selections: SmoSelection[];
  tabStave: SmoTabStave;
  constructor(view: SuiScoreViewOperations, modifier?: SmoTabStave) {
    super(view);
    this.selections = SmoSelection.getMeasureList(this.view.tracker.selections);
    if (modifier) {
      this.tabStave = modifier;
    } else {
      this.tabStave = new SmoTabStave(SmoTabStave.defaults);
      this.tabStave.startSelector = JSON.parse(JSON.stringify(this.selections[0].selector));
      this.tabStave.endSelector = JSON.parse(JSON.stringify(this.selections[this.selections.length - 1].selector));
    }
  }
  get numLines(): number {
    return this.tabStave.numLines;
  }
  set numLines(value: number) {
    this.tabStave.numLines = value;
  }
  set spacing(value: number) {
    this.tabStave.spacing = value;
  }
  get spacing(): number {
    return this.tabStave.spacing;
  }
  get showStems(): boolean {
    return this.tabStave.showStems;
  }
  set showStems(value: boolean) {
    this.tabStave.showStems = value;
  }
  get allMeasures(): boolean {
    return this.tabStave.allMeasures;
  }
  set allMeasures(value: boolean) {
    this.tabStave.allMeasures = value;
  }
  get stringPitches(): Pitch[] {
    return this.tabStave.stringPitches;
  }
  set stringPitches(value: Pitch[]) {
    this.tabStave.stringPitches = value;
    this.numLines = this.tabStave.stringPitches.length;
  }
  async commit() {
    this.view.updateTabStave(this.tabStave);
  }
  async cancel() {
  }
  async remove() { 
    return await this.view.removeTabStave();
  }
}
export class SuiTabStaveDialog extends SuiDialogAdapterBase<SuiTabStaveAdapter> {
  static get applyTo() {
    return {
      score: 0, selected: 1, remaining: 3
    };
  }
  // export type Clef = 'treble' | 'bass' | 'tenor' | 'alto' | 'soprano' | 'percussion'
    //| 'mezzo-soprano' | 'baritone-c' | 'baritone-f' | 'subbass' | 'french';
  static dialogElements: DialogDefinition = 
      {
        label: 'Tab Properties',
        elements:
          [{smoName: 'stringPitches',
           control:'SuiPitchArrayComponent', 
           label: 'Pitches'
          }, {
            smoName: 'spacing',
            defaultValue: 13,
            control: 'SuiRockerComponent',
            label: 'Space between lines'
          }, {
            smoName: 'showStems',
            control: 'SuiToggleComponent',
            label: 'Show Stems'
          }, {
            smoName: 'allMeasures',
            control: 'SuiToggleComponent',
            label: 'Apply to all measures'
          }],
          staticText: []
      };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiTabStaveAdapter(parameters.view, parameters.modifier);
    super(SuiTabStaveDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
  }
}