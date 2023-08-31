import { Vex, Note, TextFormatter } from "vex5_smoosic";

const VF = Vex.Flow;
export const SmoVex = Vex;
export type VexNote = Note;
export type  VexTextFormatter = TextFormatter;
export const TextFormatterClass = TextFormatter;

export const ChordSymbolGlyphs: Record<string,string> = VF.ChordSymbol.glyphs;