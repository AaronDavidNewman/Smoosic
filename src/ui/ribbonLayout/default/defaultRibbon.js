

class defaultRibbonLayout {

	static get ribbons() {
		return {
			left: ['helpDialog','staffModifier']
		};
	}
	static get ribbonButtons() {
		return [{
				icon: '',
				leftText:'Help',
				rightText:'?',
				classes:'help-button',
				action: 'modal',
				ctor: 'helpModal',
				id: 'helpDialog'
			}, {
				leftText: '',
				rightText:'',
				icon: 'treble',
				classes:'staff-modify',
				action: 'menu',
				ctor: 'suiStaffModifierMenu',
				id: 'staffModifier'
			}
		];
	}
}
