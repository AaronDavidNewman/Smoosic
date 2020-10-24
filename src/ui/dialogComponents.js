// # dbComponents - components of modal dialogs.

class SuiComponentBase {
    constructor() {
        this.changeFlag = false;
    }
    handleChanged() {
        this.changeFlag = true;
        this.dialog.changed();
        this.changeFlag = false;
    }
}
// ## SuiRockerComponent
// A numeric input box with +- buttons.   Adjustable type and scale
class SuiRockerComponent extends SuiComponentBase {
	static get dataTypes() {
		return ['int','float','percent'];
	}
	static get increments() {
		return {'int':1,'float':0.1,'percent':10}
	}
	static get parsers() {
		return {'int':'_getIntValue','float':'_getFloatValue','percent':'_getPercentValue'};
	}
    constructor(dialog, parameter) {
        super();
        smoSerialize.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label','increment','type'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
		if (!this.type) {
			this.type='int';
		}
		if (!this.increment) {
		    this.increment = SuiRockerComponent.increments[this.type];
		}
		if (SuiRockerComponent.dataTypes.indexOf(this.type) < 0) {
			throw new Error('dialog element invalid type '+this.type);
		}

        this.id = this.id ? this.id : '';

		if (this.type === 'percent') {
			this.defaultValue = 100*this.defaultValue;
		}
		this.parser=SuiRockerComponent.parsers[this.type];
        this.dialog = dialog;
    }

    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('rockerControl smoControl').attr('id', id).attr('data-param', this.parameterName)
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
        var dialog = this.dialog;
        var pid = this.parameterId;
        var input = this._getInputElement();
        this.setValue(this.defaultValue);
        var self = this;
        $('#' + pid).find('button.increment').off('click').on('click',
            function (ev) {
            var val = self[self.parser]();
			if (self.type === 'percent') {
			    val = 100*val;
     		}
            $(input).val(val + self.increment);
            self.handleChanged();
        });
        $('#' + pid).find('button.decrement').off('click').on('click',
            function (ev) {
            var val = self[self.parser]();
			if (self.type === 'percent') {
			    val = 100*val;
     		}
            $(input).val(val - self.increment);
            self.handleChanged();
        });
        $(input).off('blur').on('blur',
            function (ev) {
            self.handleChanged();
        });
    }

    _getInputElement() {
        var pid = this.parameterId;
        return $(this.dialog.dgDom.element).find('#' + pid).find('input');
    }
    _getIntValue() {
        var pid = this.parameterId;
        var val = parseInt(this._getInputElement().val());
        val = isNaN(val) ? 0 : val;
        return val;
    }
	 _getFloatValue() {
        var pid = this.parameterId;
        var val = parseFloat(this._getInputElement().val());
        val = isNaN(val) ? 1.0 : val;
        return val;
    }
	_getPercentValue() {
        var pid = this.parameterId;
        var val = parseFloat(this._getInputElement().val());
        val = isNaN(val) ? 1 : val;
        return val/100;
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
class SuiFileDownloadComponent extends SuiComponentBase {
    constructor(dialog, parameter) {
        super();
        smoSerialize.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
        this.dialog = dialog;
        this.value='';
    }
    get parameterId() {
        return this.dialog.id + '-' + this.parameterName;
    }
    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('select-file').attr('id', this.parameterId).attr('data-param', this.parameterName)
            .append(b('input').attr('type', 'file').classes('file-button')
                .attr('id', id + '-input')).append(
                b('label').attr('for', id + '-input').text(this.label));
        return r;
    }

    _handleUploadedFiles(evt)  {
        var reader = new FileReader();
        var self=this;
        reader.onload = function(file) {
            self.value = file.target.result;
            self.handleChanged();
        }
        reader.readAsText(evt.target.files[0]);
    }
    getValue() {
        return this.value;
    }
    bind() {
        var self=this;
        $('#'+this.parameterId).find('input').off('change').on('change',function(e) {
            self._handleUploadedFiles(e);
        });
    }

}

// ## SuiToggleComponent
// Simple on/off behavior
class SuiToggleComponent extends SuiComponentBase {
    constructor(dialog, parameter) {
        super();
        smoSerialize.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
        this.dialog = dialog;
    }
    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('toggleControl smoControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
            .append(b('input').attr('type', 'checkbox').classes('toggleInput')
                .attr('id', id + '-input')).append(
                b('label').attr('for', id + '-input').text(this.label));
        return r;
    }
    _getInputElement() {
        var pid = this.parameterId;
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
        var dialog = this.dialog;
        var pid = this.parameterId;
        var input = this._getInputElement();
        this.setValue(this.defaultValue);
        var self = this;
        $(input).off('change').on('change',
            function (ev) {
            self.handleChanged();
        });
    }
}

// ## SuiToggleComponent
// Simple on/off behavior
class SuiButtonComponent extends SuiComponentBase {
    constructor(dialog, parameter) {
        super();
        smoSerialize.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label','additionalClasses'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
        this.dialog = dialog;
    }
    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var classNames = this['additionalClasses'] ? this['additionalClasses'] + ' buttonComponent' : 'buttonComponent';
        var r = b('div').classes('buttonControl smoControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
            .append(b('button').attr('type', 'button').classes(classNames)
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

    setValue(value) {
        return;
    }
    getValue() {
        return null;
    }

    bind() {
        var dialog = this.dialog;
        var pid = this.parameterId;
        var input = this._getInputElement();
        this.setValue(this.defaultValue);
        var self = this;
        $(input).off('click').on('click',
            function (ev) {
            self.handleChanged();
        });
    }
}

class SuiDropdownComponent  extends SuiComponentBase{
    constructor(dialog, parameter) {
        super();
        smoSerialize.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'options', 'control', 'label','dataType'], parameter, this);
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
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('dropdownControl smoControl').attr('id', id).attr('data-param', this.parameterName);
        var s = b('select');
        this.options.forEach((option) => {
            s.append(
                b('option').attr('value', option.value).text(option.label));
        });
        r.append(s).append(
            b('label').attr('for', id + '-input').text(this.label));

        return r;
    }

    _getInputElement() {
        var pid = this.parameterId;
        return $(this.dialog.dgDom.element).find('#' + pid).find('select');
    }
    getValue() {
        var input = this._getInputElement();
        var option = this._getInputElement().find('option:selected');
		var val = $(option).val();
		val = (this.dataType.toLowerCase() === 'int') ?	parseInt(val) : val;
		val = (this.dataType.toLowerCase() === 'float') ?	parseFloat(val) : val;
        return val;
    }
    setValue(value) {
        var input = this._getInputElement();
        $(input).val(value);
    }

    bind() {
        var input = this._getInputElement();
        this.setValue(this.defaultValue);
        var self = this;
        $(input).off('change').on('change',
            function (ev) {
            self.handleChanged();
        });
    }
}

// ## SuiTextInputComponent
// Just get text from an input, such as a filename.
// Note: this is HTML input, not for SVG/score editing
class SuiTextInputComponent extends SuiComponentBase {
    constructor(dialog, parameter) {
        super();
        smoSerialize.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
        this.dialog = dialog;
        this.value='';
    }
    get parameterId() {
        return this.dialog.id + '-' + this.parameterName;
    }
    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('text-input smoControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
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
        $('#'+this.parameterId).find('input').val(val);
    }
    bind() {
        var self=this;
        $('#'+this.parameterId).find('input').off('change').on('change',function(e) {
            self.value = $(this).val();
            self.handleChanged();
        });
    }
}
