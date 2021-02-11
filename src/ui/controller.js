

// ## suiController
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
class suiController {

  constructor(params) {
    Vex.Merge(this, suiController.defaults);
    Vex.Merge(this, params);
    window.suiControllerInstance = this;

    this.view = params.view;
    this.eventSource = params.eventSource;
    this.view.tracker.setDialogModifier(this);
    this.tracker = this.view.tracker; // needed for key event handling
    this.keyCommands.controller = this;
    this.keyCommands.view = this.view;
    this.resizing = false;
    this.undoStatus=0;
    this.trackScrolling = false;

    this.keyHandlerObj = null;

    this.ribbon = new RibbonButtons({
      ribbons: defaultRibbonLayout.ribbons,
      ribbonButtons: defaultRibbonLayout.ribbonButtons,
      menus: this.menus,
      controller: this,
      keyCommands: this.keyCommands,
      view: this.view,
      eventSource:this.eventSource
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

  static get keyboardWidget() {
    return suiController._kbWidget;
  }

  static set keyboardWidget(value) {
    suiController._kbWidget = value;
    if (suiController._kbWidget) {
      Qwerty.displayKb();
    }
  }

  get isLayoutQuiet() {
    return ((this.view.renderer.passState == SuiRenderState.passStates.clean && this.renderer.layout.dirty == false)
       || this.view.renderer.passState == SuiRenderState.passStates.replace);
  }

  handleScrollEvent(ev) {
    const self = this;
    if (self.trackScrolling) {
        return;
    }
    self.trackScrolling = true;
    setTimeout(function() {
      try {
        // wait until redraw is done to track scroll events.
        self.trackScrolling = false;
          // Thisi s a WIP...
        self.view.tracker.scroller.handleScroll($(suiController.scrollable)[0].scrollLeft, $(suiController.scrollable)[0].scrollTop);
      } catch(e) {
        SuiExceptionHandler.instance.exceptionHandler(e);
      }
    },500);
  }

  createPiano() {
    this.piano = new suiPiano(
    {
      elementId:'piano-svg',
      ribbons: defaultRibbonLayout.ribbons,
      ribbonButtons: defaultRibbonLayout.ribbonButtons,
      menus: this.menus,
      keyCommands: this.keyCommands,
      controller: this,
      view: this.view,
      eventSource:this.eventSource
    });
        // $('.close-piano').click();
  }
  _setMusicDimensions() {
    $('.musicRelief').height(window.innerHeight - $('.musicRelief').offset().top);
  }
  resizeEvent() {
    var self = this;
    if (this.resizing) {
      return;
    }
    if ($('body').hasClass('printing')) {
      return;
    }
    this.resizing = true;
    setTimeout(function () {
      console.log('resizing');
      self.resizing = false;
      self._setMusicDimensions();
      self.piano.handleResize();
    }, 500);
  }

  createModifierDialog(modifierSelection) {
    var parameters = {
      modifier: modifierSelection.modifier,
        view: this.view, eventSource:this.eventSource,
         completeNotifier:this, keyCommands:this.keyCommands
    }
    return SuiModifierDialogFactory.createDialog(modifierSelection.modifier, parameters);
  }

  // If the user has selected a modifier via the mouse/touch, bring up mod dialog
  // for that modifier
  trackerModifierSelect(ev) {
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
    const el = $(suiController.scrollable)[0];
    // unit test programs don't have resize html
    if (!el) {
      return;
    }
    this._setMusicDimensions();
    // $(suiController.scrollable).height(window.innerHeight - $('.musicRelief').offset().top);

    window.addEventListener('resize', function () {
      self.resizeEvent();
    });

    let scrollCallback = (ev) => {
      self.handleScrollEvent(ev);
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
  static get keyBindingDefaults() {
    var editorKeys = suiController.editorKeyBindingDefaults;
    editorKeys.forEach((key) => {
      key.module = 'keyCommands'
    });
    var trackerKeys = suiController.trackerKeyBindingDefaults;
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
  static set reentry(value) {
    suiController._reentry = value;
  }
  static get reentry() {
    if (typeof(suiController['_reentry']) == 'undefined') {
      suiController._reentry = false;
    }
    return suiController._reentry;
  }

  menuHelp() {
    SmoHelp.displayHelp();
  }

  static get defaults() {
    return {
      keyBind: suiController.keyBindingDefaults
    };
  }

  showModifierDialog(modSelection) {
    return SuiDialogFactory.createDialog(modSelection, this.view, this)
  }

  // ### unbindKeyboardForModal
  // Global events from keyboard and pointer are handled by this object.  Modal
  // UI elements take over the events, and then let the controller know when
  // the modals go away.
  unbindKeyboardForModal(dialog) {
    const self = this;
    layoutDebug.addDialogDebug('controller: unbindKeyboardForModal')
    const rebind = () => {
      self.bindEvents();
      layoutDebug.addDialogDebug('controller: unbindKeyboardForModal resolve')
    }
    this.eventSource.unbindKeydownHandler(this.keydownHandler);
    this.eventSource.unbindMouseMoveHandler(this.mouseMoveHandler);
    this.eventSource.unbindMouseClickHandler(this.mouseClickHandler);

    dialog.closeModalPromise.then(rebind);
  }

  evKey(evdata) {
    if ($('body').hasClass('translation-mode')) {
      return;
    }

    console.log("KeyboardEvent: key='" + evdata.key + "' | code='" +
      evdata.code + "'"
       + " shift='" + evdata.shiftKey + "' control='" + evdata.ctrlKey + "'" + " alt='" + evdata.altKey + "'");
    evdata.preventDefault();

    if (suiController.keyboardWidget) {
      Qwerty.handleKeyEvent(evdata);
    }
    const dataCopy = suiTracker.serializeEvent(evdata);
    this.view.renderer.updatePromise().then(() => {
      if (dataCopy.key == '?') {
        SmoHelp.displayHelp();
      }

      if (dataCopy.key == '/') {
        // set up menu DOM.
        this.menus.slashMenuMode(this);
      }

      if (dataCopy.key == 'Enter') {
        this.trackerModifierSelect(dataCopy);
      }

      var binding = this.keyBind.find((ev) =>
        ev.event === 'keydown' && ev.key === dataCopy.key &&
        ev.ctrlKey === dataCopy.ctrlKey &&
        ev.altKey === dataCopy.altKey && dataCopy.shiftKey === ev.shiftKey);

      if (binding) {
        try {
          this[binding.module][binding.action](dataCopy);
        } catch (e) {
          if (typeof(e) === 'string') {
            console.error(e);
          }
          this.exhandler.exceptionHandler(e);
        }
      }
    });
  }

  mouseMove(ev) {
    this.view.tracker.intersectingArtifact({
      x: ev.clientX,
      y: ev.clientY
    });
  }

  mouseClick(ev) {
    const dataCopy = suiTracker.serializeEvent(ev);
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

    $('body').off('redrawScore').on('redrawScore', function() {
      self.handleRedrawTimer();
    });
    $('body').off('forceScrollEvent').on('forceScrollEvent', function() {
      self.handleScrollEvent();
    });
    $('body').off('forceResizeEvent').on('forceResizeEvent', function() {
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
