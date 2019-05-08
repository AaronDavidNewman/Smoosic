
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

    _renderModifiers(staff, system) {
        staff.modifiers.forEach((modifier) => {
            var startNote = SmoSelection.noteSelection(this.score,
                    modifier.startSelector.staff, modifier.startSelector.measure, modifier.startSelector.voice, modifier.startSelector.tick);
            var endNote = SmoSelection.noteSelection(this.score,
                    modifier.endSelector.staff, modifier.endSelector.measure, modifier.endSelector.voice, modifier.endSelector.tick);

            var vxStart = system.getVxNote(startNote.note);
            var vxEnd = system.getVxNote(endNote.note);

            // If the modifier goes to the next staff, draw what part of it we can on this staff.
            if (vxStart && !vxEnd) {
                var nextNote = SmoSelection.nextNoteSelection(this.score,
                        modifier.startSelector.staff, modifier.startSelector.measure, modifier.startSelector.voice, modifier.startSelector.tick);
                var testNote = system.getVxNote(nextNote.note);
                while (testNote) {
                    vxEnd = testNote;
                    nextNote = SmoSelection.nextNoteSelection(this.score,
                            nextNote.selector.staff, nextNote.selector.measure, nextNote.selector.voice, nextNote.selector.tick);
                    testNote = system.getVxNote(nextNote.note);

                }
            }
            if (vxEnd && !vxStart) {
                var lastNote = SmoSelection.lastNoteSelection(this.score,
                        modifier.endSelector.staff, modifier.endSelector.measure, modifier.endSelector.voice, modifier.endSelector.tick);
                var testNote = system.getVxNote(lastNote.note);
                while (testNote) {
                    vxStart = testNote;
                    lastNote = SmoSelection.lastNoteSelection(this.score,
                            lastNote.selector.staff, lastNote.selector.measure, lastNote.selector.voice, lastNote.selector.tick);
                    testNote = system.getVxNote(lastNote.note);
                }
            }

            if (!vxStart || !vxEnd)
                return;

            // TODO: notes may have changed, get closest if these exact endpoints don't exist
            system.renderModifier(modifier, vxStart, vxEnd);

            // TODO: consider staff height with these.
            // TODO: handle dynamics split across systems.
        });
    }

    // ## layout
    // ## Render the music, keeping track of the bounding boxes of all the
    // elements.  Re-render a second time to adjust measure widths to prevent notes
    // from overlapping.  Then render all the modifiers.
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
        var lineIndex = 0;
        var system = new VxSystem(this.context, topStaff.measures[0].staffY, lineIndex);
        var systemIndex = 0;

        for (var i = 0; i < topStaff.measures.length; ++i) {
            var staffWidth = 0;
            for (var j = 0; j < this.score.staves.length; ++j) {
                var staff = this.score.staves[j];
                var measure = staff.measures[i];
                measure.measureNumber.systemIndex = j;
                if (!staffBoxes[j]) {
                    if (j == 0) {
                        staffBoxes[j] = svgHelpers.pointBox(this.score.staffX, this.score.staffY);
                    } else {
                        staffBoxes[j] = svgHelpers.pointBox(staffBoxes[j - 1].x, staffBoxes[j - 1].y + staffBoxes[j - 1].height);
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

                if (j == 0 && staffBoxes[lineIndex].x + staffBoxes[lineIndex].width + measure.staffWidth
                     > this.pageMarginWidth) {
                    system.cap();
                    this.score.staves.forEach((stf) => {
                        this._renderModifiers(stf, system);
                    });
                    staff.staffY = pageBox.y + pageBox.height + this.score.interGap;
                    staffBoxes = {};
                    staffBoxes[j] = svgHelpers.pointBox(this.score.staffX, staff.staffY);
                    lineIndex += 1;
                    system = new VxSystem(this.context, staff.staffY, lineIndex);
                    systemIndex = 0;
                    systemBoxes[lineIndex] = svgHelpers.pointBox(measure.staffX, staff.staffY);
                }

                measure.forceClef = (systemIndex === 0 || measure.clef !== clefLast);
                measure.forceTimeSignature = (systemIndex === 0 || measure.timeSignature !== timeSigLast);
                measure.forceKeySignature = (systemIndex === 0 || measure.keySignature !== keySigLast);

                measure.staffX = staffBoxes[j].x + staffBoxes[j].width;
                measure.staffY = staffBoxes[j].y;

                // guess height of staff the first time
                measure.staffHeight = (measure.logicalBox ? measure.logicalBox.height : 90);
                measure.measureNumber.systemIndex = systemIndex;
                smoModifierFactory.applyModifiers(measure);
                system.renderMeasure(j, measure);
                systemBoxes[lineIndex] = svgHelpers.unionRect(systemBoxes[lineIndex], measure.logicalBox);
                staffBoxes[j] = svgHelpers.unionRect(staffBoxes[j], measure.logicalBox);
                pageBox = svgHelpers.unionRect(pageBox, measure.logicalBox);
            }
            ++systemIndex;
        }
        system.cap();
        this.score.staves.forEach((stf) => {
            this._renderModifiers(stf, system);
        });
    }
}
