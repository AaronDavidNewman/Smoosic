// # dbComponents - components of modal dialogs.

// ## SuiRockerComponent
// A numeric input box with +- buttons.   Adjustable type and scale
class SuiRockerComponent {
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
        smoMusic.filteredMerge(
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
            dialog.changed();
        });
        $('#' + pid).find('button.decrement').off('click').on('click',
            function (ev) {
            var val = self[self.parser]();
			if (self.type === 'percent') {
			    val = 100*val;
     		}
            $(input).val(val - self.increment);
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

// ## SuiDragText
// A component that lets you drag the text you are editing to anywhere on the score.
// The text is not really part of the dialog but the location of the text appears 
// in other dialog fields. 
class SuiDragText {
    constructor(dialog,parameter) {
        smoMusic.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
        this.dragging=false;

        this.dialog = dialog;
        this.value='';        
    }
    
    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('cbDragTextDialog smoControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
            .append(b('button').attr('type', 'checkbox').classes('toggleTextEdit')
                .attr('id', id + '-input').append(
                b('span').classes('icon icon-move'))
                .append(
                b('label').attr('for', id + '-input').text(this.label)));
        return r;
    }
    get parameterId() {
        return this.dialog.id + '-' + this.parameterName;
    }
    endSession() {
        $('body').removeClass('text-move');
        $(this._getInputElement()).find('label').text(this.label);
        if (this.editor) {
          this.dragging = false;
          this.editor.endSession();
          this.dragger.disconnect();
          var button = document.getElementById(this.parameterId);
          $(button).find('span.icon').removeClass('icon-checkmark').addClass('icon-move');
          $('.dom-container .textEdit').addClass('hide').removeClass('icon-move');
          this.editor = null;
           
        }
    }
    getValue() {
        return this.value;
    }
    _getInputElement() {
        var pid = this.parameterId;
        return $(this.dialog.dgDom.element).find('#' + pid).find('button');
    }
    _handleEndDrag() {
        var svgBox = svgHelpers.clientToLogical(this.dialog.layout.svg,svgHelpers.smoBox(this.editor.editText.getBoundingClientRect()));                
        var offsetBox = this.editor.editText.getBBox();
        var x = svgBox.x;
        var y = svgBox.y+svgBox.height-offsetBox.y;
        this.textElement.setAttributeNS('', 'x', '' + x);
        this.textElement.setAttributeNS('', 'y', '' + y);
        this.value = {x:x,y:y};        
        this.dialog.changed();
    }
    startDrag() {
        $('body').addClass('text-move');
        $(this._getInputElement()).find('label').text('Done');
        if (!this.dragging) {
        var self=this;
        this.dragging = true;
        var dragCb = function() {
            self._handleEndDrag();
        }
        var draggingCb = function() {
            self._handleDragging();
        }
        this.textElement=$(this.dialog.layout.svg).find('.'+this.dialog.modifier.attrs.id)[0];
        var value = this.textElement.getBBox();
        this.value = {x:value.x,y:value.y};
        this.editor = new editSvgText({target:this.textElement,layout:this.dialog.layout,fontInfo:this.fontInfo});
        var button = document.getElementById(this.parameterId);
        $(button).find('span.icon').removeClass('icon-move').addClass('icon-checkmark');
        $('.textEdit').removeClass('hide');
        $('.textEdit span.icon-move').removeClass('hide');
        this.dragger = htmlHelpers.draggable({
			parent: $('.dom-container .textEdit'),
			handle: $('.dom-container .textEdit'),
            animateDiv:'.draganime',            
			cb: dragCb,
            draggingCb:draggingCb,
			moveParent: true,
            dragParent: true
		});
        } else {
          this.endSession();
        }
    }
 
    bind() {
        var self=this;        
        this.textElement=$(this.dialog.layout.svg).find('.'+this.dialog.modifier.attrs.id)[0];
        this.fontInfo = JSON.parse(JSON.stringify(this.dialog.modifier.fontInfo));
        this.value = this.textElement.textContent;
        $(this._getInputElement()).off('click').on('click',function(ev) {
            self.startDrag();
        });
    }
}

// ## TBD: do this.
class SuiResizeTextBox {
    constructor(dialog,parameter) {
        smoMusic.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
        this.editMode=false;

        this.dialog = dialog;
        this.value='';        
    }
    
    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('cbResizeTextBox smoControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
            .append(b('button').attr('type', 'checkbox').classes('toggleTextEdit')
                .attr('id', id + '-input').append(
                b('span').classes('icon icon-enlarge'))
                .append(
                b('label').attr('for', id + '-input').text(this.label)));
        return r;
    }
    get parameterId() {
        return this.dialog.id + '-' + this.parameterName;
    }
    endSession() {
        if (this.editor) {
            this.value=this.editor.value;
            this.editor.endSession();
        }
    }
    getValue() {
        return this.value;
    }
    _getInputElement() {
        var pid = this.parameterId;
        return $(this.dialog.dgDom.element).find('#' + pid).find('button');
    }
    startEditSession() {
        var self=this;
        if (!this.editor) {
          this.textElement=$(this.dialog.layout.svg).find('.'+this.dialog.modifier.attrs.id)[0];
          this.value = this.textElement.textContent;            
          this.editor = new editSvgText({target:this.textElement,layout:this.dialog.layout,fontInfo:this.fontInfo});
          var button = document.getElementById(this.parameterId);
          $(button).find('span.icon').removeClass('icon-pencil').addClass('icon-checkmark');
          this.editor.startSessionPromise().then(function() {
              self.value=self.editor.value;
              self.editor=null;
          });
        } else {
          var button = document.getElementById(this.parameterId);
          this.value=this.editor.value;
          $(button).find('span.icon').removeClass('icon-checkmark').addClass('icon-pencil');
          this.editor.endSession();
          this.dialog.changed();
        }
    }
 
    bind() {
        var self=this;
        this.textElement=$(this.dialog.layout.svg).find('.'+this.dialog.modifier.attrs.id)[0];
        this.fontInfo = JSON.parse(JSON.stringify(this.dialog.modifier.fontInfo));
        this.value = this.textElement.textContent;
        $(this._getInputElement()).off('click').on('click',function(ev) {
            self.startEditSession();
        });
    }
}

// ## SuiTextInPlace
// Edit the text in an SVG element, in the same scale etc. as the text in the score SVG DOM.
// This component just manages the text editing component of hte renderer.
class SuiTextInPlace {
    constructor(dialog,parameter) {
        smoMusic.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
        this.editMode=false;

        this.dialog = dialog;
        this.value='';        
    }
    
    get html() {
        var b = htmlHelpers.buildDom;
        var id = this.parameterId;
        var r = b('div').classes('cbTextInPlace smoControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
            .append(b('button').attr('type', 'checkbox').classes('toggleTextEdit')
                .attr('id', id + '-input').append(
                b('span').classes('icon icon-pencil'))
                .append(
                b('label').attr('for', id + '-input').text(this.label)));
        return r;
    }
    get parameterId() {
        return this.dialog.id + '-' + this.parameterName;
    }
    endSession() {
        if (this.editor) {
            this.value=this.editor.value;
            this.editor.endSession();
        }
    }
    getValue() {
        return this.value;
    }
    _getInputElement() {
        var pid = this.parameterId;
        return $(this.dialog.dgDom.element).find('#' + pid).find('button');
    }
    startEditSession() {
        var self=this;
        $(this._getInputElement()).find('label').text('Done');
        if (!this.editor) {
          this.textElement=$(this.dialog.layout.svg).find('.'+this.dialog.modifier.attrs.id)[0];
          this.value = this.textElement.textContent;            
          this.editor = new editSvgText({target:this.textElement,layout:this.dialog.layout,fontInfo:this.fontInfo});
          var button = document.getElementById(this.parameterId);
          $(button).find('span.icon').removeClass('icon-pencil').addClass('icon-checkmark');
          this.editor.startSessionPromise().then(function() {
              self.value=self.editor.value;
              self.editor=null;
          });
        } else {
          var button = document.getElementById(this.parameterId);
          this.value=this.editor.value;
          $(button).find('span.icon').removeClass('icon-checkmark').addClass('icon-pencil');
          this.editor.endSession();
          $('.textEdit').addClass('hide');
          $('body').removeClass('text-edit');
          $(this._getInputElement()).find('label').text(this.label);
          this.dialog.changed();
        }
    }
 
    bind() {
        var self=this;
        this.textElement=$(this.dialog.layout.svg).find('.'+this.dialog.modifier.attrs.id)[0];
        this.fontInfo = JSON.parse(JSON.stringify(this.dialog.modifier.fontInfo));
        this.value = this.textElement.textContent;
        $(this._getInputElement()).off('click').on('click',function(ev) {
            self.startEditSession();
        });
    }
}

// ## SuiTextInputComponent
// Just get text from an input, such as a filename.
class SuiTextInputComponent {
    constructor(dialog, parameter) {
        smoMusic.filteredMerge(
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
            .append(b('input').attr('type', 'text').classes('file-name')
                .attr('id', id + '-input')).append(
                b('label').attr('for', id + '-input').text(this.label));
        return r;
    }
    
    getValue() {
        return this.value;
    }
    bind() {
        var self=this;
        $('#'+this.parameterId).find('input').off('change').on('change',function(e) {
            self.value = $(this).val();
            self.dialog.changed();
        });
    }    
}

// ## SuiFileDownloadComponent
// Download a test file using the file input.
class SuiFileDownloadComponent {
    constructor(dialog, parameter) {
        smoMusic.filteredMerge(
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
            self.dialog.changed();
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
class SuiToggleComponent {
    constructor(dialog, parameter) {
        smoMusic.filteredMerge(
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
            dialog.changed();
        });
    }
}

class SuiDropdownComponent {
    constructor(dialog, parameter) {
        smoMusic.filteredMerge(
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
        var dialog = this.dialog;
        var pid = this.parameterId;
        var input = this._getInputElement();
        this.setValue(this.defaultValue);
        var self = this;
        $(input).off('change').on('change',
            function (ev) {
            dialog.changed();
        });
    }
}
