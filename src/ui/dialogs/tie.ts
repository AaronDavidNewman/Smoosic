// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SmoTie, TieLine } from '../../smo/data/staffModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';

declare var $: any;

export type TieNumber = 'tie_spacing' | 'cp1' | 'cp2' | 'first_x_shift' | 'last_x_shift' | 'y_shift';

export class SuiTieAdapter extends SuiComponentAdapter {
  tie: SmoTie;
  backup: SmoTie;
  changed: boolean = false;
  constructor(view: SuiScoreViewOperations, tie: SmoTie) {
    super(view);
    this.tie = tie;
    this.backup = new SmoTie(tie);
  }
  writeTieNumber(value: number, param: TieNumber) {
    this.tie[param] = value;
    this.view.addOrUpdateStaffModifier(this.backup, this.tie);
    this.changed = true;
  }
  get lines(): TieLine[] {
    return this.tie.lines;
  }
  set lines(value: TieLine[]) {
    this.tie.lines = JSON.parse(JSON.stringify(value));
    this.view.addOrUpdateStaffModifier(this.backup, this.tie);
  }
  get tie_spacing(): number {
    return this.tie.tie_spacing;
  }
  set tie_spacing(value: number) {
    this.writeTieNumber(value, 'tie_spacing');
  }  
  get first_x_shift(): number {
    return this.tie.first_x_shift;
  }
  set first_x_shift(value: number) {
    this.writeTieNumber(value, 'first_x_shift');
  }  
  get last_x_shift(): number {
    return this.tie.last_x_shift;
  }
  set last_x_shift(value: number) {
    this.writeTieNumber(value, 'last_x_shift');
  }  
  get y_shift(): number {
    return this.tie.y_shift;
  }
  set y_shift(value: number) {
    this.writeTieNumber(value, 'y_shift');
  }  
  get cp1(): number {
    return this.tie.cp1;
  }
  set cp1(value: number) {
    this.writeTieNumber(value, 'cp1');
  }
  get cp2(): number {
    return this.tie.cp2;
  }
  set cp2(value: number) {
    this.writeTieNumber(value, 'cp2');
  }
  commit() {

  }
  cancel() {
    if (this.changed) {
      this.view.addOrUpdateStaffModifier(this.backup, this.backup);
    }
  }
  remove() {
    this.view.removeStaffModifier(this.backup);
  }
}
export class SuiTieAttributesDialog extends SuiDialogAdapterBase<SuiTieAdapter> {
  static dialogElements: DialogDefinition =
      {
        label: 'Tie Properties',

        staticText: [
          { label: 'Tie Properties' },
          { fromNote: 'From Note' },
          { toNote: 'To Note' }
        ], elements: [{
          smoName: 'lines',
          control: 'TieMappingComponent',
          label: 'Lines'
        }, {
          smoName: 'cp1',
          control: 'SuiRockerComponent',
          label: 'Control Point 1'
        }, {
          smoName: 'cp2',
          control: 'SuiRockerComponent',
          label: 'Control Point 2'
        }, {
          smoName: 'first_x_shift',
          control: 'SuiRockerComponent',
          label: 'X Offset 1'
        }, {
          smoName: 'last_x_shift',
          control: 'SuiRockerComponent',
          label: 'X Offset 2'
        }, {
          smoName: 'y_shift',
          defaultValue: 0,
          control: 'SuiRockerComponent',
          label: 'Y Offset'
        }, {
          smoName: 'tie_spacing',
          defaultValue: 40,
          control: 'SuiRockerComponent',
          label: 'Tie Spacing'
        }],
      };
  static createAndDisplay(parameters: SuiDialogParams) {
    var dg = new SuiTieAttributesDialog(parameters);
    dg.display();
    return dg;
  }
  constructor(parameters: SuiDialogParams) {
    if (!parameters.modifier) {
      throw new Error('modifier attribute dialog must have modifier');
    }
    const tie = parameters.modifier as SmoTie;
    const adapter = new SuiTieAdapter(parameters.view, tie);
    super(SuiTieAttributesDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
  }
}
