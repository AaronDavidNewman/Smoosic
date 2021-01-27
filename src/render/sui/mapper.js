// ## suiMapper
// Map the notes in the svg so they can respond to events and interact
// with the mouse/keyboard
class suiMapper {
  constructor(renderer, scroller, pasteBuffer) {
    // renderer renders the music when it changes
    this.renderer = renderer;

    // measure to selector map
    this.measureMap = {};
    this.measureNoteMap = {}; // Map for tracker
    this.scroller = scroller;

    // notes currently selected.  Something is always selected
    this.selections = [];
    // modifiers (text etc.) that have been selected
    this.modifierSelections = [];
    // all the modifiers
    this.modifierTabs = [];
    // the index of the currently selected modifier
    this.modifierIndex = -1;
    // The list of modifiers near the current selection
    this.localModifiers = [];
    // mouse-over that might be selected soon
    this.modifierSuggestion=-1;
    this.suggestion = {};
    // index if a single pitch of a chord is selected
    this.pitchIndex = -1;
    // the current selection, which is also the copy/paste destination
    this.pasteBuffer = pasteBuffer;
  }

  // ### loadScore
  // We are loading a new score.  clear the maps so we can rebuild them after
  // rendering
  loadScore() {
    this.measureMap = {};
    this.measureNoteMap = {};
    this.clearModifierSelections();
    this.selections=[];
  }

  // ### _clearMeasureArtifacts
  // clear the measure from the measure and note maps so we can rebuild it.
  clearMeasureMap(staff, measure) {
    var selector = {staff:measure.measureNumber.staffId,measure:measure.measureNumber.measureIndex};
    var measureKey = SmoSelector.getMeasureKey(selector);
    if (this.measureMap[measureKey]) {
      const nkeys = Object.keys(this.measureMap[measureKey].keys);
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
    console.log('removing '+selection.selector.staff+'/'+selection.selector.measure);
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

  updateMap() {
    this._updateMap();
  }

    // ### _getClosestTick
    // given a musical selector, find the note artifact that is closest to it,
    // if an exact match is not available
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

  // ### updateMeasure
  // A measure has changed.  Update the music geometry for it
  mapMeasure(staff, measure, printing) {
    if (!measure.renderedBox) {
        return;
    }
    // Keep track of any current selections in this measure, we will try to restore them.
    var sels = this._copySelectionsByMeasure(staff.staffId, measure.measureNumber.measureIndex);
    this.clearMeasureMap(staff,measure);
    var vix = measure.getActiveVoice();
    sels.selectors.forEach((sel) => {
        sel.voice = vix;
    });

    // keep track of the scroll position when we render the music.
    this.scroller.setScrollInitial();

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

        var voice = measure.getActiveVoice();

        // create a selection for the newly rendered note
        var selection = new SmoSelection({
          selector: selector,
          _staff: staff,
          _measure: measure,
          _note: note,
          _pitches: [],
          box: svgHelpers.adjustScroll(note.renderedBox,this.scroller.netScroll),
          type: 'rendered'
        });
        // and add it to the map
        this._updateMeasureNoteMap(selection, printing);

        // If this note is the same location as something that was selected, reselect it
        if (sels.selectors.length && selection.selector.tick == sels.selectors[0].tick &&
          selection.selector.voice == vix) {
          this.selections.push(selection);
          // Reselect any pitches.
          if (sels.selectors[0].pitches.length > 0) {
            sels.selectors[0].pitches.forEach((pitchIx) => {
              if (selection.pitches.length > pitchIx) {
                selection.selector.pitches.push(pitchIx);
              }
            });
          }
          selectedTicks += selection.note.tickCount;
          selectionChanged = true;
        } else if (selectedTicks > 0 && selectedTicks < sels.ticks && selection.selector.voice == vix) {
          // try to select the same length of music as was previously selected.  So a 1/4 to 2 1/8, both
          // are selected
          this.selections.push(selection);
          selectedTicks += selection.note.tickCount;
        } else if (this.selections.length == 0 && (sels.selectors.length == 0)) {
          this.selections=[selection];
          selectionChanged=true;
        }
        tick += 1;
      });
      voiceIx += 1;
    });
    // If there were selections on this measure, highlight them.
    if (selectionChanged) {
        this.highlightSelection();
    }
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
    // If there is nothing rendered, don't update tracker
      this.selections = [this.measureNoteMap[keys[0]]];
    }  else {
      if (!firstSelection) {
        return;
      }
      this._findClosestSelection(firstSelection.selector);
      var first = this.selections[0];
      var tickSelected = first.note.tickCount;
      while (tickSelected < ticksSelectedCopy && first) {
        var delta = this._growSelectionRight(true);
        if (!delta)  {
          break;
        }
        tickSelected += delta;
      }
      // selCopy.forEach((sel) => this._findClosestSelection(sel));
    }
    this.highlightSelection();
    this._createLocalModifiersList();
    // Is this right?  Don't update the past buffer with data until the display is redrawn
    // because some of the selections may not exist in the score.
    if (this.renderer.isDirty === false) {
      this.pasteBuffer.clearSelections();
  		this.pasteBuffer.setSelections(this.score, this.selections);
    }
    this.mapping = false;
  }

    // ### intersectingArtifact
    // given a bounding box, find any rendered elements that intersect with it
    intersectingArtifact(bb) {
        bb = svgHelpers.boxPoints(bb.x,bb.y,bb.width ? bb.width : 1 ,bb.height ? bb.height : 1);
        var artifacts = svgHelpers.findIntersectingArtifactFromMap(bb,this.measureNoteMap,this.scroller.netScroll);
        // TODO: handle overlapping suggestions
        if (!artifacts.length) {
            var sel = svgHelpers.findIntersectingArtifact(bb,this.modifierTabs,this.scroller.netScroll);
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

}
