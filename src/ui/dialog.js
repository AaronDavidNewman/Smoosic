
class SuiDialogFactory {

	static createDialog(modSelection, context, tracker, layout) {
		var dbType = SuiDialogFactory.modifierDialogMap[modSelection.modifier.attrs.type];
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
			SmoVolta: 'SuiVoltaAttributeDialog',
            SmoScoreText: 'SuiTextTransformDialog'
		};
	}
}

class SuiDialogBase {
	constructor(dialogElements, parameters) {
		this.id = parameters.id;
		this.components = [];
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
				b('button').classes('ok-button button-left').text('OK')).append(
				b('button').classes('cancel-button button-center').text('Cancel')).append(
				b('button').classes('remove-button button-right').text('Remove').append(
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

		var cb = function (x, y) {}
		htmlHelpers.draggable({
			parent: $(this.dgDom.element).find('.attributeModal'),
			handle: $(this.dgDom.element).find('.icon-move'),
			cb: cb,
			moveParent: true
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

class SuiTextTransformDialog  extends SuiDialogBase {
    static createAndDisplay(parameters) {
		var dg = new SuiTextTransformDialog(parameters);
		dg.display();
        return dg;
	}
    
    static get dialogElements() {
		return [{
				smoName: 'pageSize',
				parameterName: 'x',
				defaultValue: 0,
				control: 'SuiTextDragger',
				label:'Page Size',
				options: []
			}
            ];
    }
    
    display() {
		$('body').addClass('showAttributeDialog');
		this.components.forEach((component) => {
			component.bind();
		});
		// this._bindElements();
		// this.position(this.modifier.renderedBox);

		var cb = function (x, y) {}
		htmlHelpers.draggable({
			parent: $(this.dgDom.element).find('.attributeModal'),
			handle: $(this.dgDom.element).find('.icon-move'),
			cb: cb,
			moveParent: true
		});
	}

	constructor(parameters) {
		if (!parameters.modifier) {
			throw new Error('modifier attribute dialog must have modifier');
		}

		super(SuiTextTransformDialog.dialogElements, {
			id: 'dialog-' + parameters.modifier.id,
			top: parameters.modifier.renderedBox.y,
			left: parameters.modifier.renderedBox.x,
			label: 'Dynamics Properties'
		});
		Vex.Merge(this, parameters);
		this.components.find((x) => {
			return x.parameterName == 'x'
		}).defaultValue = parameters.modifier.x;
	}
    bind() {
    }
}
class SuiLayoutDialog extends SuiDialogBase {
	static get attributes() {
		return ['pageWidth', 'pageHeight', 'leftMargin', 'topMargin', 'rightMargin', 'interGap', 'intraGap', 'zoomScale', 'svgScale'];
	}
	static get dialogElements() {
		return [{
				smoName: 'pageSize',
				parameterName: 'pageSize',
				defaultValue: SmoScore.pageSizes.letter,
				control: 'SuiDropdownComponent',
				label:'Page Size',
				options: [{
						value: 'letter',
						label: 'Letter'
					}, {
						value: 'tabloid',
						label: 'Tabloid (11x17)'
					}, {
						value: 'A4',
						label: 'A4'
					}, {
						value: 'custom',
						label: 'Custom'
					}
				]
			}, {
				smoName: 'pageWidth',
				parameterName: 'pageWidth',
				defaultValue: SmoScore.defaults.layout.pageWidth,
				control: 'SuiRockerComponent',
				label: 'Page Width (px)'
			}, {
				smoName: 'pageHeight',
				parameterName: 'pageHeight',
				defaultValue: SmoScore.defaults.layout.pageHeight,
				control: 'SuiRockerComponent',
				label: 'Page Height (px)'
			}, {
				smoName: 'orientation',
				parameterName: 'orientation',
				defaultValue: SmoScore.orientations.portrait,
				control: 'SuiDropdownComponent',
				label: 'Orientation',
				dataType:'int',
				options:[{
					value:SmoScore.orientations.portrait,
					label:'Portrait'
				}, {
					value:SmoScore.orientations.landscape,
					label:'Landscape'
				}]
			}, {
				smoName: 'leftMargin',
				parameterName: 'leftMargin',
				defaultValue: SmoScore.defaults.layout.leftMargin,
				control: 'SuiRockerComponent',
				label: 'Left Margin (px)'
			}, {
				smoName: 'rightMargin',
				parameterName: 'rightMargin',
				defaultValue: SmoScore.defaults.layout.rightMargin,
				control: 'SuiRockerComponent',
				label: 'Right Margin (px)'
			}, {
				smoName: 'topMargin',
				parameterName: 'topMargin',
				defaultValue: SmoScore.defaults.layout.topMargin,
				control: 'SuiRockerComponent',
				label: 'Top Margin (px)'
			}, {
				smoName: 'interGap',
				parameterName: 'interGap',
				defaultValue: SmoScore.defaults.layout.interGap,
				control: 'SuiRockerComponent',
				label: 'Inter-System Margin'
			}, {
				smoName: 'intraGap',
				parameterName: 'intraGap',
				defaultValue: SmoScore.defaults.layout.intraGap,
				control: 'SuiRockerComponent',
				label: 'Intra-System Margin'
			}, {
				smoName: 'zoomScale',
				parameterName: 'zoomScale',
				defaultValue: SmoScore.defaults.layout.zoomScale,
				control: 'SuiRockerComponent',
				label: '% Zoom',
				type: 'percent'
			}, {
				smoName: 'svgScale',
				parameterName: 'svgScale',
				defaultValue: SmoScore.defaults.layout.svgScale,
				control: 'SuiRockerComponent',
				label: '% Note size',
				type: 'percent'
			}
		];
	}
	backupOriginal() {
		this.backup = JSON.parse(JSON.stringify(this.modifier));;
	}
	display() {
		$('body').addClass('showAttributeDialog');
		this.components.forEach((component) => {
			component.bind();
		});
		this.components.forEach((component) => {
			var val = this.modifier[component.parameterName];
			component.setValue(val);
		});
		this._setPageSizeDefault();
		this._bindElements();

		var cb = function (x, y) {}
		htmlHelpers.draggable({
			parent: $(this.dgDom.element).find('.attributeModal'),
			handle: $(this.dgDom.element).find('.icon-move'),
			cb: cb,
			moveParent: true
		});
		this.controller.unbindKeyboardForDialog(this);

	}
	_handleCancel() {
		this.score.layout = this.backup;
		this.layout.setViewport();
		var self = this;
		var complete = function () {
			self.complete();
		}
		this.layout.redraw().then(complete);	
	}
	_bindElements() {
		var self = this;
		var dgDom = this.dgDom;

		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
			self.layout.setViewport();
			var complete = function () {
				self.complete();
			}
			self.layout.render().then(complete);
		});

		$(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
			self._handleCancel();	
		});

		$(dgDom.element).find('.remove-button').remove();
	}
	_setPageSizeDefault() {
		var value = 'custom';
		var scoreDims = this.score.layout;
		SmoScore.pageSizes.forEach((sz) => {
			var dim = SmoScore.pageDimensions[sz];
			if (scoreDims.pageWidth === dim.width && scoreDims.pageHeight === dim.height) {
				value = sz;
			} else if (scoreDims.pageHeight === dim.width && scoreDims.pageWidth === dim.height) {
				value = sz;
			}
		});
		this.components.find((x)=>{return x.parameterName==='pageSize'}).setValue(value);
	}
	_handlePageSizeChange() {
		var pageSizeComp = this.components.find((x)=>{return x.parameterName==='pageSize'});
		var sel = pageSizeComp.getValue();
		if (sel === 'custom') {
			$('.attributeModal').addClass('customPage');			
		} else {
			$('.attributeModal').removeClass('customPage');
			var dim = SmoScore.pageDimensions[sel];
			var hComp = this.components.find((x)=>{return x.parameterName==='pageHeight'});
			var wComp = this.components.find((x)=>{return x.parameterName==='pageWidth'});
			hComp.setValue(dim.height);
			wComp.setValue(dim.width);			
		}		
	}
	changed() {
		// this.modifier.backupOriginal();
		this._handlePageSizeChange();
		this.components.forEach((component) => {
			this.score.layout[component.smoName] = component.getValue();
		});
		this.layout.setViewport();
		this.layout.render();
	}
	static createAndDisplay(buttonElement, buttonData, controller) {
		var dg = new SuiLayoutDialog({
				score: controller.score,
				layout: controller.layout,
				controller: controller
			});
		dg.display();
	}
	constructor(parameters) {
		if (!(parameters.score && parameters.layout && parameters.controller)) {
			throw new Error('layout  dialog must have score');
		}
		var p = parameters;

		super(SuiLayoutDialog.dialogElements, {
			id: 'dialog-layout',
			top: (p.score.layout.pageWidth / 2) - 200,
			left: (p.score.layout.pageHeight / 2) - 200,
			label: 'Score Layout'
		});
		this.score = p.score;
		this.modifier = this.score.layout;
		this.layout = p.layout;
		this.controller = p.controller;
		this.backupOriginal();
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
