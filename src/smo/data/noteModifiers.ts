// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * A note modifier is anything that is mapped to the note, but not part of the
 * pitch itself.  This includes grace notes, and note-text like lyrics.
 * @module /smo/data/noteModifiers
 */
import { SmoAttrs, Ticks, Pitch, FontInfo, SmoObjectParams, Transposable, SvgBox, SmoModifierBase } from './common';
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoSelector } from '../xform/selections';
import { SmoMusic } from './music';

const VF = eval('Vex.Flow');
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
  renderedBox: SvgBox | null = null;
  logicalBox: SvgBox | null = null;
  constructor(ctor: string) {
    this.attrs = {
      id: VF.Element.newID(),
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
 * @param ctor - constructor 'GraceNote'
 * @param flagState - up, down, or auto
 * @param noteType - note, rest, slash
 * @param beamBeats - indicates how many beats form a
 *   beam group.
 */
export interface GraceNoteParams extends SmoModifierBase {
  ctor: string,
  flagState: number,
  noteType: string,
  beamBeats: number,
  endBeam: boolean,
  clef: string,
  slash: boolean,
  ticks: Ticks,
  pitches: Pitch[],
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
      ctor: 'SmoGraceNote',
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

  serialize() {
    const params = {};
    smoSerialize.serializedMergeNonDefault(SmoGraceNote.defaults,
      SmoGraceNote.parameterArray, this, params);
    return params;
  }

  constructor(parameters: Partial<GraceNoteParams>) {
    super('SmoGraceNote');
    smoSerialize.serializedMerge(SmoGraceNote.parameterArray, SmoGraceNote.defaults, this);
    smoSerialize.serializedMerge(SmoGraceNote.parameterArray, parameters, this);
  }
}
/**
 * Constructor parameters for {@link SmoMicrotone}
 * @category SmoParams
 */
export interface SmoMicrotoneParams extends SmoObjectParams {
  tone: string,
  pitch: number
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
  serialize(): object {
    var params = {};
    smoSerialize.serializedMergeNonDefault(SmoMicrotone.defaults,
      SmoMicrotone.parameterArray, this, params);
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
  position?: string,
  offset?: string,
  ornament: string,
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
    upprail: 'upprail',
    prailup: 'prailup',
    praildown: 'praildown',
    upmordent: 'upmordent',
    downmordent: 'downmordent',
    lineprail: 'linepraile',
    prailprail: 'prailprail',
    scoop: 'scoop',
    fall_short: 'fall',
    dropLong: 'fallLong',
    doit: 'doit',
    doitLong: 'doitLong',
    flip: 'flip',
    smear: 'smear'
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
  serialize(): object {
    var params = {};
    smoSerialize.serializedMergeNonDefault(SmoOrnament.defaults,
      SmoOrnament.parameterArray, this, params);
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
  position?: string,
  offset?: number,
  articulation: string,
  selector?: SmoSelector
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

  serialize(): object {
    var params = {};
    smoSerialize.serializedMergeNonDefault(SmoArticulation.defaults,
      SmoArticulation.parameterArray, this, params);
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
  symbolModifier?: string,
  symbolType: number,
  text?: string
}

/**
 * The persist-y parts of {@link SmoLyricParams}. We don't persist the selector
 * since that can change based on the position of the parent note
 */
export interface SmoLyricPersist extends SmoObjectParams {
  ctor: string,
  endChar: string,
  fontInfo: FontInfo,
  classes: string,
  verse: number,
  parser: number,
  adjustNoteWidthLyric: boolean,
  adjustNoteWidthChord: boolean,
  fill: string,
  scaleX: number,
  scaleY: number,
  translateX: number,
  translateY: number,
  _text: string | null
}

/**
 * Used to construct a {@link SmoLyric} for both chords and lyrics
 */
export interface SmoLyricParams extends SmoLyricPersist {
  ctor: string,
  endChar: string,
  fontInfo: FontInfo,
  classes: string,
  verse: number,
  parser: number,
  adjustNoteWidthLyric: boolean,
  adjustNoteWidthChord: boolean,
  fill: string,
  scaleX: number,
  scaleY: number,
  translateX: number,
  translateY: number,
  text: string,
  _text: string | null,
  selector?: SmoSelector
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
      _text: '\xa0',
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
      scaleX: 1.0,
      scaleY: 1.0,
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
  _text: string = '';
  endChar: string = '';
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
  scaleX: number = 1.0;
  scaleY: number = 1.0;
  translateX: number = 0;
  translateY: number = 0;
  classes: string = '';
  adjX: number = 0;
  adjY: number = 0;
  hyphenX: number = 0;
  deleted: boolean = false;

  serialize(): object {
    var params = {};
    smoSerialize.serializedMergeNonDefault(SmoLyric.defaults,
      SmoLyric.persistArray, this, params);
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
    this._text = text;
  }

  isHyphenated() {
    const text = this._text.trim();
    return this.parser === SmoLyric.parsers.lyric &&
      text.length &&
      text[text.length - 1] === '-';
  }

  getText() {
    const text = this._text.trim();
    if (this.isHyphenated()) {
      return smoSerialize.tryParseUnicode(text.substr(0, text.length - 1)).trim();
    }
    return smoSerialize.tryParseUnicode(text);
  }

  isDash() {
    return this.getText().length === 0 && this.isHyphenated();
  }

  static _chordGlyphFromCode(code: string) {
    const obj = Object.keys(VF.ChordSymbol.glyphs).find((glyph) => VF.ChordSymbol.glyphs[glyph].code === code);
    return obj;
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
    const tokens = SmoLyric._tokenizeChordString(this._text);
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
            glyph, symbolModifier: mod,
            symbolType: VF.ChordSymbol.symbolTypes.GLYPH
          });
        } else {
          blocks.push({
            text: token, symbolModifier: mod,
            symbolType: VF.ChordSymbol.symbolTypes.TEXT
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
      this._text = parameters.text;
    }

    // Return these for the text editor that expects them.
    // this.translateX = this.translateY = 0;
    this.scaleX = this.scaleY = 1.0;

    // calculated adjustments for alignment purposes
    this.adjY = 0;
    this.adjX = 0;
    // this.verse = parseInt(this.verse, 10);

    if (!this.attrs) {
      this.attrs = {
        id: VF.Element.newID(),
        type: parameters.ctor
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
      fontSize: 38,
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
  fontSize: number = 38;
  serialize(): object {
    var params = {};
    smoSerialize.serializedMergeNonDefault(SmoDynamicText.defaults,
      SmoDynamicText.persistArray, this, params);
    return params;
  }
  constructor(parameters: SmoDynamicTextParams) {
    super('SmoDynamicText');
    Vex.Merge(this, SmoDynamicText.defaults);
    smoSerialize.filteredMerge(SmoDynamicText.parameterArray, parameters, this);
    this.selector = parameters.selector;

    if (!this.attrs) {
      this.attrs = {
        id: VF.Element.newID(),
        type: 'SmoDynamicText'
      };
    }
  }
}
