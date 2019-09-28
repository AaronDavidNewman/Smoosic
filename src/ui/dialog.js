
class SuiDialogFactory {

	static createDialog(modSelection, context, tracker, layout) {
		var dbType = SuiDialogFactory.modifierDialogMap[modSelection.modifier.type];
		var ctor = eval(dbType);
		if (!ctor) {
			console.warn('no dialog for modifier ' + modSelection.modifier.type);
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
			SmoDynamicText: 'SuiTextModifierDialog',
			SmoVolta:'SuiVoltaAttributeDialog'
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
		$(this.dgDom.element).find('.attributeDialog').css('top', '' + y + 'px');
	}
	_constructDialog(dialogElements, parameters) {
		var id = parameters.id;
		var b = htmlHelpers.buildDom;
		var r = b('div').classes('attributeModal').css('top', parameters.top + 'px').css('left', parameters.left + 'px')
		    .append(b('spanb').classes('draggable button').append(b('span').classes('icon icon-move')))
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

	_commit() {
		this.modifier.restoreOriginal();
		this.components.forEach((component) => {
			this.modifier[component.smoName] = component.getValue();
		});
	}

	complete() {
		$('body').removeClass('showAttributeDialog');
		$('body').trigger('dialogDismiss');
		this.dgDom.trapper.close();
	}

	display() {
		$('body').addClass('showAttributeDialog');
		this.components.forEach((component) => {
			component.bind();
		});
		this._bindElements();
		this.position(this.modifier.renderedBox);
		
		var cb = function(x,y) {
		}
		htmlHelpers.draggable( {
			parent:$(this.dgDom.element).find('.attributeModal'),
			handle:$(this.dgDom.element).find('.icon-move'),
			cb:cb,
			moveParent:true
		});
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
}

class SuiTextModifierDialog extends SuiDialogBase {
	static get dialogElements() {
		return [{
				smoName: 'yOffsetLine',
				parameterName: 'yOffsetLine',
				defaultValue: 11,
				control: 'SuiRockerComponent',
				label: 'Y Line'
			}, {
				smoName: 'yOffsetPixels',
				parameterName: 'yOffsetPixels',
				defaultValue: 0,
				control: 'SuiRockerComponent',
				label: 'Y Offset Px'
			}, {
				smoName: 'xOffset',
				parameterName: 'yOffset',
				defaultValue: 0,
				control: 'SuiRockerComponent',
				label: 'X Offset'
			}, {
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
					}, {
						value: SmoDynamicText.dynamics.FF,
						label: 'Fortissimo'
					}, {
						value: SmoDynamicText.dynamics.SFZ,
						label: 'Sforzando'
					}
				],
				control: 'SuiDropdownComponent',
				label: 'Text'
			}
		];
	}
	static createAndDisplay(parameters) {
		var dg = new SuiTextModifierDialog(parameters);
		dg.display();
		return dg;
	}

	constructor(parameters) {
		if (!parameters.modifier || !parameters.selection) {
			throw new Error('modifier attribute dialog must have modifier and selection');
		}

		super(SuiTextModifierDialog.dialogElements, {
			id: 'dialog-' + parameters.modifier.id,
			top: parameters.modifier.renderedBox.y,
			left: parameters.modifier.renderedBox.x,
			label: 'Dynamics Properties'
		});
		Vex.Merge(this, parameters);
		this.components.find((x) => {
			return x.parameterName == 'text'
		}).defaultValue = parameters.modifier.text;
	}
	handleRemove() {
		$(this.context.svg).find('g.' + this.modifier.id).remove();
		this.selection.note.removeModifier(this.modifier);
		this.tracker.clearModifierSelections();
	}
	changed() {
		this.modifier.backupOriginal();
		this.components.forEach((component) => {
			this.modifier[component.smoName] = component.getValue();
		});
		this.layout.renderNoteModifierPreview(this.modifier);
	}
}

class helpModal {
	constructor() {}
	static createAndDisplay() {
		SmoHelp.displayHelp();
		return htmlHelpers.closeDialogPromise();
	}
}
