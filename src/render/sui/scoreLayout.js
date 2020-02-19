
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
		return (this.score.layout.pageWidth -
            (this.score.layout.leftMargin +this.score.layout.rightMargin))/this.score.layout.svgScale;
	}
	get pageMarginHeight() {
		return (this.pageHeight -
            (this.score.layout.leftMargin +this.score.layout.rightMargin))/this.score.layout.svgScale;
	}

	get logicalPageWidth() {
		return this.pageMarginWidth;
	}
	get logicalPageHeight() {
		return this.pageMarginHeigh;
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
		} else if (systemIndex == 0 && measureKeySig != 'C') {
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
        if (s.measure.measureNumber.systemIndex === 0) {
            s.staffBoxes[s.staff.staffId].y = s.measure.staffY + s.measure.yTop;
        }
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
        } else {
            suiLayoutAdjuster.adjustYEstimates(this.score,measure.lineIndex);
        }

        this._score.staves.forEach((stf) => {
            this._renderModifiers(stf, s.system);
        });
        // If we wrapped in a row that is not top staff, start rendering
        // at the top staff
        measure = this.score.staves[0].measures[measure.measureNumber.measureIndex];
        staff = this.score.staves[0];
        s.measure = measure;
        s.staff = staff;

        // If we have wrapped at a place other than the wrap point, give up and
        // start computing X again
        if (useAdjustedX && measure.measureNumber.systemIndex != 0) {
            useAdjustedX = s.calculations.useX = false;
        }
        measure.setX(this._score.layout.leftMargin,'scoreLayout initial');

        if (!useAdjustedY && measure.changed) {
            // var offsets = suiLayoutAdjuster.estimateMeasureHeight(this.renderer,measure,this.score.layout);
            // measure.setY(s.pageBox.y + s.pageBox.height + offsets.yOffset,'scoreLayout wrap');
            /* layoutDebug.debugBox(svg,svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, offsets.heightOffset),'pre');
            if (isNaN(measure.staffY)) {
                throw ("nan measure ");
            }  */
        }
        this._resetStaffBoxes(s);
        this._initStaffBoxes(s);
        s.lineIndex += 1;
        measure.lineIndex = s.lineIndex;
        s.system = new VxSystem(this.context, staff.staffY, s.lineIndex,this.score);
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
    // justify the columns as we go if we are calculating X, so that we wrapped
    // in the correct place.
    _adjustColumnBoxes(renderState) {
        var ar=[];
        var s = renderState;
        Object.keys(s.staffBoxes).forEach((k)=> {ar.push(s.staffBoxes[k])});
        var widths = ar.map((x) => x.width+x.x).reduce((a,b) => a > b ? a : b);
        ar.forEach((box) => {
            box.x += (widths - (box.x + box.width));
        });
    }

    _layoutSystem(renderState) {
        var s = renderState;
		var svg = this.context.svg;
        var currentLine = 0;

        while (!s.wrapped && !s.complete) {
             this._layoutColumn(s);
             if (s.wrapped) {
                 break;
             }
             var useX = s.calculations.useX;
             if (!useX) {
                 this._adjustColumnBoxes(s);
             }
             var staff = this._score.staves[0];
             var measure = staff.measures.find((m) => m.measureNumber.measureIndex == s.measure.measureNumber.measureIndex+1);

            if (measure) {
                s.staff = staff;
                s.measure = measure;
                // If we are expecting to wrap here, do so.
                if (useX && measure.lineIndex > s.lineIndex) {
                    s.wrapped = true;
                    break;
                }
                s.systemIndex += 1;
            } else {
                s.complete = true;
                if (!s.calculations.useY) {
                    suiLayoutAdjuster.adjustYEstimates(this.score,s.measure.lineIndex);
                }
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

        if (measure.measureNumber.staffId == 0  && measure.lineIndex == 0 && measure.measureNumber.measureIndex == 0) {
           // If this is the top staff, put it on the top of the page.
               layoutDebug.clearDebugBoxes('pre');
               layoutDebug.clearDebugBoxes('post');
               layoutDebug.clearDebugBoxes('note');
        }

        measure.lineIndex = s.lineIndex;
        if (useAdjustedY) {
            measure.setYTop( 0,'scoreLayout initialize');
        }

        this._initStaffBoxes(s);

        // The SVG X,Y of this staff.  Set it initially to the UL corner of page.  Width,height filled in later.
        var staffBox = s.staffBoxes[staff.staffId];

        var staffHeight = 50;

        s.measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
        s.keySigLast = smoMusic.vexKeySignatureTranspose(this._previousAttr(measure.measureNumber.measureIndex,
            staff.staffId, 'keySignature'), measure.transposeIndex);
        s.tempoLast = this._previousAttrFunc(measure.measureNumber.measureIndex,staff.staffId,'getTempo');
        s.timeSigLast = this._previousAttr(measure.measureNumber.measureIndex,
            staff.staffId, 'timeSignature');
        s.clefLast = this._previousAttr(measure.measureNumber.measureIndex,
            staff.staffId, 'clef');

        this.calculateBeginningSymbols(s.systemIndex, measure, s.clefLast, s.keySigLast, s.timeSigLast,s.tempoLast);

        // If we are calculating the measures' location dynamically, always update the y
        // TODO: is all this code reachable
        if (!useAdjustedY) {
            // if this is not the left-most staff, get it from the previous measure
            var offsets = suiLayoutAdjuster.estimateMeasureHeight(this.renderer,measure,this.score.layout);
            if (s.systemIndex > 0) {
                /* measure.setY(this._previousAttr(measure.measureNumber.measureIndex,
                    staff.staffId,'staffY') - this._previousAttr(measure.measureNumber.measureIndex,
                        staff.staffId,'yTop'),'scoreLayout estimate index > 0');  */
                var prevYTop = this._previousAttr(measure.measureNumber.measureIndex,staff.staffId,'yTop');
                var prevY = this._previousAttr(measure.measureNumber.measureIndex,staff.staffId,'staffY') + prevYTop;
                measure.setYTop(Math.min(offsets.yOffset,prevYTop),'scoreLayout inner');
                measure.setY(
                    prevY
                     - measure.yTop,'scoreLayout match earlier measure on this staff');
                measure.setBox(svgHelpers.boxPoints(measure.staffX,measure.staffY + measure.yTop,measure.staffWidth,offsets.heightOffset)
                  ,'score layout estimate Height 2');
            } else if (measure.measureNumber.staffId == 0  && measure.lineIndex == 0) {
                // If this is the top staff, put it on the top of the page.

                measure.setYTop(offsets.yOffset,'estimate height 2');
                measure.setY(this.score.layout.topMargin +
                     (measure.lineIndex*this.score.layout.interGap) - offsets.yOffset,'score layout estimate Height 2');
                measure.setBox(svgHelpers.boxPoints(measure.staffX,measure.staffY + offsets.yOffset ,measure.staffWidth,offsets.heightOffset)
                  ,'score layout estimate Height 2');
            } else {
                // Else, get it from the measure above us.
                var previous;
                if (measure.measureNumber.staffId > 0){
                    previous = this.score.staves[measure.measureNumber.staffId - 1].measures[measure.measureNumber.measureIndex];
                }  else {
                    previous = this.score.staves[this.score.staves.length-1].measures.find((mm) => mm.lineIndex == measure.lineIndex - 1);
                }
                measure.setYTop(offsets.yOffset,'estimate height 3');
                if (measure.lineIndex > 0) {
                    offsets.yOffset += this.score.layout.interGap;
                }
                measure.setY(previous.staffY + this.score.layout.intraGap + previous.logicalBox.height - measure.yTop ,'scoreLayout estimate height 3');
                measure.setBox(svgHelpers.boxPoints(measure.staffX,measure.staffY + offsets.yOffset,measure.staffWidth,offsets.heightOffset), 'score Layout estimateHeight 3');
            }
            if (isNaN(measure.staffY)) {
                throw ("nan measure ");
            }
        }

        if (!s.pageBox['width']) {
            s.pageBox = svgHelpers.copyBox(staffBox);
        }

        if (!useAdjustedX) {
            if (s.systemIndex > 0) {
            measure.setX(staffBox.x + staffBox.width,'scoreLayout, inner measure');
            } else {
                measure.setX(this.score.layout.leftMargin,'scoreLayout left measue');
            }
            suiLayoutAdjuster.estimateMeasureWidth(this.renderer,measure,staffBox);
        }

        // the width of this measure is the existing width, plus left margin, plus measure width
        // Don't use staffBox.x since it may have been adjusted
        var newWidth = Math.floor(measure.staffX + measure.staffWidth);
        // The left margin is included in the width, so don't add it twice
        var wrapThreshold = this.logicalPageWidth + this.score.layout.leftMargin;

        // If we have wrapped on this line previously, wrap in the same place unless the location of this staff has changed quite a bit.
        if (measure.measureNumber.systemIndex == 0 && staff.staffId == 0 && s.systemIndex > 0 && useAdjustedX) {
            wrapThreshold = wrapThreshold * 0.5;
        } else if (measure.measureNumber.systemIndex == 0 && measure.staffWidth > wrapThreshold) {
            // If we are the first line but we need to wrap, just shrink the line
            measure.setWidth(wrapThreshold - measure.staffX,'scoreLayout wrap line width');
        }

        // Do we need to start a new line?  Don't start a new line on the first measure in a line...
        if (s.systemIndex > 0 && newWidth
             > wrapThreshold) {
                 console.log('wrap mm '+ measure.measureNumber.measureIndex + ' column: ' + measure.measureNumber.systemIndex + ' line: '+measure.lineIndex)
                 s.wrapped = true;
                 s.staff=staff;
                 s.measure=measure;
                 return s;
        }

        if (measure.measureNumber.systemIndex == 0 && staff.staffId == 0 && s.systemIndex > 0 && measure.logicalBox) {
            console.log('wrap is changing');
        }
        // guess height of staff the first time
        measure.measureNumber.systemIndex = s.systemIndex;
        layoutDebug.debugBox(svg,svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth),'pre');

        smoBeamerFactory.applyBeams(measure);

        if (measure.measureNumber.systemIndex == 0 && useAdjustedY == false && (this.passState != suiLayoutBase.passStates.initial))  {
            // currently unreachable
            s.system.renderMeasure(staff.staffId, measure);

        } else if (this.passState != suiLayoutBase.passStates.initial) {
            s.system.renderMeasure(staff.staffId, measure);
        } else if (measure.logicalBox && measure.changed && this.passState == suiLayoutBase.passStates.initial)  {
            measure.setBox(svgHelpers.boxPoints(measure.logicalBox.x,measure.logicalBox.y,measure.staffWidth,measure.logicalBox.height)
           ,'scoreLayout adjust width of rendered box');
        }


        layoutDebug.debugBox(svg,  measure.logicalBox, 'post');
        /* if (layoutDebug.flagSet('note') && measure.logicalBox) {
            measure.voices.forEach((voice) => {
                voice.notes.forEach((note) => {
                    var noteEl = svg.getElementById(note.renderId);
                    if (noteEl) {
                       layoutDebug.debugBox(svg, noteEl.getBBox(), 'note');
                    }
                });
            });
        }  */

        measure.changed = false;

        // For x coordinate we adjust to the actual rendered size.  For Y, we want all staves at the same height
        // so we only consider the height of the first measure in the system
        this._updateStaffBoxes(s);
        s.pageBox = svgHelpers.unionRect(s.pageBox, measure.logicalBox);
        s.wrapped=false;
        s.measure=measure;

        if (this.measureMapper) {
            this.measureMapper.mapMeasure(staff,measure);
        }
        return s;
    }

    _initializeRenderState(calculations) {
        var staff = this._score.staves[0];
        var measure = staff.measures[0];
        var lineIndex = 0;
		var system = new VxSystem(this.context, staff.measures[0].staffY, lineIndex,this.score);

        var renderState = {
            staff:staff,
            measure:staff.measures[0],
            lineIndex:0,
            pageBox:{},
            systemIndex:0,
            system:system,
            wrapped:false,
            complete:false,
            calculations:calculations,
            lowestWrappedMeasure:this.lowestWrappedMeasure
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
            if (this.partialRender == true &&
                (this.passState == suiLayoutBase.passStates.pass) &&
                renderState.complete == false
                && layoutDebug.mask == 0
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
