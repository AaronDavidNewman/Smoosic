// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { Pitch, PitchLetter, Clef } from '../data/common';
import { SmoMusic } from '../data/music';
import { SmoNote } from '../data/note';
import { SmoScore } from '../data/score';
import { SmoMeasureParams, SmoMeasure, SmoVoice } from '../data/measure';
import { SmoSystemStaff, SmoSystemStaffParams } from '../data/systemStaff';
import { SmoArticulation, SmoGraceNote, SmoLyric, SmoMicrotone, SmoNoteModifierBase, SmoOrnament,
  SmoDynamicText } from '../data/noteModifiers';
import {
  SmoRehearsalMark, SmoMeasureText, SmoVolta, SmoMeasureFormat, SmoTempoText, SmoBarline,
  TimeSignature, SmoRepeatSymbol
} from '../data/measureModifiers';
import { SmoStaffHairpin, SmoSlur, SmoTie, StaffModifierBase, SmoTieParams, SmoInstrument, SmoStaffHairpinParams,
  SmoSlurParams, SmoInstrumentMeasure } from '../data/staffModifiers';
import { SmoSystemGroup, SmoTextGroup } from '../data/scoreModifiers';

import { SmoSelection, SmoSelector, ModifierTab } from './selections';
import {
  SmoDuration, SmoContractNoteActor, SmoStretchNoteActor, SmoMakeTupletActor,
  SmoUnmakeTupletActor, SmoContractTupletActor
} from './tickDuration';
import { SmoBeamer } from './beamers';
import { smoSerialize } from '../../common/serializationHelpers';
const VF = eval('Vex.Flow');

/**
 * supported operations for  {@link SmoOperation.batchSelectionOperation} to change a note's duration
 */
export type BatchSelectionOperation = 'dotDuration' | 'undotDuration' | 'doubleDuration' | 'halveDuration' |
  'doubleGraceNoteDuration' | 'halveGraceNoteDuration';

/**
 * SmoOperation is a collection of static methods that operate on/change/transform the music.  Most methods
 * take the score, a selection or selection array, and the parameters of the operation.
 * @category SmoUtilities
 */
export class SmoOperation {
  static setMeasureFormat(score: SmoScore, selection: SmoSelection, value: SmoMeasureFormat) {
    if (!score.formattingManager) {
      return;
    }
    score.staves.forEach((staff: SmoSystemStaff) => {
      value.formatMeasure(staff.measures[selection.selector.measure]);
    });
    score.formattingManager.updateMeasureFormat(value);
  }

  static addKeySignature(score: SmoScore, selection: SmoSelection, keySignature: string) {
    score.addKeySignature(selection.selector.measure, keySignature);
  }
  static addConnectorDown(score: SmoScore, selections: SmoSelection[], parameters: SmoSystemGroup) {
    const msel = SmoSelection.getMeasureList(selections);
    const len = msel.length - 1;
    if (score.staves.length <= msel[len].selector.staff) {
      return;
    }
    const existing = score.getSystemGroupForStaff(msel[0]);
    if (existing && existing.endSelector.staff < selections[len].selector.staff) {
      existing.endSelector.staff = msel[len].selector.staff + 1;
    } else {
      parameters.startSelector = SmoSelector.default;
      parameters.startSelector.staff = msel[0].selector.staff;
      parameters.startSelector.measure = msel[0].selector.measure;
      parameters.endSelector = SmoSelector.default;
      parameters.endSelector.staff = msel[len].selector.staff + 1;
      parameters.endSelector.measure = msel[len].selector.measure;
      score.addOrReplaceSystemGroup(new SmoSystemGroup(parameters));
    }
  }
  static toggleBeamGroup(noteSelection: SmoSelection) {
    if (!noteSelection.note) {
      return;
    }
    noteSelection.note.endBeam = !(noteSelection.note.endBeam);
  }
  static setActiveVoice(score: SmoScore, voiceIx: number) {
    score.staves.forEach((staff) => {
      staff.measures.forEach((measure) => {
        measure.setActiveVoice(voiceIx);
      });
    });
  }

  static addRemoveMicrotone(ignore: any, selections: SmoSelection[], tone: SmoMicrotone) {
    selections.forEach((sel) => {
      const note = sel.note;
      if (note) {
        const oldTone = note.getMicrotone(tone.pitchIndex);
        if (oldTone) {
          note.removeMicrotone(oldTone);
        } else {
          note.addMicrotone(tone);
        }
      }
    });
  }

  static moveStaffUpDown(score: SmoScore, selection: SmoSelection, index: number) {
    const index1 = selection.selector.staff;
    const index2 = selection.selector.staff + index;
    if (index2 < score.staves.length && index2 >= 0) {
      score.swapStaves(index1, index2);
    }
  }

  static depopulateVoice(selection: SmoSelection, voiceIx: number) {
    let ix = 0;
    const voices: SmoVoice[] = [];
    const measure = selection.measure;
    measure.voices.forEach((voice) => {
      if (measure.voices.length < 2 || ix !== voiceIx) {
        voices.push(voice);
      }
      ix += 1;
    });
    measure.voices = voices;

    if (measure.getActiveVoice() >= measure.voices.length) {
      measure.setActiveVoice(0);
    }
  }

  static populateVoice(selection: SmoSelection, voiceIx: number) {
    selection.measure.populateVoice(voiceIx);
  }
  static setTimeSignature(score: SmoScore, selections: SmoSelection[], timeSignature: TimeSignature, timeSignatureString: string) {
    const selectors: SmoSelector[] = [];
    let i = 0;
    let ticks = 0;
    selections.forEach((selection) => {
      for (i = 0; i < score.staves.length; ++i) {
        const measureSel: SmoSelector = SmoSelector.measureSelector(i, selection.selector.measure);
        selectors.push(measureSel);
      }
    });
    const tsTicks = SmoMusic.timeSignatureToTicks(timeSignature.timeSignature);
    selectors.forEach((selector: SmoSelector) => {
      const params: SmoMeasureParams = {} as SmoMeasureParams;
      const voices: SmoVoice[] = [];
      const rowSelection: SmoSelection = (SmoSelection.measureSelection(score, selector.staff, selector.measure) as SmoSelection);
      let nm: SmoMeasure = {} as SmoMeasure;
      const attrs: string[] = SmoMeasure.defaultAttributes.filter((aa) => aa !== 'timeSignature');
      const psel: SmoSelection | null = SmoSelection.measureSelection(score, selector.staff, selector.measure);
      if (!psel?.measure) {
        console.log('Error: score has changed in time signature change');
      } else {
        const proto: SmoMeasure = SmoSelection.measureSelection(score, selector.staff, selector.measure)?.measure as SmoMeasure;
        smoSerialize.serializedMerge(attrs, proto, params);
        params.timeSignature = timeSignature;
        nm = SmoMeasure.getDefaultMeasure(params);
        nm.timeSignatureString = timeSignatureString;
        nm.setX(rowSelection.measure.staffX, 'op:setTimeSignature');
        nm.setY(rowSelection.measure.staffY, 'op:setTimeSignature');
        nm.setWidth(rowSelection.measure.staffWidth, 'op:setTimeSignature');
        ['forceKeySignature', 'forceTimeSignature', 'forceTempo', 'forceClef'].forEach((attr) => {
          (nm as any)[attr] = (rowSelection.measure.svg as any)[attr];
        });
        ticks = 0;
        proto.voices.forEach((voice) => {
          const nvoice = [];
          for (i = 0; i < voice.notes.length; ++i) {
            const pnote = voice.notes[i];
            const nnote = SmoNote.deserialize(pnote.serialize());
            if (ticks + pnote.tickCount <= tsTicks) {
              nnote.ticks = JSON.parse(JSON.stringify(pnote.ticks));
              nvoice.push(nnote);
              ticks += nnote.tickCount;
            } else {
              const remain = tsTicks - ticks;
              nnote.ticks = { numerator: remain, denominator: 1, remainder: 0 };
              nvoice.push(nnote);
              ticks += nnote.tickCount;
            }
            if (ticks >= tsTicks) {
              break;
            }
          }
          if (ticks < tsTicks) {
            const adjNote = SmoNote.cloneWithDuration(nvoice[nvoice.length - 1], { numerator: tsTicks - ticks, denominator: 1, remainder: 0 });
            nvoice.push(adjNote);
          }
          voices.push({ notes: nvoice });
        });
      }
      nm.voices = voices;
      score.replaceMeasure(selector, nm);
    });
  }

  static batchSelectionOperation(score: SmoScore, selections: SmoSelection[], operation: BatchSelectionOperation) {
    var measureTicks: { selector: SmoSelector, tickOffset: number }[] = [];
    selections.forEach((selection) => {
      const tm = selection.measure.tickmapForVoice(selection.selector.voice);
      const tickOffset = tm.durationMap[selection.selector.tick];
      const selector = JSON.parse(JSON.stringify(selection.selector));
      measureTicks.push({
        selector,
        tickOffset
      });
    });
    measureTicks.forEach((measureTick) => {
      const selection = SmoSelection.measureSelection(score, measureTick.selector.staff, measureTick.selector.measure) as SmoSelection;
      const tickmap = selection.measure.tickmapForVoice(measureTick.selector.voice);
      const ix = tickmap.durationMap.indexOf(measureTick.tickOffset);
      if (ix >= 0) {
        const nsel = SmoSelection.noteSelection(score, measureTick.selector.staff, measureTick.selector.measure,
          measureTick.selector.voice, ix);
        (SmoOperation as any)[operation](nsel);
      }
    });
  }
  // ## doubleDuration
  // ## Description
  // double the duration of a note in a measure, at the expense of the following
  // note, if possible.  Works on tuplets also.
  static doubleDuration(selection: SmoSelection) {
    const note = selection.note;
    const measure = selection.measure;
    const tuplet = measure.getTupletForNote(note);
    if (!tuplet) {
      SmoDuration.doubleDurationNonTuplet(selection);
    } else {
      SmoDuration.doubleDurationTuplet(selection);
    }
    return true;
  }

  // ## halveDuration
  // ## Description
  // Replace the note with 2 notes of 1/2 duration, if possible
  // Works on tuplets also.
  static halveDuration(selection: SmoSelection) {
    const note = selection.note as SmoNote;
    let divisor = 2;
    const measure = selection.measure;
    const tuplet = measure.getTupletForNote(note);
    if (measure.timeSignature.actualBeats % 3 === 0 && note.tickCount === 6144) {
      // special behavior, if this is dotted 1/4 in 6/8, split to 3
      divisor = 3;
    }
    if (!tuplet) {
      const nticks = note.tickCount / divisor;
      if (!SmoMusic.ticksToDuration[nticks]) {
        return;
      }
      SmoContractNoteActor.apply({
        startIndex: selection.selector.tick,
        measure: selection.measure,
        voice: selection.selector.voice,
        newTicks: nticks
      });
      SmoBeamer.applyBeams(measure);
    } else {
      const startIndex = measure.tupletIndex(tuplet) + tuplet.getIndexOfNote(note);
      SmoContractTupletActor.apply({
        changeIndex: startIndex,
        measure,
        voice: selection.selector.voice
      });
    }
  }

  // ## makeTuplet
  // ## Description
  // Makes a non-tuplet into a tuplet of equal value.
  static makeTuplet(selection: SmoSelection, numNotes: number) {
    const note = selection.note as SmoNote;
    const measure = selection.measure;
    if (measure.getTupletForNote(note)) {
      return;
    }
    const nticks = note.tickCount;
    SmoMakeTupletActor.apply({
      index: selection.selector.tick,
      totalTicks: nticks,
      numNotes,
      measure: selection.measure,
      voice: selection.selector.voice
    });
  }
  static addStaffModifier(selection: SmoSelection, modifier: StaffModifierBase) {
    selection.staff.addStaffModifier(modifier);
  }
  static toggleRest(selection: SmoSelection) {
    selection.note?.toggleRest();
  }
  static toggleSlash(selection: SmoSelection) {
    selection.note?.toggleSlash();
  }

  static makeRest(selection: SmoSelection) {
    selection.note?.makeRest();
  }
  static makeNote(selection: SmoSelection) {
    selection.note?.makeNote();
  }
  static setNoteHead(selections: SmoSelection[], noteHead: string) {
    selections.forEach((selection: SmoSelection) => {
      selection.note?.setNoteHead(noteHead);
    });
  }

  static addGraceNote(selection: SmoSelection, g: SmoGraceNote, offset: number) {
    selection.note?.addGraceNote(g, offset);
  }

  static removeGraceNote(selection: SmoSelection, offset: number) {
    selection.note?.removeGraceNote(offset);
  }

  static doubleGraceNoteDuration(selection: SmoSelection, modifiers: SmoGraceNote[]) {
    if (!Array.isArray(modifiers)) {
      modifiers = [modifiers];
    }
    modifiers.forEach((mm) => {
      mm.ticks.numerator = mm.ticks.numerator * 2;
    });
  }
  static halveGraceNoteDuration(selection: SmoSelection, modifiers: SmoGraceNote[]) {
    if (!Array.isArray(modifiers)) {
      modifiers = [modifiers];
    }
    modifiers.forEach((mm) => {
      mm.ticks.numerator = mm.ticks.numerator / 2;
    });
  }

  static toggleGraceNoteCourtesy(selection: any, modifiers: SmoGraceNote[]) {
    if (!Array.isArray(modifiers)) {
      modifiers = [modifiers];
    }
    modifiers.forEach((mm: SmoGraceNote) => {
      mm.pitches.forEach((pitch: Pitch) => {
        // eslint-disable-next-line
        pitch.cautionary = pitch.cautionary ? false : true;
      });
    });
  }
  static toggleGraceNoteEnharmonic(selection: SmoSelection, modifiers: SmoGraceNote[]) {
    if (!Array.isArray(modifiers)) {
      modifiers = [modifiers];
    }
    modifiers.forEach((mm) => {
      mm.pitches.forEach((pitch) => {
        SmoNote.toggleEnharmonic(pitch);
      });
    });
  }

  static transposeGraceNotes(selection: SmoSelection, modifiers: SmoGraceNote[], offset: number) {
    if (!Array.isArray(modifiers)) {
      modifiers = [modifiers];
    }
    modifiers.forEach((mm: SmoGraceNote) => {
      const par: number[] = [];
      if (!mm) {
        console.warn('bad modifier grace note');
        return;
      }
      mm.pitches.forEach(() => {
        par.push(par.length);
      });
      SmoNote.transpose(mm, par, offset, selection.measure.keySignature);
    });
  }

  static slashGraceNotes(selections: ModifierTab[] | ModifierTab) {
    if (!Array.isArray(selections)) {
      selections = [selections];
    }
    // TODO: modifiers on artifacts should be typed
    selections.forEach((mm: any) => {
      if (mm.modifier && mm.modifier.ctor === 'SmoGraceNote') {
        mm.modifier.slash = !mm.modifier.slash;
      }
    });
  }

  // ## unmakeTuplet
  // ## Description
  // Makes a tuplet into a single with the duration of the whole tuplet
  static unmakeTuplet(selection: SmoSelection) {
    const note = selection.note;
    const measure = selection.measure;
    if (!measure.getTupletForNote(note)) {
      return;
    }
    const tuplet = measure.getTupletForNote(note);
    if (tuplet === null) {
      return;
    }
    const startIndex = measure.tupletIndex(tuplet);
    const endIndex = tuplet.notes.length + startIndex - 1;

    SmoUnmakeTupletActor.apply({
      startIndex,
      endIndex,
      measure,
      voice: selection.selector.voice
    });
  }

  // ## dotDuration
  // ## Description
  // Add a dot to a note, if possible, and make the note ahead of it shorter
  // to compensate.
  static dotDuration(selection: SmoSelection) {
    const note = selection.note as SmoNote;
    const measure = selection.measure;
    const nticks = SmoMusic.getNextDottedLevel(note.tickCount);
    if (nticks === note.tickCount) {
      return;
    }
    // Don't dot if the thing on the right of the . is too small
    const dotCount = SmoMusic.smoTicksToVexDots(nticks);
    const multiplier = Math.pow(2, dotCount);
    const baseDot = VF.durationToTicks(SmoMusic.closestVexDuration(nticks)) / (multiplier * 2);
    if (baseDot <= 128) {
      return;
    }
    // If this is the ultimate note in the measure, we can't increase the length
    if (selection.selector.tick + 1 === selection.measure.voices[selection.selector.voice].notes.length) {
      return;
    }
    if (selection.measure.voices[selection.selector.voice].notes[selection.selector.tick + 1].tickCount > note.tickCount) {
      console.log('too long');
      return;
    }
    // is dot too short?
    if (!SmoMusic.ticksToDuration[selection.measure.voices[selection.selector.voice].notes[selection.selector.tick + 1].tickCount / 2]) {
      return;
    }
    SmoStretchNoteActor.apply({
      startIndex: selection.selector.tick,
      measure,
      voice: selection.selector.voice,
      newTicks: nticks
    });
  }

  // ## undotDuration
  // ## Description
  // Add the value of the last dot to the note, increasing length and
  // reducing the number of dots.
  static undotDuration(selection: SmoSelection) {
    const note = selection.note as SmoNote;
    const measure = selection.measure;
    const nticks = SmoMusic.getPreviousDottedLevel(note.tickCount);
    if (nticks === note.tickCount) {
      return;
    }
    SmoContractNoteActor.apply({
      startIndex: selection.selector.tick,
      measure,
      voice: selection.selector.voice,
      newTicks: nticks
    });
  }

  // ## transpose
  // ## Description
  // Transpose the selected note, trying to find a key-signature friendly value
  static transpose(selection: SmoSelection, offset: number) {
    let pitchIx: number = 0;
    let trans: Pitch;
    let transInt: number = 0;
    let i: number = 0;
    if (typeof (selection.selector.pitches) === 'undefined') {
      selection.selector.pitches = [];
    }
    const measure = selection.measure;
    const note = selection.note;
    if (measure && note) {
      const pitchar: Pitch[] = [];
      pitchIx = 0;
      note.pitches.forEach((opitch) => {
        // Only translate selected pitches
        const shouldXpose = selection.selector.pitches.length === 0 ||
          selection.selector.pitches.indexOf(pitchIx) >= 0;

        // Translate the pitch, ignoring enharmonic
        trans = shouldXpose ? SmoMusic.getKeyOffset(opitch, offset)
          : JSON.parse(JSON.stringify(opitch));
        trans = SmoMusic.getEnharmonicInKey(trans, measure.keySignature);
        if (!trans.accidental) {
          trans.accidental = 'n';
        }
        transInt = SmoMusic.smoPitchToInt(trans);

        // Look through the earlier notes in the measure and try
        // to find an equivalent note, and convert it if it exists.
        measure.voices.forEach((voice) => {
          for (i = 0; i < selection.selector.tick
            && i < voice.notes.length; ++i) {
            const prevNote = voice.notes[i];
            // eslint-disable-next-line
            prevNote.pitches.forEach((prevPitch: Pitch) => {
              const prevInt = SmoMusic.smoPitchToInt(prevPitch);
              if (prevInt === transInt) {
                trans = JSON.parse(JSON.stringify(prevPitch));
              }
            });
          }
        });
        pitchar.push(trans as Pitch);
        pitchIx += 1;
      });
      note.pitches = pitchar;
      return true;
    }
    return false;
  }

  // ## setPitch
  // ## Description:
  // pitches can be either an array, a single pitch, or a letter.  In the latter case,
  // the letter value appropriate for the key signature is used, e.g. c in A major becomes
  // c#
  static setPitch(selection: SmoSelection, pitches: Pitch[]) {
    let i = 0;
    const measure = selection.measure;
    const note = selection.note as SmoNote;
    if (typeof (note) === 'undefined') {
      console.warn('set Pitch on invalid note');
      return;
    }
    note.makeNote();
    // TODO allow hint for octave
    const octave = note.pitches[0].octave;
    note.pitches = [];
    if (!Array.isArray(pitches)) {
      pitches = [pitches];
    }
    const earlierAccidental = (pitch: Pitch) => {
      selection.measure.voices.forEach((voice) => {
        for (i = 0; i < selection.selector.tick
          && i < voice.notes.length; ++i) {
          const prevNote = voice.notes[i];
          if (prevNote === null || prevNote.pitches === null) {
            console.log('this will die null');
          }
          prevNote.pitches.forEach((prevPitch: Pitch) => {
            if (prevNote.noteType === 'n' && prevPitch.letter === pitch.letter) {
              pitch.accidental = prevPitch.accidental;
            }
          });
        }
      });
    };
    pitches.forEach((pitch) => {
      if (typeof (pitch) === 'string') {
        const letter = SmoMusic.getKeySignatureKey(pitch[0], measure.keySignature);
        pitch = {
          letter: letter[0] as PitchLetter,
          accidental: letter.length > 1 ? letter.substring(1) : '',
          octave
        };
      }
      earlierAccidental(pitch);
      note.pitches.push(pitch);
    });
  }

  static toggleCourtesyAccidental(selection: SmoSelection) {
    let toBe: boolean = false;
    const note = selection.note as SmoNote;
    if (!selection.selector.pitches || selection.selector.pitches.length === 0) {
      const ps: Pitch[] = [];
      note.pitches.forEach((pitch) => {
        const p = JSON.parse(JSON.stringify(pitch));
        ps.push(p);
        p.cautionary = !(pitch.cautionary);
      });
      note.pitches = ps;
    } else {
      toBe = !(note.pitches[selection.selector.pitches[0]].cautionary);
    }
    SmoOperation.courtesyAccidental(selection, toBe);
  }

  static courtesyAccidental(pitchSelection: SmoSelection, toBe: boolean) {
    pitchSelection.selector.pitches.forEach((pitchIx) => {
      (pitchSelection.note as SmoNote).pitches[pitchIx].cautionary = toBe;
    });
  }

  static toggleEnharmonic(pitchSelection: SmoSelection) {
    if (pitchSelection.selector.pitches.length === 0) {
      pitchSelection.selector.pitches.push(0);
    }
    const pitch = (pitchSelection.note as SmoNote).pitches[pitchSelection.selector.pitches[0]];
    SmoNote.toggleEnharmonic(pitch);
  }

  static addDynamic(selection: SmoSelection, dynamic: SmoDynamicText) {
    (selection.note as SmoNote).addDynamic(dynamic);
  }

  static removeDynamic(selection: SmoSelection, dynamic: SmoDynamicText) {
    (selection.note as SmoNote).removeDynamic(dynamic);
  }

  static beamSelections(score: SmoScore, selections: SmoSelection[]) {
    const start = selections[0].selector;
    let cur = selections[0].selector;
    const beamGroup: SmoNote[] = [];
    let ticks = 0;
    selections.forEach((selection) => {
      const note = selection.note as SmoNote;
      if (SmoSelector.sameNote(start, selection.selector) ||
        (SmoSelector.sameMeasure(selection.selector, cur) &&
          cur.tick === selection.selector.tick - 1)) {
        ticks += note.tickCount;
        cur = selection.selector;
        beamGroup.push(note);
      }
    });
    if (beamGroup.length) {
      beamGroup.forEach((note) => {
        note.beamBeats = ticks;
        note.endBeam = false;
      });
      beamGroup[beamGroup.length - 1].endBeam = true;
      // Make sure the last note of the previous beam is the end of this beam group.
      if (selections[0].selector.tick > 0) {
        const ps = JSON.parse(JSON.stringify(selections[0].selector));
        ps.tick -= 1;
        const previous: SmoSelection | null = SmoSelection.noteFromSelector(score, ps);
        if (previous?.note && previous.note.tickCount < 4096) {
          previous.note.endBeam = true;
        }
      }
    }
  }

  static toggleBeamDirection(selections: SmoSelection[]) {
    const note0 = selections[0].note as SmoNote;
    note0.toggleFlagState();
    selections.forEach((selection) => {
      const note = selection.note as SmoNote;
      note.flagState = note0.flagState;
    });
  }

  static toggleOrnament(selection: SmoSelection, ornament: SmoOrnament) {
    (selection.note as SmoNote).toggleOrnament(ornament);
  }

  static toggleArticulation(selection: SmoSelection, articulation: SmoArticulation) {
    (selection.note as SmoNote).toggleArticulation(articulation);
  }

  static addEnding(score: SmoScore, parameters: SmoVolta) {
    let m = 0;
    let s = 0;
    const startMeasure = parameters.startBar;
    const endMeasure = parameters.endBar;

    // Ending ID ties all the instances of an ending across staves
    parameters.endingId = VF.Element.newID();
    score.staves.forEach((staff) => {
      m = 0;
      staff.measures.forEach((measure) => {
        if (m === startMeasure) {
          const pp = JSON.parse(JSON.stringify(parameters));
          pp.startSelector = {
            staff: s,
            measure: startMeasure
          };
          pp.endSelector = {
            staff: s,
            measure: endMeasure
          };
          const ending = new SmoVolta(pp);
          measure.addNthEnding(ending);
        }
        m += 1;
      });
      s += 1;
    });
  }

  static removeEnding(score: SmoScore, ending: SmoVolta) {
    let i = 0;
    score.staves.forEach((staff) => {
      for (i = (ending.startSelector as SmoSelector).measure; i <= (ending.endSelector as SmoSelector).measure; ++i) {
        staff.measures[i].removeNthEnding(ending.number);
      }
    });
  }

  static addTextGroup(score: SmoScore, textGroup: SmoTextGroup) {
    score.addTextGroup(textGroup);
  }

  static removeTextGroup(score: SmoScore, textGroup: SmoTextGroup) {
    score.removeTextGroup(textGroup);
  }

  static addMeasureText(score: SmoScore, selection: SmoSelection, measureText: SmoMeasureText) {
    const current = selection.measure.getMeasureText();
    // TODO: should we allow multiples per position
    current.forEach((mod) => {
      selection.measure.removeMeasureText(mod.attrs.id);
    });
    selection.measure.addMeasureText(measureText);
  }

  static removeMeasureText(score: SmoScore, selection: SmoSelection, mt: SmoMeasureText) {
    selection.measure.removeMeasureText(mt.attrs.id);
  }

  static removeRehearsalMark(score: SmoScore, selection: SmoSelection) {
    score.staves.forEach((staff) => {
      staff.removeRehearsalMark(selection.selector.measure);
    });
  }

  static addRehearsalMark(score: SmoScore, selection: SmoSelection, rehearsalMark: SmoRehearsalMark) {
    score.staves.forEach((staff) => {
      const mt = new SmoRehearsalMark(rehearsalMark.serialize());
      staff.addRehearsalMark(selection.selector.measure, mt);
    });
  }

  static addTempo(score: SmoScore, selection: SmoSelection, tempo: SmoTempoText) {
    score.staves.forEach((staff) => {
      staff.addTempo(tempo, selection.selector.measure);
    });
  }

  static setMeasureBarline(score: SmoScore, selection: SmoSelection, barline: SmoBarline) {
    const mm = selection.selector.measure;
    let ix = 0;
    score.staves.forEach(() => {
      const s2: SmoSelection | null = SmoSelection.measureSelection(score, ix, mm);
      s2?.measure.setBarline(barline);
      ix += 1;
    });
  }

  static setRepeatSymbol(score: SmoScore, selection: SmoSelection, sym: SmoRepeatSymbol) {
    let ix = 0;
    const mm = selection.selector.measure;
    score.staves.forEach(() => {
      const s2 = SmoSelection.measureSelection(score, ix, mm);
      s2?.measure.setRepeatSymbol(sym);
      ix += 1;
    });
  }

  // ## interval
  // Add a pitch at the specified interval to the chord in the selection.
  static interval(selection: SmoSelection, interval: number) {
    const measure = selection.measure;
    const note = selection.note as SmoNote;
    let pitch: Pitch = {} as Pitch;

    // TODO: figure out which pitch is selected
    pitch = note.pitches[0];
    if (interval > 0) {
      pitch = note.pitches[note.pitches.length - 1];
    }
    pitch = SmoMusic.getIntervalInKey(pitch, measure.keySignature, interval);
    if (pitch) {
      note.pitches.push(pitch);
      note.pitches.sort((x, y) =>
        SmoMusic.smoPitchToInt(x) - SmoMusic.smoPitchToInt(y)
      );
      return true;
    }
    return false;
  }

  static crescendo(fromSelection: SmoSelection, toSelection: SmoSelection) {
    const params: SmoStaffHairpinParams = SmoStaffHairpin.defaults;
    params.startSelector = JSON.parse(JSON.stringify(fromSelection.selector));
    params.endSelector = JSON.parse(JSON.stringify(toSelection.selector));
    params.hairpinType = SmoStaffHairpin.types.CRESCENDO;
    const modifier = new SmoStaffHairpin(params);
    fromSelection.staff.addStaffModifier(modifier);
    return modifier;
  }

  static decrescendo(fromSelection: SmoSelection, toSelection: SmoSelection) {
    const params: SmoStaffHairpinParams = SmoStaffHairpin.defaults;
    params.startSelector = JSON.parse(JSON.stringify(fromSelection.selector));
    params.endSelector = JSON.parse(JSON.stringify(toSelection.selector));
    params.hairpinType = SmoStaffHairpin.types.DECRESCENDO;
    const modifier = new SmoStaffHairpin(params);
    fromSelection.staff.addStaffModifier(modifier);
    return modifier;
  }
  static tie(fromSelection: SmoSelection, toSelection: SmoSelection) {
    // By default, just tie all the pitches to all the other pitches in order
    const lines = SmoTie.createLines(fromSelection.note as SmoNote, toSelection.note as SmoNote);
    const params: SmoTieParams = SmoTie.defaults;
    params.startSelector = fromSelection.selector;
    params.endSelector = toSelection.selector;
    params.lines = lines;
    const modifier = new SmoTie(params);
    fromSelection.staff.addStaffModifier(modifier);
    return modifier;
  }
  /**
   * Heuristically determine how a slur should be formatted based on the notes.  Determine control points,
   * offset, and alignment
   * 
   * ## Note: Vexflow slurs consider `top` to mean the furthest point from the note head, which could be the top
   * or the bottom of the note.  It also considers yoffset to be negative if inverted is set.  Head means close to the
   * note head.
   * @param score 
   * @param fromSelection 
   * @param toSelection 
   * @returns 
   */
  static getDefaultSlurDirection(score: SmoScore, fromSelection: SmoSelection, toSelection: SmoSelection):SmoSlurParams {
    const params: SmoSlurParams = SmoSlur.defaults;
    const sels = SmoSelector.order(fromSelection.selector, toSelection.selector);
    params.startSelector = JSON.parse(JSON.stringify(sels[0]));
    params.endSelector = JSON.parse(JSON.stringify(sels[1]));
    // Get all selections within the slur
    const selections = SmoSelection.innerSelections(score, sels[0], sels[1]).filter((ff) => ff.selector.voice === fromSelection.selector.voice);
    const dirs: Record<number, boolean> = {};
    const beamGroups: Record<string, boolean> = {};
    let startDir = SmoNote.flagStates.up;
    let mixed = false;
    let endDir = SmoNote.flagStates.up;
    let firstGap = 0;
    let lastGap = 0;
    if (selections.length < 1) {
      return new SmoSlur(params);
    }
    
    selections.forEach((selection, selectionIx) => {
      const note = selection.note!;
      if (note.beam_group) {
        beamGroups[note.beam_group.id] = true;
      } else {
        beamGroups[note.attrs.id] = true;
      }
      // Find the gap between the first and second note, and also between last 2.  If they are far apart,
      // increase the control points so the slurs don't run into the notes
      if (selectionIx === 1) {
        const lastNote = selections[0].note!;
        firstGap = Math.abs(SmoMusic.pitchToStaffLine(note.clef as Clef, note.pitches[0]) - 
          SmoMusic.pitchToStaffLine(lastNote.clef as Clef, lastNote.pitches[0]));
      }
      if (selectionIx === selections.length - 2 && selections.length > 2) {
        const nextNote = selections[selectionIx + 1].note!;
        lastGap = Math.abs(SmoMusic.pitchToStaffLine(note.clef as Clef, note.pitches[0]) - 
          SmoMusic.pitchToStaffLine(nextNote.clef as Clef, nextNote.pitches[0]));
      }
      const fstate = SmoMusic.flagStateFromNote(note.clef as Clef, selection.note!);
      // Keep track of the number of stem directions, so we can determine if the flags are mixed direction
      // the rules are a little different for mixed - we always try to put the slur on (the real) top of the staff.
      dirs[fstate] = true;
      if (selectionIx === 0) {
        startDir = fstate;
      }
      if (selectionIx === selections.length - 1) {
        endDir = fstate;
      }
    });
    params.invert = false;
    mixed = Object.keys(dirs).length > 1;
    // If the notes are beamed together, the beams must point in the same direction    
    if (Object.keys(beamGroups).length < 2) {
      mixed = false;
    }
    if (mixed) {
      // special case: slur 2 notes, note heads close, connect the note heads
      // to keep a flat arc
      if (selections.length === 2 && firstGap < 3) {
        params.position = SmoSlur.positions.HEAD;
        params.position_end = SmoSlur.positions.HEAD;
        params.xOffset = 5;
      } else {
        params.position = startDir === SmoNote.flagStates.up ? SmoSlur.positions.TOP : SmoSlur.positions.HEAD;
        params.position_end = endDir === SmoNote.flagStates.up ? SmoSlur.positions.TOP : SmoSlur.positions.HEAD;
        if (firstGap >= 3 || lastGap >= 3) {
          params.cp1y = 45;
          params.cp2y = 45;
        }
      }
      params.invert = endDir === SmoNote.flagStates.up;
    }
    if (!mixed) {
      params.position = SmoSlur.positions.HEAD;
      params.position_end = SmoSlur.positions.HEAD;
      if (firstGap >= 2 || lastGap >= 2) {
        params.cp1y = 45;
        params.cp2y = 45;
        params.yOffset += 10;
      } else {
        params.yOffset += 10;
      }
    }
    if (selections.length === 2) {
      params.xOffset = 0;
    }
    return params;
  }
  static slur(score: SmoScore, fromSelection: SmoSelection, toSelection: SmoSelection) {
    const params = SmoOperation.getDefaultSlurDirection(score, fromSelection, toSelection);
    const modifier: SmoSlur = new SmoSlur(params);
    fromSelection.staff.addStaffModifier(modifier);
    return modifier;
  }

  static addStaff(score: SmoScore, parameters: SmoSystemStaffParams) {
    score.addStaff(parameters);
  }
  static removeStaff(score: SmoScore, index: number) {
    score.removeStaff(index);
  }

  static transposeChords(smoNote: SmoNote, offset: number, key: string) {
    const chords = smoNote.getModifiers('SmoLyric');
    chords.forEach((ll) => {
      const lyric = ll as SmoLyric;
      if (lyric.parser === SmoLyric.parsers.chord) {
        const tx = lyric.getText();
        // Look for something that looks like a key name
        if (tx.length >= 1 && (tx[0].toUpperCase() >= 'A'
          && tx[0].toUpperCase() <= 'G')) {
          // toffset is 2 if the key has b or # in it
          let toffset = 1;
          let newText = tx[0];
          if (tx.length > 0 && tx[1] === 'b' || tx[1] === '#') {
            newText += tx[1];
            toffset = 2;
          }
          // Transpose the key, as if it were a key signature (octave has no meaning)
          let nkey = SmoMusic.smoIntToPitch(SmoMusic.smoPitchToInt(
            SmoMusic.pitchKeyToPitch(SmoMusic.vexToSmoKey(newText))) + offset);
          nkey = JSON.parse(JSON.stringify(SmoMusic.getEnharmonicInKey(nkey, key)));
          newText = nkey.letter.toUpperCase();

          // new key may have different length, e.g. Bb to B natural
          if (nkey.accidental !== 'n') {
            newText += nkey.accidental;
          }
          newText += tx.substr(toffset, tx.length - toffset);
          lyric.setText(newText);
        }
      }
    });
  }
  /**
   * Compute new map based on current instrument selections, adjusting existing instruments as required
   * @param instrument
   * @param selections
   */
  static changeInstrument(instrument: SmoInstrument, selections: SmoSelection[]) {
    const measureSel = SmoSelection.getMeasureList(selections);
    const measureIndex = measureSel[0].selector.measure;
    const measureEnd = measureIndex + (measureSel.length - 1);
    instrument.startSelector = JSON.parse(JSON.stringify(measureSel[0].selector));
    instrument.endSelector = JSON.parse(JSON.stringify(measureSel[measureSel.length - 1].selector));
    const instMap: Record<number, SmoInstrument> = {};
    const staffArray: SmoInstrumentMeasure[] = SmoSystemStaff.getStaffInstrumentArray(measureSel[0].staff.measureInstrumentMap);
    instMap[measureIndex] = instrument;
    staffArray.forEach((ar) => {
      if (ar.instrument.endSelector.measure < measureIndex || ar.instrument.startSelector.measure > measureEnd) {
        // No overlap, juse use the original instrument
        instMap[ar.instrument.startSelector.measure] = new SmoInstrument(ar.instrument);
      } else if (ar.instrument.startSelector.measure < measureIndex) {
        // overlap on left
        const split1 = new SmoInstrument(ar.instrument);
        split1.startSelector.measure = ar.instrument.startSelector.measure;
        instMap[split1.startSelector.measure] = split1;
        split1.endSelector.measure = measureIndex - 1;
        if (ar.instrument.endSelector.measure > measureEnd) {
          // overlap on left and right
          const split2 = new SmoInstrument(ar.instrument);
          split2.startSelector.measure = measureEnd + 1;
          split2.endSelector.measure = ar.instrument.endSelector.measure;
          instMap[split2.startSelector.measure] = split2;
        }
        instMap[ar.instrument.startSelector.measure] = new SmoInstrument(ar.instrument);
      } else if (ar.instrument.endSelector.measure > measureEnd) {
        // overlap on right only
        const split1 = new SmoInstrument(ar.instrument);
        split1.startSelector.measure = measureEnd + 1;
        instMap[split1.startSelector.measure] = split1;
      }
    });
    selections[0].staff.measureInstrumentMap = instMap;
    selections[0].staff.updateInstrumentOffsets();
  }
  static computeMultipartRest(score: SmoScore) {
    let i = 0;
    let j = 0;
    const measureRanges: Record<number, number> = {};
    const measureCount = score.staves[0].measures.length;
    while (i < measureCount) {
      if (score.isMultimeasureRest(i)) {
        for (j = i + 1; j < measureCount; ++j) {
          if (!score.isMultimeasureRest(j)) {          
            break;          
          }
        }
        if (j - i >= 2) {
          measureRanges[i] = j;
        }
        i = j + 1;
      } else {
        const startMeasure = i;
        score.staves.forEach((staff) => {
          staff.measures[startMeasure].svg.hideMultimeasure = false;
        });
        i += 1;
      }
    }
    const multiKeys = Object.keys(measureRanges).map((x) => parseInt(x, 10));
    multiKeys.forEach((key) => {
      const endMeasure = measureRanges[key];
      score.staves.forEach((staff) => {
        staff.measures[key].svg.multimeasureLength = endMeasure - key;
        staff.measures[key].svg.hideMultimeasure = false;
        for (i = key + 1; i < endMeasure; ++i) {
          staff.measures[i].svg.hideMultimeasure = true;
        }
      });
    });
  }
}
