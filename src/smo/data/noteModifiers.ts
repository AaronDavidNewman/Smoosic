// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoAttrs, Ticks, Pitch, FontInfo, SmoObjectParams, Transposable } from './common';
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoSelector } from '../xform/selections';
import { smoMusic } from '../../common/musicHelpers';

const VF = eval('Vex.Flow');
// const Smo = eval('globalThis.Smo');

// ## SmoNoteModifierBase
// A note modifier is anything that is mapped to the note, but not part of the
// pitch itself.  This includes grace notes, and note-text like lyrics
export abstract class SmoNoteModifierBase {
  attrs: SmoAttrs;
  ctor: string;
  constructor(ctor: string) {
    this.attrs = {
      id: VF.Element.newID(),
      type: ctor
    };
    this.ctor = ctor;
  }
  static deserialize(jsonObj: SmoObjectParams) {
    const ctor = eval('globalThis.Smo.' + jsonObj.ctor);
    if (typeof(ctor) === 'undefined') {
      console.log('ouch bad ctor for ' + jsonObj.ctor);
    }
    const rv = new ctor(jsonObj);
    return rv;
  }
  abstract serialize(): object;
}

export interface GraceNoteParams extends SmoObjectParams {
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

export class SmoGraceNote extends SmoNoteModifierBase implements Transposable {
  static get flagStates() {
    return { auto: 0, up: 1, down: 2 };
  }
  static readonly defaults: GraceNoteParams = {
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
    }
    ],
  }
  // TODO: Matches SmoNote - move to smoMusic?
  static get parameterArray() {
    const rv: string[] = [];
    // eslint-disable-next-line
    for(const key in SmoGraceNote.defaults) {
      rv.push(key);
    }
    return rv;
  }
  ticks: Ticks = SmoGraceNote.defaults.ticks;
  pitches: Pitch[] = [];
  slash: boolean = false;
  clef: string = 'treble';
  noteType: string = 'n';

  tickCount() {
    return this.ticks.numerator / this.ticks.denominator + this.ticks.remainder;
  }

  toVexGraceNote() {
    const p = smoMusic.smoPitchesToVex(this.pitches);
    const rv = { duration: smoMusic.closestVexDuration(this.tickCount()), keys: p, slash: this.slash };
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

export interface SmoMicrotoneParams extends SmoObjectParams {
  tone: string,
  pitch: Pitch
}
// ## SmoMicrotone
// Microtones are treated similarly to ornaments at this time.  There are not
// rules for persisting throughout a measure.
export class SmoMicrotone extends SmoNoteModifierBase {
  tone: number = SmoMicrotone.pitchCoeff.flat125ar;
  pitch: Pitch = { letter: 'c', octave: 4, accidental: 'n' };

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
    pitch: { letter: 'c', octave: 4, accidental: 'n' }
  }
  static get parameterArray() {
    const rv: string[] = [];
    // eslint-disable-next-line
    for(const key in SmoMicrotone.defaults) {
      rv.push(key);
    }
    return rv;
  }
  serialize():object {
    var params = {};
    smoSerialize.serializedMergeNonDefault(SmoMicrotone.defaults,
      SmoMicrotone.parameterArray, this, params);
    return params;
  }
  constructor(parameters: SmoMicrotoneParams) {
    super(parameters.ctor);
    smoSerialize.serializedMerge(SmoMicrotone.parameterArray, SmoMicrotone.defaults, this);
    smoSerialize.serializedMerge(SmoMicrotone.parameterArray, parameters, this);
  }
}

export interface SmoOrnamentParams extends SmoObjectParams {
  ctor: string,
  position?: string,
  offset?: string,
  ornament: string,
}
// ## SmoOrnament
// Maps to a vexflow ornament like trill etc.
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
  offset: number = 0;
  ornament: string = SmoOrnament.ornaments.mordent;

  static get parameterArray() {
    const rv: string[] = [];
    // eslint-disable-next-line
    for(const key in SmoOrnament.defaults) {
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
  static readonly defaults: SmoOrnamentParams = {
    ctor: 'SmoOrnament',
    ornament: SmoOrnament.ornaments.mordent,
    position: SmoOrnament.positions.above,
    offset: SmoOrnament.offsets.on
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

export interface SmoArticulationParameters extends SmoObjectParams {
  ctor: string,
  position?: string,
  offset?: number,
  articulation: string,
  selector?: SmoSelector
}
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
  static get articulationToVex() {
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

  static get vexToArticulation() {
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
    for(const key in SmoArticulation.defaults) {
      rv.push(key);
    }
    return rv;
  }

  static get positionToVex() {
    return {
      'above': 3,
      'below': 4
    };
  }
  static readonly defaults: SmoArticulationParameters = {
    ctor: 'SmoArticulation',
    position: SmoArticulation.positions.above,
    articulation: SmoArticulation.articulations.accent
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

// ## SmoLyric
// Lyrics and Chords are both notated represented by
// instances of this class.  The parser enum says
// which is which
export class SmoLyric extends SmoNoteModifierBase {
  static readonly parsers: Record<string, number> = {
    lyric: 0, anaylysis: 1, chord: 2
  }
  static readonly defaults: SmoLyricPersist = {
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
    for(const key in SmoLyric.defaults) {
      rv.push(key);
    }
    return rv;
  }
  static get parameterArray(): string[] {
    const rv = SmoLyric.persistArray;
    rv.push('selector', 'text');
    return rv;
  }

  ctor: string ='SmoLyric';
  _text: string = '';
  endChar: string = '';
  fontInfo: FontInfo = {
    size: 12,
    family: 'Merriweather',
    style: 'normal',
    weight: 'normal'
  };
  parser: number = SmoLyric.parsers.lyric;
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
  adjX: 0;
  adjY: 0;

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

export interface SmoDynamicTextPersist extends SmoObjectParams {
  ctor: string,
  xOffset: number,
  fontSize: number,
  yOffsetLine: number,
  yOffsetPixels: number,
  text: string
}
export interface SmoDynamicTextParams extends SmoDynamicTextPersist {
  ctor: string,
  xOffset: number,
  fontSize: number,
  yOffsetLine: number,
  yOffsetPixels: number,
  text: string,
  selector: SmoSelector
}

// ## SmoDynamicText
// ## Description:
// standard dynamics text
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
  static readonly defaults : SmoDynamicTextPersist = {
    ctor: 'SmoDynamicText',
    xOffset: 0,
    fontSize: 38,
    yOffsetLine: 11,
    yOffsetPixels: 0,
    text: SmoDynamicText.dynamics.MP,
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
