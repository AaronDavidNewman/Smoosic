// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiScoreView, updateStaffModifierFunc } from './scoreView';
import { SmoScore, engravingFontType } from '../../smo/data/score';
import { SmoSystemStaffParams, SmoSystemStaff } from '../../smo/data/systemStaff';
import { SmoPartInfo } from '../../smo/data/partInfo';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoNote } from '../../smo/data/note';
import { KeyEvent, SvgBox, Pitch, PitchLetter } from '../../smo/data/common';
import { SmoRenderConfiguration } from './configuration';
import { SmoSystemGroup, SmoPageLayout, SmoGlobalLayout, SmoLayoutManager, SmoAudioPlayerSettings,
  SmoScorePreferences, SmoScoreInfo } from '../../smo/data/scoreModifiers';
import { SmoTextGroup } from '../../smo/data/scoreText';
import { SmoDynamicText, SmoNoteModifierBase, SmoGraceNote, SmoArticulation, 
  SmoOrnament, SmoLyric, SmoMicrotone, SmoArpeggio, SmoArpeggioType, SmoClefChange, 
  SmoTabNote} from '../../smo/data/noteModifiers';
import { SmoTempoText, SmoVolta, SmoBarline, SmoRepeatSymbol, 
  SmoRehearsalMark, SmoMeasureFormat, TimeSignature } from '../../smo/data/measureModifiers';
import { UndoBuffer } from '../../smo/xform/undo';
import { SmoOperation, createStaffModifierType
 } from '../../smo/xform/operations';
import { BatchSelectionOperation } from '../../smo/xform/operations';
import { smoSerialize } from '../../common/serializationHelpers';
import { FontInfo } from '../../common/vex';
import { SmoMusic } from '../../smo/data/music';
import { SuiOscillator } from '../audio/oscillator';
import { XmlToSmo } from '../../smo/mxml/xmlToSmo';
import { SuiAudioPlayer } from '../audio/player';
import { SuiXhrLoader } from '../../ui/fileio/xhrLoader';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { StaffModifierBase, 
   SmoInstrument, SmoInstrumentParams, SmoStaffTextBracket, SmoTabStave } from '../../smo/data/staffModifiers';
import { SuiPiano } from './piano';
import { SvgHelpers } from './svgHelpers';
import { PromiseHelpers } from '../../common/promiseHelpers';
import { parseJsonText } from 'typescript';
declare var $: any;
declare var SmoConfig: SmoRenderConfiguration;


/**
 * MVVM-like operations on the displayed score.
 * 
 * All operations that can be performed on a 'live' score go through this
 * module.  It maps the score view to the actual score and makes sure the
 * model and view stay in sync.  
 * 
 * Because this object operates on the current selections, 
 * all operations return promise so applications can wait for the 
 * operation to complete and update the selection list.
 * @category SuiRender
 */
export class SuiScoreViewOperations extends SuiScoreView {
  /**
   * Add a new text group to the score 
   * @param textGroup a new text group
   * @returns 
   */
  async addTextGroup(textGroup: SmoTextGroup): Promise<void> {
    const altNew = SmoTextGroup.deserializePreserveId(textGroup.serialize());
    const isPartExposed = this.isPartExposed();
    let selector = textGroup.selector ?? SmoSelector.default;
    const partInfo = this.score.staves[0].partInfo;
    const bufType = isPartExposed && partInfo.preserveTextGroups
      ? UndoBuffer.bufferTypes.PART_MODIFIER : UndoBuffer.bufferTypes.SCORE_MODIFIER;
    if (bufType === UndoBuffer.bufferTypes.PART_MODIFIER) {
      selector.staff = this.staffMap[0];
    }  
    this.storeUndo.addBuffer('remove text group', bufType,
      selector, textGroup, UndoBuffer.bufferSubtypes.ADD);
    if (isPartExposed && partInfo.preserveTextGroups) {
      this.score.staves[0].partInfo.updateTextGroup(textGroup, true);
      const partInfo = this.storeScore.staves[this._getEquivalentStaff(0)].partInfo;
      partInfo.updateTextGroup(altNew, true);      
    } else {
      this.score.updateTextGroup(textGroup, true);
      this.storeScore.updateTextGroup(altNew, true);
    }
    await this.renderer.rerenderTextGroups();
  }

  /**
   * Remove the text group from the score
   * @param textGroup 
   * @returns 
   */
  async removeTextGroup(textGroup: SmoTextGroup): Promise<void> {
    let selector = textGroup.selector ?? SmoSelector.default;
    const partInfo = this.score.staves[0].partInfo;
    const isPartExposed = this.isPartExposed();
    const bufType = isPartExposed && partInfo.preserveTextGroups 
      ? UndoBuffer.bufferTypes.PART_MODIFIER : UndoBuffer.bufferTypes.SCORE_MODIFIER;
    let ogText = this.storeScore.textGroups.find((tg) => tg.attrs.id === textGroup.attrs.id);
    if (isPartExposed && partInfo.preserveTextGroups) {
      ogText = partInfo.textGroups.find((tg) => tg.attrs.id === textGroup.attrs.id);
    }
    if (bufType === UndoBuffer.bufferTypes.PART_MODIFIER) {
      selector.staff = this.staffMap[0];
    } else {
      selector.staff = this.staffMap[selector.staff];
    }
    if (!ogText) {
      return;
    }
    this.storeUndo.addBuffer('remove text group', bufType,
      selector, ogText, UndoBuffer.bufferSubtypes.REMOVE);
    const altGroup = SmoTextGroup.deserializePreserveId(textGroup.serialize());
    textGroup.elements.forEach((el) => el.remove());
    textGroup.elements = [];
    if (isPartExposed && partInfo.preserveTextGroups) {
      partInfo.updateTextGroup(textGroup, false);
      this.storeScore.staves[this._getEquivalentStaff(0)].partInfo.updateTextGroup(altGroup, false);
    } else {
      this.score.updateTextGroup(textGroup, false);
      this.storeScore.updateTextGroup(altGroup, false);
    }
    await this.renderer.rerenderTextGroups();
  }

  /**
   * UPdate an existing text group.  The original is passed in, because since TG not tied to a musical
   * element, we need to find the one we're updating.
   * @param oldVersion 
   * @param newVersion 
   * @returns 
   */
  async updateTextGroup(newVersion: SmoTextGroup): Promise<void> {
    const selector = newVersion.selector ?? SmoSelector.default;
    const isPartExposed = this.isPartExposed();
    const partInfo = this.score.staves[0].partInfo;
    // Back up the original score text
    let ogtg = this.storeScore.textGroups.find((tg) => tg.attrs.id === newVersion.attrs.id);
    if (isPartExposed && partInfo.preserveTextGroups) {
      ogtg = partInfo.textGroups.find((tg) => tg.attrs.id === newVersion.attrs.id);
    }
    if (!ogtg) {
      // there is nothing to update, return.
      return;
    }
    if (ogtg) {
      const bufType = isPartExposed && partInfo.preserveTextGroups 
        ? UndoBuffer.bufferTypes.PART_MODIFIER : UndoBuffer.bufferTypes.SCORE_MODIFIER;
      // if this is part text, make sure the undo buffer is associated with the part stave
      // in the full score, so undo works properly
      if (bufType === UndoBuffer.bufferTypes.PART_MODIFIER) {
        selector.staff = this.staffMap[0];
      } else {
        selector.staff = this.staffMap[selector.staff];
      }
      this.storeUndo.addBuffer('modify text',
        bufType, selector, ogtg, UndoBuffer.bufferSubtypes.UPDATE);
    }
    const altNew = SmoTextGroup.deserializePreserveId(newVersion.serialize());
    this.score.updateTextGroup(newVersion, true);
    // If this is part text, don't store it in the score text, except for the displayed score
    if (!isPartExposed) {
      this.storeScore.updateTextGroup(altNew, true);
    } else {
      this.storeScore.staves[this._getEquivalentStaff(0)].partInfo.updateTextGroup(altNew, true);
    }
    // TODO: only render the one TG.
    await this.renderer.rerenderTextGroups();
    // return this.renderer.updatePromise();
  }
  /**
   * load an mxml score remotely, return a promise that 
   * completes when the file is loaded
   * @param url where to find the xml file
   * @returns 
   */
  async loadRemoteXml(url: string): Promise<any> {
    const req = new SuiXhrLoader(url);
    const self = this;
    // Shouldn't we return promise of actually displaying the score?
    await req.loadAsync();
    const parser = new DOMParser();
    const xml = parser.parseFromString(req.value, 'text/xml');
    const score = XmlToSmo.convert(xml);
    score.layoutManager!.zoomToWidth($('body').width());
    await self.changeScore(score);
  }
  /**
   * load a remote score in SMO format
   * @param url url to find the score
   * @returns 
   */
  async loadRemoteJson(url: string) : Promise<any> {
    const req = new SuiXhrLoader(url);
    await req.loadAsync();
    const score = SmoScore.deserialize(req.value);
    await this.changeScore(score);
  }
  /**
   * Load a remote score, return promise when it's been loaded
   * from afar.
   * @param pref 
   * @returns 
   */
  async loadRemoteScore(url: string): Promise<any> {
    if (url.endsWith('xml') || url.endsWith('mxl')) {
      return this.loadRemoteXml(url);
    } else {
      return this.loadRemoteJson(url);
    }
  }
  async updateAudioSettings(pref: SmoAudioPlayerSettings) {
    this._undoScorePreferences('Update preferences');
    this.score.audioSettings = pref;
    this.storeScore.audioSettings = new SmoAudioPlayerSettings(pref);
    // No rendering to be done
    return this.renderer.updatePromise();
  }
  /**
   * Global settings that control how the score editor behaves
   * @param pref 
   * @returns 
   */
  async updateScorePreferences(pref: SmoScorePreferences): Promise<void> {
    this._undoScorePreferences('Update preferences');
    const oldXpose = this.score.preferences.transposingScore;
    const curXpose = pref.transposingScore;
    this.score.updateScorePreferences(new SmoScorePreferences(pref));
    this.storeScore.updateScorePreferences(new SmoScorePreferences(pref));
    if (curXpose === false && oldXpose === true) {
      this.score.setNonTransposing();
    } else if (curXpose === true && oldXpose === false) {
      this.score.setTransposing();
    }
    this.renderer.setDirty();
    return this.renderer.updatePromise();
  }
  /**
   * Update information about the score, composer etc.
   * @param scoreInfo 
   * @returns 
   */
  async updateScoreInfo(scoreInfo: SmoScoreInfo): Promise<void> {
    this._undoScorePreferences('Update preferences');
    this.score.scoreInfo = scoreInfo;
    this.storeScore.scoreInfo = JSON.parse(JSON.stringify(scoreInfo));
    return this.renderer.updatePromise()
  }
  async addRemoveArpeggio(code: SmoArpeggioType) {
    await this.modifyCurrentSelections('add/remove addRemoveArpeggio',
      (score, selections) => {
        selections.forEach((sel) => {
          if (sel.note) {
            if (code === 'none') {
              sel.note.arpeggio = undefined;
            } else {
              sel.note.arpeggio = new SmoArpeggio({ type: code });
            }
          }
      });
    });
  }
  /**
   * A clef change mid-measure (clefNote)
   * @param clef 
   */
  async addRemoveClefChange(clef: SmoClefChange) {
    await this.modifyCurrentSelections('add/remove addRemoveClefChange',
      (score, selections) => {
        selections.forEach((sel) => {
          const measureClef = sel.measure.clef;
          if (sel.note) {
            if (measureClef === clef.clef) {
              sel.note.clefNote = null;
            } else {
              sel.note.clefNote = clef;
            }
          }
      });
    });   
  }
  /**
   * Modify the dynamics assoicated with the specific selection
   * @param selection 
   * @param dynamic 
   * @returns 
   */
  async addDynamic(selection: SmoSelection, dynamic: SmoDynamicText): Promise<void> {
    await this.modifySelection('add dynamic', selection, (score, selections) => {
      SmoOperation.addDynamic(selections[0], dynamic);
    });
  }
  /**
   * Remove dynamics from the selection 
   * @param selection 
   * @param dynamic 
   * @returns 
   */
  async _removeDynamic(selection: SmoSelection, dynamic: SmoDynamicText): Promise<void> {
    const equiv = this._getEquivalentSelection(selection);
    if (equiv !== null && equiv.note !== null) {
      const altModifiers = equiv.note.getModifiers('SmoDynamicText');
      SmoOperation.removeDynamic(selection, dynamic);
      if (altModifiers.length) {
        SmoOperation.removeDynamic(equiv, altModifiers[0] as SmoDynamicText);
      }
    }
    await this.renderer.updatePromise();
  }
  /**
   * Remove dynamics from the current selection
   * @param dynamic
   * @returns 
   */
  async removeDynamic(dynamic: SmoDynamicText): Promise<void> {
    const sel = this.tracker.modifierSelections[0];
    if (!sel.selection) {
      return PromiseHelpers.emptyPromise();
    }
    this.tracker.selections = [sel.selection];
    this._undoFirstMeasureSelection('remove dynamic');
    this._removeDynamic(sel.selection, dynamic);
    this.renderer.addToReplaceQueue(sel.selection);
    await this.renderer.updatePromise()
  }
  /**
   * we never really delete a note, but we will convert it into a rest and if it's
   * already a rest we will try to hide it.
   * Operates on current selections
   * */
  async deleteNote(): Promise<void> {
    const measureSelections = this.undoTrackerMeasureSelections('delete note');
    this.tracker.selections.forEach((sel) => {
      if (sel.note) {

        const altSel = this._getEquivalentSelection(sel);

        // set the pitch to be a good position for the rest
        const pitch = JSON.parse(JSON.stringify(
          SmoMeasure.defaultPitchForClef[sel.measure.clef]));
        const altPitch = JSON.parse(JSON.stringify(
          SmoMeasure.defaultPitchForClef[altSel!.measure.clef]));
        sel.note.pitches = [pitch];
        altSel!.note!.pitches = [altPitch];

        // If the note is a note, make it into a rest.  If the note is a rest already,
        // make it invisible.  If it is invisible already, make it back into a rest.
        if (sel.note.isRest() && !sel.note.isHidden()) {
          sel.note.makeHidden(true);
          altSel!.note!.makeHidden(true);
        } else {
          sel.note.makeRest();
          altSel!.note!.makeRest();
          sel.note.makeHidden(false);
          altSel!.note!.makeHidden(false);
        }
      }
    });
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise()
  }
  /**
  * The lyric editor moves around, so we can't depend on the tracker for the
  * correct selection.  We get it directly from the editor.
  * 
  * @param selector - the selector of the note with the lyric to remove
  * @param lyric - a copy of the lyric to remove.  We use the verse, parser to identify it
  * @returns render promise
  */
  async removeLyric(selector: SmoSelector, lyric: SmoLyric): Promise<void> {
    const selection = SmoSelection.noteFromSelector(this.score, selector);
    if (selection === null) {
      return PromiseHelpers.emptyPromise();
    }
    this._undoSelection('remove lyric', selection);
    selection.note!.removeLyric(lyric);
    const equiv = this._getEquivalentSelection(selection);
    const storeLyric = equiv!.note!.getLyricForVerse(lyric.verse, lyric.parser);
    if (typeof (storeLyric) !== 'undefined') {
      equiv!.note!.removeLyric(lyric);
    }
    this.renderer.addToReplaceQueue(selection);
    lyric.deleted = true;
    await this.renderer.updatePromise();
  }

  /**
   * @param selector where to add or update the lyric
   * @param lyric a copy of the lyric to remove
   * @returns 
   */
  async addOrUpdateLyric(selector: SmoSelector, lyric: SmoLyric): Promise<void> {
    const selection = SmoSelection.noteFromSelector(this.score, selector);
    if (selection === null) {
      return;
    }
    this._undoSelection('update lyric', selection);
    selection.note!.addLyric(lyric);
    const equiv = this._getEquivalentSelection(selection);
    const altLyric = SmoNoteModifierBase.deserialize(lyric.serialize() as any) as SmoLyric;
    equiv!.note!.addLyric(altLyric);
    this.renderer.addToReplaceQueue(selection);
    await this.renderer.updatePromise();
  }

  /**
   * Delete all the notes for the currently selected voice
   * @returns 
   */
  async depopulateVoice(): Promise<void> {
    const measureSelections = this.undoTrackerMeasureSelections('depopulate voice');
    measureSelections.forEach((selection) => {
      const ix = selection.measure.getActiveVoice();
      if (ix !== 0) {
        SmoOperation.depopulateVoice(selection, ix);
        const equiv = this._getEquivalentSelection(selection);
        SmoOperation.depopulateVoice(equiv!, ix);
      }
    });
    SmoOperation.setActiveVoice(this.score, 0);
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  /**
   * Change the active voice in a multi-voice measure.
   * @param index 
   * @returns 
   */
  _changeActiveVoice(index: number): SmoSelection[] {
    const measuresToAdd: SmoSelection[] = [];
    const measureSelections = SmoSelection.getMeasureList(this.tracker.selections);
    measureSelections.forEach((measureSelection) => {
      if (index === measureSelection.measure.voices.length) {
        measuresToAdd.push(measureSelection);
      }
    });
    return measuresToAdd;
  }
  /**
   * Populate a new voice with default notes
   * @param index the voice to populate
   * @returns 
   */
  async populateVoice(index: number): Promise<void> {
    const measuresToAdd = this._changeActiveVoice(index);
    if (measuresToAdd.length === 0) {
      SmoOperation.setActiveVoice(this.score, index);
      this.tracker.selectActiveVoice();
      return this.renderer.updatePromise();
    }
    measuresToAdd.forEach((selection) => {
      this._undoSelection('popualteVoice', selection);
      SmoOperation.populateVoice(selection, index);
      const equiv = this._getEquivalentSelection(selection);
      SmoOperation.populateVoice(equiv!, index);
    });
    SmoOperation.setActiveVoice(this.score, index);
    this._renderChangedMeasures(measuresToAdd);
    await this.renderer.updatePromise();
  }
  /**
   * Assign an instrument to a set of measures
   * @param instrument the instrument to assign to the selections
   * @param selections 
   * @returns 
   */
  async changeInstrument(instrument: SmoInstrument, selections: SmoSelection[]): Promise<void> {
    if (typeof (selections) === 'undefined') {
      selections = this.tracker.selections;
    }
    this._undoSelections('change instrument', selections);
    const altSelections = this._getEquivalentSelections(selections);
    SmoOperation.changeInstrument(instrument, selections);
    SmoOperation.changeInstrument(instrument, altSelections);
    this._renderChangedMeasures(selections);
    await this.renderer.updatePromise();
  }
  /**
   * Set the time signature for a selection
   * @param timeSignature actual time signature
   */
  async setTimeSignature(timeSignature: TimeSignature): Promise<void> {
    this._undoScore('Set time signature');
    const selections = this.tracker.selections;
    const altSelections = this._getEquivalentSelections(selections);
    SmoOperation.setTimeSignature(this.score, selections, timeSignature);
    SmoOperation.setTimeSignature(this.storeScore, altSelections, timeSignature);
    this._renderChangedMeasures(SmoSelection.getMeasureList(this.tracker.selections));
    return this.renderer.updatePromise();
  }
  /**
   * Move selected staff up or down in the score.
   * @param index direction to move
   * @returns 
   */
  async moveStaffUpDown(index: number): Promise<void> {
    this._undoScore('re-order staves');
    // Get staff to move
    const selection = this._getEquivalentSelection(this.tracker.selections[0]);
    // Make the move in the model, and reset the view so we can see the new
    // arrangement
    SmoOperation.moveStaffUpDown(this.storeScore, selection!, index);
    this.viewAll();
    await this.renderer.updatePromise();
  }
  /**
   * Update the staff group for a score, which determines how the staves
   * are justified and bracketed
   * @param staffGroup 
   */
  async addOrUpdateStaffGroup(staffGroup: SmoSystemGroup): Promise<void> {
    this._undoScore('group staves');
    // Assume that the view is now set to full score
    this.score.addOrReplaceSystemGroup(staffGroup);
    this.storeScore.addOrReplaceSystemGroup(staffGroup);
    this.renderer.setDirty();
    await this.renderer.updatePromise();
  }
  async updateTabStave(tabStave: SmoTabStave) {
    const selections = SmoSelection.getMeasuresBetween(this.score, tabStave.startSelector, tabStave.endSelector);
    const altSelections = this._getEquivalentSelections(selections);
    if (selections.length === 0) {
      return;
    }
    this._undoSelections('updateTabStave', selections);
    const staff: number = selections[0].selector.staff;
    const altStaff = altSelections[0].selector.staff;
    const altTabStave = new SmoTabStave(tabStave.serialize());
    altTabStave.startSelector.staff = altStaff;
    altTabStave.endSelector.staff = altStaff;
    altTabStave.attrs.id = tabStave.attrs.id;
    this.score.staves[staff].updateTabStave(tabStave);
    this.storeScore.staves[altStaff].updateTabStave(altTabStave);
    this._renderChangedMeasures(SmoSelection.getMeasureList(this.tracker.selections));
    await this.renderer.updatePromise();
  }
  async removeTabStave() {
    const selections = this.tracker.selections;
    const altSelections = this._getEquivalentSelections(selections);
    if (selections.length === 0) {
      return;
    }
    this._undoSelections('updateTabStave', selections);
    const stavesToRemove: SmoTabStave[] = [];
    const altStavesToRemove: SmoTabStave[] = [];
    const added: Record<string, SmoTabStave> = {};
    selections.forEach((sel, ix) => {
      const altSel = altSelections[ix];
      const tabStave = sel.staff.getTabStaveForMeasure(sel.selector);
      const altTabStave = altSel.staff.getTabStaveForMeasure(altSel.selector);
      if (tabStave && altTabStave) {
        if (!added[tabStave.attrs.id]) {
          added[tabStave.attrs.id] = tabStave;
          stavesToRemove.push(tabStave);
          altStavesToRemove.push(altTabStave);
        }
      }
    });
    selections[0].staff.removeTabStaves(stavesToRemove);
    altSelections[0].staff.removeTabStaves(altStavesToRemove);
    this._renderChangedMeasures(SmoSelection.getMeasureList(this.tracker.selections));
    await this.renderer.updatePromise();
  }
  /**
   * Update tempo for all or part of the score
   * @param measure the measure with the tempo.  Tempo is measure-wide parameter
   * @param scoreMode if true, update whole score.  Else selections
   * @returns 
   */
  async updateTempoScore(measure: SmoMeasure, tempo: SmoTempoText, scoreMode: boolean, selectionMode: boolean): Promise<void> {
    let measureIndex = 0;    
    const originalTempo = new SmoTempoText(measure.tempo);
    this._undoColumn('update tempo', measure.measureNumber.measureIndex);
    let startMeasure = measure.measureNumber.measureIndex;
    let endMeasure = this.score.staves[0].measures.length;
    let displayed = false;
    if (selectionMode) {
      const endSel = this.tracker.getExtremeSelection(1);
      if (endSel.selector.measure > startMeasure) {
        endMeasure = endSel.selector.measure;
      }
    }
    // If we are only changing the position of the text, it only affects the tempo measure.
    if (SmoTempoText.eq(originalTempo, tempo) && tempo.yOffset !== originalTempo.yOffset && endMeasure > startMeasure) {
      endMeasure = startMeasure + 1;          
    }
    for (measureIndex = startMeasure; measureIndex < endMeasure; ++measureIndex) {
      if (!scoreMode && !selectionMode) {
        // If not whole score or selections, change until the tempo doesn't match previous measure's tempo (next tempo change)
        const compMeasure = this.score.staves[0].measures[measureIndex];
        if (SmoTempoText.eq(originalTempo, compMeasure.tempo) || displayed === false) {
          const sel = SmoSelection.measureSelection(this.score, 0, measureIndex);
          const altSel = SmoSelection.measureSelection(this.storeScore, 0, measureIndex);
          if (sel && sel.measure.tempo.display && !displayed) {
            this.renderer.addToReplaceQueue(sel);
            displayed = true;
          }
          if (sel) {
            SmoOperation.addTempo(this.score, sel, tempo);
          }
          if (altSel) {
            SmoOperation.addTempo(this.storeScore, altSel, tempo);
          }
        } else {
          break;
        }
      } else {
        const sel = SmoSelection.measureSelection(this.score, 0, measureIndex);
        const altSel = SmoSelection.measureSelection(this.storeScore, 0, measureIndex);
        if (sel) {
          SmoOperation.addTempo(this.score, sel, tempo);
          if (!displayed) {
            this.renderer.addToReplaceQueue(sel);
            displayed = true;
          }
        }
        if (altSel) {
          SmoOperation.addTempo(this.storeScore, altSel, tempo);
        }
      }
    }
    await this.renderer.updatePromise();
  }
  async updateTabNote(tabNote: SmoTabNote) {
    const selections = SmoSelection.getMeasuresBetween(this.score, 
      this.tracker.getExtremeSelection(-1).selector, this.tracker.getExtremeSelection(1).selector);
    const altSelections = this._getEquivalentSelections(selections);
    this._undoSelections('updateTabNote', selections);
    SmoOperation.updateTabNote(selections, tabNote);
    SmoOperation.updateTabNote(altSelections, tabNote);
    this.renderer.addToReplaceQueue(selections);
    await this.renderer.updatePromise();
  }
  async removeTabNote() {
    const selections = SmoSelection.getMeasuresBetween(this.score, 
      this.tracker.getExtremeSelection(-1).selector, this.tracker.getExtremeSelection(1).selector);
    const altSelections = this._getEquivalentSelections(selections);
    this._undoSelections('updateTabNote', selections);
    SmoOperation.removeTabNote(selections);
    SmoOperation.removeTabNote(altSelections);
    this.renderer.addToReplaceQueue(selections);
    await this.renderer.updatePromise();
  }
  /**
   * 'remove' tempo, which means either setting the bars to the 
   * default tempo, or the previously-set tempo.
   * @param scoreMode whether to reset entire score
   */
  async removeTempo(measure: SmoMeasure, tempo: SmoTempoText, scoreMode: boolean, selectionMode: boolean): Promise<void> {
    const startSelection = this.tracker.selections[0];
    if (startSelection.selector.measure > 0) {
      const measureIx = startSelection.selector.measure - 1;
      const target = startSelection.staff.measures[measureIx];
      const tempo = target.getTempo();
      const newTempo = new SmoTempoText(tempo);
      newTempo.display = false;
      this.updateTempoScore(measure, newTempo, scoreMode, selectionMode);
    } else {
      this.updateTempoScore(measure, new SmoTempoText(SmoTempoText.defaults), scoreMode, selectionMode);
    }
    await this.renderer.updatePromise();
  }
  /**
   * Add a grace note to the selected real notes.
   */
  async addGraceNote(): Promise<void> {
    const selections = this.tracker.selections;
    const measureSelections = this.undoTrackerMeasureSelections('add grace note');
    selections.forEach((selection) => {
      const index = selection.note!.getGraceNotes().length;
      const pitches = JSON.parse(JSON.stringify(selection.note!.pitches));
      const grace = new SmoGraceNote({
        pitches, ticks:
          { numerator: 2048, denominator: 1, remainder: 0 }
      });
      SmoOperation.addGraceNote(selection, grace, index);

      const altPitches = JSON.parse(JSON.stringify(selection.note!.pitches));
      const altGrace = new SmoGraceNote({
        pitches: altPitches, ticks:
          { numerator: 2048, denominator: 1, remainder: 0 }
      });
      altGrace.attrs.id = grace.attrs.id;
      const altSelection = this._getEquivalentSelection(selection);
      SmoOperation.addGraceNote(altSelection!, altGrace, index);
    });
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }

  /**
   * remove selected grace note
   * @returns
   */
  async removeGraceNote(): Promise<void> {
    const selections = this.tracker.selections;
    const measureSelections = this.undoTrackerMeasureSelections('remove grace note');
    selections.forEach((selection) => {
      // TODO: get the correct offset
      SmoOperation.removeGraceNote(selection, 0);
      const altSel = (this._getEquivalentSelection(selection));
      SmoOperation.removeGraceNote(altSel!, 0);
    });
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  /**
   * Toggle slash in stem of grace note
   */
  async slashGraceNotes(): Promise<void> {
    const grace = this.tracker.getSelectedGraceNotes();
    const measureSelections = this.undoTrackerMeasureSelections('slash grace note toggle');
    grace.forEach((gn) => {
      SmoOperation.slashGraceNotes(gn);
      if (gn.selection !== null) {
        const altSelection = this._getEquivalentSelection(gn.selection);
        const altGn = this._getEquivalentGraceNote(altSelection!, gn.modifier as SmoGraceNote);
        SmoOperation.slashGraceNotes({
          selection: altSelection, modifier: altGn as any,
          box: SvgBox.default, index: 0
        });
      }
    });
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  async transposeScore(offset: number): Promise<void> {
    this._undoScore('transpose score');
    SmoOperation.transposeScore(this.score, offset);
    SmoOperation.transposeScore(this.storeScore, offset);
    this.renderer.rerenderAll();
    await this.renderer.updatePromise();
  }
  /**
   * transpose selected notes
   * @param offset 1/2 steps
   * @returns 
   */
  async transposeSelections(offset: number): Promise<void> {
    const selections = this.tracker.selections;
    const measureSelections = this.undoTrackerMeasureSelections('transpose');
    const grace = this.tracker.getSelectedGraceNotes();
    if (grace.length) {
      grace.forEach((artifact) => {
        if (artifact.selection !== null && artifact.selection.note !== null) {
          const gn1 = artifact.modifier as SmoGraceNote;
          const index = artifact.selection.note.graceNotes.findIndex((x) => x.attrs.id === gn1.attrs.id);
          const altSelection = this._getEquivalentSelection(artifact.selection);
          if (altSelection && altSelection.note !== null) {
            const gn2 = altSelection.note.graceNotes[index];
            SmoOperation.transposeGraceNotes(altSelection!, [gn2], offset);
          }
          SmoOperation.transposeGraceNotes(artifact.selection, [gn1], offset);
        }
      });

    } else {
      selections.forEach((selected) => {
        SmoOperation.transpose(selected, offset);
        const altSel = this._getEquivalentSelection(selected);
        SmoOperation.transpose(altSel!, offset);
      });
      if (selections.length === 1 && this.score.preferences.autoPlay) {
        SuiOscillator.playSelectionNow(selections[0], this.score, 1);
      }
    }
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  /**
   * toggle the accidental spelling of the selected notes
   * @returns
   */
  async toggleEnharmonic(): Promise<void> {
    const selections = this.tracker.selections;
    const measureSelections = this.undoTrackerMeasureSelections('toggle enharmonic');
    const grace = this.tracker.getSelectedGraceNotes();
    if (grace.length) {
      grace.forEach((artifact) => {
        SmoOperation.toggleGraceNoteEnharmonic(artifact.selection!, [artifact.modifier as SmoGraceNote]);
        const altSelection = this._getEquivalentSelection(artifact.selection!);
        const altGr = this._getEquivalentGraceNote(altSelection!, artifact.modifier as SmoGraceNote);
        SmoOperation.toggleGraceNoteEnharmonic(altSelection!,
          [altGr]);
      });
    } else {
      selections.forEach((selected) => {
        if (typeof (selected.selector.pitches) === 'undefined') {
          selected.selector.pitches = [];
        }
        SmoOperation.toggleEnharmonic(selected);
        const altSel = this._getEquivalentSelection(selected);
        SmoOperation.toggleEnharmonic(altSel!);
      });
    }
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }

  /**
   * Toggle cautionary/courtesy accidentals
   */
  async toggleCourtesyAccidentals(): Promise<void> {
    const selections = this.tracker.selections;
    const measureSelections = this.undoTrackerMeasureSelections('toggle courtesy accidental');
    const grace = this.tracker.getSelectedGraceNotes();
    if (grace.length) {
      grace.forEach((artifact) => {
        const gn1 = [artifact.modifier] as SmoGraceNote[];
        SmoOperation.toggleGraceNoteCourtesy(artifact.selection, gn1);
        const altSel = this._getEquivalentSelection(artifact.selection!);
        const gn2 = this._getEquivalentGraceNote(altSel!, gn1[0]);
        SmoOperation.toggleGraceNoteCourtesy(altSel!, [gn2]);
      });
    } else {
      selections.forEach((selection) => {
        SmoOperation.toggleCourtesyAccidental(selection);
        const altSel = this._getEquivalentSelection(selection);
        SmoOperation.toggleCourtesyAccidental(altSel!);
      });
    }
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }

  /**
   * change the duration of notes for selected, creating more 
   * or fewer notes. 
   * After the change, reset the selection so it's as close as possible 
   * to the original length
   * @param operation 
   * @returns 
   */
  async batchDurationOperation(operation: BatchSelectionOperation): Promise<void> {
    const selections = this.tracker.selections;
    const measureSelections = this.undoTrackerMeasureSelections('change duration');
    const grace = this.tracker.getSelectedGraceNotes();
    const graceMap: Record<string, BatchSelectionOperation> = {
      doubleDuration: 'doubleGraceNoteDuration',
      halveDuration: 'halveGraceNoteDuration'
    };
    if (grace.length && typeof (graceMap[operation]) !== 'undefined') {
      operation = graceMap[operation];
      grace.forEach((artifact) => {
        (SmoOperation as any)[operation](artifact.selection, artifact.modifier);
        const altSelection = this._getEquivalentSelection(artifact.selection!);
        const gn2 = this._getEquivalentGraceNote(altSelection!, artifact.modifier as SmoGraceNote);
        (SmoOperation as any)[operation](altSelection!, gn2);
      });
    } else {
      const altAr = this._getEquivalentSelections(selections);
      SmoOperation.batchSelectionOperation(this.score, selections, operation);
      SmoOperation.batchSelectionOperation(this.storeScore, altAr, operation);
    }
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  /**
   * Toggle selected modifier on selected notes
   * @param modifier 
   * @param ctor parent class constructor (e.g. SmoOrnament)
   * @returns 
   */
  async toggleArticulation(modifier: string, ctor: string): Promise<void> {
    const measureSelections = this.undoTrackerMeasureSelections('toggle articulation');
    this.tracker.selections.forEach((sel) => {
      if (ctor === 'SmoArticulation') {
        const aa = new SmoArticulation({ articulation: modifier });
        const altAa = new SmoArticulation({ articulation: modifier });
        altAa.attrs.id = aa.attrs.id;
        if (sel.note) {
          sel.note.toggleArticulation(aa);
        }
        const altSelection = this._getEquivalentSelection(sel);
        if (altSelection && altSelection.note) {
          altSelection.note.toggleArticulation(altAa);
        }
      } else {
        const aa = new SmoOrnament({ ornament: modifier });
        const altAa = new SmoOrnament({ ornament: modifier });
        altAa.attrs.id = aa.attrs.id;
        const altSelection = this._getEquivalentSelection(sel!);
        if (sel.note) {
          sel.note.toggleOrnament(aa);
        }
        if (altSelection && altSelection.note) {
          altSelection.note.toggleOrnament(altAa);
        }
      }
    });
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  async setArticulation(modifier: SmoArticulation, set: boolean): Promise<void> {
    const measureSelections = this.undoTrackerMeasureSelections('set articulation');
    this.tracker.selections.forEach((sel) => {
      const altAa = new SmoArticulation(modifier);
      if (sel.note) {
        sel.note.setArticulation(modifier, set);
      }
      const altSelection = this._getEquivalentSelection(sel);
      if (altSelection && altSelection.note) {
        altSelection.note.toggleArticulation(altAa);
      }
    });
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();    
  }
  async setOrnament(modifier: SmoOrnament, set: boolean): Promise<void> {
    const measureSelections = this.undoTrackerMeasureSelections('set articulation');
    this.tracker.selections.forEach((sel) => {
      const altAa = new SmoOrnament(modifier);
      if (sel.note) {
        sel.note.setOrnament(modifier, set);
      }
      const altSelection = this._getEquivalentSelection(sel);
      if (altSelection && altSelection.note) {
        altSelection.note.setOrnament(altAa, set);
      }
    });
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();    
  }
  /**
   * convert non-tuplet not to a tuplet
   * @param numNotes 3 means triplet, etc.
   */
  async makeTuplet(numNotes: number): Promise<void> {
    const selection = this.tracker.selections[0];
    const measureSelections = this.undoTrackerMeasureSelections('make tuplet');
    SmoOperation.makeTuplet(selection, numNotes);
    const altSelection = this._getEquivalentSelection(selection!);
    SmoOperation.makeTuplet(altSelection!, numNotes);
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  /**
   * Convert selected tuplet to a single (if possible) non-tuplet
   */
  async unmakeTuplet(): Promise<void> {
    const selection = this.tracker.selections[0];
    const measureSelections = this.undoTrackerMeasureSelections('unmake tuplet');
    SmoOperation.unmakeTuplet(selection);
    const altSelection = this._getEquivalentSelection(selection);
    SmoOperation.unmakeTuplet(altSelection!);
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }

  /**
   * Create a chord by adding an interval to selected note
   * @param interval 1/2 steps
   * @returns 
   */
  async setInterval(interval: number): Promise<void> {
    const selections = this.tracker.selections;
    const measureSelections = this.undoTrackerMeasureSelections('set interval');
    selections.forEach((selected) => {
      SmoOperation.interval(selected, interval);
      const altSelection = this._getEquivalentSelection(selected);
      SmoOperation.interval(altSelection!, interval);
    });
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }

  /**
   * change the selected chord into a single note
   * @returns
   */
  async collapseChord(): Promise<void> {
    const selections = this.tracker.selections;
    const measureSelections = this.undoTrackerMeasureSelections('collapse chord');
    selections.forEach((selected) => {
      const note: SmoNote | null = selected.note;
      if (note) {
        const pp = JSON.parse(JSON.stringify(note.pitches[0]));
        const altpp = JSON.parse(JSON.stringify(note.pitches[0]));
        // No operation for this?
        note.pitches = [pp];
        const altSelection = this._getEquivalentSelection(selected);
        altSelection!.note!.pitches = [altpp];
      }
    });
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  /**
   * Toggle chicken-scratches, for jazz improv, comping etc.
   */
  async toggleSlash(): Promise<void> {
    const selections = this.tracker.selections;
    const measureSelections = this.undoTrackerMeasureSelections('make slash');
    selections.forEach((selection) => {
      SmoOperation.toggleSlash(selection);
      const altSel = this._getEquivalentSelection(selection);
      SmoOperation.toggleSlash(altSel!);
    });
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  /**
   * make selected notes into a rest, or visa-versa
   * @returns
   */
  async makeRest(): Promise<void> {
    const selections = this.tracker.selections;
    const measureSelections = this.undoTrackerMeasureSelections('make rest');
    selections.forEach((selection) => {
      SmoOperation.toggleRest(selection);
      const altSel = this._getEquivalentSelection(selection);
      SmoOperation.toggleRest(altSel!);
    });
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  async clearAllBeams(): Promise<void> {
    this._undoScore('clearAllBeams');
    SmoOperation.clearAllBeamGroups(this.score);
    SmoOperation.clearAllBeamGroups(this.storeScore);
    await this.awaitRender();
  }
  async clearSelectedBeams() {
    const selections = this.tracker.selections;
    const measures = SmoSelection.getMeasureList(selections);
    const altSelections = this._getEquivalentSelections(selections);
    SmoOperation.clearBeamGroups(this.score, selections);
    SmoOperation.clearBeamGroups(this.storeScore, altSelections);
    this._renderChangedMeasures(measures);
    await this.renderer.updatePromise();
  }
  /**
   * toggle the 'end beam' flag for selected notes
   * @returns 
   */
  async toggleBeamGroup(): Promise<void> {
    const selections = this.tracker.selections;
    const measureSelections = this.undoTrackerMeasureSelections('toggle beam group');
    selections.forEach((selection) => {
      SmoOperation.toggleBeamGroup(selection);
      const altSel = this._getEquivalentSelection(selection);
      SmoOperation.toggleBeamGroup(altSel!);
    });
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  async toggleCue() {
    const measureSelections = this.undoTrackerMeasureSelections('toggle note cue');
    this.tracker.selections.forEach((selection) => {
      const altSelection = this._getEquivalentSelection(selection);
      if (selection.note && selection.note.isRest() === false) {
        selection.note.isCue = !selection.note.isCue;
        if (altSelection && altSelection.note) {
          altSelection.note.isCue = selection.note.isCue;
        }
      }
    });
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  /**
  * up or down
  * @returns 
  */
  async toggleBeamDirection(): Promise<void> {
    const selections = this.tracker.selections;
    if (selections.length < 1) {
      return PromiseHelpers.emptyPromise();
    }
    const measureSelections = this.undoTrackerMeasureSelections('toggle beam direction');
    SmoOperation.toggleBeamDirection(selections);
    SmoOperation.toggleBeamDirection(this._getEquivalentSelections(selections));
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  /**
   * Add the selected notes to a beam group
   */
  async beamSelections(): Promise<void> {
    const selections = this.tracker.selections;
    const measureSelections = this.undoTrackerMeasureSelections('beam selections');
    SmoOperation.beamSelections(this.score, selections);
    SmoOperation.beamSelections(this.storeScore, this._getEquivalentSelections(selections));
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  /**
   * change key signature for selected measures
   * @param keySignature vex key signature
   */
  async addKeySignature(keySignature: string): Promise<void> {
    const measureSelections = this.undoTrackerMeasureSelections('set key signature ' + keySignature);
    measureSelections.forEach((sel) => {
      SmoOperation.addKeySignature(this.score, sel, keySignature);
      const altSel = this._getEquivalentSelection(sel);
      SmoOperation.addKeySignature(this.storeScore, altSel!, keySignature);
    });
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  /**
   * Sets a pitch from the piano widget.
   * @param pitch {Pitch}
   * @param chordPedal {boolean} - indicates we are adding to a chord
   */
  async setPitchPiano(pitch: Pitch, chordPedal: boolean): Promise<void> {
    const measureSelections = this.undoTrackerMeasureSelections(
      'setAbsolutePitch ' + pitch.letter + '/' + pitch.accidental);
    this.tracker.selections.forEach((selected) => {
      const npitch: Pitch = {
        letter: pitch.letter,
        accidental: pitch.accidental, octave: pitch.octave
      };
      const octave = SmoMeasure.defaultPitchForClef[selected.measure.clef].octave;
      npitch.octave += octave;
      const altSel = this._getEquivalentSelection(selected);
      if (chordPedal && selected.note) {
        selected.note.toggleAddPitch(npitch);
        altSel!.note!.toggleAddPitch(npitch);
      } else {
        SmoOperation.setPitch(selected, [npitch]);
        SmoOperation.setPitch(altSel!, [npitch]);
      }
    });
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  /**
   * show or hide the piano widget
   * @param value to show it
   */
  async showPiano(value: boolean): Promise<void> {
    this.score.preferences.showPiano = value;
    this.storeScore.preferences.showPiano = value;
    if (value) {
      SuiPiano.showPiano();
    } else {
      SuiPiano.hidePiano();
    }
    await this.renderer.updatePromise();
  }
  /**
   * Render a pitch for each letter name-pitch in the string,
   * @param pitches letter names for pitches
   * @returns promise, resolved when all pitches rendered
   * @see setPitch
   */
  async setPitchesPromise(pitches: PitchLetter[]): Promise<any> {
    const self = this;
    const promise = new Promise((resolve: any) => {
      const fc = async (index: number) => {
        if (index >= pitches.length) {
          resolve();
        } else {
          await self.setPitch(pitches[index]);
          fc(index + 1);
        }
      };
      fc(0);
    });
    await promise;
  }

  /**
   * Add a pitch to the score at the cursor.  This tries to find the best pitch
   * to match the letter key (F vs F# for instance) based on key and surrounding notes
   * @param letter string
   */
  async setPitch(letter: PitchLetter): Promise<void> {
    const selections = this.tracker.selections;
    const measureSelections = this.undoTrackerMeasureSelections('set pitch ' + letter);
    selections.forEach((selected) => {
      const selector = selected.selector;
      let hintSel = SmoSelection.lastNoteSelectionNonRest(this.score,
        selector.staff, selector.measure, selector.voice, selector.tick);
      if (!hintSel) {
        hintSel = SmoSelection.nextNoteSelectionNonRest(this.score,
          selector.staff, selector.measure, selector.voice, selector.tick);
      }
      // The selection no longer exists, possibly deleted
      if (hintSel === null || hintSel.note === null) {
        return PromiseHelpers.emptyPromise();
      }
      const pitch = SmoMusic.getLetterNotePitch(hintSel.note.pitches[0],
        letter, hintSel.measure.keySignature);
      SmoOperation.setPitch(selected, [pitch]);
      const altSel = this._getEquivalentSelection(selected);
      SmoOperation.setPitch(altSel!, [pitch]);
      if (this.score.preferences.autoAdvance) {
        this.tracker.moveSelectionRight(this.score, null, true);
      }
    });
    if (selections.length === 1 && this.score.preferences.autoPlay) {
      SuiOscillator.playSelectionNow(selections[0], this.score, 1);
    }
    this._renderChangedMeasures(measureSelections);
    await this.renderer.updatePromise();
  }
  /**
   * Generic clipboard copy action
   */
  async copy(): Promise<void> {
    const altAr: SmoSelection[] = [];
    this.tracker.selections.forEach((sel) => {
      const noteSelection = this._getEquivalentSelection(sel);
      if (noteSelection !== null) {
        altAr.push(noteSelection);
      }
    });
    this.storePaste.setSelections(this.storeScore, altAr);
    await this.renderer.updatePromise();
  }
  /**
   * clipboard paste action
   * @returns 
   */
  async paste(): Promise<void> {
    // We undo the whole score on a paste, since we don't yet know the
    // extent of the overlap
    this.renderer.preserveScroll();
    const selections: SmoSelection[]  = this.getPasteMeasureList();
    const firstSelection = selections[0];
    const measureEnd = selections[selections.length - 1].selector.measure;
    const measureRange = [firstSelection.selector.measure, measureEnd];
    this.storeUndo.grouping = true;
    // Undo the paste by selecting all the affected measures
    for (let i = measureRange[0]; i <= measureRange[1]; ++i) {
      this._undoColumn('paste', i);
      this.renderer.unrenderColumn(this.score.staves[0].measures[i]);
    }
    this.storeUndo.grouping = false;
    const altSelection = this._getEquivalentSelection(firstSelection);
    const altTarget = altSelection!.selector;
    altTarget.tick = this.tracker.selections[0].selector.tick;
    // paste the clipboard into the destination
    this.storePaste.pasteSelections(altTarget);
    // Refresh those measures.
    this.replaceMeasureView(measureRange);
    await this.renderer.updatePromise();
  }
  /**
   * specify a note head other than the default for the duration
   * @param head 
   */
  async setNoteHead(head: string): Promise<void> {
    await this.modifyCurrentSelections('set note head', (score, selections) => {
      SmoOperation.setNoteHead(selections, head);
    });
  }

  /**
   * Add a volta for selected measures
   */
  async addEnding(): Promise<void> {
    // TODO: we should have undo for columns
    this._undoScore('Add Volta');
    const ft = this.tracker.getExtremeSelection(-1);
    const tt = this.tracker.getExtremeSelection(1);
    const params = SmoVolta.defaults;
    params.startBar = ft.selector.measure;
    params.endBar = tt.selector.measure;
    params.number = 1;
    const volta = new SmoVolta(params);
    const altVolta = new SmoVolta(params);
    this._renderChangedMeasures([ft, tt]);
    SmoOperation.addEnding(this.storeScore, altVolta);
    SmoOperation.addEnding(this.score, volta);
    this.renderer.setRefresh();
    return this.renderer.updatePromise();
  }
  /**
   * @param ending volta settings
   * @returns 
   */
  async updateEnding(ending: SmoVolta): Promise<void> {
    this._undoScore('Change Volta');
    ending.elements.forEach((el) => {
      $(el).find('g.' + ending.attrs.id).remove();
    });
    ending.elements = [];
    SmoOperation.removeEnding(this.storeScore, ending);
    SmoOperation.removeEnding(this.score, ending);
    const altVolta = new SmoVolta(ending);
    SmoOperation.addEnding(this.storeScore, altVolta);
    SmoOperation.addEnding(this.score, ending);
    this.renderer.setRefresh();
    return this.renderer.updatePromise();
  }
  /**
   * 
   * @param ending volta to remove
   * @returns 
   */
  async removeEnding(ending: SmoVolta): Promise<void> {
    this._undoScore('Remove Volta');
    ending.elements.forEach((el) => {
      $(el).find('g.' + ending.attrs.id).remove();
    });
    ending.elements = [];
    SmoOperation.removeEnding(this.storeScore, ending);
    SmoOperation.removeEnding(this.score, ending);
    this.renderer.setRefresh();
    return this.renderer.updatePromise();
  }
  /**
   * 
   * @param position begin or end
   * @param barline barline type
   * @returns 
   */
  async setBarline(position: number, barline: number): Promise<void> {
    const obj = new SmoBarline({ position, barline });
    const altObj = new SmoBarline({ position, barline });
    const selection = this.tracker.selections[0];
    this._undoColumn('set barline', selection.selector.measure);
    SmoOperation.setMeasureBarline(this.score, selection, obj);
    const altSel = this._getEquivalentSelection(selection);
    SmoOperation.setMeasureBarline(this.storeScore, altSel!, altObj);
    this._renderChangedMeasures([selection]);
    return this.renderer.updatePromise();
  }
  /**
   * 
   * @param position start or end
   * @param symbol coda, etc.
   */
  async setRepeatSymbol(position: number, symbol: number): Promise<void> {
    const params = SmoRepeatSymbol.defaults;
    params.position = position;
    params.symbol = symbol;
    const obj = new SmoRepeatSymbol(params);
    const altObj = new SmoRepeatSymbol(params);
    const selection = this.tracker.selections[0];
    this._undoColumn('set repeat symbol', selection.selector.measure);
    SmoOperation.setRepeatSymbol(this.score, selection, obj);
    const altSel = this._getEquivalentSelection(selection);
    SmoOperation.setRepeatSymbol(this.storeScore, altSel!, altObj);
    this._renderChangedMeasures([selection]);
    return this.renderer.updatePromise();
  }
  /**
   *  toggle rehearsal mark on first selected measure
   * @returns
   */
  async toggleRehearsalMark(): Promise<void> {
    const selection = this.tracker.getExtremeSelection(-1);
    const altSelection = this._getEquivalentSelection(selection);
    const cmd = selection.measure.getRehearsalMark() ? 'removeRehearsalMark' : 'addRehearsalMark';
    SmoOperation[cmd](this.score, selection, new SmoRehearsalMark(SmoRehearsalMark.defaults));
    SmoOperation[cmd](this.storeScore, altSelection!, new SmoRehearsalMark(SmoRehearsalMark.defaults));
    this._renderChangedMeasures([selection]);
    return this.renderer.updatePromise();
  }
  _removeStaffModifier(modifier: StaffModifierBase) {
    this.score.staves[modifier.associatedStaff].removeStaffModifier(modifier);
    const altModifier = StaffModifierBase.deserialize(modifier.serialize());
    altModifier.attrs.id = modifier.attrs.id;
    altModifier.startSelector = this._getEquivalentSelector(altModifier.startSelector);
    altModifier.endSelector = this._getEquivalentSelector(altModifier.endSelector);
    this.storeScore.staves[this._getEquivalentStaff(modifier.associatedStaff)].removeStaffModifier(altModifier);
  }
  /**
   * Remove selected modifier
   * @param modifier slur, hairpin, etc.
   * @returns 
   */
  async removeStaffModifier(modifier: StaffModifierBase): Promise<void> {
    this.undoStaffModifier('Set measure proportion', modifier,
      UndoBuffer.bufferSubtypes.REMOVE);
    this._removeStaffModifier(modifier);
    this._renderRectangle(modifier.startSelector, modifier.endSelector);
    return this.renderer.updatePromise();
  }
  /**
   * Change a staff modifier
   * @param original original version
   * @param modifier modified version
   * @returns 
   */
  async addOrUpdateStaffModifier(original: StaffModifierBase, modifier: StaffModifierBase): Promise<void> {
    if (!modifier) {
      if (original) {
        // Handle legacy API changed
        modifier = StaffModifierBase.deserialize(original);
      } else {
        console.warn('update modifier: bad modifier');
        return PromiseHelpers.emptyPromise();
      }
    }
    const existing = this.score.staves[modifier.startSelector.staff]
      .getModifier(modifier);
    const subtype = existing === null ? UndoBuffer.bufferSubtypes.ADD :
      UndoBuffer.bufferSubtypes.UPDATE;
    this.undoStaffModifier('Set measure proportion', original,
      subtype);
    this._removeStaffModifier(modifier);
    const copy = StaffModifierBase.deserialize(modifier.serialize());
    copy.startSelector = this._getEquivalentSelector(copy.startSelector);
    copy.endSelector = this._getEquivalentSelector(copy.endSelector);
    const sel = SmoSelection.noteFromSelector(this.score, modifier.startSelector);
    if (sel !== null) {
      const altSel = this._getEquivalentSelection(sel);
      SmoOperation.addStaffModifier(sel, modifier);
      SmoOperation.addStaffModifier(altSel!, copy);
      const modId = 'mod-' + sel.selector.staff + '-' + sel.selector.measure;
      const context = this.renderer.renderer.getRenderer(sel.measure.svg.logicalBox);
      if (context) {
        SvgHelpers.removeElementsByClass(context.svg, modId);
      }
    }
    this._renderRectangle(modifier.startSelector, modifier.endSelector);
    return this.renderer.updatePromise();
  }
  lineOperation(op: createStaffModifierType<StaffModifierBase>) {
    // if (this.tracker.selections.length < 2) {
    //   return;
    // }
    const measureSelections = this.undoTrackerMeasureSelections('create staff modifier');
    const ft = this.tracker.getExtremeSelection(-1);
    const tt = this.tracker.getExtremeSelection(1);
    const ftAlt = this._getEquivalentSelection(ft);
    const ttAlt = this._getEquivalentSelection(tt);
    const modifier = op(ft, tt);
    const altModifier = op(ftAlt!, ttAlt!);
    altModifier.attrs.id = modifier.attrs.id;
    ft.staff.addStaffModifier(modifier);
    ftAlt?.staff.addStaffModifier(altModifier);
    this.undoStaffModifier('add ' + op, modifier, UndoBuffer.bufferSubtypes.ADD);
    this._renderChangedMeasures(measureSelections);
  }
  /**
   * Add crescendo to selection
   */
  async crescendo(): Promise<void> {
    this.lineOperation(SmoOperation.createCrescendo);
    return this.renderer.updatePromise();
  }
  /**
   * Add crescendo to selection
   */
  async crescendoBracket(): Promise<void> {
    this.lineOperation(SmoOperation.createCrescendoBracket);
    return this.renderer.updatePromise();
  }
  /**
   * Add crescendo to selection
   */
  async dimenuendo(): Promise<void> {
    this.lineOperation(SmoOperation.createDimenuendoBracket);
    return this.renderer.updatePromise();
  }
  /**
   * Add crescendo to selection
   */
  async accelerando(): Promise<void> {
    this.lineOperation(SmoOperation.createAccelerandoBracket);
    return this.renderer.updatePromise();
  }
  /**
   * Add crescendo to selection
   */
  async ritard(): Promise<void> {
    this.lineOperation(SmoOperation.createRitardBracket);
    return this.renderer.updatePromise();
  }
  /**
   * diminuendo hairpin
   * @returns 
   */
  async decrescendo(): Promise<void> {
    this.lineOperation(SmoOperation.createDecrescendo);
    return this.renderer.updatePromise();
  }
  async removeTextBracket(bracket: SmoStaffTextBracket): Promise<void> {
    return this.removeStaffModifier(bracket);
  }
  async addOrReplaceStaffModifier(callback: updateStaffModifierFunc, modifier: StaffModifierBase): Promise<void> {
    const from1 = SmoSelection.noteFromSelector(this.score, modifier.startSelector);
    const to1 = SmoSelection.noteFromSelector(this.score, modifier.endSelector);
    if (from1 === null || to1 === null) {
      return;
    }
    const altFrom = this._getEquivalentSelection(from1);
    const altTo = this._getEquivalentSelection(to1);
    if (altFrom === null || altTo === null) {
      return;
    }
    callback(this.score, from1, to1);
    callback(this.storeScore, altFrom, altTo);
    const redraw = SmoSelection.getMeasuresBetween(this.score, from1.selector, to1.selector);
    this.undoStaffModifier('add repl text bracket', modifier, UndoBuffer.bufferSubtypes.ADD);
    this._renderChangedMeasures(redraw);
    return this.renderer.updatePromise();
  }
  async addOrReplaceTextBracket(modifier: SmoStaffTextBracket) {
    const from1 = SmoSelection.noteFromSelector(this.score, modifier.startSelector);
    const to1 = SmoSelection.noteFromSelector(this.score, modifier.endSelector);
    if (from1 === null || to1 === null) {
      return;
    }
    const altFrom = this._getEquivalentSelection(from1);
    const altTo = this._getEquivalentSelection(to1);
    if (altFrom === null || altTo === null) {
      return;
    }
    SmoOperation.addOrReplaceBracket(modifier, from1, to1);
    SmoOperation.addOrReplaceBracket(modifier, altFrom, altTo);
    const redraw = SmoSelection.getMeasuresBetween(this.score, from1.selector, to1.selector);
    this.undoStaffModifier('add repl text bracket', modifier, UndoBuffer.bufferSubtypes.ADD);
    this._renderChangedMeasures(redraw);
    return this.renderer.updatePromise();
  }
  /**
   * Slur selected notes
   * @returns
   */
  async addSlur(): Promise<void> {
    const measureSelections = SmoSelection.getMeasureList(this.tracker.selections);
    const ft = this.tracker.getExtremeSelection(-1);
    const tt = this.tracker.getExtremeSelection(1);
    const ftAlt = this._getEquivalentSelection(ft);
    const ttAlt = this._getEquivalentSelection(tt);
    const modifier = SmoOperation.createSlur(this.score, ft, tt);
    ft.staff.addStaffModifier(modifier);
    // make sure score and backup have same ID for undo.
    const altModifier = SmoOperation.createSlur(this.storeScore, ftAlt!, ttAlt!);
    altModifier.attrs.id = modifier.attrs.id;
    ftAlt?.staff.addStaffModifier(altModifier);
    this.undoStaffModifier('add slur', modifier, UndoBuffer.bufferSubtypes.ADD);
    this._renderChangedMeasures(measureSelections);
    return this.renderer.updatePromise();
  }
  /**
   * tie selected notes
   * @returns 
   */
  async tie(): Promise<void> {
    this.lineOperation(SmoOperation.createTie);
    return this.renderer.updatePromise();
  }
  async updateZoom(zoomFactor: number): Promise<void> {
    const original = this.score.layoutManager!.getGlobalLayout();
    original.zoomScale = zoomFactor;
    this.score.layoutManager!.globalLayout.zoomScale = zoomFactor;
    this.renderer.pageMap.updateZoom(zoomFactor);
    this.renderer.pageMap.updateContainerOffset(this.scroller.scrollState);
  }
  /**
   * set global page for score, zoom etc.
   * @param layout global SVG settings
   * @returns 
   */
  async setGlobalLayout(layout: SmoGlobalLayout): Promise<void> {
    this._undoScore('Set Global Layout');
    const original = this.score.layoutManager!.getGlobalLayout().svgScale;
    this.score.layoutManager!.updateGlobalLayout(layout);
    this.score.scaleTextGroups(original / layout.svgScale);
    this.storeScore.layoutManager!.updateGlobalLayout(layout);
    this.renderer.rerenderAll();
    return this.renderer.preserveScroll();
  }
  /**
   * Set the layout of a single page
   * @param layout page layout
   * @param pageIndex which page to change
   * @returns 
   */
  async setPageLayout(layout: SmoPageLayout, pageIndex: number) {
    this.score.layoutManager!.updatePage(layout, pageIndex);
    this.storeScore.layoutManager!.updatePage(layout, pageIndex);
    // If we are in part mode, save the page layout in the part so it is there next time
    // the part is exposed.
    if (this.isPartExposed()) {
      this.score.staves.forEach((staff, staffIx) => {
        staff.partInfo.layoutManager.updatePage(layout, pageIndex);
        const altStaff = this.storeScore.staves[this.staffMap[staffIx]];
        altStaff.partInfo.layoutManager.updatePage(layout, pageIndex);
      });
    }
    await this.refreshViewport();
  }
  async setPageLayouts(layout: SmoPageLayout, startIndex: number, endIndex: number) {
    this._undoScore('Set Page Layout');
    let i = 0;
    for (i = startIndex; i <= endIndex; ++i) {
      this.setPageLayout(layout, i);
    }
    this.renderer.rerenderAll();
    return this.renderer.updatePromise();
  }
  /**
   * Update the music font
   * @param family 
   * @returns 
   */
  async setEngravingFontFamily(family: engravingFontType): Promise<void> {
    this.score.engravingFont = family;
    this.storeScore.engravingFont = family;
    this.renderer.notifyFontChange();   
    this.renderer.setRefresh();
    return this.renderer.updatePromise();
  }
  /**
   * Upate global font used for chord changes
   * @param fontInfo
   * @returns 
   */
  async setChordFont(fontInfo: FontInfo): Promise<void> {
    this._undoScore('Set Chord Font');
    this.score.setChordFont(fontInfo);
    this.storeScore.setChordFont(fontInfo);
    this.renderer.setRefresh();
    return this.renderer.updatePromise();
  }
  /**
   * Update font used for lyrics
   * @param fontInfo 
   * @returns 
   */
  async setLyricFont(fontInfo: FontInfo): Promise<void> {
    this._undoScore('Set Lyric Font');
    this.score.setLyricFont(fontInfo);
    this.storeScore.setLyricFont(fontInfo);
    this.renderer.setRefresh();
    return this.renderer.updatePromise();
  }
  /**
   * @param value if false, lyric widths don't affect measure width
   * @returns 
   */
  async setLyricAdjustWidth(value: boolean): Promise<void> {
    this._undoScore('Set Lyric Adj Width');
    this.score.setLyricAdjustWidth(value);
    this.storeScore.setLyricAdjustWidth(value);
    this.renderer.setRefresh();
    return this.renderer.updatePromise();
  }
  /**
   * delete selected measures
   * @returns 
   */
  async deleteMeasure(): Promise<void> {
    this._undoScore('Delete Measure');
    if (this.storeScore.staves[0].measures.length < 2) {
      return PromiseHelpers.emptyPromise();
    }
    const selections = SmoSelection.getMeasureList(this.tracker.selections);
    // THe measures get renumbered, so keep the index at 0
    const index = selections[0].selector.measure;
    for (var i = 0; i < selections.length; ++i) {
      // Unrender the deleted measure
      this.score.staves.forEach((staff) => {
        this.tracker.clearMeasureMap(staff.measures[index]);
        this.renderer.unrenderMeasure(staff.measures[index]);
        this.renderer.unrenderMeasure(staff.measures[staff.measures.length - 1]);
        // A little hacky - delete the modifiers if they start or end on
        // the measure
        staff.renderableModifiers.forEach((modifier) => {
          if (modifier.startSelector.measure === index || modifier.endSelector.measure === index) {
            if (modifier.logicalBox) {
              const context = this.renderer.renderer.getRenderer(modifier.logicalBox);
              if (context) {
                $(context.svg).find('g.' + modifier.attrs.id).remove();
              }
            }
          }
        });
      });
      // Remove the SVG artifacts mapped to this measure.
      this.score.deleteMeasure(index);
      this.storeScore.deleteMeasure(index);
      // Note: index doesn't increment since there are now 1 fewer measures
    };
    this.renderer.setRefresh();
    return this.renderer.updatePromise();
  }
  /**
   * add number of measures, with default notes selections
   * @param append 
   * @param numberToAdd 
   * @returns 
   */
  async addMeasures(append: boolean, numberToAdd: number): Promise<void> {
    let pos = 0;
    let ix = 0;
    this._undoScore('Add Measure');
    for (ix = 0; ix < numberToAdd; ++ix) {
      const measure = this.tracker.getFirstMeasureOfSelection();
      if (measure) {
        const nmeasure = SmoMeasure.getDefaultMeasureWithNotes(measure);
        pos = measure.measureNumber.measureIndex;
        if (append) {
          pos += 1;
        }
        nmeasure.measureNumber.measureIndex = pos;
        nmeasure.setActiveVoice(0);
        this.score.addMeasure(pos);
        this.storeScore.addMeasure(pos);
      }
    }
    this.renderer.setRefresh();
    return this.renderer.updatePromise();
  }
  /**
   * add a single measure before or after selection
   * @param append 
   * @returns 
   */
  async addMeasure(append: boolean): Promise<void> {
    this._undoScore('Add Measure');
    let pos = 0;
    const measure = this.tracker.getFirstMeasureOfSelection();
    if (!measure) {
      return;
    }
    const nmeasure = SmoMeasure.getDefaultMeasureWithNotes(measure);
    pos = measure.measureNumber.measureIndex;
    if (append) {
      pos += 1;
    }
    nmeasure.measureNumber.measureIndex = pos;
    nmeasure.setActiveVoice(0);
    this.score.addMeasure(pos);
    this.storeScore.addMeasure(pos);
    this.renderer.clearLine(measure);
    this.renderer.setRefresh();
    return this.renderer.updatePromise();
  }
  /**
   * remove an entire line of music
   * @returns
   */
  async removeStaff(): Promise<void> {
    this._undoScore('Remove Instrument');
    if (this.storeScore.staves.length < 2 || this.score.staves.length < 2) {
      return PromiseHelpers.emptyPromise();
    }
    // if we are looking at a subset of the score,
    // revert to the full score view before removing the staff.
    const sel = this.tracker.selections[0];
    const scoreSel = this._getEquivalentSelection(sel);
    const staffIndex = scoreSel!.selector.staff;
    SmoOperation.removeStaff(this.storeScore, staffIndex);
    this.viewAll();
    this.renderer.setRefresh();
    return this.renderer.updatePromise();
  }
  async addStaff(instrument: SmoSystemStaffParams): Promise<void> {
    this._undoScore('Add Instrument');
    // if we are looking at a subset of the score, we won't see the new staff.  So
    // revert to the full view
    const staff = SmoOperation.addStaff(this.storeScore, instrument);
    const instKeys = Object.keys(staff.measureInstrumentMap);
    // update the key signatures for the new part
    instKeys.forEach((key) => {
      const numKey = parseInt(key, 10);
      const inst = staff.measureInstrumentMap[numKey];
      const selections = SmoSelection.innerSelections(this.storeScore, inst.startSelector, inst.endSelector);
      SmoOperation.changeInstrument(inst, selections);
    })
    if (instrument.staffId > 0) {
      const selection = SmoSelection.measureSelection(this.storeScore, instrument.staffId - 1, 0);
      const sel = SmoSelector.default;
      sel.staff = instrument.staffId - 1;
      if (selection) {
        let grp = this.storeScore.getSystemGroupForStaff(selection);
        if (grp) {
          grp.endSelector.staff = instrument.staffId;
        } else {
          let grp = new SmoSystemGroup(SmoSystemGroup.defaults);
          grp.startSelector.staff = instrument.staffId - 1;
          grp.endSelector.staff = instrument.staffId;
          this.storeScore.systemGroups.push(grp);
        }
      }
    }
    this.viewAll();
    return this.renderer.updatePromise();
  }
  /**
   * Update part info assumes that the part is currently exposed - that
   * staff 0 is the first staff in the part prior to editing.
   * @param info
   */
  async updatePartInfo(info: SmoPartInfo): Promise<void> {
    let i: number = 0;
    this._undoScore('Update part info');
    const storeStaff = this.staffMap[0] - info.stavesBefore;
    const partLength = info.stavesBefore + info.stavesAfter + 1;
    const resetView = !SmoLayoutManager.areLayoutsEqual(info.layoutManager.getGlobalLayout(), this.score.layoutManager!.getGlobalLayout());
    const restChange = this.score.staves[0].partInfo.expandMultimeasureRests != info.expandMultimeasureRests;
    const stavesChange = this.score.staves[0].partInfo.stavesAfter !== info.stavesAfter;
    for (i = 0; i < partLength; ++i) {
      const nStaffIndex = storeStaff + i;
      const nInfo = new SmoPartInfo(info);
      nInfo.stavesBefore = i;
      nInfo.stavesAfter = partLength - i - 1;
      this.storeScore.staves[nStaffIndex].partInfo = nInfo;
      // If the staff index is currently displayed, 
      const displayedIndex = this.staffMap.findIndex((x) => x === nStaffIndex);
      if (displayedIndex >= 0) {
        this.score.staves[displayedIndex].partInfo = new SmoPartInfo(nInfo);
        this.score.layoutManager = nInfo.layoutManager;
      }
    }
    if (resetView || restChange || stavesChange) {
      SmoOperation.computeMultipartRest(this.score);
      // this.resetPartView();
      this.renderer.rerenderAll()
    }
    return this.renderer.updatePromise();
  }
  /**
   * A simpler API for applications to add a new staff to the score.
   * @param params - the instrument, which determines clef, etc.
   * @returns 
   */
  async addStaffSimple(params: Partial<SmoInstrumentParams>): Promise<void> {
    const instrumentParams = SmoInstrument.defaults;
    instrumentParams.startSelector.staff = instrumentParams.endSelector.staff = this.score.staves.length;
    instrumentParams.clef = params.clef ?? instrumentParams.clef;

    const staffParams = SmoSystemStaff.defaults;
    staffParams.staffId = this.storeScore.staves.length; // add a staff
    staffParams.measureInstrumentMap[0] = new SmoInstrument(instrumentParams);
    this.addStaff(staffParams);
    return this.renderer.updatePromise();
  }
  /**
   * Save the score to local storage.
   */
  quickSave() {
    const scoreStr = JSON.stringify(this.storeScore.serialize());
    localStorage.setItem(smoSerialize.localScore, scoreStr);
  }
  updateRepeatCount(count: number) {
    const measureSelections = this.undoTrackerMeasureSelections('repeat bar');
    const symbol = count > 0 ? true : false;    
    measureSelections.forEach((ms) => {
      const store = this._getEquivalentSelection(ms);
      ms.measure.repeatCount = count;
      ms.measure.repeatSymbol = symbol;
      if (store) {
        store.measure.repeatCount = count;
        store.measure.repeatSymbol = symbol;
      }
    });
    this._renderChangedMeasures(measureSelections);
    return this.updatePromise();
  }
  /**
   * Update the measure formatting parameters for the current selection
   * @param format generic measure formatting parameters
   * @returns 
   */
  setMeasureFormat(format: SmoMeasureFormat): Promise<any> {
    const label = 'set measure format';
    const fromSelector = this.tracker.getExtremeSelection(-1).selector;
    const toSelector = this.tracker.getExtremeSelection(1).selector;
    const measureSelections = this.tracker.getSelectedMeasures();
    // If the formatting is on a part, preserve it in the part's info
    const isPart = this.isPartExposed();
    measureSelections.forEach((m) => {
      this._undoColumn(label, m.selector.measure);
      SmoOperation.setMeasureFormat(this.score, m, format);
      if (isPart) {
        m.staff.partInfo.measureFormatting[m.measure.measureNumber.measureIndex] = new SmoMeasureFormat(format);
      }
      const alt = this._getEquivalentSelection(m);
      SmoOperation.setMeasureFormat(this.storeScore, alt!, format);
      if (isPart) {
        alt!.staff.partInfo.measureFormatting[m.measure.measureNumber.measureIndex] = new SmoMeasureFormat(format);
      }
    });
    this._renderRectangle(fromSelector, toSelector);
    return this.renderer.updatePromise();
  }
  /**
   * Remove system breaks from the measure formatting for selected measures
   * @returns 
   */
  removeSystemBreaks(): Promise<any> {
    const label = 'set measure format';
    const fromSelector = this.tracker.getExtremeSelection(-1).selector;
    const toSelector = this.tracker.getExtremeSelection(1).selector;
    const measureSelections = this.tracker.getSelectedMeasures();
    // If the formatting is on a part, preserve it in the part's info
    const isPart = this.isPartExposed();
    measureSelections.forEach((m) => {
      this._undoColumn(label, m.selector.measure);
      const format = new SmoMeasureFormat(m.measure.format);
      format.systemBreak = false;
      SmoOperation.setMeasureFormat(this.score, m, format);
      if (isPart) {
        m.staff.partInfo.measureFormatting[m.measure.measureNumber.measureIndex] = new SmoMeasureFormat(format);
      }
      const alt = this._getEquivalentSelection(m);
      SmoOperation.setMeasureFormat(this.storeScore, alt!, format);
      if (isPart) {
        alt!.staff.partInfo.measureFormatting[m.measure.measureNumber.measureIndex] = new SmoMeasureFormat(format);
      }
    });
    this._renderRectangle(fromSelector, toSelector);
    return this.renderer.updatePromise();
  }
  renumberMeasures(measureIndex: number, localIndex: number) {
    this.score.updateRenumberingMap(measureIndex, localIndex);
    this.storeScore.updateRenumberingMap(measureIndex, localIndex);
    const mmsel = SmoSelection.measureSelection(this.score, 0, measureIndex);
    if (mmsel) {
      this._renderChangedMeasures([mmsel]);
    }
    return this.renderer.updatePromise();
  }
  /**
   * Play the music from the starting selection
   * @returns 
   */
  playFromSelection(): void {
    var mm = this.tracker.getExtremeSelection(-1);
    if (SuiAudioPlayer.playingInstance && SuiAudioPlayer.playingInstance.paused) {
      SuiAudioPlayer.playingInstance.play();
      return;
    }
    if (SuiAudioPlayer.playing) {
      return;
    }
    new SuiAudioPlayer({ audioAnimation: this.audioAnimation, score: this.score, startIndex: mm.selector.measure, view: this }).play();
  }
  stopPlayer() {
    SuiAudioPlayer.stopPlayer();
  }
  pausePlayer() {
    SuiAudioPlayer.pausePlayer();
  }

  /**
   * Proxy calls to move the tracker parameters according to the
   * rules of the 'Home' key (depending on shift/ctrl/alt)
   * @param ev 
   * @returns 
   */
  async moveHome(ev: KeyEvent): Promise<any> {
    this.tracker.moveHome(this.score, ev);
    await this.renderer.updatePromise();
  }
  /**
   * Proxy calls to move the tracker parameters according to the
   * rules of the 'End' key (depending on shift/ctrl/alt)
   * @param ev 
   * @returns 
   */
   async moveEnd(ev: KeyEvent): Promise<any> {
    this.tracker.moveEnd(this.score, ev);
    await this.renderer.updatePromise();
  }
  /**
   * Grow the current selection by one to the left, if possible
   * @param ev 
   * @returns 
   */
   async growSelectionLeft(): Promise<any> {
    this.tracker.growSelectionLeft();
    await this.renderer.updatePromise();
  }
  /**
   * Grow the current selection by one to the right, if possible
   * @param ev 
   * @returns 
   */
   async growSelectionRight(): Promise<any> {
    this.tracker.growSelectionRight();
    await this.renderer.updatePromise();
  }
  /**
   * Select the next tabbable modifier near one of the selected notes
   * @param keyEv 
   * @returns 
   */
  async advanceModifierSelection(keyEv: KeyEvent): Promise<any> {
    this.tracker.advanceModifierSelection(this.score, keyEv);
    await this.renderer.updatePromise();
  }
  /**
   * Select the next entire measure, if possible
   * @returns 
   */
  async growSelectionRightMeasure(): Promise<any> {
    this.tracker.growSelectionRightMeasure();
    await this.renderer.updatePromise();
  }
  /**
   * Advance cursor forwards, if possible
   * @param ev 
   * @returns 
   */
  async moveSelectionRight(ev: KeyEvent): Promise<any> {
    this.tracker.moveSelectionRight(this.score, ev, true);
    await this.renderer.updatePromise();
  }
  /**
   * Advance cursor backwards, if possible
   * @param ev 
   * @returns 
   */
  async moveSelectionLeft(): Promise<any> {
    this.tracker.moveSelectionLeft();
    await this.renderer.updatePromise();
  }
  /**
   * Advance cursor back entire measure, if possible
   * @returns 
   */
  async moveSelectionLeftMeasure(): Promise<any> {
    this.tracker.moveSelectionLeftMeasure();
    await this.renderer.updatePromise();
  }
  /**
   * Advance cursor forward one measure, if possible
   * @returns 
   */
  async moveSelectionRightMeasure(): Promise<any> {
    this.tracker.moveSelectionRightMeasure();
    await this.renderer.updatePromise();
  }
  /**
   * Move cursor to a higher pitch in the current chord, with wrap
   * @returns 
   */
  async moveSelectionPitchUp(): Promise<any> {
    this.tracker.moveSelectionPitchUp();
    await this.renderer.updatePromise();
  }
  /**
   * Move cursor to a lower pitch in the current chord, with wrap
   */
  async moveSelectionPitchDown(): Promise<any> {
    this.tracker.moveSelectionPitchDown();
    await this.renderer.updatePromise();
  }
  /**
   * Move cursor up a staff in the system, if possible
   * @returns 
   */
  async moveSelectionUp(): Promise<any> {
    this.tracker.moveSelectionUp();
    await this.renderer.updatePromise();
  }
  /**
   * Move cursor down a staff in the system, if possible
   * @returns 
   */
   async moveSelectionDown(): Promise<any> {
    this.tracker.moveSelectionDown();
    await this.renderer.updatePromise();
  }
  /**
   * Set the current suggestions (hover element) as the selection
   * @returns 
   */
   async selectSuggestion(evData: KeyEvent): Promise<any> {
    this.tracker.selectSuggestion(this.score, evData);
    await this.renderer.updatePromise();
  }
  /**
   * Find an element at the given box, and make it the current selection
   *  */
  async intersectingArtifact(evData: SvgBox): Promise<any> {
    this.tracker.intersectingArtifact(evData);
    await this.renderer.updatePromise();
  }  
}
