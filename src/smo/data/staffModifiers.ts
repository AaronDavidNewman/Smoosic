// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Classes to modify a staff or system.  Some staff modifiers can span multiple
 * staves, so it can be a little arbitrary what is a score vs. staff modifier.  But
 * generally, a staff modifier is anything that has a beginning and end {@link SmoSelector}
 * @module /smo/data/staffModifiers
 */
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoSelector } from '../xform/selections';
import { SmoNote } from './note';
import { SmoAttrs, SvgPoint, SmoObjectParams, Clef, SvgBox, SmoModifierBase } from './common';
import { Vex } from 'vexflow_smoosic';
const VF = Vex.Flow;

/**
 * Base class that mostly standardizes the interface and deals with serialization.
 * @param ctor constructor for derived class
 * @param logicalBox bounding box in SVG coordinates, if rendered
 * @param attrs object identification
 * @param startSelector where the modifier starts
 * @param endSelector where it ends
 * @category SmoModifier
 * */
export abstract class StaffModifierBase implements SmoModifierBase {
  attrs: SmoAttrs;
  ctor: string;
  associatedStaff: number = 0;
  startSelector: SmoSelector = SmoSelector.default;
  endSelector: SmoSelector = SmoSelector.default;
  logicalBox: SvgBox | null = null;
  element: SVGSVGElement | null = null;
  constructor(ctor: string) {
    this.ctor = ctor;
    this.attrs = {
      id: (VF.Element as any).newID(),
      type: ctor
    };
  }
  static deserialize(params: SmoObjectParams) {
    const ctor = eval('globalThis.Smo.' + params.ctor);
    const fixInstrument = params as any;
    if (fixInstrument.subFamily) {
      fixInstrument.instrument = fixInstrument.subFamily;
    }
    const rv = new ctor(params);
    return rv;
  }
  abstract serialize(): any;
}

export type SoundSustain = 'percussive' | 'sustained';
export type oscillatorType = 'sample' | 'sine' | 'sawtooth' | 'square' | 'triangle' | 'custom';
export type oscillatorOptions = 'plucked' | 'bowed' | 'muted' | 'accented' | 'frequency-sweep' | 'na';
/**
 * Parameters of an instrument used to create audio nodes
 */
export interface SmoOscillatorInfo {
  waveform: oscillatorType,
  sustain: SoundSustain,
  realOvertones: number[],
  imaginaryOvertones: number[],
  sample: string | null,
  family: string,
  instrument: string,
  nativeFrequency: number,
  dynamic: number,
  options: oscillatorOptions[],
  minDuration: number,
  maxDuration: number
}
export type SmoOscillatorInfoNumberType = 'minDuration' | 'maxDuration' | 'dynamic' | 'nativeFrequency';
export type SmoOscillatorInfoNumberArType = 'realOvertones' | 'imaginaryOvertones';
export type SmoOscillatorInfoStringType = 'family';
export type SmoOscillatorInfoStringNullType = 'sample';
export type SmoOscillatorInfoWaveformType = 'waveform';
export type SmoOscillatorInfoSustainType = 'sustain';
export type SmoOscillatorInfoOptionsType = 'options';
export const SmoOscillatorInfoAllTypes = ['minDuration','maxDuration', 'dynamic', 'nativeFrequency', 'realOvertones', 'imaginaryOvertones', 'sample', 'family',
  'waveform', 'sustain', 'options', 'instrument'];

export type SmoOscillatorAnyType =  SmoOscillatorInfoNumberType | SmoOscillatorInfoNumberArType | SmoOscillatorInfoStringType | SmoOscillatorInfoStringNullType
  | oscillatorType | SoundSustain;
  
/**
 * Define an instrument.  An instrument is associated with a part, but a part can have instrument changes
 * and thus contain multiple instruments at different points in the score.
 * Not all of these parameters are fully utilized yet, and there are plans to greatly expand what
 * an SmoInstrument is.  Note I may move this to PartInfo module.
 * @category SmoParameters
 */
export interface SmoInstrumentParams {
  startSelector: SmoSelector,
  endSelector: SmoSelector,
  instrumentName: string,
  family: string,
  instrument: string,
  abbreviation: string,
  keyOffset: number,
  midiInstrument: number,
  midichannel: number,
  midiport: number,
  clef: Clef,
  mutes?: string,  
}

export type SmoInstrumentNumParamType = 'keyOffset' | 'midichannel' | 'midiport' | 'midiInstrument';
export const SmoInstrumentNumParams: SmoInstrumentNumParamType[] = ['keyOffset', 'midichannel', 'midiport', 'midiInstrument'];
export type SmoInstrumentStringParamType = 'instrumentName' | 'abbreviation' | 'family' | 'instrument';
export const SmoInstrumentStringParams: SmoInstrumentStringParamType[] = ['instrumentName', 'abbreviation', 'family', 'instrument'];
/**
 * Define an instrument.  An instrument is associated with a part, but a part can have instrument changes
 * and thus contain multiple instruments at different points in the score.
 * Not all of these parameters are fully utilized yet, and there are plans to greatly expand what
 * an SmoInstrument is.  Note I may move this to PartInfo module.
 * @category SmoModifier
 */
export class SmoInstrument extends StaffModifierBase {
  static get attributes() {
    return ['startSelector', 'endSelector', 'keyOffset', 'midichannel', 'midiport', 'instrumentName', 'abbreviation', 'instrument', 'family'];
  }
  startSelector: SmoSelector;
  endSelector: SmoSelector;
  instrumentName: string = '';
  abbreviation: string = '';
  keyOffset: number = 0;
  clef: Clef = 'treble';
  midiInstrument: number = 1;
  midichannel: number;
  midiport: number;
  family: string;
  instrument: string;
  articulation?: string;
  mutes?: string;
  static get defaults(): SmoInstrumentParams {
    return JSON.parse(JSON.stringify({
      clef: 'treble',
      keyOffset: 0,
      instrumentName: '',
      abbreviation: '',
      family: 'keyboard',
      instrument: 'piano',
      midichannel: 0,
      midiInstrument: 1,
      midiport: 0,
      startSelector: SmoSelector.default,
      endSelector: SmoSelector.default
    }));
  }
  static get defaultOscillatorParam(): SmoOscillatorInfo {
    return JSON.parse(JSON.stringify({
      waveform: 'sample',
      sustain: 'percussive',
      realOvertones: [],
      imaginaryOvertones: [],
      sample: null,
      family: 'none',
      instrument: 'none',
      nativeFrequency: 440,
      dynamic: 100,
      options: [],
      minDuration: 0,
      maxDuration: 0
    }));
  }
  constructor(params: SmoInstrumentParams) {
    super('SmoInstrument');
    let name = '';
    if (typeof ((params as any).instrument) === 'undefined') {
      name = params.instrumentName;
    } else {
      name = (params as any).instrument;
    }
    this.instrumentName = name;
    this.family = params.family;
    this.instrument = params.instrument;
    this.keyOffset = params.keyOffset;
    this.clef = params.clef;
    this.midiport = params.midiport;
    this.midichannel = params.midichannel;
    this.startSelector = params.startSelector;
    this.endSelector = params.endSelector;
  }
  serialize() {
    const params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoInstrument.defaults, SmoInstrument.attributes, this, params);
    params.ctor = 'SmoInstrument';
    return params;
  }
  eq(other: SmoInstrument): boolean {
    let rv = true;
    SmoInstrumentNumParams.forEach((param) => {
      if (other[param] !== this[param]) {
        rv = false;
      }
    });
    SmoInstrumentStringParams.forEach((param) => {
      if (other[param] !== this[param]) {
        rv = false;
      }
    });
    return rv;
  }
}

export interface SmoInstrumentMeasure {
  measureIndex: number,
  instrument: SmoInstrumentParams;
}
/**
 * constructor params for {@link SmoStaffHairpin}
 * @category SmoParameters
 */
export interface SmoStaffHairpinParams {
  xOffsetLeft: number,
  xOffsetRight: number,
  yOffset: number,
  height: number,
  position: number,
  hairpinType: number,
  startSelector: SmoSelector,
  endSelector: SmoSelector
}

/**
 * Also called crescendo etc.
 * @category SmoModifier
 */
export class SmoStaffHairpin extends StaffModifierBase {
  static get editableAttributes() {
    return ['xOffsetLeft', 'xOffsetRight', 'yOffset', 'height'];
  }
  static get defaults(): SmoStaffHairpinParams {
    return JSON.parse(JSON.stringify({
      xOffsetLeft: -2,
      xOffsetRight: 0,
      yOffset: -50,
      height: 10,
      position: SmoStaffHairpin.positions.BELOW,
      hairpinType: SmoStaffHairpin.types.CRESCENDO,
      startSelector: SmoSelector.default,
      endSelector: SmoSelector.default
    }));
  }
  static get positions() {
    // matches VF.modifier
    return {
      LEFT: 1,
      RIGHT: 2,
      ABOVE: 3,
      BELOW: 4,
    };
  }
  static get types() {
    return {
      CRESCENDO: 1,
      DECRESCENDO: 2
    };
  }
  static get attributes() {
    return ['position', 'startSelector', 'endSelector', 'xOffsetLeft',
      'xOffsetRight', 'yOffset', 'hairpinType', 'height'];
  }
  xOffsetLeft: number = -2;
  xOffsetRight: number = 0;
  yOffset: number = -50;
  height: number = 10;
  position: number = SmoStaffHairpin.positions.BELOW;
  hairpinType: number = SmoStaffHairpin.types.CRESCENDO;
  startSelector: SmoSelector = SmoSelector.default;
  endSelector: SmoSelector = SmoSelector.default;
  serialize() {
    const params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoStaffHairpin.defaults, SmoStaffHairpin.attributes, this, params);
    params.ctor = 'SmoStaffHairpin';
    return params;
  }
  constructor(params: SmoStaffHairpinParams) {
    super('SmoStaffHairpin');
    smoSerialize.vexMerge(this, SmoStaffHairpin.defaults);
    smoSerialize.filteredMerge(SmoStaffHairpin.attributes, params, this);
    // If start/end selector on same note, make sure the hairpin extends
    if (SmoSelector.eq(this.startSelector, this.endSelector)) {
      if (this.xOffsetRight === SmoStaffHairpin.defaults.xOffsetRight
        && this.xOffsetLeft === SmoStaffHairpin.defaults.xOffsetLeft) {
        this.xOffsetLeft = -10;
        this.xOffsetRight = 10;
      }
    }

    if (!this.attrs) {
      this.attrs = {
        id: (VF.Element as any).newID(),
        type: 'SmoStaffHairpin'
      };
    }
  }
}

/**
 * constructor params for {@link SmoStaffHairpin}
 * @category SmoParameters
 */
export interface SmoStaffTextBracketParams {
  line: number,
  position: number,
  text: string,
  superscript: string,
  startSelector: SmoSelector,
  endSelector: SmoSelector
}

export type SmoTextBracketStringType = 'text' | 'superscript';
export const SmoTextBracketStringTypes: SmoTextBracketStringType[] = ['text', 'superscript'];
export type SmoTextBracketNumberType = 'line' | 'position';
export const SmoTextBracketNumberTypes: SmoTextBracketNumberType[] = ['line', 'position'];
/**
 * Text like 8va, rit. that is bracketed on a system
 * @category SmoModifier
 */
export class SmoStaffTextBracket extends StaffModifierBase {
  static RITARD = 'ritard';
  static ACCEL = 'accelerando';
  static CRESCENDO = 'crescendo';
  static DIMENUENDO = 'diminuendo';
  static OCTAVEUP = '8va';
  static OCTAVEDOWN = '8vb';
  static OCTAVEUP2 = '15va';
  static OCTAVE2DOWN = '15vb';
  static get defaults(): SmoStaffTextBracketParams {
    return JSON.parse(JSON.stringify({
      line: 1,
      position: SmoStaffTextBracket.positions.BOTTOM,
      text: '',
      superscript: '',
      startSelector: SmoSelector.default,
      endSelector: SmoSelector.default
    }));
  }
  static get positions() {
    // matches VF.modifier
    return {
      TOP: 1,
      BOTTOM: -1
    };
  }  
  static get attributes() {
    return ['startSelector', 'endSelector', 'line', 'position', 'text', 'superscript'];
  }
  position: number = SmoStaffTextBracket.positions.BOTTOM;
  text: string = '';
  superscript: string = '';
  line: number = 1;
  startSelector: SmoSelector = SmoSelector.default;
  endSelector: SmoSelector = SmoSelector.default;
  serialize() {
    const params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoStaffTextBracket.defaults, SmoStaffTextBracket.attributes, this, params);
    params.ctor = 'SmoStaffTextBracket';
    return params;
  }
  constructor(params: SmoStaffTextBracketParams) {
    super('SmoStaffTextBracket');
    smoSerialize.serializedMerge(SmoStaffTextBracket.attributes, SmoStaffTextBracket.defaults, this);
    smoSerialize.serializedMerge(SmoStaffTextBracket.attributes, params, this);
    this.startSelector = JSON.parse(JSON.stringify(params.startSelector));
    this.endSelector = JSON.parse(JSON.stringify(params.endSelector));
    if (!this.attrs) {
      this.attrs = {
        id: (VF.Element as any).newID(),
        type: 'SmoStaffTextBracket'
      };
    }
  }
}

export interface SlurDefaultParams {
  stemDir1: number,
  stemDir2: number,
  line1: number,
  line2: number,
  lineMin: number,
  lineMax: number,
  position: number,
  orientation: number,
  sameBeam: number
}
export type SlurNumberParam = 'spacing' | 'thickness' | 'xOffset' | 'yOffset' | 'position' |
  'position_end' | 'cp1x' | 'cp1y' | 'cp2x' | 'cp2y';
export const SlurNumberParams: SlurNumberParam[] = ['spacing', 'thickness', 'xOffset', 'yOffset', 'position', 
  'position_end', 'cp1x', 'cp1y', 'cp2x', 'cp2y'];
/**
 * parameters for a slur
 * @param spacing between note and curve
 * @param thickness thickness of the line
 * @param xOffset in pixels
 * @param yOffset in pixels
 * @param position top or bottom of the chord we are attached to
 * @param position_end top or bottom of the chord we are attached to
 * @param invert turns that frown upside down
 * @param cp1x bz control point
 * @param cp1y bz control point
 * @param cp2x bz control point
 * @param cp2y bz control point
 * @param startSelector the start note we are attached to
 * @param endSelector the end note we are attached to
 * @category SmoParameters
 */
export interface SmoSlurParams {
  spacing: number,
  thickness: number,
  xOffset: number,
  yOffset: number,
  position: number,
  position_end: number,
  orientation: number,
  invert: boolean,
  cp1x: number,
  cp1y: number,
  cp2x: number,
  cp2y: number,
  startSelector: SmoSelector,
  endSelector: SmoSelector,
  debugParams?: SlurDefaultParams
}
/**
 * Defines a slur
 * @category SmoModifier
 */
export class SmoSlur extends StaffModifierBase {
  static get defaults(): SmoSlurParams {
    return JSON.parse(JSON.stringify({
      spacing: 2,
      thickness: 2,
      xOffset: 5,
      yOffset: 0,
      position: SmoSlur.positions.TOP,
      position_end: SmoSlur.positions.TOP,
      orientation: SmoSlur.orientations.AUTO,
      invert: false,
      cp1x: 0,
      cp1y: 15,
      cp2x: 0,
      cp2y: 15,
      startSelector: SmoSelector.default,
      endSelector: SmoSelector.default
    }));
  }

  // matches VF curve
  static get positions() {
    return {
      HEAD: 1,
      TOP: 2,
      ABOVE: 3,
      BELOW: 4,
      AUTO: 5
    };
  }
  static get orientations() {
    return {
      AUTO: 0,
      UP: 1,
      DOWN: 2
    };
  }
  static get parameterArray() {
    return ['startSelector', 'endSelector', 'spacing', 'xOffset', 'yOffset', 'position', 'position_end', 'invert',
      'orientation', 'cp1x', 'cp1y', 'cp2x', 'cp2y', 'thickness', 'pitchesStart', 'pitchesEnd'];
  }
  spacing: number = 2;
  thickness: number = 2;
  xOffset: number = -5;
  yOffset: number = 10;
  position: number = SmoSlur.positions.TOP;
  position_end: number = SmoSlur.positions.TOP;
  orientation: number = SmoSlur.orientations.AUTO;
  invert: boolean = false;
  cp1x: number = 0;
  cp1y: number = 15;
  cp2x: number = 0;
  cp2y: number = 15;
  startSelector: SmoSelector = SmoSelector.default;
  endSelector: SmoSelector = SmoSelector.default;

  serialize(): any {
    const params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoSlur.defaults,
      SmoSlur.parameterArray, this, params);
    params.ctor = 'SmoSlur';
    return params;
  }
  get controlPoints(): SvgPoint[] {
    const ar: SvgPoint[] = [{
      x: this.cp1x,
      y: this.cp1y
    }, {
      x: this.cp2x,
      y: this.cp2y
    }];
    return ar;
  }

  constructor(params: SmoSlurParams) {
    super('SmoSlur');
    smoSerialize.serializedMerge(SmoSlur.parameterArray, SmoSlur.defaults, this);
    smoSerialize.serializedMerge(SmoSlur.parameterArray, params, this);
    this.startSelector = params.startSelector;
    this.endSelector = params.endSelector;

    // Fix some earlier serialization error.    
    if (!this.attrs) {
      this.attrs = {
        id: (VF.Element as any).newID(),
        type: 'SmoSlur'
      };
    }
  }
}

/**
 * Map pitch indices of the tie line
 */
export interface TieLine {
  from: number,
  to: number
}
/**
 * Constructor parameters for a tie.
 * @category SmoParameters
 */
export interface SmoTieParams {
  tie_spacing: number,
  cp1: number,
  cp2: number,
  first_x_shift: number,
  last_x_shift: number,
  y_shift: number,
  lines: TieLine[],
  startSelector: SmoSelector | null,
  endSelector: SmoSelector | null
}
/**
 * Like slur, but multiple pitches.
 * @category SmoModifier
 */
export class SmoTie extends StaffModifierBase {
  invert: boolean = false;
  cp1: number = 8;
  cp2: number = 12;
  first_x_shift: number = 0;
  last_x_shift: number = 0;
  y_shift: number = 7;
  tie_spacing: number = 0;
  lines: TieLine[] = [];
  startSelector: SmoSelector = SmoSelector.default;
  endSelector: SmoSelector = SmoSelector.default;
  static get defaults(): SmoTieParams {
    return JSON.parse(JSON.stringify({
      invert: false,
      cp1: 8,
      cp2: 12,
      y_shift: 7,
      first_x_shift: 0,
      last_x_shift: 0,
      lines: [],
      startSelector: SmoSelector.default,
      endSelector: SmoSelector.default
    }));
  }

  static get parameterArray() {
    return ['startSelector', 'endSelector', 'invert', 'lines', 'y_shift', 'tie_spacing', 'cp1', 'cp2', 'first_x_shift', 'last_x_shift'];
  }
  static get vexParameters() {
    return ['cp1', 'cp2', 'first_x_shift', 'last_x_shift'];
  }
  static isTie(modifier: SmoTie | SmoModifierBase): modifier is SmoTie {
    return modifier.ctor === 'SmoTie';
  }

  static createLines(fromNote: SmoNote, toNote: SmoNote): TieLine[] {
    const maxPitches = Math.max(fromNote.pitches.length, toNote.pitches.length);
    let i = 0;
    const lines: TieLine[] = [];
    // By default, just tie all the pitches to all the other pitches in order
    for (i = 0; i < maxPitches; ++i) {
      const from = i < fromNote.pitches.length ? i : fromNote.pitches.length - 1;
      const to = i < toNote.pitches.length ? i : toNote.pitches.length - 1;
      lines.push({ from, to });
    }
    return lines;
  }
  get vexOptions() {
    const rv: any = {};
    rv.direction = this.invert ? VF.Stem.DOWN : VF.Stem.UP;
    SmoTie.vexParameters.forEach((p) => {
      rv[p] = (this as any)[p];
    });
    return rv;
  }

  serialize() {
    const params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoTie.defaults,
      SmoTie.parameterArray, this, params);

    params.ctor = 'SmoTie';
    return params;
  }
  // ### checkLines
  // If the note chords have changed, the lines may no longer be valid so update them
  checkLines(fromNote: SmoNote, toNote: SmoNote) {
    const maxTo = this.lines.map((ll) => ll.to).reduce((a, b) => a > b ? a : b);
    const maxFrom = this.lines.map((ll) => ll.from).reduce((a, b) => a > b ? a : b);
    if (maxTo < toNote.pitches.length && maxFrom < fromNote.pitches.length) {
      return;
    }
    this.lines = SmoTie.createLines(fromNote, toNote);
  }
  constructor(params: SmoTieParams) {
    super('SmoTie');
    smoSerialize.serializedMerge(SmoTie.parameterArray, SmoTie.defaults, this);
    smoSerialize.serializedMerge(SmoTie.parameterArray, params, this);
    if (!this.attrs) {
      this.attrs = {
        id: (VF.Element as any).newID(),
        type: 'SmoTie'
      };
    }
  }
}
