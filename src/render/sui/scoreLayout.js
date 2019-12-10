
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


	calculateBeginningSymbols(systemIndex, measure, clefLast, keySigLast, timeSigLast) {
		var measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
		measure.forceClef = (systemIndex === 0 || measure.clef !== clefLast);
		measure.forceTimeSignature = (systemIndex === 0 || measure.timeSignature !== timeSigLast);
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
    
    _resetStaffBoxes() {
        this.staffBoxes={};
    }
    _initStaffBoxes(staff,measure,params) {
        var left = this._score.layout.leftMargin;
        var top = measure.measureNumber.measureIndex == 0 ? this._score.layout.topMargin : measure.staffY;
        if (!this.staffBoxes[staff.staffId]) {
            if (staff.staffId == 0) {
                this.staffBoxes[staff.staffId] = svgHelpers.pointBox(left,top);
            } else if (this.staffBoxes[staff.staffId - 1]) {
                this.staffBoxes[staff.staffId] = 
                   svgHelpers.pointBox(this.staffBoxes[staff.staffId - 1].x, 
                   this.staffBoxes[staff.staffId - 1].y + this.staffBoxes[staff.staffId - 1].height + this._score.layout.intraGap);
            } else {
                this.staffBoxes[staff.staffId] = svgHelpers.pointBox(measure.staffX,measure.staffY);
            }
        }
    }
    _updateStaffBoxes(staff,measure,params) {
        // For x coordinate we adjust to the actual rendered size.  For Y, we want all staves at the same height
        // so we only consider the height of the first measure in the system
        if (measure.measureNumber.systemIndex === 0) {
            this.staffBoxes[staff.staffId] = svgHelpers.unionRect(this.staffBoxes[staff.staffId], measure.logicalBox);
        } else {
            this.staffBoxes[staff.staffId].width = (measure.logicalBox.x + measure.logicalBox.width) - this.staffBoxes[staff.staffId].x;
        }
        this.staffBoxes[staff.staffId].y = measure.staffY;
    }
    
    _wrapLine(parameters) {
        var measure = parameters.measure;
        var staff = parameters.staff;
        var system = parameters.system;
        var lineIndex = parameters.lineIndex;

        var useAdjustedY = parameters.calculations.useY;
		var useAdjustedX = parameters.calculations.useX;
        var pageBox = parameters.pageBox;
        var svg = this.context.svg;
        
        system.renderEndings();
        if (useAdjustedY) {
            system.cap();
        }
        // If we have wrapped at a place other than the wrap point, give up and 
        // start computing X again
        if (useAdjustedX && measure.measureNumber.systemIndex != 0) {
            useAdjustedX = parameters.calculations.useX = false;
        }
        measure.staffX = this._score.layout.leftMargin;

        this._score.staves.forEach((stf) => {
            this._renderModifiers(stf, system);
        });
        if (!useAdjustedY && measure.changed) {
            if (suiLayoutBase.debugLayout) {
               svgHelpers.debugBox(
            svg, svgHelpers.boxPoints(measure.staffX, pageBox.y + pageBox.height, 1, this._score.layout.interGap), 
              'measure-place-dbg');
            }
            measure.staffY = pageBox.y + pageBox.height + this._score.layout.interGap;
            if (isNaN(measure.staffY)) {
                throw ("nan measure ");
            }
        }
        this._resetStaffBoxes();
        this._initStaffBoxes(staff,measure,parameters.calculations);
        lineIndex += 1;
        measure.lineIndex = lineIndex;
        system = new VxSystem(this.context, staff.staffY, lineIndex);
        parameters.systemIndex = 0;

        // If we have wrapped lines, calculate the beginning stuff again.
        this.calculateBeginningSymbols(parameters.systemIndex, measure, clefLast, keySigLast, timeSigLast);
        if (!useAdjustedX) {						
            suiLayoutAdjuster.estimateMeasureWidth(this.renderer,measure,staffBox);
        }
        measure.systemIndex = 0;
    }
    
    _layoutColumn(parameters) {
        var staff = parameters.staff;
        while (staff) {
            parameters = this._layoutMeasure(parameters);
            if (parameters.wrapped) {                
                return parameters;
            }
            
            staff = this._score.staves.find((s) => s.staffId == staff.staffId + 1);
            if (staff) {
                parameters.measure = parameters.staff.measures[parameters.measure.measureNumber.measureIndex];
            }
        }
        
        return parameters;
    }
    
    _layoutSystem(parameters) {
		var svg = this.context.svg;
        
        while (!parameters.wrapped) {
             this._layoutColumn(parameters);
             if (parameters.wrapped) {
                 break;                 
             }        
        
            if (parameters.staff.measures.length > parameters.measure.measureNumber.measureIndex) {
                parameters.staff = this._score.staves[0];
                parameters.measure = parameters.staff.measures[parameters.measure.measureNumber.measureIndex];
                parameters.systemIndex += 1;
            } else {
                parameters.complete = true;
            }
        }
        
        if (!parameters.complete && parameters.wrapped) {
            this._wrapLine(parameters);
            parameters.wrapped = false;
        }

		// Note: line index is index of this line on a page
		// System index is index of current measure from the left of the system
		var lineIndex = 0;
		var system = new VxSystem(this.context, topStaff.measures[0].staffY, lineIndex);
		var systemIndex = 0;
        this._resetStaffBoxes();
    }
    
    _layoutMeasure(parameters) {
        var measure = parameters.measure;
        var staff = parameters.staff;
        var system = parameters.system;
        var lineIndex = parameters.lineIndex;
        var systemIndex = parameters.systemIndex;
        var useAdjustedY = parameters.calculations.useY;
		var useAdjustedX = parameters.calculations.useX;
        var svg = this.context.svg;

        measure.lineIndex = lineIndex;
        
        this._initStaffBoxes(staff,measure,parameters.calculations);

        // The SVG X,Y of this staff.  Set it initially to the UL corner of page.  Width,height filled in later.
        var staffBox = this.staffBoxes[staff.staffId];
        
        // If we are calculating the measures' location dynamically, always update the y
        if (!useAdjustedY && measure.changed) { // && systemIndex === 0) {
            measure.staffY = staffBox.y;
                if (isNaN(measure.staffY)) {
                    throw ("nan measure ");
                }
        }

        if (!this.pageBox['width']) {
            this.pageBox = svgHelpers.copyBox(staffBox);
        }
        var measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
        var keySigLast = smoMusic.vexKeySignatureTranspose(this._previousAttr(i, staff.staffId, 'keySignature'), measure.transposeIndex);
        var timeSigLast = this._previousAttr(i, staff.staffId, 'timeSignature');
        var clefLast = this._previousAttr(i, staff.staffId, 'clef');

        this.calculateBeginningSymbols(systemIndex, measure, clefLast, keySigLast, timeSigLast);

        if (!useAdjustedX) {
            measure.staffX = staffBox.x + staffBox.width;					
            suiLayoutAdjuster.estimateMeasureWidth(this.renderer,measure,staffBox);    				
        }

        // Do we need to start a new line?  Don't start a new line on the first measure in a line...
        if (staff.staffId == 0 && systemIndex > 0 && staffBox.x + staffBox.width + measure.staffWidth
             > this.logicalPageWidth) {
            return {
            	wrapped: true,
            	system: system,
            	measure: measure,
            	staff: staff,
            	calculations: parameters.calculations,
            	systemIndex: systemIndex
            };
            
        }
        
        // guess height of staff the first time
        measure.measureNumber.systemIndex = systemIndex;

        if (suiLayoutBase.debugLayout) {
            svgHelpers.debugBox(
                svg, svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, 1), 'measure-place-dbg');
        }
        
        // When we are estimating dimensions, just draw changed measures.
        if (useAdjustedY || useAdjustedX || measure.changed) {
            smoBeamerFactory.applyBeams(measure);
            system.renderMeasure(staff.staffId, measure);

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
        this._updateStaffBoxes(staff,measure,parameters.calculations);
        this.pageBox = svgHelpers.unionRect(this.pageBox, measure.logicalBox);
        return {
            	wrapped: false,
            	system: system,
            	measure: measure,
            	staff: staff,
            	calculations: parameters.calculations,
            	systemIndex: systemIndex
            };
    }

	// ### layout
	//  Render the music, keeping track of the bounding boxes of all the
	// elements.  Re-render a second time to adjust measure widths to prevent notes
	// from overlapping.  Then render all the modifiers.
	// * useAdjustedY is false if we are dynamically rendering the score, and we use other
	// measures to find our sweet spot.  If true, we assume the coordinates are correct and we use those.
	layout(calculations) {
		var useAdjustedY = calculations.useY;
		var useAdjustedX = calculations.useX;
		var svg = this.context.svg;

		if (suiLayoutBase.debugLayout) {
			$(this.renderer.getContext().svg).find('g.measure-place-dbg').remove();
			$(this.renderer.getContext().svg).find('g.measure-render-dbg').remove();
			$(this.renderer.getContext().svg).find('g.measure-note-dbg').remove();
		}

		// bounding box of all artifacts on the page
		var pageBox = {};
		// bounding box of all artifacts in a system
		if (!this._score.staves.length) {
			return;
		}
		var topStaff = this._score.staves[0];
		var topStaffY = topStaff.staffY;
		if (!topStaff.measures.length) {
			return;
		}

		// Note: line index is index of this line on a page
		// System index is index of current measure from the left of the system
		var lineIndex = 0;
		var system = new VxSystem(this.context, topStaff.measures[0].staffY, lineIndex);
		var systemIndex = 0;
        this._resetStaffBoxes();
        
		for (var i = 0; i < topStaff.measures.length; ++i) {
			var staffWidth = 0;
			for (var j = 0; j < this._score.staves.length; ++j) {
				var staff = this._score.staves[j];
				var measure = staff.measures[i];

				measure.lineIndex = lineIndex;
                
                this._initStaffBoxes(staff,measure,calculations);

				// The SVG X,Y of this staff.  Set it initially to the UL corner of page.  Width,height filled in later.
				var staffBox = this.staffBoxes[staff.staffId];
				
				// If we are calculating the measures' location dynamically, always update the y
				if (!useAdjustedY && measure.changed) { // && systemIndex === 0) {
					measure.staffY = staffBox.y;
						if (isNaN(measure.staffY)) {
							throw ("nan measure ");
						}
				}

				if (!pageBox['width']) {
					pageBox = svgHelpers.copyBox(staffBox);
				}
				var measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
				var keySigLast = smoMusic.vexKeySignatureTranspose(this._previousAttr(i, staff.staffId, 'keySignature'), measure.transposeIndex);
				var timeSigLast = this._previousAttr(i, staff.staffId, 'timeSignature');
				var clefLast = this._previousAttr(i, staff.staffId, 'clef');

				this.calculateBeginningSymbols(systemIndex, measure, clefLast, keySigLast, timeSigLast);

				if (!useAdjustedX) {
					measure.staffX = staffBox.x + staffBox.width;					
					suiLayoutAdjuster.estimateMeasureWidth(this.renderer,measure,staffBox);    				
				}

				// Do we need to start a new line?  Don't start a new line on the first measure in a line...
				if (staff.staffId == 0 && systemIndex > 0 && staffBox.x + staffBox.width + measure.staffWidth
					 > this.logicalPageWidth) {
					system.renderEndings();
					if (useAdjustedY) {
						system.cap();
					}
					// If we have wrapped at a place other than the wrap point, give up and 
					// start computing X again
					if (useAdjustedX && measure.measureNumber.systemIndex != 0) {
						useAdjustedX = calculations.useX = false;
    				}
					measure.staffX = this._score.layout.leftMargin;

					this._score.staves.forEach((stf) => {
						this._renderModifiers(stf, system);
					});
					if (!useAdjustedY && measure.changed) {
                        if (suiLayoutBase.debugLayout) {
					       svgHelpers.debugBox(
						svg, svgHelpers.boxPoints(measure.staffX, pageBox.y + pageBox.height, 1, this._score.layout.interGap), 
                          'measure-place-dbg');
				        }
						measure.staffY = pageBox.y + pageBox.height + this._score.layout.interGap;
						if (isNaN(measure.staffY)) {
							throw ("nan measure ");
						}
					}
					this._resetStaffBoxes();
                    this._initStaffBoxes(staff,measure,calculations);
					lineIndex += 1;
					measure.lineIndex = lineIndex;
					system = new VxSystem(this.context, staff.staffY, lineIndex);
					systemIndex = 0;

					// If we have wrapped lines, calculate the beginning stuff again.
					this.calculateBeginningSymbols(systemIndex, measure, clefLast, keySigLast, timeSigLast);
					if (!useAdjustedX) {						
						suiLayoutAdjuster.estimateMeasureWidth(this.renderer,measure,staffBox);
					}
				}

				
				// guess height of staff the first time
				measure.measureNumber.systemIndex = systemIndex;

				if (suiLayoutBase.debugLayout) {
					svgHelpers.debugBox(
						svg, svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, 1), 'measure-place-dbg');
				}
				
				// When we are estimating dimensions, just draw changed measures.
				if (useAdjustedY || useAdjustedX || measure.changed) {
					smoBeamerFactory.applyBeams(measure);
					system.renderMeasure(staff.staffId, measure);

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
                this._updateStaffBoxes(staff,measure,calculations);
				pageBox = svgHelpers.unionRect(pageBox, measure.logicalBox);
			}
			++systemIndex;
		}
		system.renderEndings();
		this._score.staves.forEach((stf) => {
			this._renderModifiers(stf, system);
		});
		this._renderScoreModifiers();
		if (useAdjustedY) {
			system.cap();
		}
	}
}
