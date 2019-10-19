
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
	static createScoreLayout(renderElement, score, layoutParams) {
		var ctorObj = {
			elementId: renderElement,
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
		this.score.staves.forEach((staff) => {
			this.unrenderStaff(staff);
		});
		$(this.renderer.getContext().svg).find('g.lineBracket').remove();
	}
	get pageMarginWidth() {
		return this.pageWidth - this.rightMargin * 2;
	}
	_previousAttr(i, j, attr) {
		var staff = this.score.staves[j];
		var measure = staff.measures[i];
		return (i > 0 ? staff.measures[i - 1][attr] : measure[attr]);
	}
	
	_renderScoreModifiers() {
		var svg = this.context.svg;
		$(this.renderer.getContext().svg).find('text.score-text').remove();
		this.score.scoreText.forEach((tt) => {
			var classes = tt.attrs.id+' '+'score-text'+' '+tt.classes;
			var el = svgHelpers.placeSvgText(svg,tt.toSvgAttributes(),classes,tt.text);
			
			 var box = el.getBoundingClientRect();
		     var lbox = svgHelpers.clientToLogical(svg,box);
             tt.renderedBox = {
                x: box.x,
                y: box.y,
                height: box.height,
                width: box.width
			};
			tt.logicalBox = lbox;
			console.log(JSON.stringify(lbox,null,' '));
			console.log('scale to ' + tt.scaleX + ' ' + tt.scaleY + ' pos ' + tt.x + ' ' + tt.y);
		});
	}	

	calculateBeginningSymbols(systemIndex, measure, clefLast, keySigLast, timeSigLast) {
		var measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
		measure.forceClef = (systemIndex === 0 || measure.clef !== clefLast);
		measure.forceTimeSignature = (systemIndex === 0 || measure.timeSignature !== timeSigLast);
		if (measureKeySig !== keySigLast) {
			measure.canceledKeySignature = keySigLast;
			measure.changed=true;
			measure.forceKeySignature = true;
		} else if (measure.measureNumber.measureIndex == 0 && measureKeySig != 'C') {
			measure.forceKeySignature = true;
		} else {
			measure.forceKeySignature = false;
		}
	}

	// ### layout
	//  Render the music, keeping track of the bounding boxes of all the
	// elements.  Re-render a second time to adjust measure widths to prevent notes
	// from overlapping.  Then render all the modifiers.
	// * useAdjustedY is false if we are dynamically rendering the score, and we use other
	// measures to find our sweet spot.  If true, we assume the coordinates are correct and we use those.
	layout(params) {
		var useAdjustedY = params.useY;
		var useAdjustedX = params.useX;
		var svg = this.context.svg;

		if (suiLayoutBase.debugLayout) {
			$(this.renderer.getContext().svg).find('g.measure-place-dbg').remove();
			$(this.renderer.getContext().svg).find('g.measure-render-dbg').remove();
			$(this.renderer.getContext().svg).find('g.measure-note-dbg').remove();
		}

		// bounding box of all artifacts on the page
		var pageBox = {};
		// bounding box of all artifacts in a system
		var systemBoxes = {};
		var staffBoxes = {};
		if (!this.score.staves.length) {
			return;
		}
		var topStaff = this.score.staves[0];
		var topStaffY = topStaff.staffY;
		if (!topStaff.measures.length) {
			return;
		}

		// Note: line index is index of this line on a page
		// System index is index of current measure from the left of the system
		var lineIndex = 0;
		var system = new VxSystem(this.context, topStaff.measures[0].staffY, lineIndex);
		var systemIndex = 0;

		for (var i = 0; i < topStaff.measures.length; ++i) {
			var staffWidth = 0;
			for (var j = 0; j < this.score.staves.length; ++j) {
				var staff = this.score.staves[j];
				var measure = staff.measures[i];

				measure.lineIndex = lineIndex;

				// The SVG X,Y of this staff.  Set it initially to the UL corner of page.  Width,height filled in later.
				var staffBox = svgHelpers.pointBox(this.score.layout.leftMargin, this.score.layout.topMargin);

				// The left-most measure sets the y for the row, top measure sets the x for the column.
				// Other measures get the x, y from previous measure on this row.  Once the music is rendered we will adjust
				// based on actual rendered dimensions.
				if (!staffBoxes[j]) {
					if (j == 0) {
						staffBoxes[j] = svgHelpers.copyBox(staffBox);
					} else {
						staffBoxes[j] = svgHelpers.pointBox(staffBoxes[j - 1].x, staffBoxes[j - 1].y + staffBoxes[j - 1].height + this.score.layout.intraGap);
					}
				}

				staffBox = staffBoxes[j];
				
				// If we are calculating the measures' location dynamically, always update the y
				if (!useAdjustedY && measure.changed) { // && systemIndex === 0) {
					measure.staffY = staffBox.y;
						if (isNaN(measure.staffY)) {
							throw ("nan measure ");
						}
				}

				if (!systemBoxes[lineIndex] || j > 0) {
					systemBoxes[lineIndex] = svgHelpers.copyBox(staffBox);
				}

				if (!pageBox['width']) {
					pageBox = svgHelpers.copyBox(staffBox);
				}
				var measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
				var keySigLast = smoMusic.vexKeySignatureTranspose(this._previousAttr(i, j, 'keySignature'), measure.transposeIndex);
				var timeSigLast = this._previousAttr(i, j, 'timeSignature');
				var clefLast = this._previousAttr(i, j, 'clef');

				this.calculateBeginningSymbols(systemIndex, measure, clefLast, keySigLast, timeSigLast);

				if (!useAdjustedX) {
					
					suiLayoutAdjuster.estimateMeasureWidth(this.renderer,measure,staffBox);
    				
					/* measure.staffX = staffBox.x + staffBox.width;
	
                	// Calculate the existing staff width, based on the notes and what we expect to be rendered.
					measure.staffWidth = suiLayoutAdjuster.estimateMusicWidth(measure);
					measure.adjX = suiLayoutAdjuster.estimateStartSymbolWidth(measure);
					measure.adjRight = suiLayoutAdjuster.estimateEndSymbolWidth(measure);
					measure.staffWidth = measure.staffWidth  + measure.adjX + measure.adjRight;
					
					// Calculate the space for left/right text which displaces the measure.
					var textOffsetBox=suiLayoutAdjuster.estimateTextOffset(measure);
					measure.staffX += textOffsetBox.x;
					measure.width += textOffsetBox.width;   */
				}

				// Do we need to start a new line?  Don't start a new line on the first measure in a line...
				if (j == 0 && systemIndex > 0 && staffBox.x + staffBox.width + measure.staffWidth
					 > this.pageMarginWidth / this.svgScale) {
					system.renderEndings();
					if (useAdjustedY) {
						system.cap();
					}
					// If we have wrapped at a place other than the wrap point, give up and 
					// start computing X again
					if (useAdjustedX && measure.measureNumber.systemIndex != 0) {
						useAdjustedX = params.useX = false;
    				}
					measure.staffX = this.score.layout.leftMargin;

					this.score.staves.forEach((stf) => {
						this._renderModifiers(stf, system);
					});
					if (!useAdjustedY && measure.changed) {
						measure.staffY = pageBox.y + pageBox.height + this.score.layout.interGap;
						if (isNaN(measure.staffY)) {
							throw ("nan measure ");
						}
					}
					staffBoxes = {};
					staffBoxes[j] = svgHelpers.boxPoints(this.score.layout.leftMargin, measure.staffY, 1, 1);
					lineIndex += 1;
					measure.lineIndex = lineIndex;
					system = new VxSystem(this.context, staff.staffY, lineIndex);
					systemIndex = 0;
					systemBoxes[lineIndex] = staffBoxes[j];

					// If we have wrapped lines, calculate the beginning stuff again.
					this.calculateBeginningSymbols(systemIndex, measure, clefLast, keySigLast, timeSigLast);
					if (!useAdjustedX) {
						
						suiLayoutAdjuster.estimateMeasureWidth(this.renderer,measure,staffBox);

						/* measure.staffWidth = suiLayoutAdjuster.estimateMusicWidth(measure);
						measure.adjX = suiLayoutAdjuster.estimateStartSymbolWidth(measure);
						measure.adjRight = suiLayoutAdjuster.estimateEndSymbolWidth(measure);
						measure.staffWidth = measure.staffWidth + measure.adjX + measure.adjRight;   */
					}
				}

				
				// guess height of staff the first time
				measure.measureNumber.systemIndex = systemIndex;

				if (suiLayoutBase.debugLayout) {
					svgHelpers.debugBox(
						svg, svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, 1), 'measure-place-dbg');
				}
				// WIP
				if (useAdjustedY || useAdjustedX || measure.changed) {
					smoBeamerFactory.applyBeams(measure);
					system.renderMeasure(j, measure);

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
				// Rendered box is in client coordinates, convert it to SVG
				var logicalRenderedBox = measure.logicalBox;

				// Keep a running tally of the page, system, and staff dimensions as we draw.
				systemBoxes[lineIndex] = svgHelpers.unionRect(systemBoxes[lineIndex], logicalRenderedBox);

				// For x coordinate we adjust to the actual rendered size.  For Y, we want all staves at the same height
				// so we only consider the height of the first measure in the system
				if (systemIndex === 0) {
					staffBoxes[j] = svgHelpers.unionRect(staffBoxes[j], logicalRenderedBox);
				} else {
					staffBoxes[j].width = (logicalRenderedBox.x + logicalRenderedBox.width) - staffBoxes[j].x;
				}
				staffBoxes[j].y = measure.staffY;
				pageBox = svgHelpers.unionRect(pageBox, logicalRenderedBox);
			}
			++systemIndex;
		}
		system.renderEndings();
		this.score.staves.forEach((stf) => {
			this._renderModifiers(stf, system);
		});
		this._renderScoreModifiers();
		if (useAdjustedY) {
			system.cap();
		}
	}
}
