
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

    // ### _measureToLeft
    // measure to 'left' is on previous row if this is the first column in a system
    // but we still use it to compute beginning symbols (key sig etc.)
    _measureToLeft(measure) {
        var j = measure.measureNumber.staffId;
        var i = measure.measureNumber.measureIndex;
		return (i > 0 ? this._score.staves[j].measures[i - 1] :null);
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
        // TODO: this can also be done dynamically, no need to change.
        /*
        if (useAdjustedX && measure.measureNumber.systemIndex != 0) {
            useAdjustedX = s.calculations.useX = false;
        }
        */
        measure.setX(this._score.layout.leftMargin,'scoreLayout initial');

        if (!useAdjustedY && measure.changed) {
            var offsets = suiLayoutAdjuster.estimateMeasureHeight(measure,this.score.layout);
            measure.setY(s.pageBox.y + s.pageBox.height + offsets.aboveBaseline,'scoreLayout wrap');
            layoutDebug.debugBox(svg,svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, offsets.belowBaseline),'pre');
            if (isNaN(measure.staffY)) {
                throw ("nan measure ");
            }
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
            suiLayoutAdjuster.estimateMeasureWidth(measure);
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
    _adjustPages() {
        var pageCfg = this.score.layout.pages;

    }

    _layoutSystem(renderState) {
        var s = renderState;
		var svg = this.context.svg;
        var currentLine = 0;

        while (!s.wrapped && !s.complete) {
             this._layoutColumn(s);
             if (s.wrapped) {
                 if (!s.calculations.useY) {
                      this.score.layout.pages =
                      suiLayoutAdjuster.adjustSystemForPage(this.score,s.measure.lineIndex,this.score.layout.svgScale);
                 }
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
                    if (!s.calculations.useY) {
                       this.score.layout.pages =
                         suiLayoutAdjuster.adjustSystemForPage(this.score,measure.lineIndex,this.score.layout.svgScale);
                    }
                    break;
                }
                s.systemIndex += 1;
            } else {
                s.complete = true;
                if (!s.calculations.useY) {
                    suiLayoutAdjuster.adjustYEstimates(this.score,s.measure.lineIndex);
                    this.score.layout.pages =
                      suiLayoutAdjuster.adjustSystemForPage(this.score,s.lineIndex,this.score.layout.svgScale);
                }
            }
        }

        if (!s.complete && s.wrapped) {
            this._wrapLine(s);
            s.wrapped = false;
        }
    }
    _getMeasuresInColumn(ix) {
        var rv = [];
        this.score.staves.forEach((staff) => {
            var inst = staff.measures.find((ss) => ss.measureNumber.measureIndex == ix);
            if (inst) {
                rv.push(inst);
            }
        });

        return rv;
    }
    get scaledScoreLayout() {
        var svgScale = this.score.layout.svgScale;
        var rv = JSON.parse(JSON.stringify(this.score.layout));
        var attrs = ['topMargin','bottomMargin','interGap','intraGap','pageHeight','pageWidth','leftMargin','rightMargin'];
        attrs.forEach((attr) => {
            rv[attr] = rv[attr] / svgScale;
        });

        return rv;
    }

    renderAllMeasures() {
        var mscore = {};
        this.score.staves.forEach((staff) => {
            staff.measures.forEach((measure) => {
                if (!mscore[measure.lineIndex]) {
                    mscore[measure.lineIndex] = [];
                }
                mscore[measure.lineIndex].push(measure);
            });
        });

        var keys = Object.keys(mscore);
        keys.forEach((key) => {
            var columns = {};
            var vxStaff = new VxSystem(this.context,0,parseInt(key),this.score);
            mscore[key].forEach((measure) => {
                if (!columns[measure.measureNumber.systemIndex]) {
                    columns[measure.measureNumber.systemIndex] = [];
                }
                columns[measure.measureNumber.systemIndex].push(measure);
            });

            var colKeys = Object.keys(columns);
            colKeys.forEach((colKey) => {
                columns[colKey].forEach((measure) => {
                    vxStaff.renderMeasure(measure,this.measureMapper);
                });
            });

            vxStaff.renderEndings();
            vxStaff.updateLyricOffsets();

        });
        this._renderScoreModifiers();

    }

    _justifyY(svg,scoreLayout,measureEstimate,currentLine) {
        // We estimate the staves at the same absolute y value.  Now, move them down so the top of the staves align for all measures in a  row.
        for (var i =0;i< measureEstimate.measures.length;++i) {
            var rowAdj = currentLine.filter((mm) => mm.svg.rowInSystem == i);
            // lowest staff has greatest staffY value.
            var lowestStaff = rowAdj.reduce((a,b) => {
                return a.staffY > b.staffY ? a : b;
            });
            rowAdj.forEach((measure) => {
                var adj = lowestStaff.staffY - measure.staffY;
                measure.setY(measure.staffY + adj);
                measure.setBox(svgHelpers.boxPoints(measure.logicalBox.x,measure.logicalBox.y + adj,measure.logicalBox.width,measure.logicalBox.height));
            });
            var rightStaff = rowAdj.reduce((a,b) => {
               return a.staffX + a.staffWidth > b.staffX + b.staffWidth ?  a : b});

            var justifyX = Math.round((scoreLayout.pageWidth - (scoreLayout.leftMargin + scoreLayout.rightMargin + rightStaff.staffX + rightStaff.staffWidth))
                 / rowAdj.length);
            rowAdj.forEach((measure) => {
                measure.setWidth(measure.staffWidth + justifyX,'_estimateMeasureDimensions justify');
                var offset = measure.measureNumber.systemIndex * justifyX;
                measure.setX(measure.staffX + offset);
                measure.setBox(svgHelpers.boxPoints(measure.logicalBox.x + offset,measure.logicalBox.y,measure.staffWidth,measure.logicalBox.height,));
                layoutDebug.debugBox(svg,measure.logicalBox,'adjust');
            });
         }

    }

    _estimateMeasureDimensions() {
        var measureIx = 0;
        var systemIndex = 0;

        layoutDebug.clearDebugBoxes('pre');
        layoutDebug.clearDebugBoxes('post');
        layoutDebug.clearDebugBoxes('note');

        var svg = this.context.svg;
        var scoreLayout = this.scaledScoreLayout;

        var y = scoreLayout.topMargin;
        var x = scoreLayout.leftMargin;
        var currentLine = []; // the system we are esimating
        var pages = 1;

        var lineIndex = 0;
        while (measureIx < this.score.staves[0].measures.length) {

            var measureEstimate = this._estimateColumn(scoreLayout,measureIx,systemIndex,lineIndex,x,y);
            x = measureEstimate.x;

            if (systemIndex > 0 &&
                  (measureEstimate.measures[0].getForceSystemBreak() || measureEstimate.x > (scoreLayout.pageWidth - scoreLayout.leftMargin))) {

                  this._justifyY(svg,scoreLayout,measureEstimate,currentLine);
                  // find the measure with the lowest y extend (greatest y value), not necessarily one with lowest
                  // start of staff.
                  var bottomMeasure = currentLine.reduce((a,b) => {
                      return a.logicalBox.y + a.logicalBox.height > b.logicalBox.y + b.logicalBox.height ? a : b;
                  });

                  // See if this measure breaks a page.
                  var maxY = bottomMeasure.logicalBox.y +  bottomMeasure.logicalBox.height;
                  if (maxY > (pages * scoreLayout.pageHeight) - scoreLayout.bottomMargin) {
                      // When adjusting the page, make it so the top staff of the system
                      // clears the bottom of the page.
                      var topMeasure = currentLine.reduce((a,b) => {
                          return a.logicalBox.y < b.logicalBox.y ? a : b;
                      });
                      var minMaxY = topMeasure.logicalBox.y;
                      var pageAdj = (pages * scoreLayout.pageHeight) - minMaxY;
                      pageAdj = pageAdj + scoreLayout.topMargin;
                      pages += 1;
                      currentLine.forEach((measure) => {
                          measure.setBox(svgHelpers.boxPoints(
                              measure.logicalBox.x,measure.logicalBox.y + pageAdj,measure.logicalBox.width,measure.logicalBox.height));
                          measure.setY(measure.staffY + pageAdj);
                      });
                  }

                  currentLine.forEach((measure) => {
                     layoutDebug.debugBox(svg,measure.logicalBox,'system');
                  });


                // Now start rendering on the next system.
                y = bottomMeasure.logicalBox.height + bottomMeasure.logicalBox.y + this.score.layout.interGap;
                currentLine = [];
                systemIndex = 0;
                x = scoreLayout.leftMargin;
                lineIndex += 1;
                measureEstimate = this._estimateColumn(scoreLayout,measureIx,systemIndex,lineIndex,x,y);
                x = measureEstimate.x;
            }


            measureEstimate.measures.forEach((measure) => {
               layoutDebug.debugBox(svg,measure.logicalBox,'pre');
            });

            currentLine = currentLine.concat(measureEstimate.measures);
            measureIx += 1;
            systemIndex += 1;
            if (measureIx >= this.score.staves[0].measures.length) {
                this._justifyY(svg,scoreLayout,measureEstimate,currentLine);
            }
        }
        this.renderAllMeasures();
    }

    // ### _estimateColumns
    // the new logic to estimate the dimensions of a column of music, corresponding to
    // a certain measure index.
    // returns:
    // {measures,y,x}  the x and y at the left/bottom of the render
    _estimateColumn(scoreLayout,measureIx,systemIndex,lineIndex,x,y) {
        var s = {};
        var measures = this._getMeasuresInColumn(measureIx);
        var rowInSystem = 0;
        measures.forEach((measure) => {
            var staff = this.score.staves[measure.measureNumber.staffId];
            measure.measureNumber.systemIndex = systemIndex;
            measure.svg.rowInSystem = rowInSystem;
            measure.lineIndex = lineIndex;

            // use measure to left to figure out whether I need to render key signature, etc.
            // If I am the first measure, just use self and we always render them on the first measure.
            var measureToLeft = this._measureToLeft(measure);
            if (!measureToLeft) {
                measureToLeft = measure;
            }
            s.measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
            s.keySigLast = smoMusic.vexKeySignatureTranspose(measureToLeft.keySignature,measure.transposeIndex);
            s.tempoLast = measureToLeft.getTempo();
            s.timeSigLast = measureToLeft.timeSignature;
            s.clefLast = measureToLeft.clef;
            this.calculateBeginningSymbols(systemIndex, measure, s.clefLast, s.keySigLast, s.timeSigLast,s.tempoLast);

            // calculate vertical offsets from the baseline
            var offsets = suiLayoutAdjuster.estimateMeasureHeight(measure,this.score.layout);
            measure.setYTop(offsets.aboveBaseline);
            measure.setY(y - measure.yTop,'_estimateColumns height');
            measure.setX(x);
            measure.setBox(svgHelpers.boxPoints(measure.staffX,y,measure.staffWidth,offsets.belowBaseline-offsets.aboveBaseline));
            suiLayoutAdjuster.estimateMeasureWidth(measure);
            y = y + measure.logicalBox.height + scoreLayout.intraGap;
            rowInSystem += 1;
        });

        // justify this column to the maximum width
        var maxMeasure = measures.reduce((a,b) => a.staffX+a.staffWidth > b.staffX+b.staffWidth ? a : b);
        var maxX = maxMeasure.staffX + maxMeasure.staffWidth;
        measures.forEach((measure) => {
            measure.setWidth(measure.staffWidth + (maxX - (measure.staffX + measure.staffWidth)));
        });
        var rv = {measures:measures,y:y,x:maxX};
        return rv;
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
            var offsets = suiLayoutAdjuster.estimateMeasureHeight(measure,this.score.layout);
            if (s.systemIndex > 0) {
                /* measure.setY(this._previousAttr(measure.measureNumber.measureIndex,
                    staff.staffId,'staffY') - this._previousAttr(measure.measureNumber.measureIndex,
                        staff.staffId,'yTop'),'scoreLayout estimate index > 0');  */
                var prevYTop = this._previousAttr(measure.measureNumber.measureIndex,staff.staffId,'yTop');
                var prevY = this._previousAttr(measure.measureNumber.measureIndex,staff.staffId,'staffY') + prevYTop;
                measure.setYTop(Math.min(offsets.aboveBaseline,prevYTop),'scoreLayout inner');
                measure.setY(
                    prevY
                     - measure.yTop,'scoreLayout match earlier measure on this staff');
                measure.setBox(svgHelpers.boxPoints(measure.staffX,measure.staffY + measure.yTop,measure.staffWidth,offsets.belowBaseline)
                  ,'score layout estimate Height 2');
            } else if (measure.measureNumber.staffId == 0  && measure.lineIndex == 0) {
                // If this is the top staff, put it on the top of the page.

                measure.setYTop(offsets.aboveBaseline,'estimate height 2');
                measure.setY(this.score.layout.topMargin +
                     (measure.lineIndex*this.score.layout.interGap) - offsets.aboveBaseline,'score layout estimate Height 2');
                measure.setBox(svgHelpers.boxPoints(measure.staffX,measure.staffY + offsets.aboveBaseline ,measure.staffWidth,offsets.belowBaseline)
                  ,'score layout estimate Height 2');
            } else {
                // Else, get it from the measure above us.
                var previous;
                if (measure.measureNumber.staffId > 0){
                    previous = this.score.staves[measure.measureNumber.staffId - 1].measures[measure.measureNumber.measureIndex];
                }  else {
                    previous = this.score.staves[this.score.staves.length-1].measures.find((mm) => mm.lineIndex == measure.lineIndex - 1);
                }
                measure.setYTop(offsets.aboveBaseline,'estimate height 3');

                measure.setY(previous.staffY + this.score.layout.interGap + previous.logicalBox.height - measure.yTop ,'scoreLayout estimate height 3');
                measure.setBox(svgHelpers.boxPoints(measure.staffX,measure.staffY + offsets.aboveBaseline,measure.staffWidth,offsets.belowBaseline), 'score Layout estimateHeight 3');
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
            suiLayoutAdjuster.estimateMeasureWidth(measure);
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
        if (s.systemIndex > 0 && (newWidth
             > wrapThreshold || measure.getForceSystemBreak())) {
                 console.log('wrap mm '+ measure.measureNumber.measureIndex + ' column: ' + measure.measureNumber.systemIndex +
                  ' line: '+measure.lineIndex + ' force: '+measure.getForceSystemBreak());
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
            s.system.renderMeasure(measure,this.measureMapper);

        } else if (this.passState != suiLayoutBase.passStates.initial) {
            s.system.renderMeasure(measure,this.measureMapper);
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
        return;
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
                && Date.now() - ts > this.renderTime) {
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
