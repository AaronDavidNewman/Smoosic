import { Vex as SmoVex, Note as VexNote, TextFormatter as VexTextFormatter, 
  StaveNote as VexStaveNote, StemmableNote as VexStemmableNote, Beam as VexBeam, Tuplet as VexTuplet, 
  Voice as VexVoice, Formatter as VexFormatter, Accidental as VexAccidental, 
  Annotation as VexAnnotation, StaveNoteStruct as VexStaveNoteStruct, 
  StaveText as VexStaveText, StaveModifier as VexStaveModifier,
Stave as VexStave, StaveModifierPosition as VexStaveModifierPosition, TextJustification as VexTextJustification,
TupletOptions as VexTupletOptions } from "vex5_smoosic";

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
export function createStaveText(text: string, position: number, options: any) {
  return new VexStaveText(text, position, options);
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