// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoTranslator } from './i18n/language';
import { SuiLayoutDialog, SuiScoreIdentificationDialog,
  SuiScoreViewDialog, SuiGlobalLayoutDialog, SuiScoreFontDialog } from './dialogs/scoreDialogs';
import { SmoScore } from '../smo/data/score';
import { SuiXhrLoader } from './fileio/xhrLoader';
import { mxmlScore } from '../smo/mxml/xmlScore';
import { layoutDebug } from '../render/sui/layoutDebug';
import { SuiPrintFileDialog, SuiSaveFileDialog, SuiSaveActionsDialog, SuiLoadActionsDialog,
  SuiLoadFileDialog, SuiSaveXmlDialog, SuiSaveMidiDialog, SuiLoadMxmlDialog } from './dialogs/fileDialogs';
import { htmlHelpers } from '../common/htmlHelpers';
import { SuiTimeSignatureDialog, SuiMeasureDialog, SuiInsertMeasures } from './dialogs/measureDialogs';
import { SuiStaffGroupDialog } from './dialogs/staffDialogs';
import { SmoMeasure } from '../smo/data/measure';
import { SvgBox } from '../smo/data/common';
import { SuiScoreViewOperations } from '../render/sui/scoreViewOperations';
import { SuiTracker } from '../render/sui/tracker';
import { CompleteNotifier, ModalComponent } from '../application/common';
import { BrowserEventSource, EventHandler } from '../application/eventSource';
import { UndoBuffer } from '../smo/xform/undo';
import { KeyEvent, KeyBinding } from '../application/common';
import { suiMenuManager, VoiceButtons } from '../../release/smoosic';
import { InstrumentInfo, SmoSystemStaff, SmoSystemStaffParams } from '../smo/data/systemStaff';
declare var $: any;

export interface MenuChoiceDefinition {
    icon: string,
    text: string,
    value: string,
    hotkey?: string
}
export interface MenuDefinition {
  label: string,
  menuItems: MenuChoiceDefinition[]
}
export interface MenuChoiceTranslation {
  label: string,
  menuItems: MenuChoiceDefinition[],
  ctor: string
}
export interface SuiMenuParams {
  ctor: string,
  position: SvgBox,
  tracker: SuiTracker,
  score: SmoScore,
  completeNotifier: CompleteNotifier,
  closePromise: Promise<void> | null
  view: SuiScoreViewOperations,
  eventSource: BrowserEventSource,
  undoBuffer: UndoBuffer
}
export abstract class SuiMenuBase {
  label: string;
  menuItems: MenuChoiceDefinition[];
  ctor: string;
  completeNotifier: CompleteNotifier;
  score: SmoScore;
  view: SuiScoreViewOperations;
  eventSource: BrowserEventSource;
  undoBuffer: UndoBuffer;
  focusIndex: number = -1;
  closePromise: Promise<void> | null;
  tracker: SuiTracker;
  constructor(params: SuiMenuParams) {
    this.ctor = params.ctor;
    const definition: MenuDefinition = this.getDefinition();
    this.label = definition.label;
    this.menuItems = definition.menuItems;
    this.completeNotifier = params.completeNotifier;
    this.score = params.score;
    this.view = params.view;
    this.undoBuffer = params.undoBuffer;
    this.eventSource = params.eventSource;
    this.closePromise = params.closePromise;
    this.tracker = params.tracker;
    SmoTranslator.registerMenu(this.ctor);
  }
  abstract selection(ev: any): void;
  abstract getDefinition(): MenuDefinition;
  static printTranslate(_class: string): MenuChoiceTranslation {
    const xx: any = eval('Smo.' + _class);    
    const items: MenuChoiceDefinition[] = xx.defaults.menuItems as MenuChoiceDefinition[];
    const rvItems: MenuChoiceDefinition[] = [];
    items.forEach((item) => {
      rvItems.push({ value: item.value, text: item.text, icon: '' });
    });
    return { ctor: xx.ctor, label: xx.label, menuItems: items };
  }

  complete() {
    $('body').trigger('menuDismiss');
  }
  // Most menus don't process their own events
  keydown() {}
}
export interface SuiMenuManagerParams {
  view: SuiScoreViewOperations;
  eventSource: BrowserEventSource;
  completeNotifier: CompleteNotifier;
  undoBuffer: UndoBuffer;
  menuContainer: string;
  tracker: SuiTracker
}

export class SuiMenuManager {
  view: SuiScoreViewOperations;
  eventSource: BrowserEventSource;
  completeNotifier: CompleteNotifier | null = null;
  undoBuffer: UndoBuffer;
  menuContainer: string;
  bound: boolean = false;
  hotkeyBindings: Record<string, string> = {};
  closeMenuPromise: Promise<void> | null = null;
  menu: SuiMenuBase | null = null;
  keydownHandler: EventHandler | null = null;
  menuPosition: SvgBox = { x: 250, y: 40, width: 1, height: 1 };
  tracker: SuiTracker;
  menuBind: KeyBinding[] = SuiMenuManager.menuKeyBindingDefaults;
  constructor(params: SuiMenuManagerParams) {
    this.eventSource = params.eventSource;
    this.view = params.view;
    this.bound = false;
    this.menuContainer = params.menuContainer;
    this.undoBuffer = params.undoBuffer;
    this.tracker = params.tracker;
  }

  static get defaults() {
    return {
      menuBind: SuiMenuManager.menuKeyBindingDefaults,
      menuContainer: '.menuContainer'
    };
  }

  get closeModalPromise() {
    return this.closeMenuPromise;
  }

  setController(c: CompleteNotifier) {
    this.completeNotifier = c;
  }

  get score() {
    return this.view.score;
  }

  // ### Description:
  // slash ('/') menu key bindings.  The slash key followed by another key brings up
  // a menu.
  static get menuKeyBindingDefaults(): KeyBinding[] {
    return [
      {
        event: 'keydown',
        key: 'n',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiLanguageMenu'
      }, {
        event: 'keydown',
        key: 'k',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiKeySignatureMenu'
      }, {
        event: 'keydown',
        key: 'l',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiStaffModifierMenu'
      }, {
        event: 'keydown',
        key: 'd',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiDynamicsMenu'
      }, {
        event: 'keydown',
        key: 's',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiAddStaffMenu'
      }, {
        event: 'keydown',
        key: 'f',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiFileMenu'
      }, {
        event: 'keydown',
        key: 'L',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiLibraryMenu'
      }, {
        event: 'keydown',
        key: 'm',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiTimeSignatureMenu'
      }, {
        event: 'keydown',
        key: 'a',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiMeasureMenu'
      }
    ];
  }
  _advanceSelection(inc: number) {
    if (!this.menu) {
      return;
    }
    const options = $('.menuContainer ul.menuElement li.menuOption');
    inc = inc < 0 ? options.length - 1 : 1;
    this.menu.focusIndex = (this.menu.focusIndex + inc) % options.length;
    $(options[this.menu.focusIndex]).find('button').focus();
  }

  unattach() {
    if (!this.keydownHandler) {
      return;
    }
    this.eventSource.unbindKeydownHandler(this.keydownHandler);
    $('body').removeClass('modal');
    $(this.menuContainer).html('');
    $('body').off('dismissMenu');
    this.bound = false;
    this.menu = null;
  }

  attach() {
    if (!this.menu) {
      return;
    }
    let hotkey = 0;

    $(this.menuContainer).html('');
    $(this.menuContainer).attr('z-index', '12');
    const b = htmlHelpers.buildDom;
    const r = b('ul').classes('menuElement').attr('size', this.menu.menuItems.length)
      .css('left', '' + this.menuPosition.x + 'px')
      .css('top', '' + this.menuPosition.y + 'px');
    this.menu.menuItems.forEach((item) => {
      var vkey = (hotkey < 10) ? String.fromCharCode(48 + hotkey) :
        String.fromCharCode(87 + hotkey);

      r.append(
        b('li').classes('menuOption').append(
          b('button').attr('data-value', item.value).append(
            b('span').classes('menuText').text(item.text))
            .append(b('span').classes('icon icon-' + item.icon))
            .append(b('span').classes('menu-key').text('' + vkey))));
      item.hotkey = vkey;
      hotkey += 1;
    });
    $(this.menuContainer).append(r.dom());
    $('body').addClass('modal');
    this.bindEvents();
  }

  slashMenuMode(completeNotifier: CompleteNotifier) {
    var self = this;
    this.bindEvents();
    layoutDebug.addDialogDebug('slash menu creating closeMenuPromise');
    // A menu asserts this event when it is done.
    this.closeMenuPromise = new Promise((resolve) => {
      $('body').off('menuDismiss').on('menuDismiss', () => {
        layoutDebug.addDialogDebug('menuDismiss received, resolve closeMenuPromise');
        self.unattach();
        $('body').removeClass('slash-menu');
        resolve();
      });
    });
    // take over the keyboard
    if (this.closeModalPromise) {
      completeNotifier.unbindKeyboardForModal(this as ModalComponent);
    }
  }

  dismiss() {
    $('body').trigger('menuDismiss');
  }

  createMenu(action: string) {
    if (!this.completeNotifier) {
      return;
    }
    this.menuPosition = { x: 250, y: 40, width: 1, height: 1 };
    // If we were called from the ribbon, we notify the controller that we are
    // taking over the keyboard.  If this was a key-based command we already did.
    layoutDebug.addDialogDebug('createMenu creating ' + action);
    const ctor = eval('globalThis.Smo.' + action);
    const params: SuiMenuParams = 
    {
      position: this.menuPosition,
      tracker: this.tracker,
      score: this.score,
      completeNotifier: this.completeNotifier,
      closePromise: this.closeMenuPromise,
      view: this.view,
      eventSource: this.eventSource,
      undoBuffer: this.undoBuffer,
      ctor: action
    };
    this.menu = new ctor(params);
    this.attach();
    this.menu!.menuItems.forEach((item) => {
      if (typeof(item.hotkey) !== 'undefined') {
        this.hotkeyBindings[item.hotkey] = item.value;
      }
    });
  }

  // ### evKey
  // We have taken over menu commands from controller.  If there is a menu active, send the key
  // to it.  If there is not, see if the keystroke creates one.  If neither, dismissi the menu.
  evKey(event: any) {
    if (['Tab', 'Enter'].indexOf(event.code) >= 0) {
      return;
    }
    event.preventDefault();
    if (event.code === 'Escape') {
      this.dismiss();
    }
    if (this.menu) {
      if (event.code === 'ArrowUp') {
        this._advanceSelection(-1);
      } else if (event.code === 'ArrowDown') {
        this._advanceSelection(1);
      } else  if (this.hotkeyBindings[event.key]) {
        $('button[data-value="' + this.hotkeyBindings[event.key] + '"]').click();
      } else {
        this.menu.keydown();
      }
      return;
    }
    const binding = this.menuBind.find((ev) =>
      ev.key === event.key
    );
    if (!binding) {
      this.dismiss();
      return;
    }
    this.createMenu(binding.action);
  }

  bindEvents() {
    this.hotkeyBindings = { };
    $('body').addClass('slash-menu');
    // We need to keep track of is bound, b/c the menu can be created from
    // different sources.
    if (!this.bound) {
      this.keydownHandler = this.eventSource.bindKeydownHandler(this, 'evKey');
      this.bound = true;
    }
    $(this.menuContainer).find('button').off('click').on('click', (ev: any) => {
      if ($(ev.currentTarget).attr('data-value') === 'cancel') {
        this.menu!.complete();
        return;
      }
      this.menu!.selection(ev);
    });
  }
}

export class SuiScoreMenu extends SuiMenuBase {
  static get defaults(): MenuDefinition {
    return {
      label: 'Score Settings',
      menuItems: [{
        icon: '',
        text: 'Layout',
        value: 'layout'
      }, {
        icon: '',
        text: 'Fonts',
        value: 'fonts'
      }, {
        icon: '',
        text: 'View',
        value: 'view'
      }, {
        icon: '',
        text: 'Score Info',
        value: 'identification'
      }, {
        icon: '',
        text: 'Global Settings',
        value: 'preferences'
      }, {
        icon: '',
        text: 'Cancel',
        value: 'cancel'
      }]
    };
  }
  getDefinition() { 
    return SuiScoreMenu.defaults;
  }
  constructor(params: SuiMenuParams) {
    super(params);
  }

  execView() {
    SuiScoreViewDialog.createAndDisplay(
      {
        eventSource: this.eventSource,
        completeNotifier: this.completeNotifier,
        view: this.view,
        startPromise: this.closePromise
      });
  }
  execScoreId() {
    SuiScoreIdentificationDialog.createAndDisplay(
      {
        eventSource: this.eventSource,
        completeNotifier: this.completeNotifier,
        view: this.view,
        startPromise: this.closePromise
      });
  }
  execLayout() {
    SuiLayoutDialog.createAndDisplay(
      {
        eventSource: this.eventSource,
        completeNotifier: this.completeNotifier,
        view: this.view,
        startPromise: this.closePromise
      });
  }
  execFonts() {
    SuiScoreFontDialog.createAndDisplay(
      {
        eventSource: this.eventSource,
        completeNotifier: this.completeNotifier,
        view: this.view,
        startPromise: this.closePromise
      });
  }
  execPreferences() {
    SuiGlobalLayoutDialog.createAndDisplay(
      {
        eventSource: this.eventSource,
        completeNotifier: this.completeNotifier,
        view: this.view,
        startPromise: this.closePromise
      });
  }
  selection(ev: any) {
    const text = $(ev.currentTarget).attr('data-value');
    if (text === 'view') {
      this.execView();
    } else if (text === 'layout') {
      this.execLayout();
    } else if (text === 'fonts') {
      this.execFonts();
    } else if (text === 'preferences') {
      this.execPreferences();
    } else if (text === 'identification') {
      this.execScoreId();
    }
    this.complete();
  }
  keydown() {}
}
export class SuiFileMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static get defaults() {
    return {
      label: 'File',
      menuItems: [{
        icon: 'folder-new',
        text: 'New Score',
        value: 'newFile'
      }, {
        icon: 'folder-open',
        text: 'Open',
        value: 'openFile'
      }, {
        icon: '',
        text: 'Quick Save',
        value: 'quickSave'
      }, {
        icon: 'folder-save',
        text: 'Save',
        value: 'saveFile'
      }, {
        icon: '',
        text: 'Print',
        value: 'printScore'
      }, {
        icon: '',
        text: 'Import MusicXML',
        value: 'importMxml'
      }, {
        icon: '',
        text: 'Export MusicXML',
        value: 'exportXml'
      }, {
        icon: '',
        text: 'Export Midi',
        value: 'exportMidi'
      }, {
        icon: 'folder-save',
        text: 'Save Actions',
        value: 'saveActions'
      }, {
        icon: 'icon-play3',
        text: 'Play Actions',
        value: 'playActions'
      }, {
        icon: '',
        text: 'Cancel',
        value: 'cancel'
      }]
    };
  }
  getDefinition() { 
    return SuiFileMenu.defaults;
  }
  systemPrint() {
    window.print();
    SuiPrintFileDialog.createAndDisplay({
      view: this.view,
      completeNotifier: this.completeNotifier,
      startPromise: this.closePromise,
      tracker: this.tracker,
      undoBuffer: this.undoBuffer,
    });
  }
  selection(ev: any) {
    const text = $(ev.currentTarget).attr('data-value');
    const self = this;
    if (text === 'saveFile') {
      SuiSaveFileDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'saveActions') {
      SuiSaveActionsDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    }  else if (text === 'playActions') {
      SuiLoadActionsDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'openFile') {
      SuiLoadFileDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'newFile') {
      const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
      this.view.changeScore(score);
    } else if (text === 'quickSave') {
      this.view.quickSave();
    } else if (text === 'printScore') {
      const systemPrint = () => {
        self.systemPrint();
      };
      this.view.renderer.renderForPrintPromise().then(systemPrint);
    } else if (text === 'exportXml') {
      SuiSaveXmlDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'exportMidi') {
      SuiSaveMidiDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'importMxml') {
      SuiLoadMxmlDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    }
    this.complete();
  }
  keydown() {}
}

export class SuiLibraryMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static get ctor() {
    return 'SuiFileMenu';
  }
  static get defaults() {
    return {
      label: 'Score',
      menuItems: [{
        icon: '',
        text: 'Bach Invention',
        value: 'bach'
      }, {
        icon: '',
        text: 'Postillion-Lied',
        value: 'postillion'
      }, {
        icon: '',
        text: 'Jesu Bambino',
        value: 'bambino'
      }, {
        icon: '',
        text: 'Handel Messiah 1-1',
        value: 'handel'
      }, {
        icon: '',
        text: 'Precious Lord',
        value: 'preciousLord'
      }, {
        icon: '',
        text: 'In Its Delightful Shade',
        value: 'shade'
      }, {
        icon: '',
        text: 'Yama',
        value: 'yamaJson'
      }, {
        icon: '',
        text: 'Dichterliebe (xml)',
        value: 'dichterliebe'
      }, {
        icon: '',
        text: 'Beethoven - An die ferne Gliebte (xml)',
        value: 'beethoven'
      }, {
        icon: '',
        text: 'Mozart - An Chloe (xml)',
        value: 'mozart'
      }, {
        icon: '',
        text: 'Joplin - The Entertainer (xml)',
        value: 'joplin'
      }, {
        icon: '',
        text: 'Cancel',
        value: 'cancel'
      }]
    };
  }
  getDefinition() {
    return SuiLibraryMenu.defaults;
  }
  _loadJsonAndComplete(path: string) {
    const req = new SuiXhrLoader(path);
    req.loadAsync().then(() => {
      const score = SmoScore.deserialize(req.value);
      this.view.changeScore(score);
      this.complete();
    });
  }
  _loadXmlAndComplete(path: string) {
    const req = new SuiXhrLoader(path);
    req.loadAsync().then(() => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(req.value, 'text/xml');
      const score = mxmlScore.smoScoreFromXml(xml);
      this.view.changeScore(score);
      this.complete();
    });
  }

  selection(ev: any) {
    const text = $(ev.currentTarget).attr('data-value');
    if (text === 'bach') {
      this._loadJsonAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/BachInvention.json');
    } else if (text === 'yamaJson') {
      this._loadJsonAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Yama2.json');
    } else if (text === 'handel') {
      this._loadJsonAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Messiah Pt 1-1.json');
    } else if (text === 'bambino') {
      this._loadJsonAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Gesu Bambino.json');
    } else if (text === 'shade') {
      this._loadJsonAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Shade.json');
    } else if (text === 'postillion') {
      this._loadJsonAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Postillionlied.json');
    } else if (text === 'preciousLord') {
      this._loadJsonAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Precious Lord.json');
    } else if (text === 'dichterliebe') {
      this._loadXmlAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Dichterliebe01.xml');
    } else if (text === 'beethoven') {
      this._loadXmlAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Beethoven_AnDieFerneGeliebte.xml');
    } else if (text === 'mozart') {
      this._loadXmlAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Mozart_AnChloe.xml');
    } else if (text === 'joplin') {
      this._loadXmlAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/ScottJoplin_The_Entertainer.xml');
    }
    this.complete();
  }
  keydown() {}
}

export class SuiDynamicsMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static get defaults() {
    return {
        label: 'Dynamics',
        menuItems: [{
          icon: 'pianissimo',
          text: 'Pianissimo',
          value: 'pp'
        }, {
          icon: 'piano',
          text: 'Piano',
          value: 'p'
        }, {
          icon: 'mezzopiano',
          text: 'Mezzo-piano',
          value: 'mp'
        }, {
          icon: 'mezzoforte',
          text: 'Mezzo-forte',
          value: 'mf'
        }, {
          icon: 'forte',
          text: 'Forte',
          value: 'f'
        }, {
          icon: 'fortissimo',
          text: 'Fortissimo',
          value: 'ff'
        }, {
          icon: 'sfz',
          text: 'sfortzando',
          value: 'sfz'
        }, {
          icon: '',
          text: 'Cancel',
          value: 'cancel'
        }]
      };
  }
  getDefinition() {
    return SuiDynamicsMenu.defaults;
  }

  selection(ev: any) {
    const text = $(ev.currentTarget).attr('data-value');
    this.view.addDynamic(text);
    this.complete();
  }
  keydown() {}
}

export class SuiTimeSignatureMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static get defaults() {
    return {
        label: 'Time Sig',
        menuItems: [{
          icon: 'sixeight',
          text: '6/8',
          value: '6/8',
        }, {
          icon: 'fourfour',
          text: '4/4',
          value: '4/4',
        }, {
          icon: 'threefour',
          text: '3/4',
          value: '3/4',
        }, {
          icon: 'twofour',
          text: '2/4',
          value: '2/4',
        }, {
          icon: 'twelveeight',
          text: '12/8',
          value: '12/8',
        }, {
          icon: 'seveneight',
          text: '7/8',
          value: '7/8',
        }, {
          icon: 'fiveeight',
          text: '5/8',
          value: '5/8',
        }, {
          icon: '',
          text: 'Other',
          value: 'TimeSigOther',
        }, {
          icon: '',
          text: 'Cancel',
          value: 'cancel'
        }]
      };
  }
  getDefinition() {
    return SuiTimeSignatureMenu.defaults;
  }
  selection(ev: any) {
    var text = $(ev.currentTarget).attr('data-value');

    if (text === 'TimeSigOther') {
      SuiTimeSignatureDialog.createAndDisplay({
        view: this.view,
        completeNotifier: this.completeNotifier,
        startPromise: this.closePromise,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource
      });
      this.complete();
      return;
    }
    this.view.setTimeSignature(SmoMeasure.convertLegacyTimeSignature(text));
    this.complete();
  }

  keydown() {}
}

export class SuiKeySignatureMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static get ctor() {
    return 'SuiKeySignatureMenu';
  }
  static get defaults() {
    return {
        label: 'Key',
        menuItems: [{
          icon: 'key-sig-c',
          text: 'C Major',
          value: 'KeyOfC',
        }, {
          icon: 'key-sig-f',
          text: 'F Major',
          value: 'KeyOfF',
        }, {
          icon: 'key-sig-g',
          text: 'G Major',
          value: 'KeyOfG',
        }, {
          icon: 'key-sig-bb',
          text: 'Bb Major',
          value: 'KeyOfBb'
        }, {
          icon: 'key-sig-d',
          text: 'D Major',
          value: 'KeyOfD'
        }, {
          icon: 'key-sig-eb',
          text: 'Eb Major',
          value: 'KeyOfEb'
        }, {
          icon: 'key-sig-a',
          text: 'A Major',
          value: 'KeyOfA'
        }, {
          icon: 'key-sig-ab',
          text: 'Ab Major',
          value: 'KeyOfAb'
        }, {
          icon: 'key-sig-e',
          text: 'E Major',
          value: 'KeyOfE'
        }, {
          icon: 'key-sig-bd',
          text: 'Db Major',
          value: 'KeyOfDb'
        }, {
          icon: 'key-sig-b',
          text: 'B Major',
          value: 'KeyOfB'
        }, {
          icon: 'key-sig-fs',
          text: 'F# Major',
          value: 'KeyOfF#'
        }, {
          icon: 'key-sig-cs',
          text: 'C# Major',
          value: 'KeyOfC#'
        },
        {
          icon: '',
          text: 'Cancel',
          value: 'cancel'
        }],
        menuContainer: '.menuContainer'
      };
  }
  getDefinition() {
    return SuiKeySignatureMenu.defaults;
  }
  selection(ev: any) {
    let keySig = $(ev.currentTarget).attr('data-value');
    keySig = (keySig === 'cancel' ? keySig : keySig.substring(5, keySig.length));
    if (keySig === 'cancel') {
      return;
    }
    this.view.addKeySignature(keySig);
    this.complete();
  }
  keydown() {}
}

export class SuiStaffModifierMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static get defaults() {
    return {
        label: 'Lines',
        menuItems: [{
          icon: 'cresc',
          text: 'Crescendo',
          value: 'crescendo'
        }, {
          icon: 'decresc',
          text: 'Decrescendo',
          value: 'decrescendo'
        }, {
          icon: 'slur',
          text: 'Slur',
          value: 'slur'
        }, {
          icon: 'slur',
          text: 'Tie',
          value: 'tie'
        }, {
          icon: 'ending',
          text: 'nth ending',
          value: 'ending'
        },
        {
          icon: '',
          text: 'Cancel',
          value: 'cancel'
        }],
        menuContainer: '.menuContainer'
      };
  }
  getDefinition() {
    return SuiStaffModifierMenu.defaults;
  }
  selection(ev: any) {
    var op = $(ev.currentTarget).attr('data-value');
    if (op === 'ending') {
      this.view.addEnding();
    } else if (op === 'slur') {
      this.view.slur();
    }  else if (op === 'tie') {
      this.view.tie();
    } else if (op === 'crescendo') {
      this.view.crescendo();
    } else if (op === 'decrescendo') {
      this.view.decrescendo();
    }
    // else cancel...
    this.complete();
  }
  keydown() {
  }
}

export class SuiLanguageMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static get ctor() {
    return 'SuiLanguageMenu';
  }
  static get defaults() {
    return {
        label: 'Language',
        menuItems: [{
          icon: '',
          text: 'English',
          value: 'en'
        }, {
          icon: '',
          text: 'Deutsch',
          value: 'de'
        }, {
          icon: '',
          text: 'اَلْعَرَبِيَّةُ',
          value: 'ar'
        }, {
          icon: '',
          text: 'Cancel',
          value: 'cancel'
        }],
        menuContainer: '.menuContainer'
      };
  }
  getDefinition() {
    return SuiLanguageMenu.defaults;
  }
  selection(ev: any) {
    var op = $(ev.currentTarget).attr('data-value');

    SmoTranslator.setLanguage(op);
    this.complete();
  }
  keydown() {
  }
}
export class SuiMeasureMenu extends SuiMenuBase {
  static get defaults() {
    return {
      label: 'Measure',
      menuItems: [
        {
          icon: '',
          text: 'Add Measures',
          value: 'addMenuCmd'
        }, {
          icon: 'icon-cross',
          text: 'Delete Selected Measures',
          value: 'deleteSelected'
        }, {
          icon: '',
          text: 'Format Measure',
          value: 'formatMeasureDialog'
        }, {
          icon: '',
          text: 'Cancel',
          value: 'cancel'
        }
      ]
    };
  }
  getDefinition() {
    return SuiMeasureMenu.defaults;
  }
  constructor(params: SuiMenuParams) {
    super(params);
  }
  selection(ev: any) {
    const text = $(ev.currentTarget).attr('data-value');
    if (text === 'formatMeasureDialog') {
      SuiMeasureDialog.createAndDisplay({
        view: this.view,
        completeNotifier: this.completeNotifier,
        startPromise: this.closePromise,
        eventSource: this.eventSource
      });
      this.complete();
      return;
    }
    if (text === 'addMenuCmd') {
      SuiInsertMeasures.createAndDisplay({
        view: this.view,
        completeNotifier: this.completeNotifier,
        startPromise: this.closePromise,
        eventSource: this.eventSource
      });
      this.complete();
    }
    if (text === 'addMenuAfterCmd') {
      this.view.addMeasure(true);
      this.complete();
    }
    if (text === 'deleteSelected') {
      this.view.deleteMeasure();
    }
    this.complete();
  }
}

export class SuiAddStaffMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static get ctor() {
    return 'SuiAddStaffMenu';
  }
  static get defaults() {
    return {
      label: 'Add Staff',
      menuItems: [
        {
          icon: 'treble',
          text: 'Treble Clef Staff',
          value: 'trebleInstrument'
        }, {
          icon: 'bass',
          text: 'Bass Clef Staff',
          value: 'bassInstrument'
        }, {
          icon: 'alto',
          text: 'Alto Clef Staff',
          value: 'altoInstrument'
        }, {
          icon: 'tenor',
          text: 'Tenor Clef Staff',
          value: 'tenorInstrument'
        }, {
          icon: 'percussion',
          text: 'Percussion Clef Staff',
          value: 'percussionInstrument'
        }, {
          icon: '',
          text: 'Staff Groups',
          value: 'staffGroups'
        }, {
          icon: 'cancel-circle',
          text: 'Remove Staff',
          value: 'remove'
        }, {
          icon: '',
          text: 'Cancel',
          value: 'cancel'
        }
      ],
      menuContainer: '.menuContainer'
    };
  }
  static get instrumentMap(): Record<string, Partial<SmoSystemStaffParams>> {
    return {
      'trebleInstrument': {
        instrumentInfo: {
          instrumentName: 'Treble Clef Staff',
          keyOffset: 0,
          clef: 'treble'
        }
      },
      'bassInstrument': {
        instrumentInfo: {
          instrumentName: 'Bass Clef Staff',
          keyOffset: 0,
          clef: 'bass'
        }
      },
      'altoInstrument': {
        instrumentInfo: {
          instrumentName: 'Alto Clef Staff',
          keyOffset: 0,
          clef: 'alto'
        }
      },
      'tenorInstrument': {
        instrumentInfo: {
          instrumentName: 'Tenor Clef Staff',
          keyOffset: 0,
          clef: 'tenor'
        }
      },
      'percussionInstrument': {
        instrumentInfo: {
          instrumentName: 'Percussion Clef Staff',
          keyOffset: 0,
          clef: 'percussion'
        }
      },
      'remove': {
        instrumentInfo: {
          instrumentName: 'Remove clef',
          keyOffset: 0,
          clef: 'tenor'
        }
      }
    };
  }
  getDefinition() {
    return SuiAddStaffMenu.defaults;
  }
  execStaffGroups() {
    SuiStaffGroupDialog.createAndDisplay(
      {
        eventSource: this.eventSource,
        completeNotifier: this.completeNotifier,
        view: this.view,
        startPromise: this.closePromise
      }
    );
  }

  selection(ev: any) {
    const op: string = $(ev.currentTarget).attr('data-value');
    if (op === 'remove') {
      this.view.removeStaff();
      this.complete();
    } else if (op === 'staffGroups') {
      this.execStaffGroups();
      this.complete();
    } else if (op === 'cancel') {
      this.complete();
    } else {
      const instrument: SmoSystemStaffParams = SmoSystemStaff.defaults;
      const params = SuiAddStaffMenu.instrumentMap[op];
      if(params.instrumentInfo) {
        instrument.instrumentInfo = params.instrumentInfo;
        this.view.addStaff(instrument);  
      }
      this.complete();
    }
  }
  keydown() {}
}
