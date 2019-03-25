
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

    get pageMarginWidth() {
		return this.pageWidth - this.leftMargin*2;
	}
	

    layout() {
        if (!this.score.staves.length) {
            return;
        }
        var startX = this.leftMargin;
        var topStaff = this.score.staves[0];
        if (!topStaff.measures.length) {
            return;
        }
        var system = new VxSystem(this.context);
        var ycoord = topStaff.measures[0].staffY;
        var systemIndex = 0;
        for (var i = 0; i < topStaff.measures.length; ++i) {
            var staffWidth = 0;
            for (var j = 0; j < this.score.staves.length; ++j) {
                var staff = this.score.staves[j];
                var measure = staff.measures[i];

				if (startX+measure.staffWidth > this.pageMarginWidth) {
					system.cap();
					ycoord += system.box.height + this.score.interGap;
					measure.staffY=ycoord;
					startX = measure.staffX = this.leftMargin;
					system = new VxSystem(this.context);
					systemIndex = 0;
				}				
                if (systemIndex === 0) {
                    measure.forceClef = true;
                }
                measure.staffX = startX;
                measure.staffY = ycoord;
                if (measure.forceClef) {
                    measure.staffWidth += this.clefWidth;
                }
                measure.measureNumber.systemIndex = systemIndex;
                smoModifierFactory.applyModifiers(measure);
                system.renderMeasure(j, measure);
                ycoord = system.currentY;
            }
            ++systemIndex;
            startX = system.box.width + system.box.x - 1;
            ycoord = topStaff.measures[0].staffY;
        }
        system.cap();
    }
}
