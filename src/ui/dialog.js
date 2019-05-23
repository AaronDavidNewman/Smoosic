
class SuiAttributeDialog {
    static rockerControl(id, parameterName, label) {
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('rockerControl').attr('id', id).attr('data-param', parameterName)
            .append(
                b('button').classes('increment').append(
                    b('span').classes('icon icon-circle-up'))).append(
                b('button').classes('decrement').append(
                    b('span').classes('icon icon-circle-down'))).append(
                b('input').attr('type', 'text').classes('rockerInput')
                .attr('id', id + '-input')).append(
                b('label').attr('for', id + '-input').text(label));
        return r;
    }

    static toggleControl(id, parameterName, label) {
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('toggleControl').attr('id', id).attr('data-param', parameterName)
            .append(b('input').attr('type', 'text').classes('toggleInput')
                .attr('id', id + '-input').append(
                    b('label').attr('for', id + '-input').text(label)));
        return r;
    }

    static dropdownControl(id, parameterName, label) {
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('dropdownControl').attr('id', id).attr('data-param', parameterName)
            .append(b('label').attr('for', id + '-input').text(label))
            .append(b('select').classes('dropdownSelect').attr('id', id + '-input'));
        return r;
    }

    static constructDialog(dialogElements, parameters) {
        var id = parameters.id;
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('attributeModal').css('top', parameters.top + 'px').css('left', parameters.left + 'px')
            .append(b('h2').text(parameters.label));
        dialogElements.forEach((de) => {
            r.append(SuiAttributeDialog[de.control](id + '-' + de.parameterName, de.parameterName, de.label));
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

    static get modifierDialogMap() {
        return {
            SmoStaffHairpin: 'SuiHairpinAttributesDialog'
        };
    }
}
class SuiDialogBase {
    constructor(dialogElements, parameters) {
        this.id = parameters.id;
        this.layout = parameters.layout;
        this.closeDialogPromise = new Promise((resolve, reject) => {
                $('body').off('dialogDismiss').on('dialogDismiss', function () {
                    resolve();
                });

            });
        this.dialog = SuiAttributeDialog.constructDialog(dialogElements, {
                id: 'dialog-' + this.id,
                top: parameters.top,
                left: parameters.left,
                label: parameters.label
            });
        this.dialogElements = dialogElements;
    }
    _bindrockerControl(parameter) {
        var self = this;
        var pid = this.parameterId(parameter);
        var input = this.getInputElement(parameter);
        $('#' + pid).find('button.increment').off('click').on('click',
            function (ev) {
            var val = self.getIntValue(parameter);
            $(input).val(val + 1);
            self.changed();
        });
        $('#' + pid).find('button.decrement').off('click').on('click',
            function (ev) {
            var val = self.getIntValue(parameter);
            $(self.dialog.element).find('#' + pid).find('input').val(val - 1);
            self.changed();
        });
        $(input).off('blur').on('blur',
            function (ev) {
            self.changed();
        });
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
    parameterId(parameter) {
        return this.id + '-' + parameter.parameterName;
    }
    getInputElement(parameter) {
        var pid = this.parameterId(parameter);
        return $(this.dialog.element).find('#' + pid).find('input');
    }
    getIntValue(parameter) {
        var pid = this.parameterId(parameter);
        var val = parseInt(this.getInputElement(parameter).val());
        val = isNaN(val) ? 0 : val;
        return val;
    }
    setIntValue(parameter, val) {
        this.getInputElement(parameter).val(val);
    }
	addDropdownOptions(parameter,options,selection) {
		
	}
    complete() {
        // todo: set values
        $('body').removeClass('showAttributeDialog');
        $('body').trigger('dialogDismiss');
        this.dialog.trapper.close();
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
                control: 'rockerControl',
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
				],
                control: 'dropdown',
                label: 'Y Offset'
            }, 
        ];
    }
}
class SuiHairpinAttributesDialog extends SuiDialogBase {
    static get dialogElements() {
        return [{
                parameterName: 'height',
                smoName: 'height',
                defaultValue: 10,
                control: 'rockerControl',
                label: 'Height'
            }, {
                smoName: 'yOffset',
                parameterName: 'y_shift',
                defaultValue: 0,
                control: 'rockerControl',
                label: 'Y Shift'
            }, {
                smoName: 'xOffsetRight',
                parameterName: 'right_shift_px',
                defaultValue: 0,
                control: 'rockerControl',
                label: 'Right Shift'
            }, {
                smoName: 'xOffsetLeft',
                parameterName: 'left_shift_px',
                defaultValue: 0,
                control: 'rockerControl',
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
        if (!parameters.staffModifier || !parameters.selection) {
            throw new Error('modifier attribute dialog must have modifier and staff');
        }

        super(SuiHairpinAttributesDialog.dialogElements, {
            id: 'dialog-' + parameters.staffModifier.id,
            top: parameters.staffModifier.renderedBox.y,
            left: parameters.staffModifier.renderedBox.x,
            label: 'Hairpin Properties'
        });
        Vex.Merge(this, parameters);
    }

    handleRemove() {
        $(this.context.svg).find('g.' + this.staffModifier.id).remove();
        this.selection.staff.removeStaffModifier(this.staffModifier);
        this.tracker.clearModifierSelections();
    }

    _preview() {
        this.staffModifier.backupOriginal();
        this.dialogElements.forEach((de) => {
            this.staffModifier[de.smoName] = this.getIntValue(de);
        });
        this.layout.renderStaffModifierPreview(this.staffModifier)
    }

    _commit() {
        this.staffModifier.restoreOriginal();
        this.dialogElements.forEach((de) => {
            this.staffModifier[de.smoName] = this.getIntValue(de);
        });
    }

    changed() {
        this.staffModifier.backupOriginal();
        this.dialogElements.forEach((de) => {
            this.staffModifier[de.smoName] = this.getIntValue(de);
        });
        this.layout.renderStaffModifierPreview(this.staffModifier);
    }

    _bindElements(dialog) {
        var self = this;
        $(dialog.element).find('.ok-button').off('click').on('click', function (ev) {
            self._commit();
            self.complete();
        });

        $(dialog.element).find('.cancel-button').off('click').on('click', function (ev) {
            self.staffModifier.restoreOriginal();
            self.complete();
        });
        $(dialog.element).find('.remove-button').off('click').on('click', function (ev) {
            self.handleRemove();
            self.complete();
        });
    }

    display() {
        var dialogElements = SuiHairpinAttributesDialog.dialogElements;
        this.dialog = SuiAttributeDialog.constructDialog(dialogElements, {
                id: 'dialog-' + this.staffModifier.id,
                top: this.staffModifier.renderedBox.y,
                left: this.staffModifier.renderedBox.x,
                label: 'Hairpin Properties'
            });

        $('body').addClass('showAttributeDialog');
        dialogElements.forEach((de) => {
            var inel = this.getInputElement(de);
            $(inel).val(
                this.staffModifier[de.smoName]);
            var binder = '_bind' + de.control;
            this[binder](de);
        });
        this._bindElements(this.dialog);
    }
}
