import { buildDom } from '../../../common/htmlHelpers';
import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent } from './baseComponent';
declare var $: any;

/**
 * 
 */
export interface SuiButtonComponentParams {
  id: string,
  classes: string,
  type?: string,
  increment?: number,
  text?: string,
  label: string,
  smoName: string,
  control: string,
  icon: string
}

// ## SuiToggleComponent
// Simple on/off behavior.  No value just used to notifiy parent dialog
export class SuiButtonComponent extends SuiComponentBase {
  icon: string;
  text?: string;
  constructor(dialog: SuiDialogNotifier, parameter: SuiButtonComponentParams) {
    super(dialog, parameter);
    this.dialog = dialog;
    this.icon = parameter.icon;
    this.text = parameter.text;
  }
  get html() {
    const b = buildDom;
    const id = this.parameterId;
    this.icon = typeof(this.icon) === 'undefined' ? '' : this.icon;
    if (!this.text) {
      const r = b('div').classes(this.makeClasses('buttonControl smoControl')).attr('id', this.parameterId).attr('data-param', this.smoName)
        .append(b('button').attr('type', 'button').classes(this.icon)
          .attr('id', id + '-input')).append(
          b('label').attr('for', id + '-input').attr('aria-label',this.label).text(this.label));
      return r;
    } else {
      const r = b('div').classes(this.makeClasses('buttonControl smoControl')).attr('id', this.parameterId).attr('data-param', this.smoName)
        .append(b('button').attr('type', 'button').classes(this.icon)
          .attr('id', id + '-input').append(
            b('span').classes('button-text').text(this.text)
          )).append(
          b('label').attr('for', id + '-input').attr('aria-label',this.label).text(this.label));
      return r;
    }
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

export interface SuiButtonCompositeParams {
  id: string,
  classes: string,
  type?: string,
  increment?: number,
  label: string,
  smoName: string,
  text?: string,
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
