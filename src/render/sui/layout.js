
class layoutDebug {
    static get values() {
        return {
            pre:1,
            post:2,
            adjust:4,
            system:8,
            note:16,
            adjustHeight:32,
            measureHistory:64
        }
    }

    static get classes() {
        return {
            pre:'measure-place-dbg',
            post:'measure-render-dbg',
            adjust:'measure-adjust-dbg',
            system:'system-place-dbg',
            note:'measure-note-dbg',
            adjustHeight:'measure-adjustHeight-dbg',
            measureHistory:''
        }
    }

	static get mask() {
        if (typeof(layoutDebug._flags) == 'undefined') {
            layoutDebug._flags = 0;
        }
        return layoutDebug._flags;
	}

    static set mask(value) {
        layoutDebug._flags = value;
    }

    static flagSet(value) {
        return layoutDebug.mask & layoutDebug.values[value];
    }

    static clearAll(svg) {
        layoutDebug._flags = 0;
    }
    static setAll() {
        layoutDebug._flags = 1+2+4+8+16+32+64;
    }
    static clearDebugBoxes(value) {
        if (layoutDebug.flagSet(value)) {
            var selector = 'g.'+layoutDebug.classes[value];
            $(selector).remove();
        }
    }
    static debugBox(svg,box,flag) {
        if (!box.height) {
            box.height=1;
        }
        if (layoutDebug.flagSet(flag)) {
            svgHelpers.debugBox(svg, box, layoutDebug.classes[flag]);
        }
    }
    static clearFlag(value) {
        clearFlagSvg(value);

        var flag = layoutDebug.values[value];
        if (typeof(layoutDebug._flags) == 'undefined') {
            layoutDebug._flags = 0;
        }
        layoutDebug._flags = layoutDebug._flags & (~flag);
    }

	static setFlag(value) {
        var flag = layoutDebug.values[value];
        if (typeof(layoutDebug._flags) == 'undefined') {
            layoutDebug._flags = flag;
            return;
        }
        layoutDebug._flags |= flag;
	}
}
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
        this.replaceQ=[];
        this.renderTime=250;  // ms to render before time slicing
        this.partialRender = false;
        this.stateRepCount=0;
        this.viewportPages = 1;
		this.setPassState(suiLayoutBase.initial,'ctor');
		console.log('layout ctor: pstate initial');
		this.viewportChanged = false;
        this._resetViewport = false;
        this.measureMapper = null;
	}

    setMeasureMapper(mapper) {
        this.measureMapper = mapper;
    }

	static get passStates() {
		return {initial:0,pass:1,clean:2,replace:3,incomplete:4,adjustY:6,redrawMain:7};
	}

    addToReplaceQueue(selection) {
        if (this.passState == suiLayoutBase.passStates.clean ||
            this.passState == suiLayoutBase.passStates.replace) {
          if (Array.isArray(selection)) {
              this.replaceQ = this.replaceQ.concat(selection);
          } else {
              this.replaceQ.push(selection)
          }
          this.setDirty();
       }
    }


	setDirty() {
		if (!this.dirty) {
			this.dirty = true;
			if (this.passState == suiLayoutBase.passStates.clean ||
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
    rerenderAll() {
        this.dirty=true;
		this.setPassState(suiLayoutBase.passStates.initial,'rerenderAll');
        this._resetViewport = true;
    }

    remapAll() {
        this.partialRender = false;
        this.setRefresh();
    }

    numberMeasures() {
        var staff = this.score.staves[0];
        var measures = staff.measures.filter((measure) => measure.measureNumber.systemIndex == 0);
        $('.measure-number').remove();

        measures.forEach((measure) => {
            var at = [];
            if (measure.measureNumber.measureNumber > 0) {
                at.push({y:measure.logicalBox.y - 10});
                at.push({x:measure.logicalBox.x});
                at.push({fontFamily:'Helvitica'});
                at.push({fontSize:'8pt'});
                svgHelpers.placeSvgText(this.context.svg,at,'measure-number',(measure.measureNumber.measureNumber + 1).toString());
            }
        });
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
        this.viewportPages = this.score.layout.pages;

		this.leftMargin=this._score.layout.leftMargin;
        this.rightMargin = this._score.layout.rightMargin;
		$(elementId).css('width', '' + Math.round(this.pageWidth) + 'px');
		$(elementId).css('height', '' + Math.round(this.totalHeight) + 'px');
		if (reset) {
		    $(elementId).html('');
    		this.renderer = new VF.Renderer(elementId, VF.Renderer.Backends.SVG);
            this.viewportChanged = true;
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
        this.score.staves.forEach((staff) => {
            staff.measures.forEach((measure) => {
                if (measure.logicalBox && reset) {
                    measure.svg.history=['reset'];
                    measure.deleteLogicalBox('reset viewport');
                }
            });
        });
        this.partialRender = false;
    }

    clearLine(measure) {
        var lineIndex = measure.lineIndex;
        var startIndex = (lineIndex > 1 ? lineIndex - 1: 0);
        for (var i = startIndex;i<lineIndex+1;++i) {
            this.score.staves.forEach((staff) => {
                var mms = staff.measures.filter((mm) => mm.lineIndex === i);
                mms.forEach((mm) => {
                    delete mm.logicalBox;
                });
            });
        }
    }

	setPassState(st,location) {
        var oldState = this.passState;
        if (oldState != st) {
            this.stateRepCount = 0;
        } else {
            this.stateRepCount += 1;
        }

        var msg = location + ': passState '+this.passState+'=>'+st;
        if (this.stateRepCount > 0) {
            msg += ' ('+this.stateRepCount+')';
        }
		console.log(msg);
		this.passState = st;
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

    get score() {
        return this._score;
    }

    set score(score) {
        var shouldReset = false;
        if (this._score) {
            shouldReset = true;
        }
        this.setPassState(suiLayoutBase.passStates.initial,'load score');
        this.dirty=true;
        this._score = score;
        if (shouldReset) {
            if (this.measureMapper) {
                this.measureMapper.loadScore();
            }
            this.setViewport(true);
        }
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

		$(this.renderer.getContext().svg).find('g.' + measure.getClassId()).remove();
		measure.setYTop(0,'unrender');
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
			$(this.renderer.getContext().svg).find('g.' + modifier.attrs.id).remove();
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
            if (!startNote || !endNote) {
                console.log('missing modifier...');
                return;
            }

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
            svgHelpers.line(this.svg,0,y,this.score.layout.pageWidth/this.score.layout.svgScale,y,
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
        this.replaceQ.forEach((change) => {
            var system = new VxSystem(this.context, change.measure.staffY, change.measure.lineIndex,this.score);
            system.renderMeasure(change.staff.staffId, change.measure);
            system.renderEndings();

            // Fix a bug: measure change needs to stay true so we recaltulate the width
            change.measure.changed = true;
            if (this.measureMapper) {
                this.measureMapper.mapMeasure(change.staff,change.measure);
            }
        });
        this.replaceQ = [];
    }

    _adjustHeight() {
        var curPages = this._score.layout.pages;
        // suiLayoutAdjuster.adjustHeight(this._score,this.renderer,this.pageHeight/this.svgScale);
        if (this._score.layout.pages  != curPages) {
            this.setViewport(false);
            this.setPassState(suiLayoutBase.passStates.initial,'render 2');
            // Force the viewport to update the page size
            // $('body').trigger('forceResizeEvent');
        } else {
            this.setPassState(suiLayoutBase.passStates.adjustY,'render 2');
        }
    }

	render() {
        if (this._resetViewport) {
            this.setViewport(true);
            this._resetViewport = false;
        }

		// layout iteratively until we get it right, adjusting X each time.
		var params = {useY:false,useX:false};
		if (this.passState == suiLayoutBase.passStates.pass || this.passState == suiLayoutBase.passStates.incomplete) {
			params.useX=true;
            params.useY=true;
		    suiLayoutAdjuster.adjustWidths(this._score,this.renderer);
		}
		if ((this.passState == suiLayoutBase.passStates.clean) ||
            (this.passState == suiLayoutBase.passStates.adjustY) ||
		    (this.passState == suiLayoutBase.passStates.replace) ||
            (this.passState == suiLayoutBase.passStates.redrawMain)) {
			params.useY=true;
			params.useX=true;
		}


        if (suiLayoutBase.passStates.replace == this.passState) {
            this._replaceMeasures();
        } else {
           this.layout(params);
        }

        if (this.passState == suiLayoutBase.passStates.incomplete) {
            return;
        }

        if (this.passState == suiLayoutBase.passStates.initial) {
            suiLayoutAdjuster.adjustWidths(this._score,this.renderer);
            suiLayoutAdjuster.justifyWidths(this._score,this.renderer,this.pageMarginWidth);
        }

        this._drawPageLines();

		if (this.passState == suiLayoutBase.passStates.replace) {
			this.dirty=false;
			return;
		}

        // if (this.passState == suiLayoutBase.passStates.redrawMain) {
        if (params.useX == true) {
            if (this.score.layout.pages != this.viewportPages) {
                this.setViewport(true);
                this.setPassState(suiLayoutBase.passStates.adjustY,
                    'page change reset viewport - re-render pages');
                return;
            }

            this.dirty=false;

            this.setPassState(suiLayoutBase.passStates.clean,'render complete');
            this.numberMeasures();
            // this.shadowRender = true;
            this.partialRender = true;
            return;
        }

        this.dirty=true;
        this.setPassState(suiLayoutBase.passStates.pass,'render 3');
        console.log('layout after pass: pstate pass');
	}
}
