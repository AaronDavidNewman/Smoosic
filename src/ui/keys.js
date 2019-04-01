

class suiKeys {

    constructor(params) {

        Vex.Merge(this, suiKeys.defaults);
        Vex.Merge(this, params);
        this.bindEvents();
    }
	
	static createUi(renderElement,score) {
		var params=suiKeys.keyBindingDefaults;
		params.layout = suiSimpleLayout.createScoreLayout(renderElement, score);
		params.tracker = new suiTracker(params.layout);
		params.score=score;
		params.editor = new suiEditor(params);
		var keys = new suiKeys(params);
		return keys;
	}

    get renderElement() {
        return this.layout.renderElement;
    }
	static get keyBindingDefaults() {
		var editorKeys = suiKeys.editorKeyBindingDefaults;
		editorKeys.forEach((key) => {key.module='editor'});
		var trackerKeys = suiKeys.trackerKeyBindingDefaults;
		trackerKeys.forEach((key)=>{key.module='tracker'});
		return trackerKeys.concat(editorKeys);
	}
	static get editorKeyBindingDefaults() {
		return [
		 {
                event: "keydown",
                key: "=",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "transposeUp"
            },{
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
            },{
                event: "keydown",
                key: "-",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "downOctave"
            },
			 {
                event: "keydown",
                key: ">",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "doubleDuration"
            },
			{
                event: "keydown",
                key: "a",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            },
			{
                event: "keydown",
                key: "b",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            },
			{
                event: "keydown",
                key: "c",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            },
			{
                event: "keydown",
                key: "d",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            },
			{
                event: "keydown",
                key: "e",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            },
			{
                event: "keydown",
                key: "f",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            },
			{
                event: "keydown",
                key: "g",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }
		];
	}
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
                key: "ArrowLeft",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionLeft"
            },{
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
            },
			{
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
            keyBind: suiKeys.keyBindingDefaults
        };
    }

    keyboardHandler(evname, evdata) {
        var binding = this.keyBind.find((ev) =>
                ev.event === evname && ev.key === evdata.key && ev.ctrlKey === evdata.ctrlKey &&
                ev.altKey === evdata.altKey && evdata.shiftKey === ev.shiftKey);

        if (binding) {
            this[binding.module][binding.action](evdata);
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
				 event.preventDefault();
        }, true);
    }

}
