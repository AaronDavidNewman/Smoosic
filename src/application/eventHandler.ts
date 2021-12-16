// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.

import { RibbonButtons } from '../ui/buttons/ribbon';
import { KeyEvent } from '../smo/data/common';
import { SuiExceptionHandler } from '../ui/exceptions';
import { Qwerty } from '../ui/qwerty';
import { SuiModifierDialogFactory } from '../ui/dialogs/factory';
import { SuiPiano } from '../render/sui/piano'
import { layoutDebug } from '../render/sui/layoutDebug';
import { SuiHelp } from '../ui/help';
import { CompleteNotifier, ModalComponent } from '../ui/common';
import { SuiTracker } from '../render/sui/tracker';
import { defaultEditorKeys } from '../ui/keyBindings/default/editorKeys';
import { defaultTrackerKeys } from '../ui/keyBindings/default/trackerKeys';
import { SuiScoreViewOperations } from '../render/sui/scoreViewOperations';
import { BrowserEventSource, EventHandler } from '../ui/eventSource';
import { SuiKeyCommands } from './keyCommands';
import { KeyBinding, ModalEventHandler } from './common';
import { ModifierTab } from '../smo/xform/selections';
import { SvgHelpers } from '../render/sui/svgHelpers';
import { SuiMenuManager } from '../ui/menus/manager';

declare var $: any;

/**
 * Handle keyboard/mouse events, and pass them to the renderer and other UI elements.
 */
export interface EventHandlerParams {
  view: SuiScoreViewOperations,
  eventSource: BrowserEventSource,
  tracker: SuiTracker,
  keyCommands: SuiKeyCommands,
  menus: SuiMenuManager,
  completeNotifier: CompleteNotifier,
  keyBindings: KeyBinding[]
}
/**
 * this is the default keyboard/mouse handler for smoosic in application mode.
 * It diverts key events to tracker or key commmands as appropriate, and mouse events to 
 * tracker.  Modal elements take this control away temporarily.
 * 
 * It also handles some global events such as window resize and scroll of the music region.
 * @category SuiApplication
*/
export class SuiEventHandler implements ModalEventHandler {
  static reentry: boolean = false;
  static keyboardUi: Qwerty;
  view: SuiScoreViewOperations;
  eventSource: BrowserEventSource;
  tracker: SuiTracker;
  keyBind: KeyBinding[];
  completeNotifier: CompleteNotifier;
  keyCommands: SuiKeyCommands;
  resizing: boolean = false;
  undoStatus: number = 0;
  trackScrolling: boolean = false;
  keyHandlerObj: any = null;
  menus: SuiMenuManager;
  piano: SuiPiano | null = null;
  exhandler: SuiExceptionHandler;
  constructor(params: EventHandlerParams) {
    (globalThis as any).SuiEventHandlerInstance = this;

    this.view = params.view;
    this.menus = params.menus;
    this.completeNotifier = params.completeNotifier;
    this.eventSource = params.eventSource;
    this.tracker = params.tracker; // needed for key event handling
    this.keyBind = params.keyBindings;
    this.keyCommands = params.keyCommands;
    this.keyCommands.view = this.view;
    this.resizing = false;
    this.undoStatus = 0;
    this.trackScrolling = false;
    this.keyHandlerObj = null;
    // create global exception instance
    this.exhandler = new SuiExceptionHandler(this);
    this.bindEvents();
    this.bindResize();
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
      completeNotifier: this.completeNotifier, keyCommands: this.keyCommands, 
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
        this.view.tracker.advanceModifierSelection(this.view.score, ev);
      }
    } else {
      this.view.tracker.selectSuggestion(this.view.score, ev);
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
        this.menus.slashMenuMode(this.completeNotifier);
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
            (this.tracker as any)[binding.action](this.view.score, dataCopy);
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
      this.view.tracker.selectSuggestion(this.view.score, dataCopy);
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
    this.helpControls();
    window.addEventListener('error', function (e) {
      SuiExceptionHandler.instance.exceptionHandler(e);
    });
  }
}
