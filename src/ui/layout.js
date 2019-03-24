
// ## smrfSimpleLayout
// ## Description:
// A layout maps the measures and notes to a spot on the page.  Simple layout
// maps the music linearly in a single line, like a lead sheet.
class smrfSimpleLayout {
    constructor(params) {
        Vex.Merge(this, smrfSimpleLayout.defaults);
        Vex.Merge(this, params);
        $(this.elementId).html('');
        this.renderer = new VF.Renderer(this.elementId, VF.Renderer.Backends.SVG);
        this.renderer.resize(this.pageWidth, this.pageHeight);
        this.context.setFont(this.font.typeface, this.font.pointSize, "").setBackgroundFillStyle(this.font.fillStyle);
        this.attrs = {
            id: VF.Element.newID(),
            type: 'testLayout'
        };
    }
    static createScoreLayout(renderElement, score, layoutParams) {
        var ctorObj = {
            elementId: renderElement,
            score: score
        };
        if (layoutParams) {
            Vex.Merge(ctorObj, layoutParams);
        }
        var layout = new smrfSimpleLayout(ctorObj);
        return layout;
    }
    static get defaults() {
        return {
            staffX: 10,
            staffY: 40,
            clefWidth: 70,
            staffWidth: 250,
            totalWidth: 250,
            leftMargin: 15,
            topMargin: 15,
            pageWidth: 8 * 96 + 48,
            pageHeight: 11 * 96,
            font: {
                typeface: "Arial",
                pointSize: 10,
                fillStyle: '#eed'
            }
        };
    }
    get context() {
        return this.renderer.getContext();
    }
    get renderElement() {
        return this.renderer.elementId;
    }
    render() {
        this.layout();
    }
    unrender() {}

    get width() {}

    layout() {
        var nextYOffset = 0;
        var yoffset = 0;
        var factory = new VF.Factory({
                renderer: this.renderer
            });
        var system = null;
        var connectors = [null, null];

        for (var i = 0; i < this.score.staves.length; ++i) {
            var start = this.staffX;
            var staff = this.score.staves[i];
            yoffset = yoffset + nextYOffset;
            nextYOffset = 0;
            for (var j = 0; j < staff.measures.length; ++j) {
                var measure = staff.measures[j];
                measure.staffY = staff.staffY + (this.score.interGap * i) + yoffset;
                if (measure.measureNumber.systemIndex === 0) {
                    measure.forceClef = true;
                }
                measure.staffX = start;
                measure.staffWidth = measure.forceClef ? this.clefWidth + this.staffWidth : this.staffWidth;
                measure.noteWidth = this.staffWidth;
                start += measure.staffWidth;
                smoModifierFactory.applyModifiers(measure);
                var vxMeasure = new VxMeasure(this.context, {
                        smoMeasure: measure
                    });
                vxMeasure.render();
                if (measure.measureNumber.systemIndex === 0) {
                    if (i === 0) {
                        connectors[0] = vxMeasure.stave;
                    } else {
                        connectors[1] = vxMeasure.stave;
                    }
                }
                nextYOffset = (nextYOffset > measure.renderedSize.height ? nextYOffset : measure.renderedSize.height);
            }

        }

        if (connectors[0] && connectors[1]) {
            new VF.StaveConnector(connectors[0], connectors[1]).
            setType(VF.StaveConnector.type.SINGLE_LEFT).
            setContext(this.context).draw();
        }
    }
}
