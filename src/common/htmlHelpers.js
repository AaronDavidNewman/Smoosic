
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
      this.html = function(value) {
        $(self.e).html(value);
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
	static draggable(parameters) {
		return new draggable(parameters);
	}

	static get focusableElements() {
		return ['a', 'input', 'select', 'textarea', 'button', 'li[tabindex]', 'div[tabindex]'];
	}
    static addFileLink(filename,txt,parent) {
        var anchor = $('<a></a>');
        var url = URL.createObjectURL(new Blob([txt],{type:'application/octet-stream'}));
        $(anchor).attr('href',url);
        $(anchor).attr('download',filename);
        $(anchor).text('save');
        $(parent).html('');
        $(parent).append(anchor);
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

class draggable {

	constructor(parameters) {
		this.parent = parameters.parent;
		this.handle = parameters.handle;
    this.animeClass = parameters.animateDiv;
    this.dragParent = parameters.dragParent;

    // TODO: make '.dom-container' a part of the configuration
    this.domOffset =  $('.dom-container').offset();

		this.svg=parameters['svg'];
		this.width = $(this.parent).outerWidth();
		this.height = $(this.parent).outerHeight();
		this.lastX = $(this.handle).offset().left - this.domOffset.left;
		this.lastY = $(this.handle).offset().top - this.domOffset.top;
		this.cb = parameters.cb;
		this.moveParent = parameters.moveParent;

		var self = this;

		// $('.itemMenu input[name="itemTitle"]').css('width','60%');
		$(this.handle)
		.off('mousedown').on('mousedown',
			function (e) {
			self.mousedown(e);
		});
		$(document)
		.on('mousemove',
			function (e) {
			self.mousemove(e);

		})
		.on('mouseup',
			function (e) {
			self.mouseup(e);
		});
	}
  disconnect() {
    $(this.handle).off('mousedown');
    $(this.document).off('mousemove');
    $(this.handle).off('mouseup');
  }
	_animate(e) {
		this.lastX = e.clientX;
		this.lastY = e.clientY;
		$(this.animeClass).css('left', this.lastX - this.domOffset.left);
		$(this.animeClass).css('top', this.lastY - this.domOffset.top);

    if (this.dragParent) {
      $(this.parent).css('left', this.lastX + 'px');
		  $(this.parent).css('top', this.lastY + 'px');
    }
	}
	mousedown(e) {
		if (!this.dragging) {
			$(this.animeClass).removeClass('hide');

			$(this.animeClass).css('width', this.width);
			$(this.animeClass).css('height', this.height);
		}

		this.dragging = true;
		this._animate(e);
	}
	enddrag(e) {
    this.lastX = this.lastX - this.domOffset.left;
    this.lastY = this.lastY - this.domOffset.top;
		if (this.moveParent) {
			$(this.parent).css('left', this.lastX + 'px');
			$(this.parent).css('top', this.lastY + 'px');
		}
		$(this.animeClass).addClass('hide');
		this.cb(this.lastX, this.lastY);
	}

	mouseup(e) {
		// stop resizing
		if (this.dragging) {
			this.dragging = false;
			this.lastX = e.clientX;
			this.lastY = e.clientY;

			this.enddrag();
		}
	}
	mousemove(e) {
		// we don't want to do anything if we aren't resizing.
		if (!this.dragging)
			return;
		this._animate(e);
	}
}
