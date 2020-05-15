

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
		this.undoBuffer = new UndoBuffer();
		this.pasteBuffer = this.tracker.pasteBuffer;
    this.tracker.setDialogModifier(this);
		this.editor.controller = this;
		this.editor.undoBuffer = this.undoBuffer;
		this.editor.pasteBuffer = this.pasteBuffer;
		this.resizing = false;
		this.undoStatus=0;
		this.trackScrolling = false;
        this.keyboardActive = false;

		this.ribbon = new RibbonButtons({
				ribbons: defaultRibbonLayout.ribbons,
				ribbonButtons: defaultRibbonLayout.ribbonButtons,
				menus: this.menus,
				editor: this.editor,
				tracker: this.tracker,
				score: this.score,
				controller: this
			});

        this.menus.setController(this);

		// create globbal exception instance
		this.exhandler = new SuiExceptionHandler(this);

		this.bindEvents();

        // Only display the ribbon one time b/c it's expensive operation
        this.ribbon.display();
		this.bindResize();
        this.layoutDemon.undoBuffer = this.undoBuffer;
        this.layoutDemon.startDemon();

		this.createPiano();
		this.updateOffsets();
	}

	static get scrollable() {
		return '.musicRelief';
	}

	get isLayoutQuiet() {
		return ((this.layout.passState == suiLayoutBase.passStates.clean && this.layout.dirty == false)
		   || this.layout.passState == suiLayoutBase.passStates.replace);
	}

	handleScrollEvent(ev) {
		var self=this;
		if (self.trackScrolling) {
				return;
		}
		self.trackScrolling = true;
		setTimeout(function() {
            try {
		    // wait until redraw is done to track scroll events.
			self.trackScrolling = false;

			// self.scrollRedrawStatus = true;
            // self.tracker.updateMap(true);
            // Thisi s a WIP...
			self.scroller.handleScroll($(suiController.scrollable)[0].scrollLeft,$(suiController.scrollable)[0].scrollTop);
            } catch(e) {
                SuiExceptionHandler.instance.exceptionHandler(e);
            }
		},500);
	}

	createPiano() {
		this.piano = new suiPiano({elementId:'piano-svg',tracker:this.tracker,undo:this.undoBuffer});
        // $('.close-piano').click();
	}
	updateOffsets() {
		// the 100 is for the control offsets
		var padding =  Math.round((this.layout.screenWidth-this.layout.pageWidth)/2)-100;
		$('.workspace-container').css('padding-left',''+padding+'px');

		// Keep track of the scroll bar so we can adjust the map
		// this.scrollPosition = $('body')[0].scrollTop;
	}
	resizeEvent() {
		var self = this;
		if (this.resizing)
			return;
		this.resizing = true;
		setTimeout(function () {
			console.log('resizing');
			self.resizing = false;
			$('.musicRelief').height(window.innerHeight - $('.musicRelief').offset().top);
			self.piano.handleResize();
			self.updateOffsets();

		}, 500);
	}

  createModifierDialog(modifier) {
    this.idleLayoutTimer = Date.now();
    this.unbindKeyboardForModal(SuiDialogFactory.createDialog(modifier, this.tracker.context, this.tracker, this.layout,this.undoBuffer,this));
  }

	// If the user has selected a modifier via the mouse/touch, bring up mod dialog
	// for that modifier
	trackerModifierSelect(ev) {
    this.idleLayoutTimer = Date.now();
		var modSelection = this.tracker.getSelectedModifier();
		if (modSelection) {
			var dialog = this.showModifierDialog(modSelection);
        if (dialog) {
          this.tracker.selectSuggestion(ev);
    	    this.unbindKeyboardForModal(dialog);
        } else {
          this.tracker.advanceModifierSelection(ev);
        }
		} else {
      this.tracker.selectSuggestion(ev);
    }
		return;
	}

    // ### bindResize
	// This handles both resizing of the music area (scrolling) and resizing of the window.
	// The latter results in a redraw, the former just resets the client/logical map of elements
	// in the tracker.
	bindResize() {
		var self = this;
		var el = $(suiController.scrollable)[0];
		// unit test programs don't have resize html
		if (!el) {
			return;
		}
		$(suiController.scrollable).height(window.innerHeight - $('.musicRelief').offset().top);

		window.addEventListener('resize', function () {
			self.resizeEvent();
		});

		let scrollCallback = (ev) => {
            self.handleScrollEvent(ev);
		};
		el.onscroll = scrollCallback;
	}

	// ## createUi
	// ### Description:
	// Convenience constructor, taking a renderElement and a score.
	static createUi(score,title) {
		SuiDom.createDom(title);
		var params = suiController.keyBindingDefaults;
    var score = SuiDom.scoreFromQueryString();
		params.layout = suiScoreLayout.createScoreLayout(document.getElementById("boo"), document.getElementById("booShadow"),score);
        params.scroller = new suiScroller();
		params.tracker = new suiTracker(params.layout,params.scroller);
    params.layout.setMeasureMapper(params.tracker);
		params.editor = new suiEditor(params);
		params.menus = new suiMenuManager(params);
        params.layoutDemon = new SuiLayoutDemon(params);
		var controller = new suiController(params);
        params.layout.score = score;
    SuiDom.splash();
		return controller;
	}

	static createDebugUi(score) {
    SuiDom.createDom(title);
		var params = suiController.keyBindingDefaults;
		params.layout = suiScoreLayout.createScoreLayout(document.getElementById("boo"), document.getElementById("booShadow"), score);
		layoutDebug.setAll();
    params.scroller = new suiScroller();
		params.tracker = new suiTracker(params.layout,params.scroller);
		params.editor = new suiEditor(params);
		params.menus = new suiMenuManager(params);
    params.layoutDemon = new SuiLayoutDemon(params);
		var controller = new suiController(params);
    var score = SmoScore.deserialize(basicJson);
    params.layout.score = score;
		return controller;
	}

	static start(debug) {
		var score = SmoScore.getEmptyScore();
		score.addDefaultMeasureWithNotes(0, {});
		if (!debug) {
  		score.addDefaultMeasureWithNotes(1, {});
  		score.addDefaultMeasureWithNotes(2, {});
  		score.addDefaultMeasureWithNotes(3, {});
  		score.addDefaultMeasureWithNotes(4, {});
  		score.addStaff();
		}

		var controller = debug ? suiController.createDebugUi(score) : suiController.createUi(score);
	}

	// ### renderElement
	// return render element that is the DOM parent of the svg
	get renderElement() {
		return this.layout.renderElement;
	}

	// ## keyBindingDefaults
	// ### Description:
	// Different applications can create their own key bindings, these are the defaults.
	// Many editor commands can be reached by a single keystroke.  For more advanced things there
	// are menus.
	static get keyBindingDefaults() {
		var editorKeys = suiController.editorKeyBindingDefaults;
		editorKeys.forEach((key) => {
			key.module = 'editor'
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
		/* SmoHelp.helpControls();
		$('.controls-left button.help-button').off('click').on('click', function () {
		window.removeEventListener("keydown", self.keydownHandler, true);
		SmoHelp.displayHelp();
		htmlHelpers.closeDialogPromise().then(rebind);
		});   */
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
		SmoHelp.modeControls();
	}

	static get defaults() {
		return {
			keyBind: suiController.keyBindingDefaults
		};
	}

	showModifierDialog(modSelection) {
		return SuiDialogFactory.createDialog(modSelection, this.tracker.context, this.tracker, this.layout,this.undoBuffer,this)
	}

	unbindKeyboardForModal(dialog) {
		var self=this;
		var rebind = function () {
			self.bindEvents();
		}
		window.removeEventListener("keydown", this.keydownHandler, true);
    this.keyboardActive = false;
		dialog.closeModalPromise.then(rebind);
	}

	handleKeydown(evdata) {
		var self = this;

		console.log("KeyboardEvent: key='" + evdata.key + "' | code='" +
			evdata.code + "'"
			 + " shift='" + evdata.shiftKey + "' control='" + evdata.ctrlKey + "'" + " alt='" + evdata.altKey + "'");
		evdata.preventDefault();

		if (evdata.key == '?') {
			SmoHelp.displayHelp();
		}

		if (evdata.key == '/') {
      // set up menu DOM.
			this.menuHelp();
      this.menus.slashMenuMode(this);
      this.unbindKeyboardForModal(this.menus);
		}

		// TODO:  work dialogs into the scheme of things
		if (evdata.key == 'Enter') {
			self.trackerModifierSelect(evdata);
		}

		var binding = this.keyBind.find((ev) =>
				ev.event === 'keydown' && ev.key === evdata.key && ev.ctrlKey === evdata.ctrlKey &&
				ev.altKey === evdata.altKey && evdata.shiftKey === ev.shiftKey);

		if (binding) {
			try {
			this[binding.module][binding.action](evdata);
			} catch (e) {
				this.exhandler.exceptionHandler(e);
			}
		}
	}

	detach() {
		window.removeEventListener("keydown", this.keydownHandler, true);
		/* this.layout = null;
		this.tracker = null;
		this.editor = null;  */
	}


	bindEvents() {
		var self = this;
		var tracker = this.tracker;
        if (this.keyboardActive) {
            return; // already bound.
        }
        this.keyboardActive = true;

		$('body').off('redrawScore').on('redrawScore',function() {
			self.handleRedrawTimer();
		});
		$('body').off('forceScrollEvent').on('forceScrollEvent',function() {
			self.handleScrollEvent();
		});
		$('body').off('forceResizeEvent').on('forceResizeEvent',function() {
			self.resizeEvent();
		});

		$(this.renderElement).off('mousemove').on('mousemove', function (ev) {
			tracker.intersectingArtifact({
				x: ev.clientX,
				y: ev.clientY
			});
		});

		$(this.renderElement).off('click').on('click', function (ev) {
			tracker.selectSuggestion(ev);
		});

		this.keydownHandler = this.handleKeydown.bind(this);

		this.helpControls();

		window.addEventListener("keydown", this.keydownHandler, true);

		window.addEventListener('error', function (e) {
			SuiExceptionHandler.instance.exceptionHandler(e);
		});
	}

}
