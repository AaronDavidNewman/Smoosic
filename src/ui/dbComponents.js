// # dbComponents - components of modal dialogs.

// ## SuiRockerComponent
// ## An integer input box with +- buttons.
class SuiRockerComponent {
	constructor(dialog,parameter) {
		smoMusic.filteredMerge(
		['parameterName','smoName','defaultValue','control','label'],parameter,this);
		if (!this.defaultValue) {
			this.defaultValue=0;
		}
		this.dialog=dialog;
	}
	
	get html() {
        var b = htmlHelpers.buildDom;
		var id=this.parameterId;
        var r = b('div').classes('rockerControl').attr('id', id).attr('data-param', this.parameterName)
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
	
	bind() {
		var dialog = this.dialog;
        var pid = this.parameterId;
        var input = this._getInputElement();
		this.setValue(this.defaultValue);
		var self=this;
        $('#' + pid).find('button.increment').off('click').on('click',
            function (ev) {
            var val = self._getIntValue();
            $(input).val(val + 1);
            dialog.changed();
        });
        $('#' + pid).find('button.decrement').off('click').on('click',
            function (ev) {
            var val = self._getIntValue();
            $(input).val(val - 1);
            dialog.changed();
        });
        $(input).off('blur').on('blur',
            function (ev) {
            dialog.changed();
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
    _setIntValue(val) {
        this._getInputElement().val(val);
    }
	setValue(value) {
		this._setIntValue(value);
	}
	getValue() {
		return this._getIntValue();
	}
}

class SuiToggleComponent {
	constructor(dialog,parameter) {
		smoMusic.filteredMerge(
		['parameterName','smoName','defaultValue','control','label'],parameter,this);
		if (!this.defaultValue) {
			this.defaultValue=0;
		}
		this.dialog=dialog;
	}
	html(id, parameterName, label) {
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('toggleControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
            .append(b('input').attr('type', 'checkbox').classes('toggleInput')
                .attr('id', id + '-input').append(
                    b('label').attr('for', id + '-input').text(this.label)));
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
		$(this._getInputElement).prop('checked',value);
	}
	getValue() {
		return $(this._getInputElement).prop('checked');
	}
	
	bind() {
		var dialog = this.dialog;
        var pid = this.parameterId;
        var input = this._getInputElement();
		this.setValue(this.defaultValue);
		var self=this;       
        $(input).off('changed').on('changed',
            function (ev) {
            dialog.changed();
        });
	}	
}

class SuiDropdownComponent {
	constructor(dialog,parameter) {
		smoMusic.filteredMerge(
		['parameterName','smoName','defaultValue','options','control','label'],parameter,this);
		if (!this.defaultValue) {
			this.defaultValue=0;
		}
		this.dialog=dialog;
	}
	html() {
        var b = htmlHelpers.buildDom;
		var id=this.parameterId;
        var r = b('div').classes('dropdownControl').attr('id', id).attr('data-param', this.parameterName)
            .append(b('label').attr('for', id + '-input').text(this.label))
            .append(b('select').classes('dropdownSelect').attr('id', id + '-input'));
		this.options.forEach((option) => {
			r.append(
			  b('option').attr('value',option.value).text(option.label));
			  
		});
        return r;
    }
	
	_getInputElement() {
        var pid = this.parameterId;
        return $(this.dialog.dgDom.element).find('#' + pid).find('select');
    }
	getValue() {
		var input = this._getInputElement();
		var option = this._getInputElement().find('option:selected');
		return $(option).val();
	}
	setValue(value) {
     	var input = this._getInputElement();
		$(input).val(value);		
	}
	
	bind() {
		var dialog = this.dialog;
        var pid = this.parameterId;
        var input = this._getInputElement();
		this.setValue(this.defaultValue);
		var self=this;       
        $(input).off('changed').on('changed',
            function (ev) {
            dialog.changed();
        });
	}
}