// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * A note modifier is anything that is mapped to the note, but not part of the
 * pitch itself.  This includes grace notes, and note-text like lyrics.
 * @module /smo/data/noteModifiers
 */
import { SmoAttrs, Ticks, Pitch, getId, SmoObjectParams, Transposable, SvgBox, SmoModifierBase } from './common';
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoSelector } from '../xform/selections';
import { SmoMusic } from './music';
import { VexFlow, defaultNoteScale, FontInfo, getChordSymbolGlyphFromCode } from '../../common/vex';

const VF = VexFlow;
// const Smo = eval('globalThis.Smo');

/**
 * A note modifier is anything that is mapped to the note, but not part of the
 * pitch itself.  This includes grace notes, and note-text like lyrics.
 * All note modifiers have a serialize method and a 'ctor' parameter or deserialization
 * @category SmoModifier
 */
export abstract class SmoNoteModifierBase implements SmoModifierBase {
  attrs: SmoAttrs;
  ctor: string;
  logicalBox: SvgBox | null = null;
  element: SVGSVGElement | null = null;
  constructor(ctor: string) {
    this.attrs = {
      id: getId().toString(),
      type: ctor
    };
    this.ctor = ctor;
  }
  static deserialize(jsonObj: SmoObjectParams) {
    const ctor = eval('globalThis.Smo.' + jsonObj.ctor);
    // Handle backwards-compatibility thing
    if (jsonObj.ctor === 'SmoMicrotone' && typeof ((jsonObj as any).pitch) === 'number') {
      (jsonObj as any).pitchIndex = (jsonObj as any).pitch;
    }
    if (jsonObj.ctor === 'SmoLyric') {
      if (typeof((jsonObj as any)._text) === 'string') {
        (jsonObj as any).text = (jsonObj as any)._text;
      }
    }
    if (typeof (ctor) === 'undefined') {
      console.log('ouch bad ctor for ' + jsonObj.ctor);
    }
    const rv = new ctor(jsonObj);
    return rv;
  }
  abstract serialize(): any;
}

/**
 * used to construct {@link SmoGraceNote}
 *   beam group.
 * @category SmoParameters
 */
export interface GraceNoteParams extends SmoModifierBase {
  /**
   * up, down, or auto
   */
  flagState: number,
  /**
   * same as for {@link SmoNote}
   */
  noteType: string,
  /**
   * same as for {@link SmoNote}
   */
  beamBeats: number,
  /**
   * same as for {@link SmoNote}.  Indicates break in beam group
   */
  endBeam: boolean,
  /**
   * should be same as note?
   */
  clef: string,
  /**
   * there's probably a name for this...
   */
  slash: boolean,
  /**
   * only used for beaming
   */
  ticks: Ticks,
  /**
   * Pitch, same as for {@link SmoNote}
   */
  pitches: Pitch[],
}

/**
 * serialized grace note
 * @category serialization
 */
export interface GraceNoteParamsSer extends GraceNoteParams {
  /**
   * constructor
   */
  ctor: string;
  /**
   * attributes for ID
   */
  attrs: SmoAttrs;
}

function isGraceNoteParamsSer(params: Partial<GraceNoteParamsSer>): params is GraceNoteParamsSer {
  if (typeof(params.ctor) !== 'string' || params.ctor !== 'SmoGraceNote') {
    return false;
  }
  return true;
}
/**
 * A grace notes has many of the things an 'actual' note can have, but it doesn't take up
 * time against the time signature
 * @category SmoModifier
 */
export class SmoGraceNote extends SmoNoteModifierBase implements Transposable {
  static get flagStates() {
    return { auto: 0, up: 1, down: 2 };
  }
  static get defaults(): GraceNoteParams {
    return JSON.parse(JSON.stringify({
      flagState: SmoGraceNote.flagStates.auto,
      noteType: 'n',
      beamBeats: 4096,
      endBeam: false,
      clef: 'treble',
      slash: false,
      ticks: {
        numerator: 4096,
        denominator: 1,
        remainder: 0
      },
      pitches: [{
        letter: 'b',
        octave: 4,
        accidental: ''
      }]
    }));
  }
  // TODO: Matches SmoNote - move to SmoMusic?
  static get parameterArray() {
    const rv: string[] = [];
    // eslint-disable-next-line
    for (const key in SmoGraceNote.defaults) {
      rv.push(key);
    }
    return rv;
  }
  ticks: Ticks = SmoGraceNote.defaults.ticks;
  pitches: Pitch[] = [];
  slash: boolean = false;
  clef: string = 'treble';
  noteType: string = 'n';
  renderId: string | null = null;

  tickCount() {
    return this.ticks.numerator / this.ticks.denominator + this.ticks.remainder;
  }

  toVexGraceNote() {
    const p = SmoMusic.smoPitchesToVex(this.pitches);
    const rv = { duration: SmoMusic.closestVexDuration(this.tickCount()), keys: p, slash: this.slash };
    return rv;
  }

  serialize(): GraceNoteParamsSer {
    const params: Partial<GraceNoteParamsSer> = { ctor: 'SmoGraceNote' };
    smoSerialize.serializedMergeNonDefault(SmoGraceNote.defaults,
      SmoGraceNote.parameterArray, this, params);
    if (!isGraceNoteParamsSer(params)) {
      throw 'bad grace note ' + JSON.stringify(params);
    }
    return params;
  }

  constructor(parameters: Partial<GraceNoteParams>) {
    super('SmoGraceNote');
    smoSerialize.serializedMerge(SmoGraceNote.parameterArray, SmoGraceNote.defaults, this);
    smoSerialize.serializedMerge(SmoGraceNote.parameterArray, parameters, this);
  }
}
export type SmoArpeggioType = 'directionless' | 'rasquedo_up' | 'rasquedo_down' 
  | 'roll_up' | 'roll_down' | 'brush_up' | 'brush_down' | 'none';
export  const SmoArpeggioTypes = ['directionless', 'rasquedo_up', 'rasquedo_down',
  'roll_up', 'roll_down', 'brush_up', 'brush_down', 'none'];

  /**
   * @category SmoParameters
   */
export interface SmoArpeggioParams {
   type: SmoArpeggioType
}
/**
 * @category serialization
 */
export interface SmoArpeggioParamsSer {
  ctor: string;
  /**
   * stringified arpeggion enumeration
   */
  type: string;
}
function isSmoArpeggionParamsSer(params: Partial<SmoArpeggioParamsSer>): params is SmoArpeggioParamsSer {
  if (typeof(params.ctor) !== 'string' || params.ctor !== 'SmoArpeggio') {
    return false;
  }
  return true;
}
export function isArpeggioType(tp: SmoArpeggioType | string): tp is SmoArpeggioType {
  return SmoArpeggioTypes.indexOf(tp) >= 0;
}
/**
 * A 'splatter' symbol next to a chord.
 */
export class SmoArpeggio extends SmoNoteModifierBase {
  static _types: Record<string, number> = {};
  static get types() {
    if (typeof(SmoArpeggio._types['directionless']) === 'undefined') {
      SmoArpeggio._types['directionless'] = 7;
      SmoArpeggio._types['rasquedo_up'] = 6;
      SmoArpeggio._types['rasquedo_down'] = 5;
      SmoArpeggio._types['roll_up'] = 4;
      SmoArpeggio._types['roll_down'] = 3;
      SmoArpeggio._types['brush_up'] = 2;
      SmoArpeggio._types['brush_down'] = 1;
      SmoArpeggio._types['none'] = 0;
    }
    return SmoArpeggio._types;
  }    
  typeCode: number;
  constructor(params: SmoArpeggioParams) {
    super('SmoArpeggio');
    this.typeCode = SmoArpeggio.types[params.type];
  }
  get typeString(): SmoArpeggioType {
    const str = SmoArpeggioTypes.find((x) => SmoArpeggio.types[x] === this.typeCode);
    const type = str ? str : 'none';
    return type as SmoArpeggioType;
  }
  serialize(): SmoArpeggioParamsSer {
    const rv: Partial<SmoArpeggioParamsSer> = { ctor: 'SmoArpeggio' }
    const str = SmoArpeggioTypes.find((x) => SmoArpeggio.types[x] === this.typeCode);
    rv.type = str ? str : 'none';
    if (!isSmoArpeggionParamsSer(rv)) {
      throw 'bad arpeggio ' + JSON.stringify(rv);
    }
    return rv;
  }
}
/**
 * Constructor parameters for {@link SmoMicrotone}
 * @category SmoParams
 */
export interface SmoMicrotoneParams extends SmoObjectParams {
  /**
   * indicates which modifier to alter the tone (e.g. 1/4 sharp)
   */
  tone: string,
  /**
   * the index of the pitch to alter
   */
  pitch: number
}
/**
 * serialized microtones.
 * @category serialization
 */
export interface SmoMicrotoneParamsSer extends SmoMicrotoneParams {
  ctor: string,
  attrs: SmoAttrs
}
function isSmoMicrotoneParamsSer(params: Partial<SmoMicrotoneParamsSer>): params is SmoMicrotoneParamsSer {
  if (typeof(params.ctor) !== 'string' || params.ctor !== 'SmoMicrotone') {
    return false;
  }
  return true;
}
/**
 * Microtones are treated similarly to ornaments.  There are not
 * rules for persisting throughout a measure, cancel etc.
 * @category SmoModifier
*/
export class SmoMicrotone extends SmoNoteModifierBase {
  tone: string;
  pitchIndex: number = 0;

  // This is how VexFlow notates them
  static readonly smoToVex: Record<string, string> = {
    flat75sz: 'db',
    flat25sz: 'd',
    flat25ar: 'bs',
    flat125ar: 'afhf',
    sharp75: '++',
    sharp125: 'ashs',
    sharp25: '+',
    sori: 'o',
    koron: 'k'
  }

  // The audio frequency offsets
  static readonly pitchCoeff: Record<string, number> = {
    flat75sz: -1.5,
    flat25sz: -0.5,
    flat25ar: -0.5,
    flat125ar: -2.5,
    sharp75: 1.5,
    sharp125: 2.5,
    sharp25: 0.5,
    sori: 0.5,
    koron: -0.5
  }

  get toPitchCoeff(): number {
    return SmoMicrotone.pitchCoeff[this.tone];
  }

  get toVex(): string {
    return SmoMicrotone.smoToVex[this.tone];
  }
  static readonly defaults: SmoMicrotoneParams = {
    ctor: 'SmoMicrotone',
    tone: 'flat25sz',
    pitch: 0
  }
  static get parameterArray() {
    const rv: string[] = [];
    // eslint-disable-next-line
    for (const key in SmoMicrotone.defaults) {
      rv.push(key);
    }
    return rv;
  }
  serialize(): SmoMicrotoneParamsSer {
    const params: Partial<SmoMicrotoneParamsSer> = { ctor: 'SmoMicrotone' };
    smoSerialize.serializedMergeNonDefault(SmoMicrotone.defaults,
      SmoMicrotone.parameterArray, this, params);
    if (!isSmoMicrotoneParamsSer(params)) {
      throw 'bad microtone ' + JSON.stringify(params);
    }
    return params;
  }
  constructor(parameters: SmoMicrotoneParams) {
    super(parameters.ctor);
    this.pitchIndex = parameters.pitch;
    this.tone = parameters.tone;
  }
}

/**
 * Constructor for {@link SmoOrnament}
 * @category SmoParams
 */
export interface SmoOrnamentParams {
  /**
   * postition, above or below
   */
  position?: string,
  /**
   * horizontal offset from note head
   */  
  offset?: string,
  /**
   * code for the ornament
   */
  ornament: string,
}
/**
 * serializable ornament
 * @category serialization
 */
export interface SmoOrnamentParamsSer extends SmoOrnamentParams {
  /**
   * constructor
   */
  ctor: string;
}
function isSmoOrnamentParamsSer(params: Partial<SmoOrnamentParamsSer>): params is SmoOrnamentParamsSer {
  if (typeof(params.ctor) !== 'string' || params.ctor !== 'SmoOrnament') {
    return false;
  }
  return true;
}
/**
 * Ornaments map to vex ornaments.  articulations vs. ornaments
 * is kind of arbitrary
 * @category SmoModifier
 */
export class SmoOrnament extends SmoNoteModifierBase {
  static readonly ornaments: Record<string, string> = {
    mordent: 'mordent',
    mordentInverted: 'mordent_inverted',
    turn: 'turn',
    turnInverted: 'turn_inverted',
    trill: 'tr',
    upprall: 'upprall',
    prallup: 'prallup',
    pralldown: 'pralldown',
    upmordent: 'upmordent',
    downmordent: 'downmordent',
    lineprall: 'lineprall',
    prallprall: 'prallprall',
    scoop: 'scoop',
    fall_short: 'fall',
    dropLong: 'fallLong',
    doit: 'doit',
    doitLong: 'doitLong',
    flip: 'flip',
    smear: 'smear'
  }

  static readonly xmlOrnaments: Record<string, string> = {
    mordent: 'mordent',
    mordent_inverted: 'inverted-mordent',
    turn: 'turn',
    turn_inverted: 'inverted-turn',
    upmordent: 'mordent',
    downmordent: 'mordent',
    lineprall: 'schleifer',
    prallprall: 'schleifer',
    prallup: 'schleifer',
    tr: 'trill-mark'
  }
  // jazz ornaments in vex are articulations in music xml
  static readonly xmlJazz: Record<string, string> = {
    doit: 'doit',
    scoop: 'scoop',
    dropLong: 'falloff',
    drop: 'plop'
  }
  static get jazzOrnaments(): string[] {
    return ['SCOOP', 'FALL_SHORT', 'FALL_LONG', 'DOIT', 'LIFT', 'FLIP', 'SMEAR'];
  }
  toVex() {
    return SmoOrnament.ornaments[this.ornament.toLowerCase()];
  }

  isJazz() {
    return SmoOrnament.jazzOrnaments.indexOf(this.ornament) >= 0;
  }
  position: string = SmoOrnament.positions.above;
  offset: string = 'on';
  ornament: string = SmoOrnament.ornaments.mordent;

  static get parameterArray() {
    const rv: string[] = [];
    // eslint-disable-next-line
    for (const key in SmoOrnament.defaults) {
      rv.push(key);
    }
    return rv;
  }

  static get positions() {
    return {
      above: 'above',
      below: 'below'
    };
  }
  static get offsets() {
    return {
      on: 'on',
      after: 'after'
    };
  }
  static get defaults(): SmoOrnamentParams {
    return JSON.parse(JSON.stringify({
      ctor: 'SmoOrnament',
      ornament: SmoOrnament.ornaments.mordent,
      position: SmoOrnament.positions.above,
      offset: SmoOrnament.offsets.on
    }));
  }
  serialize(): SmoOrnamentParamsSer {
    var params: Partial<SmoOrnamentParamsSer> = { ctor: 'SmoOrnament' };
    smoSerialize.serializedMergeNonDefault(SmoOrnament.defaults,
      SmoOrnament.parameterArray, this, params);
    if (!isSmoOrnamentParamsSer(params)) {
      throw 'bad ornament ' + JSON.stringify(params);
    }
    return params;
  }
  constructor(parameters: SmoOrnamentParams) {
    super('SmoOrnament');
    smoSerialize.serializedMerge(SmoOrnament.parameterArray, SmoOrnament.defaults, this);
    smoSerialize.serializedMerge(SmoOrnament.parameterArray, parameters, this);
    // this.selector = parameters.selector;
  }
}

/**
 * Constructor parameters for {@link SmoArticulation}
 * @category SmoParams
 */
export interface SmoArticulationParameters {
  /**
   * position, above or below
   */
  position?: string,
  /**
   * x offset
   */
  offset?: number,
  /**
   * articulation code
   */
  articulation: string
}
/**
 * 
 */
export interface SmoArticulationParametersSer extends SmoArticulationParameters {
  ctor: string;
}
function isSmoArticulationParametersSer(params: Partial<SmoArticulationParametersSer>): params is SmoArticulationParametersSer {
  if (typeof(params.ctor) !== 'string' || params.ctor !== 'SmoArticulation') {
    return false;
  }
  return true;
}
/**
 * Articulations map to notes, can be placed above/below
 * @category SmoModifier
 */
export class SmoArticulation extends SmoNoteModifierBase {
  static get articulations() {
    return {
      accent: 'accent',
      staccato: 'staccato',
      marcato: 'marcato',
      tenuto: 'tenuto',
      upStroke: 'upStroke',
      downStroke: 'downStroke',
      pizzicato: 'pizzicato',
      fermata: 'fermata'
    };
  }
  static readonly xmlArticulations: Record<string, string> = {
    accent: 'accent',
    staccato: 'staccato',
    tenuto: 'tenuto',
    marcato: 'strong-accent'
  }
  static get positions() {
    return {
      above: 'above',
      below: 'below'
    };
  }
  static get articulationToVex(): Record<string, string> {
    return {
      accent: 'a>',
      staccato: 'a.',
      marcato: 'a^',
      tenuto: 'a-',
      upStroke: 'a|',
      downStroke: 'am',
      pizzicato: 'ao',
      fermata: 'a@a'
    };
  }

  static get vexToArticulation(): Record<string, string> {
    return {
      'a>': 'accent',
      'a.': 'staccato',
      'a^': 'marcato',
      'a-': 'tenuto',
      'a|': 'upStroke',
      'am': 'downStroke',
      'ao': 'pizzicato',
      'a@a': 'fermata'
    };
  }
  static get parameterArray(): string[] {
    const rv: string[] = [];
    // eslint-disable-next-line
    for (const key in SmoArticulation.defaults) {
      rv.push(key);
    }
    return rv;
  }

  static get positionToVex(): Record<string, number> {
    return {
      'above': 3,
      'below': 4
    };
  }
  static get defaults(): SmoArticulationParameters {
    return JSON.parse(JSON.stringify({
      ctor: 'SmoArticulation',
      position: SmoArticulation.positions.above,
      articulation: SmoArticulation.articulations.accent
    }));
  }
  position: string = SmoOrnament.positions.above;
  offset: number = 0;
  articulation: string = SmoArticulation.articulations.accent;
  adjX: number = 0;

  serialize(): SmoArticulationParametersSer {
    var params: Partial<SmoArticulationParametersSer> = { ctor: 'SmoArticulation'};
    smoSerialize.serializedMergeNonDefault(SmoArticulation.defaults,
      SmoArticulation.parameterArray, this, params);
    if (!isSmoArticulationParametersSer(params)) {
      throw 'bad articulation ' + JSON.stringify(params);
    }
    return params;
  }
  constructor(parameters: SmoArticulationParameters) {
    super('SmoArticulation');
    smoSerialize.serializedMerge(SmoArticulation.parameterArray, SmoArticulation.defaults, this);
    smoSerialize.serializedMerge(SmoArticulation.parameterArray, parameters, this);
    // this.selector = parameters.selector;
  }
}

export interface VexAnnotationParams {
  glyph?: string,
  symbolModifier?: number,
  text?: string
}

/**
 * The persist-y parts of {@link SmoLyricParams}. We don't persist the selector
 * since that can change based on the position of the parent note
 * @category serialization
 */
export interface SmoLyricPersist extends SmoObjectParams {
  /**
   * constructor
   */
  ctor: string,
  /**
   * attributes for ID
   */
  attrs: SmoAttrs,
  /**
   * the lyric font
   */
  fontInfo: FontInfo,
  /**
   * classes for styling
   */
  classes: string,
  /**
   * which verse the lyric goes with
   */
  verse: number,
  /**
   * lyrics are used for chord changes or annotations, parser is different for each
   */
  parser: number,
  /**
   * indicates we should format for the width of the lyric
   */
  adjustNoteWidthLyric: boolean,
  /**
   * indicates we should format for the width of the chord
   */
  adjustNoteWidthChord: boolean,
  /**
   * fill color for text
   */
  fill: string,
  /**
   * translate to align lyrics.  Possibly this should not be serialized
   */
  translateX: number,
  /**
   * translate to align lyrics.  Possibly this should not be serialized
   */
  translateY: number,
  /**
   * the actual text
   */
  text: string | null
}

function isSmoLyricPersist(params: Partial<SmoLyricPersist>): params is SmoLyricPersist {
  if (typeof(params.ctor) !== 'string' || params.ctor !== 'SmoLyric') {
    return false;
  }
  return true;
}
/**
 * Used to construct a {@link SmoLyric} for both chords and lyrics
 * @category SmoParameters
 */
export interface SmoLyricParams {
  /**
   * the lyric font
   */
  fontInfo: FontInfo,
  /**
   * classes for styling
   */
  classes: string,
  /**
   * which verse the lyric goes with
   */
  verse: number,
  /**
   * lyrics are used for chord changes or annotations, parser is different for each
   */
  parser: number,
  /**
   * indicates we should format for the width of the lyric
   */
  adjustNoteWidthLyric: boolean,
  /**
   * indicates we should format for the width of the chord
   */
  adjustNoteWidthChord: boolean,
  /**
   * fill color for text
   */
  fill: string,
  /**
   * translate to align lyrics.  Possibly this should not be serialized
   */
  translateX: number,
  /**
   * translate to align lyrics.  Possibly this should not be serialized
   */
  translateY: number,
  /**
   * the actual text
   */
  text: string | null
}

/**
 * SmoLyric covers both chords and lyrics.  The parser tells you which
 * one you get.
 * @category SmoModifier
 */
export class SmoLyric extends SmoNoteModifierBase {
  static readonly parsers: Record<string, number> = {
    lyric: 0, anaylysis: 1, chord: 2
  }
  static get defaults(): SmoLyricParams {
    return JSON.parse(JSON.stringify({
      ctor: 'SmoLyric',
      text: '\xa0',
      endChar: '',
      verse: 0,
      fontInfo: {
        size: 12,
        family: 'times',
        style: 'normal',
        weight: 'normal'
      },
      fill: 'black',
      classes: 'score-text',
      translateX: 0,
      translateY: 0,
      adjustNoteWidthLyric: true,
      adjustNoteWidthChord: false,
      parser: SmoLyric.parsers.lyric
    }));
  }
  static get symbolPosition() {
    return {
      SUPERSCRIPT: 1,
      SUBSCRIPT: 2,
      NORMAL: 3
    };
  }

  static toVexPosition(chordPos: number) {
    if (chordPos === SmoLyric.symbolPosition.NORMAL) {
      return VF.ChordSymbol.symbolModifiers.NONE;
    } else if (chordPos === SmoLyric.symbolPosition.SUPERSCRIPT) {
      return VF.ChordSymbol.symbolModifiers.SUPERSCRIPT;
    }
    return VF.ChordSymbol.symbolModifiers.SUBSCRIPT;
  }

  static get persistArray(): string[] {
    const rv: string[] = [];
    // eslint-disable-next-line
    for (const key in SmoLyric.defaults) {
      rv.push(key);
    }
    return rv;
  }
  static get parameterArray(): string[] {
    const rv = SmoLyric.persistArray;
    rv.push('selector', 'text');
    return rv;
  }

  ctor: string = 'SmoLyric';
  text: string = '';
  fontInfo: FontInfo = {
    size: 12,
    family: 'Merriweather',
    style: 'normal',
    weight: 'normal'
  };
  parser: number = SmoLyric.parsers.lyric;
  selector: string | null = null; // used by UI
  adjustNoteWidthLyric: boolean = true;
  adjustNoteWidthChord: boolean = false;
  verse: number = 0;
  skipRender: boolean = false;
  fill: string = '';
  translateX: number = 0;
  translateY: number = 0;
  classes: string = '';
  adjX: number = 0;
  adjY: number = 0;
  hyphenX: number = 0;
  deleted: boolean = false;

  serialize(): SmoLyricPersist {
    var params: Partial<SmoLyricPersist> = { ctor: 'SmoLyric' };
    smoSerialize.serializedMergeNonDefault(SmoLyric.defaults,
      SmoLyric.persistArray, this, params);
    if (!isSmoLyricPersist(params)) {
      throw 'bad lyric ' + JSON.stringify('params');
    }
    return params;
  }

  // For lyrics, we default to adjust note width on lyric size.  For chords, this is almost never what
  // you want, so it is off by default.
  get adjustNoteWidth() {
    return (this.parser === SmoLyric.parsers.lyric) ? this.adjustNoteWidthLyric : this.adjustNoteWidthChord;
  }
  set adjustNoteWidth(val) {
    if (this.parser === SmoLyric.parsers.lyric) {
      this.adjustNoteWidthLyric = val;
    } else {
      this.adjustNoteWidthChord = val;
    }
  }

  // ### getClassSelector
  // returns a selector used to find this text block within a note.
  getClassSelector(): string {
    var parser = (this.parser === SmoLyric.parsers.lyric ? 'lyric' : 'chord');
    return 'g.' + parser + '-' + this.verse;
  }

  setText(text: string) {
    // For chords, trim all whitespace
    if (this.parser !== SmoLyric.parsers.lyric) {
      if (text.trim().length) {
        text.replace(/\s/g, '');
      }
    }
    this.text = text;
  }

  isHyphenated() {
    const text = this.text.trim();
    return this.parser === SmoLyric.parsers.lyric &&
      text.length &&
      text[text.length - 1] === '-';
  }

  getText() {
    const text = this.text.trim();
    if (this.isHyphenated()) {
      return smoSerialize.tryParseUnicode(text.substr(0, text.length - 1)).trim();
    }
    return smoSerialize.tryParseUnicode(text);
  }

  isDash() {
    return this.getText().length === 0 && this.isHyphenated();
  }

  static _chordGlyphFromCode(code: string) {
    return getChordSymbolGlyphFromCode(code);
  }
  static _tokenizeChordString(str: string) {
    // var str = this._text;
    const reg = /^([A-Z|a-z|0-9|]+)/g;
    let mmm = str.match(reg);
    let tokeType = '';
    let toke = '';
    const tokens = [];
    while (str.length) {
      if (!mmm) {
        tokeType = str[0];
        tokens.push(tokeType);
        str = str.slice(1, str.length);
      } else {
        toke = mmm[0].substr(0, mmm[0].length);
        str = str.slice(toke.length, str.length);
        tokens.push(toke);
        tokeType = '';
        toke = '';
      }
      mmm = str.match(reg);
    }
    return tokens;
  }

  getVexChordBlocks() {
    let mod = VF.ChordSymbol.symbolModifiers.NONE;
    let isGlyph = false;
    const tokens = SmoLyric._tokenizeChordString(this.text);
    const blocks: VexAnnotationParams[] = [];
    tokens.forEach((token) => {
      if (token === '^') {
        mod = (mod === VF.ChordSymbol.symbolModifiers.SUPERSCRIPT) ?
          VF.ChordSymbol.symbolModifiers.NONE : VF.ChordSymbol.symbolModifiers.SUPERSCRIPT;
      } else if (token === '%') {
        mod = (mod === VF.ChordSymbol.symbolModifiers.SUBSCRIPT) ?
          VF.ChordSymbol.symbolModifiers.NONE : VF.ChordSymbol.symbolModifiers.SUBSCRIPT;
      } else if (token === '@') {
        isGlyph = !isGlyph;
      } else if (token.length) {
        if (isGlyph) {
          const glyph = SmoLyric._chordGlyphFromCode(token);
          blocks.push({
            glyph, symbolModifier: mod
          });
        } else {
          blocks.push({
            text: token, symbolModifier: mod
          });
        }
      }
    });
    return blocks;
  }

  constructor(parameters: SmoLyricParams) {
    super('SmoLyric');
    smoSerialize.serializedMerge(SmoLyric.parameterArray, SmoLyric.defaults, this);
    smoSerialize.serializedMerge(SmoLyric.parameterArray, parameters, this);
    // backwards-compatibility for lyric text
    if (parameters.text) {
      this.text = parameters.text;
    }

    // calculated adjustments for alignment purposes
    this.adjY = 0;
    this.adjX = 0;
    // this.verse = parseInt(this.verse, 10);

    if (!this.attrs) {
      this.attrs = {
        id: getId().toString(),
        type: 'SmoLyric'
      };
    }
  }
}

/**
 * The persisted bits of {@link SmoDynamicTextParams}
 * @category SmoParams
 */
export interface SmoDynamicTextPersist extends SmoObjectParams {
  ctor: string,
  xOffset: number,
  fontSize: number,
  yOffsetLine: number,
  yOffsetPixels: number,
  text: string
}
/**
 * Constructor parameters for {@link SmoDynamicText}
 * @category SmoParams
 */
export interface SmoDynamicTextParams extends SmoDynamicTextPersist {
  ctor: string,
  xOffset: number,
  fontSize: number,
  yOffsetLine: number,
  yOffsetPixels: number,
  text: string,
  selector: SmoSelector
}

/**
 * Dynamic text tells you how loud not to play.
 * @category SmoModifier
 */
export class SmoDynamicText extends SmoNoteModifierBase {
  static get dynamics(): Record<string, string> {
    // matches VF.modifier
    return {
      PP: 'pp',
      P: 'p',
      MP: 'mp',
      MF: 'mf',
      F: 'f',
      FF: 'ff',
      SFZ: 'sfz'
    };
  }
  static get defaults(): SmoDynamicTextParams {
    return JSON.parse(JSON.stringify({
      ctor: 'SmoDynamicText',
      xOffset: 0,
      fontSize: defaultNoteScale,
      yOffsetLine: 11,
      yOffsetPixels: 0,
      text: SmoDynamicText.dynamics.MP,
    }));
  }
  static get persistArray(): string[] {
    const rv: string[] = [];
    // eslint-disable-next-line
    for (const key in SmoDynamicText.defaults) {
      rv.push(key);
    }
    return rv;
  }
  static get parameterArray(): string[] {
    const rv = SmoDynamicText.persistArray;
    rv.push('selector');
    return rv;
  }
  selector: SmoSelector;
  text: string = '';
  yOffsetLine: number = 11;
  yOffsetPixels: number = 0;
  xOffset: number = 0;
  fontSize: number = defaultNoteScale;
  serialize(): object {
    var params = {};
    smoSerialize.serializedMergeNonDefault(SmoDynamicText.defaults,
      SmoDynamicText.persistArray, this, params);
    return params;
  }
  constructor(parameters: SmoDynamicTextParams) {
    super('SmoDynamicText');
    smoSerialize.vexMerge(this, SmoDynamicText.defaults);
    smoSerialize.filteredMerge(SmoDynamicText.parameterArray, parameters, this);
    this.selector = parameters.selector;

    if (!this.attrs) {
      this.attrs = {
        id: getId().toString(),
        type: 'SmoDynamicText'
      };
    }
  }
}
