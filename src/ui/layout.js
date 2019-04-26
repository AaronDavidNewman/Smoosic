
// ## smrfSimpleLayout
// ## Description:
// A layout maps the measures and notes to a spot on the page.  It
// manages the flow of music as an ordinary score.
class suiSimpleLayout {
    constructor(params) {
        Vex.Merge(this, suiSimpleLayout.defaults);
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
        var layout = new suiSimpleLayout(ctorObj);
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
        // layout a second time to adjust for issues.
        this.layout();
    }
    unrender() {}

    get pageMarginWidth() {
        return this.pageWidth - this.leftMargin * 2;
    }
    _previousAttr(i, j, attr) {
        var staff = this.score.staves[j];
        var measure = staff.measures[i];
        return (i > 0 ? staff.measures[i - 1][attr] : measure[attr]);
    }

    layout() {
        // bounding box of all artifacts on the page
        var pageBox = {};
        // bounding box of all artifacts in a system
        var systemBoxes = {};
        var staffBoxes = {};
        if (!this.score.staves.length) {
            return;
        }
        var topStaff = this.score.staves[0];
        if (!topStaff.measures.length) {
            return;
        }
        var system = new VxSystem(this.context, topStaff.measures[0].staffY);
        var systemIndex = 0;
        var lineIndex = 0;
        for (var i = 0; i < topStaff.measures.length; ++i) {
            var staffWidth = 0;
            for (var j = 0; j < this.score.staves.length; ++j) {
                var staff = this.score.staves[j];
                var measure = staff.measures[i];
				measure.measureNumber.systemIndex=j;
                if (!staffBoxes[j]) {
                    if (j == 0) {
                        staffBoxes[j] = svgHelpers.pointBox(this.score.staffX, this.score.staffY);
                    } else {
                        staffBoxes[j] = svgHelpers.pointBox(measure.staffX, staffBoxes[j - 1].y + staffBoxes[j - 1].height);
                    }
                }
                if (!systemBoxes[lineIndex]) {
                    systemBoxes[lineIndex] = svgHelpers.pointBox(this.score.staffX, this.score.staffY);
                }

                if (!pageBox['width']) {
                    pageBox = svgHelpers.pointBox(this.score.staffX, this.score.staffY);
                }
                var keySigLast = this._previousAttr(i, j, 'keySignature');
                var timeSigLast = this._previousAttr(i, j, 'timeSignature');
                var clefLast = this._previousAttr(i, j, 'clef');

                if (j==0 && staffBoxes[lineIndex].x + staffBoxes[lineIndex].width + measure.staffWidth 
				       > this.pageMarginWidth) {
                    system.cap();
                    staff.staffY = pageBox.y + pageBox.height + this.score.interGap;
                    staffBoxes = {};
                    staffBoxes[j] = svgHelpers.pointBox(measure.staffX, staff.staffY);
                    system = new VxSystem(this.context, staff.staffY);
                    systemIndex = 0;
                    lineIndex += 1;
                    systemBoxes[lineIndex] = svgHelpers.pointBox(measure.staffX, staff.staffY);
                }

                measure.forceClef = (systemIndex === 0 || measure.clef !== clefLast);
                measure.forceTimeSignature = (systemIndex === 0 || measure.timeSignature !== timeSigLast);
                measure.forceKeySignature = (systemIndex === 0 || measure.keySignature !== keySigLast);

                measure.staffX = staffBoxes[j].x+staffBoxes[j].width;
                measure.staffY = staffBoxes[j].y;

                // guess height of staff the first time
                measure.staffHeight = (measure.logicalBox ? measure.logicalBox.height : 90);
                measure.measureNumber.systemIndex = systemIndex;
                smoModifierFactory.applyModifiers(measure);
                system.renderMeasure(systemIndex, measure);
                systemBoxes[lineIndex] = svgHelpers.unionRect(systemBoxes[lineIndex], measure.logicalBox);
                staffBoxes[j] = svgHelpers.unionRect(staffBoxes[j], measure.logicalBox);
				pageBox = svgHelpers.unionRect(pageBox,measure.logicalBox);
            }
            ++systemIndex;
        }
        system.cap();
    }
}
