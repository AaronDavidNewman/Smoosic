import { SuiMenuBase, SuiMenuParams, MenuDefinition, SuiMenuHandler, SuiMenuShowOption, 
  SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SuiTextBlockDialog } from '../dialogs/textBlock';
import { SmoDynamicText } from '../../smo/data/noteModifiers';
import { SuiChordChangeDialog } from '../dialogs/chordChange';
import { SuiLyricDialog } from '../dialogs/lyric';
import { SuiDynamicModifierDialog } from '../dialogs/dynamics';

declare var $: any;
export class SuiTextMenu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, 'Notes', SuiTextMenuOptions);
  }  
}

const rehearsalLetterDialogMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.toggleRehearsalMark();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Rehearsal Letter',
    value: 'rehearsalLetter'
  }
}
const textBlockDialogMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    createAndDisplayDialog(SuiTextBlockDialog, {
      completeNotifier: menu.completeNotifier!,
      view: menu.view,
      eventSource: menu.eventSource,
      id: 'textDialog',
      ctor: 'SuiTextBlockDialog',
      tracker: menu.view.tracker,
      startPromise: menu.closePromise,
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Score Text',
    value: 'textBlock'
  }
}
const chordChangeDialogMenuOption: SuiConfiguredMenuOption = {  
  handler: async (menu: SuiMenuBase) => {
    const sel = menu.view.tracker.selections[0];
    const note = sel.note;
    if (!note) {
      return;
    }
    const lyrics = note.getChords();
    const lyric = lyrics.length > 0 ? null : lyrics[0];
    createAndDisplayDialog(SuiChordChangeDialog,
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'chordDialog',
        ctor: 'SuiChordChangeDialog',
        tracker: menu.view.tracker,
        startPromise: menu.closePromise,
        modifier: lyric
      }
    );
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Chord Changes',
    value: 'chordChanges'
  }
}
const lyricsDialogMenuOption: SuiConfiguredMenuOption = {  
  handler: async (menu: SuiMenuBase) => {
    const sel = menu.view.tracker.selections[0];
    const note = sel.note;
    if (!note) {
      return;
    }
    const lyrics = note.getTrueLyrics();
    const lyric = lyrics.length > 0 ? lyrics[0] : null;

    createAndDisplayDialog(SuiLyricDialog, 
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'lyricDialog',
        ctor: 'SuiLyricDialog',
        tracker: menu.view.tracker,
        startPromise: menu.closePromise,
        modifier: lyric
      });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Lyrics',
    value: 'lyricMenu'
  }
}
const dynamicsDialogMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    const sel = menu.view.tracker.selections[0];
    let modifier = null;
    if (sel.note) {
      const dynamics = sel.note.getModifiers('SmoDynamicText');
      if (dynamics.length) {
        modifier = dynamics[0];
      } else {
        const params = SmoDynamicText.defaults;
        modifier = new SmoDynamicText(params);
        menu.view.addDynamic(sel, modifier);
      }
    }
    createAndDisplayDialog(SuiDynamicModifierDialog, {
      completeNotifier: menu.completeNotifier!,
      view: menu.view,
      eventSource: menu.eventSource,
      id: 'dynamicsDialog',
      ctor: 'SuiDynamicModifierDialog',
      tracker: menu.view.tracker,
      startPromise: menu.closePromise,
      modifier
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Dynamics',
    value: 'dynamicsMenu'
  }
}
const SuiTextMenuOptions: SuiConfiguredMenuOption[] = 
[dynamicsDialogMenuOption, textBlockDialogMenuOption, 
  chordChangeDialogMenuOption, lyricsDialogMenuOption, rehearsalLetterDialogMenuOption];

