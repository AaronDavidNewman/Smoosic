/* export const { Note, StaveNote, Beam , Tuplet, 
  Voice, Formatter, Accidental, 
  Annotation,  
  StaveText, StaveModifier,
  Stave, Font, FontStyle, FontWeight,
  Curve, StaveTie } = SmoVex;  */


import { Vex as SmoVex, Note as VexNote, StaveNote as VexStaveNote, StemmableNote as VexStemmableNote, Beam as VexBeam, Tuplet as VexTuplet, 
  Voice as VexVoice, Formatter as VexFormatter, Accidental as VexAccidental, 
  Annotation as VexAnnotation, StaveNoteStruct as VexStaveNoteStruct, 
  StaveText as VexStaveText, StaveModifier as VexStaveModifier,
Stave as VexStave, StaveModifierPosition as VexStaveModifierPosition,
Font as VexFont, FontInfo as VexFontInfo, FontStyle as VexFontStyle, FontWeight as VexFontWeight,
TupletOptions as VexTupletOptions, Curve as VexCurve, StaveTie as VexStaveTie,
 Music as VexMusic  } from "vex5_smoosic";


import { SmoSlur } from '../smo/data/staffModifiers';
import { smoSerialize } from "./serializationHelpers";
// export type Vex = SmoVex;
const Vex = SmoVex;
export const VexFlow = Vex.Flow;
const VF = Vex.Flow;
export type Music = VexMusic;
export type Note = VexNote;
export type StaveNote = VexStaveNote;
export type StemmableNote = VexStemmableNote;
export type Beam = VexBeam;
export type Tuplet = VexTuplet;
export type TupletOptions = VexTupletOptions;
export type Voice = VexVoice;
export type Accidental = VexAccidental;
export type Font = VexFont;
export type FontInfo = VexFontInfo;
export type FontStyle = VexFontStyle;
export type FontWeight = VexFontWeight;
export type Formatter = VexFormatter;
export type Annotation = VexAnnotation;
export type  StaveNoteStruct = VexStaveNoteStruct;
export type StaveModifier = VexStaveModifier;
export type StaveText = VexStaveText;
export type Stave = VexStave;
export type Curve = VexCurve;
export type StaveTie = VexStaveTie;
export type StaveModifierPosition = VexStaveModifierPosition;

// DI interfaces to create vexflow objects
export interface CreateVexNoteParams {
  isTuplet: boolean, measureIndex: number, clef: string,
  closestTicks: string, exactTicks: string, keys: string[],
  noteType: string
}; 

 export interface SmoVexTupletParams {
  vexNotes: Note[],
  numNotes: number,
  notesOccupied: number,
  location: number
};

export function chordSubscriptOffset() {
  return VF.ChordSymbol.subscriptOffset;
}
export function chordSuperscriptOffset() {
  return VF.ChordSymbol.superscriptOffset;
}
export interface SmoVexVoiceParams {
  actualBeats: number,
  beatDuration: number,
  notes: Note[]
}
export function createVoice(params: SmoVexVoiceParams) {
  const voice = new VF.Voice({
    numBeats: params.actualBeats,
    beatValue: params.beatDuration
  }).setMode(VF.Voice.Mode.SOFT);
  voice.addTickables(params.notes);
  return voice;
}
export interface SmoVexStaveParams {
  x: number,
  y: number,
  padLeft: number,
  id: string,
  staffX: number,
  staffY: number,
  staffWidth: number,
  forceClef: boolean,
  clef: string,
  forceKey: boolean,
  key: string,
  canceledKey: string | null,
  startX: number,
  adjX: number,
  context: any
}
export function createStave(params: SmoVexStaveParams) {
  const stave = new VF.Stave(params.x, params.y, params.staffWidth - params.padLeft);
  stave.setAttribute('id', params.id);
  // If there is padLeft, draw an invisible box so the padding is included in the measure box
  if (params.padLeft) {
      params.context.rect(params.staffX, params.y, params.padLeft, 50, {
        fill: 'none', 'stroke-width': 1, stroke: 'white'
    });
  }
  stave.options.spaceAboveStaffLn = 0; // don't let vex place the staff, we want to.
  // Add a clef and time signature.
  if (params.forceClef) {
    stave.addClef(params.clef);
  }
  if (params.forceKey) {
    const sig = new VF.KeySignature(params.key);
    if (params.canceledKey) {
      sig.cancelKey(params.canceledKey);
    }
    sig.addToStave(stave);
  }
  const curX = stave.getNoteStartX();
  stave.setNoteStartX(curX + (params.startX - params.adjX));  

  return stave;
}

export function getVexTuplets(params: SmoVexTupletParams) {
  const vexTuplet = new VF.Tuplet(params.vexNotes, {
    numNotes: params.numNotes,
    notesOccupied: params.notesOccupied,
    ratioed: false,
    bracketed: true,
    location: params.location
  });
  return vexTuplet;
}
export function getVexNoteParameters(params: CreateVexNoteParams) {
    // If this is a tuplet, we only get the duration so the appropriate stem
    // can be rendered.  Vex calculates the actual ticks later when the tuplet is made
    var duration =
      params.isTuplet ?
        params.closestTicks :
        params.exactTicks;
    if (typeof (duration) === 'undefined') {
      console.warn('bad duration in measure ' + params.measureIndex);
      duration = '8';
    }  
    // transpose for instrument-specific keys
    const noteParams: StaveNoteStruct = {
      clef: params.clef,
      keys: params.keys,
      duration: duration + params.noteType
    };
    return { noteParams, duration };
}
export interface SmoVexStemParams {
  voiceCount: number,
  voiceIx: number,
  isAuto: boolean,
  isUp: boolean
}
export function applyStemDirection(params: SmoVexStemParams, vxParams: StaveNoteStruct) {
  if (params.voiceCount === 1 && params.isAuto) {
    vxParams.autoStem = true;
  } else if (!params.isAuto) {
    vxParams.stemDirection = params.isUp ? 1 : -1;
  } else if (params.voiceIx % 2) {
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
export interface SmoVexHairpinParams {
  vxStart: Note | null,
  vxEnd: Note | null,
  hairpinType: number,
  height: number,
  yOffset: number,
  leftShiftPx: number,
  rightShiftPx: number
}
export function createHairpin(params: SmoVexHairpinParams) {
  const vexParams: Record<string, Note> = {};
  if (params.vxStart) {
    vexParams.firstNote = params.vxStart;
  }
  if (params.vxEnd) {
    vexParams.lastNote = params.vxEnd;
  }
  const hairpin = new VF.StaveHairpin(
    vexParams, params.hairpinType);
  hairpin.setRenderOptions({
    height: params.height,
    yShift: params.yOffset,
    leftShiftPx: params.leftShiftPx,
    rightShiftPx: params.rightShiftPx
  });
  return hairpin;
}
export interface SmoVexSlurParameters {
  vxStart: Note | null,
  vxEnd: Note | null,
  thickness: number,
  xShift: number,
  yShift: number,
  cps: DOMPoint[],
  invert: boolean,
  position: number,
  positionEnd: number
}
export function createSlur(params: SmoVexSlurParameters): Curve {
  if (params.vxStart === null && params.vxEnd === null) {
    throw(' slur with no points');
  }
  const vxStart = setSameIfNull(params.vxStart, params.vxEnd);
  const vxEnd = setSameIfNull(params.vxEnd, params.vxStart);
  const curve = new VF.Curve(vxStart!, vxEnd!,
    {
      thickness: params.thickness,
      xShift: params.xShift,
      yShift: params.yShift,
      cps: params.cps,
      invert: params.invert,
      position: params.position,
      positionEnd: params.positionEnd
    });
  return curve;
}
export interface SmoVexTieParams {
  fromLines: number[],
  toLines: number[],
  firstNote: Note | null,
  lastNote: Note | null,
  vexOptions: any
}
export function createTie(params: SmoVexTieParams): StaveTie {
  const fromLines = params.fromLines;
  const toLines = params.toLines;
  const tie = new VF.StaveTie({
    firstNote: params.firstNote,
    lastNote: params.lastNote,
    firstIndexes: fromLines,
    lastIndexes: toLines
  });
  smoSerialize.vexMerge(tie.renderOptions, params.vexOptions);
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
export function getOrnamentGlyph(glyph: string) {
  return glyph;
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
export const vexOrnaments: Record<string, string> = {
  mordent: '\ue56c' /*ornamentShortTrill*/,
  mordent_inverted: '\ue56d' /*ornamentMordent*/,
  turn: '\ue567' /*ornamentTurn*/,
  turn_inverted: '\ue569' /*ornamentTurnSlash*/,
  tr: '\ue566' /*ornamentTrill*/,
  upprall: '\ue5b5' /*ornamentPrecompSlideTrillDAnglebert*/,
  downprall: '\ue5c3' /*ornamentPrecompDoubleCadenceUpperPrefix*/,
  prallup: '\ue5bb' /*ornamentPrecompTrillSuffixDandrieu*/,
  pralldown: '\ue5c8' /*ornamentPrecompTrillLowerSuffix*/,
  upmordent: '\ue5b8' /*ornamentPrecompSlideTrillBach*/,
  downmordent: '\ue5c4' /*ornamentPrecompDoubleCadenceUpperPrefixTurn*/,
  lineprall: '\ue5b2' /*ornamentPrecompAppoggTrill*/,
  prallprall: '\ue56e' /*ornamentTremblement*/,
  scoop: '\ue5d0' /*brassScoop*/,
  doit: '\ue5d5' /*brassDoitMedium*/,
  fall: '\ue5d7' /*brassFallLipShort*/,
  doitLong: '\ue5d2' /*brassLiftMedium*/,
  fallLong: '\ue5de' /*brassFallRoughMedium*/,
  bend: '\ue5e3' /*brassBend*/,
  plungerClosed: '\ue5e5' /*brassMuteClosed*/,
  plungerOpen: '\ue5e7' /*brassMuteOpen*/,
  flip: '\ue5e1' /*brassFlip*/,
  jazzTurn: '\ue5e4' /*brassJazzTurn*/,
  smear: '\ue5e2' /*brassSmear*/,
}