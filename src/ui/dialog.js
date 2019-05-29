
class SuiDialogFactory {

    static createDialog(modSelection, context, tracker, layout) {
        var dbType = SuiDialogFactory.modifierDialogMap[modSelection.modifier.type];
        var ctor = eval(dbType);
		if (!ctor) {
			console.warn('no dialog for modifier '+modSelection.modifier.type);
			return;
		}
        return ctor.createAndDisplay({
            modifier: modSelection.modifier,
            selection: modSelection.selection,
            context: context,
            tracker: tracker,
            layout: layout
        });
    }
    static get modifierDialogMap() {
        return {
            SmoStaffHairpin: 'SuiHairpinAttributesDialog',
            SmoSlur: 'SuiSlurAttributesDialog',
			SmoDynamicText:'SuiTextModifierDialog'
        };
    }
}
class SuiDialogBase {
    constructor(dialogElements, parameters) {
        this.id = parameters.id;
        this.components = [];
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
    position(box) {
        var y = box.y + box.height;

        // TODO: adjust if db is clipped by the browser.
        $(this.dgDom.element).css('top', '' + y + 'px');
    }
    _constructDialog(dialogElements, parameters) {
        var id = parameters.id;
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('attributeModal').css('top', parameters.top + 'px').css('left', parameters.left + 'px')
            .append(b('h2').text(parameters.label));
        dialogElements.forEach((de) => {
            var ctor = eval(de.control);
            var control = new ctor(this, de);
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

    complete() {
        // todo: set values
        $('body').removeClass('showAttributeDialog');
        $('body').trigger('dialogDismiss');
        this.dgDom.trapper.close();
    }
}

class SuiTextModifierDialog extends SuiDialogBase {
    static get dialogElements() {
        return [
		{
                smoName: 'yOffsetLine',
                parameterName: 'yOffsetLine',
                defaultValue: 11,
                control: 'SuiRockerComponent',
                label: 'Y Line'
            },
			{
                smoName: 'yOffsetPixels',
                parameterName: 'yOffsetPixels',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Y Offset Px'
            },
			{
                smoName: 'xOffset',
                parameterName: 'yOffset',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'X Offset'
            },{
                smoName: 'text',
                parameterName: 'text',
                defaultValue: SmoDynamicText.dynamics.P,
                options: [{
                        value: SmoDynamicText.dynamics.P,
                        label: 'Piano'
                    }, {
                        value: SmoDynamicText.dynamics.PP,
                        label: 'Pianissimo'
                    }, {
                        value: SmoDynamicText.dynamics.MP,
                        label: 'Mezzo-Piano'
                    }, {
                        value: SmoDynamicText.dynamics.MF,
                        label: 'Mezzo-Forte'
                    }, {
                        value: SmoDynamicText.dynamics.F,
                        label: 'Forte'
                    },
					{
                        value: SmoDynamicText.dynamics.F,
                        label: 'Fortissimo'
					}
                ],
                control: 'SuiDropdownComponent',
                label: 'Text'
            }
        ];
    }
}

class SuiSlurAttributesDialog extends SuiDialogBase {
    static get dialogElements() {
        return [{
                parameterName: 'spacing',
                smoName: 'spacing',
                defaultValue: 2,
                control: 'SuiRockerComponent',
                label: 'Spacing'
            }, {
                smoName: 'thickness',
                parameterName: 'thickness',
                defaultValue: 2,
                control: 'SuiRockerComponent',
                label: 'Thickness'
            }, {
                smoName: 'xOffset',
                parameterName: 'xOffset',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'X Offset'
            }, {
                smoName: 'yOffset',
                parameterName: 'yOffset',
                defaultValue: 10,
                control: 'SuiRockerComponent',
                label: 'Y Offset'
            }, {
                smoName: 'position',
                parameterName: 'position',
                defaultValue: SmoSlur.positions.HEAD,
                options: [{
                        value: SmoSlur.positions.HEAD,
                        label: 'Head'
                    }, {
                        value: SmoSlur.positions.TOP,
                        label: 'Top'
                    }
                ],
                control: 'SuiDropdownComponent',
                label: 'Start Position'
            }, {
                smoName: 'position_end',
                parameterName: 'position_end',
                defaultValue: SmoSlur.positions.HEAD,
                options: [{
                        value: SmoSlur.positions.HEAD,
                        label: 'Head'
                    }, {
                        value: SmoSlur.positions.TOP,
                        label: 'Top'
                    }
                ],
                control: 'SuiDropdownComponent',
                label: 'End Position'
            }, {
                smoName: 'invert',
                parameterName: 'invert',
                defaultValue: false,
                control: 'SuiToggleComponent',
                label: 'Invert'
            }, {
                parameterName: 'cp1x',
                smoName: 'cp1x',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Control Point 1 X'
            }, {
                parameterName: 'cp1y',
                smoName: 'cp1y',
                defaultValue: 40,
                control: 'SuiRockerComponent',
                label: 'Control Point 1 Y'
            }, {
                parameterName: 'cp2x',
                smoName: 'cp2x',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Control Point 2 X'
            }, {
                parameterName: 'cp2y',
                smoName: 'cp2y',
                defaultValue: 40,
                control: 'SuiRockerComponent',
                label: 'Control Point 2 Y'
            }
        ];
    }
    static createAndDisplay(parameters) {
        var dg = new SuiSlurAttributesDialog(parameters);
        dg.display();
        return dg;
    }
    constructor(parameters) {
        if (!parameters.modifier || !parameters.selection) {
            throw new Error('modifier attribute dialog must have modifier and selection');
        }

        super(SuiSlurAttributesDialog.dialogElements, {
            id: 'dialog-' + parameters.modifier.id,
            top: parameters.modifier.renderedBox.y,
            left: parameters.modifier.renderedBox.x,
            label: 'Slur Properties'
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
        var dgDom = this.dgDom;
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
        this.position(this.modifier.renderedBox);
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
        var dgDom = this.dgDom;
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
        this.position(this.modifier.renderedBox);
    }
}
