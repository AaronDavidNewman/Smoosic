

// ## suiController
// ### Description:
// Manages DOM events and binds keyboard and mouse events
// to editor and menu commands, tracker and layout manager.
class suiController {

    constructor(params) {

        Vex.Merge(this, suiController.defaults);
        Vex.Merge(this, params);
        this.bindEvents();
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
        return [{
                event: "keydown",
                key: "=",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "transposeUp"
            }, {
                event: "keydown",
                key: "-",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "transposeDown"
            }, {
                event: "keydown",
                key: "=",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "upOctave"
            }, {
                event: "keydown",
                key: "-",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "downOctave"
            }, {
                event: "keydown",
                key: ".",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "doubleDuration"
            }, {
                event: "keydown",
                key: ",",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "halveDuration"
            }, {
                event: "keydown",
                key: ">",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "dotDuration"
            }, {
                event: "keydown",
                key: "<",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "undotDuration"
            }, {
                event: "keydown",
                key: "a",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "b",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "c",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "d",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "e",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "f",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "g",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "3",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "makeTuplet"
            },
            // interval commands
            {
                event: "keydown",
                key: "2",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "3",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "4",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "5",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "6",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "7",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "8",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "@",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "#",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "%",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "^",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "&",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "*",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "8",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "0",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "unmakeTuplet"
            }, {
                event: "keydown",
                key: "i",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "addMeasure"
            }
        ];
    }

    // ## trackerKeyBindingDefaults
    // ### Description:
    // Key bindings for the tracker.  The tracker is the 'cursor' in the music
    // that lets you select and edit notes.
    static get trackerKeyBindingDefaults() {
        return [{
                event: "keydown",
                key: "ArrowRight",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionRight"
            }, {
                event: "keydown",
                key: "ArrowRight",
                ctrlKey: false,
                altKey: true,
                shiftKey: false,
                action: "advanceModifierSelection"
            }, {
                event: "keydown",
                key: "ArrowLeft",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionLeft"
            }, {
                event: "keydown",
                key: "ArrowRight",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "growSelectionRight"
            }, {
                event: "keydown",
                key: "ArrowLeft",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "growSelectionLeft"
            }, {
                event: "keydown",
                key: "ArrowUp",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionUp"
            }, {
                event: "keydown",
                key: "ArrowDown",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionDown"
            }, {
                event: "keydown",
                key: "ArrowRight",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionRightMeasure"
            }, {
                event: "keydown",
                key: "ArrowLeft",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionLeftMeasure"
            }

        ]
    }

    static get defaults() {
        return {
            keyBind: suiController.keyBindingDefaults
        };
    }

    showModifierDialog(modSelection) {
		return SuiDialogFactory.createDialog(modSelection,this.tracker.context,this.tracker,this.layout) 
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

        if (evdata.key == '/') {
            window.removeEventListener("keydown", this.keydownHandler, true);
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

        window.addEventListener("keydown", this.keydownHandler, true);
    }

}
