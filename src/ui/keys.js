

class suiKeys {

    constructor(params) {

        Vex.Merge(this, suiKeys.defaults);
        Vex.Merge(this, params);
        this.bindEvents();
    }

    get renderElement() {
        return this.layout.renderElement;
    }
    static get keyBindingDefaults() {
        return [{
                event: "keydown",
                key: "ArrowRight",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionRight"
            }, {
                event: "keydown",
                key: "ArrowLeft",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionLeft"
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
            }
        ]
    }

    static get defaults() {
        return {
            keybind: suiKeys.keyBindingDefaults
        };
    }

    keyboardHandler(evname, evdata) {
        var binding = this.keybind.find((ev) =>
                ev.event === evname && ev.key === evdata.key && ev.ctrlKey === evdata.ctrlKey &&
                ev.altKey === evdata.altKey && evdata.shiftKey === ev.shiftKey);

        if (binding) {
            this.tracker[binding.action](evdata);
        }
    }
    bindEvents() {
		var self=this;
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

        window.addEventListener("keydown", function (event) {
            self.keyboardHandler('keydown', event);
            console.log("KeyboardEvent: key='" + event.key + "' | code='" +
                event.code + "'"
                 + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");
        }, true);
    }

}
