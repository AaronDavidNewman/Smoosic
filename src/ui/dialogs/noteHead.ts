// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { getButtonsFcn, SuiButtonArrayComponent, SuiButtonArrayParameters } from './components/buttonArray';
import { SuiDialogNotifier, SuiBaseComponentParams } from './components/baseComponent';
import { SmoOperation } from '../../smo/xform/operations';
import { SuiButtonComponentParams } from './components/button';

const noteHeadButtonFactory: getButtonsFcn = () => {
  const params: SuiButtonArrayParameters = {
    label: 'Note Heads',
    rows: [{
      label: 'Note Shapes',
      classes: 'pad-span',
      buttons: [
        {classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-noteheadXBlack',
          id: 'noteheadBlackX',
          label:'X',
          smoName: 'CX'
        },  { classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-noteheadTriangleUpBlack',
          id: 'noteheadTriangleXUp',
          label:'Triangle Up',
          smoName: 'TU'
        },  { classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-noteheadTriangleDownBlack',
          id: 'noteheadCircleX',
          label:'Triangle Down',
          smoName: 'TD'
        },  { classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-noteheadDiamondBlack',
          id: 'noteheadDiamondBlack',
          label:'Diamond',
          smoName: 'D'
        },  { classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-noteheadSquareBlack',
          id: 'noteheadSquareBlack',
          label:'Square',
          smoName: 'SQ'
        }
      ]
      }, {
        label: 'Note Heads',
        classes: 'pad-span',
        buttons: [
          { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-noteheadDiamondWhole',
            id: 'noteheadDiamondWhole',
            label:'Diamond whole',
            smoName: 'D0'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-noteheadDiamondHalf',
            id: 'noteheadDiamondHalf',
            label:'Diamond open',
            smoName: 'D1'
          },  { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-noteheadDiamondBlack',
            id: 'noteheadDiamondBlack',
            label:'Diamond closed',
            smoName: 'D2'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-noteheadTriangleUpWhole',
            id: 'noteheadTriangleUpWhole',
            label:'Triangle up whole',
            smoName: 'T0'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-noteheadTriangleUpHalf',
            id: 'noteheadTriangleUpHalf',
            label:'Triangle up open',
            smoName: 'T1'
          },  { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-noteheadTriangleUpBlack',
            id: 'noteheadTriangleUpBlack',
            label:'Triangle up closed',
            smoName: 'T2'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-noteheadXWhole',
            id: 'noteheadXWhole',
            label:'X Whole',
            smoName: 'X0'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-noteheadXHalf',
            id: 'noteheadXHalf',
            label:'X Helf',
            smoName: 'X1'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-noteheadXBlack',
            id: 'noteheadXBlack',
            label:'X Closed',
            smoName: 'X2'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-noteheadMoonBlack',
            id: 'noteheadMoonBlack',
            label:'Moon Black',
            smoName: 'RE'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-noteheadTriangleLeftBlack',
            id: 'noteheadTriangleLeftBlack',
            label:'Left Triangle Closed',
            smoName: 'FA'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-noteheadTriangleRightBlack',
            id: 'noteheadTriangleRightBlack',
            label:'Right Triangle Close',
            smoName: 'FAUP'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-noteheadBlack',
            id: 'noteheadBlack',
            label:'Default',
            smoName: ''
          }
        ]
      }
    ]
  }
  return params;
}
export class SuiNoteHeadButtonComponent extends SuiButtonArrayComponent {
  constructor(dialog: SuiDialogNotifier, parameter: SuiBaseComponentParams, buttonFactory: getButtonsFcn) {
    super(dialog, parameter, noteHeadButtonFactory);
  }
}
export class SuiNoteHeadAdapter extends SuiComponentAdapter {
  code: string = '';
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.view.groupUndo(true);
    const ss: Record<string, number> = {};
    const selections = this.view.tracker.selections.filter((nn) => nn.note);
    // count all the notes in selection, if they all have the same note head, that is the
    // selected note head so select it in the UI.
    for (let i = 0; i < selections.length; ++i) {
      const nn = selections[i].note;
      if (typeof(ss[nn!.noteHead]) === 'undefined') {
        ss[nn!.noteHead] = 0;
      }
      ss[nn!.noteHead]+= 1;
    }
    const keys = Object.keys(ss);
    if (keys.length === 1) {
      this.code = keys[0];
    }
  }
  get noteHead() {
    return this.code;
  }
  set noteHead(value: string) {
    this.code = value;
    this.view.modifyCurrentSelections('set note head', (score, selections) => {
      SmoOperation.setNoteHead(selections, this.code);
    });
  }
  async commit() {    
  }
  async cancel() {
    this.view.undo();
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