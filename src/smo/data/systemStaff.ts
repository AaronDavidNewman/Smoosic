// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMeasure } from './measure';
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoSelector } from '../xform/selections';
import { smoBeamerFactory } from '../xform/beamers';
import { SmoMeasureFormat } from './measureModifiers';
import { SmoMusic } from './music';
import { SmoPartInfo, SmoPartInfoParams } from './partInfo';
import { SmoInstrumentParams, StaffModifierBase, SmoInstrument, SmoInstrumentMeasure, SmoInstrumentStringParams, SmoInstrumentNumParams } from './staffModifiers';
import { SmoRehearsalMark, SmoRehearsalMarkParams, SmoTempoTextParams, SmoVolta } from './measureModifiers';
import { SmoObjectParams, SmoAttrs, FontInfo, MeasureNumber } from './common';

const VF = eval('Vex.Flow');

export interface SmoSystemStaffParams {
  staffX: number,
  staffY: number,
  adjY: number,
  staffWidth: number,
  staffHeight: number,
  staffId: number,
  renumberingMap: Record<number, number>,
  keySignatureMap: Record<number, string>,
  measureInstrumentMap: Record<number, SmoInstrumentParams>,
  measures: SmoMeasure[],
  modifiers: StaffModifierBase[],
  partInfo?: SmoPartInfo;
}
export type SmoStaffNumberParamType = 'staffId' | 'staffX' | 'staffY' | 'adjY' | 'staffWidth' | 'staffHeight';
export const SmoStaffNumberParams: SmoStaffNumberParamType[] = [
  'staffId', 'staffX', 'staffY', 'adjY', 'staffWidth', 'staffHeight'
];

// ## SmoSystemStaff
// A staff is a line of music that can span multiple measures.
// A system is a line of music for each staff in the score.  So a staff
// spans multiple systems.
// A staff modifier connects 2 points in the staff.
export class SmoSystemStaff implements SmoObjectParams {
  static getStaffInstrument(measureInstrumentMap: Record<number, SmoInstrument>, measureIndex: number) {
    const keyar: string[] = Object.keys(measureInstrumentMap);
    let fit = 0;
    keyar.forEach((key) => {
      const numkey = parseInt(key, 10);
      if (numkey <= measureIndex && numkey > fit) {
        fit = numkey;
      }
    });
    return measureInstrumentMap[fit];
  }
  static getStaffInstrumentArray(measureInstrumentMap: Record<number, SmoInstrumentParams>): SmoInstrumentMeasure[] {
    const rv: SmoInstrumentMeasure[] = [];
    const keyar: string[] = Object.keys(measureInstrumentMap);
    keyar.forEach((key) => {
      const measureIndex = parseInt(key, 10);
      rv.push({ measureIndex, instrument: measureInstrumentMap[measureIndex] });
    });
    return rv;
  }

  staffX: number = 10;
  staffY: number = 40;
  adjY: number = 0;
  staffWidth: number = 1600;
  staffHeight: number = 90;
  staffId: number = 0;
  renumberingMap: Record<number, number> = {};
  keySignatureMap: Record<number, string> = {};
  partInfo: SmoPartInfo;
  measureInstrumentMap: Record<number, SmoInstrument> = {};
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
      measureInstrumentMap: {},
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
    SmoStaffNumberParams.forEach((numParam) => {
      this[numParam] = params[numParam];
    });
    this.measures = params.measures;
    this.modifiers = params.modifiers;
    if (Object.keys(params.measureInstrumentMap).length === 0) {
      this.measureInstrumentMap[0] = new SmoInstrument(SmoInstrument.defaults);
      this.measureInstrumentMap[0].startSelector.staff = this.staffId;
      this.measureInstrumentMap[0].endSelector.staff = this.measures.length;
    } else {
      Object.keys(params.measureInstrumentMap).forEach((p) => {
        const pnum = parseInt(p, 10);
        this.measureInstrumentMap[pnum] = new SmoInstrument(params.measureInstrumentMap[pnum]);
      });
    }
    if (this.measures.length) {
      this.numberMeasures();
    }
    this.attrs = {
      id: VF.Element.newID(),
      type: 'SmoSystemStaff'
    };
    if (params.partInfo) {
      this.partInfo = params.partInfo;
    } else {
      const staveNo = this.staffId + 1;
      const partDefs = SmoPartInfo.defaults;
      partDefs.partName = 'Staff ' + staveNo;
      partDefs.partAbbreviation = staveNo.toString() + '.';
      this.partInfo = new SmoPartInfo(partDefs);
    }
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
    params.measureInstrumentMap = {};
    const ikeys: string[] = Object.keys(this.measureInstrumentMap);
    ikeys.forEach((ikey) => {
      params.measureInstrumentMap[ikey] = this.measureInstrumentMap[parseInt(ikey, 10)].serialize();
    });
    this.measures.forEach((measure) => {
      params.measures.push(measure.serialize());
    });
    this.modifiers.forEach((modifier) => {
      params.modifiers.push(modifier.serialize());
    });
    params.partInfo = this.partInfo.serialize();
    return params;
  }

  // ### deserialize
  // parse formerly serialized staff.
  static deserialize(jsonObj: any): SmoSystemStaff {
    const defaults = SmoSystemStaff.defaults;
    const params: SmoSystemStaffParams = SmoSystemStaff.defaults;
    SmoStaffNumberParams.forEach((numParam) => {
      if (typeof (jsonObj[numParam]) === 'number') {
        params[numParam] = jsonObj[numParam];
      } else {
        params[numParam] = defaults[numParam];
      }
    });
    params.measures = [];
    params.modifiers = [];
    if (jsonObj.partInfo) {
      params.partInfo = new SmoPartInfo(jsonObj.partInfo);
    }
    // Up-convert legacy instrument info, which was split between different objects
    if (!jsonObj.measureInstrumentMap) {
      if (jsonObj.instrumentInfo) {
        const defs = SmoInstrument.defaults;
        defs.keyOffset = jsonObj.instrumentInfo.keyOffset;
        defs.clef = jsonObj.instrumentInfo.clef;
        defs.instrumentName = jsonObj.instrumentInfo.instrumentName;
        const ii: SmoInstrument = new SmoInstrument(defs);
        params.measureInstrumentMap = { 0: ii };
      } else {
        const ii: SmoInstrument = new SmoInstrument(SmoInstrument.defaults);
        params.measureInstrumentMap = { 0: ii };
      }
      params.measureInstrumentMap[0].startSelector.staff = params.staffId;
      params.measureInstrumentMap[0].endSelector.staff = params.staffId;
      params.measureInstrumentMap[0].endSelector.measure = jsonObj.measures.length - 1;
      params.measureInstrumentMap[0].keyOffset = jsonObj.measures[0].transposeIndex ?? 0;
    } else {
      const ikeys = Object.keys(jsonObj.measureInstrumentMap);
      ikeys.forEach((ikey) => {
        const ix = parseInt(ikey, 10);
        const inst = jsonObj.measureInstrumentMap[ix];
        const defs = SmoInstrument.defaults;
        SmoInstrumentStringParams.forEach((str) => {
          if (typeof(inst[str]) === 'string') {
            defs[str] = inst[str];
          }
        });
        SmoInstrumentNumParams.forEach((str) => {
          if (typeof(inst[str]) === 'number') {
            defs[str] = inst[str];
          }
        });
        if (typeof(inst.startSelector) !== 'undefined') {
          defs.startSelector = inst.startSelector;
        }
        if (typeof(inst.endSelector) !== 'undefined') {
          defs.endSelector = inst.endSelector;
        }
        params.measureInstrumentMap[ix] = new SmoInstrument(defs);
      });
    }
    const instrumentAr = SmoSystemStaff.getStaffInstrumentArray(params.measureInstrumentMap);
    let curInstrumentIndex = 0;
    jsonObj.measures.forEach((measureObj: any) => {
      const measure = SmoMeasure.deserialize(measureObj);
      if (instrumentAr.length > (curInstrumentIndex + 1) && measure.measureNumber.measureIndex >=
        instrumentAr[curInstrumentIndex + 1].measureIndex) {
        curInstrumentIndex += 1;
      }
      measure.transposeIndex = instrumentAr[curInstrumentIndex].instrument.keyOffset;
      params.measures.push(measure);
    });
    if (jsonObj.modifiers) {
      jsonObj.modifiers.forEach((modParams: any) => {
        const mod = StaffModifierBase.deserialize(modParams);
        params.modifiers.push(mod);
      });
    }
    const rv = new SmoSystemStaff(params);
    return rv;
  }
  updateMeasureFormatsForPart() {
    this.measures.forEach((measure, mix) => {
      if (this.partInfo.measureFormatting[mix]) {
        measure.format = new SmoMeasureFormat(this.partInfo.measureFormatting[mix]);
      } else {
        measure.format = new SmoMeasureFormat(SmoMeasureFormat.defaults);
      }
    });
  }
  /**
   * Get the active instrument at the given measure
   * @param measureIndex
   * @returns
   */
  getStaffInstrument(measureIndex: number): SmoInstrument {
    return SmoSystemStaff.getStaffInstrument(this.measureInstrumentMap, measureIndex);
  }
  updateInstrumentOffsets() {
    const ar = SmoSystemStaff.getStaffInstrumentArray(this.measureInstrumentMap);
    ar.forEach((entry) => {
      let i = entry.instrument.startSelector.measure;
      for (i; i <= entry.instrument.endSelector.measure; ++i) {
        const measure = this.measures[i];
        const concertKey = SmoMusic.vexKeySigWithOffset(measure.keySignature, -1 * measure.transposeIndex);
        measure.transposeIndex = entry.instrument.keyOffset;
        measure.keySignature = SmoMusic.vexKeySigWithOffset(concertKey, measure.transposeIndex);
        measure.setClef(entry.instrument.clef);
      }
    });
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
    const instMap: Record<number, SmoInstrument> = {};
    SmoSystemStaff.getStaffInstrumentArray(this.measureInstrumentMap).forEach((mm) => {
      if (mm.instrument.startSelector.measure > index || mm.instrument.startSelector.measure > this.measures.length - 1) {
        mm.instrument.startSelector.measure -= 1;
      }
      if (mm.instrument.endSelector.measure > index || mm.instrument.endSelector.measure > this.measures.length - 1) {
        mm.instrument.endSelector.measure -= 1;
      }
      instMap[mm.instrument.startSelector.measure] = new SmoInstrument(mm.instrument);
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
    let i: number = 0;
    let renumberIndex = 0;
    for (i = 0; i < this.measures.length; ++i) {
      const measure = this.measures[i];

      renumberIndex = typeof (this.renumberingMap[i]) === 'undefined' ? 0 : this.renumberingMap[i];
      const localIndex: number = renumberIndex + i;
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
