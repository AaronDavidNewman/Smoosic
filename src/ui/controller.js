

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
		this.undoBuffer = new UndoBuffer();
		this.pasteBuffer = this.tracker.pasteBuffer;
		this.editor.undoBuffer = this.undoBuffer;
		this.editor.pasteBuffer = this.pasteBuffer;
		this.resizing = false;
		this.undoStatus=0;
		this.scrollRedrawStatus=0;
		this.trackScrolling = false;

		this.ribbon = new RibbonButtons({
				ribbons: defaultRibbonLayout.ribbons,
				ribbonButtons: defaultRibbonLayout.ribbonButtons,
				menus: this.menus,
				editor: this.editor,
				tracker: this.tracker,
				score: this.score,
				controller: this
			});

		// create globbal exception instance
		this.exhandler = new SuiExceptionHandler(this);

		this.bindEvents();
		this.bindResize();
		if (!suiSimpleLayout.debugLayout) {
			this.splash();
		    this.pollRedraw();
		}

		this.piano();
		this.updateOffsets();
	}
	
	// ### pollIdleRedraw
	// redraw after the user has been idle for some period
	pollIdleRedraw() {
		var self=this;
		setTimeout(function() {
			if (self.undoStatus == self.undoBuffer.opCount) {				
				self.resizeEvent();
				self.pollRedraw();
				return;
			}
			self.undoStatus = self.undoBuffer.opCount;
			self.pollIdleRedraw();
		},5000);
	}
	
	static get scrollable() {
		return '.musicRelief';
	}
	
	// ### pollRedraw
	// if anything has changed over some period, prepare to redraw everything.
	pollRedraw() {
		var self=this;
		setTimeout(function() {
			if (self.undoStatus != self.undoBuffer.opCount || self.scrollRedrawStatus) {
				self.scrollRedrawStatus = false;
				self.undoStatus = self.undoBuffer.opCount;
				self.pollIdleRedraw();
			}
			self.pollRedraw();
		},1000);
	}

	splash() {
		var b = htmlHelpers.buildDom;
		var r = b('div').classes('bug-modal').append(
				b('img').attr('src', '../styles/images/logo.png').classes('splash-logo'))
			.append(b('button').classes('icon icon-cross bug-dismiss-button'))
			.append(b('span').classes('splash-title').text('Sm'))
			.append(b('span').classes('splash-shine').text('ooooooooo'))
			.append(b('span').classes('splash-title').text('sic'));
		$('.bugDialog').append(r.dom());
		$('body').addClass('splashScreen modal');
		setTimeout(function () {
			$('body').removeClass('splashScreen modal');
		}, 1000);
	}
	piano() {
		this.piano = new suiPiano({elementId:'piano-svg'});
	}
	updateOffsets() {
		// the 100 is for the control offsets
		var padding =  Math.round((this.layout.screenWidth-this.layout.pageWidth)/2)-100;
		$('.workspace-container').css('padding-left',''+padding+'px');
		
		// Keep track of the scroll bar so we can adjust the map
		this.scrollPosition = $('body')[0].scrollTop;
	}
	resizeEvent() {
		var self = this;
		var remap = function () {
			return self.tracker.updateMap();
		}
		if (this.resizing)
			return;
		this.resizing = true;
		setTimeout(function () {
			console.log('resizing');
			self.resizing = false;
			self.layout.setViewport(true);
			$('.musicRelief').height(window.innerHeight - $('.musicRelief').offset().top);
			self.piano.handleResize();
			self.updateOffsets();
			self.layout.redraw().then(remap);
			
		}, 500);
	}
	
	// No action at present when cursor selection changes
	trackerChangeEvent() {
		
	}
	
	// If the user has selected a modifier via the mouse/touch, bring up mod dialog
	// for that modifier
	trackerModifierSelect() {
		var modSelection = this.tracker.getSelectedModifier();
		if (modSelection) {
			window.removeEventListener("keydown", this.keydownHandler, true);
			var dialog = this.showModifierDialog(modSelection);
			this.unbindKeyboardForDialog(dialog);
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
		$(suiController.scrollable).height(window.innerHeight - $('.musicRelief').offset().top);
		
		window.addEventListener('resize', function () {
			self.resizeEvent();
		});
				
		let scrollCallback = (el) => {
			if (self.trackScrolling) {
				return;
			}
			self.trackScrolling = true;
			setTimeout(function() {
				// self.scrollRedrawStatus = true;
				self.trackScrolling = false;
				self.tracker.updateMap();
			},500);
		};
		el.onscroll = scrollCallback;
	}
	
	static createDom() {
		 var b = htmlHelpers.buildDom;
		 var r=b('div').classes('dom-container')
			 .append(b('div').classes('modes'))
			 .append(b('div').classes('overlay'))
			 .append(b('div').classes('draganime hide'))
			 .append(b('div').classes('attributeDialog'))
			 .append(b('div').classes('helpDialog'))
			 .append(b('div').classes('bugDialog'))
			 .append(b('div').classes('menuContainer'))
			 .append(b('h1').classes('testTitle').text('Smoosic'))
			 .append(b('div').classes('piano-container')
			     .append(b('div').classes('piano-keys')))
		     .append(b('div').classes('workspace-container')
			    .append(b('div').classes('workspace')
				    .append(b('div').classes('controls-top'))
					.append(b('div').classes('controls-left'))
					.append(b('div').classes('musicRelief')
					   .append(b('div').classes('musicContainer').attr('id','boo')))));
	    $('#smoo').append(r.dom());
		var pianoDom=$('.piano-keys')[0];
		var svg=document.createElementNS(svgHelpers.namespace,'svg');
		svg.id='piano-svg';
		svg.setAttributeNS('','width',''+suiPiano.owidth*suiPiano.dimensions.octaves);
		svg.setAttributeNS('','height',''+suiPiano.dimensions.wheight);
		svg.setAttributeNS('','viewBox','0 0 '+suiPiano.owidth*suiPiano.dimensions.octaves+' '+suiPiano.dimensions.wheight);
		pianoDom.appendChild(svg);
	}

	// ## createUi
	// ### Description:
	// Convenience constructor, taking a renderElement and a score.
	static createUi(score) {
		suiController.createDom();
		var params = suiController.keyBindingDefaults;
		params.layout = suiSimpleLayout.createScoreLayout(document.getElementById("boo"), score);
		params.tracker = new suiTracker(params.layout);
		params.score = score;
		params.editor = new suiEditor(params);
		params.menus = new suiMenuManager(params);
		var controller = new suiController(params);
		return controller;
	}
	
	static createDebugUi(score) {
		suiController.createDom();
		var params = suiController.keyBindingDefaults;
		params.layout = suiSimpleLayout.createScoreLayout(document.getElementById("boo"), score);
		suiSimpleLayout.debugLayout=true;
		params.tracker = new suiTracker(params.layout);
		params.score = score;
		params.editor = new suiEditor(params);
		params.menus = new suiMenuManager(params);
		var controller = new suiController(params);
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
		var remap = function () {
			return controller.tracker.updateMap();
		}
		controller.layout.render().then(remap);

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
			self.render();
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
		return SuiDialogFactory.createDialog(modSelection, this.tracker.context, this.tracker, this.layout)
	}
	
	unbindKeyboardForDialog(dialog) {
		var self=this;
		var rebind = function () {
			self.render();
			self.bindEvents();
		}
		window.removeEventListener("keydown", this.keydownHandler, true);
		dialog.closeDialogPromise.then(rebind);		
	}

	handleKeydown(evdata) {
		var self = this;

		console.log("KeyboardEvent: key='" + event.key + "' | code='" +
			event.code + "'"
			 + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");
		event.preventDefault();

		if (evdata.key == '?') {
			SmoHelp.displayHelp();
		}

		if (evdata.key == '/') {
			window.removeEventListener("keydown", this.keydownHandler, true);
			this.menuHelp();
			var rebind = function () {
				self.render();
				self.bindEvents();
            }
			this.menuPromise = this.menus.slashMenuMode().then(rebind);
		}

		// TODO:  work dialogs into the scheme of things
		if (evdata.key == 'p') {
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

	render() {
		var controller = this;
		var remap = function () {
			return controller.tracker.updateMap();
		}
		this.layout.render().then(remap);
	}

	bindEvents() {
		var self = this;
		var tracker = this.tracker;
		$(this.renderElement).off('mousemove').on('mousemove', function (ev) {
			tracker.intersectingArtifact({
				x: ev.clientX,
				y: ev.clientY
			});
		});

		$(this.renderElement).off('click').on('click', function (ev) {
			tracker.selectSuggestion(ev);
		});
		$('body').off('smo-piano-key').on('smo-piano-key',function(ev,obj) {
			obj=obj.selections;
			self.tracker.selections.forEach((sel) => {
				SmoOperation.addPitch(sel,obj);
				// sel.note.pitches=JSON.parse(JSON.stringify(obj));
			});
			self.render();
		});
		$('body').off('tracker-selection').on('tracker-selection',function(ev) {
			self.trackerChangeEvent(ev);
		});
				
		$('body').off('tracker-select-modifier').on('tracker-select-modifier',function(ev) {
			self.trackerModifierSelect(ev);
		});

		this.keydownHandler = this.handleKeydown.bind(this);

		this.helpControls();

		window.addEventListener("keydown", this.keydownHandler, true);
		this.ribbon.display();

		window.addEventListener('error', function (e) {
			SuiExceptionHandler.instance.exceptionHandler(e);
		});
	}

}
