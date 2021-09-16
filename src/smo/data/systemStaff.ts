// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMeasure } from './measure';
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoMusic } from './music';
import { SmoSelector } from '../xform/selections';
import { smoBeamerFactory } from '../xform/beamers';
import { StaffModifierBase } from './staffModifiers';
import { SmoRehearsalMark, SmoRehearsalMarkParams, SmoTempoTextParams, SmoVolta } from './measureModifiers';
import { SmoObjectParams, SmoAttrs, FontInfo, MeasureNumber } from './common';

const VF = eval('Vex.Flow');

export interface InstrumentInfo {
  instrumentName: string,
  keyOffset: number,
  clef: string
}

export interface SmoSystemStaffParams {
  staffX: number,
  staffY: number,
  adjY: number,
  staffWidth: number,
  staffHeight: number,
  staffId: number,
  renumberingMap: Record<number, number>,
  keySignatureMap: Record<number, string>,
  instrumentInfo: InstrumentInfo,
  measures: SmoMeasure[],
  modifiers: StaffModifierBase[]
}
// ## SmoSystemStaff
// A staff is a line of music that can span multiple measures.
// A system is a line of music for each staff in the score.  So a staff
// spans multiple systems.
// A staff modifier connects 2 points in the staff.
export class SmoSystemStaff implements SmoObjectParams {
  staffX: number = 10;
  staffY: number = 40;
  adjY: number = 0;
  staffWidth: number = 1600;
  staffHeight: number = 90;
  staffId: number = 0;
  renumberingMap: Record<number, number> = {};
  keySignatureMap: Record<number, string> = {};
  instrumentInfo: InstrumentInfo = {
    instrumentName: 'Treble Instrument',
    keyOffset: 0,
    clef: 'treble'
  };
  measures: SmoMeasure[] = [];
  modifiers: StaffModifierBase[] = [];
  attrs: SmoAttrs = {
    id: '',
    type: 'SmoSystemStaff'
  }
  ctor: string = 'SmoSystemStaff';
  _mappedStaffId: number = 0;

  // ### defaults
  // default values for all instances
  static get defaults(): SmoSystemStaffParams {
    return JSON.parse(JSON.stringify({
      staffX: 10,
      staffY: 40,
      adjY: 0,
      staffWidth: 1600,
      staffHeight: 90,
      staffId: 0,
      renumberingMap: {},
      keySignatureMap: {},
      instrumentInfo: {
        instrumentName: 'Treble Instrument',
        keyOffset: 0,
        clef: 'treble'
      },
      measures: [],
      modifiers: []
    }));
  }
  setMappedStaffId(value: number) {
    this._mappedStaffId = value;
  }
  getMappedStaffId(): number {
    return this._mappedStaffId;
  }

  constructor(params: SmoSystemStaffParams) {
    this.measures = [];
    Vex.Merge(this, SmoSystemStaff.defaults);
    Vex.Merge(this, params);
    if (this.measures.length) {
      this.numberMeasures();
    }
    this.attrs = {
      id: VF.Element.newID(),
      type: 'SmoSystemStaff'
    };
  }

  // ### defaultParameters
  // the parameters that get saved with the score.
  static get defaultParameters() {
    return [
      'staffId', 'staffX', 'staffY', 'adjY', 'staffWidth', 'staffHeight',
      'renumberingMap', 'keySignatureMap', 'instrumentInfo'];
  }

  // ### serialize
  // JSONify self.
  serialize() {
    const params: any = {};
    smoSerialize.serializedMerge(SmoSystemStaff.defaultParameters, this, params);
    params.modifiers = [];
    params.measures = [];
    this.measures.forEach((measure) => {
      params.measures.push(measure.serialize());
    });
    this.modifiers.forEach((modifier) => {
      params.modifiers.push(modifier.serialize());
    });
    return params;
  }

  // ### deserialize
  // parse formerly serialized staff.
  static deserialize(jsonObj: any) {
    const params: any = {};
    smoSerialize.serializedMerge(
      ['staffId', 'staffX', 'staffY', 'staffWidth',
        'renumberingMap', 'instrumentInfo'],
      jsonObj, params);
    params.measures = [];
    jsonObj.measures.forEach((measureObj: any) => {
      const measure = SmoMeasure.deserialize(measureObj);
      params.measures.push(measure);
    });
    const rv = new SmoSystemStaff(params);
    if (jsonObj.modifiers) {
      jsonObj.modifiers.forEach((params: any) => {
        const mod = StaffModifierBase.deserialize(params);
        rv.modifiers.push(mod);
      });
    }
    return rv;
  }

  // ### addStaffModifier
  // add a staff modifier, or replace a modifier of same type
  // with same endpoints.
  addStaffModifier(modifier: StaffModifierBase) {
    this.removeStaffModifier(modifier);
    this.modifiers.push(modifier);
  }

  // ### removeStaffModifier
  // Remove a modifier of given type and location
  removeStaffModifier(modifier: StaffModifierBase) {
    const mods: StaffModifierBase[] = [];
    this.modifiers.forEach((mod: StaffModifierBase) => {
      if (mod.attrs.type !== modifier.attrs.type ||
        SmoSelector.neq(mod.startSelector, modifier.startSelector) ||
        SmoSelector.neq(mod.endSelector, modifier.endSelector)) {
        mods.push(mod);
      }
    });
    this.modifiers = mods;
  }
  // ### getVoltaMap

  getVoltaMap(startIndex: number, endIndex: number) {
    const rv: SmoVolta[] = [];
    this.measures.forEach((measure) => {
      measure.getNthEndings().forEach((ending) => {
        if (ending.startBar >= startIndex && ending.endBar <= endIndex) {
          rv.push(ending);
        }
      });
    });
    return rv;
  }
  // ### getModifiersAt
  // get any modifiers at the selected location
  getModifiersAt(selector: SmoSelector): StaffModifierBase[] {
    const rv: StaffModifierBase[] = [];
    this.modifiers.forEach((mod) => {
      if (SmoSelector.sameNote(mod.startSelector, selector)) {
        rv.push(mod);
      }
    });
    return rv;
  }
  getModifier(modData: any) {
    return this.getModifiers().find((mod) =>
      SmoSelector.eq(mod.startSelector, modData.startSelector) && mod.attrs.type === modData.attrs.type);
  }

  setLyricFont(fontInfo: FontInfo) {
    this.measures.forEach((measure) => {
      measure.setLyricFont(fontInfo);
    });
  }
  setLyricAdjustWidth(adjustNoteWidth: boolean) {
    this.measures.forEach((measure) => {
      measure.setLyricAdjustWidth(adjustNoteWidth);
    });
  }
  setChordFont(fontInfo: FontInfo) {
    this.measures.forEach((measure) => {
      measure.setChordFont(fontInfo);
    });
  }
  setChordAdjustWidth(adjustNoteWidth: boolean) {
    this.measures.forEach((measure) => {
      measure.setChordAdjustWidth(adjustNoteWidth);
    });
  }

  // ### getSlursStartingAt
  // like it says.  Used by audio player to slur notes
  getSlursStartingAt(selector: SmoSelector) {
    return this.modifiers.filter((mod) =>
      SmoSelector.sameNote(mod.startSelector, selector) && mod.attrs.type === 'SmoSlur'
    );
  }
  // ### getSlursEndingAt
  // like it says.
  getSlursEndingAt(selector: SmoSelector) {
    return this.modifiers.filter((mod) =>
      SmoSelector.sameNote(mod.endSelector, selector)
    );
  }

  getTiesStartingAt(selector: SmoSelector) {
    return this.modifiers.filter((mod) =>
      SmoSelector.sameNote(mod.startSelector, selector) && mod.attrs.type === 'SmoTie'
    );
  }
  getTiesEndingAt(selector: SmoSelector) {
    return this.modifiers.filter((mod) =>
      SmoSelector.sameNote(mod.endSelector, selector) && mod.attrs.type === 'SmoTie'
    );
  }

  // ### accesor getModifiers
  getModifiers() {
    return this.modifiers;
  }

  // ### applyBeams
  // group all the measures' notes into beam groups.
  applyBeams() {
    for (let i = 0; i < this.measures.length; ++i) {
      const measure = this.measures[i];
      smoBeamerFactory.applyBeams(measure);
    }
  }

  // ### addRehearsalMark
  // for all measures in the system, and also bump the
  // auto-indexing
  addRehearsalMark(index: number, parameters: SmoRehearsalMarkParams) {
    let i = 0;
    let symbol = '';
    var mark = new SmoRehearsalMark(parameters);
    if (!mark.increment) {
      this.measures[index].addRehearsalMark(mark);
      return;
    }

    symbol = mark.symbol;
    for (i = 0; i < this.measures.length; ++i) {
      const mm = this.measures[i];
      if (i < index) {
        const rm: SmoRehearsalMark = (mm.getRehearsalMark() as SmoRehearsalMark);
        if (rm && rm.cardinality === mark.cardinality && rm.increment) {
          symbol = rm.getIncrement();
          mark.symbol = symbol;
        }
      }
      if (i === index) {
        mm.addRehearsalMark(mark);
        symbol = mark.getIncrement();
      }
      if (i > index) {
        const rm: SmoRehearsalMark = (mm.getRehearsalMark() as SmoRehearsalMark);
        if (rm && rm.cardinality === mark.cardinality && rm.increment) {
          rm.symbol = symbol;
          symbol = rm.getIncrement();
        }
      }
    }
  }

  removeTempo(index: number) {
    this.measures[index].removeTempo();
  }

  addTempo(tempo: SmoTempoTextParams, index: number) {
    this.measures[index].addTempo(tempo);
  }

  // ### removeRehearsalMark
  // for all measures in the system, and also decrement the
  // auto-indexing
  removeRehearsalMark(index: number) {
    let ix: number = 0;
    let symbol: string | null = null;
    let card: string | null = null;
    this.measures.forEach((measure) => {
      if (ix === index) {
        const mark: SmoRehearsalMark = measure.getRehearsalMark() as SmoRehearsalMark;
        if (mark) {
          symbol = mark.symbol;
          card = mark.cardinality;
        }
        measure.removeRehearsalMark();
      }
      if (ix > index && symbol && card) {
        const mark: SmoRehearsalMark = measure.getRehearsalMark() as SmoRehearsalMark;
        if (mark && mark.increment) {
          mark.symbol = symbol;
          symbol = mark.getIncrement();
        }
      }
      ix += 1;
    });
  }

  // ### deleteMeasure
  // delete the measure, and any staff modifiers that start/end there.
  deleteMeasure(index: number) {
    if (this.measures.length < 2) {
      return; // don't delete last measure.
    }
    const nm: SmoMeasure[] = [];
    this.measures.forEach((measure) => {
      if (measure.measureNumber.measureIndex !== index) {
        nm.push(measure);
      }
    });
    const sm: StaffModifierBase[] = [];
    this.modifiers.forEach((mod) => {
      // Bug: if we are deleting a measure before the selector, change the measure number.
      if (mod.startSelector.measure !== index && mod.endSelector.measure !== index) {
        if (index < mod.startSelector.measure) {
          mod.startSelector.measure -= 1;
        }
        if (index < mod.endSelector.measure) {
          mod.endSelector.measure -= 1;
        }
        sm.push(mod);
      }
    });
    this.measures = nm;
    this.modifiers = sm;
    this.numberMeasures();
  }

  // ### addKeySignature
  // Add key signature to the given measure and update map so we know
  // when it changes, cancels etc.
  addKeySignature(measureIndex: number, key: string) {
    this.keySignatureMap[measureIndex] = key;
    const target = this.measures[measureIndex];
    target.keySignature = key;
  }

  _updateKeySignatures() {
    let i = 0;
    const currentSig = this.measures[0].keySignature;

    for (i = 0; i < this.measures.length; ++i) {
      const measure = this.measures[i];
      const nextSig = this.keySignatureMap[i] ? this.keySignatureMap[i] : currentSig;
      measure.setKeySignature(nextSig);
    }
  }

  // ### numberMeasures
  // After anything that might change the measure numbers, update them iteratively
  numberMeasures() {
    let pickupOffset: number = 0;
    let i: number = 0;
    let renumberIndex = 0;
    // Start measure from -1 for pickup
    if (this.measures[0].getTicksFromVoice(0) < SmoMusic.timeSignatureToTicks(this.measures[0].timeSignature.timeSignature)) {
      pickupOffset = -1;
    }

    for (i = 0; i < this.measures.length; ++i) {
      const measure = this.measures[i];

      renumberIndex = typeof (this.renumberingMap[i]) === 'undefined' ? 0 : this.renumberingMap[i];
      const localIndex: number = renumberIndex + i + pickupOffset;
      // If this is the first full measure, call it '1'
      const numberObj: MeasureNumber = {
        localIndex,
        measureIndex: i,
        systemIndex: i,
        staffId: this.staffId
      };
      measure.setMeasureNumber(numberObj);
    }
  }

  addDefaultMeasure(index: number, params: SmoMeasure) {
    const measure = SmoMeasure.getDefaultMeasure(params);
    this.addMeasure(index, measure);
  }

  // ## addMeasure
  // ## Description:
  // Add the measure at the specified index, splicing the array as required.
  addMeasure(index: number, measure: SmoMeasure) {
    if (index === 0 && this.measures.length) {
      measure.setMeasureNumber(this.measures[0].measureNumber);
    }
    if (index >= this.measures.length) {
      this.measures.push(measure);
    } else {
      this.measures.splice(index, 0, measure);
    }
    const modifiers = this.modifiers.filter((mod) => mod.startSelector.measure >= index);
    modifiers.forEach((mod) => {
      if (mod.startSelector.measure < this.measures.length) {
        mod.startSelector.measure += 1;
      }
      if (mod.endSelector.measure < this.measures.length) {
        mod.endSelector.measure += 1;
      }
    });
    this.numberMeasures();
  }
}
