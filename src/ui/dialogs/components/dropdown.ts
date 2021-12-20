// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Classes to support dropdown compontents
 * @module /ui/dialogs/components/dropdown
 */
import { buildDom } from '../../../common/htmlHelpers';
import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent, DialogDefinitionOption } from './baseComponent';
declare var $: any;

/**
 * constructor params for {@link SuiDropdownComponent}
 * @param id id in DOM
 * @param classes
 * @param type indicates the data type of the value
 * @param increment not used
 * @param label
 * @param smoName variable name in dialog/adapter
 * @param control name of constructor
 * @param disabledOption
 * @category SuiDialogParams
 */
export interface SuiDropdownComponentParams {
  id: string,
  classes: string,
  increment?: number,
  label: string,
  smoName: string,
  control: string,
  disabledOption?: string,
  dataType?: string,
  options?: DialogDefinitionOption[]
}
/**
 * single-select dropdown list
 * @category SuiDialog
 */
export class SuiDropdownComponent extends SuiComponentBase {
  options: DialogDefinitionOption[];
  disabledOption: string;
  dataType: string;
  value: string = '';
  constructor(dialog: SuiDialogNotifier, parameter: SuiDropdownComponentParams) {
    super(dialog, parameter);
    this.options = parameter.options!;
    this.disabledOption = parameter.disabledOption ?? '';
    this.dataType = parameter.dataType ?? 'string';
  }
  checkDefault(s: any, b: any) {
    if (this.disabledOption.length) {
      s.prop('required', true).append(b('option').attr('selected', 'selected').prop('disabled', true).text(this.disabledOption));
    }
  }

  get html() {
    const b = buildDom;
    const id = this.parameterId;
    const r = b('div').classes(this.makeClasses('dropdownControl smoControl')).attr('id', id).attr('data-param', this.smoName);
    const s = b('select');
    this.checkDefault(s, b);
    this.options.forEach((option) => {
      s.append(
        b('option').attr('value', option.value.toString()).text(option.label));
    });
    r.append(s).append(
      b('label').attr('for', id + '-input').text(this.label));
    return r;
  }
  replaceOptions(options: DialogDefinitionOption[]) {
    const b = buildDom;
    const s = b('select');
    const sel = this._getInputElement();
    const parent = $(sel).parent();
    $(sel).remove();
    this.checkDefault(s, b);
    options.forEach((option) => {
      s.append(b('option').attr('value', option.value.toString()).text(option.label));
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
    const self = this;
    $(input).off('change').on('change',
      () => {
        self.handleChanged();
      });
  }
}
/**
 * constructor params for {@link SuiDropdownComposite}
 * element, often a checkbox
 * @param {id} - unique ID for the control DOM
 * @param {classes} - additional classes for styling added to DOM
 * @param {label} - default label for the component
 * @param {smoName} - the variable in the dialog that the componenet maps to
 * @param {control} - the constructor of the UI control
 * @param {parentComponent} - for composite components, the top-level
 * @category SuiDialogParams
 * */
export interface SuiDropdownCompositeParams {
  id: string,
  classes: string,
  type?: string,
  increment?: number,
  label: string,
  smoName: string,
  control: string,
  disabledOption?: string,
  dataType?: string,
  options?: DialogDefinitionOption[],
  parentControl: SuiComponentParent
}
/**
 * A dropdown composite mixes a dropdown with some other 
 * @category SuiDialog
 */
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