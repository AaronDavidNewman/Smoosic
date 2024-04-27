import { Vex as SmoVex, Note as VexNote, StaveNote as VexStaveNote, StemmableNote as VexStemmableNote, Beam as VexBeam, Tuplet as VexTuplet, 
  Voice as VexVoice, Formatter as VexFormatter, Accidental as VexAccidental, 
  Annotation as VexAnnotation, StaveNoteStruct as VexStaveNoteStruct, 
  StaveText as VexStaveText, StaveModifier as VexStaveModifier,
  TextNote as VexTextNote,
Stave as VexStave, StaveModifierPosition as VexStaveModifierPosition,
Font as VexFont, FontInfo as VexFontInfo, FontStyle as VexFontStyle, FontWeight as VexFontWeight,
TupletOptions as VexTupletOptions, Curve as VexCurve, StaveTie as VexStaveTie,
ClefNote as VexClefNote,
 Music as VexMusic, ChordSymbol as VexChordSymbol, ChordSymbolBlock as VexChordSymbolBlock  } from "vexflow_smoosic";

 /**
  * Module vex.ts.  This handles vexflow calls and structures that have changed 
  * between v4 and v5.  There will be a custom version of this file for each.
  * Most of the differences are trivial - e.g. different naming conventions for variables.
  */
import { smoSerialize } from "./serializationHelpers";
// export type Vex = SmoVex;
export const VexFlow = SmoVex.Flow;
const VF = VexFlow;
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
export type TextNote = VexTextNote;
export type  StaveNoteStruct = VexStaveNoteStruct;
export type StaveModifier = VexStaveModifier;
export type StaveText = VexStaveText;
export type Stave = VexStave;
export type Curve = VexCurve;
export type StaveTie = VexStaveTie;
export type ClefNote = VexClefNote;
export type StaveModifierPosition = VexStaveModifierPosition;


export interface GlyphInfo {
  width: number,
  height: number,
  yTop: number,
  yBottom: number,
  spacingRight: number,
  vexGlyph: string | null
}

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
    num_beats: params.actualBeats,
    beat_value: params.beatDuration
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
/**
 * Vex4 and Vex5 handle width differently.  Vex5, width comes directly from the 
 * font glyph, vex4 the glyph is a path so it comes from the stored information about 
 * the path.
 * 
 * @param smoGlyph 
 * @returns 
 */
export function getGlyphWidth(smoGlyph: GlyphInfo) {
  if (smoGlyph.vexGlyph) {
    /* const vexGlyph = (VF.Glyphs as Record<string, string>)[smoGlyph.vexGlyph];
    if (vexGlyph) {
      return VF.Element.measureWidth(vexGlyph);
    }
    return VF.Element.measureWidth(smoGlyph.vexGlyph);  */
    const vf = VF.Glyph.MUSIC_FONT_STACK[0].getGlyphs()[smoGlyph.vexGlyph];
    return (vf.x_max - vf.x_min) * glyphPixels();
  } 
  return smoGlyph.width;
}
/**
 * V4 uses the glyph name, V5 uses the unicode value
 * @returns 
 */
export function getSlashGlyph() {
        // vexNote = new VF.GlyphNote('\uE504', { duration });
       return new VF.GlyphNote(new VF.Glyph('repeat1Bar', 38), { duration: 'w' }, { line: 2 });
}
export function getRepeatBar() {
  return new VF.GlyphNote(new VF.Glyph('repeat1Bar', 38), { duration: 'w' }, { line: 2 });
}
export function getMultimeasureRest(multimeasureLength: number) {
  return new VF.MultiMeasureRest(multimeasureLength,
    // { numberOfMeasures: this.smoMeasure.svg.multimeasureLength });
    { number_of_measures: multimeasureLength });
}
export function pitchToLedgerLine(vexPitch: string, clef: string) {
  return -1.0 * (VF.keyProperties(vexPitch).line - 4.5)
  - VF.clefProperties(clef).line_shift;
}
export function vexCanonicalNotes(): any {
      // return VF.Music.canonicalNotes[SmoMusic.noteValues[vexKey].int_val];
      return VF.Music.canonical_notes;
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
  // stave.options.spaceAboveStaffLn = 0; // don't let vex place the staff, we want to.
  stave.options.space_above_staff_ln = 0; // don't let vex place the staff, we want to.
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
  // const curX = stave.getNoteStartX();
  // stave.setNoteStartX(curX + (params.startX - params.adjX));  

  return stave;
}

export function getVexTuplets(params: SmoVexTupletParams) {
  const vexTuplet = new VF.Tuplet(params.vexNotes, {
    num_notes: params.numNotes,
    notes_occupied: params.notesOccupied,
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
    vxParams.auto_stem = true;
  } else if (!params.isAuto) {
    vxParams.stem_direction = params.isUp ? 1 : -1;
  } else if (params.voiceIx % 2) {
    vxParams.stem_direction = -1;
  } else {
    vxParams.stem_direction = 1;
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
    vexParams.first_note = params.vxStart;
  }
  if (params.vxEnd) {
    vexParams.last_note = params.vxEnd;
  }
  const hairpin = new VF.StaveHairpin(
    vexParams, params.hairpinType);
  hairpin.setRenderOptions({
    height: params.height,
    y_shift: params.yOffset,
    left_shift_px: params.leftShiftPx,
    right_shift_px: params.rightShiftPx
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
export const defaultMeasurePadding = VF.Stave.defaultPadding;
export function createSlur(params: SmoVexSlurParameters): Curve {
  if (params.vxStart === null && params.vxEnd === null) {
    throw(' slur with no points');
  }
  const vxStart = setSameIfNull(params.vxStart, params.vxEnd);
  const vxEnd = setSameIfNull(params.vxEnd, params.vxStart);
  const curve = new VF.Curve(vxStart!, vxEnd!,
    {
      thickness: params.thickness,
      x_shift: params.xShift,
      y_shift: params.yShift,
      cps: params.cps,
      invert: params.invert,
      position: params.position,
      position_end: params.positionEnd
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
    first_note: params.firstNote,
    last_note: params.lastNote,
    first_indices: fromLines,
    last_indices: toLines
  });
  smoSerialize.vexMerge(tie.render_options, params.vexOptions);
  return tie;
}
export const defaultNoteScale: number = 30;
export const defaultCueScale: number = 19.8;

export function glyphPixels() {
  return 96 * (defaultNoteScale / (VF.Glyph.MUSIC_FONT_STACK[0].getResolution() * 72));
  // return defaultNoteScale;
}

export function setFontStack(font: string) {
  const fs: Record<string, ()=> void>  = {
    /* Bravura: () => { VexFlow.setFonts('Bravura', 'Gonville', 'Custom'); },
    Gonville: () => { VexFlow.setFonts('Gonville', 'Bravura', 'Custom'); },
    Petaluma: () => { VexFlow.setFonts('Petaluma', 'Bravura', 'Gonville', 'Custom'); },
    Leland: () => { VexFlow.setFonts('Leland', 'Bravura', 'Gonville', 'Custom'); } */
    Bravura: () => { VexFlow.setMusicFont('Bravura', 'Gonville', 'Custom'); },
    Gonville: () => { VexFlow.setMusicFont('Gonville', 'Bravura', 'Custom'); },
    Petaluma: () => { VexFlow.setMusicFont('Petaluma', 'Bravura', 'Gonville', 'Custom'); },
    Leland: () => { VexFlow.setMusicFont('Leland', 'Bravura', 'Gonville', 'Custom'); }
  };
  fs[font]();
}
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
  /* const glyph = new VF.Element();
  glyph.setText(text);
  glyph.setFontSize(fontSize);
  glyph.renderText(context, x, y);
  return { width: glyph.getWidth(), height: glyph.getHeight() };*/
  const glyph = new VF.Glyph(text, fontSize);
  glyph.render(context, x, y);
  // vex 5 incompatibility.
  // x += VF.TextDynamics.GLYPHS[text].width;
  const metrics = glyph.getMetrics();
  return { width: metrics.width, height: metrics.height };  
}
export function getOrnamentGlyph(glyph: string) {
  return glyph;
  // return vexOrnaments[glyph];
}

export function addChordGlyph(cs: VexChordSymbol, symbol: string) {
  cs.addGlyph(symbol);
}
/**
 * get a glyph code to render
 * @param code 
 * @returns 
 */
export function getVexGlyphFromChordCode(code: string) {
  if (code === 'csymDiminished' || code === 'csymHalfDiminished' || code === 'csymAugmented' || code === 'csymMajorSeventh') {
    return code;
  }
  return ChordSymbolGlyphs[code].code;
}
export function createTextNote(code: string) {
  return new VexTextNote({ glyph: code, duration: '8' }).setLine(2);
}
/**
 * Get the chord symbol glyph from the vex glyph
 * @export
 * @param {string} code
 * @return {*} 
 */
export function getChordSymbolGlyphFromCode(code: string) {
  const keys = Object.keys(ChordSymbolGlyphs);
  const rv = keys.find((key) => ChordSymbolGlyphs[key].code === code);
  if (typeof(rv) === 'string') {
    return rv;
  }
  return code;
}
export function getChordSymbolMetricsForGlyph(code: string) {
  if (code === 'b') {
    code = 'accidentalFlat';
  }
  if (code === '#') {
    code = 'accidentalSharp';
  }
  const glyphMetrics = VexChordSymbol.metrics.glyphs;
  return glyphMetrics[code];
}
/**
 * Vex 5 compatibility.  yShift
 */
export function blockMetricsYShift(metrics: any) {
  return metrics.y_shift;
}
// Glyph data.  Note Vex4 and Vex5 have different requirements.  Vex5 expects the unicode identifier (16-bit number)
// where vex4 expects a string glyph
export const ChordSymbolGlyphs: Record<string, { code: string }> = {
  diminished: {
    code: 'csymDiminished',
  },
  dim: {
    code: 'csymDiminished',
  },
  halfDiminished: {
    code: 'csymHalfDiminished',
  },
  '+': {
    code: 'csymAugmented',
  },
  augmented: {
    code: 'csymAugmented',
  },
  majorSeventh: {
    code: 'csymMajorSeventh',
  },
  csymMinor: {
    code: 'minor',
  },
  minor: {
    code: 'minor',
  },
  '-': {
    code: 'minor',
  },
  '(': {
    code: 'csymParensLeftTall',
  },  
  leftParen: {
    code: 'csymParensLeftTall',
  },
  ')': {
    code: 'csymParensRightTall',
  },
  rightParen: {
    code: 'csymParensRightTall',
  },
  leftBracket: {
    code: 'csymBracketLeftTall',
  },
  rightBracket: {
    code: 'csymBracketRightTall',
  },  
  leftParenTall: {
    code: 'csymParensLeftVeryTall',
  }, rightParenTall: {
    code: 'csymParensRightVeryTall',
  },
  '/': {
    code: 'csymDiagonalArrangementSlash',
  },
 over: {
    code: 'csymDiagonalArrangementSlash',
  },
  '#': {
    code: 'accidentalSharp',
  },
  b: {
    code: 'accidentalFlat',
  },
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