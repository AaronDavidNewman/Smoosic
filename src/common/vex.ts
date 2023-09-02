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
export const ChordSymbolGlyphs: Record<string,string> = VF.ChordSymbol.glyphs;