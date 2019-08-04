

class defaultRibbonLayout {

	static get ribbons() {
		return {
			left: ['helpDialog', 'addStaffMenu', 'dynamicsMenu', 'keyMenu', 'staffModifierMenu', 'staffModifierMenu2',
			'articulationButtons','accentButton','tenutoButton','staccatoButton','marcatoButton','pizzicatoButton']
		};
	}
	static get ribbonButtons() {
		return [{
				icon: '',
				leftText: 'Help',
				rightText: '?',
				classes: 'help-button',
				action: 'modal',
				ctor: 'helpModal',
				group:'scoreEdit',
				id: 'helpDialog'
			}, {
				leftText: 'Staves',
				rightText: '/s',
				icon: '',
				classes: 'staff-modify',
				action: 'menu',
				ctor: 'SuiAddStaffMenu',
				group:'scoreEdit',
				id: 'addStaffMenu'
			}, {
				leftText: 'Dynamics',
				rightText: '/d',
				icon: '',
				classes: 'note-modify',
				action: 'menu',
				ctor: 'SuiDynamicsMenu',
				group:'scoreEdit',
				id: 'dynamicsMenu'
			}, {
				leftText: 'Key',
				rightText: '/k',
				icon: '',
				classes: 'note-modify',
				action: 'menu',
				ctor: 'suiKeySignatureMenu',
				group:'scoreEdit',
				id: 'keyMenu'
			}, {
				leftText: '',
				rightText: '/e',
				icon: 'icon-slur',
				classes: 'icon note-modify',
				action: 'menu',
				ctor: 'suiStaffModifierMenu',
				group:'scoreEdit',
				id: 'staffModifierMenu'
			}, {
				leftText: '',
				rightText: '/e',
				icon: 'icon-cresc',
				classes: 'icon note-modify',
				action: 'menu',
				ctor: 'suiStaffModifierMenu',
				group:'scoreEdit',
				id: 'staffModifierMenu2'
			},
			{
				leftText:'etc.',
				rightText:'',
				icon:'icon-articulation',
				classes:'icon collapseParent',
				action:'collapseParent',
				ctor:'CollapseRibbonControl',
				group:'articulations',
				id:'articulationButtons'
			},
			{
				leftText:'Accent',
				rightText:'h',
				icon:'icon-accent',
				classes:'icon collapsed',
				action:'collapseChild',
				ctor:'ArticulationButtons',
				group:'articulations',
				id:'accentButton'
			},
			{
				leftText:'Tenuto',
				rightText:'i',
				icon:'',
				classes:'icon collapsed',
				action:'collapseChild',
				ctor:'ArticulationButtons',
				group:'articulations',
				id:'tenutoButton'
			},	{
				leftText:'Staccato',
				rightText:'j',
				icon:'',
				classes:'icon collapsed',
				action:'collapseChild',
				ctor:'ArticulationButtons',
				group:'articulations',
				id:'staccatoButton'
			},
			{
				leftText:'Marcato',
				rightText:'k',
				icon:'',
				classes:'icon collapsed',
				action:'collapseChild',
				ctor:'ArticulationButtons',
				group:'articulations',
				id:'marcatoButton'
			},{
				leftText:'Pizzicato',
				rightText:'l',
				icon:'',
				classes:'icon collapsed',
				action:'collapseChild',
				ctor:'ArticulationButtons',
				group:'articulations',
				id:'pizzicattoButton'
			}			
		];
	}
}
