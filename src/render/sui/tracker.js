
class TrackerBase {
}

// ## suiTracker
// A tracker maps the UI elements to the logical elements ,and allows the user to
// move through the score and make selections, for navigation and editing.
//
// ### See also:
// `suiBaseLayout`, `controller`, `menu`
// ### class methods:
// ---
class suiTracker extends suiMapper {
	constructor(layout,scroller) {
        super(layout,scroller)
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

  replaceSelectedMeasures() {
      var mm = SmoSelection.getMeasureList(this.selections);
      this.layout.addToReplaceQueue(mm);
  }

  setDialogModifier(notifier) {
    this.modifierDialogFactory = notifier;
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
        // el = $(modifier.selector)[0];
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
          box:svgHelpers.adjustScroll(modifier.renderedBox,this.scroller.netScroll),
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
  					box:svgHelpers.adjustScroll(modifier.renderedBox,this.scroller.netScroll),
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
					if (!modMap[modifier.attrs.id]) {
                        if (modifier.renderedBox) {
    						this.modifierTabs.push({
    							modifier: modifier,
    							selection: selection,
    							box:svgHelpers.adjustScroll(modifier.renderedBox,this.scroller.netScroll),
    							index:ix
    						});
    						ix += 1;
    						modMap[modifier.attrs.id] = {
    							exists: true
    						};
                        }
					}
				}
			});
			selection.measure.modifiers.forEach((modifier) => {
				if (modifier.attrs.id && !modMap[modifier.attrs.id]
                   && modifier.renderedBox) {
					this.modifierTabs.push({
						modifier: modifier,
						selection: selection,
						box:svgHelpers.adjustScroll(modifier.renderedBox,this.scroller.netScroll),
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


  // ### musicCursor
  // the little birdie that follows the music as it plays
  musicCursor(selector) {
    var key = SmoSelector.getNoteKey(selector);
    if (this.measureNoteMap[key]) {
      var measureSel = SmoSelection.measureSelection(this.layout.score,
        this.layout.score.staves.length-1,selector.measure);
      var measure = measureSel.measure;
      var mbox = measure.renderedBox;

      var pos = this.measureNoteMap[key].scrollBox;
      // pos.y = measureSel.measure.renderedBox.y;
      var b = htmlHelpers.buildDom;
      var r = b('span').classes('birdy icon icon-arrow-down').attr('id','birdy');
      $('.workspace #birdy').remove();
      var rd = r.dom();
      var y = pos.y - this.scroller.netScroll.y;
      var x = pos.x - this.scroller.netScroll.x;
      $(rd).css('top',y).css('left',x);
      $('.workspace').append(rd);
      // todo, need lower right for x
      var measureRight = mbox.x + mbox.width;
      var measureBottom = mbox.y +
        mbox.height;
      this.scroller.scrollVisibleBox(svgHelpers.boxPoints(
        mbox.x,mbox.y,mbox.width,mbox.height));
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
        if (!el) {
            console.warn('no element to box');
            return;
        }
        svgHelpers.updateArtifactBox(svg,el,smoNote);

        // removed lyrics - we don't select those directly
        // so no need to track them.
    }

    _updateMeasureNoteMap(artifact) {
        var noteKey = SmoSelector.getNoteKey(artifact.selector);
        var measureKey = SmoSelector.getMeasureKey(artifact.selector);
        var activeVoice = artifact.measure.getActiveVoice();
        if (artifact.selector.voice != activeVoice) {
            $('#'+artifact.note.renderId).find('.vf-notehead path').each(function(ix,el) {
                el.setAttributeNS('', 'fill', 'rgb(128,128,128)');
            });
        }

        // not has not been drawn yet.
        if (!artifact.box) {
            return;
        }

        if (!this.measureNoteMap[noteKey]) {
            this.measureNoteMap[noteKey] = artifact;
            artifact.scrollBox = {x:artifact.box.x - this.scroller.netScroll.x,y:artifact.measure.renderedBox.y - this.scroller.netScroll.y};
        } else {
            var mm = this.measureNoteMap[noteKey];
            mm.scrollBox = {x:Math.min(artifact.box.x - this.scroller.netScroll.x,mm.x),y:Math.min(artifact.measure.renderedBox.y - this.scroller.netScroll.y,mm.y)};
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



	static stringifyBox(box) {
		return '{x:' + box.x + ',y:' + box.y + ',width:' + box.width + ',height:' + box.height + '}';
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
        if (targetMeasure && targetMeasure.measure && targetMeasure.measure.voices.length <= scopyMeasure.voice) {
            scopyMeasure.voice = 0;
        }
		if (targetMeasure && targetMeasure.measure) {
			scopyMeasure.tick = (offset < 0) ? targetMeasure.measure.voices[scopyMeasure.voice].notes.length - 1 : 0;
		}

		if (testSelection.measure.voices.length > scopyTick.voice &&
            testSelection.measure.voices[scopyTick.voice].notes.length > scopyTick.tick && scopyTick.tick >= 0) {
            if (testSelection.selector.voice != testSelection.measure.getActiveVoice()) {
                scopyTick.voice = testSelection.measure.getActiveVoice();
                testSelection = this._getClosestTick(scopyTick);
                return testSelection.selector;
            }
			return scopyTick;
		} else if (targetMeasure &&
			scopyMeasure.measure < testSelection.staff.measures.length && scopyMeasure.measure >= 0) {
			return scopyMeasure;
		}
		return testSelection.selector;
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

    // if we are being moved right programmatically, avoid playing the selected note.
	moveSelectionRight(evKey,skipPLay) {
		if (this.selections.length == 0) {
			return;
		}
		var nselect = this._getOffsetSelection(1);
		this._replaceSelection(nselect,skipPLay);
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
	}

    setSelection(selection) {
        var selObj = this._getClosestTick(selection);
        if (selObj) {
			this.selections = [selObj];
		}
		this.highlightSelection();
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

	_replaceSelection(nselector,skipPlay) {
		var artifact = SmoSelection.noteSelection(this.score, nselector.staff, nselector.measure, nselector.voice, nselector.tick);
        if (!artifact) {
            artifact = SmoSelection.noteSelection(this.score, nselector.staff, nselector.measure, 0, nselector.tick);
        }
        if (!artifact) {
            artifact = SmoSelection.noteSelection(this.score, nselector.staff, nselector.measure, 0,0);
        }
        if (!artifact) {
            console.log('warn: selection disappeared, default to start');
            artifact = SmoSelection.noteSelection(this.score,0,0,0,0);
        }
        if (!skipPlay) {
            suiOscillator.playSelectionNow(artifact);
        }

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
			return;
		} else if (ev.type === 'click') {
      this.clearModifierSelections(); // if we click on a non-modifier, clear the
      // modifier selections
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

    var preselected = this.selections[0] ? SmoSelector.sameNote(this.suggestion.selector,this.selections[0].selector) && this.selections.length == 1 : false;

    if (preselected && this.selections[0].note.pitches.length > 1) {
        this.pitchIndex =  (this.pitchIndex + 1) % this.selections[0].note.pitches.length;
        this.selections[0].selector.pitches = [this.pitchIndex];
    } else {
        this.selections = [this.suggestion];
    }
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
		var box = svgHelpers.adjustScroll(svgHelpers.smoBox(headEl.getBoundingClientRect()),
          this.scroller.invScroll);
		this._drawRect(box, 'staffModifier');
	}

  _highlightActiveVoice(selection) {
    var selector = selection.selector;
    for (var i =1;i<=4;++i) {
        var cl = 'v'+i.toString()+'-active';
        $('body').removeClass(cl);
    }
    var cl = 'v'+(selector.voice + 1).toString()+'-active';
    $('body').addClass(cl);
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
            this._highlightActiveVoice(this.selections[0]);
			return;
		}
		this.pitchIndex = -1;
		this.eraseAllSelections();
		if (this.selections.length === 1 && this.selections[0].box) {
			this._checkBoxOffset();
			this._drawRect(this.selections[0].box, 'selection');
            this._highlightActiveVoice(this.selections[0]);
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
            this._highlightActiveVoice(sel);
			prevSel = sel;
		}
		boxes.push(curBox);
		this._drawRect(boxes, 'selection');
	}
  _suggestionParameters(box,strokeName) {
    const outlineStroke = suiTracker.strokes[strokeName];
    return {
      context: this.context, box: box,classes: strokeName,
         outlineStroke, scroller: this.scroller
    }
  }

	_drawRect(bb, stroke) {
    svgHelpers.outlineRect(this._suggestionParameters(bb,stroke));
	}
}
