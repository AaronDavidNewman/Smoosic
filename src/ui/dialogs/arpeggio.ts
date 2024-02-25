// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoArpeggio, SmoArpeggioType, isArpeggioType } from '../../smo/data/noteModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { PromiseHelpers } from '../../common/promiseHelpers';

export class SuiArpeggioAdapter extends SuiComponentAdapter {
  arpeggio: SmoArpeggio;
  backup: SmoArpeggio;
  changed: boolean = false;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.arpeggio = new SmoArpeggio({ type: 'none' });
    this.backup = new SmoArpeggio({ type: 'none' });
    const selections = view.tracker.selections;
    if (selections.length && selections[0].note) {
      if (selections[0].note.arpeggio) {
        this.arpeggio = new SmoArpeggio({ type: selections[0].note.arpeggio.typeString });
      }
      this.backup = new SmoArpeggio({ type: this.arpeggio.typeString });
    }
    this.view = view;
  }
  async cancel() {
    if (this.changed) {
     await this.view.addRemoveArpeggio(this.backup.typeString);
    }
  }
  async commit() {
    return PromiseHelpers.emptyPromise();
  }
  get arpeggioType() {
    return this.arpeggio.typeString;
  }
  set arpeggioType(value: SmoArpeggioType) {
    if (isArpeggioType(value)) {
      this.view.addRemoveArpeggio(value);
      this.changed = true;
    }
  }
}
/**
 * export  const SmoArpeggioTypes = ['directionless', 'rasquedo_up', 'rasquedo_down',
  'roll_up', 'roll_down', 'brush_up', 'brush_down', 'none'];
 */
export class SuiArpeggioDialog extends SuiDialogAdapterBase<SuiArpeggioAdapter> {
  /**
   * The template used to create the dialog components
   */
  static dialogElements: DialogDefinition =
    {
      label: 'Arpeggio', elements:
        [{
          smoName: 'arpeggioType',
          control: 'SuiDropdownComponent',
          label: 'Arpeggio Type',
          options: [{
            value: 'directionless',
            label: 'Plain'
          }, {
            value: 'rasquedo_up',
            label: 'Rasquedo Up'
          }, {
            value: 'rasquedo_down',
            label: 'Rasquedo Down'
          }, {
            value: 'roll_up',
            label: 'Roll Up'
          }, {
            value: 'roll_down',
            label: 'Roll Down'
          }, {
            value: 'brush_up',
            label: 'Brush Up'
          }, {
            value: 'brush_down',
            label: 'Brush Down'
          }, { 
            value: 'none',
            label: 'None'
          }]
        }],
      staticText: []
    };
  static createAndDisplay(parameters: SuiDialogParams) {
    const dg = new SuiArpeggioDialog(parameters);
    dg.display();
  }
  constructor(params: SuiDialogParams) {
    const adapter = new SuiArpeggioAdapter(params.view);
    super(SuiArpeggioDialog.dialogElements, { adapter, ...params });
    this.modifier = params.modifier;
  }
}
