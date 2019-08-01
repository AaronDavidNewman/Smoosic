

// ## suiController
// ## Description:
// Manages DOM events and binds keyboard and mouse events
// to editor and menu commands, tracker and layout manager.
class suiController {

	constructor(params) {
		Vex.Merge(this, suiController.defaults);
		Vex.Merge(this, params);
		this.bindEvents();
		this.undoBuffer = new UndoBuffer();
		this.pasteBuffer = this.tracker.pasteBuffer;
		this.editor.undoBuffer = this.undoBuffer;
		this.editor.pasteBuffer = this.pasteBuffer;
	}

	// ## createUi
	// ### Description:
	// Convenience constructor, taking a renderElement and a score.
	static createUi(renderElement, score) {
		var params = suiController.keyBindingDefaults;
		params.layout = suiSimpleLayout.createScoreLayout(renderElement, score);
		params.tracker = new suiTracker(params.layout);
		params.score = score;
		params.editor = new suiEditor(params);
		params.menus = new suiMenuManager(params);
		var controller = new suiController(params);
		return controller;
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
		SmoHelp.helpControls();		
		$('.controls button.help-button').off('click').on('click', function () {
    		window.removeEventListener("keydown", self.keydownHandler, true);
			SmoHelp.displayHelp();
			htmlHelpers.closeDialogPromise().then(rebind);
		});
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

	handleKeydown(evdata) {
		var self = this;
		var rebind = function () {
			self.render();
			self.bindEvents();
		}
		console.log("KeyboardEvent: key='" + event.key + "' | code='" +
			event.code + "'"
			 + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");
		event.preventDefault();

		if (evdata.key == '?') {
			window.removeEventListener("keydown", this.keydownHandler, true);
			SmoHelp.displayHelp();
			htmlHelpers.closeDialogPromise().then(rebind);
		}

		if (evdata.key == '/') {
			window.removeEventListener("keydown", this.keydownHandler, true);
			this.menuHelp();
			this.menuPromise = this.menus.slashMenuMode().then(rebind);
		}

		// TODO:  work dialogs into the scheme of things
		if (evdata.key == 'p') {
			var modSelection = this.tracker.getSelectedModifier();
			if (modSelection) {
				window.removeEventListener("keydown", this.keydownHandler, true);
				var dialog = this.showModifierDialog(modSelection);
				dialog.closeDialogPromise.then(rebind);
			}
			return;
		}

		var binding = this.keyBind.find((ev) =>
				ev.event === 'keydown' && ev.key === evdata.key && ev.ctrlKey === evdata.ctrlKey &&
				ev.altKey === evdata.altKey && evdata.shiftKey === ev.shiftKey);

		if (binding) {
			this[binding.module][binding.action](evdata);
		}
	}

	detach() {
		window.removeEventListener("keydown", this.keydownHandler, true);
		this.layout = null;
		this.tracker = null;
		this.editor = null;
	}

	render() {
		this.layout.render();
		this.tracker.updateMap();
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
			tracker.selectSuggestion();
		});

		this.keydownHandler = this.handleKeydown.bind(this);

		this.helpControls();

		window.addEventListener("keydown", this.keydownHandler, true);
	}

}
