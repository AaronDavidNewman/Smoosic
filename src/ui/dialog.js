// # Dialog base classes

// ## SuiDialogFactory
// Automatic dialog constructors for dialogs without too many parameters
// that operated on a selection.
class SuiDialogFactory {

	static createDialog(modSelection, context, tracker, layout,undoBuffer,controller) {
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
			layout: layout,
            undo:undoBuffer,
            controller:controller
		});
	}
	static get modifierDialogMap() {
		return {
			SmoStaffHairpin: 'SuiHairpinAttributesDialog',
			SmoSlur: 'SuiSlurAttributesDialog',
			SmoDynamicText: 'SuiTextModifierDialog',
			SmoVolta: 'SuiVoltaAttributeDialog',
            SmoScoreText: 'SuiTextTransformDialog',
            SmoLoadScore:  'SuiLoadFileDialog',
            SmoLyric:'SuiLyricDialog'
		};
	}
}

// ## SuiDialogBase
// Base class for dialogs.
class SuiDialogBase {
    // ### SuiDialogBase ctor
    // Creates the DOM element for the dialog and gets some initial elements
	constructor(dialogElements, parameters) {
		this.id = parameters.id;
        this.boundKeyboard = false;
		this.components = [];
		this.closeDialogPromise = new Promise((resolve, reject) => {
				$('body').off('dialogDismiss').on('dialogDismiss', function () {
					resolve();
				});

			});
        this.initialLeft = parameters.left
        this.initialTop = parameters.top;
		this.dialogElements = dialogElements;
		this.tracker = parameters.tracker;
		var top = parameters.top - this.tracker.scroller.netScroll.y;
		var left = parameters.left - this.tracker.scroller.netScroll.x;

		this.dgDom = this._constructDialog(dialogElements, {
				id: 'dialog-' + this.id,
				top: top,
				left: left,
				label: parameters.label
			});
	}

    // ### position
    // For dialogs based on selections, tries to place the dialog near the selection and also
    // to scroll so the dialog is in view
    static position(box,dgDom,scroller) {
        var y = (box.y + box.height) - scroller.netScroll.y;

		// TODO: adjust if db is clipped by the browser.
        var dge = $(dgDom.element).find('.attributeModal');
        var dgeHeight = $(dge).height();
        var maxY =  $('.musicRelief').height();
        var maxX = $('.musicRelief').width();

		var offset = dgeHeight + y > window.innerHeight ? (dgeHeight + y) -  window.innerHeight : 0;
		y = (y < 0) ? -y : y - offset;

        y = (y > maxY || y < 0) ? maxY / 2 : y;

		$(dge).css('top', '' + y + 'px');

        var x = box.x - scroller.netScroll.x;
        var w = $(dge).width();
        x = (x > window.innerWidth /2)  ? x - (w+25) : x + (w+25);

        x = (x < 0 || x > maxX) ? maxX/2 : x;
        $(dge).css('left', '' + x + 'px');
    }

    // ### position
    // Position the dialog near a selection.  If the dialog is not visible due
    // to scrolling, make sure it is visible.
	position(box) {
        SuiDialogBase.position(box,this.dgDom,this.tracker.scroller);
	}
    // ### build the html for the dialog, based on the instance-specific components.
	_constructDialog(dialogElements, parameters) {
		var id = parameters.id;
		var b = htmlHelpers.buildDom;
		var r = b('div').classes('attributeModal').attr('id','attr-modal-'+id)
            .css('top', parameters.top + 'px').css('left', parameters.left + 'px')
			.append(b('spanb').classes('draggable button').append(b('span').classes('icon icon-move jsDbMove')))
			.append(b('h2').text(parameters.label));

        var ctrl = b('div').classes('smoControlContainer');
		dialogElements.forEach((de) => {
			var ctor = eval(de.control);
			var control = new ctor(this, de);
			this.components.push(control);
			ctrl.append(control.html);
		});
        r.append(ctrl);
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

    // ### _commit
    // generic logic to commit changes to a momdifier.
	_commit() {
		this.modifier.restoreOriginal();
		this.components.forEach((component) => {
			this.modifier[component.smoName] = component.getValue();
		});
	}

     // ### Complete
     // Dialogs take over the keyboard, so release that and trigger an event
     // that the dialog is closing that can resolve any outstanding promises.
	complete() {
        if (this.boundKeyboard) {
            window.removeEventListener("keydown", this.keydownHandler, true);
        }
		$('body').removeClass('showAttributeDialog');
		$('body').trigger('dialogDismiss');
		this.dgDom.trapper.close();
	}

    // ### _bindComponentNames
    // helper method to give components class names based on their static configuration
    _bindComponentNames() {
        this.components.forEach((component) => {
			var nm = component.smoName + 'Ctrl';
            this[nm] = component;
		});
    }

   // ### display
   // make3 the modal visible.  bind events and elements.
	display() {
		$('body').addClass('showAttributeDialog');
        this.tracker.scroller.scrollVisible(this.initialLeft,this.initialTop);
		this.components.forEach((component) => {
			component.bind();
		});
		this._bindElements();
		this.position(this.modifier.renderedBox);

		var cb = function (x, y) {}
		htmlHelpers.draggable({
			parent: $(this.dgDom.element).find('.attributeModal'),
			handle: $(this.dgDom.element).find('.jsDbMove'),
            animateDiv:'.draganime',
			cb: cb,
			moveParent: true
		});
	}

    // ### handleKeydown
    // allow a dialog to be dismissed by esc.
    handleKeydown(evdata) {
        if (evdata.key == 'Escape') {
            $(this.dgDom.element).find('.cancel-button').click();
            evdata.preventDefault();
            return;
        }
        return;
    }

    // ### bindKeyboard
    // generic logic to grab keyboard elements for modal
    bindKeyboard() {
        this.boundKeyboard = true;
        this.keydownHandler = this.handleKeydown.bind(this);
        window.addEventListener("keydown", this.keydownHandler, true);
    }

   // ### _bindElements
   // bing the generic controls in most dialogs.
	_bindElements() {
		var self = this;
		var dgDom = this.dgDom;
        this.bindKeyboard();

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


// ## SuiLayoutDialog
// The layout dialog has page layout and zoom logic.  It is not based on a selection but score-wide
class SuiLayoutDialog extends SuiDialogBase {

   // ### dialogElements
   // all dialogs have elements define the controls of the dialog.
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
    // ### backupOriginal
    // backup the original layout parameters for trial period
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
            animateDiv:'.draganime',
			cb: cb,
			moveParent: true
		});
		this.controller.unbindKeyboardForDialog(this);

        var box = svgHelpers.boxPoints(250,250,1,1);
        SuiDialogBase.position(box,this.dgDom,this.tracker.scroller);

	}
    // ### _updateLayout
    // even if the layout is not changed, we re-render the entire score by resetting
    // the svg context.
    _updateLayout() {
        this.layout.rerenderAll();
    }
	_handleCancel() {
		this.layout.score.layout = this.backup;
		this._updateLayout();
		this.complete();
	}
	_bindElements() {
		var self = this;
		var dgDom = this.dgDom;
        this.bindKeyboard();

		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {

			// TODO:  allow user to select a zoom mode.
			self.layout.score.layout.zoomMode = SmoScore.zoomModes.zoomScale;
			self._updateLayout();
			self.complete();
		});

		$(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
			self._handleCancel();
		});

		$(dgDom.element).find('.remove-button').remove();
	}
	_setPageSizeDefault() {
		var value = 'custom';
		var scoreDims = this.layout.score.layout;
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
    // ### _handlePageSizeChange
    // see if the dimensions have changed.
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
    // ### changed
    // One of the components has had a changed value.
	changed() {
		// this.modifier.backupOriginal();
		this._handlePageSizeChange();
		this.components.forEach((component) => {
			this.layout.score.layout[component.smoName] = component.getValue();
		});
		this.layout.setViewport();
	}

    // ### createAndDisplay
    // static method to create the object and then display it.
	static createAndDisplay(buttonElement, buttonData, controller) {
		var dg = new SuiLayoutDialog({
				layout: controller.layout,
				controller: controller
			});
		dg.display();
	}
	constructor(parameters) {
		if (!(parameters.layout && parameters.controller)) {
			throw new Error('layout  dialog must have score');
		}
		var p = parameters;

		super(SuiLayoutDialog.dialogElements, {
			id: 'dialog-layout',
			top: (p.layout.score.layout.pageWidth / 2) - 200,
			left: (p.layout.score.layout.pageHeight / 2) - 200,
			label: 'Score Layout',
			tracker:parameters.controller.tracker
		});
		this.layout = p.layout;
		this.modifier = this.layout.score.layout;
		this.controller = p.controller;
		this.backupOriginal();
	}
}

// ## SuiTextModifierDialog
// This is a poorly named class, it just allows you to placeText
// dynamic text so it doesn't collide with something.
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
			label: 'Dynamics Properties',
			tracker:parameters.tracker
		});
		Vex.Merge(this, parameters);
		this.components.find((x) => {
			return x.parameterName == 'text'
		}).defaultValue = parameters.modifier.text;
	}
	handleRemove() {
		$(this.context.svg).find('g.' + this.modifier.id).remove();
        this.undo.addBuffer('remove dynamic', 'measure', this.selection.selector, this.selection.measure);
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
