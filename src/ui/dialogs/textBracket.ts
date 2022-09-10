// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SmoStaffTextBracket, SmoTextBracketNumberType, SmoTextBracketStringType} from '../../smo/data/staffModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';

declare var $: any;

export class SuiTextBracketAdapter extends SuiComponentAdapter {
  backup: SmoStaffTextBracket;
  bracket: SmoStaffTextBracket;
  changed: boolean = false;
  constructor(view: SuiScoreViewOperations, bracket: SmoStaffTextBracket) {
    super(view);
    this.bracket = bracket;
    this.view = view;
    this.backup = new SmoStaffTextBracket(this.bracket);
    this.backup.attrs.id = bracket.attrs.id;
    this.backup.associatedStaff = bracket.associatedStaff;
  }
  cancel() {
    if (this.changed) {
      this.view.removeTextBracket(this.bracket);
      this.view.addOrReplaceTextBracket(this.backup);
    }
  }
  remove() {
    this.view.removeStaffModifier(this.bracket);
  }
  commit() {
  }
  updateValue(param: SmoTextBracketNumberType, val: number) {
    const current = new SmoStaffTextBracket(this.bracket);
    this.bracket[param] = parseInt(val.toString(), 10);
    this.view.addOrUpdateStaffModifier(current, this.bracket);
    this.changed = true;
  }
  updateText(param: SmoTextBracketStringType, val: string) {
    const current = new SmoStaffTextBracket(this.bracket);
    this.bracket[param] = val;
    this.view.addOrUpdateStaffModifier(current, this.bracket);
    this.changed = true;
  }
  get text() {
    return this.bracket.text;
  }
  set text(val: string) {
    this.updateText('text', val);
  }
  get superscript() {
    return this.bracket.superscript;
  }
  set superscript(val: string) {
    this.updateText('superscript', val);
  }
  get position() {
    return this.bracket.position;
  }
  set position(val: number) {
    this.updateValue('position', val);
  }
  get line() {
    return this.bracket.line;
  }
  set line(val: number) {
    this.updateValue('line', val);
  }
}
export class SuiTextBracketDialog extends SuiDialogAdapterBase<SuiTextBracketAdapter> {
  static dialogElements: DialogDefinition =
      {
        label: 'Text Bracket Properties', elements:
          [{
            smoName: 'line',
            defaultValue: 1,
            control: 'SuiRockerComponent',
            label: 'Line'
          },  {
            smoName: 'position',
            control: 'SuiDropdownComponent',
            label: 'Position',
            options: [
              {
                value: '1',
                label: 'Above'
              }, {
                value: '-1',
                label: 'Below'
              }]
          }, {
            smoName: 'text',
            control: 'SuiTextInputComponent',
            label: 'Text'
          }, {
            smoName: 'superscript',
            control: 'SuiTextInputComponent',
            label: 'SubText'
          }],
          staticText: []
      };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiTextBracketAdapter(parameters.view, parameters.modifier);
    super(SuiTextBracketDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
  }
}