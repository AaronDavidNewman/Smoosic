

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
				rightText:'/s',
				icon: 'icon-treble',
				classes:'staff-modify icon',
				action: 'menu',
				ctor: 'SuiAddStaffMenu',
				id: 'staffModifier'
			}
		];
	}
}
