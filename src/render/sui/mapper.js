// ## suiMapper
// Map the notes in the svg so they can respond to events and interact
// with the mouse/keyboard
// eslint-disable-next-line no-unused-vars
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
    this.modifierSuggestion = -1;
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
    this.selections = [];
  }

  // ### _clearMeasureArtifacts
  // clear the measure from the measure and note maps so we can rebuild it.
  clearMeasureMap(staff, measure) {
    const selector = { staff: measure.measureNumber.staffId, measure: measure.measureNumber.measureIndex };
    const measureKey = SmoSelector.getMeasureKey(selector);
    if (this.measureMap[measureKey]) {
      const nkeys = Object.keys(this.measureMap[measureKey].keys);
      nkeys.forEach((key) => {
        delete this.measureNoteMap[key];
      });

      delete this.measureMap[measureKey];
    }
    // Unselect selections in this measure so we can reselect them when re-tracked
    const ar = [];
    this.selections.forEach((selection) => {
      if (selection.selector.staff !== selector.staff || selection.selector.measure !== selector.measure) {
        ar.push(selection);
      }
    });
    this.selections = ar;
  }

  deleteMeasure(selection) {
    const selCopy = this._copySelectionsByMeasure(selection.selector.staff, selection.selector.measure)
      .selectors;
    this.clearMeasureMap(selection.staff, selection.measure);
    if (selCopy.length) {
      selCopy.forEach((selector) => {
        const nsel = JSON.parse(JSON.stringify(selector));
        if (selector.measure === 0) {
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
  _updateNoteModifier(selection, modMap, modifier, ix) {
    if (!modMap[modifier.attrs.id]) {
      this.modifierTabs.push({
        modifier,
        selection,
        box: svgHelpers.logicalToClient(this.renderer.svg, modifier.logicalBox, this.scroller),
        index: ix
      });
      ix += 1;
      modMap[modifier.attrs.id] = {
        exists: true
      };
    }
    return ix;
  }

  _updateModifiers() {
    let ix = 0;
    this.modifierTabs = [];
    this.modifierBoxes = [];
    const modMap = {};
    this.renderer.score.scoreText.forEach((modifier) => {
      if (!modMap[modifier.attrs.id]) {
        this.modifierTabs.push({
          modifier,
          selection: null,
          box: svgHelpers.logicalToClient(this.renderer.svg, modifier.logicalBox, this.scroller),
          index: ix
        });
        ix += 1;
      }
    });
    this.renderer.score.textGroups.forEach((modifier) => {
      if (!modMap[modifier.attrs.id] && modifier.logicalBox) {
        this.modifierTabs.push({
          modifier,
          selection: null,
          box: svgHelpers.logicalToClient(this.renderer.svg, modifier.logicalBox, this.scroller),
          index: ix
        });
        ix += 1;
      }
    });
    const keys = Object.keys(this.measureNoteMap);
    keys.forEach((selKey) => {
      const selection = this.measureNoteMap[selKey];
      selection.staff.modifiers.forEach((modifier) => {
        if (SmoSelector.contains(selection.selector, modifier.startSelector, modifier.endSelector)) {
          if (!modMap[modifier.attrs.id]) {
            if (modifier.logicalBox) {
              this.modifierTabs.push({
                modifier,
                selection,
                box: svgHelpers.logicalToClient(this.renderer.svg, modifier.logicalBox, this.scroller),
                index: ix
              });
              ix += 1;
              modMap[modifier.attrs.id] = { exists: true };
            }
          }
        }
      });
      selection.measure.modifiers.forEach((modifier) => {
        if (modifier.attrs.id
          && !modMap[modifier.attrs.id]
          && modifier.renderedBox) {
          this.modifierTabs.push({
            modifier,
            selection,
            box: svgHelpers.adjustScroll(modifier.renderedBox, this.scroller.netScroll),
            index: ix
          });
          ix += 1;
          modMap[modifier.attrs.id] = {
            exists: true
          };
        }
      });
      selection.note.textModifiers.forEach((modifier) => {
        if (modifier.logicalBox) {
          ix = this._updateNoteModifier(selection, modMap, modifier, ix);
        }
      });

      selection.note.graceNotes.forEach((modifier) => {
        ix = this._updateNoteModifier(selection, modMap, modifier, ix);
      });
    });
  }
  // ### _getClosestTick
  // given a musical selector, find the note artifact that is closest to it,
  // if an exact match is not available
  _getClosestTick(selector) {
    let tickKey = '';
    const measureKey = Object.keys(this.measureNoteMap).find((k) =>
      SmoSelector.sameMeasure(this.measureNoteMap[k].selector, selector)
        && this.measureNoteMap[k].selector.tick === 0);
    tickKey = Object.keys(this.measureNoteMap).find((k) =>
      SmoSelector.sameNote(this.measureNoteMap[k].selector, selector));
    const firstObj = this.measureNoteMap[Object.keys(this.measureNoteMap)[0]];

    if (tickKey) {
      return this.measureNoteMap[tickKey];
    }
    if (measureKey) {
      return this.measureNoteMap[measureKey];
    }
    return firstObj;
  }

  // ### _setModifierBoxes
  // Create the DOM modifiers for the lyrics and other modifiers
  _setModifierBoxes(measure) {
    measure.voices.forEach((voice) => {
      voice.notes.forEach((smoNote) =>  {
        const el = this.renderer.svg.getElementById(smoNote.renderId);
        if (el) {
          svgHelpers.updateArtifactBox(this.renderer.svg, el, smoNote, this.scroller);
          // TODO: fix this, only works on the first line.
          smoNote.getModifiers('SmoLyric').forEach((lyric) => {
            if (lyric.getText().length || lyric.isHyphenated()) {
              lyric.selector = '#' + smoNote.renderId + ' ' + lyric.getClassSelector();
              svgHelpers.updateArtifactBox(this.renderer.svg, $(lyric.selector)[0], lyric, this.scroller);
            }
          });
          smoNote.graceNotes.forEach((g) => {
            var gel = this.context.svg.getElementById('vf-' + g.renderedId);
            $(gel).addClass('grace-note');
            svgHelpers.updateArtifactBox(this.renderer.svg, gel, g, this.scroller);
          });
          smoNote.textModifiers.forEach((modifier) => {
            const modEl = $('.' + modifier.attrs.id);
            if (modifier.logicalBox && modEl.length) {
              svgHelpers.updateArtifactBox(this.renderer.svg, modEl[0], modifier, this.scroller);
            }
          });
        }
      });
    });
  }

  // ### updateMeasure
  // A measure has changed.  Update the music geometry for it
  mapMeasure(staff, measure, printing) {
    let voiceIx = 0;
    let selectedTicks = 0;
    let selectionChanged = false;
    let vix = 0;
    if (!measure.logicalBox) {
      return;
    }
    measure.renderedBox = svgHelpers.logicalToClient(this.renderer.svg, measure.logicalBox, this.scroller);
    this._setModifierBoxes(measure);
    const timestamp = new Date().valueOf();
    // Keep track of any current selections in this measure, we will try to restore them.
    const sels = this._copySelectionsByMeasure(staff.staffId, measure.measureNumber.measureIndex);
    this.clearMeasureMap(staff, measure);
    vix = measure.getActiveVoice();
    sels.selectors.forEach((sel) => {
      sel.voice = vix;
    });

    measure.voices.forEach((voice) => {
      let tick = 0;
      voice.notes.forEach((note) => {
        const selector = {
          staff: staff.staffId,
          measure: measure.measureNumber.measureIndex,
          voice: voiceIx,
          tick,
          pitches: []
        };
        // create a selection for the newly rendered note
        const selection = new SmoSelection({
          selector,
          _staff: staff,
          _measure: measure,
          _note: note,
          _pitches: [],
          box: svgHelpers.logicalToClient(this.renderer.svg, note.logicalBox, this.scroller),
          type: 'rendered'
        });
        // and add it to the map
        this._updateMeasureNoteMap(selection, printing);

        // If this note is the same location as something that was selected, reselect it
        if (sels.selectors.length && selection.selector.tick === sels.selectors[0].tick &&
          selection.selector.voice === vix) {
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
        } else if (selectedTicks > 0 && selectedTicks < sels.ticks && selection.selector.voice === vix) {
          // try to select the same length of music as was previously selected.  So a 1/4 to 2 1/8, both
          // are selected
          this.selections.push(selection);
          selectedTicks += selection.note.tickCount;
        } else if (this.selections.length === 0 && sels.selectors.length === 0) {
          this.selections = [selection];
          selectionChanged = true;
        }
        tick += 1;
      });
      voiceIx += 1;
    });
    // If there were selections on this measure, highlight them.
    if (selectionChanged) {
      this.highlightSelection();
    }
    layoutDebug.setTimestamp(layoutDebug.codeRegions.MAP, new Date().valueOf() - timestamp);
  }

  // ### updateMap
  // This should be called after rendering the score.  It updates the score to
  // graphics map and selects the first object.
  _updateMap() {
    this.mapping = true;
    let tickSelected = 0;
    const selCopy = this._copySelections();
    const ticksSelectedCopy = this._getTicksFromSelections();
    const firstSelection = this.getExtremeSelection(-1);
    this._updateModifiers();
    this.selections = [];

    // Try to restore selection.  If there were none, just select the fist
    // thing in the score
    const keys = Object.keys(this.measureNoteMap);
    if (keys.length && !selCopy.length) {
    // If there is nothing rendered, don't update tracker
      this.selections = [this.measureNoteMap[keys[0]]];
    }  else {
      if (!firstSelection) {
        return;
      }
      this._findClosestSelection(firstSelection.selector);
      const first = this.selections[0];
      tickSelected = first.note.tickCount;
      while (tickSelected < ticksSelectedCopy && first) {
        const delta = this._growSelectionRight(true);
        if (!delta)  {
          break;
        }
        tickSelected += delta;
      }
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
    let sel = 0;
    bb = svgHelpers.boxPoints(bb.x, bb.y, bb.width ? bb.width : 1, bb.height ? bb.height : 1);
    const artifacts = svgHelpers.findIntersectingArtifactFromMap(bb, this.measureNoteMap, this.scroller.scrollState);
    // TODO: handle overlapping suggestions
    if (!artifacts.length) {
      sel = svgHelpers.findIntersectingArtifact(bb, this.modifierTabs, this.scroller.scrollState);
      if (sel.length) {
        sel = sel[0];
        this._setModifierAsSuggestion(bb, sel);
      }
      return;
    }
    const artifact = artifacts[0];
    this._setArtifactAsSuggestion(bb, artifact);
  }
  _updateMeasureNoteMap(artifact, printing) {
    const noteKey = SmoSelector.getNoteKey(artifact.selector);
    const measureKey = SmoSelector.getMeasureKey(artifact.selector);
    const activeVoice = artifact.measure.getActiveVoice();
    if (artifact.selector.voice !== activeVoice && !artifact.note.fillStyle && !printing) {
      const vvv = artifact.selector.voice;
      const r = 128 + ((vvv * 32767 | vvv * 157) % 127);
      const g = 128 / vvv;
      const b = 128 - ((vvv * 32767 | vvv * 157) % 127);
      const fill = 'rgb(' + r + ',' + g + ',' + b + ')';
      $('#' + artifact.note.renderId).find('.vf-notehead path').each((ix, el) => {
        el.setAttributeNS('', 'fill', fill);
      });
    }
    // not has not been drawn yet.
    if (!artifact.box) {
      return;
    }
    if (!this.measureNoteMap[noteKey]) {
      this.measureNoteMap[noteKey] = artifact;
      artifact.scrollBox = { x: artifact.box.x,
        y: artifact.measure.renderedBox.y };
    } else {
      const mm = this.measureNoteMap[noteKey];
      mm.scrollBox = { x: Math.min(
        artifact.box.x, mm.x), y: Math.min(artifact.measure.renderedBox.y, mm.y) };
    }

    if (!this.measureMap[measureKey]) {
      this.measureMap[measureKey] = { keys: {} };
      this.measureMap[measureKey].keys[noteKey] = true;
    } else {
      const measureHash = this.measureMap[measureKey].keys;
      if (!measureHash[noteKey]) {
        measureHash[noteKey] = true;
      }
    }
  }
}
