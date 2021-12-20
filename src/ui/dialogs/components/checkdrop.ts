import { SuiDialogNotifier, DialogDefinitionElement, SuiComponentParent } from '../components/baseComponent';
import { SuiToggleCompositeParams, SuiToggleComposite } from '../components/toggle';
import { SuiDropdownCompositeParams, SuiDropdownComposite } from '../components/dropdown';

import { buildDom } from '../../../common/htmlHelpers';
declare var $: any;
  
export interface CheckboxDropdownComponentParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string,
  toggleElement: DialogDefinitionElement,
  dropdownElement: DialogDefinitionElement
}

// ## CheckboxDropdownComponent
// A checkbox that enables a dropdown component, for optional or dependent parameter
export class CheckboxDropdownComponent extends SuiComponentParent {
  // { dropdownElement: {...}, toggleElement: }
  toggleCtrl: SuiToggleComposite;
  dropdownCtrl: SuiDropdownComposite;
  constructor(dialog: SuiDialogNotifier, parameter: CheckboxDropdownComponentParams) {
    super(dialog, parameter);
    const toggleParams: SuiToggleCompositeParams = {
      id: this.id + parameter.toggleElement.smoName,
      classes: '',
      parentControl: this,
      ...parameter.toggleElement
    }
    const dropdownParams: SuiDropdownCompositeParams = {
      id: this.id + parameter.dropdownElement.smoName,
      classes: '',
      defaultValue: '',
      parentControl: this,
      ...parameter.dropdownElement
    }
    this.toggleCtrl = new SuiToggleComposite(this.dialog, toggleParams);
    this.dropdownCtrl = new SuiDropdownComposite(this.dialog, dropdownParams);
  }
  get html() {
    const b = buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl checkboxDropdown'))
      .attr('id', this.parameterId);
    q.append(this.toggleCtrl.html);
    q.append(this.dropdownCtrl.html);
    return q;
  }

  bind() {
    this.toggleCtrl.bind();
    this.dropdownCtrl.bind();
  }
  changed() {
    if (this.toggleCtrl.getValue()) {
      $('#' + this.parameterId).addClass('checked');
    } else {
      $('#' + this.parameterId).removeClass('checked');
    }
    this.handleChanged();
  }
}
