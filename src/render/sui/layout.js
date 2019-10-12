
// ## suiSimpleLayout
// ## Description:
// A layout maps the measures and notes to a spot on the page.  It
// manages the flow of music as an ordinary score.  We call it simple layout, because
// there may be other layouts for parts view, or output to other media.
class suiSimpleLayout {
	constructor(params) {
		Vex.Merge(this, suiSimpleLayout.defaults);
		Vex.Merge(this, params);
		
		this.setViewport(true);

		this.attrs = {
			id: VF.Element.newID(),
			type: 'testLayout'
		};
	}

	setViewport(reset) {
		this.screenWidth = window.innerWidth;
		var layout = this.score.layout;
		var zoomScale = layout.zoomMode === SmoScore.zoomModes.zoomScale ?
			layout.zoomScale : (window.innerWidth - 200) / layout.pageWidth;

		this.svgScale = layout.svgScale * zoomScale;
		this.orientation = this.score.layout.orientation;
		var w = Math.round(layout.pageWidth * zoomScale) ;
		var h = Math.round(layout.pageHeight * zoomScale);
		this.pageWidth =  (this.orientation  === SmoScore.orientations.portrait) ? w: h;
		this.pageHeight = (this.orientation  === SmoScore.orientations.portrait) ? h : w;
		
		this.leftMargin=this.score.layout.leftMargin;
        this.rightMargin = this.score.layout.rightMargin;
		$(this.elementId).css('width', '' + Math.round(this.pageWidth) + 'px');
		$(this.elementId).css('height', '' + Math.round(this.pageHeight) + 'px');
		if (reset) {
		    $(this.elementId).html('');
    		this.renderer = new VF.Renderer(this.elementId, VF.Renderer.Backends.SVG);
		}
		// this.renderer.resize(this.pageWidth, this.pageHeight);

		svgHelpers.svgViewport(this.context.svg, this.pageWidth, this.pageHeight, this.svgScale);

		this.context.setFont(this.font.typeface, this.font.pointSize, "").setBackgroundFillStyle(this.font.fillStyle);
		var self = this;
		this.resizing = false;

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
	static get debugLayout() {
		suiSimpleLayout['_debugLayout'] = suiSimpleLayout['_debugLayout'] ? suiSimpleLayout._debugLayout : false
			return suiSimpleLayout._debugLayout;
	}

	static set debugLayout(value) {
		suiSimpleLayout._debugLayout = value;
	}

	// ### get context
	// ### Description:
	// return the VEX renderer context.
	get context() {
		return this.renderer.getContext();
	}
	get renderElement() {
		return this.renderer.elementId;
	}

	renderAndAdvance() {
		this.render();
	}
	// ### render
	// ### Description:
	// Render the current score in the div using VEX.  Rendering is actually done twice:
	// 1. Rendering is done just to the changed parts of the score.  THe first time, the whole score is rendered.
	// 2. Widths and heights are adjusted for elements that may have overlapped or exceeded their expected boundary.
	// 3. The whole score is rendered a second time with the new values.
	render() {
		const promise = new Promise((resolve, reject) => {
				this._render();
				resolve();
			});

		return promise;
	}
	redraw() {
		const promise = new Promise((resolve, reject) => {
				this._redraw();
				resolve();
			});

		return promise;
	}


	// ### undo
	// ### Description:
	// Undo is handled by the layout, because the layout has to first delete areas of the div that may have changed
	// , then create the modified score, then render the 'new' score.
	undo(undoBuffer) {
		var buffer = undoBuffer.peek();
		// Unrender the modified music because the IDs may change and normal unrender won't work
		if (buffer) {
			var sel = buffer.selector;
			if (buffer.type == 'measure') {
				this.unrenderMeasure(SmoSelection.measureSelection(this.score, sel.staff, sel.measure).measure);
			} else if (buffer.type === 'staff') {
				this.unrenderStaff(SmoSelection.measureSelection(this.score, sel.staff, 0).staff);
			} else {
				this.unrenderAll();
			}
			this.score = undoBuffer.undo(this.score);
			this.render();
		}
	}

	// ### renderNoteModifierPreview
	// ### Description:
	// For dialogs that allow you to manually modify elements that are automatically rendered, we allow a preview so the
	// changes can be undone before the buffer closes.
	renderNoteModifierPreview(modifier) {
		var selection = SmoSelection.noteSelection(this.score, modifier.selector.staff, modifier.selector.measure, modifier.selector.voice, modifier.selector.tick);
		if (!selection.measure.renderedBox) {
			return;
		}
		var system = new VxSystem(this.context, selection.measure.staffY, selection.measure.lineIndex);
		system.renderMeasure(selection.selector.staff, selection.measure);
	}
	
	// ### renderStaffModifierPreview
	// ### Description:
	// Similar to renderNoteModifierPreview, but lets you preveiw a change to a staff element.
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
			if (nextSelection && nextSelection.measure && nextSelection.measure.lineIndex != startSelection.measure.lineIndex) {
				this._renderModifiers(startSelection.staff, system);
				var system = new VxSystem(this.context, startSelection.measure.staffY, startSelection.measure.lineIndex);
			}
			startSelection = nextSelection;
		}
		this._renderModifiers(startSelection.staff, system);
	}

	_spaceNotes(smoMeasure) {
		var g = this.context.svg.getElementById(smoMeasure.attrs.id);
		var notes = Array.from(g.getElementsByClassName('vf-stavenote'));
		var acc = 0;
		for (var i = 1; i < notes.length; ++i) {
			var b1 = notes[i - 1].getBBox();
			var b2 = notes[i].getBBox();
			var dif = b2.x - (b1.x + b1.width);
			if (dif < 10) {
				acc += 10 - dif;
			}
		}
		smoMeasure.logicalBox.width += acc;
	}

	// ### justifyWidths
	// After we adjust widths so each staff has enough room, evenly distribute the remainder widths to the measures.
	justifyWidths() {
		var svg = this.context.svg;
		if (suiSimpleLayout.debugLayout) {
			$(this.context.svg).find('g.measure-adjust-dbg').remove();
		}
		var topStaff = this.score.staves[0];
		var maxLine = topStaff.measures[topStaff.measures.length - 1].lineIndex - 1;
		for (var i = 0; i <= maxLine; ++i) {
			var systemIndex = 0;

			this.score.staves.forEach((staff) => {
				var measures = staff.measures.filter((mm) => {
						return mm.lineIndex === i
					});
				if (measures.length > 0) {
					var width = measures.map((mm) => {
							return mm.staffWidth;
						}).reduce((a, b) => {
							return a + b
						});
					width += measures[0].staffX + this.score.layout.leftMargin;
					var just = Math.round(((this.pageMarginWidth / this.svgScale) - width) / measures.length) - 1;
					if (just > 0) {
						var accum = 0;
						measures.forEach((mm) => {
							mm.staffWidth += just;
							mm.staffX += accum;
							accum += just;
							if (suiSimpleLayout.debugLayout) {
								var dbgBox = svgHelpers.boxPoints(
										mm.staffX, mm.staffY, mm.staffWidth, mm.logicalBox.height);
								svgHelpers.debugBox(svg, dbgBox, 'measure-adjust-dbg', 10);
							}
						});
					}
				}
			});
		}
	}

	// ### adjustWidths
	// Set the width of each measure in a system to the max width for that column so the measures are aligned.
	adjustWidths() {
		var topStaff = this.score.staves[0];
		var maxLine = topStaff.measures[topStaff.measures.length - 1].lineIndex;
		var svg = this.context.svg;
		if (suiSimpleLayout.debugLayout) {
			$(this.renderer.getContext().svg).find('g.measure-adjust-dbg').remove();
		}

		for (var i = 0; i <= maxLine; ++i) {
			var systemIndex = 0;
			while (true) {
				var measures = [];
				this.score.staves.forEach((staff) => {
					var ix = staff.measures.findIndex((x) => {
							return x.lineIndex === i && x.measureNumber.systemIndex === systemIndex;
						});
					if (ix >= 0) {
						measures.push(staff.measures[ix]);
					}
				});
				// Make sure each note head is not squishing
				measures.forEach((mm) => {this._spaceNotes(mm);});

				if (measures.length) {
					var widest = measures.map((x) => {
							return x.logicalBox.width;
						}).reduce((a, w) => {
							return a > w ? a : w;
						});
					measures.forEach((measure) => {
						measure.staffWidth = widest;
						measure.changed = true;
					});
				}
				if (!measures.length)
					break;
				systemIndex += 1;
			}
		}

		this.score.staves.forEach((staff) => {
			var last = null;
			staff.measures.forEach((measure) => {
				if (last && measure.measureNumber.systemIndex > 0) {
					measure.staffX = last.staffX + last.staffWidth;
				}
				if (suiSimpleLayout.debugLayout) {
					var dbgBox = svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, measure.logicalBox.height);
					svgHelpers.debugBox(svg, dbgBox, 'measure-adjust-dbg', 10);
				}
				last = measure;
			});
		});

	}

	estimateMusicWidth(smoMeasure) {
		var width = 0;
		var tm = smoMeasure.tickmap();
		smoMeasure.voices.forEach((voice) => {
			var tickIndex = 0;
			voice.notes.forEach((note) => {
				width += vexGlyph.dimensions.noteHead.width + vexGlyph.dimensions.noteHead.spacingRight;
				width += vexGlyph.dimensions.dot.width * note.dots + vexGlyph.dimensions.dot.spacingRight * note.dots;
				note.pitches.forEach((pitch) => {
					var declared = tm.getActiveAccidental(pitch, tickIndex, smoMeasure.keySignature);

					if (pitch.accidental != declared || pitch.cautionary) {
						width += vexGlyph.accidental(pitch.accidental).width;
					}
				});
				tickIndex += 1;
			});
		});
		return width;
	}

	estimateStartSymbolWidth(smoMeasure) {
		var width = 0;
		if (smoMeasure.forceKeySignature) {
			if ( smoMeasure.canceledKeySignature) {
			    width += vexGlyph.keySignatureLength(smoMeasure.canceledKeySignature);
			}			
            width += vexGlyph.keySignatureLength(smoMeasure.keySignature);
		}
		if (smoMeasure.forceClef) {
			width += vexGlyph.clef(smoMeasure.clef).width + vexGlyph.clef(smoMeasure.clef).spacingRight;
		}
		if (smoMeasure.forceTimeSignature) {
			width += vexGlyph.dimensions.timeSignature.width + vexGlyph.dimensions.timeSignature.spacingRight;
		}
		var starts = smoMeasure.getStartBarline();
		if (starts) {
			width += vexGlyph.barWidth(starts);
		}
		return width;
	}
	
	estimateEndSymbolWidth(smoMeasure) {
		var width = 0;
		var ends  = smoMeasure.getEndBarline();
		if (ends) {
			width += vexGlyph.barWidth(ends);
		}
		return width;
	}
	
	_minMaxYModifier(staff,minY,maxY) {
		staff.modifiers.forEach((modifier) => {
			minY = modifier.logicalBox.y < minY ? modifier.logicalBox.y : minY;
			var max = modifier.logicalBox.y + modifier.logicalBox.height;
			maxY = max > maxY ? max : maxY;	 
			});

		return {minY:minY,maxY:maxY};
	}

	// ### adjustHeight
	// Handle measure bumping into each other, vertically.
	adjustHeight() {
		var topStaff = this.score.staves[0];
		var maxLine = topStaff.measures[topStaff.measures.length - 1].lineIndex;
		var svg = this.context.svg;
		// array of the max Y measure per line, used to space next line down
		var maxYPerLine = [];
		var lineIndexPerLine = [];

		if (suiSimpleLayout.debugLayout) {
			$(this.renderer.getContext().svg).find('g.measure-adjust-dbg').remove();
		}
		var accum = 0;
		for (var i = 0; i <= maxLine; ++i) {
			for (var j = 0; j < this.score.staves.length; ++j) {
				var absLine = this.score.staves.length * i + j;
				var staff = this.score.staves[j];
				var measures = staff.measures.filter((mm) => {
						return mm.lineIndex === i
					});

				if (measures.length === 0) {
					continue;
				}

				// maxYMeasure is measure on this line with y closest to bottom of page (maxYMeasure y point)
				var maxYMeasure = measures.reduce((a, b) => {
						if (a.logicalBox.y + a.logicalBox.height >
							b.logicalBox.y + b.logicalBox.height) {
							return a;
						}
						return b;
					});
				// minYMeasure is measure on this line with y closest to top of the page
				var minYMeasure = measures.reduce((a, b) => {
						return a.logicalBox.y < b.logicalBox.y ? a : b;
					});
					
				var minYRenderedY = minYMeasure.logicalBox.y;
				var minYStaffY = minYMeasure.staffY;
				
				var thisLineMaxY = maxYMeasure.logicalBox.y + maxYMeasure.logicalBox.height;
				
				var modAdj = this._minMaxYModifier(staff,minYRenderedY,thisLineMaxY);
				minYRenderedY=modAdj.minY;
				thisLineMaxY=modAdj.maxY;

				maxYPerLine.push(thisLineMaxY);
				lineIndexPerLine.push(maxYMeasure.lineIndex);

				if (absLine == 0) {
					accum = this.score.layout.topMargin - minYRenderedY;					
					var staffY = minYStaffY+ accum;					
					measures.forEach((measure) => {
						measure.staffY = staffY;
						if (suiSimpleLayout.debugLayout) {
							var dbgBox = svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, measure.logicalBox.height);
							svgHelpers.debugBox(svg, dbgBox, 'measure-adjust-dbg', 10);
						}
					});
				} else {
					var my = maxYPerLine[absLine - 1]  + this.score.layout.intraGap;
					var delta = my - minYRenderedY;
					if (lineIndexPerLine[absLine - 1] < minYMeasure.lineIndex) {
						delta += this.score.layout.interGap;
					}
					accum += delta;
					var staffY = minYStaffY + accum;					
					measures.forEach((measure) => {
						var ll = measures.logicalBox;
						measure.staffY = staffY;
						if (suiSimpleLayout.debugLayout) {
							var dbgBox = svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, measure.logicalBox.height);
							svgHelpers.debugBox(svg, dbgBox, 'measure-adjust-dbg', 10);
						}
					});
				}
			}
		}
	}

	// ### unrenderMeasure
	// ### Description:
	// All SVG elements are associated with a logical SMO element.  We need to erase any SVG element before we change a SMO
	// element in such a way that some of the logical elements go away (e.g. when deleting a measure).
	unrenderMeasure(measure) {
		if (!measure)
			return;

		$(this.renderer.getContext().svg).find('g.' + measure.attrs.id).remove();
		measure.staffX = SmoMeasure.defaults.staffX;
		measure.staffY = SmoMeasure.defaults.staffY;
		measure.staffWidth = SmoMeasure.defaults.staffWidth;
		measure.adjY = 0;
		measure.changed = true;
	}

	// ### unrenderStaff
	// ### Description:
	// See unrenderMeasure.  Like that, but with a staff.
	unrenderStaff(staff) {
		staff.measures.forEach((measure) => {
			this.unrenderMeasure(measure);
		});
		staff.modifiers.forEach((modifier) => {
			$(this.renderer.getContext().svg).find('g.' + modifier.attrs.id).remove();
		});
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

	// ### _renderModifiers
	// ### Description:
	// Render staff modifiers (modifiers straddle more than one measure, like a slur).  Handle cases where the destination
	// is on a different system due to wrapping.
	_renderModifiers(staff, system) {
		var svg = this.context.svg;
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
			modifier.logicalBox = svgHelpers.clientToLogical(svg,modifier.renderedBox);

			// TODO: consider staff height with these.
			// TODO: handle dynamics split across systems.
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
	
	_redraw() {
		this.unrenderAll();
		this._render();
	}
	_render() {

		// layout a second time to adjust for issues.
		// this.adjustWidths();
		// this.adjustWidths();
		var params = {useY:false,useX:false};
		this.layout(params);
		for (var i=0;i<10;++i) {
			params.useX=true;
			console.log('adjust width '+i);
		    this.adjustWidths();
			this.layout(params);
			
			// If useX is still true, there was no wrapping and we
			// can stop
			if (params.useX) {
				break;
			}
			params.useX = true;
		}
		this.justifyWidths();
		this.adjustHeight();
		params.useY=true;
		this.layout(params);
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

		if (suiSimpleLayout.debugLayout) {
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
    				measure.staffX = staffBox.x + staffBox.width;
	
                	// Calculate the existing staff width, based on the notes and what we expect to be rendered.
					measure.staffWidth = this.estimateMusicWidth(measure);
					measure.adjX = this.estimateStartSymbolWidth(measure);
					measure.adjRight = this.estimateEndSymbolWidth(measure);
					measure.staffWidth = measure.staffWidth  + measure.adjX + measure.adjRight;
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
						measure.staffWidth = this.estimateMusicWidth(measure);
						measure.adjX = this.estimateStartSymbolWidth(measure);
						measure.adjRight = this.estimateEndSymbolWidth(measure);
						measure.staffWidth = measure.staffWidth + measure.adjX + measure.adjRight;
					}
				}

				
				// guess height of staff the first time
				measure.measureNumber.systemIndex = systemIndex;

				if (suiSimpleLayout.debugLayout) {
					svgHelpers.debugBox(
						svg, svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, 1), 'measure-place-dbg');
				}
				// WIP
				if (useAdjustedY || useAdjustedX || measure.changed) {
					smoBeamerFactory.applyBeams(measure);
					system.renderMeasure(j, measure);

					if (suiSimpleLayout.debugLayout) {
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
		if (useAdjustedY) {
			system.cap();
		}
	}
}
