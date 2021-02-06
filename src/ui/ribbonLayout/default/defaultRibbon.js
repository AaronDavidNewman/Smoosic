

class defaultRibbonLayout {

  static get ribbons() {
    var left = defaultRibbonLayout.leftRibbonIds;
    var top = defaultRibbonLayout.displayIds.concat(defaultRibbonLayout.noteButtonIds).concat(defaultRibbonLayout.navigateButtonIds)
        .concat(defaultRibbonLayout.articulateButtonIds).concat(defaultRibbonLayout.microtoneIds)
        .concat(defaultRibbonLayout.durationIds)
            .concat(defaultRibbonLayout.beamIds).concat(defaultRibbonLayout.measureIds).concat(defaultRibbonLayout.staveIds)
              .concat(defaultRibbonLayout.textIds).concat(defaultRibbonLayout.playerIds)
              .concat(defaultRibbonLayout.voiceButtonIds).concat(defaultRibbonLayout.debugIds);

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
            defaultRibbonLayout.microtoneButtons).concat(
      defaultRibbonLayout.chordButtons).concat(
      defaultRibbonLayout.durationRibbonButtons).concat(defaultRibbonLayout.beamRibbonButtons).concat(defaultRibbonLayout.measureRibbonButtons)
      .concat(defaultRibbonLayout.staveRibbonButtons)
            .concat(defaultRibbonLayout.textRibbonButtons).concat(defaultRibbonLayout.playerButtons)
            .concat(defaultRibbonLayout.voiceRibbonButtons).concat(defaultRibbonLayout.displayButtons).concat(defaultRibbonLayout.debugRibbonButtons);
  }

  static get leftRibbonIds() {
    return ['helpDialog','languageMenu', 'fileMenu','libraryMenu',
    'addStaffMenu','measureModal','tempoModal','timeSignatureMenu','keyMenu', 'staffModifierMenu', 'staffModifierMenu2',
    'instrumentModal','pianoModal','layoutMenu'];
  }
  static get noteButtonIds() {
    return ['NoteButtons',
            'UpNoteButton', 'DownNoteButton','AddGraceNote','RemoveGraceNote','SlashGraceNote','XNoteHead',
        'UpOctaveButton', 'DownOctaveButton', 'ToggleRest','ToggleAccidental', 'ToggleCourtesy'];
  }
  static get voiceButtonIds() {
      return ['VoiceButtons','V1Button','V2Button','V3Button','V4Button','VXButton'];
  }
  static get navigateButtonIds()  {
    return ['NavigationButtons', 'navLeftButton', 'navRightButton', 'navUpButton', 'navDownButton', 'moreNavButtons','navFastForward', 'navRewind',
        'navGrowLeft', 'navGrowRight'];
  }
  static get articulateButtonIds()  {
    return ['articulationButtons', 'accentButton', 'tenutoButton', 'staccatoButton', 'marcatoButton', 'fermataButton', 'pizzicatoButton','mordentButton','mordentInvertedButton','trillButton'
      ,'scoopButton','dropButton','dropLongButton','doitButton','doitLongButton','flipButton','smearButton'];
  }

  static get intervalIds()  {
    return ['CreateChordButtons', 'SecondUpButton', 'SecondDownButton', 'ThirdUpButton', 'ThirdDownButton', 'FourthUpButton', 'FourthDownButton',
        'FifthUpButton', 'FifthDownButton','SixthUpButton', 'SixthDownButton'
        ,'SeventhUpButton', 'SeventhDownButton','OctaveUpButton','OctaveDownButton','CollapseChordButton'];
  }

  static get debugIds() {
    return ['DebugGroup','DebugButton2'];
  }
  static get durationIds() {
    return ['DurationButtons','GrowDuration','LessDuration','GrowDurationDot','LessDurationDot','TripletButton','QuintupletButton','SeptupletButton','NoTupletButton'];
  }
  static get measureIds() {
    return ['MeasureButtons','endRepeat','startRepeat','endBar','doubleBar','singleBarEnd','singleBarStart','nthEnding','dcAlCoda','dsAlCoda','dcAlFine','dsAlFine','coda','toCoda','segno','toSegno','fine'];
  }

    static get textIds() {
    return ['TextButtons','addTextMenu','rehearsalMark','lyrics','chordChanges','addDynamicsMenu'];
  }

    static get beamIds() {
    return ['BeamButtons','breakBeam','beamSelections','toggleBeamDirection'];
  }
    static get staveIds() {
    return ['StaveButtons','clefTreble','clefBass','clefAddRemove','clefMoveUp','clefMoveDown','moreStaffButtons',
        'clefTenor','clefAlto',
           'staffBracketLower','staffBraceLower','staffDoubleConnectorLower','staffSingleConnectorLower'];
  }

  static get playerIds() {
      return ['playerButtons','playButton','pauseButton','stopButton'];
  }

  static get microtoneIds() {
      return ['MicrotoneButtons','flat75sz','flat25sz','flat25ar','flat125ar','sharp75','sharp125','sharp25','sori','koron'];
  }

  static get displayIds() {
      return ['displaySettings','refresh','zoomout','zoomin','playButton2','stopButton2'];
  }


  static get textRibbonButtons() {
    return [
      {
        leftText: '',
        rightText: '',
        classes: 'icon  collapseParent measure',
        icon: 'icon-text',
        action: 'collapseParent',
        ctor: 'CollapseRibbonControl',
        group: 'textEdit',
        id: 'TextButtons'
      }, {
        leftText: '',
        rightText: '/t',
        classes: 'icon collapsed textButton',
        icon: 'icon-textBasic',
        action: 'collapseChild',
        ctor: 'TextButtons',
        group: 'textEdit',
        id: 'addTextMenu'
      },{
        leftText: '',
        rightText: '',
        classes: 'icon collapsed textButton',
        icon: 'icon-rehearsemark',
        action: 'collapseChild',
        ctor: 'TextButtons',
        group: 'textEdit',
        id: 'rehearsalMark'
      },{
        leftText: '',
        rightText: '',
        classes: 'icon collapsed textButton',
        icon: 'icon-lyric',
        action: 'collapseChild',
        ctor: 'TextButtons',
        group: 'textEdit',
        id: 'lyrics'
      },  {
        leftText: '',
        rightText: '',
        classes: 'icon collapsed textButton',
        icon: 'icon-chordSymbol',
        action: 'collapseChild',
        ctor: 'TextButtons',
        group: 'textEdit',
        id: 'chordChanges'
      }, {
        leftText: '',
        rightText: '/d',
        classes: 'icon collapsed textButton',
        icon: 'icon-mezzopiano',
        action: 'collapseChild',
        ctor: 'TextButtons',
        group: 'textEdit',
        id: 'addDynamicsMenu'
      }
    ];
  }
  static get displayButtons() {
    return [{
      leftText: '',
      rightText: '',
      classes: 'icon  hide',
      icon: 'icon-zoomplus',
      action: 'collapseParent',
      ctor: 'CollapseRibbonControl',
      group: 'displaySettings',
      id: 'displaySettings'
    },{
      leftText: '',
      rightText: '',
      classes: 'icon   refresh',
      icon: 'icon-refresh',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'displaySettings',
      id: 'refresh'
    },{
      leftText: '',
      rightText: '',
      classes: 'icon   refresh',
      icon: 'icon-zoomplus',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'displaySettings',
      id: 'zoomout'
    },{
      leftText: '',
      rightText: '',
      classes: 'icon   refresh',
      icon: 'icon-zoomminus',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'displaySettings',
      id: 'zoomin'
    },{
      leftText: '',
      rightText: '',
      classes: 'icon   play',
      icon: 'icon-play3',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'displaySettings',
      id: 'playButton2'
    },{
      leftText: '',
      rightText: '',
      classes: 'icon   stop2',
      icon: 'icon-stop2',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'displaySettings',
      id: 'stopButton2'
    }
  ];
  }

    static get microtoneButtons() {
        return [{
      leftText: '',
        rightText: '',
        classes: 'icon  collapseParent microtones',
        icon: 'icon-microtone',
        action: 'collapseParent',
        ctor: 'CollapseRibbonControl',
        group: 'microtone',
        id: 'MicrotoneButtons'
    }, {
            leftText: '',
        rightText: '',
        classes: 'icon  collapsed microtones',
        icon: 'icon-flat25sz',
        action: 'collapseChild',
        ctor: 'MicrotoneButtons',
        group: 'microtone',
        id: 'flat25sz'
        }, {
            leftText: '',
        rightText: '',
        classes: 'icon  collapsed microtones',
        icon: 'icon-flat75sz',
        action: 'collapseChild',
        ctor: 'MicrotoneButtons',
        group: 'microtone',
        id: 'flat75sz'
        },{
            leftText: '',
        rightText: '',
        classes: 'icon  collapsed microtones',
        icon: 'icon-flat25ar',
        action: 'collapseChild',
        ctor: 'MicrotoneButtons',
        group: 'microtone',
        id: 'flat25ar'
        },{
            leftText: '',
        rightText: '',
        classes: 'icon  collapsed microtones',
        icon: 'icon-sharp75',
        action: 'collapseChild',
        ctor: 'MicrotoneButtons',
        group: 'microtone',
        id: 'sharp75'
        },{
            leftText: '',
        rightText: '',
        classes: 'icon  collapsed microtones',
        icon: 'icon-sharp125',
        action: 'collapseChild',
        ctor: 'MicrotoneButtons',
        group: 'microtone',
        id: 'sharp125'
        },{
            leftText: '',
        rightText: '',
        classes: 'icon  collapsed microtones',
        icon: 'icon-sharp25',
        action: 'collapseChild',
        ctor: 'MicrotoneButtons',
        group: 'microtone',
        id: 'sharp25'
        },{
            leftText: '',
        rightText: '',
        classes: 'icon  collapsed microtones',
        icon: 'icon-sori',
        action: 'collapseChild',
        ctor: 'MicrotoneButtons',
        group: 'microtone',
        id: 'sori'
        },{
            leftText: '',
        rightText: '',
        classes: 'icon  collapsed microtones',
        icon: 'icon-koron',
        action: 'collapseChild',
        ctor: 'MicrotoneButtons',
        group: 'microtone',
        id: 'koron'
        }];
    }

  static get staveRibbonButtons() {
    return [{
      leftText: '',
        rightText: '',
        classes: 'icon  collapseParent staves',
        icon: 'icon-treble',
        action: 'collapseParent',
        ctor: 'CollapseRibbonControl',
        group: 'staves',
        id: 'StaveButtons'
    },{
      leftText: '',
        rightText: '',
        classes: 'icon  collapsed staves',
        icon: 'icon-treble',
        action: 'collapseChild',
        ctor: 'StaveButtons',
        group: 'staves',
        id: 'clefTreble'
    },{
      leftText: '',
        rightText: '',
        classes: 'icon  collapsed staves',
        icon: 'icon-bass',
        action: 'collapseChild',
        ctor: 'StaveButtons',
        group: 'staves',
        id: 'clefBass'
    }
        ,{
      leftText: '',
        rightText: '',
        classes: 'icon  collapsed staves',
        icon: 'icon-plus',
        action: 'collapseChildMenu',
        ctor: 'SuiAddStaffMenu',
        group: 'staves',
        id: 'clefAddRemove'
    },
        {
      leftText: '',
        rightText: '',
        classes: 'icon  collapsed staves',
        icon: 'icon-arrow-up',
        action: 'collapseChild',
        ctor: 'StaveButtons',
        group: 'staves',
        id: 'clefMoveUp'
    },{
      leftText: '',
        rightText: '',
        classes: 'icon  collapsed staves',
        icon: 'icon-arrow-down',
        action: 'collapseChild',
        ctor: 'StaveButtons',
        group: 'staves',
        id: 'clefMoveDown'
    },
        {
            leftText: '...',
            rightText: '',
            icon: 'icon-circle-left',
            classes: 'collapsed expander',
            action: 'collapseMore',
            ctor: 'ExtendedCollapseParent',
            group: 'staves',
            id: 'moreStaffButtons'
        },{
      leftText: '',
        rightText: '',
        classes: 'icon  collapsed staves',
        icon: 'icon-tenor',
        action: 'collapseGrandchild',
        ctor: 'StaveButtons',
        group: 'staves',
        id: 'clefTenor'
    },{
      leftText: '',
        rightText: '',
        classes: 'icon  collapsed staves',
        icon: 'icon-alto',
        action: 'collapseGrandchild',
        ctor: 'StaveButtons',
        group: 'staves',
        id: 'clefAlto'
    },{
      leftText: '',
        rightText: '',
        classes: 'icon  collapsed staves',
        icon: 'icon-brace',
        action: 'collapseGrandchild',
        ctor: 'StaveButtons',
        group: 'staves',
        id: 'staffBraceLower'
    },{
      leftText: '',
        rightText: '',
        classes: 'icon  collapsed staves',
        icon: 'icon-bracket',
        action: 'collapseGrandchild',
        ctor: 'StaveButtons',
        group: 'staves',
        id: 'staffBracketLower'
    }

    ];
  }

    static get beamRibbonButtons() {
        return [{
      leftText: '',
        rightText: '',
        classes: 'icon  collapseParent beams',
        icon: 'icon-flag',
        action: 'collapseParent',
        ctor: 'CollapseRibbonControl',
        group: 'beams',
        id: 'BeamButtons'
    },{
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
  static get debugRibbonButtons() {
    return [{
        leftText: '',
        rightText: '',
        classes: 'icon  collapseParent',
        icon: 'icon-new-tab',
        action: 'collapseParent',
        ctor: 'CollapseRibbonControl',
        group: 'debug',
        id: 'DebugGroup'
      },{
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

    static get voiceRibbonButtons() {
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
      },{
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
      },{
        leftText: '',
        rightText: 'alt-g',
        icon: 'icon-grace_remove',
        classes: 'collapsed graceIcon',
        action: 'collapseChild',
        ctor: 'NoteButtons',
        group: 'notes',
        id: 'RemoveGraceNote'
      },{
        leftText: '',
        rightText: '',
        icon: 'icon-notex',
        classes: 'collapsed graceIcon',
        action: 'collapseChild',
        ctor: 'NoteButtons',
        group: 'notes',
        id: 'XNoteHead'
      },{
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
  static get playerButtons() {
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
        id: 'accentButton'
      },{
        leftText: '',
        rightText: 'i',
        icon: 'icon-tenuto_above',
        classes: 'icon collapsed articulation',
        action: 'collapseChild',
        ctor: 'ArticulationButtons',
        group: 'articulations',
        id: 'tenutoButton'
      }, {
        leftText: '',
        rightText: 'j',
        icon: 'icon-staccato_above',
        classes: 'icon collapsed articulation',
        action: 'collapseChild',
        ctor: 'ArticulationButtons',
        group: 'articulations',
        id: 'staccatoButton'
      }, {
        leftText: '',
        rightText: 'k',
        icon: 'icon-marcato_above',
        classes: 'icon collapsed articulation',
        action: 'collapseChild',
        ctor: 'ArticulationButtons',
        group: 'articulations',
        id: 'marcatoButton'
      }, {
        leftText: '',
        rightText: '',
        icon: 'icon-fermata',
        classes: 'icon collapsed articulation',
        action: 'collapseChild',
        ctor: 'ArticulationButtons',
        group: 'articulations',
        id: 'fermataButton'
      },  {
        leftText: '',
        rightText: 'l',
        icon: 'icon-pitz_above',
        classes: 'icon collapsed articulation',
        action: 'collapseChild',
        ctor: 'ArticulationButtons',
        group: 'articulations',
        id: 'pizzicatoButton'
      }, {
        leftText: '',
        rightText: '',
        icon: 'icon-mordent-inv',
        classes: 'icon collapsed articulation',
        action: 'collapseChild',
        ctor: 'ArticulationButtons',
        group: 'articulations',
        id: 'mordentInvertedButton'
      }, {
        leftText: '',
        rightText: '',
        icon: 'icon-mordent',
        classes: 'icon collapsed articulation',
        action: 'collapseChild',
        ctor: 'ArticulationButtons',
        group: 'articulations',
        id: 'mordentButton'
      }, {
        leftText: '',
        rightText: '',
        icon: 'icon-trill',
        classes: 'icon collapsed articulation',
        action: 'collapseChild',
        ctor: 'ArticulationButtons',
        group: 'articulations',
        id: 'trillButton'
      }, {
        leftText: '',
        rightText: '',
        icon: 'icon-scoop',
        classes: 'icon collapsed articulation',
        action: 'collapseChild',
        ctor: 'ArticulationButtons',
        group: 'articulations',
        id: 'scoopButton'
      },
      {
        leftText: '',
        rightText: '',
        icon: 'icon-drop',
        classes: 'icon collapsed articulation',
        action: 'collapseChild',
        ctor: 'ArticulationButtons',
        group: 'articulations',
        id: 'dropButton'
      },
      {
        leftText: '',
        rightText: '',
        icon: 'icon-drop-long',
        classes: 'icon collapsed articulation',
        action: 'collapseChild',
        ctor: 'ArticulationButtons',
        group: 'articulations',
        id: 'dropLongButton'
      },
      {
        leftText: '',
        rightText: '',
        icon: 'icon-doit',
        classes: 'icon collapsed articulation',
        action: 'collapseChild',
        ctor: 'ArticulationButtons',
        group: 'articulations',
        id: 'doitButton'
      },
      {
        leftText: '',
        rightText: '',
        icon: 'icon-doit-long',
        classes: 'icon collapsed articulation',
        action: 'collapseChild',
        ctor: 'ArticulationButtons',
        group: 'articulations',
        id: 'doitLongButton'
      },
      {
        leftText: '',
        rightText: '',
        icon: 'icon-flip',
        classes: 'icon collapsed articulation',
        action: 'collapseChild',
        ctor: 'ArticulationButtons',
        group: 'articulations',
        id: 'flipButton'
      },
      {
        leftText: '',
        rightText: '',
        icon: 'icon-smear',
        classes: 'icon collapsed articulation',
        action: 'collapseChild',
        ctor: 'ArticulationButtons',
        group: 'articulations',
        id: 'smearButton'
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
        leftText: '...',
        rightText: '',
        icon: '',
        classes: 'collapsed expander',
        action: 'collapseMore',
        ctor: 'ExtendedCollapseParent',
        group: 'navigation',
        id: 'moreNavButtons'
      },{
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
        leftText: 'Language',
        rightText: '/n',
        icon: '',
        classes: 'language-select menu-select',
        action: 'menu',
        ctor: 'SuiLanguageMenu',
        group: 'scoreEdit',
        id: 'languageMenu'
      }, {
        leftText: 'File',
        rightText: '/f',
        icon: '',
        classes: 'file-modify menu-select',
        action: 'menu',
        ctor: 'SuiFileMenu',
        group: 'scoreEdit',
        id: 'fileMenu'
      }, {
        leftText: 'Library',
        rightText: '/L',
        icon: '',
        classes: 'file-modify menu-select',
        action: 'menu',
        ctor: 'SuiLibraryMenu',
        group: 'scoreEdit',
        id: 'libraryMenu'
      }, {
        leftText: 'Tempo',
        rightText: 't',
        icon: '',
        classes: 'icon ',
        action: 'modal',
        ctor: 'SuiTempoDialog',
        group: 'scoreEdit',
        id: 'tempoModal'
      },{
        leftText: 'Time Signature',
        rightText: '/m',
        icon: '',
        classes: 'staff-modify menu-select',
        action: 'menu',
        ctor: 'SuiTimeSignatureMenu',
        group: 'scoreEdit',
        id: 'timeSignatureMenu'
      }, {
        leftText: 'Staves',
        rightText: '/s',
        icon: '',
        classes: 'staff-modify',
        action: 'menu',
        ctor: 'SuiAddStaffMenu',
        group: 'scoreEdit',
        id: 'addStaffMenu'
      },
      {
         leftText: 'Measure',
         rightText: '/a',
         icon: '',
         classes: 'icon menu-select',
         action: 'menu',
         ctor: 'SuiMeasureMenu',
         group: 'scoreEdit',
         id: 'measureModal'
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
      {
       leftText: 'Instrument',
       rightText: '',
       icon: '',
       classes: 'icon',
       action: 'modal',
       ctor: 'SuiInstrumentDialog',
       group: 'scoreEdit',
       id: 'instrumentModal'
     },
      {
        leftText: 'Lines',
        rightText: '/l',
        icon: '',
        classes: 'icon note-modify menu-select',
        action: 'menu',
        ctor: 'SuiStaffModifierMenu',
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
      },
       {
        leftText: 'Score',
        rightText: '',
        icon: '',
        classes: 'icon ',
        action: 'menu',
        ctor: 'SuiScoreMenu',
        group: 'scoreEdit',
        id: 'layoutMenu'
      }
    ];
  }
}
