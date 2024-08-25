// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { getButtonsFcn, SuiButtonArrayMSComponent, SuiButtonArrayParameters } from './components/buttonArray';
import { SuiDialogNotifier, SuiBaseComponentParams } from './components/baseComponent';
import { SmoMicrotone } from '../../smo/data/noteModifiers';

const microtoneButtonFactory: getButtonsFcn = () => {
  const params: SuiButtonArrayParameters = {
    label: 'Microtones',
    rows: [{
      label: 'Microtones',
      classes: 'pad-span',
      buttons: [
        {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-accidentalQuarterToneFlatStein',
          id: 'flat75sz',
          label: '3/4 flat',
          smoName: 'flat75sz'
        },  {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-accidentalThreeQuarterTonesFlatZimmermann',
          id: 'flat25sz',
          label: '1/4 flat',
          smoName: 'flat25sz'
        }, {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-accidentalBakiyeFlat',
          id: 'flat25ar',
          label: '1/4 flat',
          smoName: 'flat25ar'
        }, {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-accidentalThreeQuarterTonesSharpStein',
          id: 'sharp75',
          label: '3/4 sharp',
          smoName: 'sharp75'
        }, {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-accidentalQuarterToneSharpStein',
          id: 'sharp25',
          label: 'Marcato',
          smoName: 'sharp25'
        }, {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-top icon-accidentalSori',
          id: 'sori',
          label: 'Sori',
          smoName: 'sori'
        },  {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-top icon-accidentalKoron',
          id: 'koron',
          label: 'Koron',
          smoName: 'koron'
        }
      ]
    }
    ]
  }
  return params;
}

export class SuiMicrotoneButtonComponent extends SuiButtonArrayMSComponent {
  constructor(dialog: SuiDialogNotifier, parameter: SuiBaseComponentParams) {
    super(dialog, parameter, microtoneButtonFactory);
  }
}
export class SuiMicrotoneAdapter extends SuiComponentAdapter {
  toneString: string = '';
  constructor(view: SuiScoreViewOperations) {
    super(view);
    const selections = this.view.tracker.selections.filter((ss) => ss.note);
    this.view.groupUndo(true);
    const setForAll: Record<string, number> = {};
    let notesCount = 0;
    selections.forEach((sel) => {
      const microtones = sel.note!.getMicrotones();
      notesCount += 1;
      microtones.forEach((mt) => {
        if (!setForAll[mt.tone]) {
          setForAll[mt.tone] = 0;
        }
        setForAll[mt.tone] = setForAll[mt.tone] + 1;
      });
    });
    const keys = Object.keys(setForAll);
    keys.forEach((key) => {
      if (setForAll[key] === notesCount) {
        this.toneString = key;
      }      
    });
  }
  get tone() {
    return this.toneString;
  }
  set tone(value: string) {
    this.toneString = value;
    const selections = this.view.tracker.selections.filter((ss) => ss.note);
    // for each selection
    selections.forEach((selection) => {
      // make sure any existing codes are set
      this.view.modifySelectionNoWait('microtone dialog', selection, (score, selection) => {
        const note = selection.note;
        if (note) {
          if (value.length) {
            const defs = SmoMicrotone.defaults;
            defs.tone = this.tone;
            note.addMicrotone(new SmoMicrotone(defs));
          } else {
            const mt = note.getMicrotone(0);
            if (mt) {
              note.removeMicrotone(mt);
            }
          }
        }
      });
    });
  }
  async commit() {    
  }
  async cancel() {
    await this.view.undo();
  }
  async remove() {
  }
}
export class SuiMicrotoneDialog extends SuiDialogAdapterBase<SuiMicrotoneAdapter> {
  static get applyTo() {
    return {
      score: 0, selected: 1, remaining: 3
    };
  }
  // export type Clef = 'treble' | 'bass' | 'tenor' | 'alto' | 'soprano' | 'percussion'
  //| 'mezzo-soprano' | 'baritone-c' | 'baritone-f' | 'subbass' | 'french';
  static dialogElements: DialogDefinition =
    {
      label: 'Microtones',
      elements:
        [{
          smoName: 'tone',
          control: 'SuiMicrotoneButtonComponent',
          label: 'Microtones'
        }],
      staticText: []
    };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiMicrotoneAdapter(parameters.view);
    super(SuiMicrotoneDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS', 'HIDEREMOVE'];
  }
  async changed() {
    this.view.undoTrackerMeasureSelections('microtone dialog');
    await super.changed();
  }
}