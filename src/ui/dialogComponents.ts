// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { htmlHelpers } from '../common/htmlHelpers';
import { SuiFileInput } from './fileio/fileInput';
import { SmoModifier } from '../smo/data/score';
import { SuiScoreViewOperations } from '../render/sui/scoreViewOperations';
import { BrowserEventSource } from '../application/eventSource';
/**
 * A component is a part of a dialog box that accepts some input.
 */
declare var $: any;
/**
 * Dialogs controls options, like dropdowns
 */
export interface DialogDefinitionOption {
  label: string,
  value: number | string
}
/**
 * DialogDefinition is a JSON-like structure that each dialog has
 * to define the components.  Specific components can define
 * additional params by extending this, these are the basics.
 * @param {smoName} - the name the dialog uses to reference it 
 * @param {control} - constructor of the control
 * @param {label} - label of the element, can be translated
 * @param {increment}  - used by components that have increment arrows
 * @param {defaultValue} - thinking of removing this
 * @param {dataType} - used to narrow the type by some components
 * @param {classes} - can be used in rendering
 */
export interface DialogDefinitionElement {
  smoName: string,
  control: string,
  label: string,
  startRow?: boolean,
  options?: DialogDefinitionOption[]
  increment?: number,
  defaultValue?: number | string,
  dataType?: string,
  classes?: string,
}

export interface SuiBaseComponentParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string,
  parentComponent?: SuiComponentParent
}
/**
 * components know about their parent dialog via the 
 * DialogNotifier interface.  It allows a component to 
 * notify parent of changing contents.
 */
export abstract class SuiDialogNotifier {
  abstract changed(): void;
  abstract getId(): string;
  abstract get dgDom(): any;
  abstract getView(): SuiScoreViewOperations;
  abstract getModifier(): SmoModifier | null;
  abstract getStaticText(): Record<string, string>;
  abstract getEventSource(): BrowserEventSource;
}
// # dbComponents - components of modal dialogs.
export abstract class SuiComponentBase {
  changeFlag: boolean = false;
  css: string;
  dialog: SuiDialogNotifier;
  id: string;
  label: string;
  control: string;
  smoName: string;
  constructor(dialog: SuiDialogNotifier, parameters: SuiBaseComponentParams) {
    this.changeFlag = false;
    this.css = parameters.classes;
    this.dialog = dialog;
    this.id = parameters.id;
    this.label = parameters.label;
    this.control = parameters.control;
    this.smoName = parameters.smoName;
  }
  abstract bind(): void;
  abstract get html(): any;
  handleChanged() {
    this.changeFlag = true;
    this.dialog.changed();
    this.changeFlag = false;
  }
  // ### makeClasses
  // Allow specific dialogs to add css to components so they can
  // be conditionally displayed
  makeClasses(classes: string) {
    if (this.css) {
      return classes + ' ' + this.css;
    }
    return classes;
  }
  get parameterId() {
    return this.dialog.getId() + '-' + this.smoName;
  }
  show() {
    $('#' + this.parameterId).removeClass('hide');
  }
  hide() {
    $('#' + this.parameterId).addClass('hide');
  }
}

export abstract class SuiComponentParent extends SuiComponentBase {
  abstract changed(): void;
}

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
// ## SuiRockerComponent
// A numeric input box with +- buttons.   Adjustable type and scale
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
    if (this.dataType === 'percent') {
      this.defaultValue = 100 * this.defaultValue;
    }
    this.parser = SuiRockerComponent.parsers[this.dataType];
    this.dialog = dialog;
  }

  get html() {
    const b = htmlHelpers.buildDom;
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
    return this.dialog.getId() + '-' + this.smoName;
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

export interface SuiFileDownloadComponentParams {
  id: string,
  classes: string,
  type?: string,
  increment?: number,
  defaultValue: string,
  label: string,
  smoName: string,
  control: string
}
// ## SuiFileDownloadComponent
// Download a test file using the file input.
export class SuiFileDownloadComponent extends SuiComponentBase {
  defaultValue: string;
  value: string = '';
  constructor(dialog: SuiDialogNotifier, parameter: SuiFileDownloadComponentParams) {
    super(dialog, parameter);
    this.defaultValue = parameter.defaultValue ?? '';
    this.dialog = dialog;
  }
  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    var r = b('div').classes(this.makeClasses('select-file')).attr('id', this.parameterId).attr('data-param', this.smoName)
      .append(b('input').attr('type', 'file').classes('file-button')
        .attr('id', id + '-input')).append(
        b('label').attr('for', id + '-input').text(this.label));
    return r;
  }
  _handleUploadedFiles(evt: any)  {
    const localFile = new SuiFileInput(evt);
    localFile.loadAsync().then(() => {
      this.value = localFile.value;
      this.handleChanged();
    });
  }
  getValue() {
    return this.value;
  }
  bind() {
    const self = this;
    $('#' + this.parameterId).find('input').off('change').on('change', (e: any) => {
      self._handleUploadedFiles(e);
    });
  }
}
export interface SuiToggleComponentParams {
  id: string,
  classes: string,
  type?: string,
  increment?: number,
  label: string,
  smoName: string,
  control: string
}
// ## SuiToggleComponent
// Simple on/off behavior
export class SuiToggleComponent extends SuiComponentBase {
  defaultValue: boolean = false;
  constructor(dialog: SuiDialogNotifier, parameter: SuiToggleComponentParams) {
    super(dialog, parameter);
    this.defaultValue = false;
    this.dialog = dialog;
  }
  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    const r = b('div').classes(this.makeClasses('toggleControl smoControl')).attr('id', this.parameterId).attr('data-param', this.smoName)
      .append(b('input').attr('type', 'checkbox').classes('toggleInput')
        .attr('id', id + '-input')).append(
        b('label').attr('for', id + '-input').text(this.label));
    return r;
  }
  _getInputElement() {
    const pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('input');
  }
  setValue(value: boolean) {
    $(this._getInputElement()).prop('checked', value);
  }
  getValue() {
    return $(this._getInputElement()).prop('checked');
  }

  bind() {
    const input = this._getInputElement();
    this.setValue(this.defaultValue);
    $(input).off('change').on('change',
      () => {
        this.handleChanged();
      });
  }
}
export interface SuiButtonComponentParams {
  id: string,
  classes: string,
  type?: string,
  increment?: number,
  label: string,
  smoName: string,
  control: string,
  icon: string
}
// ## SuiToggleComponent
// Simple on/off behavior.  No value just used to notifiy parent dialog
export class SuiButtonComponent extends SuiComponentBase {
  icon: string;
  constructor(dialog: SuiDialogNotifier, parameter: SuiButtonComponentParams) {
    super(dialog, parameter);
    this.dialog = dialog;
    this.icon = parameter.icon;
  }
  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    this.icon = typeof(this.icon) === 'undefined' ? '' : this.icon;
    const r = b('div').classes(this.makeClasses('buttonControl smoControl')).attr('id', this.parameterId).attr('data-param', this.smoName)
      .append(b('button').attr('type', 'button').classes(this.icon)
        .attr('id', id + '-input')).append(
        b('label').attr('for', id + '-input').text(this.label));
    return r;
  }
  _getInputElement() {
    var pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('button');
  }
  setValue() {
  }
  getValue() {
    return null;
  }
  bind() {
    const input = this._getInputElement();
    $(input).off('click').on('click',
      () => {
        this.handleChanged();
      });
  }
}
export interface SuiDropdownComponentParams {
  id: string,
  classes: string,
  type?: string,
  increment?: number,
  label: string,
  smoName: string,
  control: string,
  disabledOption?: string,
  defaultValue: string | number,
  dataType?: string,
  options?: DialogDefinitionOption[]
}
// ### SuiDropdownComponent
// simple dropdown select list.
export class SuiDropdownComponent extends SuiComponentBase {
  options: DialogDefinitionOption[];
  disabledOption: string;
  dataType: string;
  defaultValue: string | number;
  value: string = '';
  constructor(dialog: SuiDialogNotifier, parameter: SuiDropdownComponentParams) {
    super(dialog, parameter);
    this.options = parameter.options!;
    this.disabledOption = parameter.disabledOption ?? '';
    this.dataType = parameter.dataType ?? 'string';
    this.defaultValue = parameter.defaultValue;
  }
  checkDefault(s: any, b: any) {
    if (this.disabledOption.length) {
      s.prop('required', true).append(b('option').attr('selected', 'selected').prop('disabled', true).text(this.disabledOption));
    }
  }

  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    const r = b('div').classes(this.makeClasses('dropdownControl smoControl')).attr('id', id).attr('data-param', this.smoName);
    const s = b('select');
    this.checkDefault(s, b);
    this.options.forEach((option) => {
      s.append(
        b('option').attr('value', option.value).text(option.label));
    });
    r.append(s).append(
      b('label').attr('for', id + '-input').text(this.label));
    return r;
  }
  replaceOptions(options: DialogDefinitionOption[]) {
    const b = htmlHelpers.buildDom;
    const s = b('select');
    const sel = this._getInputElement();
    const parent = $(sel).parent();
    $(sel).remove();
    this.checkDefault(s, b);
    options.forEach((option) => {
      s.append(b('option').attr('value', option.value).text(option.label));
    });
    $(parent).append(s.dom());
    this.bind();
  }

  unselect() {
    $(this._getInputElement())[0].selectedIndex = -1;
    $(this._getInputElement()).blur();
  }

  _getInputElement() {
    var pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('select');
  }
  getValue(): string | number {
    const input = this._getInputElement();
    const option = input.find('option:selected');
    let val = $(option).val();
    val = (this.dataType.toLowerCase() === 'int') ?  parseInt(val, 10) : val;
    val = (this.dataType.toLowerCase() === 'float') ?  parseFloat(val) : val;
    if (typeof(val) === 'undefined') {
      val = $(input).find('option:first').val();
      $(input).find('option:first').prop('selected', true);
    }
    return val;
  }
  setValue(value: string | number) {
    const input = this._getInputElement();
    $(input).val(value);
  }

  bind() {
    const input = this._getInputElement();
    if (!this.disabledOption) {
      this.setValue(this.defaultValue);
    }
    const self = this;
    $(input).off('change').on('change',
      () => {
        self.handleChanged();
      });
  }
}
export interface SuiDropdownCompositeParams {
  id: string,
  classes: string,
  type?: string,
  increment?: number,
  label: string,
  smoName: string,
  control: string,
  disabledOption?: string,
  defaultValue: string | number,
  dataType?: string,
  options?: DialogDefinitionOption[],
  parentControl: SuiComponentParent
}
// ### SuiDropdownComposite
// Dropdown component that can be part of a composite control.
export class SuiDropdownComposite extends SuiDropdownComponent {
  parentControl: SuiComponentParent;
  constructor(dialog: SuiDialogNotifier, parameters: SuiDropdownCompositeParams) {
    super(dialog, parameters);
    this.parentControl = parameters.parentControl;
  }

  handleChanged() {
    this.changeFlag = true;
    this.parentControl.changed();
    this.changeFlag = false;
  }
}
export interface SuiToggleCompositeParams {
  id: string,
  classes: string,
  type?: string,
  increment?: number,
  label: string,
  smoName: string,
  control: string,
  disabledOption?: string,
  defaultValue?: string | number,
  dataType?: string,
  parentControl: SuiComponentParent
}
// ### SuiToggleComposite
// Dropdown component that can be part of a composite control.
export class SuiToggleComposite extends SuiToggleComponent {
  parentControl: SuiComponentParent;
  constructor(dialog: SuiDialogNotifier, parameters: SuiToggleCompositeParams) {
    super(dialog, parameters);
    this.parentControl = parameters.parentControl;
  }

  handleChanged() {
    this.changeFlag = true;
    this.parentControl.changed();
    this.changeFlag = false;
  }
}

export interface SuiButtonCompositeParams {
  id: string,
  classes: string,
  type?: string,
  increment?: number,
  label: string,
  smoName: string,
  control: string,
  icon: string,
  parentControl: SuiComponentParent
}
// ### SuiButtonComposite
// Dropdown component that can be part of a composite control.
export class SuiButtonComposite extends SuiButtonComponent {
 parentControl: SuiComponentParent;
  constructor(dialog: SuiDialogNotifier, parameters: SuiButtonCompositeParams) {
    super(dialog, parameters);
    this.parentControl = parameters.parentControl;
  }

  handleChanged() {
    this.changeFlag = true;
    this.parentControl.changed();
    this.changeFlag = false;
  }
}
export interface SuiRockerCompositeParams {
  id: string,
  classes: string,
  type?: string,
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
export interface SuiTextInputComponentParams {
  id: string,
  classes: string,
  type?: string,
  increment?: number,
  defaultValue: string,
  label: string,
  smoName: string,
  control: string
}
// ## SuiTextInputComponent
// Just get text from an input, such as a filename.
// Note: this is HTML input, not for SVG/score editing
export class SuiTextInputComponent extends SuiComponentBase {
  defaultValue: string = '';
  value: string = '';
  constructor(dialog: SuiDialogNotifier, parameter: SuiTextInputComponentParams) {
    super(dialog, parameter);

    this.dialog = dialog;
    this.value = '';
  }
  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    const r = b('div').classes(this.makeClasses('text-input smoControl')).attr('id', this.parameterId).attr('data-param', this.smoName)
      .append(b('input').attr('type', 'text').classes('file-name')
        .attr('id', id + '-input')).append(
        b('label').attr('for', id + '-input').text(this.label));
    return r;
  }

  getValue() {
    return this.value;
  }
  setValue(val: string) {
    this.value = val;
    $('#' + this.parameterId).find('input').val(val);
  }
  _getInputElement() {
    const pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('input');
  }
  bind() {
    const self = this;
    $('#' + this.parameterId).find('input').off('change').on('change', () => {
      self.value = $(this._getInputElement()).val();
      self.handleChanged();
    });
  }
}
export interface SuiTextInputCompositeParams {
  id: string,
  classes: string,
  type?: string,
  increment?: number,
  defaultValue: string,
  label: string,
  smoName: string,
  control: string
  parentControl: SuiComponentParent
}
export class SuiTextInputComposite extends SuiTextInputComponent {
  parentControl: SuiComponentParent;
  constructor(dialog: SuiDialogNotifier, parameters: SuiTextInputCompositeParams) {
    super(dialog, parameters);
    this.parentControl = parameters.parentControl;
  }

  handleChanged() {
    this.changeFlag = true;
    this.parentControl.changed();
    this.changeFlag = false;
  }
}
