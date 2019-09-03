
var smoDomBuilder = function (el) {}

// # htmlHelpers
// # Description:
//  Helper functions for buildling UI elements
class htmlHelpers {
	// ## buildDom
	// ## Description:
	// returns an object that  lets you build a DOM in a somewhat readable way.
	// ## Usage:
	// var b = htmlHelpers.buildDom;
	//  var r =
	// b('tr').classes('jsSharingMember').data('entitykey', key).data('name', name).data('entitytype', entityType).append(
	// b('td').classes('noSideBorderRight').append(
	// ...
	// $(parent).append(r.dom());
	//
	// Don't forget the '.dom()' !  That is the actual jquery element object
	static buildDom(el) {
		var smoDomBuilder = function (el) {
			this.e = $('<' + el + '/>');
			var self = this;
			this.classes = function (cl) {
				$(self.e).addClass(cl);
				return self;
			}
			this.data = function (name, value) {
				$(self.e).attr('data-' + name, value);
				return self;
			}
			this.attr = function (name, value) {
				$(self.e).attr(name, value);
				return self;
			}
			this.css = function (name, value) {
				$(self.e).css(name, value);
				return self;
			}
			this.append = function (el) {
				$(self.e).append(el.e);
				return self;
			}
			this.text = function (tx) {
				$(self.e).append(document.createTextNode(tx));
				return self;
			}
			this.dom = function () {
				return self.e;
			}
			return this;
		}
		return new smoDomBuilder(el);
	}

	static get focusableElements() {
		return ['a', 'input', 'select', 'textarea', 'button', 'li[tabindex]', 'div[tabindex]'];
	}
	static inputTrapper(selector) {
		var trapper = function () {
			this.parent = $(selector);
			this.id = $(this.parent).attr('id');
			this.parentId = $(this.parent).parent().attr('id');
			var idstr = Math.round(Math.random() * (999999 - 1) + 1);
			if (!this.id) {
				$(this.parent).attr('id', idstr + '-element');
				this.id = $(this.parent).attr('id');
			}
			if (!this.parentId) {
				$(this.parent).parent().attr('id', idstr + '-parent');
				this.parentId = $(this.parent).parent().attr('id');
			}
			this.modalInputs = [];
			this.disabledInputs = [];
			this.siblingInputs = [];

			// aria-hide peers of dialog and peers of parent that are not the parent.
			var peers = $(this.parent).parent().children().toArray();
			
			peers.forEach((node) => {
				var ptag = $(node)[0].tagName;
				if (ptag === 'SCRIPT' || ptag === 'LINK' || ptag === 'STYLE') { ;
				} else if ($(node).attr('id') === this.parentId ||
					$(node).attr('id') === this.id) { ;
				} else {
					var hidden = $(node).attr('aria-hidden');
					if (!hidden || hidden != 'true') {
						$(node).attr('aria-hidden', 'true');
						this.siblingInputs.push(node);
					}
				}
			});
			htmlHelpers.focusableElements.forEach((etype) => {
				var elements = $(etype).toArray();

				elements.forEach((element) => {
					var tagName = $(element)[0].tagName;
					if ($(element).attr('id') === this.id) { ;
					} else if ($(element).prop('disabled')) { ;
					} else if ($(element).hasClass('hide')) { ;
					} else if ($(element).closest(selector).length) {
						// inside
						this.modalInputs.push(element);
					} else if ((tagName === 'A' || tagName === 'DIV' || tagName === 'LI') && $(element).attr('tabIndex') === '-1') { ;
					} else {
						this.disabledInputs.push(element);
						if (tagName === 'A' || tagName === 'DIV' || tagName === 'LI') {
							$(element).attr('tabIndex', '-1');
						} else {
							$(element).prop('disabled', true);
						}
					}
				});
			});

			this.close = function () {
				this.disabledInputs.forEach(function (element) {
					var tagName = $(element)[0].tagName;
					if (tagName === 'A' || tagName === 'DIV' || tagName === 'LI') {
						$(element).attr('tabIndex', '0');
					} else {
						$(element).prop('disabled', false);
					}
				});
				this.siblingInputs.forEach((el) => {
					$(el).removeAttr('aria-hidden');
				});
			}
		}

		return new trapper(selector);
	}

	static closeDialogPromise() {
		return new Promise((resolve, reject) => {
			$('body').off('dialogDismiss').on('dialogDismiss', function () {
				resolve();
			});
		});
	}

}
