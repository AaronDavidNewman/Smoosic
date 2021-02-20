// ## StaffModifiers
// ## Description:
// This file contains modifiers that might take up multiple measures, and are thus associated
// with the staff.
// ## Staff Modifier Classes:
// ---
// ## StaffModifierBase
// ## Description:
// Base class that mostly standardizes the interface and deals with serialization.
// eslint-disable-next-line no-unused-vars
class StaffModifierBase {
  constructor(ctor) {
    this.ctor = ctor;
  }
  static deserialize(params) {
    const ctor = eval(params.ctor);
    const rv = new ctor(params);
    return rv;
  }
  get isStaffModifier() {
    return true;
  }
}

// ## SmoStaffHairpin
// ## Descpription:
// crescendo/decrescendo
// eslint-disable-next-line no-unused-vars
class SmoStaffHairpin extends StaffModifierBase {
  static get editableAttributes() {
    return ['xOffsetLeft', 'xOffsetRight', 'yOffset', 'height'];
  }
  static get defaults() {
    return {
      xOffsetLeft: -2,
      xOffsetRight: 0,
      yOffset: -50,
      height: 10,
      position: SmoStaffHairpin.positions.BELOW,
      hairpinType: SmoStaffHairpin.types.CRESCENDO
    };
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
  serialize() {
    const params = {};
    smoSerialize.serializedMergeNonDefault(SmoStaffHairpin.defaults, SmoStaffHairpin.attributes, this, params);
    params.ctor = 'SmoStaffHairpin';
    return params;
  }
  constructor(params) {
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

// ## SmoSlur
// ## Description:
// slur staff modifier
// ## SmoSlur Methods:
// ---
// eslint-disable-next-line no-unused-vars
class SmoSlur extends StaffModifierBase {
  static get defaults() {
    return {
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
      pitchesStart: [],
      pitchesEnd: []
    };
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

  serialize() {
    const params = {};
    smoSerialize.serializedMergeNonDefault(SmoSlur.defaults,
      SmoSlur.parameterArray, this, params);

    params.ctor = 'SmoSlur';
    return params;
  }
  get controlPoints() {
    const ar = [{
      x: this.cp1x,
      y: this.cp1y
    }, {
      x: this.cp2x,
      y: this.cp2y
    }];
    return ar;
  }

  constructor(params) {
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

// ## SmoTie
// like slur but multiple pitches
// ---
// eslint-disable-next-line no-unused-vars
class SmoTie extends StaffModifierBase {
  static get defaults() {
    return {
      invert: false,
      cp1: 8,
      cp2: 12,
      first_x_shift: 0,
      last_x_shift: 0,
      lines: []
    };
  }

  static get parameterArray() {
    return ['startSelector', 'endSelector', 'invert', 'lines', 'cp1', 'cp2', 'first_x_shift', 'last_x_shift'];
  }
  static get vexParameters() {
    return ['cp1', 'cp2', 'first_x_shift', 'last_x_shift'];
  }
  static createLines(fromNote, toNote) {
    const maxPitches = Math.max(fromNote.pitches.length, toNote.pitches.length);
    let i = 0;
    const lines = [];
    // By default, just tie all the pitches to all the other pitches in order
    for (i = 0; i < maxPitches; ++i) {
      const from = i < fromNote.pitches.length ? i : fromNote.pitches.length - 1;
      const to = i < toNote.pitches.length ? i : toNote.pitches.length - 1;
      lines.push({ from, to });
    }
    return lines;
  }
  get vexOptions() {
    const rv = {};
    rv.direction = this.invert ? VF.Stem.DOWN : VF.Stem.UP;
    SmoTie.vexParameters.forEach((p) => {
      rv[p] = this[p];
    });
    return rv;
  }

  serialize() {
    const params = {};
    smoSerialize.serializedMergeNonDefault(SmoTie.defaults,
      SmoTie.parameterArray, this, params);

    params.ctor = 'SmoTie';
    return params;
  }
  // ### checkLines
  // If the note chords have changed, the lines may no longer be valid so update them
  checkLines(fromNote, toNote) {
    const maxTo = this.lines.map((ll) => ll.to).reduce((a, b) => a > b ? a : b);
    const maxFrom = this.lines.map((ll) => ll.from).reduce((a, b) => a > b ? a : b);
    if (maxTo < toNote.pitches.length && maxFrom < fromNote.pitches.length) {
      return;
    }
    this.lines = SmoTie.createLines(fromNote, toNote);
  }
  constructor(params) {
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
