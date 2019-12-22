
// ## suiLayoutBase
// ## Description:
// A layout maps the measures and notes to a spot on the page.  It
// manages the flow of music as an ordinary score.  We call it simple layout, because
// there may be other layouts for parts view, or output to other media.
class suiScoreLayout extends suiLayoutBase {
	constructor(params) {
		super('suiScoreLayout');
		Vex.Merge(this, suiLayoutBase.defaults);
		Vex.Merge(this, params);

		this.setViewport(true);

		this.attrs = {
			id: VF.Element.newID(),
			type: 'testLayout'
		};
	}

	get score() {
		return this._score;
	}

	set score(score) {
		if (this._score) {
		    this.unrenderAll();
		}
		this.passState = suiLayoutBase.passStates.initial;
		this.dirty=true;
		this._score = score;
	}


	// ### createScoreLayout
	// ### Description;
	// to get the score to appear, a div and a score object are required.  The layout takes care of creating the
	// svg element in the dom and interacting with the vex library.
	static createScoreLayout(renderElement,shadowElement, score, layoutParams) {
		var ctorObj = {
			elementId: renderElement,
            shadowElement:shadowElement,
			score: score
		};
		if (layoutParams) {
			Vex.Merge(ctorObj, layoutParams);
		}
		var layout = new suiScoreLayout(ctorObj);
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

	// ### unrenderAll
	// ### Description:
	// Delete all the svg elements associated with the score.
	unrenderAll() {
		this._score.staves.forEach((staff) => {
			this.unrenderStaff(staff);
		});
		$(this.renderer.getContext().svg).find('g.lineBracket').remove();
	}
	get pageMarginWidth() {
		return this.pageWidth - this.rightMargin * 2;
	}
	get pageMarginHeight() {
		return this.pageHeight - this.topMargin * 2;
	}

	get logicalPageWidth() {
		return this.pageMarginWidth/this.svgScale;
	}
	get logicalPageHeight() {
		return this.pageMarginHeight/this.svgScale;
	}

    _previousAttrFunc(i,j,attr) {
		var staff = this._score.staves[j];
		var measure = staff.measures[i];
		return (i > 0 ? staff.measures[i - 1][attr]() : measure[attr]());
    }

	_previousAttr(i, j, attr) {
		var staff = this._score.staves[j];
		var measure = staff.measures[i];
		return (i > 0 ? staff.measures[i - 1][attr] : measure[attr]);
	}

	renderScoreText(tt) {
		var svg = this.context.svg;
		var classes = tt.attrs.id+' '+'score-text'+' '+tt.classes;
		var args = {svg:this.svg,width:this.logicalPageWidth,height:this.logicalPageHeight,layout:this._score.layout};
		if (tt.autoLayout === true) {
			var fcn = tt.position+'TextPlacement';
			suiTextLayout[fcn](tt,args);
		} else {
			suiTextLayout.placeText(tt,args);
		}
	}
	_renderScoreModifiers() {
		var svg = this.context.svg;
		$(this.renderer.getContext().svg).find('text.score-text').remove();
		this._score.scoreText.forEach((tt) => {
			this.renderScoreText(tt);
		});
	}


	calculateBeginningSymbols(systemIndex, measure, clefLast, keySigLast, timeSigLast,tempoLast) {
		var measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
		measure.forceClef = (systemIndex === 0 || measure.clef !== clefLast);
		measure.forceTimeSignature = (systemIndex === 0 || measure.timeSignature !== timeSigLast);
        measure.forceTempo = false;
		var tempo = measure.getTempo();
        if (tempo && measure.measureNumber.measureIndex == 0) {
            measure.forceTempo = tempo.display;
        }
		else if (tempo && tempoLast) {
		    if (!SmoTempoText.eq(tempo,tempoLast)) {
		    	measure.forceTempo = tempo.display;
		    }
		} else if (tempo) {
			measure.forceTempo = tempo.display;
		}
		if (measureKeySig !== keySigLast) {
			measure.canceledKeySignature = keySigLast;
			measure.setChanged();
			measure.forceKeySignature = true;
		} else if (measure.measureNumber.measureIndex == 0 && measureKeySig != 'C') {
			measure.forceKeySignature = true;
		} else {
			measure.forceKeySignature = false;
		}
	}

    _resetStaffBoxes(renderState) {
        renderState.staffBoxes={};
    }
    _initStaffBoxes(renderState) {
        var s = renderState;
        var left = this._score.layout.leftMargin;
        var top = s.measure.measureNumber.measureIndex == 0 ? this._score.layout.topMargin : s.measure.staffY;
        if (!s.staffBoxes[s.staff.staffId]) {
            if (s.staff.staffId == 0) {
                s.staffBoxes[s.staff.staffId] = svgHelpers.pointBox(left,top);
            } else if (s.staffBoxes[s.staff.staffId - 1]) {
                s.staffBoxes[s.staff.staffId] =
                   svgHelpers.pointBox(s.staffBoxes[s.staff.staffId - 1].x,
                   s.staffBoxes[s.staff.staffId - 1].y + s.staffBoxes[s.staff.staffId - 1].height + this._score.layout.intraGap);
            } else {
                s.staffBoxes[s.staff.staffId] = svgHelpers.pointBox(s.measure.staffX,s.measure.staffY);
            }
        }
    }
    _updateStaffBoxes(renderState) {
        var s = renderState;

        // For x coordinate we adjust to the actual rendered size.  For Y, we want all staves at the same height
        // so we only consider the height of the first measure in the system
        if (s.measure.measureNumber.systemIndex === 0) {
            s.staffBoxes[s.staff.staffId] = svgHelpers.unionRect(s.staffBoxes[s.staff.staffId], s.measure.logicalBox);
        } else {
            s.staffBoxes[s.staff.staffId].width = (s.measure.logicalBox.x + s.measure.logicalBox.width) - s.staffBoxes[s.staff.staffId].x;
        }
        s.staffBoxes[s.staff.staffId].y = s.measure.staffY;
    }

    _wrapLine(renderState) {
        var s = renderState;
        var measure = s.measure;
        var staff = s.staff;

        var useAdjustedY = s.calculations.useY;
		var useAdjustedX = s.calculations.useX;
        var svg = this.context.svg;

        s.system.renderEndings();
        if (useAdjustedY) {
            s.system.cap();
        }
        // If we have wrapped at a place other than the wrap point, give up and
        // start computing X again
        if (useAdjustedX && measure.measureNumber.systemIndex != 0) {
            useAdjustedX = s.calculations.useX = false;
        }
        measure.staffX = this._score.layout.leftMargin;

        this._score.staves.forEach((stf) => {
            this._renderModifiers(stf, s.system);
        });
        if (!useAdjustedY && measure.changed) {
            if (suiLayoutBase.debugLayout) {
               svgHelpers.debugBox(
            svg, svgHelpers.boxPoints(measure.staffX, s.pageBox.y + s.pageBox.height, 1, this._score.layout.interGap),
              'measure-place-dbg');
            }
            measure.staffY = s.pageBox.y + s.pageBox.height + this._score.layout.interGap;
            if (isNaN(measure.staffY)) {
                throw ("nan measure ");
            }
        }
        this._resetStaffBoxes(s);
        this._initStaffBoxes(s);
        s.lineIndex += 1;
        measure.lineIndex = s.lineIndex;
        s.system = new VxSystem(this.context, staff.staffY, s.lineIndex);
        s.systemIndex = 0;

        // If we have wrapped lines, calculate the beginning stuff again.
        this.calculateBeginningSymbols(s.systemIndex, measure, s.clefLast, s.keySigLast, s.timeSigLast,s.tempoLast);
        if (!useAdjustedX) {
            suiLayoutAdjuster.estimateMeasureWidth(this.renderer,measure,s.staffBoxes[staff.staffId]);
        }
        measure.systemIndex = 0;
    }

    _layoutColumn(renderState) {
        var s = renderState;
        var staff = s.staff;
        while (staff) {
            s = this._layoutMeasure(s);
            if (s.wrapped) {
                return s;
            }

            staff = this._score.staves.find((s) => s.staffId == staff.staffId + 1);
            if (staff) {
                s.staff = staff;
                s.measure = s.staff.measures[s.measure.measureNumber.measureIndex];
            }
        }

        return s;
    }

    _layoutSystem(renderState) {
        var s = renderState;
		var svg = this.context.svg;

        while (!s.wrapped && !s.complete) {
             this._layoutColumn(s);
             if (s.wrapped) {
                 break;
             }
             var staff = this._score.staves[0];
             var measure = staff.measures.find((m) => m.measureNumber.measureIndex == s.measure.measureNumber.measureIndex+1);

            if (measure) {
                s.staff = staff;
                s.measure = measure;
                s.systemIndex += 1;
            } else {
                s.complete = true;
            }
        }

        if (!s.complete && s.wrapped) {
            this._wrapLine(s);
            s.wrapped = false;
        }
    }

    _layoutMeasure(renderState) {
        var s = renderState;
        var measure = s.measure;
        var staff = s.staff;
        var useAdjustedY = s.calculations.useY;
		var useAdjustedX = s.calculations.useX;
        var svg = this.context.svg;

        measure.lineIndex = s.lineIndex;

        this._initStaffBoxes(s);

        // The SVG X,Y of this staff.  Set it initially to the UL corner of page.  Width,height filled in later.
        var staffBox = s.staffBoxes[staff.staffId];

        // If we are calculating the measures' location dynamically, always update the y
        if (!useAdjustedY && measure.changed) { // && systemIndex === 0) {
            measure.staffY = staffBox.y;
                if (isNaN(measure.staffY)) {
                    throw ("nan measure ");
                }
        }

        if (!s.pageBox['width']) {
            s.pageBox = svgHelpers.copyBox(staffBox);
        }
        s.measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
        s.keySigLast = smoMusic.vexKeySignatureTranspose(this._previousAttr(measure.measureNumber.measureIndex,
            staff.staffId, 'keySignature'), measure.transposeIndex);
        s.tempoLast = this._previousAttrFunc(measure.measureNumber.measureIndex,staff.staffId,'getTempo');
        s.timeSigLast = this._previousAttr(measure.measureNumber.measureIndex,
            staff.staffId, 'timeSignature');
        s.clefLast = this._previousAttr(measure.measureNumber.measureIndex,
            staff.staffId, 'clef');

        this.calculateBeginningSymbols(s.systemIndex, measure, s.clefLast, s.keySigLast, s.timeSigLast,s.tempoLast);

        if (!useAdjustedX) {
            measure.staffX = staffBox.x + staffBox.width;
            suiLayoutAdjuster.estimateMeasureWidth(this.renderer,measure,staffBox);
        }

        // Do we need to start a new line?  Don't start a new line on the first measure in a line...
        if (staff.staffId == 0 && s.systemIndex > 0 && staffBox.x + staffBox.width + measure.staffWidth
             > this.logicalPageWidth) {
                 s.wrapped = true;
                 s.staff=staff;
                 s.measure=measure;
                 return s;
        }

        // guess height of staff the first time
        measure.measureNumber.systemIndex = s.systemIndex;

        if (suiLayoutBase.debugLayout) {
            svgHelpers.debugBox(
                svg, svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, 1), 'measure-place-dbg');
        }

        // When we are estimating dimensions, just draw changed measures.
        if (useAdjustedY || useAdjustedX || measure.changed) {
            smoBeamerFactory.applyBeams(measure);
            s.system.renderMeasure(staff.staffId, measure);

            if (suiLayoutBase.debugLayout) {
                svgHelpers.debugBox(svg, svgHelpers.clientToLogical(svg, measure.renderedBox), 'measure-render-dbg');
                measure.voices.forEach((voice) => {
                    voice.notes.forEach((note) => {
                        var noteEl = svg.getElementById(note.renderId);
                        svgHelpers.debugBox(svg, noteEl.getBBox(), 'measure-note-dbg');
                    });
                });
            }
            measure.changed = false;
        }

        // For x coordinate we adjust to the actual rendered size.  For Y, we want all staves at the same height
        // so we only consider the height of the first measure in the system
        this._updateStaffBoxes(s);
        s.pageBox = svgHelpers.unionRect(s.pageBox, measure.logicalBox);
        s.wrapped=false;
        s.measure=measure;
        return s;
    }

    _initializeRenderState(calculations) {
        var staff = this._score.staves[0];
        var measure = staff.measures[0];
        var lineIndex = 0;
		var system = new VxSystem(this.context, staff.measures[0].staffY, lineIndex);

        var renderState = {
            staff:staff,
            measure:staff.measures[0],
            lineIndex:0,
            pageBox:{},
            systemIndex:0,
            system:system,
            wrapped:false,
            complete:false,
            calculations:calculations
        }
        renderState.measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
        renderState.keySigLast = smoMusic.vexKeySignatureTranspose(this._previousAttr(measure.measureNumber.measureIndex, staff.staffId, 'keySignature'), measure.transposeIndex);
        renderState.timeSigLast = this._previousAttr(measure.measureNumber.measureIndex, staff.staffId, 'timeSignature');
        renderState.clefLast = this._previousAttr(measure.measureNumber.measureIndex, staff.staffId, 'clef');
        renderState.tempoLast = this._previousAttrFunc(measure.measureNumber.measureIndex,staff.staffId,'getTempo');

        this._resetStaffBoxes(renderState);
        return renderState;
    }

    // ### layout
	//  Render the music, keeping track of the bounding boxes of all the
	// elements.  Re-render a second time to adjust measure widths to prevent notes
	// from overlapping.  Then render all the modifiers.
	// * useAdjustedY is false if we are dynamically rendering the score, and we use other
	// measures to find our sweet spot.  If true, we assume the coordinates are correct and we use those.
    layout(calculations) {
        // bounding box of all artifacts in a system
		if (!this._score.staves.length || !this._score.staves[0].measures.length) {
			return;
		}

        var renderState = this.passState == suiLayoutBase.passStates.incomplete ?
            this.renderState :
            this._initializeRenderState(calculations);
        if (this.passState == suiLayoutBase.passStates.incomplete) {
            this.setPassState(suiLayoutBase.passStates.pass,'completing');
        }
        var ts = Date.now();
        while (renderState.complete == false) {
            this._layoutSystem(renderState);
            // Render a few lines at a time, unless in debug mode
            if (this.passState == suiLayoutBase.passStates.pass &&
                renderState.complete == false
                && !suiLayoutBase.debugLayout
                && Date.now() - ts > 100) {
                this.renderState = renderState;
                this.setPassState(suiLayoutBase.passStates.incomplete,' partial '+renderState.measure.measureNumber.measureIndex);
                break;
            }
        }

        if (this.passState == suiLayoutBase.passStates.incomplete) {
            return;
        }
        this._score.staves.forEach((stf) => {
			this._renderModifiers(stf, renderState.system);
		});
		this._renderScoreModifiers();
		if (calculations.useY) {
			renderState.system.cap();
		}
    }
}
