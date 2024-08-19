// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent, SuiBaseComponentParams } from '../components/baseComponent';
import {  buildDom } from '../../../common/htmlHelpers';
import { SuiScoreViewOperations } from '../../../render/sui/scoreViewOperations';
import { SuiButtonComponentParams } from './button';

declare var $: any;
declare interface SuiButtonCompositeParams extends SuiButtonComponentParams {
  parentControl: SuiComponentParent
}
export class SuiButtonArrayButton extends SuiComponentBase {
  icon: string;
  classes: string;
  iButtonState: number = SuiButtonArrayButton.buttonState.initial;
  parentControl: SuiComponentParent;
  static buttonStateString: string[] = ['initial', 'pushed', 'disabled'];
  static buttonState: Record<string, number> = {
    'initial': 0, 'pushed': 1 , 'disabled': 2
  }
  constructor(dialog: SuiDialogNotifier, parameters: SuiButtonCompositeParams) {
    super(dialog, parameters);
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
  bind() {
    $(`#${this.id}`).off('click').on('click', 
      (ev: any) => {
        this.changeFlag = true;
        this.parentControl.changed();
        this.changeFlag = false;
    });
  }
}

export type getButtonsFcn = () => SuiButtonComponentParams[];
export class SuiButtonArrayComponent extends SuiComponentParent {
  view: SuiScoreViewOperations;
  buttons: SuiButtonArrayButton[] = [];
  pressed: string = '';

  constructor(dialog: SuiDialogNotifier, parameter: SuiBaseComponentParams, buttonFactory: getButtonsFcn) {
    super(dialog, parameter);
    this.dialog = dialog;
    const bparams = buttonFactory();
    bparams.forEach((bp) => {
      const param = {
        parentControl: this, ...bp
      }
      this.buttons.push(new SuiButtonArrayButton(dialog, param));
    })
    this.view = this.dialog.getView();
  }
  get html() {
    const b = buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl pitchContainer buttonArray'))
      .attr('id', this.parameterId)
    this.buttons.forEach((bb) => {
      if (bb.smoName === this.pressed) {
        bb.buttonState = SuiButtonArrayButton.buttonState.pushed;
      } else {
        bb.buttonState = SuiButtonArrayButton.buttonState.initial;
      }
      q.append(bb.html);
    });
    return q;
  }
  getValue(): string {   
    return this.pressed;
  }
  setValue(val: string) {
    this.pressed = val;
  }
  changed() {
    this.changeFlag = true;
    this.buttons.forEach((bb) => {
      if (bb.changeFlag) {
        this.pressed = bb.smoName;
        bb.buttonState = SuiButtonArrayButton.buttonState.pushed;
      } else {
        bb.buttonState = SuiButtonArrayButton.buttonState.initial;
      }
    });
    this.handleChanged();
    this.changeFlag = false;
  }
  bind() {
    this.buttons.forEach((bb) => {
      bb.bind();
    });
  }
}
const noteHeadButtonFactory:getButtonsFcn = () => {
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
