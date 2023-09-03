import { Vex as SmoVex, Note as VexNote, TextFormatter as VexTextFormatter, 
  StaveNote as VexStaveNote, StemmableNote as VexStemmableNote, Beam as VexBeam, Tuplet as VexTuplet, 
  Voice as VexVoice, Formatter as VexFormatter, Accidental as VexAccidental, 
  Annotation as VexAnnotation, StaveNoteStruct as VexStaveNoteStruct, 
  StaveText as VexStaveText, StaveModifier as VexStaveModifier,
Stave as VexStave, StaveModifierPosition as VexStaveModifierPosition, TextJustification as VexTextJustification,
TupletOptions as VexTupletOptions, Curve, StaveTie } from "vex5_smoosic";
import { SmoStaffHairpin, SmoSlur, SmoTie } from '../smo/data/staffModifiers';
import { SmoNote } from '../smo/data/note';
import { SmoVoice, SmoMeasure } from '../smo/data/measure';
import { smoSerialize } from "./serializationHelpers";
import { SmoMusic } from '../smo/data/music';
import { SmoTuplet } from '../smo/data/tuplet';

const VF = SmoVex.Flow;
export type Vex = SmoVex;
export const Vex = SmoVex;
export type Note = VexNote;
export type StaveNote = VexStaveNote;
export type StemmableNote = VexStemmableNote;
export const StemmableNoteClass = VexStemmableNote;
export type  TextFormatter = VexTextFormatter;
export const TextFormatterClass = VexTextFormatter;
export type Beam = VexBeam;
export type Tuplet = VexTuplet;
export type TupletOptions = VexTupletOptions;
export type Voice = VexVoice;
export type Accidental = VexAccidental;
export type Formatter = VexFormatter;
export type Annotation = VexAnnotation;
export type  StaveNoteStruct = VexStaveNoteStruct;
export type StaveModifier = VexStaveModifier;
export const StaveModifierPosition = VexStaveModifierPosition;
export type StaveText = VexStaveText;
export type Stave = VexStave;
export const TextJustification = VexTextJustification;

export function chordSubscriptOffset() {
  return VF.ChordSymbol.subscriptOffset;
}
export function chordSuperscriptOffset() {
  return VF.ChordSymbol.superscriptOffset;
}
export function createVoice(smoMeasure: SmoMeasure, notes: Note[]) {
  const voice = new VF.Voice({
    numBeats: smoMeasure.timeSignature.actualBeats,
    beatValue: smoMeasure.timeSignature.beatDuration
  }).setMode(VF.Voice.Mode.SOFT);
  voice.addTickables(notes);
  return voice;
}
export function createStave(x: number, y: number, smoMeasure: SmoMeasure, context: any) {
  const key = SmoMusic.vexKeySignatureTranspose(smoMeasure.keySignature, 0);
  const canceledKey = SmoMusic.vexKeySignatureTranspose(smoMeasure.canceledKeySignature, 0);
  const stave = new VF.Stave(x, y, smoMeasure.staffWidth - smoMeasure.format.padLeft);
  stave.setAttribute('id', smoMeasure.attrs.id);
  // If there is padLeft, draw an invisible box so the padding is included in the measure box
  if (smoMeasure.format.padLeft) {
    context.rect(smoMeasure.staffX, y, smoMeasure.format.padLeft, 50, {
      fill: 'none', 'stroke-width': 1, stroke: 'white'
    });
  }

  stave.options.spaceAboveStaffLn = 0; // don't let vex place the staff, we want to.

  // Add a clef and time signature.
  if (smoMeasure.svg.forceClef) {
    stave.addClef(smoMeasure.clef);
  }
  if (smoMeasure.svg.forceKeySignature) {
    const sig = new VF.KeySignature(key);
    if (smoMeasure.canceledKeySignature) {
      sig.cancelKey(canceledKey);
    }
    sig.addToStave(stave);
  }
  return stave;
}
export function getVexTimeSignature(smoMeasure: SmoMeasure) {
  const voice = new VF.Voice({
      numBeats: smoMeasure.timeSignature.actualBeats,
      beatValue: smoMeasure.timeSignature.beatDuration
    }).setMode(VF.Voice.Mode.SOFT);
  return voice;
}
export function getVexTuplets(vexNotes: Note[], tp: SmoTuplet, smoMeasure: SmoMeasure) {
  const direction = tp.getStemDirection(smoMeasure.clef) === SmoNote.flagStates.up ?
    VF.Tuplet.LOCATION_TOP : VF.Tuplet.LOCATION_BOTTOM;
  const vexTuplet = new VF.Tuplet(vexNotes, {
    numNotes: tp.num_notes,
    notesOccupied: tp.notes_occupied,
    ratioed: false,
    bracketed: true,
    location: direction
  });
  return vexTuplet;
}
export function getVexNoteParameters(smoNote: SmoNote, noteScale: number, measureIndex: number) {
    // If this is a tuplet, we only get the duration so the appropriate stem
    // can be rendered.  Vex calculates the actual ticks later when the tuplet is made
    var duration =
      smoNote.isTuplet ?
        SmoMusic.closestVexDuration(smoNote.tickCount) :
        SmoMusic.ticksToDuration[smoNote.tickCount];

    if (typeof (duration) === 'undefined') {
      console.warn('bad duration in measure ' + measureIndex);
      duration = '8';
    }  
    // transpose for instrument-specific keys
    const noteHead = smoNote.isRest() ? 'r' : smoNote.noteHead;
    const keys = SmoMusic.smoPitchesToVexKeys(smoNote.pitches, 0, noteHead);
    const noteParams: StaveNoteStruct = {
      clef: smoNote.clef,
      keys,
      duration: duration + smoNote.noteType,
      glyphFontScale: noteScale
    };

    return { noteParams, duration };
}
export function applyStemDirection(voices: SmoVoice[], vxParams: StaveNoteStruct, voiceIx: number, flagState: number) {
  if (voices.length === 1 && flagState === SmoNote.flagStates.auto) {
    vxParams.autoStem = true;
  } else if (flagState !== SmoNote.flagStates.auto) {
    vxParams.stemDirection = flagState === SmoNote.flagStates.up ? 1 : -1;
  } else if (voiceIx % 2) {
    vxParams.stemDirection = -1;
  } else {
    vxParams.stemDirection = 1;
  }
}
const setSameIfNull = (a: any, b: any) => {
  if (typeof (a) === 'undefined' || a === null) {
    return b;
  }
  return a;
};
export function createStaveText(text: string, position: number, options: any) {
  return new VexStaveText(text, position, options);
}
export function createHairpin(hp: SmoStaffHairpin, vxStart: Note | null, vxEnd: Note | null) {
  const params: Record<string, Note> = {};
  if (vxStart) {
    params['firstNote'] = vxStart;
  }
  if (vxEnd) {
    params['lastNote'] = vxEnd;
  }
  const hairpin = new VF.StaveHairpin(params, hp.hairpinType);
  hairpin.setRenderOptions({
    height: hp.height,
    yShift: hp.yOffset,
    leftShiftPx: hp.xOffsetLeft,
    rightShiftPx: hp.xOffsetRight
  });
  return hairpin;
}
export function createSlur(slur: SmoSlur, slurX: number, svgPoint: DOMPoint[], vxStart: Note | null, vxEnd: Note | null): Curve {
  if (vxStart === null && vxEnd === null) {
    throw(' slur with no points');
  }
  vxStart = setSameIfNull(vxStart, vxEnd);
  vxEnd = setSameIfNull(vxEnd, vxStart);
  const curve = new VF.Curve(vxStart!, vxEnd!,
    {
      thickness: slur.thickness,
      xShift: slurX,
      yShift: slur.yOffset,
      cps: svgPoint,
      invert: slur.invert,
      position: slur.position,
      positionEnd: slur.position_end
    });
  return curve;
}
export function createTie(ctie: SmoTie, 
  startNote: SmoNote, endNote: SmoNote, 
  vxStart: Note | null, vxEnd: Note | null): StaveTie {
  ctie.checkLines(startNote, endNote);
  const fromLines = ctie.lines.map((ll) => ll.from);
  const toLines = ctie.lines.map((ll) => ll.to);
  const tie = new VF.StaveTie({
    firstNote: vxStart,
    lastNote: vxEnd,
    firstIndexes: fromLines,
    lastIndexes: toLines          
  });
  smoSerialize.vexMerge(tie.renderOptions, ctie.vexOptions);
  return tie;
}
export const defaultNoteScale: number = 30;
export const defaultCueScale: number = 19.8;
/**
 * Render a dynamics glyph.  Return the height of width/height of the glyph
 * @param context 
 * @param text 
 * @param fontSize 
 * @param x 
 * @param y 
 * @returns 
 */
export function renderDynamics(context: any, text: string, fontSize: number, x: number, y: number) {
  const glyph = new VF.Element();
  glyph.setText(text);
  glyph.setFontSize(fontSize);
  glyph.renderText(context, x, y);
  return { width: glyph.getWidth(), height: glyph.getHeight() };
}
// Glyph data
export const ChordSymbolGlyphs: Record<string, string> = {
  csymDiminished: '\ue870' /*csymDiminished*/,
  dim: '\ue870' /*csymDiminished*/,
  csymHalfDiminished: '\ue871' /*csymHalfDiminished*/,
  '+': '\ue872' /*csymAugmented*/,
  augmented: '\ue872' /*csymAugmented*/,
  csymAugmented: '\ue872' /*csymAugmented*/,
  majorSeventh: '\ue873' /*csymMajorSeventh*/,
  minor: '\ue874' /*csymMinor*/,
  '-': '\ue874' /*csymMinor*/,
  rightBracket: '\ue878' /*csymBracketRightTall*/,
  leftParenTall: '\u0028' /*csymParensLeftVeryTall*/,
  rightParenTall: '\u0029' /*csymParensRightVeryTall*/,
  csymParensRightTall: '\u0029' /*csymParensRightTall*/,
  csymLeftBracket: '\ue877' /*csymBracketLeftTall*/,
  csymRightBracket: '\ue878' /*csymBracketRightTall*/,
  csymLeftParenTall: '\u0028' /*csymParensLeftVeryTall*/,
  csymRightParenTall: '\u0029' /*csymParensRightVeryTall*/,
  '/': '\ue87c' /*csymDiagonalArrangementSlash*/,
  over: '\ue87c' /*csymDiagonalArrangementSlash*/,
  '#': '\ued62' /*csymAccidentalSharp*/,
  accidentalSharp: '\ued62' /*csymAccidentalSharp*/,
  accidentalFlat: '\ued60' /*csymAccidentalFlat*/,
  csymAccidentalSharp: '\ued62' /*csymAccidentalSharp*/,
  csymAccidentalFlat: '\ued60' /*csymAccidentalFlat*/,
  b: '\ued60' /*csymAccidentalFlat*/,
};