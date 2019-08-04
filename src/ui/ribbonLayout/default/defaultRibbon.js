

class defaultRibbonLayout {

	static get ribbons() {
		return {
			left: ['helpDialog','staffModifier','addDynamic','keySignature']
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
				leftText: 'Staves',
				rightText:'/s',
				icon: '',
				classes:'staff-modify',
				action: 'menu',
				ctor: 'SuiAddStaffMenu',
				id: 'staffModifier'
			}, {
				leftText: 'Dynamics',
				rightText:'/d',
				icon: '',
				classes:'note-modify',
				action: 'menu',
				ctor: 'SuiDynamicsMenu',
				id: 'addDynamic'
			}, {
				leftText: 'Key',
				rightText:'/k',
				icon: '',
				classes:'note-modify',
				action: 'menu',
				ctor: 'suiKeySignatureMenu',
				id: 'keySignature'
			}
		];
	}
}
