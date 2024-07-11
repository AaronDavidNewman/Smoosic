// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { buildDom, createTopDomContainer } from '../../common/htmlHelpers';
import { SvgBox } from '../../smo/data/common';
import { UndoBuffer } from '../../smo/xform/undo';

import { layoutDebug } from '../../render/sui/layoutDebug';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiTracker } from '../../render/sui/tracker';
import { CompleteNotifier, ModalComponent } from '../common';
import { BrowserEventSource, EventHandler } from '../eventSource';
import { KeyBinding } from '../../application/common';
import { Qwerty } from '../qwerty';
import { SuiMenuBase, SuiMenuParams, SuiConfiguredMenu, SuiConfiguredMenuOption } from './menu';
declare var $: any;

export interface SuiMenuManagerParams {
  view: SuiScoreViewOperations;
  eventSource: BrowserEventSource;
  completeNotifier: CompleteNotifier;
  undoBuffer: UndoBuffer;
  menuContainer?: HTMLElement;
}

export class SuiMenuManager {
  view: SuiScoreViewOperations;
  eventSource: BrowserEventSource;
  completeNotifier: CompleteNotifier;
  undoBuffer: UndoBuffer;
  menuContainer: HTMLElement;
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
    this.menuContainer = params.menuContainer ?? createTopDomContainer('.menuContainer');
    this.completeNotifier = params.completeNotifier;
    this.undoBuffer = params.undoBuffer;
    this.tracker = params.view.tracker;
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
        key: 'p',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiPartMenu'
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
        key: 'f',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiFileMenu'
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
      },  {
        event: 'partSelection',
        key: '',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiPartSelectionMenu'
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
    const b = buildDom;
    const r = b('ul').classes('menuElement').attr('size', this.menu.menuItems.length.toString())
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
    if (this.closeMenuPromise) {
      console.log('menu already open, skipping');
      return;
    }
    this.bindEvents();
    layoutDebug.addDialogDebug('slash menu creating closeMenuPromise');
    // A menu asserts this event when it is done.
    this.closeMenuPromise = new Promise((resolve) => {
      $('body').off('menuDismiss').on('menuDismiss', () => {
        layoutDebug.addDialogDebug('menuDismiss received, resolve closeMenuPromise');
        self.unattach();
        $('body').removeClass('slash-menu d-block');
        self.closeMenuPromise = null;
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
  displayMenu(menu: SuiMenuBase | null) {
    this.menu = menu;
    if (!this.menu) {
      return;
    }
    this.menu.preAttach();
    this.attach();
    this.menu!.menuItems.forEach((item) => {
      if (typeof(item.hotkey) !== 'undefined') {
        this.hotkeyBindings[item.hotkey] = item.value;
      }
    });
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
    this.displayMenu(new ctor(params));
  }

  // ### evKey
  // We have taken over menu commands from controller.  If there is a menu active, send the key
  // to it.  If there is not, see if the keystroke creates one.  If neither, dismissi the menu.
  evKey(event: any) {
    Qwerty.handleKeyEvent(event);
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
    $('body').addClass('slash-menu d-block');
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




