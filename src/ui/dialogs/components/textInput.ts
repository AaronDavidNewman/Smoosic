import { htmlHelpers } from '../../../common/htmlHelpers';
import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent } from './baseComponent';
declare var $: any;

/**
 * parameters for text input component (simple text entry, not SVG text)
 * @category SuiDialogParams
 */
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
/**
 * Simple text input, like for a filename.  Not the text editing component.
 */
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
