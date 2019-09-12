
// ## suiSimpleLayout
// ## Description:
// A layout maps the measures and notes to a spot on the page.  It
// manages the flow of music as an ordinary score.  We call it simple layout, because
// there may be other layouts for parts view, or output to other media.
class suiSimpleLayout {
	constructor(params) {
		Vex.Merge(this, suiSimpleLayout.defaults);
		Vex.Merge(this, params);

		this.setViewport();

		this.attrs = {
			id: VF.Element.newID(),
			type: 'testLayout'
		};
	}

	setViewport() {
		this.screenWidth = window.innerWidth;
		var zoomScale = this.score.zoomMode === SmoScore.zoomModes.zoomScale ?
			score.zoomScale : (window.innerWidth - 200) / this.score.pageWidth;

		this.svgScale = this.score.svgScale * zoomScale;
		this.pageWidth = Math.round(this.score.pageWidth * zoomScale);
		this.pageHeight = Math.round(this.score.pageHeight * zoomScale);
		$(this.elementId).css('width', '' + Math.round(this.pageWidth) + 'px');
		$(this.elementId).css('height', '' + Math.round(this.pageHeight) + 'px');
		$(this.elementId).html('');
		this.renderer = new VF.Renderer(this.elementId, VF.Renderer.Backends.SVG);
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
	_redraw() {
		this.unrenderAll();
		this._render();
	}
	_render() {
		this.layout(false);
		if (suiSimpleLayout.debugLayout) {
			this.dumpGeometry();
		}
		// layout a second time to adjust for issues.
		this.adjustWidths();
		this.layout(true);
		if (suiSimpleLayout.debugLayout) {
			this.dumpGeometry();
		}
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

	dumpGeometry() {
		for (var i = 0; i < this.score.staves.length; ++i) {
			var staff = this.score.staves[i];
			console.log('staff ' + i + ' staffY: ' + staff.staffY);
			for (var j = 0; j < staff.measures.length; ++j) {
				var measure = staff.measures[j];
				var log = 'staff ' + i + ' measure ' + j + ': ';
				if (measure.renderedBox) {
					log += svgHelpers.stringify(measure.renderedBox);
				} else {
					log += ' not rendered yet ';
				}
				log += smoMusic.stringifyAttrs(['staffX', 'staffY', 'staffWidth', 'adjX', 'rightMargin'], measure);
				console.log(log);
			}
		}
	}

	// ### adjustWidths
	// adjustWidths updates the expected widths of the measures based on the actual rendered widths
	adjustWidths() {
		var xmaxs = {};
		var ymaxs = [];
		if (suiSimpleLayout.debugLayout) {
			$(this.renderer.getContext().svg).find('g.measure-adjust-dbg').remove();
		}
		var svg = this.context.svg;
		for (var i = 0; i < this.score.staves.length; ++i) {
			var staff = this.score.staves[i];
			// vertical index of the current staff on the page
			var six = staff.lineIndex * this.score.staves.length + i;
			for (var j = 0; j < staff.measures.length; ++j) {
				var measure = staff.measures[j];
				var hix = ''+staff.lineIndex+'-'+measure.measureNumber.systemIndex;
				var lbox = svgHelpers.clientToLogical(svg,measure.renderedBox);
				var width = lbox.width;
				if (!xmaxs[hix]) {
					xmaxs[hix]=lbox.width;
				} else {
					xmaxs[hix] = xmaxs[hix] < lbox.width ? lbox.width : xmaxs[hix];
				}
				var curY=lbox.y+lbox.height;
				if (ymaxs.length <= six) {
					ymaxs.push(curY);
				} else {
					ymaxs[six] = ymaxs[six] < curY ? curY : ymaxs[six];
				}
			}
		}
		for (var i = 0; i < this.score.staves.length; ++i) {
			var staff = this.score.staves[i];
			// vertical index of the current staff on the page
			var six = staff.lineIndex * this.score.staves.length + i;
			for (var j = 0; j < staff.measures.length; ++j) {
				var measure = staff.measures[j];
				var hix = ''+staff.lineIndex+'-'+measure.measureNumber.systemIndex;
				var lbox = svgHelpers.clientToLogical(svg,measure.renderedBox);
				if (suiSimpleLayout.debugLayout) {
					var dbgBox = svgHelpers.boxPoints(lbox.x,lbox.y,xmaxs[hix],ymaxs[six]-lbox.y);
					svgHelpers.debugBox(svg, dbgBox,'measure-adjust-dbg',10);
				}
				measure.staffWidth = xmaxs[hix];
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
		return this.pageWidth - this.leftMargin * 2;
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

	// ### layout
	// ### Render the music, keeping track of the bounding boxes of all the
	// elements.  Re-render a second time to adjust measure widths to prevent notes
	// from overlapping.  Then render all the modifiers.
	// * drawAll is set if we are re-rendering the entire score, not just the part that changed.
	layout(drawAll) {
		var svg = this.context.svg;

		if (suiSimpleLayout.debugLayout) {
			$(this.renderer.getContext().svg).find('g.measure-place-dbg').remove();
			$(this.renderer.getContext().svg).find('g.measure-render-dbg').remove();
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

				// measure.measureNumber.systemIndex = j;

				// The SVG X,Y of this staff.  Set it initially to the UL corner of page.  Width,height filled in later.
				var staffBox = svgHelpers.pointBox(this.score.staffX, this.score.staffY);

				// The left-most measure sets the y for the row, top measure sets the x for the column.
				// Other measures get the x, y from previous measure on this row.
				if (!staffBoxes[j]) {
					if (j == 0) {
						staffBoxes[j] = svgHelpers.copyBox(staffBox);
					} else {
						staffBoxes[j] = svgHelpers.pointBox(staffBoxes[j - 1].x, staffBoxes[j - 1].y + staffBoxes[j - 1].height);
					}
				}

				staffBox = staffBoxes[j];
				if (j > 0 && systemIndex === 0) {
					measure.staffY = staffBox.y;
				} else {
					// Handle the case where a measure was added, is on the top staff.  Make sure
					// that all staves in a line have the same Y position.
					if (i > 0 && measure.staffY < staff.measures[i - 1].staffY) {
						measure.staffY = staff.measures[i - 1].staffY;
					}
				}

				measure.staffX = staffBox.x + staffBox.width;

				if (!systemBoxes[lineIndex]) {
					systemBoxes[lineIndex] = svgHelpers.copyBox(staffBox);
				}

				if (!pageBox['width']) {
					pageBox = svgHelpers.copyBox(staffBox);
				}
				var measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
				var keySigLast = smoMusic.vexKeySignatureTranspose(this._previousAttr(i, j, 'keySignature'), measure.transposeIndex);
				var timeSigLast = this._previousAttr(i, j, 'timeSignature');
				var clefLast = this._previousAttr(i, j, 'clef');

				// Do we need to start a new line?
				if (j == 0 && staffBox.x + staffBox.width + measure.staffWidth
					 > this.pageMarginWidth / this.svgScale) {
					if (drawAll) {
						system.cap();
					}
					this.score.staves.forEach((stf) => {
						this._renderModifiers(stf, system);
					});
					measure.staffX = this.score.staffX + 1;
					measure.staffY = pageBox.y + pageBox.height + this.score.interGap;
					staffBoxes = {};
					staffBoxes[j] = svgHelpers.pointBox(this.score.staffX, staff.staffY);
					lineIndex += 1;
					system = new VxSystem(this.context, staff.staffY, lineIndex);
					systemIndex = 0;
					systemBoxes[lineIndex] = svgHelpers.pointBox(measure.staffX, staff.staffY);
				}

				measure.forceClef = (systemIndex === 0 || measure.clef !== clefLast);
				measure.forceTimeSignature = (systemIndex === 0 || measure.timeSignature !== timeSigLast);
				if (measureKeySig !== keySigLast) {
					measure.canceledKeySignature = keySigLast;
					measure.forceKeySignature = true;
				} else if (measure.measureNumber.measureIndex == 0 && measureKeySig != 'C') {
					measure.forceKeySignature = true;
				} else {
					measure.forceKeySignature = false;
				}

				// guess height of staff the first time
				measure.measureNumber.systemIndex = systemIndex;

				if (suiSimpleLayout.debugLayout) {
					svgHelpers.debugBox(
						svg, svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, 1), 'measure-place-dbg');
				}
				// WIP
				if (drawAll || measure.changed) {
					measure.lineIndex = lineIndex;
					staff.lineIndex = lineIndex;
					smoBeamerFactory.applyBeams(measure);
					system.renderMeasure(j, measure);

					if (suiSimpleLayout.debugLayout) {
						svgHelpers.debugBox(svg, svgHelpers.clientToLogical(svg, measure.renderedBox), 'measure-render-dbg');
					}
					measure.changed=false;
				}
				// Rendered box is in client coordinates, convert it to SVG
				var logicalRenderedBox = svgHelpers.clientToLogical(svg, measure.renderedBox);

				// Keep a running tally of the page, system, and staff dimensions as we draw.
				systemBoxes[lineIndex] = svgHelpers.unionRect(systemBoxes[lineIndex], logicalRenderedBox);
				staffBoxes[j] = svgHelpers.unionRect(staffBoxes[j], logicalRenderedBox);
				pageBox = svgHelpers.unionRect(pageBox, logicalRenderedBox);
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
