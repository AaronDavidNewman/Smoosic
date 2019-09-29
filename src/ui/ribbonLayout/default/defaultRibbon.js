

class defaultRibbonLayout {

	static get ribbons() {
		var left = defaultRibbonLayout.leftRibbonIds;
		var top = defaultRibbonLayout.noteButtonIds.concat(defaultRibbonLayout.navigateButtonIds).concat(defaultRibbonLayout.articulateButtonIds)
		    .concat(defaultRibbonLayout.intervalIds).concat(defaultRibbonLayout.durationIds).concat(defaultRibbonLayout.measureIds);
			
		return {
			left: left,
			top:top
		};
	}
	
	static get ribbonButtons() {
		return defaultRibbonLayout.leftRibbonButtons.concat(
			defaultRibbonLayout.navigationButtons).concat(
			defaultRibbonLayout.noteRibbonButtons).concat(
			defaultRibbonLayout.articulationButtons).concat(
			defaultRibbonLayout.chordButtons).concat(
			defaultRibbonLayout.durationRibbonButtons).concat(
			defaultRibbonLayout.measureRibbonButtons);
	}
	
	static get leftRibbonIds() {
		return ['helpDialog', 'addStaffMenu', 'dynamicsMenu', 'keyMenu', 'staffModifierMenu', 'staffModifierMenu2','pianoModal'];
	}
	static get noteButtonIds() {
		return ['NoteButtons', 'ANoteButton', 'BNoteButton', 'CNoteButton', 'DNoteButton', 'ENoteButton', 'FNoteButton', 'GNoteButton','ToggleRestButton',
				'UpNoteButton', 'DownNoteButton', 'UpOctaveButton', 'DownOctaveButton', 'ToggleRest','ToggleAccidental', 'ToggleCourtesy'];
	}	
	static get navigateButtonIds()  {
		return ['NavigationButtons', 'navLeftButton', 'navRightButton', 'navUpButton', 'navDownButton', 'navFastForward', 'navRewind',
				'navGrowLeft', 'navGrowRight'];
	}
	
	static get articulateButtonIds()  {
		return ['articulationButtons', 'accentAboveButton', 'accentBelowButton', 'tenutoAboveButton', 'tenutoBelowButton',
				'staccatoAboveButton', 'staccatoBelowButton', 'marcatoAboveButton', 'marcatoBelowButton', 'pizzicatoAboveButton', 'pizzicatoBelowButton'];
	}
	
	static get intervalIds()  {
		return ['CreateChordButtons', 'SecondUpButton', 'SecondDownButton', 'ThirdUpButton', 'ThirdDownButton', 'FourthUpButton', 'FourthDownButton',
				'FifthUpButton', 'FifthDownButton','SixthUpButton', 'SixthDownButton'
				,'SeventhUpButton', 'SeventhDownButton','OctaveUpButton','OctaveDownButton','CollapseChordButton'];
	}
	static get durationIds() {
		return ['DurationButtons','GrowDuration','LessDuration','GrowDurationDot','LessDurationDot','TripletButton','QuintupletButton','SeptupletButton','NoTupletButton'];
	}
	static get measureIds() {
		return ['MeasureButtons','endRepeat','startRepeat','endBar','doubleBar','singleBarEnd','singleBarStart','nthEnding','dcAlCoda','dsAlCoda','dcAlFine','dsAlFine','coda','toCoda','segno','toSegno','fine'];
	}
	
	static get measureRibbonButtons() {
		return [{
			leftText: '',
				rightText: '',
				classes: 'icon  collapseParent measure',
				icon: 'icon-end_rpt',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'measure',
				id: 'MeasureButtons'			
		},{
				leftText: '',
				rightText: '',
				icon: 'icon-end_rpt',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'endRepeat'
			},
			{
				leftText: '',
				rightText: '',
				icon: 'icon-start_rpt',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'startRepeat'
			}
			,
			{
				leftText: '',
				rightText: '',
				icon: 'icon-end_bar',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'endBar'
			},
			{
				leftText: '',
				rightText: '',
				icon: 'icon-double_bar',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'doubleBar'
			},
			{
				leftText: '',
				rightText: '',
				icon: 'icon-single_bar',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'singleBarEnd'
			},			
			{
				leftText: '',
				rightText: '',
				icon: 'icon-single_bar_start',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'singleBarStart'
			},
			{
				leftText: '',
				rightText: '',
				icon: 'icon-ending',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'nthEnding'
			},
			{
				leftText: 'DC Al Coda',
				rightText: '',
				icon: '',
				classes: 'collapsed repetext',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'dcAlCoda'
			},
			{
				leftText: 'DS Al Coda',
				rightText: '',
				icon: '',
				classes: 'collapsed repetext',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'dsAlCoda'
			},
			{
				leftText: 'DC Al Fine',
				rightText: '',
				icon: '',
				classes: 'collapsed repetext',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'dcAlFine'
			},
			{
				leftText: 'DS Al Fine',
				rightText: '',
				icon: '',
				classes: 'collapsed repetext',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'dsAlFine'
			},
			{
				leftText: '',
				rightText: '',
				icon: 'icon-coda',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'coda'
			},
			{
				leftText: 'to ',
				rightText: '',
				icon: 'icon-coda',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'toCoda'
			},
			{
				leftText: '',
				rightText: '',
				icon: 'icon-segno',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'segno'
			},
			{
				leftText: 'Fine',
				rightText: '',
				icon: '',
				classes: 'collapsed repetext',
				action: 'collapseChild',
				ctor: 'MeasureButtons',
				group: 'measure',
				id: 'fine'
			}
		];
	}
	
	static get durationRibbonButtons() {
		return [{
				leftText: '',
				rightText: '',
				classes: 'icon  collapseParent duration',
				icon: 'icon-duration',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'duration',
				id: 'DurationButtons'
			},{
				leftText: '',
				rightText: '.',
				icon: 'icon-duration_grow',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'DurationButtons',
				group: 'duration',
				id: 'GrowDuration'
			},{
				leftText: '',
				rightText: ',',
				icon: 'icon-duration_less',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'DurationButtons',
				group: 'duration',
				id: 'LessDuration'
			},{
				leftText: '',
				rightText: '>',
				icon: 'icon-duration_grow_dot',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'DurationButtons',
				group: 'duration',
				id: 'GrowDurationDot'
			},{
				leftText: '',
				rightText: '<',
				icon: 'icon-duration_less_dot',
				classes: 'collapsed duration',
				action: 'collapseChild',
				ctor: 'DurationButtons',
				group: 'duration',
				id: 'LessDurationDot'
			},{
				leftText: '',
				rightText: 'Ctrl-3',
				icon: 'icon-triplet',
				classes: 'collapsed duration tuplet',
				action: 'collapseChild',
				ctor: 'DurationButtons',
				group: 'duration',
				id: 'TripletButton'
			},{
				leftText: '',
				rightText: 'Ctrl-5',
				icon: 'icon-quint',
				classes: 'collapsed duration tuplet',
				action: 'collapseChild',
				ctor: 'DurationButtons',
				group: 'duration',
				id: 'QuintupletButton'
			},{
				leftText: '',
				rightText: 'Ctrl-7',
				icon: 'icon-septuplet',
				classes: 'collapsed duration tuplet',
				action: 'collapseChild',
				ctor: 'DurationButtons',
				group: 'duration',
				id: 'SeptupletButton'
			},
			{
				leftText: '',
				rightText: 'Ctrl-0',
				icon: 'icon-no_tuplet',
				classes: 'collapsed duration tuplet',
				action: 'collapseChild',
				ctor: 'DurationButtons',
				group: 'duration',
				id: 'NoTupletButton'
			}
			];
	}

	static get noteRibbonButtons() {
		return [{
				leftText: '',
				rightText: '',
				classes: 'icon  collapseParent',
				icon: 'icon-note',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'notes',
				id: 'NoteButtons'
			}, {
				leftText: 'A',
				rightText: 'a',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'ANoteButton'
			}, {
				leftText: 'B',
				rightText: 'b',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'BNoteButton'
			}, {
				leftText: 'C',
				rightText: 'c',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'CNoteButton'
			}, {
				leftText: 'D',
				rightText: 'd',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'DNoteButton'
			}, {
				leftText: 'E',
				rightText: 'e',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'ENoteButton'
			}, {
				leftText: 'F',
				rightText: 'f',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'FNoteButton'
			}, {
				leftText: 'G',
				rightText: 'g',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'GNoteButton'
			}, {
				leftText: '',
				rightText: '-',
				icon: 'icon-sharp',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'UpNoteButton'
			}, {
				leftText: '',
				rightText: '=',
				icon: 'icon-flat',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'DownNoteButton'
			}, {
				leftText: '',
				rightText: 'r',
				icon: 'icon-rest',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'ToggleRestButton'
			}, {
				leftText: '8va',
				rightText: 'Shift=',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'UpOctaveButton'
			}, {
				leftText: '8vb',
				rightText: 'Shift-',
				icon: '',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'DownOctaveButton'
			}, {
				leftText: '',
				rightText: 'ShiftE',
				icon: 'icon-accident',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'ToggleAccidental'
			}, {
				leftText: '',
				rightText: 'ShiftF',
				icon: 'icon-courtesy',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NoteButtons',
				group: 'notes',
				id: 'ToggleCourtesy'
			}

		];
	}
	static get articulationButtons() {
		return [{
				leftText: '',
				rightText: '',
				icon: 'icon-articulation',
				classes: 'icon collapseParent articulation',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'articulations',
				id: 'articulationButtons'
			}, {
				leftText: '',
				rightText: 'h',
				icon: 'icon-accent_above',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'accentAboveButton'
			}, {
				leftText: '',
				rightText: 'H',
				icon: 'icon-accent_below',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'accentBelowButton'
			}, {
				leftText: '',
				rightText: 'i',
				icon: 'icon-tenuto_above',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'tenutoAboveButton'
			}, {
				leftText: '',
				rightText: 'I',
				icon: 'icon-tenuto_below',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'tenutoBelowButton'
			}, {
				leftText: '',
				rightText: 'j',
				icon: 'icon-staccato_above',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'staccatoAboveButton'
			}, {
				leftText: '',
				rightText: 'J',
				icon: 'icon-staccato_below',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'staccatoBelowButton'
			}, {
				leftText: '',
				rightText: 'k',
				icon: 'icon-marcato_above',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'marcatoAboveButton'
			}, {
				leftText: '',
				rightText: 'K',
				icon: 'icon-marcato_below',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'marcatoBelowButton'
			}, {
				leftText: '',
				rightText: 'l',
				icon: 'icon-pitz_above',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'pizzicatoAboveButton'
			}, {
				leftText: '',
				rightText: 'L',
				icon: 'icon-pitz_below',
				classes: 'icon collapsed articulation',
				action: 'collapseChild',
				ctor: 'ArticulationButtons',
				group: 'articulations',
				id: 'pizzicatoBelowButton'
			}
		];
	}
	static get navigationButtons() {
		return [{
				leftText: '',
				rightText: '',
				classes: 'icon  collapseParent',
				icon: 'icon-navigate',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'navigation',
				id: 'NavigationButtons'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-arrow-left',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navLeftButton'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-arrow-right',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navRightButton'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-arrow-up',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navUpButton'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-arrow-down',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navDownButton'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-fforward',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navFastForward'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-rewind',
				classes: 'collapsed',
				action: 'collapseChild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navRewind'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-note_select_left',
				classes: 'collapsed selection-icon',
				action: 'collapseChild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navGrowLeft'
			}, {
				leftText: '',
				rightText: '',
				icon: 'icon-note_select_right',
				classes: 'collapsed selection-icon',
				action: 'collapseChild',
				ctor: 'NavigationButtons',
				group: 'navigation',
				id: 'navGrowRight'
			}
		];
	}
	static get chordButtons() {
		return [{
				icon: 'icon-chords',
				leftText: '',
				rightText: '',
				classes: 'icon collapseParent',
				action: 'collapseParent',
				ctor: 'CollapseRibbonControl',
				group: 'chords',
				id: 'CreateChordButtons'
			}, {
				icon: 'icon-arrow-up',
				leftText: '2nd',
				rightText: '2',
				classes: 'collapsed addChord',
				action: 'collapseChild',
				dataElements: {
					interval: '1',
					direction: '1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'SecondUpButton'
			}, {
				icon: 'icon-arrow-down',
				leftText: '2nd',
				rightText: 'Shift 2',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '1',
					direction: '1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'SecondDownButton'
			}, {
				icon: 'icon-arrow-up',
				leftText: '3rd',
				rightText: '3',
				classes: 'collapsed addChord',
				action: 'collapseChild',
				dataElements: {
					interval: '2',
					direction: '1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'ThirdUpButton'
			}, {
				icon: 'icon-arrow-down',
				leftText: '3rd',
				rightText: 'Shift 3',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '2',
					direction: '-1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'ThirdDownButton'
			}, {
				icon: 'icon-arrow-up',
				leftText: '4th',
				rightText: '4',
				classes: 'collapsed addChord',
				action: 'collapseChild',
				dataElements: {
					interval: '3',
					direction: '1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'FourthUpButton'
			}, {
				icon: 'icon-arrow-down',
				leftText: '4th',
				rightText: 'Shift 4',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '3',
					direction: '-1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'FourthDownButton'
			}, {
				icon: 'icon-arrow-up',
				leftText: '5th',
				rightText: '5',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '4',
					direction: '1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'FifthUpButton'
			}, {
				icon: 'icon-arrow-down',
				leftText: '5th',
				rightText: 'Shift 5',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '4',
					direction: '-1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'FifthDownButton'
			}, {
				icon: 'icon-arrow-up',
				leftText: '6th',
				rightText: '6',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '5',
					direction: '1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'SixthUpButton'
			}, {
				icon: 'icon-arrow-down',
				leftText: '6th',
				rightText: 'Shift 6',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '5',
					direction: '-1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'SixthDownButton'
			}, {
				icon: 'icon-arrow-up',
				leftText: '7th',
				rightText: '7',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '6',
					direction: '1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'SeventhUpButton'
			}, {
				icon: 'icon-arrow-down',
				leftText: '7th',
				rightText: 'Shift 7',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '6',
					direction: '-1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'SeventhDownButton'
			}, {
				icon: 'icon-arrow-up',
				leftText: '8va',
				rightText: '8',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '7',
					direction: '1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'OctaveUpButton'
			}, {
				icon: 'icon-arrow-down',
				leftText: '7th',
				rightText: 'Shift 7',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				dataElements: {
					interval: '7',
					direction: '-1'
				},
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'OctaveDownButton'
			}, {
				icon: '',
				leftText: 'Collapse',
				rightText: '',
				classes: 'collapsed addChord dirdown',
				action: 'collapseChild',
				ctor: 'ChordButtons',
				group: 'chords',
				id: 'CollapseChordButton'
			}
		];
	}

	static get leftRibbonButtons() {
		return [{
				icon: '',
				leftText: 'Help',
				rightText: '?',
				classes: 'help-button',
				action: 'modal',
				ctor: 'helpModal',
				group: 'scoreEdit',
				id: 'helpDialog'
			}, {
				leftText: 'Staves',
				rightText: '/s',
				icon: '',
				classes: 'staff-modify',
				action: 'menu',
				ctor: 'SuiAddStaffMenu',
				group: 'scoreEdit',
				id: 'addStaffMenu'
			}, {
				leftText: 'Dynamics',
				rightText: '/d',
				icon: '',
				classes: 'note-modify',
				action: 'menu',
				ctor: 'SuiDynamicsMenu',
				group: 'scoreEdit',
				id: 'dynamicsMenu'
			}, {
				leftText: 'Key',
				rightText: '/k',
				icon: '',
				classes: 'note-modify',
				action: 'menu',
				ctor: 'suiKeySignatureMenu',
				group: 'scoreEdit',
				id: 'keyMenu'
			}, {
				leftText: 'Lines',
				rightText: '/l',
				icon: '',
				classes: 'icon note-modify',
				action: 'menu',
				ctor: 'suiStaffModifierMenu',
				group: 'scoreEdit',
				id: 'staffModifierMenu'
			},
			 {
				leftText: 'Piano',
				rightText: '',
				icon: '',
				classes: 'icon keyboard',
				action: 'modal',
				ctor: 'suiPiano',
				group: 'scoreEdit',
				id: 'pianoModal'
			}
		];
	}
}
