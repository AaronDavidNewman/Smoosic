

class defaultRibbonLayout {

	static get ribbons() {
		return {
			left: ['helpDialog', 'addStaffMenu', 'dynamicsMenu', 'keyMenu', 'staffModifierMenu', 'staffModifierMenu2',
			'articulationButtons','accentButton','tenutoButton','staccatoButton','marcatoButton','pizzicatoButton'],
		
		
		top:['NoteButtons','ANoteButton','BNoteButton','CNoteButton','DNoteButton','ENoteButton','FNoteButton','GNoteButton','UpNoteButton','DownNoteButton'
		   ,'UpOctaveButton','DownOctaveButton'
		     ,'NavigationButtons','navLeftButton','navRightButton','navUpButton','navDownButton','navFastForward','navRewind']};
	}
	
	static get noteRibbonButtons() {
		return [
		 {
				leftText:'',				
				rightText:'',
				classes:'icon  collapseParent',
				icon:'icon-note',
				action:'collapseParent',
				ctor:'CollapseRibbonControl',
				group:'notes',
				id:'NoteButtons'
			}, {
				leftText:'A',
				rightText:'a',
				icon:'',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NoteButtons',
				group:'notes',
				id:'ANoteButton'
			},
			{
				leftText:'B',
				rightText:'b',
				icon:'',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NoteButtons',
				group:'notes',
				id:'BNoteButton'
			},{
				leftText:'C',
				rightText:'c',
				icon:'',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NoteButtons',
				group:'notes',
				id:'CNoteButton'
			},{
				leftText:'D',
				rightText:'d',
				icon:'',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NoteButtons',
				group:'notes',
				id:'DNoteButton'
			},{
				leftText:'E',
				rightText:'e',
				icon:'',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NoteButtons',
				group:'notes',
				id:'ENoteButton'
			},{
				leftText:'F',
				rightText:'f',
				icon:'',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NoteButtons',
				group:'notes',
				id:'FNoteButton'
			},{
				leftText:'G',
				rightText:'g',
				icon:'',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NoteButtons',
				group:'notes',
				id:'GNoteButton'
			},
			{
				leftText:'',
				rightText:'-',
				icon:'icon-sharp',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NoteButtons',
				group:'notes',
				id:'UpNoteButton'
			},
			{
				leftText:'',
				rightText:'=',
				icon:'icon-flat',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NoteButtons',
				group:'notes',
				id:'DownNoteButton'
			},{
				leftText:'8va',
				rightText:'Ctrl=',
				icon:'',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NoteButtons',
				group:'notes',
				id:'UpOctaveButton'
			},{
				leftText:'8vb',
				rightText:'Ctrl=',
				icon:'',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NoteButtons',
				group:'notes',
				id:'DownOctaveButton'
			}
			
			];
	}
	static get navigationButtons() {
		return [
		{
				leftText:'',				
				rightText:'',
				classes:'icon  collapseParent',
				icon:'icon-navigate',
				action:'collapseParent',
				ctor:'CollapseRibbonControl',
				group:'navigation',
				id:'NavigationButtons'
			},{
				leftText:'',
				rightText:'',
				icon:'icon-arrow-left',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NavigationButtons',
				group:'navigation',
				id:'navLeftButton'
			},{
				leftText:'',
				rightText:'',
				icon:'icon-arrow-right',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NavigationButtons',
				group:'navigation',
				id:'navRightButton'
			},{
				leftText:'',
				rightText:'',
				icon:'icon-arrow-up',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NavigationButtons',
				group:'navigation',
				id:'navUpButton'
			},{
				leftText:'',
				rightText:'',
				icon:'icon-arrow-down',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NavigationButtons',
				group:'navigation',
				id:'navDownButton'
			},{
				leftText:'',
				rightText:'',
				icon:'icon-fforward',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NavigationButtons',
				group:'navigation',
				id:'navFastForward'
			},	{
				leftText:'',
				rightText:'',
				icon:'icon-rewind',
				classes:'collapsed',
				action:'collapseChild',
				ctor:'NavigationButtons',
				group:'navigation',
				id:'navRewind'
			}
			];
	}
	static get ribbonButtons() {
		return defaultRibbonLayout.leftRibbonButtons.concat(defaultRibbonLayout.navigationButtons).concat(defaultRibbonLayout.noteRibbonButtons);
	}
	static get leftRibbonButtons() {
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
				leftText:'Articulations',
				rightText:'',
				icon:'',
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
				id:'pizzicatoButton'
			},	
			
		];
	}
}
