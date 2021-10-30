// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiComponentBase, SuiDialogNotifier } from '../components/baseComponent';
import { SuiToggleComposite } from '../components/toggle';
import { SuiTextInputComposite } from '../components/textInput';

import { htmlHelpers } from '../../../common/htmlHelpers';
import { SuiScoreViewOperations } from '../../../render/sui/scoreViewOperations';
declare var $: any;
export interface TextCheckComponentParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string
}
export interface TextCheckPair {
  checked: boolean,
  text: string
}
export class TextCheckComponent extends SuiComponentBase {
  view: SuiScoreViewOperations;
  staticText: Record<string, string>;
  toggleCtrl: SuiToggleComposite;
  textCtrl: SuiTextInputComposite;
  defaultValue: string;
  constructor(dialog: SuiDialogNotifier, parameter: TextCheckComponentParams) {
    super(dialog, parameter);
    this.dialog = dialog;
    this.view = this.dialog.getView();
    this.defaultValue = '';
    const toggleName = this.smoName + 'Toggle';
    const textName = this.smoName + 'Text';
    this.staticText = this.dialog.getStaticText();
    const label = this.staticText[textName];
    const show = this.staticText.show;
    this.toggleCtrl = new SuiToggleComposite(this.dialog, {
      smoName: toggleName,
      control: 'SuiToggleComposite',
      label: show,
      parentControl: this,
      classes: '',
      id: toggleName
    });
    this.textCtrl = new SuiTextInputComposite(this.dialog, {
      smoName: textName,
      defaultValue: this.defaultValue,
      control: 'SuiTextInputComposite',
      label,
      parentControl: this,
      classes: '',
      id: toggleName
    });
  }
  get html() {
    const b = htmlHelpers.buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl textCheckContainer'))
      .attr('id', this.parameterId);
    q.append(this.textCtrl.html);
    q.append(this.toggleCtrl.html);
    return q;
  }
  getInputElement() {
    var pid = this.parameterId;
    return $('#' + pid);
  }
  getValue(): TextCheckPair {
    return {
      checked: this.toggleCtrl.getValue(),
      text: this.textCtrl.getValue()
    };
  }
  setValue(val: TextCheckPair) {
    this.toggleCtrl.setValue(val.checked);
    this.textCtrl.setValue(val.text);
  }
  changed() {
    this.handleChanged();
  }
  bind() {
    this.toggleCtrl.bind();
    this.textCtrl.bind();
  }
}
