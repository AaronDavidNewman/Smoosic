
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

	get logicalPageWidth() {
		return this.pageMarginWidth;
	}
	get logicalPageHeight() {
		return this.pageMarginHeigh;
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
		var args = {svg:this.svg,width:tt.width,height:tt.height,layout:this._score.layout};
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


    // ### calculateBeginningSymbols
    // calculate which symbols like clef, key signature that we have to render in this measure.
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
            var vxSystem = new VxSystem(this.context,0,parseInt(key),this.score);
            mscore[key].forEach((measure) => {
                if (!columns[measure.measureNumber.systemIndex]) {
                    columns[measure.measureNumber.systemIndex] = [];
                }
                columns[measure.measureNumber.systemIndex].push(measure);
            });

            var colKeys = Object.keys(columns);
            colKeys.forEach((colKey) => {
                columns[colKey].forEach((measure) => {
                    vxSystem.renderMeasure(measure,this.measureMapper);
                });
            });

            vxSystem.renderEndings();
            vxSystem.updateLyricOffsets();
            this._score.staves.forEach((stf) => {
    			this._renderModifiers(stf, vxSystem);
    		});

        });
        this._renderScoreModifiers();
        this.numberMeasures();
    }

    // ### _justifyY
    // when we have finished a line of music, adjust the measures in the system so the
    // top of the staff lines up.
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

    // ### _checkPageBreak
    // See if this line breaks the page boundary
    _checkPageBreak(scoreLayout,currentLine,bottomMeasure) {
        // See if this measure breaks a page.
        var maxY = bottomMeasure.logicalBox.y +  bottomMeasure.logicalBox.height;
        if (maxY > (scoreLayout.pages * scoreLayout.pageHeight) - scoreLayout.bottomMargin) {
            // When adjusting the page, make it so the top staff of the system
            // clears the bottom of the page.
            var topMeasure = currentLine.reduce((a,b) => {
                return a.logicalBox.y < b.logicalBox.y ? a : b;
            });
            var minMaxY = topMeasure.logicalBox.y;
            var pageAdj = (scoreLayout.pages * scoreLayout.pageHeight) - minMaxY;
            pageAdj = pageAdj + scoreLayout.topMargin;
            scoreLayout.pages += 1;
            currentLine.forEach((measure) => {
                measure.setBox(svgHelpers.boxPoints(
                    measure.logicalBox.x,measure.logicalBox.y + pageAdj,measure.logicalBox.width,measure.logicalBox.height));
                measure.setY(measure.staffY + pageAdj);
            });
        }
    }

    layout() {
        var measureIx = 0;
        var systemIndex = 0;

        layoutDebug.clearDebugBoxes('pre');
        layoutDebug.clearDebugBoxes('post');
        layoutDebug.clearDebugBoxes('adjust');
        layoutDebug.clearDebugBoxes('system');
        layoutDebug.clearDebugBoxes('note');

        var svg = this.context.svg;
        var scoreLayout = this.scaledScoreLayout;
        scoreLayout.pages = 1;

        var y = scoreLayout.topMargin;
        var x = scoreLayout.leftMargin;
        var currentLine = []; // the system we are esimating

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

                  this._checkPageBreak(scoreLayout,currentLine,bottomMeasure);

                  if (layoutDebug.mask & layoutDebug.values.system) {
                      currentLine.forEach((measure) => {
                         layoutDebug.debugBox(svg,measure.logicalBox,'system');
                         layoutDebug.debugBox(svg,svgHelpers.boxPoints(measure.staffX,measure.logicalBox.y,measure.adjX,measure.logicalBox.height),'post');
                      });
                  }

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
            // If this is the last measure but we have not filled the x extent,
            // still justify the vertical staves and check for page break.
            if (measureIx >= this.score.staves[0].measures.length) {
                this._justifyY(svg,scoreLayout,measureEstimate,currentLine);

                var bottomMeasure = currentLine.reduce((a,b) => {
                    return a.logicalBox.y + a.logicalBox.height > b.logicalBox.y + b.logicalBox.height ? a : b;
                });

                this._checkPageBreak(scoreLayout,currentLine,bottomMeasure);
            }
        }
        if (scoreLayout.pages != this.score.layout.pages) {
            this.score.layout.pages = scoreLayout.pages;
            this.setViewport(true);
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
            smoBeamerFactory.applyBeams(measure);
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
        var maxAdjMeasure =measures.reduce((a,b) => a.adjX > b.adjX  ? a  : b);
        var maxAdj = maxAdjMeasure.adjX;
        measures.forEach((measure) => {
            measure.setWidth(measure.staffWidth + (maxX - (measure.staffX + measure.staffWidth)));
            measure.adjX = maxAdj;
        });
        var rv = {measures:measures,y:y,x:maxX};
        return rv;
    }

}
