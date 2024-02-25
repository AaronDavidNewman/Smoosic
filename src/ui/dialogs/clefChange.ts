// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoClefChange } from '../../smo/data/noteModifiers';
import { SmoNote } from '../../smo/data/note';
import { IsClef }from '../../smo/data/common';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { DialogDefinition, SuiDialogParams } from './dialog';

export class SuiClefChangeAdapter extends SuiComponentAdapter {
  clefChange: SmoClefChange;
  backup: SmoClefChange;
  smoNote: SmoNote | null = null;
  changed: boolean = false;

  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.clefChange = new SmoClefChange(SmoClefChange.defaults);
    this.backup = new SmoClefChange(SmoClefChange.defaults);
    const selections = view.tracker.selections;
    if (selections.length && selections[0].note) {
      this.smoNote = selections[0].note;
      if (selections[0].note.clefNote) {
        const params = SmoClefChange.defaults;
        params.clef = selections[0].note.clefNote.clef;
        this.clefChange = new SmoClefChange(params);
        this.backup = new SmoClefChange(params);
      } else if (IsClef(this.smoNote.clef)) {
        this.clefChange.clef = this.smoNote.clef;
        this.backup.clef = this.smoNote.clef;
      }
    }
    this.view = view;
  }
  async cancel() {
    if (this.changed) {
     await this.view.addRemoveClefChange(this.backup);
    }
  }
  async commit() {
    return;
  }
  get clefType() {
    return this.clefChange.clef;
  }
  set clefType(value: string) {    
    if (IsClef(value)) {
      // this.view.addRemoveArpeggio(value);
      this.changed = true;
      this.clefChange.clef = value;
      this.view.addRemoveClefChange(this.clefChange);
    }
  }
}
/**
 * clefs same as new part
 */
export class SuiClefChangeDialog extends SuiDialogAdapterBase<SuiClefChangeAdapter> {
  /**
   * The template used to create the dialog components
   */
  static dialogElements: DialogDefinition =
    {
      label: 'Change Clef', elements:
        [ {
          smoName: 'clefType',
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
        }],
      staticText: []
    };
  static createAndDisplay(parameters: SuiDialogParams) {
    const dg = new SuiClefChangeDialog(parameters);
    dg.display();
  }
  constructor(params: SuiDialogParams) {
    const adapter = new SuiClefChangeAdapter(params.view);
    super(SuiClefChangeDialog.dialogElements, { adapter, ...params });
    this.modifier = params.modifier;
  }
}
