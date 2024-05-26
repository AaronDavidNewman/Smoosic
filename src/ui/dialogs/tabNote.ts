// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoTabNote } from '../../smo/data/noteModifiers';
import { Pitch } from '../../smo/data/common';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';

export class SuiTabNoteAdapter extends SuiComponentAdapter {
  selections: SmoSelection[];
  tabNote: SmoTabNote;
  constructor(view: SuiScoreViewOperations, modifier?: SmoTabNote) {
    super(view);
    this.selections = SmoSelection.getMeasureList(this.view.tracker.selections);
    if (modifier) {
      this.tabNote = modifier;
    } else {
      const note = this.selections[0].note;
      if (!note) {
        throw('No notes selected for tabNote');
      }
      const tabNote = note.tabNote;
      if (tabNote) {
        this.tabNote = tabNote
      } else {
        this.tabNote = new SmoTabNote(SmoTabNote.defaults);
      }
    }
  }
  get strings(): number[] {
    return this.tabNote.positions.map((tn) => tn.string);
  }
  set strings(value: number[]) {
    for (var i = 0; i < value.length && i < this.tabNote.positions.length; ++i) {
      this.tabNote.positions[i];
    }
  } 
  async commit() {
    this.view.updateTabNote(this.tabNote);
  }
  async cancel() {
  }
  async remove() { 
    return await this.view.removeTabNote();
  }
}
export class SuiTabNoteDialog extends SuiDialogAdapterBase<SuiTabNoteAdapter> {
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
          [{
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
    const adapter = new SuiTabNoteAdapter(parameters.view, parameters.modifier);
    super(SuiTabNoteDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
  }
}