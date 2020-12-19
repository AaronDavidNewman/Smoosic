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
