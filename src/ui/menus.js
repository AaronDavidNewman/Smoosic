
class suiMenuBase {
	constructor(params) {
		Vex.Merge(this, params);
	}

	complete() {
		$('body').trigger('menuDismiss');
	}
}

class suiMenuManager {
	constructor(params) {
		Vex.Merge(this, suiMenuManager.defaults);
		Vex.Merge(this, params);
	}

	static get menuKeyBindingDefaults() {
		return [{
				event: "keydown",
				key: "k",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "suiKeySignatureMenu"
			}
		];
	}

	static get defaults() {
		return {
			menuBind: suiKeys.menuKeyBindingDefaults,
			menuContainer: '.menuContainer'
		};
	}

	unattach() {
		window.removeEventListener("keydown", this.keydownHandler, true);
		$('body').removeClass('modal');
		$(this.menuContainer).html('');
		$('body').off('dismissMenu');
	}

	attach(el) {
		$(this.menuContainer).html('');
		$(this.menuContainer).attr('z-index', '12');
		var ul = $('<ul/>');
		$(ul).addClass('menuElement');
		this.menu.menuItems.forEach((item) => {
			var sel = $('<li/>');
			var bu = $('<button/>');
			var textSpan = $('<span/>');
			$(sel).addClass('menuOption');
			$(textSpan).addClass('icon ' + item.icon);
			$(bu).text(item.text);
			$(bu).attr('data-value', item.value);
			$(sel).append(bu);
			$(bu).append(textSpan);
			$(ul).append(sel);
		});
		$(ul).css('left', '' + this.menuPosition.x + 'px');
		$(ul).css('top', '' + this.menuPosition.y + 'px');
		$(ul).css('height', '' + this.menu.menuItems.length * 35 + 'px');
		$(this.menuContainer).append(ul);
		$(ul).attr('size', this.menu.menuItems.length);
		$('body').addClass('modal');
		this.bindEvents();
	}
	slashMenuMode() {
		var self = this;
		this.bindEvents();
		this.closeMenuPromise = new Promise((resolve, reject) => {
				$('body').off('menuDismiss').on('menuDismiss', function () {
					self.unattach();
					resolve();
				});

			});
		return this.closeMenuPromise;
	}

	handleKeydown(event) {
		console.log("KeyboardEvent: key='" + event.key + "' | code='" +
			event.code + "'"
			 + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");
		if (['Tab', 'Enter'].indexOf(event.code) >= 0) {
			return;
		}

		event.preventDefault();

		if (event.code === 'Escape') {
			$('body').trigger('menuDismiss');
		}
		if (this.menu) {
			this.menu.keydown(event);
		}
		if (this.tracker.selections.length == 0) {
			this.toggleMenuMode();
			return;
		}
		this.menuPosition = this.tracker.selections[0].box;
		var binding = this.menuBind.find((ev) => {
				return ev.key === event.key
			});
		if (!binding) {
			return;
		}
		var ctor = eval(binding.action);
		this.menu = new ctor({
				position: this.menuPosition,
				tracker: this.tracker,
				editor: this.editor,
				score: this.score
			});
		this.attach(this.menuContainer);
	}

	bindEvents() {
		var self = this;
		this.keydownHandler = this.handleKeydown.bind(this);

		window.addEventListener("keydown", this.keydownHandler, true);

		$(this.menuContainer).find('button').off('click').on('click', function (ev) {
			self.menu.selection(ev);
		});
	}
}

class suiKeySignatureMenu extends suiMenuBase {

	constructor(params) {
		params = (params ? params : {});
		Vex.Merge(params, suiKeySignatureMenu.defaults);
		super(params);
	}
	static get defaults() {
		return {
			menuItems: [{
					icon: 'keySigC',
					text: 'C Major',
					value: 'C'
				}, {
					icon: 'keySigF',
					text: 'F Major',
					value: 'F'
				}, {
					icon: 'keySigG',
					text: 'G Major',
					value: 'G'
				}, {
					icon: 'keySigBb',
					text: 'Bb Major',
					value: 'Bb'
				}, {
					icon: 'keySigD',
					text: 'D Major',
					value: 'D'
				}, {
					icon: 'keySigEb',
					text: 'Eb Major',
					value: 'Eb'
				}, {
					icon: 'keySigA',
					text: 'A Major',
					value: 'A'
				}, {
					icon: 'keySigAb',
					text: 'Ab Major',
					value: 'Ab'
				}, {
					icon: 'keySigE',
					text: 'Db Major',
					value: 'E'
				}, {
					icon: 'keySigDb',
					text: 'Db Major',
					value: 'Db'
				}, {
					icon: 'keySigB',
					text: 'B Major',
					value: 'B'
				}, {
					icon: 'keySigFs',
					text: 'F# Major',
					value: 'F#'
				}, {
					icon: 'keySigCs',
					text: 'C# Major',
					value: 'C#'
				}
			],
			menuContainer: '.menuContainer'
		};
	}
	selection(ev) {
		var keySig = $(ev.target).attr('data-value');
		var self=this;
		this.tracker.iterateMeasures((measure) =>	{
			this.score.addKeySignature(measure.measureNumber.measureIndex, keySig);
		});
		this.complete();
	}
	keydown(ev) {}

}
