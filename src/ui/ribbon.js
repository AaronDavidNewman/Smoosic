
class RibbonHtml {
	static ribbonButton(buttonId, buttonClass, buttonText, buttonIcon, buttonKey) {
		var b = htmlHelpers.buildDom;
		var r = b('div').append(b('button').attr('id', buttonId).classes(buttonClass).append(
					b('span').classes('ribbon-button-text icon ' + buttonIcon).text(buttonText)).append(
					b('span').classes('ribbon-button-hotkey').text(buttonKey)));
		return r.dom();
	}
}

// ## RibbonButtons
// Render the ribbon buttons based on group, function, and underlying UI handler.
// Also handles UI events.
// ## RibbonButton methods
// ---
class RibbonButtons {
	static get paramArray() {
		return ['ribbonButtons', 'ribbons', 'editor', 'controller', 'tracker', 'menus'];
	}
	constructor(parameters) {
		smoMusic.filteredMerge(RibbonButtons.paramArray, parameters, this);
		this.ribbonButtons = parameters.ribbonButtons;
		this.ribbons = parameters.ribbons;
		this.collapsables = [];
	}
	_executeButtonModal(buttonElement, buttonData) {
		var ctor = eval(buttonData.ctor);
		ctor.createAndDisplay(buttonElement, buttonData);
	}
	_executeButtonMenu(buttonElement, buttonData) {
		var self = this;
		this.controller.detach();
		var rebind = function () {
			self._rebindController();
		}
		this.menuPromise = this.menus.slashMenuMode().then(rebind);
		this.menus.createMenu(buttonData.ctor);
	}
	_bindCollapsibleAction(buttonElement, buttonData) {
		// collapseParent
		this.collapsables.push(new CollapseRibbonControl({
				ribbonButtons: this.ribbonButtons,
				menus: this.menus,
				tracker: this.tracker,
				controller: this.controller,
				editor: this.editor,
				buttonElement: buttonElement,
				buttonData: buttonData
			}));
	}

	_rebindController() {
		this.controller.render();
		this.controller.bindEvents();
	}
	_executeButton(buttonElement, buttonData) {
		if (buttonData.action === 'modal') {
			this._executeButtonModal(buttonElement, buttonData);
			return;
		}
		if (buttonData.action === 'menu') {
			this._executeButtonMenu(buttonElement, buttonData);
			return;
		}
	}

	_bindButton(buttonElement, buttonData) {
		var self = this;
		$(buttonElement).off('click').on('click', function () {
			self._executeButton(buttonElement, buttonData);
		});
	}
	display() {
		$('body .controls-left').html('');
		$('body .controls-top').html('');

		var buttonAr = this.ribbons['left'];
		buttonAr.forEach((buttonId) => {
			var b = this.ribbonButtons.find((e) => {
					return e.id === buttonId;
				});
			if (b) {
				var buttonHtml = RibbonHtml.ribbonButton(b.id, b.classes, b.leftText, b.icon, b.rightText);
				$(buttonHtml).attr('data-group', b.group);
				$('body .controls-left').append(buttonHtml);
				var el = $('body .controls-left').find('#' + b.id);
				this._bindButton(el, b);
				if (b.action == 'collapseParent') {
					this._bindCollapsibleAction(el, b);
				}
			}
		});
		
		buttonAr = this.ribbons['top'];
		buttonAr.forEach((buttonId) => {
			var b = this.ribbonButtons.find((e) => {
					return e.id === buttonId;
				});
			if (b) {
				var buttonHtml = RibbonHtml.ribbonButton(b.id, b.classes, b.leftText, b.icon, b.rightText);
				$(buttonHtml).attr('data-group', b.group);
				$('body .controls-top').append(buttonHtml);
				var el = $('body .controls-top').find('#' + b.id);
				this._bindButton(el, b);
				if (b.action == 'collapseParent') {
					this._bindCollapsibleAction(el, b);
				}
			}
		});
		this.collapsables.forEach((cb) => {
			cb.bind();
		});		
	}
}

class NoteButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
	}
	setPitch() {
		this.editor.setPitchCommand(this.buttonData.rightText);
	}
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			self.setPitch();
		});
	}
}

class ArticulationButtons {
	static get articulationIdMap() {
		return {
			accentButton: SmoArticulation.articulations.accent,
			tenutoButton: SmoArticulation.articulations.tenuto,
			staccatoButton: SmoArticulation.articulations.staccato,
			marcatoButton: SmoArticulation.articulations.marcato,
			pizzicatoButton: SmoArticulation.articulations.pizzicato,
			fermataButton: SmoArticulation.articulations.fermata
		};
	}
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
		this.articulation = ArticulationButtons.articulationIdMap[this.buttonData.id];
		this.shiftState = false;
		this.showState = false;
	}
	_toggleArticulation() {
		this.showState = !this.showState;

		// fake editor key, not sure if this is best...
		this.editor.toggleArticulationCommand(this.articulation, this.shiftState ? SmoArticulation.positions.below : SmoArticulation.positions.above);

		// toggle above and below
		if (!this.showState) {
			this.shiftState = !this.shiftState;
		}
	}
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			self._toggleArticulation();
		});
	}
}

class CollapseRibbonControl {
	static get paramArray() {
		return ['ribbonButtons', 'editor', 'controller', 'tracker', 'menus', 'buttonData', 'buttonElement'];
	}
	constructor(parameters) {
		smoMusic.filteredMerge(CollapseRibbonControl.paramArray, parameters, this);
		this.childButtons = parameters.ribbonButtons.filter((cb) => {
				return cb.group === this.buttonData.group && cb.action === 'collapseChild';
			});
	}
	_toggleExpand() {
		this.childButtons.forEach((cb) => {

			var el = $('#' + cb.id);
			$(el).toggleClass('collapsed');
			$(el).toggleClass('expanded');
		});
		this.buttonElement.toggleClass('expandedChildren');
		if (this.buttonElement.hasClass('expandedChildren')) {
			$(this.buttonElement).addClass('icon-arrow-left');
		} else {
			$(this.buttonElement).removeClass('icon-arrow-left');
		}
	}
	bind() {
		var self = this;
		$('#' + this.buttonData.id).off('click').on('click', function () {
			self._toggleExpand();
		});
		this.childButtons.forEach((cb) => {
			var ctor = eval(cb.ctor);
			var el = $('#' + cb.id);
			var btn = new ctor({
					buttonData: cb,
					buttonElement: el,
					editor: this.editor,
					tracker: this.tracker,
					controller: this.controller
				});
			btn.bind();
		});
	}
}
