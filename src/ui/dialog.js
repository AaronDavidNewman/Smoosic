
class SuiRockerComponent {
	constructor(dialog,parameter) {
		vexMusic.filteredMerge(
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
class SuiDialogFactory {
  
/*     static dropdownControl(id, parameterName, label) {
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('dropdownControl').attr('id', id).attr('data-param', parameterName)
            .append(b('label').attr('for', id + '-input').text(label))
            .append(b('select').classes('dropdownSelect').attr('id', id + '-input'));
        return r;
    }  */

	static createDialog(modSelection,context,tracker,layout) {
	    var dbType = SuiDialogFactory.modifierDialogMap[modSelection.modifier.type];
        var ctor = eval(dbType);
		return ctor.createAndDisplay({
            modifier: modSelection.modifier,
            selection: modSelection.selection,
            context: context,
            tracker: tracker,
			layout:layout
        });
	}
    static get modifierDialogMap() {
        return {
            SmoStaffHairpin: 'SuiHairpinAttributesDialog',
			SmoSlur:'SuiSlurAttributesDialog'
        };
    }
}
class SuiDialogBase {
    constructor(dialogElements, parameters) {
        this.id = parameters.id;
		this.components=[];
        this.layout = parameters.layout;
        this.closeDialogPromise = new Promise((resolve, reject) => {
                $('body').off('dialogDismiss').on('dialogDismiss', function () {
                    resolve();
                });

            });
        this.dialogElements = dialogElements;
        this.dgDom = this._constructDialog(dialogElements, {
                id: 'dialog-' + this.id,
                top: parameters.top,
                left: parameters.left,
                label: parameters.label
            });
    }
	_constructDialog(dialogElements, parameters) {
        var id = parameters.id;
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('attributeModal').css('top', parameters.top + 'px').css('left', parameters.left + 'px')
            .append(b('h2').text(parameters.label));
        dialogElements.forEach((de) => {
			var ctor=eval(de.control);
			var control=new ctor(this,de);
			this.components.push(control);
            r.append(control.html);
        });
        r.append(
            b('div').classes('buttonContainer').append(
                b('button').classes('ok-button').text('Ok')).append(
                b('button').classes('cancel-button').text('Cancel')).append(
                b('button').classes('remove-button').text('Remove').append(
                    b('span').classes('icon icon-cancel-circle'))));
        $('.attributeDialog').html('');

        $('.attributeDialog').append(r.dom());

        var trapper = htmlHelpers.inputTrapper('.attributeDialog');
        $('.attributeDialog').find('.cancel-button').focus();
        return {
            element: $('.attributeDialog'),
            trapper: trapper
        };
    }
    
    _bindtoggleControl(parameter) {
        var self = this;
        var pid = this.parameterId(parameter);
        var input = this.getInputElement(parameter);
        $(input).off('change').on('change', function (ev) {
            self.changed();
        });
    }
    _binddropdownControl(parameter) {}
  
	addDropdownOptions(parameter,options,selection) {
		
	}
    complete() {
        // todo: set values
        $('body').removeClass('showAttributeDialog');
        $('body').trigger('dialogDismiss');
        this.dgDom.trapper.close();
    }
}

class SuiSlurAttributesDialog extends SuiDialogBase {
	/*
	{
           
            position: SmoSlur.positions.HEAD,
            position_end: SmoSlur.positions.HEAD,
            invert: false,
            controlPoints: [{
                    x: 0,
                    y: 40
                }, {
                    x: 0,
                    y: 40
                }
            ]
        };*/
	static get dialogElements() {
        return [{
                parameterName: 'spacing',
                smoName: 'spacing',
                defaultValue: 2,
                control: 'Rocker',
                label: 'Spacing'
            }, {
                smoName: 'thickness',
                parameterName: 'thickness',
                defaultValue: 2,
                control: 'rockerControl',
                label: 'Thickness'
            }, {
                smoName: 'xOffset',
                parameterName: 'xOffset',
                defaultValue: 0,
                control: 'rockerControl',
                label: 'X Offset'
            }, {
                smoName: 'yOffset',
                parameterName: 'yOffset',
                defaultValue: 10,
                control: 'rockerControl',
                label: 'Y Offset'
            }, {
                smoName: 'position',
                parameterName: 'position',
                defaultValue: SmoSlur.positions.HEAD,
				options: [
				{value:SmoSlur.positions.HEAD,
				label:'Head'},
				{value:SmoSlur.positions.TOP,
				label:'Top'}
				],
                control: 'dropdown',
                label: 'Position'
            }, 
			{
                smoName: 'invert',
                parameterName: 'invert',
                defaultValue: false,
                control: 'toggle',
                label: 'Invert'
            },
			{
                parameterName: 'cp1x',
                smoName: 'cp1x',
                defaultValue: 0,
                control: 'rockerControl',
                label: 'Control Point 1 X'
            },
			{
                parameterName: 'cp1y',
                smoName: 'cp1y',
                defaultValue: 40,
                control: 'rockerControl',
                label: 'Control Point 1 X'
            },
			{
                parameterName: 'cp2x',
                smoName: 'cp2x',
                defaultValue: 0,
                control: 'rockerControl',
                label: 'Control Point 2 X'
            },
			{
                parameterName: 'cp2y',
                smoName: 'cp2y',
                defaultValue: 40,
                control: 'rockerControl',
                label: 'Control Point 2 Y'
            }
        ];
    }
	static createAndDisplay(parameters) {
        var dg = new SuiSlurAttributesDialog(parameters);
        dg.display();
        return dg;
    }
	constructor() {
		if (!parameters.modifier || !parameters.selection) {
            throw new Error('modifier attribute dialog must have modifier and staff');
        }

        super(SuiSlurAttributesDialog.dialogElements, {
            id: 'dialog-' + parameters.modifier.id,
            top: parameters.modifier.renderedBox.y,
            left: parameters.modifier.renderedBox.x,
            label: 'Slur Properties'
        });
        Vex.Merge(this, parameters);
	}
}
class SuiHairpinAttributesDialog extends SuiDialogBase {
	static get label() {
		return 'Hairpin Properties';
	}
    static get dialogElements() {
        return [{
                parameterName: 'height',
                smoName: 'height',
                defaultValue: 10,
                control: 'SuiRockerComponent',
                label: 'Height'
            }, {
                smoName: 'yOffset',
                parameterName: 'y_shift',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Y Shift'
            }, {
                smoName: 'xOffsetRight',
                parameterName: 'right_shift_px',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Right Shift'
            }, {
                smoName: 'xOffsetLeft',
                parameterName: 'left_shift_px',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Left Shift'
            }
        ];
    }
    static createAndDisplay(parameters) {
        var dg = new SuiHairpinAttributesDialog(parameters);
        dg.display();
        return dg;
    }
    constructor(parameters) {
        if (!parameters.modifier || !parameters.selection) {
            throw new Error('modifier attribute dialog must have modifier and staff');
        }

        super(SuiHairpinAttributesDialog.dialogElements, {
            id: 'dialog-' + parameters.modifier.id,
            top: parameters.modifier.renderedBox.y,
            left: parameters.modifier.renderedBox.x,
            label: 'Hairpin Properties'
        });
        Vex.Merge(this, parameters);
    }

    handleRemove() {
        $(this.context.svg).find('g.' + this.modifier.id).remove();
        this.selection.staff.removeStaffModifier(this.modifier);
        this.tracker.clearModifierSelections();
    }

    _preview() {
        this.modifier.backupOriginal();
        this.components.forEach((component) => {
            this.modifier[component.smoName] = component.getValue();
        });
        this.layout.renderStaffModifierPreview(this.modifier)
    }

    _commit() {
        this.modifier.restoreOriginal();
        this.components.forEach((component) => {
            this.modifier[component.smoName] = component.getValue();
        });
    }

    changed() {
        this.modifier.backupOriginal();
        this.components.forEach((component) => {
            this.modifier[component.smoName] = component.getValue();
        });
        this.layout.renderStaffModifierPreview(this.modifier);
    }

    _bindElements() {
        var self = this;
		var dgDom=this.dgDom;
        $(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
            self._commit();
            self.complete();
        });

        $(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
            self.modifier.restoreOriginal();
            self.complete();
        });
        $(dgDom.element).find('.remove-button').off('click').on('click', function (ev) {
            self.handleRemove();
            self.complete();
        });
    }

    display() {

        $('body').addClass('showAttributeDialog');
        this.components.forEach((component) => {
			component.bind();
        });
        this._bindElements();
    }
}
