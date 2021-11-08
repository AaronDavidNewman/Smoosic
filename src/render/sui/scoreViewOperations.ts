// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiScoreView } from './scoreView';
import { SmoScore, SmoScorePreferences, SmoScoreInfo } from '../../smo/data/score';
import { SmoSystemStaffParams, SmoSystemStaff } from '../../smo/data/systemStaff';
import { SmoPartInfo } from '../../smo/data/partInfo';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoNote } from '../../smo/data/note';
import { KeyEvent, SvgBox, Pitch, PitchLetter, FontInfo, SmoConfiguration } from '../../smo/data/common';
import { SmoTextGroup, SmoSystemGroup, SmoPageLayout, SmoGlobalLayout, SmoLayoutManager } from '../../smo/data/scoreModifiers';
import { SmoDynamicText, SmoNoteModifierBase, SmoGraceNote, SmoArticulation, SmoOrnament, SmoLyric, SmoMicrotone } from '../../smo/data/noteModifiers';
import { SmoTempoText, SmoVolta, SmoBarline, SmoRepeatSymbol, SmoRehearsalMark, SmoMeasureFormat, TimeSignature } from '../../smo/data/measureModifiers';
import { UndoBuffer, SmoUndoable } from '../../smo/xform/undo';
import { SmoOperation } from '../../smo/xform/operations';
import { BatchSelectionOperation } from '../../smo/xform/operations';
import { SmoToMidi } from '../../smo/midi/smoToMidi';
import { SmoToXml } from '../../smo/mxml/smo2Xml';
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoMusic } from '../../smo/data/music';
import { SuiOscillator } from '../audio/oscillator';
import { SuiAudioPlayer } from '../audio/player';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { StaffModifierBase, SmoInstrument } from '../../smo/data/staffModifiers';
import { SuiRenderState } from './renderState';
import { htmlHelpers } from '../../common/htmlHelpers';
import { SuiActionPlayback } from './actionPlayback';
import { SuiPiano } from './piano';
declare var $: any;
declare var SmoConfig: SmoConfiguration;

// ## ScoreViewOperations
// MVVM-like operations on the displayed score.
// All operations that can be performed on a 'live' score go through this
// module.  It maps the score view to the actual score and makes sure the
// model and view stay in sync.
export class SuiScoreViewOperations extends SuiScoreView {
  addTextGroup(textGroup: SmoTextGroup) {
    this.actionBuffer.addAction('addTextGroup', textGroup);
    const altNew = SmoTextGroup.deserialize(textGroup.serialize());
    SmoUndoable.changeTextGroup(this.score, this.undoBuffer, textGroup,
      UndoBuffer.bufferSubtypes.ADD);
    SmoUndoable.changeTextGroup(this.storeScore, this.storeUndo, altNew,
      UndoBuffer.bufferSubtypes.ADD);
    this.renderer.renderScoreModifiers();
  }

  removeTextGroup(textGroup: SmoTextGroup) {
    this.actionBuffer.addAction('removeTextGroup', textGroup);
    const index = this.score.textGroups.findIndex((grp) => textGroup.attrs.id === grp.attrs.id);
    const altGroup = this.storeScore.textGroups[index];
    SmoUndoable.changeTextGroup(this.score, this.undoBuffer, textGroup,
      UndoBuffer.bufferSubtypes.REMOVE);
    SmoUndoable.changeTextGroup(this.storeScore, this.storeUndo, altGroup,
      UndoBuffer.bufferSubtypes.REMOVE);
    this.renderer.renderScoreModifiers();
  }

  updateTextGroup(oldVersion: SmoTextGroup, newVersion: SmoTextGroup) {
    this.actionBuffer.addAction('updateTextGroup', oldVersion, newVersion);
    const index = this.score.textGroups.findIndex((grp) => oldVersion.attrs.id === grp.attrs.id);
    const isPartExposed = this.isPartExposed(this.score.staves[0]);
    SmoUndoable.changeTextGroup(this.score, this.undoBuffer, oldVersion,
      UndoBuffer.bufferSubtypes.UPDATE);
    // If this is part text, don't store it in the score text, except for the displayed score
    if (!isPartExposed) {
      SmoUndoable.changeTextGroup(this.storeScore, this.storeUndo, this.storeScore.textGroups[index], UndoBuffer.bufferSubtypes.UPDATE);
      const altNew = SmoTextGroup.deserialize(newVersion.serialize());
      this.storeScore.textGroups[index] = altNew;
    } else {
      const partInfo = this.score.staves[0].partInfo;
      if (partInfo.preserveTextGroups) {
        partInfo.textGroups = this.score.textGroups;
      }
      const tgs: SmoTextGroup[] = [];
      partInfo.textGroups.forEach((tg) => {
        tgs.push(SmoTextGroup.deserialize(tg.serialize()));
      })
      this.storeScore.staves[this.staffMap[0]].partInfo.textGroups = tgs;
    }
    // TODO: only render the one TG.
    this.renderer.renderScoreModifiers();
  }
  // ### updateScorePreferences
  // The score preferences for view score have changed, sync them
  updateScorePreferences(pref: SmoScorePreferences) {
    this._undoScorePreferences('Update preferences');
    // TODO: add action buffer here?
    this.score.updateScorePreferences(JSON.parse(JSON.stringify(pref)));
    this.storeScore.updateScorePreferences(JSON.parse(JSON.stringify(pref)));
    this.renderer.setDirty();
  }
  // ### updateScorePreferences
  // The score preferences for view score have changed, sync them
  updateScoreInfo(scoreInfo: SmoScoreInfo) {
    this._undoScorePreferences('Update preferences');
    // TODO: add action buffer here?
    this.score.scoreInfo = scoreInfo;
    this.storeScore.scoreInfo = JSON.parse(JSON.stringify(scoreInfo));
    this.renderer.setDirty();
  }

  addRemoveMicrotone(tone: SmoMicrotone) {
    this.actionBuffer.addAction('addRemoveMicrotone', tone);
    const selections = this.tracker.selections;
    const altSelections = this._getEquivalentSelections(selections);
    const measureSelections = this._undoTrackerMeasureSelections('add/remove microtone');

    SmoOperation.addRemoveMicrotone(null, selections, tone);
    SmoOperation.addRemoveMicrotone(null, altSelections, tone);
    this._renderChangedMeasures(measureSelections);
  }
  addDynamic(selection: SmoSelection, dynamic: SmoDynamicText) {
    this.actionBuffer.addAction('addDynamic', dynamic);
    this._undoFirstMeasureSelection('add dynamic');
    this._removeDynamic(selection, dynamic);
    const equiv = this._getEquivalentSelection(selection);
    SmoOperation.addDynamic(selection, dynamic);
    SmoOperation.addDynamic(equiv!, SmoNoteModifierBase.deserialize(dynamic.serialize() as any));
    this.renderer.addToReplaceQueue(selection);
  }
  _removeDynamic(selection: SmoSelection, dynamic: SmoDynamicText) {
    const equiv = this._getEquivalentSelection(selection);
    if (equiv !== null && equiv.note !== null) {
      const altModifiers = equiv.note.getModifiers('SmoDynamicText');
      SmoOperation.removeDynamic(selection, dynamic);
      if (altModifiers.length) {
        SmoOperation.removeDynamic(equiv, altModifiers[0]);
      }
    }
  }
  removeDynamic(dynamic: SmoDynamicText) {
    const sel = this.tracker.modifierSelections[0];
    if (!sel.selection) {
      return;
    }
    this.tracker.selections = [sel.selection];
    this.actionBuffer.addAction('removeDynamic', dynamic);
    this._undoFirstMeasureSelection('remove dynamic');
    this._removeDynamic(sel.selection, dynamic);
    this.renderer.addToReplaceQueue(sel.selection);
  }
  // ### deleteNote
  // we never really delete a note, but we will convert it into a rest and if it's
  // already a rest we will try to hide it.
  deleteNote() {
    this.actionBuffer.addAction('deleteNote');
    const measureSelections = this._undoTrackerMeasureSelections('delete note');
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
        if (sel.note.isRest() && !sel.note.hidden) {
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
  }
  // ### removeLyric
  // The lyric editor moves around, so we can't depend on the tracker for the
  // correct selection.  We get it directly from the editor.
  removeLyric(selector: SmoSelector, lyric: SmoLyric) {
    this.actionBuffer.addAction('removeLyric', selector, lyric);
    const selection = SmoSelection.noteFromSelector(this.score, selector);
    if (selection === null) {
      return;
    }
    this._undoSelection('remove lyric', selection);
    selection.note!.removeLyric(lyric);
    const equiv = this._getEquivalentSelection(selection);
    const storeLyric = equiv!.note!.getLyricForVerse(lyric.verse, lyric.parser);
    if (typeof (storeLyric) !== 'undefined') {
      equiv!.note!.removeLyric(lyric);
    }
    this.renderer.addToReplaceQueue(selection);
  }

  addOrUpdateLyric(selector: SmoSelector, lyric: SmoLyric) {
    this.actionBuffer.addAction('addOrUpdateLyric', selector, lyric);
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
  }

  depopulateVoice() {
    this.actionBuffer.addAction('depopulateVoice');
    const measureSelections = this._undoTrackerMeasureSelections('depopulate voice');
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
  }
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
  populateVoice(index: number) {
    const measuresToAdd = this._changeActiveVoice(index);
    if (measuresToAdd.length === 0) {
      SmoOperation.setActiveVoice(this.score, index);
      this.tracker.selectActiveVoice();
      return;
    }
    this.actionBuffer.addAction('populateVoice', index);
    measuresToAdd.forEach((selection) => {
      this._undoSelection('popualteVoice', selection);
      SmoOperation.populateVoice(selection, index);
      const equiv = this._getEquivalentSelection(selection);
      SmoOperation.populateVoice(equiv!, index);
    });
    SmoOperation.setActiveVoice(this.score, index);
    this._renderChangedMeasures(measuresToAdd);
  }
  changeInstrument(instrument: SmoInstrument, selections: SmoSelection[]) {
    if (typeof (selections) === 'undefined') {
      selections = this.tracker.selections;
    }
    this.actionBuffer.addAction('changeInstrument', instrument, selections);
    this._undoSelections('change instrument', selections);
    const altSelections = this._getEquivalentSelections(selections);
    SmoOperation.changeInstrument(instrument, selections);
    SmoOperation.changeInstrument(instrument, altSelections);
    this._renderChangedMeasures(selections);
  }
  setTimeSignature(timeSignature: TimeSignature, timeSignatureString: string) {
    this.actionBuffer.addAction('setTimeSignature', timeSignature);
    this._undoScore('Set time signature');
    const selections = this.tracker.selections;
    const altSelections = this._getEquivalentSelections(selections);
    SmoOperation.setTimeSignature(this.score, selections, timeSignature, timeSignatureString);
    SmoOperation.setTimeSignature(this.storeScore, altSelections, timeSignature, timeSignatureString);
    this._renderChangedMeasures(SmoSelection.getMeasureList(this.tracker.selections));
  }
  moveStaffUpDown(index: number) {
    this.actionBuffer.addAction('moveStaffUpDown', index);
    this._undoScore('re-order staves');
    // Get staff to move
    const selection = this._getEquivalentSelection(this.tracker.selections[0]);
    // Make the move in the model, and reset the view so we can see the new
    // arrangement
    SmoOperation.moveStaffUpDown(this.storeScore, selection!, index);
    this.viewAll();
  }
  addOrUpdateStaffGroup(staffGroup: SmoSystemGroup) {
    this.actionBuffer.addAction('addOrUpdateStaffGroup', staffGroup);
    this._undoScore('group staves');
    // Assume that the view is now set to full score
    this.score.addOrReplaceSystemGroup(staffGroup);
    this.storeScore.addOrReplaceSystemGroup(staffGroup);
    this.renderer.setDirty();
  }
  addStaffGroupDown(braceType: number) {
    this.actionBuffer.addAction('addStaffGroupDown', braceType);
    this._undoScore('group staves');
    const ft = this._getEquivalentSelection(this.tracker.getExtremeSelection(-1));
    const tt = this._getEquivalentSelection(this.tracker.getExtremeSelection(1));
    const selections = this._getEquivalentSelections(this.tracker.selections);
    const params = SmoSystemGroup.defaults;
    params.startSelector = ft!.selector;
    params.endSelector = tt!.selector;
    params.mapType = SmoSystemGroup.mapTypes.allMeasures;
    params.leftConnector = braceType;
    params.rightConnector = SmoSystemGroup.connectorTypes.single;

    SmoOperation.addConnectorDown(this.storeScore, selections, new SmoSystemGroup(params));
    this.viewAll();
  }
  // ### updateTempoScore
  // Update the tempo for the entire score
  updateTempoScore(tempo: SmoTempoText, scoreMode: boolean) {
    let measureIndex = 0;
    let startSelection = this.tracker.getExtremeSelection(-1);
    this._undoScore('update score tempo');
    this.actionBuffer.addAction('updateTempoScore', tempo, scoreMode);
    const measureCount = this.score.staves[0].measures.length;
    let endSelection = SmoSelection.measureSelection(this.score,
      startSelection.selector.staff, measureCount - 1);
    if (!scoreMode) {
      endSelection = this.tracker.getExtremeSelection(1);
    }
    if (endSelection !== null) {
      measureIndex = startSelection.selector.measure;
      while (measureIndex <= endSelection.selector.measure) {
        const mi = measureIndex;
        this.score.staves.forEach((staff) => {
          const msel = SmoSelection.measureSelection(this.score,
            staff.staffId, mi);
          if (msel) {
            SmoOperation.addTempo(this.score, msel, tempo);
          }
        });
        measureIndex++;
      }
      measureIndex = startSelection.selector.measure;
      while (measureIndex <= endSelection.selector.measure) {
        const mi = measureIndex;
        this.storeScore.staves.forEach((staff) => {
          const msel = SmoSelection.measureSelection(this.storeScore,
            staff.staffId, mi);
          if (msel !== null) {
            SmoOperation.addTempo(this.storeScore, msel, tempo);
          }
        });
        measureIndex++;
      }
    }
    this.renderer.setRefresh();
  }
  removeTempo(scoreMode: boolean) {
    this.actionBuffer.addAction('removeTempo', scoreMode);
    const startSelection = this.tracker.selections[0];
    if (startSelection.selector.measure > 0) {
      const measureIx = startSelection.selector.measure - 1;
      const target = startSelection.staff.measures[measureIx];
      const tempo = target.getTempo();
      const newTempo = new SmoTempoText(tempo);
      newTempo.display = false;
      this.updateTempoScore(newTempo, scoreMode);
    } else {
      this.updateTempoScore(new SmoTempoText(SmoTempoText.defaults), scoreMode);
    }
  }
  addGraceNote() {
    this.actionBuffer.addAction('addGraceNote');
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('add grace note');
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
  }

  removeGraceNote() {
    this.actionBuffer.addAction('removeGraceNote');
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('remove grace note');
    selections.forEach((selection) => {
      // TODO: get the correct offset
      SmoOperation.removeGraceNote(selection, 0);
      const altSel = (this._getEquivalentSelection(selection));
      SmoOperation.removeGraceNote(altSel!, 0);
    });
    this._renderChangedMeasures(measureSelections);
  }

  slashGraceNotes() {
    this.actionBuffer.addAction('slashGraceNotes');
    const grace = this.tracker.getSelectedGraceNotes();
    const measureSelections = this._undoTrackerMeasureSelections('slash grace note toggle');
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
  }

  // ### transposeSelections
  // tranpose whatever is selected in tracker the given offset.
  transposeSelections(offset: number) {
    this.actionBuffer.addAction('transposeSelections', offset);
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('transpose');
    const grace = this.tracker.getSelectedGraceNotes();
    if (grace.length) {
      grace.forEach((artifact) => {
        if (artifact.selection !== null) {
          const gn1 = artifact.modifier as SmoGraceNote;
          SmoOperation.transposeGraceNotes(artifact.selection, [gn1], offset);
          const altSelection = this._getEquivalentSelection(artifact.selection);
          const gn2 = this._getEquivalentGraceNote(altSelection!, gn1);
          SmoOperation.transposeGraceNotes(artifact.selection, [artifact.modifier as SmoGraceNote], offset);
          SmoOperation.transposeGraceNotes(altSelection!, [gn2], offset);
        }
      });

    } else {
      selections.forEach((selected) => {
        SmoOperation.transpose(selected, offset);
        const altSel = this._getEquivalentSelection(selected);
        SmoOperation.transpose(altSel!, offset);
      });
      if (selections.length === 1 && this.score.preferences.autoPlay) {
        SuiOscillator.playSelectionNow(selections[0], 1);
      }
    }
    this._renderChangedMeasures(measureSelections);
  }
  toggleEnharmonic() {
    this.actionBuffer.addAction('toggleEnharmonic');
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('toggle enharmonic');
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
  }

  toggleCourtesyAccidentals() {
    this.actionBuffer.addAction('toggleCourtesyAccidentals');
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('toggle courtesy accidental');
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
  }

  batchDurationOperation(operation: BatchSelectionOperation) {
    this.actionBuffer.addAction('batchDurationOperation', operation);
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('change duration');
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
  }
  toggleArticulation(modifier: string, ctor: string) {
    this.actionBuffer.addAction('toggleArticulation', modifier, ctor);
    const measureSelections = this._undoTrackerMeasureSelections('toggle articulation');
    this.tracker.selections.forEach((sel) => {
      if (ctor === 'SmoArticulation') {
        const aa = new SmoArticulation({ articulation: modifier });
        const altAa = new SmoArticulation({ articulation: modifier });
        altAa.attrs.id = aa.attrs.id;
        SmoOperation.toggleArticulation(sel, aa);
        const altSelection = this._getEquivalentSelection(sel);
        SmoOperation.toggleArticulation(altSelection!, altAa);
      } else {
        const aa = new SmoOrnament({ ornament: modifier });
        const altAa = new SmoOrnament({ ornament: modifier });
        altAa.attrs.id = aa.attrs.id;
        const altSelection = this._getEquivalentSelection(sel!);
        SmoOperation.toggleOrnament(sel, aa);
        SmoOperation.toggleOrnament(altSelection!, altAa);
      }
    });
    this._renderChangedMeasures(measureSelections);
  }

  makeTuplet(numNotes: number) {
    this.actionBuffer.addAction('makeTuplet', numNotes);
    const selection = this.tracker.selections[0];
    const measureSelections = this._undoTrackerMeasureSelections('make tuplet');
    SmoOperation.makeTuplet(selection, numNotes);
    const altSelection = this._getEquivalentSelection(selection!);
    SmoOperation.makeTuplet(altSelection!, numNotes);
    this._renderChangedMeasures(measureSelections);
  }
  unmakeTuplet() {
    this.actionBuffer.addAction('unmakeTuplet');
    const selection = this.tracker.selections[0];
    const measureSelections = this._undoTrackerMeasureSelections('unmake tuplet');
    SmoOperation.unmakeTuplet(selection);
    const altSelection = this._getEquivalentSelection(selection);
    SmoOperation.unmakeTuplet(altSelection!);
    this._renderChangedMeasures(measureSelections);
  }

  setInterval(interval: number) {
    this.actionBuffer.addAction('setInterval', interval);
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('set interval');
    selections.forEach((selected) => {
      SmoOperation.interval(selected, interval);
      const altSelection = this._getEquivalentSelection(selected);
      SmoOperation.interval(altSelection!, interval);
    });
    this._renderChangedMeasures(measureSelections);
  }

  collapseChord() {
    this.actionBuffer.addAction('collapseChord');
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('collapse chord');
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
  }
  toggleSlash() {
    this.actionBuffer.addAction('toggleSlash');
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('make slash');
    selections.forEach((selection) => {
      SmoOperation.toggleSlash(selection);
      const altSel = this._getEquivalentSelection(selection);
      SmoOperation.toggleSlash(altSel!);
    });
    this._renderChangedMeasures(measureSelections);
  }
  makeRest() {
    this.actionBuffer.addAction('makeRest');
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('make rest');
    selections.forEach((selection) => {
      SmoOperation.toggleRest(selection);
      const altSel = this._getEquivalentSelection(selection);
      SmoOperation.toggleRest(altSel!);
    });
    this._renderChangedMeasures(measureSelections);
  }
  toggleBeamGroup() {
    this.actionBuffer.addAction('toggleBeamGroup');
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('toggle beam group');
    selections.forEach((selection) => {
      SmoOperation.toggleBeamGroup(selection);
      const altSel = this._getEquivalentSelection(selection);
      SmoOperation.toggleBeamGroup(altSel!);
    });
    this._renderChangedMeasures(measureSelections);
  }
  toggleBeamDirection() {
    this.actionBuffer.addAction('toggleBeamDirection');
    const selections = this.tracker.selections;
    if (selections.length < 1) {
      return;
    }
    const measureSelections = this._undoTrackerMeasureSelections('toggle beam direction');
    SmoOperation.toggleBeamDirection(selections);
    SmoOperation.toggleBeamDirection(this._getEquivalentSelections(selections));
    this._renderChangedMeasures(measureSelections);
  }
  beamSelections() {
    this.actionBuffer.addAction('beamSelections');
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('beam selections');
    SmoOperation.beamSelections(this.score, selections);
    SmoOperation.beamSelections(this.storeScore, this._getEquivalentSelections(selections));
    this._renderChangedMeasures(measureSelections);
  }
  addKeySignature(keySignature: string) {
    this.actionBuffer.addAction('addKeySignature', keySignature);
    const measureSelections = this._undoTrackerMeasureSelections('set key signature ' + keySignature);
    measureSelections.forEach((sel) => {
      SmoOperation.addKeySignature(this.score, sel, keySignature);
      const altSel = this._getEquivalentSelection(sel);
      SmoOperation.addKeySignature(this.storeScore, altSel!, keySignature);
    });
    this._renderChangedMeasures(measureSelections);
  }
  /**
   * Sets a pitch from the piano widget.
   * @param pitch {Pitch}
   * @param chordPedal {boolean} - indicates we are adding to a chord
   */
  setPitchPiano(pitch: Pitch, chordPedal: boolean) {
    this.actionBuffer.addAction('setAbsolutePitch', pitch);
    const measureSelections = this._undoTrackerMeasureSelections(
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
  }
  showPiano(value: boolean) {
    this.score.preferences.showPiano = value;
    this.storeScore.preferences.showPiano = value;
    if (value) {
      SuiPiano.showPiano();
    } else {
      SuiPiano.hidePiano();
    }
  }
  /**
   * Add a pitch to the score at the cursor.  This tries to find the best pitch
   * to match the letter key (F vs F# for instance) based on key and surrounding notes
   * @param letter string
   */
  setPitch(letter: PitchLetter) {
    this.actionBuffer.addAction('setPitch', letter);
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('set pitch ' + letter);
    selections.forEach((selected) => {
      const selector = selected.selector;
      let hintSel = SmoSelection.lastNoteSelection(this.score,
        selector.staff, selector.measure, selector.voice, selector.tick);
      if (!hintSel) {
        hintSel = SmoSelection.nextNoteSelection(this.score,
          selector.staff, selector.measure, selector.voice, selector.tick);
      }
      // The selection no longer exists, possibly deleted
      if (hintSel === null || hintSel.note === null) {
        return;
      }
      const pitch = SmoMusic.getLetterNotePitch(hintSel.note.pitches[0],
        letter, hintSel.measure.keySignature);
      SmoOperation.setPitch(selected, [pitch]);
      const altSel = this._getEquivalentSelection(selected);
      SmoOperation.setPitch(altSel!, [pitch]);
      if (this.score.preferences.autoAdvance) {
        this.tracker.moveSelectionRight(null, true);
      }
    });
    if (selections.length === 1 && this.score.preferences.autoPlay) {
      SuiOscillator.playSelectionNow(selections[0], 1);
    }
    this._renderChangedMeasures(measureSelections);
  }
  copy() {
    this.actionBuffer.addAction('copy');
    this.pasteBuffer.setSelections(this.score, this.tracker.selections);
    const altAr: SmoSelection[] = [];
    this.tracker.selections.forEach((sel) => {
      const noteSelection = this._getEquivalentSelection(sel);
      if (noteSelection !== null) {
        altAr.push(noteSelection);
      }
    });
    this.storePaste.setSelections(this.storeScore, altAr);
  }
  paste() {
    // We undo the whole score on a paste, since we don't yet know the
    // extent of the overlap
    this.actionBuffer.addAction('paste');
    this._undoScore('paste');
    this.renderer.preserveScroll();
    const firstSelection = this.tracker.selections[0];
    const pasteTarget = firstSelection.selector;
    const altSelection = this._getEquivalentSelection(firstSelection);
    const altTarget = altSelection!.selector;
    this.pasteBuffer.pasteSelections(this.score, pasteTarget);
    this.storePaste.pasteSelections(this.storeScore, altTarget);
    this._renderChangedMeasures(this.pasteBuffer.replacementMeasures);
  }
  setNoteHead(head: string) {
    this.actionBuffer.addAction('setNoteHead', head);
    const selections = this.tracker.selections;
    const measureSelections = this._undoTrackerMeasureSelections('set note head');
    SmoOperation.setNoteHead(selections, head);
    SmoOperation.setNoteHead(this._getEquivalentSelections(selections), head);
    this._renderChangedMeasures(measureSelections);
  }

  addEnding() {
    // TODO: we should have undo for columns
    this._undoScore('Add Volta');
    this.actionBuffer.addAction('addEnding');
    const ft = this.tracker.getExtremeSelection(-1);
    const tt = this.tracker.getExtremeSelection(1);
    const params = SmoVolta.defaults;
    params.startBar = ft.selector.measure;
    params.endBar = tt.selector.measure;
    params.number = 1;
    const volta = new SmoVolta(params);
    const altVolta = new SmoVolta(params);
    SmoOperation.addEnding(this.storeScore, altVolta);
    SmoOperation.addEnding(this.score, volta);
    this.renderer.setRefresh();
  }
  updateEnding(ending: SmoVolta) {
    this.actionBuffer.addAction('updateEnding', ending);
    this._undoScore('Change Volta');
    $(this.renderer.context.svg).find('g.' + ending.attrs.id).remove();
    SmoOperation.removeEnding(this.storeScore, ending);
    SmoOperation.removeEnding(this.score, ending);
    const altVolta = new SmoVolta(ending);
    SmoOperation.addEnding(this.storeScore, altVolta);
    SmoOperation.addEnding(this.score, ending);
    this.renderer.setRefresh();
  }
  removeEnding(ending: SmoVolta) {
    this.actionBuffer.addAction('removeEnding', ending);
    this._undoScore('Remove Volta');
    $(this.renderer.context.svg).find('g.' + ending.attrs.id).remove();
    SmoOperation.removeEnding(this.storeScore, ending);
    SmoOperation.removeEnding(this.score, ending);
    this.renderer.setRefresh();
  }
  setBarline(position: number, barline: number) {
    this.actionBuffer.addAction('setBarline', position, barline);
    const obj = new SmoBarline({ position, barline });
    const altObj = new SmoBarline({ position, barline });
    const selection = this.tracker.selections[0];
    this._undoColumn('set barline', selection.selector.measure);
    SmoOperation.setMeasureBarline(this.score, selection, obj);
    const altSel = this._getEquivalentSelection(selection);
    SmoOperation.setMeasureBarline(this.storeScore, altSel!, altObj);
    this._renderChangedMeasures([selection]);
  }
  setRepeatSymbol(position: number, symbol: number) {
    this.actionBuffer.addAction('setRepeatSymbol', position, symbol);
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
  }
  toggleRehearsalMark() {
    this.actionBuffer.addAction('toggleRehearsalMark');
    const selection = this.tracker.getExtremeSelection(-1);
    const altSelection = this._getEquivalentSelection(selection);
    const cmd = selection.measure.getRehearsalMark() ? 'removeRehearsalMark' : 'addRehearsalMark';
    SmoOperation[cmd](this.score, selection, new SmoRehearsalMark(SmoRehearsalMark.defaults));
    SmoOperation[cmd](this.storeScore, altSelection!, new SmoRehearsalMark(SmoRehearsalMark.defaults));
    this._renderChangedMeasures([selection]);
  }
  _removeStaffModifier(modifier: StaffModifierBase) {
    this.score.staves[modifier.startSelector.staff].removeStaffModifier(modifier);
    const altModifier = StaffModifierBase.deserialize(modifier.serialize());
    altModifier.startSelector = this._getEquivalentSelector(altModifier.startSelector);
    altModifier.endSelector = this._getEquivalentSelector(altModifier.endSelector);
    this.storeScore.staves[altModifier.startSelector.staff].removeStaffModifier(altModifier);
  }
  removeStaffModifier(modifier: StaffModifierBase) {
    this.actionBuffer.addAction('removeStaffModifier', modifier);
    this._undoStaffModifier('Set measure proportion', modifier,
      UndoBuffer.bufferSubtypes.REMOVE);
    this._removeStaffModifier(modifier);
    this._removeStandardModifier(modifier);
    this._renderRectangle(modifier.startSelector, modifier.endSelector);
  }
  addOrUpdateStaffModifier(original: StaffModifierBase, modifier: StaffModifierBase) {
    if (!modifier) {
      if (original) {
        // Handle legacy API changed
        modifier = StaffModifierBase.deserialize(original);
      } else {
        console.warn('update modifier: bad modifier');
        return;
      }
    }
    this.actionBuffer.addAction('addOrUpdateStaffModifier', modifier);
    const existing = this.score.staves[modifier.startSelector.staff]
      .getModifier(modifier);
    const subtype = existing === null ? UndoBuffer.bufferSubtypes.ADD :
      UndoBuffer.bufferSubtypes.UPDATE;
    this._undoStaffModifier('Set measure proportion', original,
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
    }
    this._renderRectangle(modifier.startSelector, modifier.endSelector);
  }
  _lineOperation(op: string) {
    // if (this.tracker.selections.length < 2) {
    //   return;
    // }
    const measureSelections = this._undoTrackerMeasureSelections(op);
    const ft = this.tracker.getExtremeSelection(-1);
    const tt = this.tracker.getExtremeSelection(1);
    const ftAlt = this._getEquivalentSelection(ft);
    const ttAlt = this._getEquivalentSelection(tt);
    const modifier = (SmoOperation as any)[op](ft, tt);
    (SmoOperation as any)[op](ftAlt, ttAlt);
    this._undoStaffModifier('add ' + op, modifier, UndoBuffer.bufferSubtypes.ADD);
    this._renderChangedMeasures(measureSelections);
  }
  crescendo() {
    this.actionBuffer.addAction('crescendo');
    this._lineOperation('crescendo');
  }
  decrescendo() {
    this.actionBuffer.addAction('decrescendo');
    this._lineOperation('decrescendo');
  }
  slur() {
    this.actionBuffer.addAction('slur');
    this._lineOperation('slur');
  }
  tie() {
    this.actionBuffer.addAction('tie');
    this._lineOperation('tie');
  }
  setGlobalLayout(layout: SmoGlobalLayout) {
    this.actionBuffer.addAction('setGlobalLayout', layout);
    this._undoScore('Set Global Layout');
    const original = this.score.layoutManager!.getGlobalLayout().svgScale;
    this.score.layoutManager!.updateGlobalLayout(layout);
    this.score.scaleTextGroups(original / layout.svgScale);
    this.storeScore.layoutManager!.updateGlobalLayout(layout);
    this.renderer.rerenderAll();
  }
  setPageLayout(layout: SmoPageLayout, pageIndex: number) {
    this.actionBuffer.addAction('setPageLayout', layout);
    this._undoScore('Set Page Layout');
    this.actionBuffer.addAction('setScoreLayout', layout);
    this.score.layoutManager!.updatePage(layout, pageIndex);
    this.storeScore.layoutManager!.updatePage(layout, pageIndex);
    this.renderer.rerenderAll();
  }
  setEngravingFontFamily(family: string) {
    this.actionBuffer.addAction('setEngravingFontFamily', family);
    const engrave = this.score.fonts.find((fn) => fn.purpose === SmoScore.fontPurposes.ENGRAVING);
    const altEngrave = this.storeScore.fonts.find((fn) => fn.purpose === SmoScore.fontPurposes.ENGRAVING);
    if (engrave && altEngrave) {
      engrave.family = family;
      altEngrave.family = family;
      SuiRenderState.setFont(engrave.family);
    }
    this.renderer.setRefresh();
  }
  setChordFont(fontInfo: FontInfo) {
    this.actionBuffer.addAction('setChordFont', fontInfo);
    this._undoScore('Set Chord Font');
    this.score.setChordFont(fontInfo);
    this.storeScore.setChordFont(fontInfo);
    this.renderer.setRefresh();
  }
  setLyricFont(fontInfo: FontInfo) {
    this.actionBuffer.addAction('setLyricFont', fontInfo);
    this._undoScore('Set Lyric Font');
    this.score.setLyricFont(fontInfo);
    this.storeScore.setLyricFont(fontInfo);
    this.renderer.setRefresh();
  }
  setLyricAdjustWidth(value: boolean) {
    this.actionBuffer.addAction('setLyricAdjustWidth', value);
    this._undoScore('Set Lyric Adj Width');
    this.score.setLyricAdjustWidth(value);
    this.storeScore.setLyricAdjustWidth(value);
    this.renderer.setRefresh();
  }
  deleteMeasure() {
    this.actionBuffer.addAction('deleteMeasure');
    this._undoScore('Delete Measure');
    if (this.storeScore.staves[0].measures.length < 2) {
      return;
    }
    const selections = SmoSelection.getMeasureList(this.tracker.selections);
    // THe measures get renumbered, so keep the index at 0
    const index = selections[0].selector.measure;
    selections.forEach((selection) => {
      // Unrender the deleted measure
      this.score.staves.forEach((staff) => {
        this.renderer.unrenderMeasure(staff.measures[index]);
        this.renderer.unrenderMeasure(staff.measures[staff.measures.length - 1]);
        // A little hacky - delete the modifiers if they start or end on
        // the measure
        staff.modifiers.forEach((modifier) => {
          if (modifier.startSelector.measure === index || modifier.endSelector.measure === index) {
            $(this.renderer.context.svg).find('g.' + modifier.attrs.id).remove();
          }
        });
      });
      // Remove the SVG artifacts mapped to this measure.
      this.tracker.deleteMeasure(selection);
      this.score.deleteMeasure(index);
      this.storeScore.deleteMeasure(index);
    });
    this.tracker.loadScore();
    this.renderer.setRefresh();
  }
  addMeasures(append: boolean, numberToAdd: number) {
    let pos = 0;
    let ix = 0;
    this.actionBuffer.addAction('addMeasures', append, numberToAdd);
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
  }
  addMeasure(append: boolean) {
    this.actionBuffer.addAction('addMeasure', append);
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
  }
  removeStaff() {
    this.actionBuffer.addAction('removeStaff');
    this._undoScore('Remove Instrument');
    if (this.storeScore.staves.length < 2 || this.score.staves.length < 2) {
      return;
    }
    // if we are looking at a subset of the score,
    // revert to the full score view before removing the staff.
    const sel = this.tracker.selections[0];
    const scoreSel = this._getEquivalentSelection(sel);
    const staffIndex = scoreSel!.selector.staff;
    SmoOperation.removeStaff(this.storeScore, staffIndex);
    this.viewAll();
    this.renderer.setRefresh();
  }
  addStaff(instrument: SmoSystemStaffParams) {
    this.actionBuffer.addAction('addStaff', instrument);
    this._undoScore('Add Instrument');
    // if we are looking at a subset of the score, we won't see the new staff.  So
    // revert to the full view
    SmoOperation.addStaff(this.storeScore, instrument);
    this.viewAll();
  }
  /**
   * Update part info assumes that the part is currently exposed - that
   * staff 0 is the first staff in the part prior to editing.
   * @param info
   */
  updatePartInfo(info: SmoPartInfo) {
    let i: number = 0;
    this._undoScore('Update part info');
    const storeStaff = this.staffMap[0] - info.stavesBefore;
    const partLength = info.stavesBefore + info.stavesAfter + 1;
    const resetView = !SmoLayoutManager.areLayoutsEqual(info.layoutManager.getGlobalLayout(), this.score.layoutManager!.getGlobalLayout());
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
    if (resetView) {
      this.renderer.rerenderAll()
    }
  }
  addStaffSimple(params: any) {
    const instrumentParams = SmoInstrument.defaults;
    instrumentParams.startSelector.staff = instrumentParams.endSelector.staff = this.score.staves.length;
    instrumentParams.clef = params.clef;

    const staffParams = SmoSystemStaff.defaults;
    staffParams.measureInstrumentMap[0] = new SmoInstrument(instrumentParams);
    this.addStaff(staffParams);
  }
  saveScore(filename: string) {
    const json = this.storeScore.serialize();
    const jsonText = JSON.stringify(json);
    htmlHelpers.addFileLink(filename, jsonText, $('.saveLink'));
    $('.saveLink a')[0].click();
  }
  saveMidi(filename: string) {
    const bytes = SmoToMidi.convert(this.storeScore);
    htmlHelpers.addFileLink(filename, bytes, $('.saveLink'), 'audio/midi');
    $('.saveLink a')[0].click();
  }
  saveXml(filename: string) {
    const dom = SmoToXml.convert(this.storeScore);
    const ser = new XMLSerializer();
    const xmlText = ser.serializeToString(dom);
    htmlHelpers.addFileLink(filename, xmlText, $('.saveLink'));
    $('.saveLink a')[0].click();
  }
  saveActions(filename: string) {
    const jsonText = JSON.stringify(this.actionBuffer.actions);
    htmlHelpers.addFileLink(filename, jsonText, $('.saveLink'));
    $('.saveLink a')[0].click();
  }
  quickSave() {
    const scoreStr = JSON.stringify(this.storeScore.serialize());
    localStorage.setItem(smoSerialize.localScore, scoreStr);
  }
  setMeasureFormat(format: SmoMeasureFormat) {
    const label = 'set measure format';
    this.actionBuffer.addAction(label, format);
    const fromSelector = this.tracker.getExtremeSelection(-1).selector;
    const toSelector = this.tracker.getExtremeSelection(1).selector;
    const measureSelections = this.tracker.getSelectedMeasures();
    // If the formatting is on a part, preserve it in the part's info
    const isPart = this.isPartExposed(measureSelections[0].staff);
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
  }

  playFromSelection() {
    var mm = this.tracker.getExtremeSelection(-1);
    if (SuiAudioPlayer.playingInstance && SuiAudioPlayer.playingInstance.paused) {
      SuiAudioPlayer.playingInstance.play();
      return;
    }
    new SuiAudioPlayer({ score: this.score, startIndex: mm.selector.measure, tracker: this.tracker }).play();
  }
  stopPlayer() {
    SuiAudioPlayer.stopPlayer();
  }
  pausePlayer() {
    SuiAudioPlayer.pausePlayer();
  }
  replayActions() {
    if (!this.actionBuffer.endCondition) {
      return;
    }
    const prefs = JSON.parse(JSON.stringify(this.score.preferences));
    this.storeScore.preferences.autoPlay = false;
    this.storeScore.preferences.autoAdvance = false;
    this.score.preferences = JSON.parse(JSON.stringify(this.storeScore.preferences));
    const oldPollTime = SmoConfig.demonPollTime;
    const oldRedrawTime = SmoConfig.idleRedrawTime;
    const recover = () => {
      this.score.preferences = prefs;
      this.storeScore.preferences = JSON.parse(JSON.stringify(prefs));
      SmoConfig.demonPollTime = oldPollTime;
      SmoConfig.idleRedrawTime = oldRedrawTime;
    };
    SmoConfig.demonPollTime = 50;
    SmoConfig.idleRedrawTime = 3000;
    const playback = new SuiActionPlayback(this.actionBuffer, this);
    playback.start().then(recover);
  }

  // Tracker operations, used for macro replay
  moveHome(ev: KeyEvent) {
    this.tracker.moveHome(ev);
  }
  moveEnd(ev: KeyEvent) {
    this.tracker.moveEnd(ev);
  }
  growSelectionLeft() {
    this.tracker.growSelectionLeft();
  }
  growSelectionRight() {
    this.tracker.growSelectionRight();
  }
  advanceModifierSelection(keyEv: KeyEvent) {
    this.tracker.advanceModifierSelection(keyEv);
  }
  growSelectionRightMeasure() {
    this.tracker.growSelectionRightMeasure();
  }
  moveSelectionRight(ev: KeyEvent) {
    this.tracker.moveSelectionRight(ev, true);
  }
  moveSelectionLeft() {
    this.tracker.moveSelectionLeft();
  }
  moveSelectionLeftMeasure() {
    this.tracker.moveSelectionLeftMeasure();
  }
  moveSelectionRightMeasure() {
    this.tracker.moveSelectionRightMeasure();
  }
  moveSelectionPitchUp() {
    this.tracker.moveSelectionPitchUp();
  }
  moveSelectionPitchDown() {
    this.tracker.moveSelectionPitchDown();
  }
  moveSelectionUp() {
    this.tracker.moveSelectionUp();
  }
  moveSelectionDown() {
    this.tracker.moveSelectionDown();
  }
  selectSuggestion(evData: KeyEvent) {
    this.tracker.selectSuggestion(evData);
  }
  intersectingArtifact(evData: SvgBox) {
    this.tracker.intersectingArtifact(evData);
  }
  setSelection(selector: SmoSelector) {
    const selection = SmoSelection.selectionFromSelector(this.score, selector);
    if (selection) {
      this.tracker.selections = [selection];
    }
  }
  selectSuggestionNote(selector: SmoSelector, evData: KeyEvent) {
    const key = SmoSelector.getNoteKey(selector);
    if (typeof (this.tracker.measureNoteMap[key]) !== 'undefined') {
      this.tracker.suggestion = this.tracker.measureNoteMap[SmoSelector.getNoteKey(selector)];
      this.tracker.selectSuggestion(evData);
    }
  }
  selectSuggestionModifier(selector: SmoSelector, evData: KeyEvent, modifierObj: any) {
    let modIndex = -1;
    // TODO: this looks fishy...
    if (typeof (modifierObj.startSelector) !== 'undefined' && typeof (modifierObj.endSelector) !== 'undefined') {
      modIndex = this.tracker.modifierTabs.findIndex((tb) =>
        modifierObj.ctor === tb.modifier.ctor &&
        SmoSelector.eq(tb.selection!.selector, selector) && SmoSelector.eq((tb.modifier as any).startSelector, modifierObj.startSelector) &&
        SmoSelector.eq((tb.modifier as any).endSelector, modifierObj.endSelector));
    } else {
      // TODO: grace notes have multiple per note and no selector
      modIndex = this.tracker.modifierTabs.findIndex((tb) =>
        modifierObj.ctor === tb.modifier.ctor &&
        SmoSelector.eq(tb.selection!.selector, selector));
    }
    if (modIndex >= 0) {
      this.tracker.modifierSuggestion = modIndex;
      this.tracker.selectSuggestion(evData);
    }
  }
  refreshViewport() {
    this.renderer.preserveScroll();
    this.renderer.setViewport(true);
    this.renderer.setRefresh();
  }
}
