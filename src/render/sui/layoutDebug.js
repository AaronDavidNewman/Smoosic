
class layoutDebug {
    static get values() {
        return {
            pre:1,
            post:2,
            adjust:4,
            system:8,
            note:16,
            adjustHeight:32,
            measureHistory:64,
            textEditorHistory:128
        }
    }

    static get classes() {
        return {
            pre:'measure-place-dbg',
            post:'measure-render-dbg',
            adjust:'measure-adjust-dbg',
            system:'system-place-dbg',
            note:'measure-note-dbg',
            adjustHeight:'measure-adjustHeight-dbg',
            measureHistory:'',
            textEditorHistory:''
        }
    }

	static get mask() {
        if (typeof(layoutDebug._flags) == 'undefined') {
            layoutDebug._flags = 0;
        }
        return layoutDebug._flags;
	}

    static set mask(value) {
        layoutDebug._flags = value;
    }

    static flagSet(value) {
        return layoutDebug.mask & layoutDebug.values[value];
    }

    static clearAll(svg) {
        layoutDebug._flags = 0;
    }
    static setAll() {
        layoutDebug._flags = 1+2+4+8+16+32+64+128;
    }
    static clearDebugBoxes(value) {
        if (layoutDebug.flagSet(value)) {
            var selector = 'g.'+layoutDebug.classes[value];
            $(selector).remove();
        }
    }
    static debugBox(svg,box,flag) {
        if (!box) {
            return;
        }
        if (!box.height) {
            box.height=1;
        }
        if (layoutDebug.flagSet(flag)) {
            svgHelpers.debugBox(svg, box, layoutDebug.classes[flag]);
        }
    }
    static clearFlag(value) {
        clearFlagSvg(value);

        var flag = layoutDebug.values[value];
        if (typeof(layoutDebug._flags) == 'undefined') {
            layoutDebug._flags = 0;
        }
        layoutDebug._flags = layoutDebug._flags & (~flag);
    }

	static setFlag(value) {
        var flag = layoutDebug.values[value];
        if (typeof(layoutDebug._flags) == 'undefined') {
            layoutDebug._flags = flag;
            return;
        }
        layoutDebug._flags |= flag;
	}

    static get textDebug() {
        if (!layoutDebug['_textDebug']) {
            layoutDebug['_textDebug'] = [];
        }
        return layoutDebug['_textDebug']
    }

    static addTextDebug(value) {
        if (!layoutDebug.mask & layoutDebug.textEditorHistory) {
            return;
        }
        if (!layoutDebug['_textDebug']) {
            layoutDebug['_textDebug'] = [];
        }
        layoutDebug['_textDebug'].push(value);
        console.log(value);
    }

    static measureHistory(measure,oldVal,newVal,description) {
        if (layoutDebug.flagSet('measureHistory')) {
            var oldExp = (typeof(measure.svg[oldVal]) == 'object') ? JSON.stringify(measure.svg[oldVal]).replace(/"/g,'') : measure.svg[oldVal];
            var newExp = (typeof(newVal) == 'object') ? JSON.stringify(newVal).replace(/"/g,'') : newVal;
            measure.svg.history.push(oldVal + ': '+oldExp +'=> '+newExp + ' ' + description);
        }
    }
}
