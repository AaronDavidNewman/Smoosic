class CheckboxDropdownComponent extends SuiComponentBase {
  // { dropdownElement: {...}, toggleElement: }
  constructor(dialog, parameter) {
    super(parameter);
    smoSerialize.filteredMerge(
      ['parameterName', 'smoName', 'defaultValue', 'options', 'control', 'label', 'dataType'], parameter, this);
    this.dialog = dialog;
    parameter.toggleElement.parentControl = this;
    parameter.dropdownElement.parentControl = this;
    this.toggleCtrl = new SuiToggleComposite(this.dialog, parameter.toggleElement);
    this.dropdownCtrl = new SuiDropdownComposite(this.dialog, parameter.dropdownElement);
  }
  get html() {
    const b = htmlHelpers.buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl checkboxDropdown'))
      .attr('id',this.parameterId);
    q.append(this.toggleCtrl.html);
    q.append(this.dropdownCtrl.html);
    return q;
  }
  get parameterId() {
    return this.dialog.id + '-' + this.parameterName;
  }
  bind() {
    this.toggleCtrl.bind();
    this.dropdownCtrl.bind();
  }
  changed() {
    if (this.toggleCtrl.getValue()) {
      $('#'+this.parameterId).addClass('checked');
    } else {
      $('#'+this.parameterId).removeClass('checked');
    }
    this.handleChanged();
  }
}

class StaffAddRemoveComponent extends SuiComponentBase {
  get parameterId() {
    return this.dialog.id + '-' + this.parameterName;
  }
  constructor(dialog, parameter) {
    let i = 0;
    super(parameter);
    smoSerialize.filteredMerge(
      ['parameterName', 'smoName', 'defaultValue', 'options', 'control', 'label', 'dataType'], parameter, this);

    this.dialog = dialog;
    this.view = this.dialog.view;
    this.createdShell = false;
    this.staffRows = [];
    this.label = SuiDialogBase.getStaticText(SuiStaffGroupDialog.dialogElements, 'includeStaff');
  }
  setControlRows() {
    let i = this.modifier.startSelector.staff;
    this.staffRows = [];
    this.view.storeScore.staves.forEach((staff) => {
      const name = this.label + ' ' + (staff.staffId + 1);
      const id = 'show-' + i;
      // Toggle add of last row + 1
      if (staff.staffId === this.modifier.endSelector.staff + 1) {
        const rowElement = new SuiToggleComposite(this.dialog, {
          smoName: id,
          parameterName: id,
          defaultValue: false,
          classes: 'toggle-add-row',
          control: 'SuiToggleComponent',
          label: name
        });
        rowElement.parentControl = this;
        this.staffRows.push({
          showCtrl: rowElement
        });
      } else if (staff.staffId > this.modifier.startSelector.staff &&
        staff.staffId === this.modifier.endSelector.staff) {
          // toggle remove of ultimate row, other than first row
          const rowElement = new SuiToggleComposite(this.dialog, {
            smoName: id,
            parameterName: id,
            defaultValue: true,
            classes: 'toggle-remove-row',
            control: 'SuiToggleComponent',
            label: name
          });
        rowElement.parentControl = this;
        this.staffRows.push({
          showCtrl: rowElement
        });
      } else if ((staff.staffId <= this.modifier.endSelector.staff) &&
        (staff.staffId >= this.modifier.startSelector.staff))
      {
        // toggle remove of ultimate row, other than first row
        const rowElement = new SuiToggleComponent(this.dialog, {
          smoName: id,
          parameterName: id,
          defaultValue: true,
          classes: 'toggle-disabled',
          control: 'SuiToggleComponent',
          label: name
        });
      rowElement.parentControl = this;
      this.staffRows.push({
        showCtrl: rowElement
      });
      }
      i += 1;
    });
  }
  get html() {
    const b = htmlHelpers.buildDom;
    // a little hacky.  The first time we create an empty html shell for the control
    // subsequent times, we fill the html with the row information
    if (!this.createdShell) {
      this.createdShell = true;
      const q = b('div').classes(this.makeClasses('multiControl smoControl staffContainer')).attr('id',this.parameterId);
      return q;
    } else {
      const q = b('div').classes(this.makeClasses('smoControl'));
      this.staffRows.forEach((row) => {
        q.append(row.showCtrl.html);
      });
      return q;
    }
  }
  getInputElement() {
    var pid = this.parameterId;
    return $('#' + pid);
  }
  getValue() {
    let nextStaff = this.modifier.startSelector.staff;
    let i = 0;
    const maxMeasure = this.modifier.endSelector.measure;
    const maxStaff = this.modifier.endSelector.staff;
    this.modifier.endSelector = JSON.parse(JSON.stringify(this.modifier.startSelector));
    this.staffRows.forEach((staffRow) => {
      if (this.staffRows[i].showCtrl.getValue()) {
        this.modifier.endSelector = { staff: nextStaff, measure: maxMeasure };
        nextStaff += 1;
      }
      i += 1;
    });
    return this.modifier;
  }
  setValue(staffGroup) {
    this.modifier = staffGroup; // would this be used?
    this.setControlRows();
  }
  changed() {
    this.getValue(); // update modifier
    this.handleChanged();
    this.setControlRows();
  }
  bind() {
    this.staffRows.forEach((row) => {
      row.showCtrl.bind();
    });
  }
}

class StaffCheckComponent extends SuiComponentBase {
  constructor(dialog, parameter) {
    let i = 0;
    super(parameter);
    smoSerialize.filteredMerge(
      ['parameterName', 'smoName', 'defaultValue', 'options', 'control', 'label', 'dataType'], parameter, this);
    this.dialog = dialog;
    this.view = this.dialog.view;
    this.staffRows = [];
    this.view.storeScore.staves.forEach((staff) => {
      const name = 'View Staff ' + (i + 1);
      const id = 'show-' + i;
      const rowElement = new SuiToggleComponent(this.dialog, {
        smoName: id,
        parameterName: id,
        defaultValue: true,
        classes: 'hide-when-editing',
        control: 'SuiToggleComponent',
        label: name
      });
      this.staffRows.push({
        showCtrl: rowElement
      });
      i += 1;
    });
  }
  get html() {
    const b = htmlHelpers.buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl staffContainer'));
    this.staffRows.forEach((row) => {
      q.append(row.showCtrl.html);
    });
    return q;
  }
  // Is this used for compound controls?
  _getInputElement() {
    var pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('.staffContainer');
  }
  getValue() {
    const rv = [];
    let i = 0;
    for (i = 0;i < this.staffRows.length; ++i) {
      const show = this.staffRows[i].showCtrl.getValue();
      rv.push({show: show});
    }
    return rv;
  }
  setValue(rows) {
    let i = 0;
    rows.forEach((row) => {
      this.staffRows[i].showCtrl.setValue(row.show);
      i += 1;
    });
  }
  changed() {
    this.handleChanged();
  }
  bind() {
    this.staffRows.forEach((row) => {
      row.showCtrl.bind();
    });
  }
}

class TextCheckComponent extends SuiComponentBase {
  constructor(dialog, parameter) {
    super(parameter);
    smoSerialize.filteredMerge(
      ['parameterName', 'smoName', 'defaultValue', 'options', 'control', 'label', 'dataType'], parameter, this);
    this.dialog = dialog;
    this.view = this.dialog.view;
    const toggleName = this.smoName + 'Toggle';
    const textName = this.smoName + 'Text';
    const label = this.dialog.staticText[textName];
    const show = this.dialog.staticText['show'];
    this.toggleCtrl = new SuiToggleComposite(this.dialog, {
      smoName: toggleName,
      parameterName: toggleName,
      defaultValue: false,
      control: 'SuiToggleComposite',
      label: show,
      parentControl: this
    });
    this.textCtrl = new SuiTextInputComposite(this.dialog, {
      smoName: textName,
      parameterName: textName,
      defaultValue: this.defaultValue,
      control: 'SuiTextInputComposite',
      label: label,
      parentControl: this
    });
  }
  get html() {
    const b = htmlHelpers.buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl textCheckContainer'))
      .attr('id',this.parameterId);
    q.append(this.textCtrl.html);
    q.append(this.toggleCtrl.html);
    return q;
  }
  getInputElement() {
    var pid = this.parameterId;
    return $('#' + pid);
  }
  getValue() {
    return {
      checked: this.toggleCtrl.getValue(),
      text: this.textCtrl.getValue()
    }
  }
  setValue(val) {
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
