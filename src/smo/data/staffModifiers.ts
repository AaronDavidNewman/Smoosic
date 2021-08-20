// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoSelector } from '../xform/selections';
import { SmoNote } from './note';
import { SmoAttrs, SvgPoint, SmoObjectParams, Clef, SvgBox, SmoModifierBase } from './common';

const VF = eval('Vex.Flow');

// ## StaffModifiers
// ## Description:
// This file contains modifiers that might take up multiple measures, and are thus associated
// with the staff.
// ## Staff Modifier Classes:
// ---
// ## StaffModifierBase
// ## Description:
// Base class that mostly standardizes the interface and deals with serialization.
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
// WIP
export class SmoInstrument {
  static get attributes() {
    return ['startSelector', 'endSelector', 'transposeIndex', 'midichannel', 'midiport', 'instrument', 'abbreviation'];
  }
  instrument: string = '';
  keyOffset: number = 0;
  clef: Clef = 'treble';
  serialize() {}
}
// WIP
export class SmoPartMap {
  static get attributes() {
    return ['staffId', 'name', 'abbreviation', 'scoreGroup', 'partnerId', 'instrumentMap', 'layoutManager'];
  }
}

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

// ## SmoStaffHairpin
// ## Descpription:
// crescendo/decrescendo
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
// ## SmoSlur
// ## Description:
// slur staff modifier
// ## SmoSlur Methods:
// ---
export class SmoSlur extends StaffModifierBase {
  static get defaults(): SmoSlurParams {
    return JSON.parse(JSON.stringify({
      spacing: 2,
      thickness: 2,
      xOffset: -5,
      yOffset: 10,
      position: SmoSlur.positions.HEAD,
      position_end: SmoSlur.positions.HEAD,
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
  position: number = SmoSlur.positions.HEAD;
  position_end: number = SmoSlur.positions.HEAD;
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

export interface TieLine {
  from: number,
  to: number
}
export interface SmoTieParams {
  invert: boolean,
  cp1: number,
  cp2: number,
  first_x_shift: number,
  last_x_shift: number,
  lines: TieLine[],
  startSelector: SmoSelector | null,
  endSelector: SmoSelector | null
}
// ## SmoTie
// like slur but multiple pitches
// ---
export class SmoTie extends StaffModifierBase {
  invert: boolean = false;
  cp1: number = 8;
  cp2: number = 12;
  first_x_shift: number = 0;
  last_x_shift: number = 0;
  lines: TieLine[] = [];
  startSelector: SmoSelector = SmoSelector.default;
  endSelector: SmoSelector = SmoSelector.default;
  static get defaults(): SmoTieParams {
    return JSON.parse(JSON.stringify({
      invert: false,
      cp1: 8,
      cp2: 12,
      first_x_shift: 0,
      last_x_shift: 0,
      lines: [],
      startSelector: SmoSelector.default,
      endSelector: SmoSelector.default
    }));
  }

  static get parameterArray() {
    return ['startSelector', 'endSelector', 'invert', 'lines', 'cp1', 'cp2', 'first_x_shift', 'last_x_shift'];
  }
  static get vexParameters() {
    return ['cp1', 'cp2', 'first_x_shift', 'last_x_shift'];
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
