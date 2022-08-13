// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.

import { ButtonDefinition } from "../../buttons/button";
import { RibbonLayout } from "../../common";

export class simpleRibbonLayout {
  static get ribbons(): RibbonLayout {
    var left = simpleRibbonLayout.leftRibbonIds;
    var top = simpleRibbonLayout.displayIds.concat(simpleRibbonLayout.noteButtonIds).concat(simpleRibbonLayout.navigateButtonIds)
      .concat(simpleRibbonLayout.durationIds);
      
    return {
      left: left,
      top: top
    };
  }

  static get simpleRibbonLayout(): ButtonDefinition[] {
    return simpleRibbonLayout.leftRibbonButtons.concat(
      simpleRibbonLayout.navigationButtons).concat(
        simpleRibbonLayout.noteRibbonButtons).concat(
          simpleRibbonLayout.durationRibbonButtons);
  }

  static get leftRibbonIds() {
    return [ 'libraryMenu',
    'layoutMenu',  
    'tempoModal', 'timeSignatureMenu', 'keyMenu', 'staffModifierMenu',
       'pianoModal'];
  }
  static get noteButtonIds() {
    return ['NoteButtons',
      'UpNoteButton', 'DownNoteButton',
      'UpOctaveButton', 'DownOctaveButton', 'ToggleRestButton', 'ToggleSlashButton', 'ToggleAccidental', 'ToggleCourtesy'];
  }
  
  static get navigateButtonIds() {
    return ['NavigationButtons', 'navLeftButton', 'navRightButton', 'navUpButton', 'navDownButton', 'moreNavButtons', 'navFastForward', 'navRewind',
      'navGrowLeft', 'navGrowRight'];
  }
  
  static get intervalIds() {
    return ['CreateChordButtons', 'SecondUpButton', 'SecondDownButton', 'ThirdUpButton', 'ThirdDownButton', 'FourthUpButton', 'FourthDownButton',
      'FifthUpButton', 'FifthDownButton', 'SixthUpButton', 'SixthDownButton'
      , 'SeventhUpButton', 'SeventhDownButton', 'OctaveUpButton', 'OctaveDownButton', 'CollapseChordButton'];
  }

  static get durationIds() {
    return ['DurationButtons', 'GrowDuration', 'LessDuration', 'GrowDurationDot', 'LessDurationDot', 'TripletButton', 'QuintupletButton', 'SeptupletButton', 'NoTupletButton'];
  }

  static get playerIds() {
    return ['playerButtons', 'playButton', 'pauseButton', 'stopButton'];
  }

  static get displayIds() {
    return ['quickButtons', 'refresh', 'zoomout', 'zoomin', 'playButton2', 'stopButton2'];
  }

  static get displayButtons(): ButtonDefinition[] {
    return [{
      leftText: '',
      rightText: '',
      classes: 'icon  hide',
      icon: 'icon-zoomplus',
      action: 'collapseParent',
      ctor: 'CollapseRibbonControl',
      group: 'quickButtons',
      id: 'quickButtons'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon   refresh',
      icon: 'icon-refresh',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'refresh'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon   refresh',
      icon: 'icon-zoomplus',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'zoomout'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon   refresh',
      icon: 'icon-zoomminus',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'zoomin'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon   play',
      icon: 'icon-play3',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'playButton2'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon   stop2',
      icon: 'icon-stop2',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'stopButton2'
    }
    ];
  }

  static get durationRibbonButtons(): ButtonDefinition[] {
    return [{
      leftText: '',
      rightText: '',
      classes: 'icon  collapseParent duration',
      icon: 'icon-duration',
      action: 'collapseParent',
      ctor: 'CollapseRibbonControl',
      group: 'duration',
      id: 'DurationButtons'
    }, {
      leftText: '',
      rightText: '.',
      icon: 'icon-duration_grow',
      classes: 'collapsed duration',
      action: 'collapseChild',
      ctor: 'DurationButtons',
      group: 'duration',
      id: 'GrowDuration'
    }, {
      leftText: '',
      rightText: ',',
      icon: 'icon-duration_less',
      classes: 'collapsed duration',
      action: 'collapseChild',
      ctor: 'DurationButtons',
      group: 'duration',
      id: 'LessDuration'
    }, {
      leftText: '',
      rightText: '>',
      icon: 'icon-duration_grow_dot',
      classes: 'collapsed duration',
      action: 'collapseChild',
      ctor: 'DurationButtons',
      group: 'duration',
      id: 'GrowDurationDot'
    }, {
      leftText: '',
      rightText: '<',
      icon: 'icon-duration_less_dot',
      classes: 'collapsed duration',
      action: 'collapseChild',
      ctor: 'DurationButtons',
      group: 'duration',
      id: 'LessDurationDot'
    }, {
      leftText: '',
      rightText: 'Ctrl-3',
      icon: 'icon-triplet',
      classes: 'collapsed duration tuplet',
      action: 'collapseChild',
      ctor: 'DurationButtons',
      group: 'duration',
      id: 'TripletButton'
    }, {
      leftText: '',
      rightText: 'Ctrl-5',
      icon: 'icon-quint',
      classes: 'collapsed duration tuplet',
      action: 'collapseChild',
      ctor: 'DurationButtons',
      group: 'duration',
      id: 'QuintupletButton'
    }, {
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

  static get noteRibbonButtons(): ButtonDefinition[] {
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
      leftText: '',
      rightText: 'r',
      icon: 'icon-slash',
      classes: 'collapsed',
      action: 'collapseChild',
      ctor: 'NoteButtons',
      group: 'notes',
      id: 'ToggleSlashButton'
    }, {
      leftText: '...',
      rightText: '',
      icon: 'icon-circle-left',
      classes: 'collapsed expander',
      action: 'collapseMore',
      ctor: 'ExtendedCollapseParent',
      group: 'notes',
      id: 'moreNoteButtons'
    }, {
      leftText: '',
      rightText: 'G',
      icon: 'icon-grace_note',
      classes: 'collapsed graceIcon',
      action: 'collapseChild',
      ctor: 'NoteButtons',
      group: 'notes',
      id: 'AddGraceNote'
    }, {
      leftText: '',
      rightText: '',
      icon: 'icon-grace_slash',
      classes: 'collapsed graceIcon',
      action: 'collapseChild',
      ctor: 'NoteButtons',
      group: 'notes',
      id: 'SlashGraceNote'
    }, {
      leftText: '',
      rightText: 'alt-g',
      icon: 'icon-grace_remove',
      classes: 'collapsed graceIcon',
      action: 'collapseChild',
      ctor: 'NoteButtons',
      group: 'notes',
      id: 'RemoveGraceNote'
    }, {
      leftText: '',
      rightText: '',
      icon: 'icon-notex',
      classes: 'collapsed graceIcon',
      action: 'collapseChild',
      ctor: 'NoteButtons',
      group: 'notes',
      id: 'XNoteHead'
    }, {
      leftText: '',
      rightText: '',
      icon: 'icon-notehead-triangleup',
      classes: 'collapsed graceIcon',
      action: 'collapseChild',
      ctor: 'NoteButtons',
      group: 'notes',
      id: 'TriUpNoteHead'
    }, {
      leftText: '',
      rightText: '',
      icon: 'icon-notehead-circlex',
      classes: 'collapsed graceIcon',
      action: 'collapseChild',
      ctor: 'NoteButtons',
      group: 'notes',
      id: 'CircleXNoteHead'
    }, {
      leftText: '',
      rightText: '',
      icon: 'icon-notehead-diamondblack',
      classes: 'collapsed graceIcon',
      action: 'collapseChild',
      ctor: 'NoteButtons',
      group: 'notes',
      id: 'DiamondNoteHead'
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
  static get playerButtons(): ButtonDefinition[] {
    // .icon-play3
    return [{
      leftText: '',
      rightText: '',
      icon: 'icon-equalizer2',
      classes: 'icon collapseParent player',
      action: 'collapseParent',
      ctor: 'CollapseRibbonControl',
      group: 'playerButtons',
      id: 'playerButtons'
    }, {
      leftText: '',
      rightText: 'p',
      icon: 'icon-play3',
      classes: 'icon collapsed player',
      action: 'collapseChild',
      ctor: 'PlayerButtons',
      group: 'playerButtons',
      id: 'playButton'
    },
    {
      leftText: '',
      rightText: 's',
      icon: 'icon-stop2',
      classes: 'icon collapsed player',
      action: 'collapseChild',
      ctor: 'PlayerButtons',
      group: 'playerButtons',
      id: 'stopButton'
    },
    {
      leftText: '',
      rightText: 'P',
      icon: 'icon-pause2',
      classes: 'icon collapsed player',
      action: 'collapseChild',
      ctor: 'PlayerButtons',
      group: 'playerButtons',
      id: 'pauseButton'
    }];
  }
  static get navigationButtons(): ButtonDefinition[] {
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
      leftText: '...',
      rightText: '',
      icon: '',
      classes: 'collapsed expander',
      action: 'collapseMore',
      ctor: 'ExtendedCollapseParent',
      group: 'navigation',
      id: 'moreNavButtons'
    }, {
      leftText: '',
      rightText: '',
      icon: 'icon-fforward',
      classes: 'collapsed',
      action: 'collapseGrandchild',
      ctor: 'NavigationButtons',
      group: 'navigation',
      id: 'navFastForward'
    }, {
      leftText: '',
      rightText: '',
      icon: 'icon-rewind',
      classes: 'collapsed',
      action: 'collapseGrandchild',
      ctor: 'NavigationButtons',
      group: 'navigation',
      id: 'navRewind'
    }, {
      leftText: '',
      rightText: '',
      icon: 'icon-note_select_left',
      classes: 'collapsed selection-icon',
      action: 'collapseGrandchild',
      ctor: 'NavigationButtons',
      group: 'navigation',
      id: 'navGrowLeft'
    }, {
      leftText: '',
      rightText: '',
      icon: 'icon-note_select_right',
      classes: 'collapsed selection-icon',
      action: 'collapseGrandchild',
      ctor: 'NavigationButtons',
      group: 'navigation',
      id: 'navGrowRight'
    }
    ];
  }

  static get leftRibbonButtons(): ButtonDefinition[] {
    return [ {
      leftText: 'Library',
      rightText: '/L',
      icon: '',
      classes: 'file-modify menu-select',
      action: 'modal',
      ctor: 'SuiLibraryDialog',
      group: 'scoreEdit',
      id: 'libraryMenu'
    }, {
      leftText: 'Score',
      rightText: '',
      icon: '',
      classes: 'icon ',
      action: 'menu',
      ctor: 'SuiScoreMenu',
      group: 'scoreEdit',
      id: 'layoutMenu'
    }, {
      leftText: 'Tempo',
      rightText: 't',
      icon: '',
      classes: 'icon ',
      action: 'modal',
      ctor: 'SuiTempoDialog',
      group: 'scoreEdit',
      id: 'tempoModal'
    }, {
      leftText: 'Time Signature',
      rightText: '/m',
      icon: '',
      classes: 'staff-modify menu-select',
      action: 'menu',
      ctor: 'SuiTimeSignatureMenu',
      group: 'scoreEdit',
      id: 'timeSignatureMenu'
    },
    {
      leftText: 'Key',
      rightText: '/k',
      icon: '',
      classes: 'note-modify menu-select',
      action: 'menu',
      ctor: 'SuiKeySignatureMenu',
      group: 'scoreEdit',
      id: 'keyMenu'
    },
    ];
  }
}
