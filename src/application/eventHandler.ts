// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.

import { RibbonButtons } from '../ui/buttons/ribbon';
import { SuiExceptionHandler } from '../ui/exceptions';
import { Qwerty } from '../ui/qwerty';
import { SuiModifierDialogFactory } from '../ui/dialogs/factory';
import { SuiPiano } from '../render/sui/piano'
import { layoutDebug } from '../render/sui/layoutDebug';
import { SuiHelp } from '../ui/help';
import { SuiTracker } from '../render/sui/tracker';
import { defaultEditorKeys } from '../ui/keyBindings/default/editorKeys';
import { defaultTrackerKeys } from '../ui/keyBindings/default/trackerKeys';
import { defaultRibbonLayout } from '../ui/ribbonLayout/default/defaultRibbon';
import { SuiScoreViewOperations } from '../render/sui/scoreViewOperations';
import { BrowserEventSource, EventHandler } from './eventSource';
import { SuiKeyCommands } from './keyCommands';
import { ModalComponent, KeyBinding, KeyEvent } from './common';
import { ModifierTab } from '../smo/xform/selections';
import { SvgHelpers } from '../render/sui/svgHelpers';
import { SuiMenuManager } from '../ui/menus/manager';

declare var $: any;

export interface EventHandlerParams {
  view: SuiScoreViewOperations,
  eventSource: BrowserEventSource,
  tracker: SuiTracker,
  keyCommands: SuiKeyCommands,
  menus: SuiMenuManager
}
// ## SuiEventHandler
// ## Description:
// Manages DOM events and binds keyboard and mouse events
// to editor and menu commands, tracker and layout manager.
// ### Event model:
// Events can come from the following sources:
// 1. menus or dialogs can send dialogDismiss or menuDismiss event, indicating a modal has been dismissed.
// 2. window resize events
// 3. keyboard, when in editor mode.  When modals or dialogs are active, wait for dismiss event
// 4. svg piano key events smo-piano-key
// 5. tracker change events tracker-selection
export class SuiEventHandler {
  static reentry: boolean = false;
  static keyboardUi: Qwerty;
  view: SuiScoreViewOperations;
  eventSource: BrowserEventSource;
  tracker: SuiTracker;
  keyCommands: SuiKeyCommands;
  resizing: boolean = false;
  undoStatus: number = 0;
  trackScrolling: boolean = false;
  keyHandlerObj: any = null;
  ribbon: RibbonButtons;
  menus: SuiMenuManager;
  piano: SuiPiano | null = null;
  exhandler: SuiExceptionHandler;
  unbound: boolean = false;
  keydownHandler: EventHandler | null = null;
  mouseMoveHandler: EventHandler | null = null;
  mouseClickHandler: EventHandler | null = null;
  keyBind: KeyBinding[] = [];
  constructor(params: EventHandlerParams) {
    (globalThis as any).SuiEventHandlerInstance = this;

    this.view = params.view;
    this.menus = params.menus;
    this.eventSource = params.eventSource;
    this.tracker = this.view.tracker; // needed for key event handling
    this.keyCommands = params.keyCommands;
    this.keyCommands.completeNotifier = this;
    this.keyCommands.view = this.view;
    this.resizing = false;
    this.undoStatus = 0;
    this.trackScrolling = false;
    this.keyHandlerObj = null;
    this.keyBind = SuiEventHandler.keyBindingDefaults;
    this.ribbon = new RibbonButtons({
      ribbons: defaultRibbonLayout.ribbons,
      ribbonButtons: defaultRibbonLayout.ribbonButtons,
      menus: this.menus,
      completeNotifier: this,
      view: this.view,
      eventSource: this.eventSource,
      tracker: this.tracker
    });

    this.menus.setController(this);

    // create globbal exception instance
    this.exhandler = new SuiExceptionHandler(this);

    this.bindEvents();

    // Only display the ribbon one time b/c it's expensive operation
    this.ribbon.display();
    this.bindResize();
    this.view.startRenderingEngine();
    this.createPiano();
  }

  static get scrollable() {
    return '.musicRelief';
  }

  handleScrollEvent() {
    const self = this;
    if (self.trackScrolling) {
      return;
    }
    self.trackScrolling = true;
    setTimeout(function () {
      try {
        // wait until redraw is done to track scroll events.
        self.trackScrolling = false;
        // Thisi s a WIP...
        self.view.tracker.scroller.handleScroll($(SuiEventHandler.scrollable)[0].scrollLeft, $(SuiEventHandler.scrollable)[0].scrollTop);
      } catch (e) {
        SuiExceptionHandler.instance.exceptionHandler(e);
      }
    }, 500);
  }

  createPiano() {
    this.piano = new SuiPiano(this.view);
  }
  resizeEvent() {
    var self = this;
    if (this.resizing) {
      return;
    }
    if (!this.piano) {
      return;
    }
    if ($('body').hasClass('printing')) {
      return;
    }
    this.resizing = true;
    setTimeout(function () {
      console.log('resizing');
      self.resizing = false;
      self.piano!.handleResize();
      self.view.renderer.rerenderAll();
    }, 1);
  }

  createModifierDialog(modifierSelection: ModifierTab) {
    var parameters = {
      modifier: modifierSelection.modifier,
      view: this.view, eventSource: this.eventSource,
      completeNotifier: this, keyCommands: this.keyCommands, 
      ctor: '', // filled in by the factory
      tracker: this.tracker,
      startPromise: null,
      id: 'modifier-dialog',
      undoBuffer: this.view.undoBuffer
    }
    return SuiModifierDialogFactory.createModifierDialog(modifierSelection.modifier, parameters);
  }

  // If the user has selected a modifier via the mouse/touch, bring up mod dialog
  // for that modifier
  trackerModifierSelect(ev: KeyEvent) {
    var modSelection = this.view.tracker.getSelectedModifier();
    if (modSelection) {
      var dialog = this.createModifierDialog(modSelection);
      if (dialog) {
        // this.view.tracker.selectSuggestion(ev);
        return;
        // this.unbindKeyboardForModal(dialog);
      } else {
        this.view.tracker.advanceModifierSelection(ev);
      }
    } else {
      this.view.tracker.selectSuggestion(ev);
    }
    return;
  }

  // ### bindResize
  // This handles both resizing of the music area (scrolling) and resizing of the window.
  // The latter results in a redraw, the former just resets the client/logical map of elements
  // in the tracker.
  bindResize() {
    const self = this;
    const el = $(SuiEventHandler.scrollable)[0];
    // unit test programs don't have resize html
    if (!el) {
      return;
    }
    window.addEventListener('resize', function () {
      self.resizeEvent();
    });

    let scrollCallback = () => {
      self.handleScrollEvent();
    };
    el.onscroll = scrollCallback;
  }


  // ### renderElement
  // return render element that is the DOM parent of the svg
  get renderElement() {
    return this.view.renderer.renderElement;
  }

  // ## keyBindingDefaults
  // ### Description:
  // Different applications can create their own key bindings, these are the defaults.
  // Many editor commands can be reached by a single keystroke.  For more advanced things there
  // are menus.
  static get keyBindingDefaults(): KeyBinding[] {
    var editorKeys = SuiEventHandler.editorKeyBindingDefaults;
    editorKeys.forEach((key) => {
      key.module = 'keyCommands'
    });
    var trackerKeys = SuiEventHandler.trackerKeyBindingDefaults;
    trackerKeys.forEach((key) => {
      key.module = 'tracker'
    });
    return trackerKeys.concat(editorKeys);
  }

  // ## editorKeyBindingDefaults
  // ## Description:
  // execute a simple command on the editor, based on a keystroke.
  static get editorKeyBindingDefaults() {
    return defaultEditorKeys.keys;
  }

  // ## trackerKeyBindingDefaults
  // ### Description:
  // Key bindings for the tracker.  The tracker is the 'cursor' in the music
  // that lets you select and edit notes.
  static get trackerKeyBindingDefaults() {
    return defaultTrackerKeys.keys;
  }
  helpControls() {
    var self = this;
    var rebind = function () {
      self.bindEvents();
    }
  }
  menuHelp() {
    SuiHelp.displayHelp();
  }

  static get defaults() {
    return {
      keyBind: SuiEventHandler.keyBindingDefaults
    };
  }

  // ### unbindKeyboardForModal
  // Global events from keyboard and pointer are handled by this object.  Modal
  // UI elements take over the events, and then let the controller know when
  // the modals go away.
  unbindKeyboardForModal(dialog: ModalComponent) {
    if (this.unbound) {
      console.log('received duplicate bind event');
      return;
    }
    this.unbound = true;
    layoutDebug.addDialogDebug('controller: unbindKeyboardForModal')
    const rebind = () => {
      this.unbound = false;
      this.bindEvents();
      layoutDebug.addDialogDebug('controller: unbindKeyboardForModal resolve')
    }
    this.eventSource.unbindKeydownHandler(this.keydownHandler!);
    this.eventSource.unbindMouseMoveHandler(this.mouseMoveHandler!);
    this.eventSource.unbindMouseClickHandler(this.mouseClickHandler!);
    dialog.closeModalPromise.then(rebind);
  }

  evKey(evdata: any) {
    if ($('body').hasClass('translation-mode')) {
      return;
    }

    console.log("KeyboardEvent: key='" + evdata.key + "' | code='" +
      evdata.code + "'"
      + " shift='" + evdata.shiftKey + "' control='" + evdata.ctrlKey + "'" + " alt='" + evdata.altKey + "'");
    evdata.preventDefault();

    if (SuiEventHandler.keyboardUi) {
      Qwerty.handleKeyEvent(evdata);
    }
    const dataCopy = SuiTracker.serializeEvent(evdata);
    this.view.renderer.updatePromise().then(() => {
      if (dataCopy.key == '?') {
        SuiHelp.displayHelp();
      }

      if (dataCopy.key == '/') {
        // set up menu DOM.
        this.menus.slashMenuMode(this);
      }

      if (dataCopy.key == 'Enter') {
        this.trackerModifierSelect(dataCopy);
      }

      var binding: KeyBinding | undefined = this.keyBind.find((ev: KeyBinding) =>
        ev.event === 'keydown' && ev.key === dataCopy.key &&
        ev.ctrlKey === dataCopy.ctrlKey &&
        ev.altKey === dataCopy.altKey && dataCopy.shiftKey === ev.shiftKey);

      if (binding) {
        try {
          if (binding.module === 'tracker') {
            (this.tracker as any)[binding.action](dataCopy);
          } else {
            (this.keyCommands as any)[binding.action](dataCopy);
          }
        } catch (e) {
          if (typeof (e) === 'string') {
            console.error(e);
          }
          this.exhandler.exceptionHandler(e);
        }
      }
    });
  }

  mouseMove(ev: any) {
    this.view.tracker.intersectingArtifact(SvgHelpers.smoBox({
      x: ev.clientX,
      y: ev.clientY
    }));
  }

  mouseClick(ev: any) {
    const dataCopy = SuiTracker.serializeEvent(ev);
    this.view.renderer.updatePromise().then(() => {
      this.view.tracker.selectSuggestion(dataCopy);
      var modifier = this.view.tracker.getSelectedModifier();
      if (modifier) {
        this.createModifierDialog(modifier);
      }
    });
  }
  bindEvents() {
    const self = this;
    const tracker = this.view.tracker;
    $('body').off('forceScrollEvent').on('forceScrollEvent', function () {
      self.handleScrollEvent();
    });
    $('body').off('forceResizeEvent').on('forceResizeEvent', function () {
      self.resizeEvent();
    });
    this.mouseMoveHandler = this.eventSource.bindMouseMoveHandler(this, 'mouseMove');
    this.mouseClickHandler = this.eventSource.bindMouseClickHandler(this, 'mouseClick');
    this.keydownHandler = this.eventSource.bindKeydownHandler(this, 'evKey');

    this.helpControls();
    window.addEventListener('error', function (e) {
      SuiExceptionHandler.instance.exceptionHandler(e);
    });
  }
}
