import { MenuDefinition, MenuChoiceDefinition, SuiMenuBase, SuiMenuParams } from './menu';
import { SuiScorePreferencesDialog } from '../dialogs/preferences';
import { SuiScoreIdentificationDialog } from '../dialogs/scoreId';
import { SuiPageLayoutDialog } from '../dialogs/pageLayout';
import { SuiScoreFontDialog } from '../dialogs/fonts';
import { SuiGlobalLayoutDialog } from '../dialogs/globalLayout';
import { SuiTransposeScoreDialog } from '../dialogs/transposeScore';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SuiStaffGroupDialog } from '../dialogs/staffGroup';
import { SuiAudioSettingsDialog } from '../dialogs/audioSettings';

declare var $: any;
export class SuiScoreMenu extends SuiMenuBase {
  static defaults: MenuDefinition = {
    label: 'Score Settings',
    menuItems: [{
      icon: '',
      text: 'Smoosic Preferences',
      value: 'preferences'
    }, {
      icon: '',
      text: 'View All',
      value: 'viewAll'
    }, {
      icon: '',
      text: 'Global Layout',
      value: 'globalLayout'
    }, {
      icon: '',
      text: 'Page Layout',
      value: 'pageLayout'
    }, {
      icon: '',
      text: 'Audio Settings',
      value: 'audioSettings'
    },  {
      icon: '',
      text: 'System Groups',
      value: 'staffGroups'
    }, {
      icon: '',
      text: 'Score Fonts',
      value: 'fonts'
    }, {
      icon: '',
      text: 'Score Info',
      value: 'identification'
    }, {
      icon: '',
      text: 'Transpose Score',
      value: 'transposeScore'
    }, {
      icon: '',
      text: 'Cancel',
      value: 'cancel'
    }]
  };

  getDefinition() {
    return SuiScoreMenu.defaults;
  }
  preAttach() {
    const defs: MenuChoiceDefinition[] = [];
    this.menuItems.forEach((item) => {
      // show these options no matter what
      if (['fonts', 'cancel', 'identification', 'preferences', 'audioSettings', 'transposeScore'].findIndex((x) => x === item.value) >= 0) {
        defs.push(item);
      } else if (item.value === 'pageLayout' || item.value === 'globalLayout' || item.value === 'staffGroups') {
        if (this.view.isPartExposed() === false) {
          // only show the page layout in score menu if we are in score mode
          defs.push(item);
        } 
      } else if (item.value === 'viewAll') {
        // Only show 'view all' if we are not viewing all
        if (this.score.staves.length < this.view.storeScore.staves.length) {
          defs.push(item);
        }
      }
    });
    this.menuItems = defs;
  }
  constructor(params: SuiMenuParams) {
    super(params);
  }
  execStaffGroups() {
    createAndDisplayDialog(SuiStaffGroupDialog,
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        eventSource: this.eventSource,
        id: 'staffGroups',
        ctor: 'SuiStaffGroupDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      }
    );
  }
  execScoreId() {
    SuiScoreIdentificationDialog.createAndDisplay(
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        eventSource: this.eventSource,
        id: 'scoreIdDialog',
        ctor: 'SuiScoreIdentificationDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      });
  }
  execPageLayout() {
    createAndDisplayDialog(SuiPageLayoutDialog,
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        eventSource: this.eventSource,
        id: 'layoutDialog',
        ctor: 'SuiPageLayoutDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      });
  }
  execFonts() {
    SuiScoreFontDialog.createAndDisplay(
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        eventSource: this.eventSource,
        id: 'fontDialog',
        ctor: 'SuiScoreFontDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      });
  }
  execGlobalLayout() {
    createAndDisplayDialog(SuiGlobalLayoutDialog, 
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        eventSource: this.eventSource,
        id: 'globalLayout',
        ctor: 'SuiGlobalLayoutDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      });
  }
  execPreferences() {
    createAndDisplayDialog(SuiScorePreferencesDialog, 
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        eventSource: this.eventSource,
        id: 'preferences',
        ctor: 'SuiScorePreferencesDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      });
  }
  execAudioSettings() {
    createAndDisplayDialog(SuiAudioSettingsDialog, 
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        eventSource: this.eventSource,
        id: 'audioSettings',
        ctor: 'SuiAudioSettingsDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      });
  }
  execTransposeScore() {
    createAndDisplayDialog(SuiTransposeScoreDialog,
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        eventSource: this.eventSource,
        id: 'scoreIdDialog',
        ctor: 'SuiTransposeScoreDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      });
  }
  selection(ev: any) {
    const text = $(ev.currentTarget).attr('data-value');
    if (text === 'pageLayout') {
      this.execPageLayout();
    } else if (text === 'staffGroups') {
      this.execStaffGroups();
    } else if (text === 'preferences') {
      this.execPreferences();
    } else if (text === 'fonts') {
      this.execFonts();
    } else if (text === 'globalLayout') {
      this.execGlobalLayout();
    } else if (text === 'identification') {
      this.execScoreId();
    } else if (text === 'viewAll') {
      this.view.viewAll();
    } else if (text === 'audioSettings') {
      this.execAudioSettings();
    } else if (text === 'transposeScore') {
      this.execTransposeScore();
    }
    this.complete();
  }
  keydown() { }
}