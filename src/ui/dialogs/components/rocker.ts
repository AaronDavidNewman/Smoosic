// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * @module /ui/dialog/components/rocker
 * **/
 import { buildDom } from '../../../common/htmlHelpers';
import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent } from './baseComponent';

declare var $: any;

/**
 * Basic dialog component info.
 * @category SuiDialogParams
 */
export interface SuiRockerComponentParams {
  id: string,
  classes: string,
  dataType?: string,
  increment?: number,
  defaultValue: number,
  label: string,
  smoName: string,
  control: string
}

/**
 * A numeric input box with +- buttons.   Adjustable type and scale
 * */
export class SuiRockerComponent extends SuiComponentBase {
  static get dataTypes() {
    return ['int', 'float', 'percent'];
  }
  static get increments(): Record<string, number> {
    return { 'int': 1, 'float': 0.1, 'percent': 10 };
  }
  static get parsers(): Record<string, string> {
    return { 'int': '_getIntValue', 'float': '_getFloatValue', 'percent': '_getPercentValue' };
  }
  defaultValue: number = 0;
  dataType: string;
  increment: number = 1;
  parser: string;
  constructor(dialog: SuiDialogNotifier, params: SuiRockerComponentParams) {
    super(dialog, params);
    this.dataType = params.dataType ?? 'int';
    this.increment = params.increment ?? SuiRockerComponent.increments[this.dataType];
    this.defaultValue = params.defaultValue ?? 0;
    if (SuiRockerComponent.dataTypes.indexOf(this.dataType) < 0) {
      throw new Error('dialog element invalid type ' + this.dataType);
    }
    if (this.dataType === 'int' && this.increment < 1) {
      throw new Error('int component with decimal increment');
    }
    if (this.dataType === 'percent') {
      this.defaultValue = 100 * this.defaultValue;
    }
    this.parser = SuiRockerComponent.parsers[this.dataType];
    this.dialog = dialog;
  }

  get html() {
    const b = buildDom;
    const id = this.parameterId;
    const r = b('div').classes(this.makeClasses('rockerControl smoControl')).attr('id', id).attr('data-param', this.smoName)
      .append(
        b('button').classes('increment').append(
          b('span').classes('icon icon-circle-up'))).append(
        b('button').classes('decrement').append(
          b('span').classes('icon icon-circle-down'))).append(
        b('input').attr('type', 'text').classes('rockerInput')
          .attr('id', id + '-input')).append(
        b('label').attr('for', id + '-input').text(this.label));
    return r;
  }

  get parameterId() {
    return this.id;
  }
  handleChange() {
    this.changeFlag = true;
    this.dialog.changed();
    this.changeFlag = false;
  }

  bind() {
    const pid = this.parameterId;
    const input = this._getInputElement();
    let val = 0;
    this.setValue(this.defaultValue);
    const self = this;
    $('#' + pid).find('button.increment').off('click').on('click',
      () => {
        val = (this as any)[this.parser]();
        if (self.dataType === 'percent') {
          val = 100 * val;
        }
        $(input).val(val + self.increment);
        self.handleChanged();
      }
    );
    $('#' + pid).find('button.decrement').off('click').on('click',
      () => {
        val = (this as any)[this.parser]();
        if (self.dataType === 'percent') {
          val = 100 * val;
        }
        $(input).val(val - self.increment);
        self.handleChanged();
      }
    );
    $(input).off('blur').on('blur',
      () => {
        self.handleChanged();
      }
    );
  }

  _getInputElement() {
    const pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('input');
  }
  _getIntValue() {
    let val = parseInt(this._getInputElement().val(), 10);
    val = isNaN(val) ? 0 : val;
    return val;
  }
  _getFloatValue() {
    let val = parseFloat(this._getInputElement().val());
    val = isNaN(val) ? 1.0 : val;
    return val;
  }
  _getPercentValue() {
    let val = parseFloat(this._getInputElement().val());
    val = isNaN(val) ? 1 : val;
    return val / 100;
  }
  _setIntValue(val: string | number) {
    this._getInputElement().val(val);
  }
  setValue(value: number) {
    if (this.dataType === 'percent') {
      value = value * 100;
    }
    this._setIntValue(value);
  }
  getValue() {
    return (this as any)[this.parser]();
  }
}
/**
 * Create rocker composite
 * @param{id}
 */
export interface SuiRockerCompositeParams {
  id: string,
  classes: string,
  dataType?: string,
  increment?: number,
  defaultValue: number,
  label: string,
  smoName: string,
  control: string,
  parentControl: SuiComponentParent
}
export class SuiRockerComposite extends SuiRockerComponent {
  parentControl: SuiComponentParent;
  constructor(dialog: SuiDialogNotifier, parameters: SuiRockerCompositeParams) {
    super(dialog, parameters);
    this.parentControl = parameters.parentControl;
  }

  handleChanged() {
    this.changeFlag = true;
    this.parentControl.changed();
    this.changeFlag = false;
  }
}
