// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { getButtonsFcn, SuiButtonArrayComponent } from './components/buttonArray';
import { SuiDialogNotifier, SuiBaseComponentParams } from './components/baseComponent';

const noteHeadButtonFactory: getButtonsFcn = () => {
  return [
    { classes: 'icon collapseParent button-array',
      control: 'SuiButtonArrayButton',
      icon: 'icon-bravura ribbon-button-text icon-noteheadXBlack',
      id: 'noteheadBlackX',
      label:'X',
      smoName: 'x2'
    },  { classes: 'icon collapseParent button-array',
      control: 'SuiButtonArrayButton',
      icon: 'icon-bravura ribbon-button-text icon-noteheadTriangleUpBlack',
      id: 'noteheadTriangleXUp',
      label:'Triangle Up',
      smoName: 'T2'
    },  { classes: 'icon collapseParent button-array',
      control: 'SuiButtonArrayButton',
      icon: 'icon-bravura ribbon-button-text icon-noteheadCircleX',
      id: 'noteheadCircleX',
      label:'Circle X',
      smoName: 'X3'
    },  { classes: 'icon collapseParent button-array',
      control: 'SuiButtonArrayButton',
      icon: 'icon-bravura ribbon-button-text icon-noteheadDiamondBlack',
      id: 'noteheadDiamondBlack',
      label:'Diamond',
      smoName: 'D2'
    },  { classes: 'icon collapseParent button-array',
      control: 'SuiButtonArrayButton',
      icon: 'icon-bravura ribbon-button-text icon-noteheadSquareBlack',
      id: 'noteheadSquareBlack',
      label:'Square',
      smoName: 'S2'
    }, { classes: 'icon collapseParent button-array',
      control: 'SuiButtonArrayButton',
      icon: 'icon-bravura ribbon-button-text icon-noteheadBlack',
      id: 'noteheadBlack',
      label:'Default',
      smoName: ''
    }
  ]
}
export class SuiNoteHeadButtonComponent extends SuiButtonArrayComponent {
  constructor(dialog: SuiDialogNotifier, parameter: SuiBaseComponentParams, buttonFactory: getButtonsFcn) {
    super(dialog, parameter, noteHeadButtonFactory);
  }
}
export class SuiNoteHeadAdapter extends SuiComponentAdapter {
  selections: SmoSelection[];
  code: string = '';
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.selections = SmoSelection.getMeasureList(this.view.tracker.selections);
  }
  get noteHead() {
    return this.code;
  }
  set noteHead(value: string) {
    this.code = value;
  }
  async commit() {
    await this.view.setNoteHead(this.code);
  }
  async cancel() {
  }
  async remove() { 
  }
}
export class SuiNoteHeadDialog extends SuiDialogAdapterBase<SuiNoteHeadAdapter> {
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
            smoName: 'noteHead',
            control: 'SuiNoteHeadButtonComponent',
            label: 'Note Head'
          }],
          staticText: []
      };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiNoteHeadAdapter(parameters.view);
    super(SuiNoteHeadDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS', 'HIDEREMOVE'];
  }
}