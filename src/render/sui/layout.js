
// ## suiLayoutBase
// ## Description:
// A layout maps the measures and notes to a spot on the page.  It
// manages the flow of music as an ordinary score.  We call it simple layout, because
// there may be other layouts for parts view, or output to other media.
class suiLayoutBase {
	constructor(ctor) {
		this.attrs = {
			id: VF.Element.newID(),
			type: ctor
		};
		this.dirty=true;
        this.shadowRender = false;
        this.partialRender = false;
		this.setPassState(suiLayoutBase.initial,'ctor');
		console.log('layout ctor: pstate initial');
		this.viewportChange = false;
	}

	static get passStates() {
		return {initial:0,pass:1,clean:2,replace:3,incomplete:4,adjustY:6,redrawMain:7};
	}
    
	setDirty() {
		if (!this.dirty) {
			this.dirty = true;
			if (this.viewportChange) {
				this.setPassState(suiLayoutBase.passStates.initial,'setDirty 1');
			} else if (this.passState == suiLayoutBase.passStates.clean ||
			   this.passState == suiLayoutBase.passStates.replace) {
				this.setPassState(suiLayoutBase.passStates.replace,'setDirty 2');
			} else {
				this.setPassState(suiLayoutBase.passStates.pass,'setDirty 3');
			}
		}
	}
	setRefresh() {
		this.dirty=true;
		this.setPassState(suiLayoutBase.passStates.initial,'setRefresh');
	}

	_setViewport(reset,elementId) {
		// this.screenWidth = window.innerWidth;
		var layout = this._score.layout;
		this.zoomScale = layout.zoomMode === SmoScore.zoomModes.zoomScale ?
			layout.zoomScale : (window.innerWidth - 200) / layout.pageWidth;

		if (layout.zoomMode != SmoScore.zoomModes.zoomScale) {
			layout.zoomScale = this.zoomScale;
		}

		this.svgScale = layout.svgScale * this.zoomScale;
		this.orientation = this._score.layout.orientation;
		var w = Math.round(layout.pageWidth * this.zoomScale) ;
		var h = Math.round(layout.pageHeight * this.zoomScale);
		this.pageWidth =  (this.orientation  === SmoScore.orientations.portrait) ? w: h;
		this.pageHeight = (this.orientation  === SmoScore.orientations.portrait) ? h : w;
        this.totalHeight = this.pageHeight * this.score.layout.pages;

		this.leftMargin=this._score.layout.leftMargin;
        this.rightMargin = this._score.layout.rightMargin;
		$(elementId).css('width', '' + Math.round(this.pageWidth) + 'px');
		$(elementId).css('height', '' + Math.round(this.totalHeight) + 'px');
		if (reset) {
		    $(elementId).html('');
    		this.renderer = new VF.Renderer(elementId, VF.Renderer.Backends.SVG);
            this.viewportChange = true;
		}
		// this.renderer.resize(this.pageWidth, this.pageHeight);

		svgHelpers.svgViewport(this.context.svg, this.pageWidth, this.totalHeight, this.svgScale);

		this.context.setFont(this.font.typeface, this.font.pointSize, "").setBackgroundFillStyle(this.font.fillStyle);
		this.resizing = false;
		console.log('layout setViewport: pstate initial');
		this.dirty=true;
	}

    setViewport(reset) {
        this._setViewport(reset,this.elementId);
        this.shadowRender = false;
        this.partialRender = false;
        this.mainRenderer = this.renderer;

        if (this.shadowElement && !suiLayoutBase['_debugLayout']) {
            this._setViewport(reset,this.shadowElement);
            if (reset) {
                this.shadowRenderer = this.renderer;
            }
            this.renderer = this.mainRenderer;
        } else {
            this.shadowRenderer = this.renderer;
        }
    }

	setPassState(st,location) {
        var oldState = this.passState;
		console.log(location + ': passState '+this.passState+'=>'+st);
		this.passState = st;
        if (this.passState === suiLayoutBase.passStates.initial) {
            // If we the render keeps bouncing because we can't figure output
            // how to wrap the lines using the old geometry, redraw everything
            if (oldState == suiLayoutBase.passStates.clean) {
                this.reducedPageScore=false;
            }
        }
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
		suiLayoutBase['_debugLayout'] = suiLayoutBase['_debugLayout'] ? suiLayoutBase._debugLayout : false
			return suiLayoutBase._debugLayout;
	}

	static set debugLayout(value) {
		suiLayoutBase._debugLayout = value;
        if (value) {
            $('body').addClass('layout-debug');
        } else {
            $('body').removeClass('layout-debug');
        }
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

	get svg() {
		return this.context.svg;
	}

	// ### render
	// ### Description:
	// Render the current score in the div using VEX.  Rendering is actually done twice:
	// 1. Rendering is done just to the changed parts of the score.  THe first time, the whole score is rendered.
	// 2. Widths and heights are adjusted for elements that may have overlapped or exceeded their expected boundary.
	// 3. The whole score is rendered a second time with the new values.


	// ### undo
	// ### Description:
	// Undo is handled by the layout, because the layout has to first delete areas of the div that may have changed
	// , then create the modified score, then render the 'new' score.
	undo(undoBuffer) {
		var buffer = undoBuffer.peek();
		var op = 'setDirty';
		// Unrender the modified music because the IDs may change and normal unrender won't work
		if (buffer) {
			var sel = buffer.selector;
			if (buffer.type == 'measure') {
				this.unrenderMeasure(SmoSelection.measureSelection(this._score, sel.staff, sel.measure).measure);
			} else if (buffer.type === 'staff') {
				this.unrenderStaff(SmoSelection.measureSelection(this._score, sel.staff, 0).staff);
				op = 'setRefresh';
			} else {
				this.unrenderAll();
				op = 'setRefresh';
			}
			this._score = undoBuffer.undo(this._score);
			this[op]();
		}
	}

	// ### renderNoteModifierPreview
	// ### Description:
	// For dialogs that allow you to manually modify elements that are automatically rendered, we allow a preview so the
	// changes can be undone before the buffer closes.
	renderNoteModifierPreview(modifier) {
		var selection = SmoSelection.noteSelection(this._score, modifier.selector.staff, modifier.selector.measure, modifier.selector.voice, modifier.selector.tick);
		if (!selection.measure.renderedBox) {
			return;
		}
		var system = new VxSystem(this.context, selection.measure.staffY, selection.measure.lineIndex,this.score);
		system.renderMeasure(selection.selector.staff, selection.measure);
	}

    // ### renderNoteModifierPreview
	// ### Description:
	// For dialogs that allow you to manually modify elements that are automatically rendered, we allow a preview so the
	// changes can be undone before the buffer closes.
	renderMeasureModifierPreview(modifier,measure) {
        var ix = measure.measureNumber.measureIndex;
        this._score.staves.forEach((staff) => {
            var cm = staff.measures[ix];
    		var system = new VxSystem(this.context, cm.staffY, cm.lineIndex,this.score);
            system.renderMeasure(staff.staffId, cm);
        });
	}

	// ### renderStaffModifierPreview
	// ### Description:
	// Similar to renderNoteModifierPreview, but lets you preveiw a change to a staff element.
	// re-render a modifier for preview during modifier dialog
	renderStaffModifierPreview(modifier) {
		// get the first measure the modifier touches
		var startSelection = SmoSelection.measureSelection(this._score, modifier.startSelector.staff, modifier.startSelector.measure);

		// We can only render if we already have, or we don't know where things go.
		if (!startSelection.measure.renderedBox) {
			return;
		}
		var system = new VxSystem(this.context, startSelection.measure.staffY, startSelection.measure.lineIndex,this.score);
		while (startSelection && startSelection.selector.measure <= modifier.endSelector.measure) {
			smoBeamerFactory.applyBeams(startSelection.measure);
            system.renderMeasure(startSelection.selector.staff, startSelection.measure);
            this._renderModifiers(startSelection.staff, system);

			var nextSelection = SmoSelection.measureSelection(this._score, startSelection.selector.staff, startSelection.selector.measure + 1);

			// If we go to new line, render this line part, then advance because the modifier is split
			if (nextSelection && nextSelection.measure && nextSelection.measure.lineIndex != startSelection.measure.lineIndex) {
				this._renderModifiers(startSelection.staff, system);
				var system = new VxSystem(this.context, startSelection.measure.staffY, startSelection.measure.lineIndex,this.score);
			}
			startSelection = nextSelection;
		}
		// this._renderModifiers(startSelection.staff, system);
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
		measure.setChanged();
	}

    unrenderColumn(measure) {
        this.score.staves.forEach((staff) => {
            this.unrenderMeasure(staff.measures[measure.measureNumber.measureIndex]);
        });
    }

	// ### unrenderStaff
	// ### Description:
	// See unrenderMeasure.  Like that, but with a staff.
	unrenderStaff(staff) {
		staff.measures.forEach((measure) => {
			this.unrenderMeasure(measure);
		});
		staff.modifiers.forEach((modifier) => {
			$(this.mainRenderer.getContext().svg).find('g.' + modifier.attrs.id).remove();
		});
	}


	// ### _renderModifiers
	// ### Description:
	// Render staff modifiers (modifiers straddle more than one measure, like a slur).  Handle cases where the destination
	// is on a different system due to wrapping.
	_renderModifiers(staff, system) {
		var svg = this.svg;
		staff.modifiers.forEach((modifier) => {
			var startNote = SmoSelection.noteSelection(this._score,
					modifier.startSelector.staff, modifier.startSelector.measure, modifier.startSelector.voice, modifier.startSelector.tick);
			var endNote = SmoSelection.noteSelection(this._score,
					modifier.endSelector.staff, modifier.endSelector.measure, modifier.endSelector.voice, modifier.endSelector.tick);

			var vxStart = system.getVxNote(startNote.note);
			var vxEnd = system.getVxNote(endNote.note);

			// If the modifier goes to the next staff, draw what part of it we can on this staff.
			if (vxStart && !vxEnd) {
				var nextNote = SmoSelection.nextNoteSelection(this._score,
						modifier.startSelector.staff, modifier.startSelector.measure, modifier.startSelector.voice, modifier.startSelector.tick);
				var testNote = system.getVxNote(nextNote.note);
				while (testNote) {
					vxEnd = testNote;
					nextNote = SmoSelection.nextNoteSelection(this._score,
							nextNote.selector.staff, nextNote.selector.measure, nextNote.selector.voice, nextNote.selector.tick);
                    // last beat of the measure
                    if (!nextNote) {
                        break;
                    }
					testNote = system.getVxNote(nextNote.note);

				}
			}
			if (vxEnd && !vxStart) {
				var lastNote = SmoSelection.lastNoteSelection(this._score,
						modifier.endSelector.staff, modifier.endSelector.measure, modifier.endSelector.voice, modifier.endSelector.tick);
				var testNote = system.getVxNote(lastNote.note);
				while (testNote) {
					vxStart = testNote;
					lastNote = SmoSelection.lastNoteSelection(this._score,
							lastNote.selector.staff, lastNote.selector.measure, lastNote.selector.voice, lastNote.selector.tick);
                    if (!lastNote) {
                        break;
                    }
					testNote = system.getVxNote(lastNote.note);
				}
			}

			if (!vxStart && !vxEnd)
				return;

			// TODO: notes may have changed, get closest if these exact endpoints don't exist
			modifier.renderedBox = system.renderModifier(modifier, vxStart, vxEnd);
			modifier.logicalBox = svgHelpers.clientToLogical(svg,modifier.renderedBox);

			// TODO: consider staff height with these.
			// TODO: handle dynamics split across systems.
		});

		system.updateLyricOffsets();
	}

    _drawPageLines() {
        $(this.context.svg).find('.pageLine').remove();
        for (var i=1;i<this._score.layout.pages;++i) {
            var y = (this.pageHeight/this.svgScale)*i;
            svgHelpers.line(this.svg,0,y,(this.pageWidth/this.svgScale),y,
                [{'stroke': '#321'},
                    {'stroke-width': '2'},
                        {'stroke-dasharray': '4,1'},
                            {'fill': 'none'}],'pageLine');
        }
    }

    _replaceMeasures() {
        var changes = [];
        this._score.staves.forEach((s) => {
            var mms = s.measures.filter((m) => {return m.changed;});
            mms.forEach((mm) => {
                changes.push({staff:s,measure:mm});
            });
        });
        changes.forEach((change) => {
            var system = new VxSystem(this.context, change.staff.measures[0].staffY, change.measure.lineIndex,this.score);
            system.renderMeasure(change.staff.staffId, change.measure);
            // Fix a bug: measure change needs to stay true so we recaltulate the width
            change.measure.changed = true;
        });
    }

	render() {
        var viewportChanged = false;
		if (this.viewportChange) {
			this.unrenderAll();
			this.setPassState(suiLayoutBase.passStates.initial,'render 1');
			this.viewportChange = false;
            viewportChanged = true;
		}

		// layout iteratively until we get it right, adjusting X each time.
		var params = {useY:false,useX:false};
		if (this.passState == suiLayoutBase.passStates.pass || this.passState == suiLayoutBase.passStates.incomplete) {
			params.useX=true;
		    suiLayoutAdjuster.adjustWidths(this._score,this.renderer);
		}
		if ((this.passState == suiLayoutBase.passStates.clean) ||
            (this.passState == suiLayoutBase.passStates.adjustY) ||
		    (this.passState == suiLayoutBase.passStates.replace) ||
            (this.passState == suiLayoutBase.passStates.redrawMain)) {
			params.useY=true;
			params.useX=true;
		}

        // If we are redrawing a significant portion of the screen, redraw in the shadow dom
        // to reduce the 'flicker'
        this.renderer =
           (this.passState == suiLayoutBase.passStates.initial ||
               this.passState == suiLayoutBase.passStates.pass ||
               this.passState == suiLayoutBase.passStates.incomplete ||
               this.passState == suiLayoutBase.passStates.adjustY) &&
            this.shadowRender ?
            this.shadowRenderer : this.mainRenderer;

		// if this is debug mode, let us see it all.
	    if (suiLayoutBase.debugLayout) {
				this.renderer = this.mainRenderer;
		}
        if (suiLayoutBase.passStates.replace == this.passState) {
            this._replaceMeasures();
        } else {
           this.layout(params);
        }

        if (this.passState == suiLayoutBase.passStates.incomplete) {
            return;
        }

        this._drawPageLines();

		if (this.passState == suiLayoutBase.passStates.replace) {
			this.dirty=false;
			return;
		}

        if (this.passState == suiLayoutBase.passStates.redrawMain) {
            this.dirty=false;
            this.setPassState(suiLayoutBase.passStates.clean,'render complete');
            this.shadowRender = true;
            this.partialRender = true;
            return;
        }

        if (params.useX == true) {
            if (this.passState == suiLayoutBase.passStates.adjustY) {
                this.setPassState(suiLayoutBase.passStates.redrawMain,'last shadow render successful');
            } else {
                var curPages = this._score.layout.pages;
                suiLayoutAdjuster.justifyWidths(this._score,this.renderer,this.pageMarginWidth / this.svgScale);
                suiLayoutAdjuster.adjustHeight(this._score,this.renderer,this.pageWidth/this.svgScale,this.pageHeight/this.svgScale,this.reducedPageScore);

                // If we are bouncing near a page margin, don't reduce the page number
                if (this._score.layout.pages  != curPages) {
                        if (this._score.layout.pages < curPages) {
                            this.reducedPageScore = true;
                        } else {
                            this.setViewport(true);
                            this.setPassState(suiLayoutBase.passStates.initial,'render 2');
                            // Force the viewport to update the page size
                            $('body').trigger('forceResizeEvent');
                    }
                } else {
                    this.setPassState(suiLayoutBase.passStates.adjustY,'render 2');
                }
            }
        } else {
            // otherwise we need another pass.
            this.dirty=true;
            this.setPassState(suiLayoutBase.passStates.pass,'render 3');
            console.log('layout after pass: pstate pass');
        }
	}
}
