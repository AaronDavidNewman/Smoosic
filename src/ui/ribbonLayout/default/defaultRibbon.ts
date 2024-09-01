// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.

import { ButtonDefinition } from "../../buttons/button";
import { RibbonLayout } from "../../common";

export class defaultRibbonLayout {
  static get ribbons(): RibbonLayout {
    var left = defaultRibbonLayout.leftRibbonIds;
    var top = defaultRibbonLayout.displayIds.concat(defaultRibbonLayout.noteButtonIds).concat(defaultRibbonLayout.navigateButtonIds)
      .concat(defaultRibbonLayout.durationIds)
      .concat(defaultRibbonLayout.beamIds).concat(defaultRibbonLayout.measureIds)
      .concat(defaultRibbonLayout.staveIds)
      .concat(defaultRibbonLayout.textIds).concat(defaultRibbonLayout.playerIds)
      .concat(defaultRibbonLayout.voiceButtonIds).concat(defaultRibbonLayout.debugIds);

    return {
      left: left,
      top: top
    };
  }

  static get ribbonButtons(): ButtonDefinition[] {
    return defaultRibbonLayout.leftRibbonButtons.concat(
      defaultRibbonLayout.navigationButtons).concat(
        defaultRibbonLayout.noteRibbonButtons).concat(
              defaultRibbonLayout.chordButtons).concat(
                defaultRibbonLayout.durationRibbonButtons).concat(defaultRibbonLayout.beamRibbonButtons).concat(defaultRibbonLayout.measureRibbonButtons)
      .concat(defaultRibbonLayout.staveRibbonButtons)
      .concat(defaultRibbonLayout.textRibbonButtons).concat(defaultRibbonLayout.playerButtons)
      .concat(defaultRibbonLayout.voiceRibbonButtons).concat(defaultRibbonLayout.displayButtons).concat(defaultRibbonLayout.debugRibbonButtons);
  }

  static get leftRibbonIds() {
    return ['helpDialog', 'languageMenu', 'fileMenu', 'libraryMenu',
    'scoreMenu', 'partMenu', 'noteMenu', 'addStaffMenu', 'measureModal', 
    'tempoModal', 'timeSignatureMenu', 'keyMenu', 'staffModifierMenu',
       'pianoModal'];
  }
  static get noteButtonIds() {
    return ['NoteButtons',
      'UpNoteButton', 'DownNoteButton', 'AddGraceNote', 'RemoveGraceNote', 'SlashGraceNote',      
      'UpOctaveButton', 'DownOctaveButton', 'ToggleRestButton', 'ToggleSlashButton', 'ToggleAccidental', 'ToggleCourtesy'];
  }
  static get voiceButtonIds() {
    return ['VoiceButtons', 'V1Button', 'V2Button', 'V3Button', 'V4Button', 'VXButton'];
  }
  static get navigateButtonIds() {
    return ['NavigationButtons', 'navLeftButton', 'navRightButton', 'navUpButton', 'navDownButton', 'moreNavButtons', 'navFastForward', 'navRewind',
      'navGrowLeft', 'navGrowRight'];
  }
  static get articulateButtonIds() {
    return ['articulationButtons', 'accentButton', 'tenutoButton', 'staccatoButton', 'marcatoButton', 'fermataButton', 'pizzicatoButton', 'mordentButton', 'mordentInvertedButton', 'trillButton',
        'pedalOpenButton', 'caesuraButton', 'pedalClosedButton', 'breathButton',
       'scoopButton', 'dropButton', 'dropLongButton', 'doitButton', 'doitLongButton', 'flipButton', 'smearButton'
    ];
  }

  static get intervalIds() {
    return ['CreateChordButtons', 'SecondUpButton', 'SecondDownButton', 'ThirdUpButton', 'ThirdDownButton', 'FourthUpButton', 'FourthDownButton',
      'FifthUpButton', 'FifthDownButton', 'SixthUpButton', 'SixthDownButton'
      , 'SeventhUpButton', 'SeventhDownButton', 'OctaveUpButton', 'OctaveDownButton', 'CollapseChordButton'];
  }

  static get debugIds() {
    return ['DebugGroup', 'DebugButton2'];
  }
  static get durationIds() {
    return ['DurationButtons', 'GrowDuration', 'LessDuration', 'GrowDurationDot', 'LessDurationDot', 'TripletButton', 'QuintupletButton', 'SeptupletButton', 'NoTupletButton'];
  }
  static get measureIds() {
    return ['MeasureButtons', 'endRepeat', 'startRepeat', 'endBar', 'doubleBar', 'singleBarEnd', 'singleBarStart', 'nthEnding', 'dcAlCoda', 'dsAlCoda', 'dcAlFine', 'dsAlFine', 'coda', 'toCoda', 'segno', 'toSegno', 'fine'];
  }
  static get staveIds() {
    return ['StaveButtons', 'clefTreble', 'clefBass', 'clefAddRemove', 'clefMoveUp', 'clefMoveDown', 'moreStaffButtons',
      'clefTenor', 'clefAlto', 'clefPercussion',
      'staffBracketLower', 'staffBraceLower', 'staffDoubleConnectorLower', 'staffSingleConnectorLower'];
  }
  static get textIds() {
    return ['TextButtons', 'addTextMenu', 'rehearsalMark', 'lyrics', 'chordChanges', 'addDynamicsMenu'];
  }

  static get beamIds() {
    return ['BeamButtons', 'breakBeam', 'beamSelections', 'toggleBeamDirection'];
  }
  static get playerIds() {
    return ['playerButtons', 'playButton', 'pauseButton', 'stopButton'];
  }

  static get displayIds() {
    return ['quickButtons', 'selectPart', 'refresh', 'zoomout', 'zoomin', 'playButton2', 'stopButton2', 'keySignature'];
  }


  static get textRibbonButtons(): ButtonDefinition[] {
    return [
      {
        leftText: '',
        rightText: '',
        classes: 'icon  collapseParent measure',
        icon: 'icon-smo icon-text',
        action: 'collapseParent',
        ctor: 'CollapseRibbonControl',
        group: 'textEdit',
        id: 'TextButtons'
      }, {
        leftText: '',
        rightText: '',
        classes: 'icon collapsed textButton',
        icon: 'icon-smo icon-textBasic',
        action: 'collapseChild',
        ctor: 'TextButtons',
        group: 'textEdit',
        id: 'addTextMenu'
      }, {
        leftText: '',
        rightText: '',
        classes: 'icon  collapsed textButton',
        icon: 'icon-smo icon-rehearsemark',
        action: 'collapseChild',
        ctor: 'TextButtons',
        group: 'textEdit',
        id: 'rehearsalMark'
      }, {
        leftText: '',
        rightText: '',
        classes: 'icon  collapsed textButton',
        icon: 'icon-smo icon-lyric',
        action: 'collapseChild',
        ctor: 'TextButtons',
        group: 'textEdit',
        id: 'lyrics'
      }, {
        leftText: '',
        rightText: '',
        classes: 'icon  collapsed textButton',
        icon: 'icon-smo icon-chordSymbol',
        action: 'collapseChild',
        ctor: 'TextButtons',
        group: 'textEdit',
        id: 'chordChanges'
      }, {
        leftText: '',
        rightText: '',
        classes: 'icon  collapsed textButton',
        icon: 'icon-smo icon-mezzopiano',
        action: 'collapseChild',
        ctor: 'TextButtons',
        group: 'textEdit',
        id: 'addDynamicsMenu'
      }
    ];
  }
  static get displayButtons(): ButtonDefinition[] {
    return [{
      leftText: '',
      rightText: '',
      classes: 'icon   hide',
      icon: 'icon-smo icon-zoomplus',
      action: 'collapseParent',
      ctor: 'CollapseRibbonControl',
      group: 'quickButtons',
      id: 'quickButtons'
    }, {
      leftText: '',
      rightText: 'Select Part',
      classes: 'icon  select-part-button',
      icon: 'icon-smo icon-circle-down',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'selectPart'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon    refresh',
      icon: 'icon-smo icon-refresh',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'refresh'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon   refresh',
      icon: 'icon-smo icon-zoomplus',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'zoomout'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon   refresh',
      icon: 'icon-smo icon-zoomminus',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'zoomin'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon    play',
      icon: 'icon-smo icon-play3',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'playButton2'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon    stop2',
      icon: 'icon-smo icon-stop2',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'stopButton2'
    }, {
      leftText: 'Key',
      rightText: '',
      classes: 'icon    keysignature',
      icon: 'icon-smo',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'keySignature'
    }
    ];
  }

  static get microtoneButtons(): ButtonDefinition[] {
    return [{
      leftText: '',
      rightText: '',
      classes: 'icon   collapseParent microtones',
      icon: 'icon-smo icon-microtone',
      action: 'collapseParent',
      ctor: 'CollapseRibbonControl',
      group: 'microtone',
      id: 'MicrotoneButtons'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon   collapsed microtones',
      icon: 'icon-bravura icon-accidentalThreeQuarterTonesFlatZimmermann',
      action: 'collapseChild',
      ctor: 'MicrotoneButtons',
      group: 'microtone',
      id: 'flat25sz'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon   collapsed microtones',
      icon: 'icon-bravura icon-accidentalQuarterToneFlatStein',
      action: 'collapseChild',
      ctor: 'MicrotoneButtons',
      group: 'microtone',
      id: 'flat75sz'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon   collapsed microtones',
      icon: 'icon-bravura icon-accidentalBakiyeFlat',
      action: 'collapseChild',
      ctor: 'MicrotoneButtons',
      group: 'microtone',
      id: 'flat25ar'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon   collapsed microtones',
      icon: 'icon-smo icon-sharp75',
      action: 'collapseChild',
      ctor: 'MicrotoneButtons',
      group: 'microtone',
      id: 'sharp75'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon  collapsed microtones',
      icon: 'icon-bravura icon-accidentalThreeQuarterTonesSharpStein',
      action: 'collapseChild',
      ctor: 'MicrotoneButtons',
      group: 'microtone',
      id: 'sharp125'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon  collapsed microtones',
      icon: 'icon-bravura icon-accidentalQuarterToneSharpStein',
      action: 'collapseChild',
      ctor: 'MicrotoneButtons',
      group: 'microtone',
      id: 'sharp25'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon  collapsed microtones',
      icon: 'icon-bravura icon-accidentalSori',
      action: 'collapseChild',
      ctor: 'MicrotoneButtons',
      group: 'microtone',
      id: 'sori'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon  collapsed microtones',
      icon: 'icon-bravura icon-accidentalKoron',
      action: 'collapseChild',
      ctor: 'MicrotoneButtons',
      group: 'microtone',
      id: 'koron'
    }];
  }

  static get staveRibbonButtons(): ButtonDefinition[] {
    return [{
      leftText: '',
      rightText: '',
      classes: 'icon  collapseParent staves',
      icon: 'icon-bravura icon-gClef',
      action: 'collapseParent',
      ctor: 'CollapseRibbonControl',
      group: 'staves',
      id: 'StaveButtons'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon  collapsed staves',
      icon: 'icon-bravura icon-gClef',
      action: 'collapseChild',
      ctor: 'StaveButtons',
      group: 'staves',
      id: 'clefTreble'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon  collapsed staves',
      icon: 'icon-bravura icon-fClef',
      action: 'collapseChild',
      ctor: 'StaveButtons',
      group: 'staves',
      id: 'clefBass'
    }, 
    {
      leftText: '',
      rightText: '',
      classes: 'icon  collapsed staves',
      icon: 'icon-smo icon-arrow-up',
      action: 'collapseChild',
      ctor: 'StaveButtons',
      group: 'staves',
      id: 'clefMoveUp'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon  collapsed staves',
      icon: 'icon-smo icon-arrow-down',
      action: 'collapseChild',
      ctor: 'StaveButtons',
      group: 'staves',
      id: 'clefMoveDown'
    },
    {
      leftText: '...',
      rightText: '',
      icon: 'icon-smo icon-circle-left',
      classes: 'collapsed expander',
      action: 'collapseMore',
      ctor: 'ExtendedCollapseParent',
      group: 'staves',
      id: 'moreStaffButtons'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon  collapsed staves',
      icon: 'icon-bravura icon-cClef',
      action: 'collapseGrandchild',
      ctor: 'StaveButtons',
      group: 'staves',
      id: 'clefTenor'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon  collapsed staves',
      icon: 'icon-smo icon-alto',
      action: 'collapseGrandchild',
      ctor: 'StaveButtons',
      group: 'staves',
      id: 'clefAlto'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon  collapsed staves',
      icon: 'icon-bravura icon-unpitchedPercussionClef1',
      action: 'collapseGrandchild',
      ctor: 'StaveButtons',
      group: 'staves',
      id: 'clefPercussion'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon  collapsed staves',
      icon: 'icon-smo icon-brace',
      action: 'collapseGrandchild',
      ctor: 'StaveButtons',
      group: 'staves',
      id: 'staffBraceLower'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon  collapsed staves',
      icon: 'icon-smo icon-bracket',
      action: 'collapseGrandchild',
      ctor: 'StaveButtons',
      group: 'staves',
      id: 'staffBracketLower'
    }
    ];
  }

  static get beamRibbonButtons(): ButtonDefinition[] {
    return [{
      leftText: '',
      rightText: '',
      classes: 'icon  collapseParent beams',
      icon: 'icon-flag',
      action: 'collapseParent',
      ctor: 'CollapseRibbonControl',
      group: 'beams',
      id: 'BeamButtons'
    }, {
      leftText: '',
      rightText: 'x',
      icon: 'icon-beamBreak',
      classes: 'collapsed beams',
      action: 'collapseChild',
      ctor: 'BeamButtons',
      group: 'beams',
      id: 'breakBeam'
    },
    {
      leftText: '',
      rightText: 'Shift-X',
      icon: 'icon-beam',
      classes: 'collapsed beams',
      action: 'collapseChild',
      ctor: 'BeamButtons',
      group: 'beams',
      id: 'beamSelections'
    },
    {
      leftText: '',
      rightText: 'Shift-B',
      icon: 'icon-flagFlip',
      classes: 'collapsed beams',
      action: 'collapseChild',
      ctor: 'BeamButtons',
      group: 'beams',
      id: 'toggleBeamDirection'
    }
    ];
  }

  static get measureRibbonButtons(): ButtonDefinition[] {
    return [{
      leftText: '',
      rightText: '',
      classes: 'icon  collapseParent measure',
      icon: 'icon-end_rpt',
      action: 'collapseParent',
      ctor: 'CollapseRibbonControl',
      group: 'measure',
      id: 'MeasureButtons'
    }, {
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
      icon: 'icon-bravura icon-coda',
      classes: 'collapsed duration',
      action: 'collapseChild',
      ctor: 'MeasureButtons',
      group: 'measure',
      id: 'coda'
    },
    {
      leftText: 'to ',
      rightText: '',
      icon: 'icon-bravura icon-coda',
      classes: 'collapsed duration',
      action: 'collapseChild',
      ctor: 'MeasureButtons',
      group: 'measure',
      id: 'toCoda'
    },
    {
      leftText: '',
      rightText: '',
      icon: 'icon-bravura icon-segno',
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
  static get debugRibbonButtons(): ButtonDefinition[] {
    return [{
      leftText: '',
      rightText: '',
      classes: 'icon  collapseParent',
      icon: 'icon-new-tab',
      action: 'collapseParent',
      ctor: 'CollapseRibbonControl',
      group: 'debug',
      id: 'DebugGroup'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon  collapsed',
      icon: 'icon-new-tab',
      action: 'collapseChild',
      ctor: 'DebugButtons',
      group: 'debug',
      id: 'DebugButton2'
    }];
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

  static get voiceRibbonButtons(): ButtonDefinition[] {
    return [{
      leftText: '',
      rightText: '',
      classes: 'icon  collapseParent',
      icon: 'icon-Vo',
      action: 'collapseParent',
      ctor: 'CollapseRibbonControl',
      group: 'voices',
      id: 'VoiceButtons'
    }, {
      leftText: '',
      rightText: '',
      icon: 'icon-V1',
      classes: 'collapsed',
      action: 'collapseChild',
      ctor: 'VoiceButtons',
      group: 'voices',
      id: 'V1Button'
    }, {
      leftText: '',
      rightText: '',
      icon: 'icon-V2',
      classes: 'collapsed',
      action: 'collapseChild',
      ctor: 'VoiceButtons',
      group: 'voices',
      id: 'V2Button'
    }, {
      leftText: '',
      rightText: '',
      icon: 'icon-V3',
      classes: 'collapsed',
      action: 'collapseChild',
      ctor: 'VoiceButtons',
      group: 'voices',
      id: 'V3Button'
    }, {
      leftText: '',
      rightText: '',
      icon: 'icon-V4',
      classes: 'collapsed',
      action: 'collapseChild',
      ctor: 'VoiceButtons',
      group: 'voices',
      id: 'V4Button'
    }, {
      leftText: '',
      rightText: '',
      icon: 'icon-Vx',
      classes: 'collapsed',
      action: 'collapseChild',
      ctor: 'VoiceButtons',
      group: 'voices',
      id: 'VXButton'
    }
    ];
  }
  static get noteRibbonButtons(): ButtonDefinition[] {
    return [{
      leftText: '',
      rightText: '',
      classes: 'icon  collapseParent',
      icon: 'icon-bravura icon-note',
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
      icon: 'icon-bravura icon-accidentalSharp',
      classes: 'collapsed',
      action: 'collapseChild',
      ctor: 'NoteButtons',
      group: 'notes',
      id: 'UpNoteButton'
    }, {
      leftText: '',
      rightText: '=',
      icon: 'icon-bravura icon-accidentalFlat',
      classes: 'collapsed',
      action: 'collapseChild',
      ctor: 'NoteButtons',
      group: 'notes',
      id: 'DownNoteButton'
    }, {
      leftText: '',
      rightText: 'r',
      icon: 'icon-bravura icon-restQuarter',
      classes: 'collapsed',
      action: 'collapseChild',
      ctor: 'NoteButtons',
      group: 'notes',
      id: 'ToggleRestButton'
    }, {
      leftText: '',
      rightText: 'r',
      icon: 'icon-bravura icon-repeatBarSlash',
      classes: 'collapsed',
      action: 'collapseChild',
      ctor: 'NoteButtons',
      group: 'notes',
      id: 'ToggleSlashButton'
    }, {
      leftText: '...',
      rightText: '',
      icon: 'icon-smo icon-circle-left',
      classes: 'collapsed expander',
      action: 'collapseMore',
      ctor: 'ExtendedCollapseParent',
      group: 'notes',
      id: 'moreNoteButtons'
    }, {
      leftText: '',
      rightText: 'G',
      icon: 'icon-smo icon-grace_note',
      classes: 'collapsed graceIcon',
      action: 'collapseChild',
      ctor: 'NoteButtons',
      group: 'notes',
      id: 'AddGraceNote'
    }, {
      leftText: '',
      rightText: '',
      icon: 'icon-smo icon-grace_slash',
      classes: 'collapsed graceIcon',
      action: 'collapseChild',
      ctor: 'NoteButtons',
      group: 'notes',
      id: 'SlashGraceNote'
    }, {
      leftText: '',
      rightText: 'alt-g',
      icon: 'icon-smo icon-grace_remove',
      classes: 'collapsed graceIcon',
      action: 'collapseChild',
      ctor: 'NoteButtons',
      group: 'notes',
      id: 'RemoveGraceNote'
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
      icon: 'icon-smo icon-accident',
      classes: 'collapsed',
      action: 'collapseChild',
      ctor: 'NoteButtons',
      group: 'notes',
      id: 'ToggleAccidental'
    }, {
      leftText: '',
      rightText: 'ShiftF',
      icon: 'icon-smo icon-courtesy',
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
  // no longer used
 
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
  static get chordButtons(): ButtonDefinition[] {
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

  static get leftRibbonButtons(): ButtonDefinition[] {
    return [{
      icon: '',
      leftText: 'Help',
      rightText: '?',
      classes: 'help-button nav-link link-body-emphasis',
      action: 'modal',
      ctor: 'helpModal',
      group: 'scoreEdit',
      id: 'helpDialog'
    }, {
      leftText: 'Language',
      rightText: '',
      icon: '',
      classes: 'language-select menu-select  nav-link link-body-emphasis',
      action: 'menu',
      ctor: 'SuiLanguageMenu',
      group: 'scoreEdit',
      id: 'languageMenu'
    }, {
      leftText: 'File',
      rightText: '',
      icon: '',
      classes: 'file-modify menu-select  nav-link link-body-emphasis',
      action: 'menu',
      ctor: 'SuiFileMenu',
      group: 'scoreEdit',
      id: 'fileMenu'
    }, {
      leftText: 'Library',
      rightText: '',
      icon: '',
      classes: 'file-modify menu-select  nav-link link-body-emphasis',
      action: 'modal',
      ctor: 'SuiLibraryDialog',
      group: 'scoreEdit',
      id: 'libraryMenu'
    }, {
      leftText: 'Score',
      rightText: '',
      icon: '',
      classes: 'icon  nav-link link-body-emphasis',
      action: 'menu',
      ctor: 'SuiScoreMenu',
      group: 'scoreEdit',
      id: 'scoreMenu'
    },
    {
      leftText: 'Parts',
      rightText: '',
      icon: '',
      classes: 'icon nav-link link-body-emphasis',
      action: 'menu',
      ctor: 'SuiPartMenu',
      group: 'scoreEdit',
      id: 'partMenu'
    }, {
      leftText: 'Notes',
      rightText: '',
      icon: '',
      classes: 'icon nav-link link-body-emphasis',
      action: 'menu',
      ctor: 'SuiNoteMenu',
      group: 'scoreEdit',
      id: 'noteMenu'
    }, {
      leftText: 'Measure',
      rightText: '',
      icon: '',
      classes: 'icon menu-select nav-link link-body-emphasis',
      action: 'menu',
      ctor: 'SuiMeasureMenu',
      group: 'scoreEdit',
      id: 'measureModal'
    }, {
      leftText: 'Tempo',
      rightText: '',
      icon: '',
      classes: 'icon nav-link link-body-emphasis',
      action: 'modal',
      ctor: 'SuiTempoDialog',
      group: 'scoreEdit',
      id: 'tempoModal'
    }, {
      leftText: 'Time Signature',
      rightText: '',
      icon: '',
      classes: 'staff-modify menu-select nav-link link-body-emphasis',
      action: 'menu',
      ctor: 'SuiTimeSignatureMenu',
      group: 'scoreEdit',
      id: 'timeSignatureMenu'
    },
    {
      leftText: 'Lines',
      rightText: '',
      icon: '',
      classes: 'icon note-modify menu-select nav-link link-body-emphasis',
      action: 'menu',
      ctor: 'SuiStaffModifierMenu',
      group: 'scoreEdit',
      id: 'staffModifierMenu'
    },
    ];
  }
}
