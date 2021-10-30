import { htmlHelpers } from '../../../common/htmlHelpers';
import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent, DialogDefinitionOption } from './baseComponent';
declare var $: any;


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
/**
 * single-select dropdown list
 */
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