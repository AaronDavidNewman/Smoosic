
// ## suiSimpleLayout
// ## Description:
// A layout maps the measures and notes to a spot on the page.  It
// manages the flow of music as an ordinary score.
class suiSimpleLayout {
    constructor(params) {
        Vex.Merge(this, suiSimpleLayout.defaults);
        Vex.Merge(this, params);

        if (this.score) {
            this.svgScale = this.score.svgScale * this.score.zoomScale;
            this.pageWidth = Math.round(this.score.pageWidth * this.score.zoomScale);
            this.pageHeight = Math.round(this.score.pageHeight * this.score.zoomScale);
            $(this.elementId).css('width', '' + this.pageWidth + 'px');
            $(this.elementId).css('height', '' + this.pageHeight + 'px');
        }
        $(this.elementId).html('');
        this.renderer = new VF.Renderer(this.elementId, VF.Renderer.Backends.SVG);
        // this.renderer.resize(this.pageWidth, this.pageHeight);
        var offset = (window.innerWidth - $(this.elementId).width()) / 2;
        if (offset > 0) {
            $(this.elementId).css('left', '' + offset + 'px');
        }
        var xtranslation = Math.round(((1.0 - this.svgScale) * this.pageWidth) / 2);
        var ytranslation = Math.round(((1.0 - this.svgScale) * this.pageHeight) / 2);
        $(this.elementId).find('svg').css('transform', 'scale(' + this.svgScale + ',' +
            this.svgScale + ') translate(-' + xtranslation + 'px,-' + ytranslation + 'px)');
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
            clefWidth: 70,
            staffWidth: 250,
            totalWidth: 250,
            leftMargin: 15,
            topMargin: 15,
            pageWidth: 8 * 96 + 48,
            pageHeight: 11 * 96,
            svgScale: 0.7,
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
        this.layout(false);
        // layout a second time to adjust for issues.
        this.layout(true);
    }

    // re-render a modifier for preview during modifier dialog
    renderStaffModifierPreview(modifier) {
        // get the first measure the modifier touches
        var startSelection = SmoSelection.measureSelection(this.score, modifier.startSelector.staff, modifier.startSelector.measure);

        // We can only render if we already have, or we don't know where things go.
        if (!startSelection.measure.renderedBox) {
            return;
        }
        var system = new VxSystem(this.context, startSelection.measure.staffY, startSelection.measure.lineIndex);
        while (startSelection && startSelection.selector.measure <= modifier.endSelector.measure) {
            smoBeamerFactory.applyBeams(startSelection.measure);
            system.renderMeasure(startSelection.selector.staff, startSelection.measure);
            var nextSelection = SmoSelection.measureSelection(this.score, startSelection.selector.staff, startSelection.selector.measure + 1);

            // If we go to new line, render this line part, then advance because the modifier is split
            if (nextSelection && nextSelection.measure.lineIndex != startSelection.measure.lineIndex) {
                this._renderModifiers(startSelection.staff, system);
                var system = new VxSystem(this.context, startSelection.measure.staffY, startSelection.measure.lineIndex);
            }
            startSelection = nextSelection;
        }
        this._renderModifiers(startSelection.staff, system);
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
            modifier.renderedBox = system.renderModifier(modifier, vxStart, vxEnd);

            // TODO: consider staff height with these.
            // TODO: handle dynamics split across systems.
        });
    }

    // ## layout
    // ## Render the music, keeping track of the bounding boxes of all the
    // elements.  Re-render a second time to adjust measure widths to prevent notes
    // from overlapping.  Then render all the modifiers.
    layout(drawAll) {
        var svg = this.context.svg;

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

                var logicalStaffBox = svgHelpers.pointBox(this.score.staffX, this.score.staffY);
                var clientStaffBox = svgHelpers.logicalToClient(svg, logicalStaffBox);

                // If we are starting a new staff on the same system, offset y so it is below the first staff.
                if (!staffBoxes[j]) {
                    if (j == 0) {
                        staffBoxes[j] = svgHelpers.copyBox(clientStaffBox);
                    } else {
                        staffBoxes[j] = svgHelpers.pointBox(staffBoxes[j - 1].x, staffBoxes[j - 1].y + staffBoxes[j - 1].height);
                    }
                }

                logicalStaffBox = svgHelpers.clientToLogical(svg, staffBoxes[j]);
                if (j > 0) {
                    measure.staffY = logicalStaffBox.y;
                }

                measure.staffX = logicalStaffBox.x + logicalStaffBox.width;

                if (!systemBoxes[lineIndex]) {
                    systemBoxes[lineIndex] = svgHelpers.copyBox(clientStaffBox);
                }

                if (!pageBox['width']) {
                    pageBox = svgHelpers.copyBox(clientStaffBox);
                }
                var keySigLast = this._previousAttr(i, j, 'keySignature');
                var timeSigLast = this._previousAttr(i, j, 'timeSignature');
                var clefLast = this._previousAttr(i, j, 'clef');

                if (j == 0 && logicalStaffBox.x + logicalStaffBox.width + measure.staffWidth
                     > this.pageMarginWidth / this.svgScale) {
                    if (drawAll) {
                        system.cap();
                    }
                    this.score.staves.forEach((stf) => {
                        this._renderModifiers(stf, system);
                    });
                    var logicalPageBox = svgHelpers.clientToLogical(svg, pageBox);
                    measure.staffX = this.score.staffX + 1;
                    measure.staffY = logicalPageBox.y + logicalPageBox.height + this.score.interGap;
                    staffBoxes = {};
                    staffBoxes[j] = svgHelpers.logicalToClient(svg,
                            svgHelpers.pointBox(this.score.staffX, staff.staffY));
                    lineIndex += 1;
                    system = new VxSystem(this.context, staff.staffY, lineIndex);
                    systemIndex = 0;
                    systemBoxes[lineIndex] = svgHelpers.logicalToClient(svg,
                            svgHelpers.pointBox(measure.staffX, staff.staffY));
                }

                measure.forceClef = (systemIndex === 0 || measure.clef !== clefLast);
                measure.forceTimeSignature = (systemIndex === 0 || measure.timeSignature !== timeSigLast);
                measure.forceKeySignature = (systemIndex === 0 || measure.keySignature !== keySigLast);

                // guess height of staff the first time
                measure.measureNumber.systemIndex = systemIndex;
                // WIP
                if (drawAll || measure.changed) {
					measure.lineIndex = lineIndex;
                    smoBeamerFactory.applyBeams(measure);
                    system.renderMeasure(j, measure);
                }

                // Keep a running tally of the page, system, and staff dimensions as we draw.
                systemBoxes[lineIndex] = svgHelpers.unionRect(systemBoxes[lineIndex], measure.renderedBox);
                staffBoxes[j] = svgHelpers.unionRect(staffBoxes[j], measure.renderedBox);
                pageBox = svgHelpers.unionRect(pageBox, measure.renderedBox);
            }
            ++systemIndex;
        }
        if (drawAll) {
            system.cap();
        }
        this.score.staves.forEach((stf) => {
            this._renderModifiers(stf, system);
        });
    }
}
