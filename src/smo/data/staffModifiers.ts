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

const VF = eval('Vex.Flow');

/**
 * Base class that mostly standardizes the interface and deals with serialization.
 * @param ctor constructor for derived class
 * @param renderedBox bounding box in client coordinates, if rendered
 * @param logicalBox bounding box in SVG coordinates, if rendered
 * @param attrs object identification
 * @param startSelector where the modifier starts
 * @param endSelector where it ends
 * @category SmoModifier
 * */
export abstract class StaffModifierBase implements SmoModifierBase {
  attrs: SmoAttrs;
  ctor: string;
  startSelector: SmoSelector = SmoSelector.default;
  endSelector: SmoSelector = SmoSelector.default;
  renderedBox: SvgBox | null = null;
  logicalBox: SvgBox | null = null;
  constructor(ctor: string) {
    this.ctor = ctor;
    this.attrs = {
      id: VF.Element.newID(),
      type: ctor
    };
  }
  static deserialize(params: SmoObjectParams) {
    const ctor = eval('globalThis.Smo.' + params.ctor);
    const rv = new ctor(params);
    return rv;
  }
  abstract serialize(): any;
}
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
  abbreviation: string,
  keyOffset: number,
  midichannel: number,
  midiport: number,
  clef: Clef
}

export type SmoInstrumentNumParamType = 'keyOffset' | 'midichannel' | 'midiport';
export const SmoInstrumentNumParams: SmoInstrumentNumParamType[] = ['keyOffset', 'midichannel', 'midiport'];
export type SmoInstrumentStringParamType = 'instrumentName' | 'abbreviation';
export const SmoInstrumentStringParams: SmoInstrumentStringParamType[] = ['instrumentName', 'abbreviation'];
/**
 * Define an instrument.  An instrument is associated with a part, but a part can have instrument changes
 * and thus contain multiple instruments at different points in the score.
 * Not all of these parameters are fully utilized yet, and there are plans to greatly expand what
 * an SmoInstrument is.  Note I may move this to PartInfo module.
 * @category SmoModifier
 */
export class SmoInstrument extends StaffModifierBase {
  static get attributes() {
    return ['startSelector', 'endSelector', 'keyOffset', 'midichannel', 'midiport', 'instrumentName', 'abbreviation'];
  }
  startSelector: SmoSelector;
  endSelector: SmoSelector;
  instrumentName: string = '';
  abbreviation: string = '';
  keyOffset: number = 0;
  clef: Clef = 'treble';
  midichannel: number;
  midiport: number;
  static get defaults(): SmoInstrumentParams {
    return JSON.parse(JSON.stringify({
      clef: 'treble',
      keyOffset: 0,
      instrumentName: '',
      abbreviation: '',
      midichannel: 0,
      midiport: 0,
      startSelector: SmoSelector.default,
      endSelector: SmoSelector.default
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
    Vex.Merge(this, SmoStaffHairpin.defaults);
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
        id: VF.Element.newID(),
        type: 'SmoStaffHairpin'
      };
    }
  }
}

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
  invert: boolean,
  cp1x: number,
  cp1y: number,
  cp2x: number,
  cp2y: number,
  startSelector: SmoSelector,
  endSelector: SmoSelector
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
      xOffset: -5,
      yOffset: 10,
      position: SmoSlur.positions.TOP,
      position_end: SmoSlur.positions.TOP,
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
      TOP: 2
    };
  }
  static get parameterArray() {
    return ['startSelector', 'endSelector', 'spacing', 'xOffset', 'yOffset', 'position', 'position_end', 'invert',
      'cp1x', 'cp1y', 'cp2x', 'cp2y', 'thickness', 'pitchesStart', 'pitchesEnd'];
  }
  spacing: number = 2;
  thickness: number = 2;
  xOffset: number = -5;
  yOffset: number = 10;
  position: number = SmoSlur.positions.TOP;
  position_end: number = SmoSlur.positions.TOP;
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
    // TODO: allow user to customize these
    if (!this.attrs) {
      this.attrs = {
        id: VF.Element.newID(),
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
        id: VF.Element.newID(),
        type: 'SmoTie'
      };
    }
  }
}
