
class TrackerBase {
}

// ## suiTracker
// A tracker maps the UI elements to the logical elements ,and allows the user to
// move through the score and make selections, for navigation and editing.
//
// ### Usage:
// `` javascript ``
// `new suiTracker(layout)`
//
// ### See also:
// `SuiSimpleLayout`, `controller`, `menu`
// ### class methods:
// ---
class suiTracker {
	constructor(layout) {
		this.layout = layout;
        this.measureMap = {};
        this.measureNoteMap = {}; // Map for tracke

        this._scroll = {x:0,y:0};
        this._scrollInitial = {x:0,y:0};
	    var scroller = $('.musicRelief');
	    this._offsetInitial = {x:$(scroller).offset().left,y:$(scroller).offset().top};

		this.selections = [];
        this.modifierSelections = [];
		this.modifierTabs = [];
		this.modifierIndex = -1;
        this.localModifiers = [];
		this.modifierSuggestion=-1;
		this.suggestion = {};
		this.pitchIndex = -1;
		this.pasteBuffer = new PasteBuffer();
        this.viewport = svgHelpers.boxPoints(
          $('.musicRelief').offset().left,
          $('.musicRelief').offset().top,
          $('.musicRelief').width(),
          $('.musicRelief').height());
	}

    handleScroll(x,y) {
        this._scroll = {x:x,y:y};
        this.viewport = svgHelpers.boxPoints(
          $('.musicRelief').offset().left,
          $('.musicRelief').offset().top,
          $('.musicRelief').width,
          $('.musicRelief').height());

    }

    scrollOffset(x,y) {
        var cur = {x:this._scroll.x,y:this._scroll.y};
        setTimeout(function() {
            if (x) {
                $('.musicRelief')[0].scrollLeft = cur.x + x;
            }
            if (y) {
                $('.musicRelief')[0].scrollTop = cur.y + y;
            }
        },1);
    }

    get netScroll() {
		var xoffset = $('.musicRelief').offset().left - this._offsetInitial.x;
		var yoffset = $('.musicRelief').offset().top - this._offsetInitial.y;
        return {x:this._scroll.x - (this._scrollInitial.x + xoffset),y:this._scroll.y - (this._scrollInitial.y + yoffset)};
    }

    _fullRenderPromise() {
        var self = this;
        return new Promise((resolve) => {
            var f = function() {
                setTimeout(function() {
                    if (self.layout.passState === suiLayoutBase.passStates.clean) {
                        resolve();
                    } else {
                        f();
                    }
                },50);
            }
            f();
        });
    }

    // ### _checkBoxOffset
	// If the mapped note and actual note don't match, re-render the notes so they do.
	// Otherwise the selections are off.
	_checkBoxOffset() {
		var note = this.selections[0].note;
		var r = note.renderedBox;
		var b = this.selections[0].box;
        var preventScroll = $('body').hasClass('modal');

		if (r.y != b.y || r.x != b.x) {

            if (this.layout.passState == suiLayoutBase.passStates.replace ||
                this.layout.passState == suiLayoutBase.passStates.clean) {
                console.log('tracker: rerender conflicting map');
    			this.layout.remapAll();
            }
            if (!preventScroll) {
                console.log('prevent scroll conflicting map');
                $('body').addClass('modal');
                this._fullRenderPromise().then(() => {
                    $('body').removeClass('modal');
                });
            }
        }
	}

	// ### renderElement
	// the element the score is rendered on
	get renderElement() {
		return this.layout.renderer.elementId;
	}

	get score() {
		return this.layout.score;
	}

	get context() {
		return this.layout.renderer.getContext();
	}

	_copySelections() {
		var rv = [];
		this.selections.forEach((sel) => {
			rv.push(sel.selector)
		});
		return rv;
	}

    _copySelectionsByMeasure(staffIndex,measureIndex) {
		var rv = this.selections.filter((sel) => sel.selector.staff == staffIndex && sel.selector.measure == measureIndex);
        var ticks = rv.length < 1 ? 0 : rv.map((sel) => sel.note.tickCount).reduce((a,b) => a + b);
        var sels = [];
        rv.forEach((sel) => {
            sels.push(JSON.parse(JSON.stringify(sel.selector)));
        });
        return {ticks:ticks,selectors:sels};
	}

	_getTicksFromSelections() {
		var rv = 0;
		this.selections.forEach((sel) => {
			if (sel.note) {
				rv += sel.note.tickCount;
			}
		});
		return rv;
	}
    // Hack - lyric should be handled consistently
    _reboxTextModifier(modifier) {
        var el;
        if (modifier.attrs.type === 'SmoLyric') {
            el = $(modifier.selector)[0];
        } else if (modifier.attrs.type === 'SmoGraceNote') {
            el = this.context.svg.getElementById('vf-'+modifier.renderedId);
        } else {
            el = this.context.svg.getElementsByClassName(modifier.attrs.id)[0];
        }
        if (!el) {
            console.warn('cannot rebox element '+modifier.attrs.id);
            return;
        }
        svgHelpers.updateArtifactBox(this.context.svg,el,modifier);
    }

    _updateNoteModifier(selection,modMap,modifier,ix) {
        if (!modMap[modifier.attrs.id]) {
            this.modifierTabs.push({
                modifier: modifier,
                selection: selection,
                box:svgHelpers.adjustScroll(modifier.renderedBox,this.netScroll),
                index:ix
            });
            ix += 1;
            modMap[modifier.attrs.id] = {
                exists: true
            };
        }
        return ix;
    }

	_updateModifiers() {
		this.modifierTabs = [];
		this.modifierBoxes = [];
		var modMap = {};
		var ix=0;
        this.layout.score.scoreText.forEach((modifier) => {
            if (!modMap[modifier.attrs.id]) {
                this.modifierTabs.push({
                    modifier: modifier,
							selection: null,
							box:svgHelpers.adjustScroll(modifier.renderedBox,this.netScroll),
							index:ix
                });
                ix += 1;
            }
        });
        var keys = Object.keys(this.measureNoteMap);
		keys.forEach((selKey) => {
            var selection = this.measureNoteMap[selKey];
			selection.staff.modifiers.forEach((modifier) => {
				if (SmoSelector.contains(selection.selector, modifier.startSelector, modifier.endSelector)) {
					if (!modMap[modifier.id]) {
                        if (modifier.renderedBox) {
    						this.modifierTabs.push({
    							modifier: modifier,
    							selection: selection,
    							box:svgHelpers.adjustScroll(modifier.renderedBox,this.netScroll),
    							index:ix
    						});
    						ix += 1;
    						modMap[modifier.id] = {
    							exists: true
    						};
                        }
					}
				}
			});
			selection.measure.modifiers.forEach((modifier) => {
				if (modifier.id && !modMap[modifier.attrs.id]) {
					this.modifierTabs.push({
						modifier: modifier,
						selection: selection,
						box:svgHelpers.adjustScroll(modifier.renderedBox,this.netScroll),
						index:ix
					});
					ix += 1;
					modMap[modifier.attrs.id] = {
						exists: true
					};
				}
			});
			selection.note.textModifiers.forEach((modifier) => {
                ix = this._updateNoteModifier(selection,modMap,modifier,ix);
			});

            selection.note.graceNotes.forEach((modifier) => {
                ix = this._updateNoteModifier(selection,modMap,modifier,ix);
            });
		});
	}

    clearMusicCursor() {
        $('.workspace #birdy').remove();
    }

	scrollVisible(x,y) {
		var y = y - this.netScroll.y;
        var x = x - this.netScroll.x;
		var dx = 0;
		var dy = 0;
		if (y < 0) {
			dy = -y;
		} else if (y > this.viewport.height + this.viewport.y) {
			var offset = y - (this.viewport.height + this.viewport.y);
			dy = offset + this.viewport.height/2;
		}

		if (x < 0) {
			dx = -x;
		} else if (x > this.viewport.width + this.viewport.x) {
			var offset = x - (this.viewport.width + this.viewport.x);
			dx = offset + this.viewport.width -50;
		}
		if (dx != 0 || dy != 0) {
		    this.scrollOffset(dx,dy);
		}
	}

    musicCursor(selector) {
        var key = SmoSelector.getNoteKey(selector);
        if (this.measureNoteMap[key]) {
            var pos = this.measureNoteMap[key].scrollBox;
            var b = htmlHelpers.buildDom;
	        var r = b('span').classes('birdy icon icon-arrow-down').attr('id','birdy');
            $('.workspace #birdy').remove();
            var rd = r.dom();
            var y = pos.y - this.netScroll.y;
            var x = pos.x - this.netScroll.x;
            $(rd).css('top',y).css('left',x);
            $('.workspace').append(rd);
			this.scrollVisible(pos.x,pos.y);
        }
    }

    // ### selectModifierById
    // programatically select a modifier by ID.  Used by text editor.
    selectId(id) {
        this.modifierIndex = this.modifierTabs.findIndex((mm) =>  mm.modifier.attrs.id==id);
    }


    // used by remove dialogs to clear removed thing
    clearModifierSelections() {
        this.modifierSelections=[];
        this._createLocalModifiersList();
        this.modifierIndex = -1;
        this.eraseRect('staffModifier');
    }

	getSelectedModifier() {
        if (this.modifierSelections.length) {
            return this.modifierSelections[0];
        }
	}

    getSelectedModifiers() {
        return this.modifierSelections;
    }
    _addModifierToArray(ar) {
        ar.forEach((mod) => {
            if (mod.renderedBox) {
                this.localModifiers.push({selection:sel,modifier:mod,box:mod.renderedBox});
            }
        });
    }

    _createLocalModifiersList() {
        this.localModifiers = [];
        var staffSelMap = {};
        this.selections.forEach((sel) => {
            sel.note.getGraceNotes().forEach((gg) => {
                this.localModifiers.push({selection:sel,modifier:gg,box:gg.renderedBox});
            });
            sel.note.getModifiers('SmoDynamicText').forEach((dyn) => {
                this.localModifiers.push({selection:sel,modifier:dyn,box:dyn.renderedBox});
            });
            sel.measure.getModifiersByType('SmoVolta').forEach((volta) => {
                this.localModifiers.push({selection:sel,modifier:volta,box:volta.renderedBox});
            });
            sel.measure.getModifiersByType('SmoTempoText').forEach((tempo) => {
                this.localModifiers.push({selection:sel,modifier:tempo,box:tempo.renderedBox});
            });
            sel.staff.getModifiers().forEach((mod) => {
                if (SmoSelector.gteq(sel.selector,mod.startSelector) &&
                    SmoSelector.lteq(sel.selector,mod.endSelector) &&
                    !staffSelMap[mod.startSelector] && mod.renderedBox)  {
                    this.localModifiers.push({selection:sel,modifier:mod,box:mod.renderedBox});
                    // avoid duplicates
                    staffSelMap[mod.startSelector] = true;
                }
            });
        });
    }

	advanceModifierSelection(keyEv) {
		this.eraseRect('staffModifier');

        var offset = keyEv.key === 'ArrowLeft' ? -1 : 1;

		if (!this.modifierTabs.length) {
			return;
		}
		this.modifierIndex = this.modifierIndex + offset;
        this.modifierIndex = (this.modifierIndex == -2 && this.localModifiers.length) ?
            this.localModifiers.length - 1 : this.modifierIndex;
		if (this.modifierIndex >= this.localModifiers.length || this.modifierIndex < 0) {
			this.modifierIndex = -1;
            this.modifierSelections=[];
			return;
		}
        this.modifierSelections = [this.localModifiers[this.modifierIndex]];
		this._highlightModifier();
	}

	_findClosestSelection(selector) {
		var artifact = this._getClosestTick(selector);
		if (!artifact)
			return;
		if (this.selections.find((sel) => JSON.stringify(sel.selector)
				 === JSON.stringify(artifact.selector))) {
			return;
		}
		if (selector.pitches && selector.pitches.length && selector.pitches.length <= artifact.note.pitches.length) {
			// If the old selection had only a single pitch, try to recreate that.
			artifact.selector.pitches = JSON.parse(JSON.stringify(selector.pitches));
		}
		this.selections.push(artifact);
	}

    // ### _updateNoteBox
    // Update the svg to screen coordinates based on a change in viewport.
    _updateNoteBox(svg,smoNote,selector) {
        var el = svg.getElementById(smoNote.renderId);
        var cursorKey = '' + selector.measure + '-' + selector.tick;
        if (!el) {
            console.warn('no element to box');
            return;
        }
        svgHelpers.updateArtifactBox(svg,el,smoNote);

        // TODO: fix this, only works on the first line.
        smoNote.getModifiers('SmoLyric').forEach((lyric) => {
			var ar = Array.from(el.getElementsByClassName('vf-lyric'));
			ar.forEach((lbox) => {
                svgHelpers.updateArtifactBox(svg,lbox,lyric);
			});
		});
    }

    _updateMeasureNoteMap(artifact) {
        var noteKey = SmoSelector.getNoteKey(artifact.selector);
        var measureKey = SmoSelector.getMeasureKey(artifact.selector);

        if (!this.measureNoteMap[noteKey]) {
            this.measureNoteMap[noteKey] = artifact;
            artifact.scrollBox = {x:artifact.box.x - this.netScroll.x,y:artifact.measure.renderedBox.y - this.netScroll.y};
        } else {
            var mm = this.measureNoteMap[noteKey];
            mm.scrollBox = {x:Math.min(artifact.box.x - this.netScroll.x,mm.x),y:Math.min(artifact.measure.renderedBox.y - this.netScroll.y,mm.y)};
        }

        if (!this.measureMap[measureKey]) {
            this.measureMap[measureKey] = {keys:{}};
            this.measureMap[measureKey].keys[noteKey] = true;
        } else {
            var measureHash = this.measureMap[measureKey].keys;
            if (!measureHash[noteKey]) {
                measureHash[noteKey] = true;
            }

        }
    }

    loadScore() {
        this.measureMap = {};
        this.measureNoteMap = {};
        this.clearModifierSelections();
        this.selections=[];
    }

    // ### _clearMeasureArtifacts
    // clear the measure from the measure and note maps so we can rebuild it.
    clearMeasureMap(staff,measure) {
        var selector = {staff:measure.measureNumber.staffId,measure:measure.measureNumber.measureIndex};
        var measureKey = SmoSelector.getMeasureKey(selector);
        if (this.measureMap[measureKey]) {
            var nkeys = Object.keys(this.measureMap[measureKey].keys);
            nkeys.forEach((key) => {
                delete this.measureNoteMap[key];
            });

            delete this.measureMap[measureKey];
        }
        // Unselect selections in this measure so we can reselect them when re-tracked
        var ar = [];
        this.selections.forEach((selection) => {
            if (selection.selector.staff != selector.staff || selection.selector.measure != selector.measure) {
                ar.push(selection);
            }
        });
        this.selections = ar;
    }

    deleteMeasure(selection) {
        var selCopy = this._copySelectionsByMeasure(selection.selector.staff,selection.selector.measure)
            .selectors;

        this.clearMeasureMap(selection.staff,selection.measure);
        if (selCopy.length) {
            selCopy.forEach((selector) => {
                var nsel = JSON.parse(JSON.stringify(selector));
                if (selector.measure == 0) {
                    nsel.measure += 1;
                } else {
                    nsel.measure -= 1;
                }
                this.selections.push(this._getClosestTick(nsel));
            });
        }
    }



    // ### updateMeasure
    // A measure has changed.  Update the music geometry for it
    mapMeasure(staff,measure) {
        var sels = this._copySelectionsByMeasure(staff.staffId,measure.measureNumber.measureIndex);
        this.clearMeasureMap(staff,measure);

        var scroller = $('.musicRelief');
        this._scrollInitial = {x:$(scroller)[0].scrollLeft,y:$(scroller)[0].scrollTop};
        this._offsetInitial = {x:$(scroller).offset().left,y:$(scroller).offset().top};


        var voiceIx = 0;
        var selectionChanged = false;
        var selectedTicks = 0;
        measure.voices.forEach((voice) => {
            var tick = 0;
            voice.notes.forEach((note) => {
                var selector = {
                        staff: staff.staffId,
                        measure: measure.measureNumber.measureIndex,
                        voice: voiceIx,
                        tick: tick,
                        pitches: []
                    };

                var selection = new SmoSelection({
                            selector: selector,
                            _staff: staff,
                            _measure: measure,
                            _note: note,
                            _pitches: [],
                            box: svgHelpers.adjustScroll(note.renderedBox,this.netScroll),
                            type: 'rendered'
                        });
                this._updateMeasureNoteMap(selection);
                if (sels.selectors.length && selection.selector.tick == sels.selectors[0].tick) {
                    this.selections.push(selection);
                    selectedTicks += selection.note.tickCount;
                    selectionChanged = true;
                } else if (selectedTicks > 0 && selectedTicks < sels.ticks) {
                    this.selections.push(selection);
                    selectedTicks += selection.note.tickCount;
                }

                tick += 1;
            });
        });
        if (selectionChanged) {
            this.highlightSelection();
        }
        voiceIx += 1;
    }

	// ### updateMap
	// This should be called after rendering the score.  It updates the score to
	// graphics map and selects the first object.
	_updateMap() {
		console.log('update map');
        this.mapping = true;
		var notes = [].slice.call(this.renderElement.getElementsByClassName('vf-stavenote'));

		var selCopy = this._copySelections();
		var ticksSelectedCopy = this._getTicksFromSelections();
		var firstSelection = this.getExtremeSelection(-1);

		this._updateModifiers();
		this.selections = [];

        // Try to restore selection.  If there were none, just select the fist
        // thing in the score
        var keys = Object.keys(this.measureNoteMap);
		if (keys.length && !selCopy.length) {
			this.selections = [this.measureNoteMap[keys[0]]];
		}  else {
			this._findClosestSelection(firstSelection.selector);
            var first = this.selections[0];
			var tickSelected = first.note.tickCount;
			while (tickSelected < ticksSelectedCopy && first) {
				var delta = this.growSelectionRight();
				if (!delta)  {
					break;
				}
				tickSelected += delta;
			}
			// selCopy.forEach((sel) => this._findClosestSelection(sel));
		}
		this.highlightSelection();
        this._createLocalModifiersList();
		this.triggerSelection();
		this.pasteBuffer.clearSelections();
		this.pasteBuffer.setSelections(this.score, this.selections);
        this.mapping = false;
	}

	updateMap() {
        this._updateMap();
	}

	static stringifyBox(box) {
		return '{x:' + box.x + ',y:' + box.y + ',width:' + box.width + ',height:' + box.height + '}';
	}

	_getClosestTick(selector) {
        var measureKey = Object.keys(this.measureNoteMap).find((k) => {
            return SmoSelector.sameMeasure(this.measureNoteMap[k].selector, selector)
    				 && this.measureNoteMap[k].selector.tick === 0;
        });
        var tickKey = Object.keys(this.measureNoteMap).find((k) => {
            return SmoSelector.sameNote(this.measureNoteMap[k].selector,selector);
        });
		var firstObj = this.measureNoteMap[Object.keys(this.measureNoteMap)[0]];
		return tickKey ? this.measureNoteMap[tickKey]:
		    (measureKey ? this.measureNoteMap[measureKey] : firstObj);
	}

	// ### getExtremeSelection
	// Get the rightmost (1) or leftmost (-1) selection
	getExtremeSelection(sign) {
		var rv = this.selections[0];
		for (var i = 1; i < this.selections.length; ++i) {
			var sa = this.selections[i].selector;
			if (sa.measure * sign > rv.selector.measure * sign) {
				rv = this.selections[i];
			} else if (sa.measure === rv.selector.measure && sa.tick * sign > rv.selector.tick * sign) {
				rv = this.selections[i];
			}
		}
		return rv;
	}

	// ### _getOffsetSelection
	// Get the selector that is the offset of the first existing selection
	_getOffsetSelection(offset) {
		var increment = offset;
		var testSelection = this.getExtremeSelection(Math.sign(offset));
		var scopyTick = JSON.parse(JSON.stringify(testSelection.selector));
		var scopyMeasure = JSON.parse(JSON.stringify(testSelection.selector));
		scopyTick.tick += increment;
		scopyMeasure.measure += increment;
		var targetMeasure = SmoSelection.measureSelection(this.score, testSelection.selector.staff,
				scopyMeasure.measure);
		if (targetMeasure && targetMeasure.measure) {
			scopyMeasure.tick = (offset < 0) ? targetMeasure.measure.notes.length - 1 : 0;
		}

		if (testSelection.measure.notes.length > scopyTick.tick && scopyTick.tick >= 0) {
			return scopyTick;
		} else if (targetMeasure &&
			scopyMeasure.measure < testSelection.staff.measures.length && scopyMeasure.measure >= 0) {
			return scopyMeasure;
		}
		return testSelection.selector;
	}

	static unionRect(b1, b2) {
		return svgHelpers.unionRect(b1, b2);
	}

	get selectedArtifact() {
		for (var i = 0; i < this.selections.length; ++i) {
			var selection = this.selections[i];
			if (selection['artifact']) {
				return selection.artifact;
			}
		}
		return {};
	}

    getSelectedGraceNotes() {
        if (!this.modifierSelections.length) {
            return [];
        }
        var ff = this.modifierSelections.filter((mm) => {
            return mm.modifier.attrs.type == 'SmoGraceNote';
        });
        return ff;
    }

    isGraceNoteSelected() {
        if (this.modifierSelections.length) {
            var ff = this.modifierSelections.findIndex((mm)=> mm.modifier.attrs.type == 'SmoGraceNote');
            return ff >= 0;
        }
    }

    _growGraceNoteSelections(offset) {
        var far = this.modifierSelections.filter((mm)=> mm.modifier.attrs.type == 'SmoGraceNote');
        if (!far.length) {
            return;
        }
        var ix = (offset < 0) ? 0 : far.length-1;
        var sel = far[ix];
        var left = this.modifierTabs.filter((mt) => {
            return mt.modifier.attrs.type == 'SmoGraceNote' && SmoSelector.sameNote(mt.selection.selector,sel.selection.selector);
        });
        if (ix+offset < 0 || ix+offset >= left.length) {
            return;
        }
        this.modifierSelections.push(left[ix+offset]);
        this._highlightModifier();
    }

	growSelectionRight() {
        if (this.isGraceNoteSelected()) {
            this._growGraceNoteSelections(1);
            return 0;
        }
		var nselect = this._getOffsetSelection(1);
		// already selected
		var artifact = this._getClosestTick(nselect);
		if (!artifact) {
			return 0;
		}
		if (this.selections.find((sel) => SmoSelector.sameNote(sel.selector, artifact.selector))) {
			return 0;
		}
		// console.log('adding selection ' + artifact.note.id);

        if (!this.mapping) {
            suiOscillator.playSelectionNow(artifact);
        }

		this.selections.push(artifact);
		this.highlightSelection();
        this._createLocalModifiersList();
        return artifact.note.tickCount;
	}

	growSelectionLeft() {
        if (this.isGraceNoteSelected()) {
            this._growGraceNoteSelections(-1);
            return 0;
        }
		var nselect = this._getOffsetSelection(-1);
		// already selected
		var artifact = this._getClosestTick(nselect);
		if (!artifact) {
			return;
		}
		if (this.selections.find((sel) => SmoSelector.sameNote(sel.selector, artifact.selector))) {
			return;
		}

		// console.log('adding selection ' + artifact.note.id);
		this.selections.push(artifact);
        suiOscillator.playSelectionNow(artifact);
		this.highlightSelection();
        this._createLocalModifiersList();
        return artifact.note.tickCount;
	}

	moveSelectionRight() {
		if (this.selections.length == 0) {
			return;
		}
		var nselect = this._getOffsetSelection(1);
		this._replaceSelection(nselect);
	}

	moveSelectionLeft() {
		if (this.selections.length == 0) {
			return;
		}
		var nselect = this._getOffsetSelection(-1);
		this._replaceSelection(nselect);
	}
	moveSelectionLeftMeasure() {
		this._moveSelectionMeasure(-1);
	}
	moveSelectionRightMeasure() {
		this._moveSelectionMeasure(1);
	}
	moveSelectionOffset(offset) {
		var fcn = (offset >= 0 ? 'moveSelectionRight' : 'moveSelectionLeft');
		offset = (offset < 0) ? -1 * offset : offset;
		for (var i = 0; i < offset; ++i) {
			this[fcn]();
		}
	}

	_moveSelectionMeasure(offset) {
		var selection = this.getExtremeSelection(Math.sign(offset));
		selection = JSON.parse(JSON.stringify(selection.selector));
		selection.measure += offset;
		selection.tick = 0;
		var selObj = this._getClosestTick(selection);
		if (selObj) {
			this.selections = [selObj];
		}
		this.highlightSelection();
        this._createLocalModifiersList();
		this.triggerSelection();
	}

	_moveStaffOffset(offset) {
		if (this.selections.length == 0) {
			return;
		}

		var nselector = JSON.parse(JSON.stringify(this.selections[0].selector));
		nselector.staff = this.score.incrementActiveStaff(offset);
		this.selections = [this._getClosestTick(nselector)];
		this.highlightSelection();
        this._createLocalModifiersList();
		this.triggerSelection();
	}

	// ### _moveSelectionPitch
	// Suggest a specific pitch in a chord, so we can transpose just the one note vs. the whole chord.
	_moveSelectionPitch(index) {
		if (!this.selections.length) {
			return;
		}
		var sel = this.selections[0];
		var note = sel.note;
		if (note.pitches.length < 2) {
			this.pitchIndex = -1;
			return;
		}
		this.pitchIndex = (this.pitchIndex + index) % note.pitches.length;
		sel.selector.pitches = [];
		sel.selector.pitches.push(this.pitchIndex);
		this._highlightPitchSelection(note, this.pitchIndex);
	}
	moveSelectionPitchUp() {
		this._moveSelectionPitch(1);
	}
	moveSelectionPitchDown() {
		if (!this.selections.length) {
			return;
		}
		this._moveSelectionPitch(this.selections[0].note.pitches.length - 1);
	}

	moveSelectionUp() {
		this._moveStaffOffset(-1);
	}
	moveSelectionDown() {
		this._moveStaffOffset(1);
	}

	containsArtifact() {
		return this.selections.length > 0;
	}

	_replaceSelection(nselector) {
		var artifact = SmoSelection.noteSelection(this.score, nselector.staff, nselector.measure, nselector.voice, nselector.tick);
        if (!artifact) {
            console.log('warn: selection disappeared, default to start');
            artifact = SmoSelection.noteSelection(this.score,0,0,0,0);
        }
        suiOscillator.playSelectionNow(artifact);

        // clear modifier selections
        this.clearModifierSelections();
		this.score.setActiveStaff(nselector.staff);
        var mapKey = Object.keys(this.measureNoteMap).find((k) => {
            return SmoSelector.sameNote(this.measureNoteMap[k].selector, artifact.selector);
        });
        if (!mapKey) {
            return;
        }
		var mapped = this.measureNoteMap[mapKey];

		// If this is a new selection, remove pitch-specific and replace with note-specific
		if (!nselector['pitches'] || nselector.pitches.length==0) {
			this.pitchIndex = -1;
		}
		// console.log('adding selection ' + mapped.note.id);

		this.selections = [mapped];
		this.highlightSelection();
        this._createLocalModifiersList();
		this.triggerSelection();
	}

	getFirstMeasureOfSelection() {
		if (this.selections.length) {
			return this.selections[0].measure;
		}
		return null;
	}
	// ## measureIterator
	// Description: iterate over the any measures that are part of the selection
	getSelectedMeasures() {
		var set = [];
        var rv = [];
		this.selections.forEach((sel) => {
			var measure = SmoSelection.measureSelection(this.score, sel.selector.staff, sel.selector.measure).measure;
			var ix = measure.measureNumber.measureIndex;
			if (set.indexOf(ix) === -1) {
				set.push(ix);
				rv.push(measure);
			}
		});
        return rv;
	}

	_selectFromToInStaff(sel1,sel2) {
		this.selections=[];
        var order = [sel1,sel2].sort((a,b) => {return SmoSelector.lteq(a.selector,b.selector) ? -1 : 1});

        // TODO: we could iterate directly over the selectors, that would be faster
        Object.keys(this.measureNoteMap).forEach((k) => {
            var obj = this.measureNoteMap[k];
            if (SmoSelector.gteq(obj.selector,order[0].selector) && SmoSelector.lteq(obj.selector,order[1].selector)) {
                this.selections.push(obj);
            }
        });
	}
	_addSelection(selection) {
		var ar=this.selections.filter((sel) => {
			return SmoSelector.neq(sel.selector,selection.selector);
		});
        suiOscillator.playSelectionNow(selection);

		ar.push(selection);
		this.selections=ar;
	}

	selectSuggestion(ev) {
		if (!this.suggestion['measure']) {
			return;
		}
		// console.log('adding selection ' + this.suggestion.note.id);

		if (this.modifierSuggestion >= 0) {
			if (this['suggestFadeTimer']) {
			   clearTimeout(this.suggestFadeTimer);
    		}
			this.modifierIndex = -1;
            this.modifierSelections = [this.modifierTabs[this.modifierSuggestion]];
			this.modifierSuggestion = -1;
			this._highlightModifier();
			$('body').trigger('tracker-select-modifier');
			return;
		}

		if (ev.shiftKey) {
			var sel1 = this.getExtremeSelection(-1);
			if (sel1.selector.staff === this.suggestion.selector.staff) {
				var min = SmoSelector.gt(sel1.selector,this.suggestion.selector)  ? this.suggestion : sel1;
				var max = SmoSelector.lt(min.selector,this.suggestion.selector) ? this.suggestion : sel1;
				this._selectFromToInStaff(min,max);
                this._createLocalModifiersList();
				this.highlightSelection();
				return;
			}
		}

		if (ev.ctrlKey) {
			this._addSelection(this.suggestion);
            this._createLocalModifiersList();
			this.highlightSelection();
			return;
		}

        suiOscillator.playSelectionNow(this.suggestion);

        var preselected = SmoSelector.sameNote(this.suggestion.selector,this.selections[0].selector) && this.selections.length == 1;

		this.selections = [this.suggestion];
        if (preselected && this.modifierTabs.length) {
            var mods  = this.modifierTabs.filter((mm) => mm.selection && SmoSelector.sameNote(mm.selection.selector,this.selections[0].selector));
            if (mods.length) {
            this.modifierSelections[0] = mods[0];
            this.modifierIndex = mods[0].index;
            this._highlightModifier();
            return;
            }
        }
		this.score.setActiveStaff(this.selections[0].selector.staff);
		if (this.selections.length == 0)
			return;
		var first = this.selections[0];
		for (var i = 0; i < this.selections.length; ++i) {
			var selection = this.selections[i];
			this.highlightSelection();
		}
        this._createLocalModifiersList();
		this.triggerSelection();
	}

	static get strokes() {
		return {
			'suggestion': {
				'stroke': '#fc9',
				'stroke-width': 2,
				'stroke-dasharray': '4,1',
				'fill': 'none'
			},
			'selection': {
				'stroke': '#99d',
				'stroke-width': 2,
				'fill': 'none'
			},
			'staffModifier': {
				'stroke': '#933',
				'stroke-width': 2,
				'fill': 'none'
			}
		}
	}

	_setFadeTimer() {
		if (this['suggestFadeTimer']) {
			clearTimeout(this.suggestFadeTimer);
		}
		var tracker=this;
		this.suggestFadeTimer = setTimeout(function () {
				if (tracker.containsArtifact()) {
					tracker.eraseRect('suggestion');
					tracker.modifierSuggestion=-1;
				}
			}, 1000);
	}


    _setModifierAsSuggestion(bb,artifact) {

		this.modifierSuggestion = artifact.index;

		this._drawRect(artifact.box, 'suggestion');
		this._setFadeTimer();
	}
	_setArtifactAsSuggestion(bb, artifact) {
		var self = this;

		var sameSel =
			this.selections.find((ss) => SmoSelector.sameNote(ss.selector, artifact.selector));

		if (sameSel) {
			return ;
		}

		this.modifierSuggestion = -1;

		this.suggestion = artifact;
		this._drawRect(artifact.box, 'suggestion');
		this._setFadeTimer();
	}

	intersectingArtifact(bb) {
        bb = svgHelpers.boxPoints(bb.x,bb.y,bb.width ? bb.width : 1 ,bb.height ? bb.height : 1);
		var artifacts = svgHelpers.findIntersectingArtifactFromMap(bb,this.measureNoteMap,this.netScroll);
		// TODO: handle overlapping suggestions
		if (!artifacts.length) {
			var sel = svgHelpers.findIntersectingArtifact(bb,this.modifierTabs,this.netScroll);
			if (sel.length) {
				sel = sel[0];
				this._setModifierAsSuggestion(bb, sel);
			}
			return;
		}
		var artifact = artifacts[0];
		this._setArtifactAsSuggestion(bb, artifact);
		return;
	}

	eraseAllSelections() {
		var strokeKeys = Object.keys(suiTracker.strokes);
		strokeKeys.forEach((key) => {
			this.eraseRect(key);
		});
	}

	eraseRect(stroke) {
		$(this.renderElement).find('g.vf-' + stroke).remove();
	}

    _highlightModifier() {
        if (!this.modifierSelections.length) {
            return;
        }
        var box=null;
        this.modifierSelections.forEach((artifact) => {
            if (!box) {
                box = artifact.modifier.renderedBox;
            }
            else {
                box = svgHelpers.unionRect(box,artifact.modifier.renderedBox);
            }
        });
        this._drawRect(box, 'staffModifier');
	}

	_highlightPitchSelection(note, index) {
		this.eraseAllSelections();
		var noteDiv = $(this.renderElement).find('#' + note.renderId);
		var heads = noteDiv.find('.vf-notehead');
		if (!heads.length) {
			return;
		}
		var headEl = heads[index];
		var box = svgHelpers.smoBox(headEl.getBoundingClientRect());
		this._drawRect(box, 'staffModifier');
	}
	triggerSelection() {
		$('body').trigger('tracker-selection');
	}


	highlightSelection() {
        var grace = this.getSelectedGraceNotes();
        // If this is not a note with grace notes, logically unselect the grace notes
        if (grace.length) {
            if (!SmoSelector.sameNote(grace[0].selection.selector,this.selections[0].selector)) {
                this.clearModifierSelections();
            } else {
                this._highlightModifier();
                return;
            }
        }
		if (this.pitchIndex >= 0 && this.selections.length == 1 &&
			this.pitchIndex < this.selections[0].note.pitches.length) {
			this._highlightPitchSelection(this.selections[0].note, this.pitchIndex);
			return;
		}
		this.pitchIndex = -1;
		this.eraseAllSelections();
		if (this.selections.length === 1 && this.selections[0].box) {
			this._checkBoxOffset();
			this._drawRect(this.selections[0].box, 'selection');
			return;
		}
		var sorted = this.selections.sort((a, b) => SmoSelector.gt(a.selector,b.selector) ? 1 : -1);
		var prevSel = sorted[0];
        // rendered yet?
        if (!prevSel.box)
            return;
		var curBox = svgHelpers.smoBox(prevSel.box);
		var boxes = [];
		for (var i = 1; i < sorted.length; ++i) {
			var sel = sorted[i];
			var ydiff = Math.abs(prevSel.box.y - sel.box.y);
			if (sel.selector.staff === prevSel.selector.staff && ydiff < 1.0) {
				curBox = svgHelpers.unionRect(curBox, sel.box);
			} else {
				boxes.push(curBox);
				curBox = sel.box;
			}
			prevSel = sel;
		}
		boxes.push(curBox);
		this._drawRect(boxes, 'selection');
	}
	_outerSelection() {
		if (this.selections.length == 0)
			return null;
		var rv = this.selections[0].box;
		for (var i = 1; i < this.selections.length; ++i) {
			rv = suiTracker.unionRect(rv, this.selections[i].box);
		}
		return rv;
	}
	_drawRect(bb, stroke) {
		this.eraseRect(stroke);
		var grp = this.context.openGroup(stroke, stroke + '-');
		if (!Array.isArray(bb)) {
			bb = [bb];
		}
		bb.forEach((box) => {
            if (box) {
    			var strokes = suiTracker.strokes[stroke];
    			var strokeObj = {};
    			var margin = 5;
    			$(Object.keys(strokes)).each(function (ix, key) {
    				strokeObj[key] = strokes[key];
    			});
                box = svgHelpers.clientToLogical(this.context.svg, svgHelpers.adjustScroll(box,this.netScroll));
    			this.context.rect(box.x - margin, box.y - margin, box.width + margin * 2, box.height + margin * 2, strokeObj);
            }
		});
		this.context.closeGroup(grp);
	}
}
