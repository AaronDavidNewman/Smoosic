// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.

import { ButtonDefinition } from "../../buttons/button";
import { RibbonLayout } from "../../common";

export class defaultRibbonLayout {
  static get ribbons(): RibbonLayout {
    var left = defaultRibbonLayout.leftRibbonIds;
    var top = defaultRibbonLayout.displayIds.concat(defaultRibbonLayout.debugIds);

    return {
      left: left,
      top: top
    };
  }

  static get ribbonButtons(): ButtonDefinition[] {
    return defaultRibbonLayout.leftRibbonButtons.concat(defaultRibbonLayout.displayButtons).concat(defaultRibbonLayout.debugRibbonButtons);
  }

  static get leftRibbonIds() {
    return ['helpDialog', 'languageMenu', 'fileMenu', 
    'scoreMenu', 'partMenu', 'staffModifierMenu', 'measureModal', 'voiceMenu', 'beamMenu',
    'noteMenu', 'textMenu', 'libraryMenu',
    ];
  }
  static get debugIds() {
    return ['DebugGroup', 'DebugButton2'];
  }
  static get displayIds() {
    return ['quickButtons', 'selectPart', 'refresh', 'zoomout', 'zoomin', 'playButton2', 'stopButton2', 'keySignature', 'ribbonTempo', 'ribbonTime'];
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
      rightText: 'Alt-k',
      hotKey: 'k',
      classes: 'icon keysignature button-wide hover-text',
      icon: 'icon-smo icon-key-sig-b',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'keySignature'
    },  {
      leftText: 'Tempo',
      rightText: 'Alt-o',
      hotKey: 'o',
      classes: 'icon keysignature button-wide hover-text',
      icon: 'icon-smo icon-metronome4',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'ribbonTempo'
    },  {
      leftText: 'Time',
      rightText: 'Alt-t',
      hotKey: 't',
      classes: 'icon keysignature button-wide hover-text',
      icon: 'icon-bravura icon-timeSigCommon',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'ribbonTime'
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
      rightText: 'Alt-g',
      icon: '',
      hotKey: 'g',
      classes: 'language-select nav-link link-body-emphasis hover-text',
      action: 'menu',
      ctor: 'SuiLanguageMenu',
      group: 'scoreEdit',
      id: 'languageMenu'
    }, {
      leftText: 'File',
      rightText: 'Alt-f',
      hotKey: 'f',
      icon: '',
      classes: 'file-modify nav-link link-body-emphasis hover-text',
      action: 'menu',
      ctor: 'SuiFileMenu',
      group: 'scoreEdit',
      id: 'fileMenu'
    },  {
      leftText: 'Score',
      rightText: 'Alt-s',
      hotKey: 's',
      icon: '',
      classes: 'icon  nav-link link-body-emphasis hover-text',
      action: 'menu',
      ctor: 'SuiScoreMenu',
      group: 'scoreEdit',
      id: 'scoreMenu'
    },
    {
      leftText: 'Parts',
      rightText: 'Alt-p',
      hotKey: 'p',
      icon: '',
      classes: 'icon nav-link link-body-emphasis hover-text',
      action: 'menu',
      ctor: 'SuiPartMenu',
      group: 'scoreEdit',
      id: 'partMenu'
    }, {
      leftText: 'Lines',
      rightText: 'Alt-l',
      hotKey: 'l',
      icon: '',
      classes: 'icon note-modify nav-link link-body-emphasis hover-text',
      action: 'menu',
      ctor: 'SuiStaffModifierMenu',
      group: 'scoreEdit',
      id: 'staffModifierMenu'
    }, {
      leftText: 'Measure',
      rightText: 'Alt-m',
      hotKey: 'm',
      icon: '',
      classes: 'icon menu-select nav-link link-body-emphasis hover-text',
      action: 'menu',
      ctor: 'SuiMeasureMenu',
      group: 'scoreEdit',
      id: 'measureModal'
    }, {
      leftText: 'Voices',
      rightText: 'Alt-v',
      hotKey: 'v',
      icon: '',
      classes: 'icon nav-link link-body-emphasis hover-text',
      action: 'menu',
      ctor: 'SuiVoiceMenu',
      group: 'scoreEdit',
      id: 'voiceMenu'
    }, {
      leftText: 'Beams',
      rightText: 'Alt-b',
      hotKey: 'b',
      icon: '',
      classes: 'icon nav-link link-body-emphasis hover-text',
      action: 'menu',
      ctor: 'SuiBeamMenu',
      group: 'scoreEdit',
      id: 'beamMenu'
    }, {
      leftText: 'Notes',
      rightText: 'Alt-n',
      hotKey: 'n',
      icon: '',
      classes: 'icon nav-link link-body-emphasis hover-text',
      action: 'menu',
      ctor: 'SuiNoteMenu',
      group: 'scoreEdit',
      id: 'noteMenu'
    },
    {
      leftText: 'Text',
      rightText: 'Alt-x',
      hotKey: 'x',
      icon: '',
      classes: 'menu-select  nav-link link-body-emphasis hover-text',
      action: 'menu',
      ctor: 'SuiTextMenu',
      group: 'scoreEdit',
      id: 'textMenu'
    }, {
      leftText: 'Library',
      rightText: 'Alt-y',
      hotKey: 'y',
      icon: '',
      classes: 'file-modify menu-select  nav-link link-body-emphasis hover-text',
      action: 'modal',
      ctor: 'SuiLibraryDialog',
      group: 'scoreEdit',
      id: 'libraryMenu'
    },
    ];
  }
}
