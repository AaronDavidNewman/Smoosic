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
import { SmoAttrs, getId, SvgPoint, SmoObjectParams, Clef, SvgBox, SmoModifierBase, Pitch } from './common';
import { SmoTabNote, SmoFretPosition } from './noteModifiers';
import { SmoMusic } from './music';
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
      id: getId().toString(),
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
  serializeWithId() {
    const ser = this.serialize();
    ser.attrs = JSON.parse(JSON.stringify(this.attrs));
    return ser;
  }
  abstract serialize(): any;
}
export interface StaffModifierBaseSer {
  attrs: SmoAttrs;
  ctor: string;
  associatedStaff: number;
  startSelector: SmoSelector;
  endSelector: SmoSelector;
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
  /**
   * where instrument starts to take effect
   */
  startSelector: SmoSelector,
  /**
   * where instrument changes
   */
  endSelector: SmoSelector,
  /**
   * name, for metadata
   */
  instrumentName: string,
  /**
   * woodwind, brass etc.
   */
  family: string,
  /**
   * instrument sample
   */
  instrument: string,
  /**
   * abbreviation for score
   */
  abbreviation: string,
  /**
   * -2 indicates key of Bb
   */
  keyOffset: number,
  /**
   * for future
   */
  midiInstrument: number,
  /**
   * for future
   */
  midichannel: number,
  /**
   * for future
   */
  midiport: number,
  /**
   * default clef
   */
  clef: Clef,
  /**
   * future, can be used to set sample
   */
  mutes?: string,  
}

/**
 * Serialization of instrument-specific settings, such as sound and key
 * @category serialization
 */
export interface SmoInstrumentParamsSer extends SmoInstrumentParams {
  /**
   * constructor
   */
  ctor: string;
}
function isSmoInstrumentParamsSer(params: Partial<SmoInstrumentParamsSer>): params is SmoInstrumentParamsSer {
  return params?.ctor === 'SmoInstrument';
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
  serialize(): SmoInstrumentParamsSer {
    const params: Partial<SmoInstrumentParamsSer> = {};
    smoSerialize.serializedMergeNonDefault(SmoInstrument.defaults, SmoInstrument.attributes, this, params);
    params.ctor = 'SmoInstrument';
    if (!isSmoInstrumentParamsSer(params)) {
      throw ('bad instrument ' + JSON.stringify(params));
    }
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
  /**
   * extra x on start of shape
   */
  xOffsetLeft: number,
  /**
   * extra x on end of shape
   */
  xOffsetRight: number,
  /**
   * yOffset
   */
  yOffset: number,
  /**
   * flare-out pixels
   */
  height: number,
  /**
   * above, below
   */
  position: number,
  /**
   * cresc, dim.
   */
  hairpinType: number,
  /**
   * where it starts
   */
  startSelector: SmoSelector,
  /**
   * where it starts
   */
  endSelector: SmoSelector
}

/**
 * Serialized dynamic marking (hairpin)
 * @category serialization
 */
export interface SmoStaffHairpinParamsSer extends StaffModifierBaseSer {
  /**
   * extra x on start of shape
   */
  xOffsetLeft: number,
  /**
   * extra x on end of shape
   */
  xOffsetRight: number,
  /**
   * yOffset
   */
  yOffset: number,
  /**
   * flare-out pixels
   */
  height: number,
  /**
   * above, below
   */
  position: number,
  /**
   * cresc, dim.
   */
  hairpinType: number,
  /**
   * where it starts
   */
  startSelector: SmoSelector,
  /**
   * where it starts
   */
  endSelector: SmoSelector
}
function isSmoStaffHairpinParamsSer(params: Partial<SmoStaffHairpinParamsSer>): params is SmoStaffHairpinParamsSer {
  if (!params.ctor || !(params.ctor === 'SmoStaffHairpin')) {
    return false;
  }
  return true;
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
  serialize(): SmoStaffHairpinParamsSer {
    const params: Partial<SmoStaffHairpinParamsSer> = {};
    smoSerialize.serializedMergeNonDefault(SmoStaffHairpin.defaults, SmoStaffHairpin.attributes, this, params);
    params.ctor = 'SmoStaffHairpin';
    if (!isSmoStaffHairpinParamsSer(params)) {
      throw 'bad hairpin ' + JSON.stringify(params);
    }
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
        id: getId().toString(),
        type: 'SmoStaffHairpin'
      };
    }
  }
}

/**
 * constructor params for {@link SmoStaffTextBracket}
 * @category SmoParameters
 */
export interface SmoStaffTextBracketParams {
  /**
   * the ledger line
   */
  line: number,
  /**
   * above or below
   */
  position: number,
  /**
   * the text to display
   */
  text: string,
  /**
   * text can have superscript
   */
  superscript: string,
  /**
   * extend of the line
   */
  startSelector: SmoSelector,
  /**
   * extend of the line
   */
  endSelector: SmoSelector
}

/**
 * serializable bits of SmoStaffTextBracket
 * @category serialization
 */
export interface SmoStaffTextBracketParamsSer extends StaffModifierBaseSer{
  /**
   * constructor
   */
  ctor: string;
  attrs: SmoAttrs;
  /**
   * the ledger line
  */
  line: number;
  /**
   * above or below
   */
  position: number,
  /**
   * the text to display
   */
  text: string,
  /**
   * text can have superscript
   */
  superscript: string,
  /**
   * extend of the line
   */
  startSelector: SmoSelector,
  /**
   * extend of the line
   */
  endSelector: SmoSelector
}
function isSmoStaffTextBracketParamsSer(params: Partial<SmoStaffTextBracketParamsSer>):
  params is SmoStaffTextBracketParamsSer {
    if (params.ctor && params.ctor === 'SmoStaffTextBracket') {
      return true;
    }
    return false;
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
  serialize(): SmoStaffTextBracketParamsSer {
    const params: Partial<SmoStaffTextBracketParamsSer> = {};
    smoSerialize.serializedMergeNonDefault(SmoStaffTextBracket.defaults, SmoStaffTextBracket.attributes, this, params);
    params.ctor = 'SmoStaffTextBracket';
    if (!isSmoStaffTextBracketParamsSer(params)) {
      throw(' bad text bracket ' + JSON.stringify(params));
    }
    return params;
  }
  serializeWithId():SmoStaffTextBracketParamsSer {
    const ser = this.serialize();
    ser.attrs = JSON.parse(JSON.stringify(this.attrs));
    return ser;
  }
  constructor(params: SmoStaffTextBracketParams) {
    super('SmoStaffTextBracket');
    smoSerialize.serializedMerge(SmoStaffTextBracket.attributes, SmoStaffTextBracket.defaults, this);
    smoSerialize.serializedMerge(SmoStaffTextBracket.attributes, params, this);
    this.startSelector = JSON.parse(JSON.stringify(params.startSelector));
    this.endSelector = JSON.parse(JSON.stringify(params.endSelector));
    if (!this.attrs) {
      this.attrs = {
        id: getId().toString(),
        type: 'SmoStaffTextBracket'
      };
    }
  }
}

/**
 * used for debugging
 */
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
  /** 
   * spacing between note and curve 
   * */
  spacing: number,
  /**
   * thickness of the curve
   */
  thickness: number,
  /**
   * x offset on both ends
   */
  xOffset: number,
  /**
   * move whole curve up or down
   */
  yOffset: number,
  /**
   * VF position, whether head-end or stem end
   */
  position: number,
  /**
   * VF position for right side of slur
   */
  position_end: number,
  /**
   * indicates whether the user wants up, down or 'auto'.
   * internally, sets the 'invert' flag
   */
  orientation: number,
  /**
   * reverse the slur from the usual rules in VF
   */
  invert: boolean,
  /**
   * control point for bz curve
   */
  cp1x: number,
  /**
   * control point for bz curve
   */
  cp1y: number,
  /**
   * control point for bz curve
   */
  cp2x: number,
  /**
   * control point for bz curve
   */
  cp2y: number,
  /**
   * start note of the curve
   */
  startSelector: SmoSelector,
  /**
   * start note of the curve
   */
  endSelector: SmoSelector,
  /**
   * optional for debugging
   */
  debugParams?: SlurDefaultParams
}
/**
 * serializable bits of slur
 * @category serialization
 */
export interface SmoSlurParamsSer extends SmoSlurParams {
  /**
   * constructor
   */
  ctor: string;
}

function isSmoSlurParamsSer(params: Partial<SmoSlurParamsSer>): params is SmoSlurParamsSer {
  if (params && params.ctor && params.ctor === 'SmoSlur') {
    return true;
  }
  return false;
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

  serialize(): SmoSlurParamsSer {
    const params: Partial<SmoSlurParamsSer> = {};
    smoSerialize.serializedMergeNonDefault(SmoSlur.defaults,
      SmoSlur.parameterArray, this, params);
    params.ctor = 'SmoSlur';
    if (!isSmoSlurParamsSer(params)) {
      throw('bad slur ' + JSON.stringify(params));
    }
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
        id: getId().toString(),
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
  /**
   * future: x offset on both sides
   */
  tie_spacing: number,
  /**
   * x coord of cp for bz curve
   */
  cp1: number,
  /**
   * x coord of cp for bz curve
   */
  cp2: number,
  /**
   * x offset
   */
  first_x_shift: number,
  /**
   * x offset end
   */
  last_x_shift: number,
  /**
   * y offset for all the curves
   */
  y_shift: number,
  /**
   * map of lines for the pitches
   */
  lines: TieLine[],
  /**
   * start note
   */
  startSelector: SmoSelector | null,
  /**
   * end note
   */
  endSelector: SmoSelector | null
}

/**
 * serializable bits of SmoTie
 * @category serialization
 */
export interface SmoTieParamsSer extends SmoTieParams {
  /** 
   * constructor
   */
  ctor: string;
}
function isSmoTieParamsSer(params: Partial<SmoTieParamsSer>): params is SmoTieParamsSer {
  if (params.ctor && params.ctor === 'SmoTie') {
    return true;
  }
  return false;
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
    return ['cp1', 'cp2', 'first_x_shift', 'last_x_shift', 'y_shift'];
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

  serialize(): SmoTieParamsSer {
    const params: Partial<SmoTieParamsSer> = {};
    smoSerialize.serializedMergeNonDefault(SmoTie.defaults,
      SmoTie.parameterArray, this, params);

    params.ctor = 'SmoTie';
    if (!isSmoTieParamsSer(params)) {
      throw 'bad tie ' + JSON.stringify(params);
    }
    return params;
  }
  // ### checkLines
  // If the note chords have changed, the lines may no longer be valid so update them
  checkLines(fromNote: SmoNote, toNote: SmoNote) {
    if (this.lines.length < 1) {
      return;
    }
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
        id: getId().toString(),
        type: 'SmoTie'
      };
    }
  }
}

/**
 * Parameters for SmoTabStave
 */
export interface SmoTabStaveParams {
  /**
   * start selector, by measure
   */
  startSelector: SmoSelector,
  /**
   * end selector, by measure
   */
  endSelector: SmoSelector,
  /**
   * space between staves, in pixels
   */
  spacing: number,
  /**
   * number of lines
   */
  numLines: number,
  /**
   * Default setting of showing stems
   */
  showStems: boolean,
  /**
   * If true, the score should keep a single tab stave for all measures
   */
  allMeasures: boolean,
  /**
   * The strings for each line
   */
  stringPitches?: Pitch[]
}

export interface SmoTabStaveParamsSer extends SmoTabStaveParams {
  ctor: string
}

/**
 * A stave for guitar tablature sits below the music stave.
 */
export class SmoTabStave extends StaffModifierBase {
  startSelector: SmoSelector = SmoSelector.default;
  endSelector: SmoSelector = SmoSelector.default;
  spacing: number = 13;
  numLines: number = 6;
  showStems: boolean = true;
  allMeasures: boolean = true;
  stringPitches: Pitch[];
  /** The default guitar tuning.  Different instruments could have different tuning */
  static get defaultStringPitches(): Pitch[] {
    return JSON.parse(JSON.stringify([
      { letter: 'e', accidental: 'n', octave: 2 },
      { letter: 'a', accidental: 'n', octave: 2 },
      { letter: 'd', accidental: 'n', octave: 3 },
      { letter: 'g', accidental: 'n', octave: 3 },
      { letter: 'b', accidental: 'n', octave: 3 },
      { letter: 'e', accidental: 'n', octave: 4 }
    ]));
  }
  /**
   * Get default tab note position for a pitch on a music staff
   * @param pitch 
   * @param stringPitches 
   * @returns 
   */
  static getDefaultPositionForStaff(pitch: Pitch, stringPitches: Pitch[], transposeIndex: number, stringIndex?: number): SmoFretPosition {
    const pitchAr = stringPitches.map((pp) => SmoMusic.smoPitchToInt(pp));
    const pitchInt = SmoMusic.smoPitchToInt(pitch) + (-1 * transposeIndex);
    stringIndex = stringIndex ?? -1;
    // if the note is higher than the highest string, count the frets.
    const lastIndex = pitchAr.length - 1;
    // If the user wants to preserve a certain string, find the fret for that if we can.
    if (stringIndex > 0 && stringIndex < pitchAr.length && pitchAr[stringIndex] <= pitchInt ) {
      return { string: stringIndex + 1, fret: pitchInt - pitchAr[stringIndex] };
    }
    // If the note is between this and the next string, count the frets
    for (var i = 0; i < lastIndex; i++) {
      if (pitchInt >= pitchAr[i]) {
        return { string: i + 1, fret: pitchInt - pitchAr[i] };
      }
    }
    // if lower that the lowest string, there is no fret so just return 0
    return { string: lastIndex + 1, fret: 0 };
  }
  /**
   * Find default fret positions for a set of pitches from a note
   * @param pitches 
   * @param stringPitches 
   * @returns 
   */
  static getDefaultPositionsForStaff(pitches: Pitch[], stringPitches: Pitch[], transposeIndex: number): SmoFretPosition[] {
    const rv: SmoFretPosition[] = [];
    pitches.forEach((pp) => rv.push(SmoTabStave.getDefaultPositionForStaff(pp, stringPitches, transposeIndex)));
    return rv;
  }

  static get defaults(): SmoTabStaveParams {
    return {
      startSelector: SmoSelector.default,
      endSelector: SmoSelector.default,
      spacing: 13,
      numLines: 6,
      showStems: true,
      allMeasures: true,
      stringPitches: SmoTabStave.defaultStringPitches
    }
  }
  static parameterArray: string[] = ['startSelector', 'endSelector', 'spacing', 'numLines', 'showStems', 'allMeasures'];
  static featuresEqual(st1: SmoTabStave, st2: SmoTabStave): boolean {
    if (st1.numLines !== st2.numLines) {
      return false;
    }
    if (st1.stringPitches.length !== st2.stringPitches.length) {
      return false;
    }
    if (st1.showStems !== st2.showStems) {
      return false;
    }
    for (var i = 0; i < st1.stringPitches.length; ++i) {
      const p1 = st1.stringPitches[i];
      const p2 = st2.stringPitches[i];
      if (SmoMusic.smoPitchToInt(p1) !== SmoMusic.smoPitchToInt(p2)) {
        return false;
      }
    }
    return true;
  }
  static overlaps(st1: SmoTabStave, st2: SmoTabStave): boolean {
     if (SmoSelector.contains(st1.startSelector, st2.startSelector, st2.endSelector)) {
      return true;
     }
     if (SmoSelector.contains(st1.endSelector, st2.startSelector, st2.endSelector)) {
      return true;
     }
     return false;
  }
  getTabNoteFromNote(note: SmoNote, transposeIndex: number) {
    if (note.tabNote) {
      return note.tabNote;
    }
    const positions = SmoTabStave.getDefaultPositionsForStaff(note.pitches, this.stringPitches, transposeIndex);
    return new SmoTabNote({
      positions, noteId: note.attrs.id, isAssigned: false, flagState: SmoTabNote.flagStates.None,
        noteHead: SmoTabNote.noteHeads.number, flagThrough: false
    });
  }
  constructor(params: SmoTabStaveParams) {
    super('SmoTabStave');
    smoSerialize.serializedMerge(SmoTabStave.parameterArray, SmoTabStave.defaults, this);
    smoSerialize.serializedMerge(SmoTabStave.parameterArray, params, this);
    if (!params.stringPitches) {
      this.stringPitches = SmoTabStave.defaultStringPitches;
    } else {
      this.stringPitches = params.stringPitches;
    }
    this.stringPitches.sort((pa, pb) => SmoMusic.smoPitchToInt(pa) > SmoMusic.smoPitchToInt(pb) ? -1 : 1);
  }
  serialize():any {
    const params: Partial<SmoTabStaveParamsSer> = { ctor: 'SmoTabStave' };
    smoSerialize.serializedMergeNonDefault(SmoTabStave.defaults,
      SmoTabStave.parameterArray, this, params);
    params.stringPitches = JSON.parse(JSON.stringify(this.stringPitches));
    return params;
  }
}

export interface SmoTabTieParams {
  startSelector: SmoSelector,
  endSelector: SmoSelector,
  hammerType: number,
  slideType: number,
  isTap: boolean,
  text: string
}

export interface SmoTabTieParamsSer extends SmoTabTieParams {
  ctor: string
}

export class SmoTabTie extends StaffModifierBase {
  startSelector: SmoSelector = SmoSelector.default;
  endSelector: SmoSelector = SmoSelector.default;
  hammerType: number = SmoTabTie.hammerType.None;
  slideType: number = SmoTabTie.slideType.None;
  isTap: boolean = false;
  text: string = '';
  static get hammerType() {
    return { None: 0, Hammeron: 1, Pulloff: 2 }
  }
  static get slideType() {
    return { None: 0, SlideUp: 1, SlideDown: 2 }
  }

  static get defaults(): SmoTabTieParams {
    return JSON.parse(JSON.stringify({
      startSelector: SmoSelector.default,
      endSelector: SmoSelector.default,
      hammerType: SmoTabTie.hammerType.None,
      slideType: SmoTabTie.slideType.None,
      isTap: false,
      text: ''
    }));
  }
  static get parameterArray() {
    return ['startSelector', 'endSelector', 'hammerType', 'slideType', 'isTap', 'text'] 
  };
  constructor(params: SmoTabTieParams) {
    super('SmoTabTie');
    smoSerialize.serializedMerge(SmoTabTie.parameterArray, SmoTabStave.defaults, this);
    smoSerialize.serializedMerge(SmoTabTie.parameterArray, params, this);
  }
  serialize() {
    const params: Partial<SmoTabStaveParamsSer> = { ctor: 'SmoTabTie' };
    smoSerialize.serializedMergeNonDefault(SmoTabStave.defaults,
      SmoTabTie.parameterArray, this, params);
    return params;
  }
}