
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
		var screenWidth = window.innerWidth;

		this.svgScale = this.score.svgScale * this.score.zoomScale;
		this.pageWidth = Math.round(this.score.pageWidth * this.score.zoomScale);
		this.pageHeight = Math.round(this.score.pageHeight * this.score.zoomScale);
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
	// ### Description:
	// adjustWidths updates the expected widths of the measures based on the actual rendered widths
	adjustWidths() {
		var mins = [];
		var maxs = [];
		for (var i = 0; i < this.score.staves.length; ++i) {
			var staff = this.score.staves[i];
			for (var j = 0; j < staff.measures.length; ++j) {
				var measure = staff.measures[j];
				var width = measure.renderedBox ? measure.renderedBox.width : measure.staffWidth;
				if (i === 0) {
					mins.push(width);
					maxs.push(width);
				} else {

					mins[j] = mins[j] < width ? mins[j] : width;
					maxs[j] = maxs[j] < width ? width : maxs[j];
				}
			}
		}
		for (var i = 0; i < this.score.staves.length; ++i) {
			var staff = this.score.staves[i];
			for (var j = 0; j < staff.measures.length; ++j) {
				var measure = staff.measures[j];
				if (measure.renderedBox) {
					measure.staffWidth += maxs[j] - measure.renderedBox.width;
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

				if (suiSimpleLayout.debugLayout) {
					console.log('@@ staff position before adj logical:');
					svgHelpers.log(logicalStaffBox);
					console.log('@@ client position:');
					svgHelpers.log(clientStaffBox);
				}

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
				} else {
					// Handle the case where a measure was added, is on the top staff.  Make sure
					// that all staves in a line have the same Y position.
					if (i > 0 && measure.staffY < staff.measures[i - 1].staffY) {
						measure.staffY = staff.measures[i - 1].staffY;
					}
				}

				measure.staffX = logicalStaffBox.x + logicalStaffBox.width;

				if (!systemBoxes[lineIndex]) {
					systemBoxes[lineIndex] = svgHelpers.copyBox(clientStaffBox);
				}

				if (!pageBox['width']) {
					pageBox = svgHelpers.copyBox(clientStaffBox);
				}
				var measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
				var keySigLast = smoMusic.vexKeySignatureTranspose(this._previousAttr(i, j, 'keySignature'), measure.transposeIndex);
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

				if (suiSimpleLayout.debugLayout) {
					console.log('@@after m ' + i + ' staff ' + j + ' line ' + lineIndex + ' staff logical:');
					console.log(smoMusic.stringifyAttrs(['staffX', 'staffY', 'staffWidth', 'adjX'], measure));
					console.log('measure box');
					svgHelpers.log(measure.renderedBox);
					console.log('system box');
					svgHelpers.log(systemBoxes[lineIndex]);
					console.log('staff box');
					svgHelpers.log(staffBoxes[j]);
					console.log('page box');
					svgHelpers.log(pageBox);
				}
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
