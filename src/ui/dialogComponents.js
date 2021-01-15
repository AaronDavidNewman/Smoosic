// # dbComponents - components of modal dialogs.
// eslint-disable-next-line no-unused-vars
class SuiComponentBase {
  constructor(parameters) {
    this.changeFlag = false;
    this.css = parameters.classes;
  }
  handleChanged() {
    this.changeFlag = true;
    this.dialog.changed();
    this.changeFlag = false;
  }
  // ### makeClasses
  // Allow specific dialogs to add css to components so they can
  // be conditionally displayed
  makeClasses(classes) {
    if (this.css) {
      return classes + ' ' + this.css;
    }
    return classes;
  }
}

// ## SuiRockerComponent
// A numeric input box with +- buttons.   Adjustable type and scale
// eslint-disable-next-line no-unused-vars
class SuiRockerComponent extends SuiComponentBase {
  static get dataTypes() {
    return ['int', 'float', 'percent'];
  }
  static get increments() {
    return { 'int': 1, 'float': 0.1, 'percent': 10 };
  }
  static get parsers() {
    return { 'int': '_getIntValue', 'float': '_getFloatValue', 'percent': '_getPercentValue' };
  }
  constructor(dialog, parameter) {
    super(parameter);
    smoSerialize.filteredMerge(
      ['parameterName', 'smoName', 'defaultValue', 'control', 'label', 'increment', 'type'], parameter, this);
    if (!this.defaultValue) {
      this.defaultValue = 0;
    }
    if (!this.type) {
      this.type = 'int';
    }
    if (!this.increment) {
      this.increment = SuiRockerComponent.increments[this.type];
    }
    if (SuiRockerComponent.dataTypes.indexOf(this.type) < 0) {
      throw new Error('dialog element invalid type ' + this.type);
    }

    this.id = this.id ? this.id : '';

    if (this.type === 'percent') {
      this.defaultValue = 100 * this.defaultValue;
    }
    this.parser = SuiRockerComponent.parsers[this.type];
    this.dialog = dialog;
  }

  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    const r = b('div').classes(this.makeClasses('rockerControl smoControl')).attr('id', id).attr('data-param', this.parameterName)
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
    return this.dialog.id + '-' + this.parameterName;
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
        val = self[self.parser]();
        if (self.type === 'percent') {
          val = 100 * val;
        }
        $(input).val(val + self.increment);
        self.handleChanged();
      }
    );
    $('#' + pid).find('button.decrement').off('click').on('click',
      () => {
        val = self[self.parser]();
        if (self.type === 'percent') {
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
    let val = parseFloat(this._getInputElement().val(), 10);
    val = isNaN(val) ? 1.0 : val;
    return val;
  }
  _getPercentValue() {
    let val = parseFloat(this._getInputElement().val(), 10);
    val = isNaN(val) ? 1 : val;
    return val / 100;
  }
  _setIntValue(val) {
    this._getInputElement().val(val);
  }
  setValue(value) {
    if (this.type === 'percent') {
      value = value * 100;
    }
    this._setIntValue(value);
  }
  getValue() {
    return this[this.parser]();
  }
}

// ## SuiFileDownloadComponent
// Download a test file using the file input.
// eslint-disable-next-line no-unused-vars
class SuiFileDownloadComponent extends SuiComponentBase {
  constructor(dialog, parameter) {
    super(parameter);
    smoSerialize.filteredMerge(
      ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
    if (!this.defaultValue) {
      this.defaultValue = 0;
    }
    this.dialog = dialog;
    this.value = '';
  }
  get parameterId() {
    return this.dialog.id + '-' + this.parameterName;
  }
  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    var r = b('div').classes(this.makeClasses('select-file')).attr('id', this.parameterId).attr('data-param', this.parameterName)
      .append(b('input').attr('type', 'file').classes('file-button')
        .attr('id', id + '-input')).append(
        b('label').attr('for', id + '-input').text(this.label));
    return r;
  }

  _handleUploadedFiles(evt)  {
    const reader = new FileReader();
    const self = this;
    reader.onload = (file) => {
      self.value = file.target.result;
      self.handleChanged();
    };
    reader.readAsText(evt.target.files[0]);
  }
  getValue() {
    return this.value;
  }
  bind() {
    const self = this;
    $('#' + this.parameterId).find('input').off('change').on('change', (e) => {
      self._handleUploadedFiles(e);
    });
  }
}

// ## SuiToggleComponent
// Simple on/off behavior
// eslint-disable-next-line no-unused-vars
class SuiToggleComponent extends SuiComponentBase {
  constructor(dialog, parameter) {
    super(parameter);
    smoSerialize.filteredMerge(
      ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
    if (!this.defaultValue) {
      this.defaultValue = 0;
    }
    this.dialog = dialog;
  }
  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    const r = b('div').classes(this.makeClasses('toggleControl smoControl')).attr('id', this.parameterId).attr('data-param', this.parameterName)
      .append(b('input').attr('type', 'checkbox').classes('toggleInput')
        .attr('id', id + '-input')).append(
        b('label').attr('for', id + '-input').text(this.label));
    return r;
  }
  _getInputElement() {
    const pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('input');
  }
  get parameterId() {
    return this.dialog.id + '-' + this.parameterName;
  }

  setValue(value) {
    $(this._getInputElement()).prop('checked', value);
  }
  getValue() {
    return $(this._getInputElement()).prop('checked');
  }

  bind() {
    const input = this._getInputElement();
    this.setValue(this.defaultValue);
    const self = this;
    $(input).off('change').on('change',
      () => {
        self.handleChanged();
      });
  }
}

// ## SuiToggleComponent
// Simple on/off behavior
// eslint-disable-next-line no-unused-vars
class SuiButtonComponent extends SuiComponentBase {
  constructor(dialog, parameter) {
    super(parameter);
    smoSerialize.filteredMerge(
      ['parameterName', 'smoName', 'defaultValue', 'control', 'label', 'additionalClasses', 'icon'], parameter, this);
    if (!this.defaultValue) {
      this.defaultValue = 0;
    }
    this.dialog = dialog;
  }
  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    this.icon = typeof(this.icon) === 'undefined' ? '' : this.icon;
    const r = b('div').classes(this.makeClasses('buttonControl smoControl')).attr('id', this.parameterId).attr('data-param', this.parameterName)
      .append(b('button').attr('type', 'button').classes(this.icon)
        .attr('id', id + '-input')).append(
        b('label').attr('for', id + '-input').text(this.label));
    return r;
  }
  _getInputElement() {
    var pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('button');
  }
  get parameterId() {
    return this.dialog.id + '-' + this.parameterName;
  }

  setValue() {
  }
  getValue() {
    return null;
  }

  bind() {
    const input = this._getInputElement();
    this.setValue(this.defaultValue);
    const self = this;
    $(input).off('click').on('click',
      () => {
        self.handleChanged();
      });
  }
}

// ### SuiDropdownComponent
// simple dropdown select list.
// eslint-disable-next-line no-unused-vars
class SuiDropdownComponent extends SuiComponentBase {
  constructor(dialog, parameter) {
    super(parameter);
    smoSerialize.filteredMerge(
      ['parameterName', 'smoName', 'defaultValue', 'options', 'control', 'label', 'dataType'], parameter, this);
    if (!this.defaultValue) {
      this.defaultValue = 0;
    }
    if (!this.dataType) {
      this.dataType = 'string';
    }
    this.dialog = dialog;
  }

  get parameterId() {
    return this.dialog.id + '-' + this.parameterName;
  }

  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    const r = b('div').classes(this.makeClasses('dropdownControl smoControl')).attr('id', id).attr('data-param', this.parameterName);
    const s = b('select');
    this.options.forEach((option) => {
      s.append(
        b('option').attr('value', option.value).text(option.label));
    });
    r.append(s).append(
      b('label').attr('for', id + '-input').text(this.label));
    return r;
  }

  unselect() {
    $(this._getInputElement())[0].selectedIndex = -1;
    $(this._getInputElement()).blur();
  }

  _getInputElement() {
    var pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('select');
  }
  getValue() {
    const input = this._getInputElement();
    const option = input.find('option:selected');
    let val = $(option).val();
    val = (this.dataType.toLowerCase() === 'int') ?  parseInt(val, 10) : val;
    val = (this.dataType.toLowerCase() === 'float') ?  parseFloat(val, 10) : val;
    if (typeof(val) === 'undefined') {
      val = $(input).find('option:first').val();
      $(input).find('option:first').prop('selected', true);
    }
    return val;
  }
  setValue(value) {
    const input = this._getInputElement();
    $(input).val(value);
  }

  bind() {
    const input = this._getInputElement();
    this.setValue(this.defaultValue);
    const self = this;
    $(input).off('change').on('change',
      () => {
        self.handleChanged();
      });
  }
}

// ### SuiDropdownComposite
// Dropdown component that can be part of a composite control.
// eslint-disable-next-line no-unused-vars
class SuiDropdownComposite extends SuiDropdownComponent {
  constructor(dialog, parameters) {
    super(dialog, parameters);
    this.parentControl = parameters.parentControl;
  }

  handleChanged() {
    this.changeFlag = true;
    this.parentControl.changed();
    this.changeFlag = false;
  }
}

// ### SuiToggleComposite
// Dropdown component that can be part of a composite control.
// eslint-disable-next-line no-unused-vars
class SuiToggleComposite extends SuiToggleComponent {
  constructor(dialog, parameters) {
    super(dialog, parameters);
    this.parentControl = parameters.parentControl;
  }

  handleChanged() {
    this.changeFlag = true;
    this.parentControl.changed();
    this.changeFlag = false;
  }
}

// ### SuiButtonComposite
// Dropdown component that can be part of a composite control.
// eslint-disable-next-line no-unused-vars
class SuiButtonComposite extends SuiButtonComponent {
  constructor(dialog, parameters) {
    super(dialog, parameters);
    this.parentControl = parameters.parentControl;
  }

  handleChanged() {
    this.changeFlag = true;
    this.parentControl.changed();
    this.changeFlag = false;
  }
}

// eslint-disable-next-line no-unused-vars
class SuiRockerComposite extends SuiRockerComponent {
  constructor(dialog, parameters) {
    super(dialog, parameters);
    this.parentControl = parameters.parentControl;
  }

  handleChanged() {
    this.changeFlag = true;
    this.parentControl.changed();
    this.changeFlag = false;
  }
}

// ## SuiTextInputComponent
// Just get text from an input, such as a filename.
// Note: this is HTML input, not for SVG/score editing
// eslint-disable-next-line no-unused-vars
class SuiTextInputComponent extends SuiComponentBase {
  constructor(dialog, parameter) {
    super(parameter);
    smoSerialize.filteredMerge(
      ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
    if (!this.defaultValue) {
      this.defaultValue = 0;
    }
    this.dialog = dialog;
    this.value = '';
  }
  get parameterId() {
    return this.dialog.id + '-' + this.parameterName;
  }
  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    const r = b('div').classes(this.makeClasses('text-input smoControl')).attr('id', this.parameterId).attr('data-param', this.parameterName)
      .append(b('input').attr('type', 'text').classes('file-name')
        .attr('id', id + '-input')).append(
        b('label').attr('for', id + '-input').text(this.label));
    return r;
  }

  getValue() {
    return this.value;
  }
  setValue(val) {
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

// eslint-disable-next-line no-unused-vars
class SuiTextInputComposite extends SuiTextInputComponent {
  constructor(dialog, parameters) {
    super(dialog, parameters);
    this.parentControl = parameters.parentControl;
  }

  handleChanged() {
    this.changeFlag = true;
    this.parentControl.changed();
    this.changeFlag = false;
  }
}
