import { MenuDefinition, SuiMenuBase, SuiMenuParams } from './menu';
import {
  SuiScoreViewDialog, SuiGlobalLayoutDialog, SuiScoreIdentificationDialog,
  SuiScoreFontDialog, SuiLayoutDialog, SuiScorePreferencesDialog
} from '../dialogs/scoreDialogs';

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
      text: 'Global Layout',
      value: 'globalLayout'
    }, {
      icon: '',
      text: 'Page Layout',
      value: 'pageLayout'
    }, {
      icon: '',
      text: 'Score Fonts',
      value: 'fonts'
    }, {
      icon: '',
      text: 'Stave View',
      value: 'view'
    }, {
      icon: '',
      text: 'Score Info',
      value: 'identification'
    }, {
      icon: '',
      text: 'Cancel',
      value: 'cancel'
    }]
  };

  getDefinition() {
    return SuiScoreMenu.defaults;
  }
  constructor(params: SuiMenuParams) {
    super(params);
  }

  execView() {
    SuiScoreViewDialog.createAndDisplay(
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        id: 'scoreViewDialog',
        ctor: 'SuiScoreViewDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      });
  }
  execScoreId() {
    SuiScoreIdentificationDialog.createAndDisplay(
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        id: 'scoreIdDialog',
        ctor: 'SuiScoreIdentificationDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      });
  }
  execPageLayout() {
    SuiLayoutDialog.createAndDisplay(
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        id: 'layoutDialog',
        ctor: 'SuiLayoutDialog',
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
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        id: 'fontDialog',
        ctor: 'SuiScoreFontDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      });
  }
  execGlobalLayout() {
    SuiGlobalLayoutDialog.createAndDisplay(
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        id: 'globalLayout',
        ctor: 'SuiGlobalLayoutDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      });
  }
  execPreferences() {
    SuiScorePreferencesDialog.createAndDisplay(
      {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        id: 'preferences',
        ctor: 'SuiScorePreferencesDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      });
  }
  selection(ev: any) {
    const text = $(ev.currentTarget).attr('data-value');
    if (text === 'view') {
      this.execView();
    } else if (text === 'pageLayout') {
      this.execPageLayout();
    } else if (text === 'preferences') {
      this.execPreferences();
    } else if (text === 'fonts') {
      this.execFonts();
    } else if (text === 'globalLayout') {
      this.execGlobalLayout();
    } else if (text === 'identification') {
      this.execScoreId();
    }
    this.complete();
  }
  keydown() { }
}