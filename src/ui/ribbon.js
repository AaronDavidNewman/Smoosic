
class RibbonHtml {
	static ribbonButton(buttonId, buttonClass, buttonText, buttonIcon, buttonKey) {
		var b = htmlHelpers.buildDom;
		var r = b('div').append(b('button').attr('id', buttonId).classes(buttonClass).append(
					b('span').classes('ribbon-button-text icon ' + buttonIcon).text(buttonText)).append(
					b('span').classes('ribbon-button-hotkey').text(buttonKey)));
		return r.dom();
	}
}

class RibbonButtons {
	static get paramArray() {
		return ['ribbonButtons', 'ribbons', 'editor', 'controller', 'tracker', 'menus'];
	}
	constructor(parameters) {
		smoMusic.filteredMerge(RibbonButtons.paramArray, parameters, this);
		this.ribbonButtons = parameters.ribbonButtons;
		this.ribbons = parameters.ribbons;
	}
	_executeButtonModal(buttonElement, buttonData) {
		var ctor = eval(buttonData.ctor);
		ctor.createAndDisplay(buttonElement, buttonData);
	}
	_executeButtonMenu(buttonElement, buttonData) {
		var self=this;
		var rebind = function() {
			self._rebindController();
		}
		this.menuPromise = this.menus.slashMenuMode().then(rebind);
		this.menus.createMenu(buttonData.ctor);
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

		var buttonAr = this.ribbons['left'];
		buttonAr.forEach((buttonId) => {
			var b = this.ribbonButtons.find((e) => {
					return e.id === buttonId;
				});
			if (b) {
				var buttonHtml = RibbonHtml.ribbonButton(b.id, b.classes, b.leftText, b.icon, b.rightText);
				$('body .controls-left').append(buttonHtml);
				var el = $('body .controls-left').find('#' + b.id);
				this._bindButton(el, b);
			}
		});
	}
}
