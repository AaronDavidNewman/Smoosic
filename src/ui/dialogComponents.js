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

// ## SuiDragText
// A component that lets you drag the text you are editing to anywhere on the score.
// The text is not really part of the dialog but the location of the text appears
// in other dialog fields.
class SuiDragText extends SuiComponentBase {
    constructor(dialog,parameter) {
        super();
        smoSerialize.filteredMerge(
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
        var y = svgBox.y+svgBox.height;
        console.log('new box ' + svgHelpers.stringify(svgBox));
        console.log('tx: '+this.dialog.modifier.translateX + ' scaleX: ' + this.dialog.modifier.scaleX);
        // the translate from the drag happens in the client space happens at scale of 1,
        // where in the svg space the translate is scaled by the scale.  So adjust for that.
        x = this.oldBox.x + (x - this.oldBox.x)/this.dialog.modifier.scaleX;
        y = this.oldBox.y + (y - this.oldBox.y)/this.dialog.modifier.scaleY;
        this.textElement.setAttributeNS('', 'x', '' + x);
        this.textElement.setAttributeNS('', 'y', '' + y);
        this.oldBox.x = x;
        this.oldBox.y = y;
        this.value = {x:x,y:y};
        this.dialog.changed();
    }
    startDrag() {
        $('body').addClass('text-move');
        $(this._getInputElement()).find('label').text('Done Moving Text Block');
        if (!this.dragging) {
        var self=this;
        this.dragging = true;
        var dragCb = function() {
            self._handleEndDrag();
        }

        var modifier = this.dialog.modifier;
        this.textElement=$(this.dialog.layout.svg).find('.'+modifier.attrs.id)[0];
        this.oldBox = this.textElement.getBBox();
        this.value = {x:this.oldBox.x,y:this.oldBox.y};
        console.log('old box ' + svgHelpers.stringify(this.oldBox));
        this.editor = new editSvgText({target:this.textElement,
            textObject:modifier,
            layout:this.dialog.layout});
        var button = document.getElementById(this.parameterId);
        $(button).find('span.icon').removeClass('icon-move').addClass('icon-checkmark');
        $('.textEdit').removeClass('hide');
        $('.textEdit span.icon-move').removeClass('hide');
        this.dragger = htmlHelpers.draggable({
			parent: $('.dom-container .textEdit'),
			handle: $('.dom-container .textEdit'),
            animateDiv:'.draganime',
			cb: dragCb,
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
class SuiResizeTextBox extends SuiComponentBase {
    constructor(dialog,parameter) {
        super();
        smoSerialize.filteredMerge(
            ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
        if (!this.defaultValue) {
            this.defaultValue = 0;
        }
        this.editMode=false;
        this.resizing = false;

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
    setSizedValue() {
        var newBox = svgHelpers.smoBox($('.textEdit')[0].getBoundingClientRect());
        if (this.dialog.modifier.boxModel == SmoScoreText.boxModels.none) {
            this.dialog.modifier.scaleXInPlace(this.dialog.modifier.scaleX * (newBox.width / this.originalBox.width));
            this.dialog.modifier.scaleYInPlace(this.dialog.modifier.scaleY * (newBox.height / this.originalBox.height));
        } else {
            var svgBox = svgHelpers.clientToLogical(this.dialog.layout.svg,svgHelpers.smoBox(newBox));
            this.dialog.modifier.width = svgBox.width;
            this.dialog.modifier.height = svgBox.height;
            this.dialog.modifier.transateX = 0;this.dialog.modifier.transateY = 0;
            this.dialog.modifier.scaleX = 1;this.dialog.modifier.scaleY = 1;
        }
    }
    endSession() {
        this.setSizedValue();
        this.resizing = false;
        /* if (this.editor) {
          this.editor.endSession();
      }   */
        $('body').removeClass('text-resize');
        $('.textEdit').addClass('hide');
        $(this._getInputElement()).find('label').text('Resize Text');
        $(this._getInputElement()).find('span.icon').removeClass('icon-checkmark').addClass('icon-enlarge');
        this.changeFlag = true;
        this.dialog.changed();
        this.bind();
    }
    getValue() {
        return this.value;
    }
    _getInputElement() {
        var pid = this.parameterId;
        return $(this.dialog.dgDom.element).find('#' + pid).find('button');
    }
    _setEditTextSize(shadowText) {
        var textNode = $('.textEdit svg text')[0];
        var tx = this.shadowText.translateX; // - modifier.backup.translateX;
        var ty = this.shadowText.translateY; // - modifier.backup.translateY;
        textNode.setAttributeNS('','transform','translate('+tx+' '+ty+') scale ('+this.shadowText.scaleX+' '+this.shadowText.scaleY+')');

        var svg = $('.textEdit svg')[0];
        svg.viewBox.baseVal.x=this.shadowText.translateX;
        svg.viewBox.baseVal.y=this.shadowText.translateY;
    }
    _resizeEditNode() {
        var textNode = $('.textEdit svg text')[0];
        var newBox = svgHelpers.smoBox($('.textEdit')[0].getBoundingClientRect());
        this.shadowText.scaleXInPlace(this.shadowText.scaleX * (newBox.width / this.shadowBox.width));
        this.shadowText.scaleYInPlace(this.shadowText.scaleY * (newBox.height / this.shadowBox.height));
        this.shadowBox.width = newBox.width;this.shadowBox.height = newBox.height;
        this._setEditTextSize(this.shadowText);
    }
    startEditSession() {
        var self = this;
        this.resizing = true;
        var modifier = this.dialog.modifier;
        var ser = modifier.serialize();
        this.shadowText = new SmoScoreText(ser);


        this.textElement=$(this.dialog.layout.svg).find('.'+modifier.attrs.id)[0];
        /* this.editor = new editSvgText({target:this.textElement,
            xOffset:modifier.translateX,yOffset:modifier.translateY,
            layout:this.dialog.layout,fontInfo:modifier.fontInfo});   */

        $('body').addClass('text-resize');
        $(this._getInputElement()).find('label').text('Done Resizing Text Block');
        $(this._getInputElement()).find('span.icon').removeClass('icon-enlarge').addClass('icon-checkmark');

        $('.textEdit').removeClass('hide');
        this.originalBox = svgHelpers.smoBox($('.textEdit')[0].getBoundingClientRect());
        this.shadowBox = JSON.parse(JSON.stringify(this.originalBox));

        this._setEditTextSize(modifier);

        $(this._getInputElement()).off('click').on('click',function(ev) {
            self.endSession();
        });
        $('.textEdit').off('mouseup').on('mouseup',function(ev) {
            self._resizeEditNode();
        });
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
class SuiTextInPlace extends SuiComponentBase {
    constructor(dialog,parameter) {
        super();
        smoSerialize.filteredMerge(
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
        $(this._getInputElement()).find('label').text('Done Editing Text Block');
        if (!this.editor) {
          var modifier = this.dialog.modifier;
          this.textElement=$(this.dialog.layout.svg).find('.'+modifier.attrs.id)[0];
          this.value = this.textElement.textContent;
          this.editor = new editSvgText({target:this.textElement,
              textObject:modifier,
              layout:this.dialog.layout});
          var button = document.getElementById(this.parameterId);
          $(button).find('span.icon').removeClass('icon-pencil').addClass('icon-checkmark');
          this.editor.endTextEditSessionPromise().then(function() {
              layoutDebug.addTextDebug('endTextEditSessionPromise recvd by dialog component');
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
          this.handleChanged();
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

class SuiLyricEditComponent extends SuiComponentBase {
  constructor(dialog,parameter) {
    super();
    smoSerialize.filteredMerge(
        ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
    if (!this.defaultValue) {
        this.defaultValue = 0;
    }
    this._verse = 0;

    this.dialog = dialog;
    this.selection = null;
    this.value='';
  }

  set verse(val) {
    this._verse = val;
  }

  get verse() {
    return this._verse;
  }

  get html() {
    var b = htmlHelpers.buildDom;
    var id = this.parameterId;
    var r = b('div').classes('cbLyricEdit smoControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
      .append(b('div').classes('toggleEdit')
        .append(b('button').classes('toggleTextEdit')
          .attr('id', id + '-toggleInput').append(
          b('span').classes('icon icon-pencil'))).append(
          b('label').attr('for', id + '-toggleInput').text(this.label)))

      .append(b('div').classes('controlDiv')
        .append(b('span')
          .append(
            b('button').attr('id', id + '-left').classes('icon-arrow-left buttonComponent')))
        .append(b('span')
          .append(
            b('button').attr('id', id + '-right').classes('icon-arrow-right buttonComponent')))
        .append(b('span')
          .append(
            b('button').attr('id', id + '-remove').classes('icon-cross buttonComponent')))
      );
    return r;
  }
  get parameterId() {
      return this.dialog.id + '-' + this.parameterName;
  }

  // If the user pressed esc., force the end of the session
  endSessionDom() {
    var elementDom = $('#'+this.parameterId);
    $(elementDom).find('label').text('Edit Lyrics');
    $(this.editorButton).find('span.icon').removeClass('icon-checkmark').addClass('icon-pencil');
    $('body').removeClass('text-edit');
    $('div.textEdit').addClass('hide');
  }
  getValue() {
    return this.value;
  }
  _getInputElement() {
    var pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('button.toggleTextEdit');
  }

  notifySelectionChanged(selection) {
      if (selection) {
          layoutDebug.addTextDebug('SuiLyricEditComponent: lyric notification for ' + selection.note.attrs.id);
      } else {
          layoutDebug.addTextDebug('SuiLyricEditComponent: no selection');
      }
      if (this.selection == null || SmoSelector.neq(selection.selector,this.selection.selector)) {
          this.selection = selection;
          this.handleChanged();
      }
      if (!this.editor.isRunning) {
        this.endSessionDom();
      }
  }

  moveSelectionRight() {
    this.editor.moveSelectionRight();
  }
  moveSelectionLeft() {
    this.editor.moveSelectionLeft();
  }
  removeText() {
    this.editor.removeText();
  }

  _startEditorDom() {
    var elementDom = $('#'+this.parameterId);
    var button = $(elementDom).find('button.toggleTextEdit');
    layoutDebug.addTextDebug('SuiLyricEditComponent: create editor for ' + this.tracker.selections[0].note.attrs.id);
    $(button).find('span.icon').removeClass('icon-pencil').addClass('icon-checkmark');
    $(elementDom).find('label').text('Done Editing Lyrics');
  }
  get editorButton() {
    var elementDom = $('#'+this.parameterId);
    var button = $(elementDom).find('button.toggleTextEdit');
    return button;
  }
  toggleSessionButton() {
    this.handleChanged();
    if (!this.editor.isRunning) {
      this.editor.verse = this.verse;
      this._startEditorDom();
      layoutDebug.addTextDebug('SuiLyricEditComponent: restarting button');
     } else {
       this.endSessionDom();
       layoutDebug.addTextDebug('SuiLyricEditComponent: stopping editor button');
     }
     this.editor.toggleSessionStateEvent();
  }
  getYOffset() {
    if (this.editor) {
      return this.editor.getYOffset();
    }
    return 0;
  }

  setYOffset(val) {
    if (this.editor) {
      this.editor.setYOffset(val);
    }
  }
  startEditSession(selection) {
    var self=this;
    layoutDebug.addTextDebug('SuiLyricEditComponent: create editor request');
    this._startEditorDom();
    this.editor = new noteTextEditSession(this,this.tracker,this.verse,this.selection,this.eventSource,this.dialog.parser);
    this.editor.startEditingSession();
    this._bind();
  }
  bind() {
    this.tracker = this.dialog.tracker;
    this.selection = this.dialog.selection;
    this.controller = this.dialog.controller; // do we need this
  }

  _bind() {
    var self=this;
    $('#'+this.parameterId+'-left').off('click').on('click',function() {
      self.moveSelectionLeft();
    });
    $('#'+this.parameterId+'-right').off('click').on('click',function() {
      self.moveSelectionRight();
    });
    $('#'+this.parameterId+'-remove').off('click').on('click',function() {
      self.removeText();
    });
    $(this.editorButton).off('click').on('click',function() {
      self.toggleSessionButton();
    });
  }
}

// ## SuiTextInputComponent
// Just get text from an input, such as a filename.
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
