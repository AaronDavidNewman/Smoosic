// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent, SuiBaseComponentParams } from '../components/baseComponent';
import {  buildDom } from '../../../common/htmlHelpers';
import { SuiScoreViewOperations } from '../../../render/sui/scoreViewOperations';
import { SuiButtonComponentParams } from './button';

declare var $: any;
export interface SuiButtonComponentRowParameters {
  label: string,
  classes: string
  buttons: SuiButtonComponentParams[]
}
export interface SuiButtonArrayParameters {
  label: string,
  rows: SuiButtonComponentRowParameters[] 
}
declare interface SuiButtonCompositeParams extends SuiButtonComponentParams {
  parentControl: SuiComponentParent
}
export class SuiButtonArrayButton extends SuiComponentBase {
  icon: string;
  classes: string;
  position?: string;
  iButtonState: number = SuiButtonArrayButton.buttonState.initial;
  parentControl: SuiComponentParent;
  static buttonStateString: string[] = ['initial', 'pushed', 'disabled'];
  static buttonState: Record<string, number> = {
    'initial': 0, 'pushed': 1 , 'disabled': 2
  }
  constructor(dialog: SuiDialogNotifier, parameters: SuiButtonCompositeParams) {
    super(dialog, parameters);
    this.id = `${dialog.getId()}-${parameters.id}`;
    this.dialog = dialog;
    this.icon = parameters.icon;
    this.classes = parameters.classes;
    this.parentControl = parameters.parentControl;    
  }
  get buttonStateString() {
    return SuiButtonArrayButton.buttonStateString[this.buttonState];
  }
  get buttonState() {
    return this.iButtonState;
  }
  set buttonState(value: number) {
    this.iButtonState = value;
    this.clearState();
    $(`#${this.id}`).addClass(this.buttonStateString);
  }
  clearState() {
    SuiButtonArrayButton.buttonStateString.forEach((ss) => $(`#${this.id}`).removeClass(ss));
  }
  get html() {
    const b = buildDom;
    const state: string = SuiButtonArrayButton.buttonStateString[this.iButtonState];
    const classes = `${this.classes} ${state}`;
    const q = b('button').attr('id', this.id).classes(classes).append(
      b('span').classes(this.icon).attr('aria-label',this.label)
    );
    return q;
  }
  updateControls() {
    const updateEl = $('#' + this.parameterId);
    $(updateEl).html('');
    $(updateEl).append(this.html.dom());
    this.bind();
  }
  bind() {
    $(`#${this.id}`).off('click').on('click', 
      (ev: any) => {
        this.changeFlag = true;
        this.parentControl.changed();
        this.changeFlag = false;
    });
  }
}
export interface SuiButtonComponentRow {
  label: string,
  classes: string,
  buttons: SuiButtonArrayButton[]
}
export type getButtonsFcn = () => SuiButtonArrayParameters;
export abstract class SuiButtonArrayBase extends SuiComponentParent {
  view: SuiScoreViewOperations;
  buttonRows: SuiButtonComponentRow[] = [];
  pressed: string = '';
  shellCreated: boolean = false;

  constructor(dialog: SuiDialogNotifier, parameter: SuiBaseComponentParams, buttonFactory: getButtonsFcn) {
    super(dialog, parameter);
    this.dialog = dialog;
    const rowParams = buttonFactory();
    rowParams.rows.forEach((bparams) => {
      const row: SuiButtonComponentRow = {
        label: bparams.label,
        classes: bparams.classes,
        buttons: []
      };
      this.buttonRows.push(row);
      bparams.buttons.forEach((bp) => {
        const param = {
          parentControl: this, ...bp
        }
        row.buttons.push(new SuiButtonArrayButton(dialog, param));
      });
    });

    this.view = this.dialog.getView();
  }
  updateControls() {
    const updateEl = $('#' + this.parameterId);
    $(updateEl).html('');
    $(updateEl).append(this.html.dom());
    this.bind();
  }
  get html() {
    const b = buildDom;
    if (!this.shellCreated) {
      const q = b('div').classes(this.makeClasses('multiControl smoControl pitchContainer buttonArray'))
      .attr('id', this.parameterId);
      this.shellCreated = true;
      return q;
    }
    const q = b('div');
    for (let i = 0; i < this.buttonRows.length; ++i) {
      const buttonRow = this.buttonRows[i];
      const r = b('div').classes(`button-array-row`);
      const s = b('div').classes('button-array-label')
        .append(b('span').classes(`${buttonRow.classes}`).text(buttonRow.label));
      const t = b('div').classes('button-array-buttons');
      buttonRow.buttons.forEach((bb) => {
        t.append(bb.html);
      });
      r.append(s);
      r.append(t);
      q.append(r);
    }
    return q;
  }

  abstract changed(): void;
  abstract bind():void;
}

export class SuiButtonArrayComponent extends SuiButtonArrayBase {
  pressed: string = '';
  shellCreated: boolean = false;

  constructor(dialog: SuiDialogNotifier, parameter: SuiBaseComponentParams, buttonFactory: getButtonsFcn) {
    super(dialog, parameter, buttonFactory);
  }
  getValue(): string {   
    return this.pressed;
  }
  updateValues() {
    const rowKeys = Object.keys(this.buttonRows);
    for (let i = 0; i < rowKeys.length; ++i) {
      const buttonRow = this.buttonRows[i];
      buttonRow.buttons.forEach((bb) => {
        if (bb.changeFlag) {
          this.pressed = bb.smoName;
          bb.buttonState = SuiButtonArrayButton.buttonState.pushed;
        } else {
          bb.buttonState = SuiButtonArrayButton.buttonState.initial;
        }
      });
    }
  }
  setValue(val: string) {
    this.pressed = val;
    this.updateValues();
    this.updateControls();
  }
  changed() {
    this.changeFlag = true;
    this.updateValues();
    this.updateControls();
    this.handleChanged();
    this.changeFlag = false;
  }
  bind() {
    const rowKeys = Object.keys(this.buttonRows);
    for (let i = 0; i < rowKeys.length; ++i) {    
      const buttonRow = this.buttonRows[i];
      buttonRow.buttons.forEach((bb) => {
        bb.bind();
      });
    }
  }
}
export class SuiButtonArrayMSComponent extends SuiButtonArrayBase {
  pressedArray: string[] = [];
  constructor(dialog: SuiDialogNotifier, parameter: SuiBaseComponentParams, buttonFactory: getButtonsFcn) {
    super(dialog, parameter, buttonFactory);
  }
  getValue(): string[] {   
    return this.pressedArray;
  }
  setValue(val: string[]) {
    this.pressedArray = val;
    this.updateValues();
    this.updateControls();
  }
  updateValues() {
    const rowKeys = Object.keys(this.buttonRows);
    const pressed: string[] = [];
    for (let i = 0; i < rowKeys.length; ++i) {
      const buttonRow = this.buttonRows[i];
      buttonRow.buttons.forEach((bb) => {
        if (this.pressedArray.indexOf(bb.smoName) >= 0) {
          bb.buttonState = SuiButtonArrayButton.buttonState.pushed;
        } else {
          bb.buttonState = SuiButtonArrayButton.buttonState.initial;
        }
      });
    }
    this.pressedArray = pressed;
  }
  changed() {
    this.changeFlag = true;
    this.updateValues();
    this.updateControls();
    this.handleChanged();
    this.changeFlag = false;
  }
  bind() {
    const rowKeys = Object.keys(this.buttonRows);
    for (let i = 0; i < rowKeys.length; ++i) {    
      const buttonRow = this.buttonRows[i];
      buttonRow.buttons.forEach((bb) => {
        bb.bind();
      });
    }
  }
}
