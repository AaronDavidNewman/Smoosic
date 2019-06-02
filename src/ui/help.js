

class SmoHelp {

	static displayHelp() {
		$('body').addClass('showHelpDialog');
		$('.helpDialog').html('');
		$('.helpDialog').append(SmoHelp.navigationHtml.dom());
		$('.helpDialog').append(SmoHelp.noteHelpHtml.dom());
	}

	static _helpButton(buttons) {
		var b = htmlHelpers.buildDom;
		var r = b('span').classes('keyContainer');
		buttons.forEach((button) => {
			button.text = (button.text ? button.text : '');
			r.append(b('span').classes(button.icon + ' helpKey').text(button.text));

		});
		return r;
	}

	static _buttonBlock(buttons, text, id) {
		var b = htmlHelpers.buildDom;
		var r = b('div').classes('keyBlock').attr('id', id);
		r.append(SmoHelp._helpButton(buttons)).append(
			b('label').attr('for', id).text(text));
		return r;
	}

	static _buildElements(helps) {
		var b = htmlHelpers.buildDom;
		var r = b('div').classes('helpLine')
			helps.forEach((help) => {
				r.append(SmoHelp._buttonBlock(help.keys, help.text, help.id));
			});
		return r;
	}

	static get navigationElements() {
		return [{
				keys:
				[{
						icon: 'icon-arrow-right'
					}, {
						icon: 'icon-arrow-left'
					}
				],
				text: 'Move note selection left or right',
				id: 'help1'
			}, {
				keys: [{
						icon: '',
						text: 'Ctrl'
					}, {
						icon: 'icon-arrow-right'
					}, {
						icon: '',
						text: 'Ctrl'
					}, {
						icon: 'icon-arrow-left'
					}
				],
				text: 'Jump selection to next/last measure',
				id: 'selectionJumpHelp'
			}, {
				keys: [{
						icon: '',
						text: 'Shift'
					}, {
						icon: 'icon-arrow-right'
					}, {
						icon: '',
						text: 'Shift'
					}, {
						icon: 'icon-arrow-left'
					}
				],
				text: 'Grow selection left or right',
				id: 'selectionGrowHelp'
			}
		];
	}
	static get noteElements() {
		return [{
				keys:
				[{
						text: 'A'
					}, {
						text: 'B'
					}, {
						text: '...'
					}, {
						text: 'G'
					}
				],
				text: 'Enter letter note A-G at selection',
				id: 'noteElements1'
			}, {
				keys:
				[{
						text: '-'
					}, {
						text: '='
					}
				],
				text: 'Transpose selected notes down/up 1/2 step',
				id: 'noteElements2'
			}, {
				keys: [{
						text: 'Ctrl'
					}, {
						text: '-'
					}, {
						text: 'Ctrl'
					}, {
						text: '='
					}
				],
				text: 'Move note up/down octave',
				id: 'noteElements3'
			}
		];
	}

	static get navigationHtml() {
		return SmoHelp._buildElements(SmoHelp.navigationElements);
	}
	static get noteHelpHtml() {
		return SmoHelp._buildElements(SmoHelp.noteElements);
	}
}
