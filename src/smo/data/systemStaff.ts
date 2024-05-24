// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Classes to support a {@link SmoSystemStaff}, which is a container for measures and
 * staff modifiers.
 * @module /smo/data/systemStaff
 * **/
import { SmoObjectParams, SmoAttrs, MeasureNumber, getId, 
   createXmlAttribute } from './common';
import { SmoMusic } from './music';
import { SmoMeasure, SmoMeasureParamsSer } from './measure';
import { SmoMeasureFormat, SmoRehearsalMark, SmoRehearsalMarkParams, SmoTempoTextParams, SmoVolta, SmoBarline } from './measureModifiers';
import { SmoInstrumentParams, StaffModifierBase, SmoInstrument, SmoInstrumentMeasure, SmoInstrumentStringParams, SmoInstrumentNumParams, 
  SmoTie, SmoStaffTextBracket, SmoStaffTextBracketParamsSer, 
  StaffModifierBaseSer, SmoTabStave, SmoTabStaveParamsSer } from './staffModifiers';
import { SmoPartInfo, SmoPartInfoParamsSer } from './partInfo';
import { SmoTextGroup } from './scoreText';
import { SmoSelector } from '../xform/selections';
import { SmoBeamer } from '../xform/beamers';
import { smoSerialize } from '../../common/serializationHelpers';
import { FontInfo } from '../../common/vex';
/**
 * indicate that we need to serialize the key signature, etc.
 * maps beause we are going to be deserializing again in a different score
 */
export interface SmoStaffSerializationOptions {
  skipMaps: boolean
}
/**
 * Constructor parameters for {@link SmoSystemStaff}.
 * Usually you will call
 * {@link SmoSystemStaff.defaults}, and modify the parameters you need to change,
 * or get the defaults from an existing staff
 * @param renumberingMap For alternate number, pickups, etc.
 * @param keySignatureMap map of keys to measures
 * @param measureInstrumentMap map of instruments to staves
 * @param measures array of {@link SmoMeasure}
 * @param modifiers slurs and such
 * @param partInfo 
 * @category SmoParameters
 */
export interface SmoSystemStaffParams {
  /* the index of the staff in the score */
  staffId: number,
  /**
   *   For alternate number, pickups, etc.
   * */ 
  renumberingMap: Record<number, number>,
  /**
   * map of keys to measures 
   */
  keySignatureMap: Record<number, string>,
  /* map of instruments to staves */
  measureInstrumentMap: Record<number, SmoInstrumentParams>,
  /**
   * array of {@link SmoMeasure})
   */
  measures: SmoMeasure[],
  /** 
   * modifiers slurs and such
   * */ 
  modifiers: StaffModifierBase[],
  /**
   * information about the part
   */
  partInfo?: SmoPartInfo;
  /**
   * text lines
   */
  textBrackets?: SmoStaffTextBracket[];
  /**
   *guitar tablature
   */
  tabStaves: SmoTabStave[]
}
/**
 * Serialized components of a stave
 * @category serialization
 */
export interface SmoSystemStaffParamsSer {  
  /**
   * class name
   */
  ctor: string,
  /**
   * index of the staff
   */
  staffId: number,
  /**
   * map of measure numbers vs. indices of measures
   */
  renumberingMap?: Record<number, number>,
  /**
   * locations of key signature changes
   */
  keySignatureMap?: Record<number, string>,
  /**
   * map of measures to instruments (clef, transpose, sounds)
   */
  measureInstrumentMap: Record<number, SmoInstrumentParams>,
  /**
   * measure container
   */
  measures: SmoMeasureParamsSer[],
  /**
   * array of modifiers like slurs
   */
  modifiers: StaffModifierBaseSer[],
  /**
   * Associated part information for this stave
   */
  partInfo: SmoPartInfoParamsSer;
  /**
   * text brackets are another kind of modifier
   */
  textBrackets: SmoStaffTextBracketParamsSer[];
  /**
   * guitar tablature
   */
  tabStaves: SmoTabStave[];
}

function isSmoSystemStaffParamsSer(params: Partial<SmoSystemStaffParamsSer>):params is SmoSystemStaffParamsSer {
  if (!(typeof(params.ctor) === 'string' && params.ctor === 'SmoSystemStaff')) {
    return false;
  }
  if (!(Array.isArray(params.measures))) {
    return false;
  }
  return true;
}
/**
 * A staff is a line of music that can span multiple measures.
 * A system is a line of music for each staff in the score.  So a staff
 * spans multiple systems.
 * A staff modifier connects 2 points in the staff.
 * @category SmoObject
 * */
export class SmoSystemStaff implements SmoObjectParams {
  /**
   * Gets the instrument assigned to a given measure
   * @param measureInstrumentMap
   * @param measureIndex 
   * @returns 
   */
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
  staffId: number = 0;
  renumberingMap: Record<number, number> = {};
  keySignatureMap: Record<number, string> = {};
  partInfo: SmoPartInfo;
  measureInstrumentMap: Record<number, SmoInstrument> = {};
  measures: SmoMeasure[] = [];
  modifiers: StaffModifierBase[] = [];
  textBrackets: SmoStaffTextBracket[] = [];
  bracketMap: Record<number, SVGSVGElement[]> = {};
  tabStaves: SmoTabStave[] = [];
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
      staffId: 0,
      renumberingMap: {},
      keySignatureMap: {},
      measureInstrumentMap: {},
      textBrackets: [],
      measures: [],
      modifiers: [],
      tabStaves: []
    }));
  }
  setMappedStaffId(value: number) {
    this._mappedStaffId = value;
  }
  getMappedStaffId(): number {
    return this._mappedStaffId;
  }

  constructor(params: SmoSystemStaffParams) {
    this.staffId = params.staffId;
    this.measures = params.measures;
    this.modifiers = params.modifiers;
    this.textBrackets = params.textBrackets ?? [];
    this.renumberingMap = params.renumberingMap;
    this.tabStaves = params.tabStaves;
    if (Object.keys(params.measureInstrumentMap).length === 0) {
      const instrument = new SmoInstrument(SmoInstrument.defaults);
      instrument.startSelector.staff = instrument.endSelector.staff = this.staffId;
      instrument.endSelector.measure = this.measures.length - 1;
      this.measureInstrumentMap[0] = instrument;
    } else {
      const keys = Object.keys(params.measureInstrumentMap);
      keys.forEach((p, ix) => {
        const pnum = parseInt(p, 10);
        const instrument = new SmoInstrument(params.measureInstrumentMap[pnum]);
        instrument.startSelector.staff = instrument.endSelector.staff = this.staffId;

        // Make sure transposition goes to the end stave of the song.
        if (ix === keys.length - 1) {
          instrument.endSelector.measure = this.measures.length - 1;
        }
        this.measureInstrumentMap[pnum] = instrument;
      });
    }
    if (this.measures.length) {
      this.numberMeasures();
    }
    this.attrs = {
      id: getId().toString(),
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
  /**
   * records need to be serialized separately from other elements in parameters
   *
   * @static
   * @type {string[]}
   * @memberof SmoSystemStaff
   */
  static serializableElements: string[] = ['ctor', 'staffId'];
  static recordElements: string[] = ['renumberingMap', 'keySignatureMap', 'measureInstrumentMap'];
  
  // ### defaultParameters
  // the parameters that get saved with the score.
  static get defaultParameters() {
    return [
      'renumberingMap', 'keySignatureMap', 'instrumentInfo'];
  }

  get renderableModifiers() {
    const rv: StaffModifierBase[] = 
      this.modifiers.concat(this.textBrackets);
    return rv;
  }
  // ### serialize
  // JSONify self.
  serialize(options: SmoStaffSerializationOptions): SmoSystemStaffParamsSer {
    const params: Partial<SmoSystemStaffParamsSer> = {
      ctor: 'SmoSystemStaff',
      tabStaves: []
    };
    if (!options.skipMaps) {
      smoSerialize.serializedMerge(SmoSystemStaff.defaultParameters, this, params);
    }
    params.measures = [];
    params.measureInstrumentMap = {};
    const ikeys: string[] = Object.keys(this.measureInstrumentMap);
    this.tabStaves.forEach((ts) => {
      params.tabStaves?.push(ts.serialize());
    });
    ikeys.forEach((ikey: string) => {
      params.measureInstrumentMap![parseInt(ikey, 10)] = this.measureInstrumentMap[parseInt(ikey, 10)].serialize();
    });
    this.measures.forEach((measure) => {
      params.measures!.push(measure.serialize());
    });
    params.modifiers = [];
    this.modifiers.forEach((modifier) => {
      params.modifiers!.push(modifier.serialize());
    });
    this.textBrackets.forEach((bracket) => {
      params.modifiers!.push(bracket.serialize());
    });
    params.partInfo = this.partInfo.serialize();
    if (!isSmoSystemStaffParamsSer(params)) {
      throw ('bad staff ' + JSON.stringify(params));
    }
    return params;
  }
  // ### deserialize
  // parse formerly serialized staff.
  static deserialize(jsonObj: SmoSystemStaffParamsSer): SmoSystemStaff {
    const params: SmoSystemStaffParams = SmoSystemStaff.defaults;
    params.staffId = jsonObj.staffId ?? 0;
    params.measures = [];
    params.modifiers = [];
    params.textBrackets = [];
    params.renumberingMap = jsonObj.renumberingMap ?? {};
    if (jsonObj.tabStaves) {
      jsonObj.tabStaves.forEach((ts) => {
        params.tabStaves.push(StaffModifierBase.deserialize(ts));
      });
    }
    if (jsonObj.partInfo) {
      // Deserialize the text groups first
      const tgs: SmoTextGroup[] = [];
      jsonObj.partInfo.textGroups.forEach((tgSer: any) => {
        tgs.push(SmoTextGroup.deserializePreserveId(tgSer));
      });
      jsonObj.partInfo.textGroups = tgs;
      params.partInfo = SmoPartInfo.deserialize(jsonObj.partInfo);
    }
    // Up-convert legacy instrument info, which was split between different objects
    if (!jsonObj.measureInstrumentMap) {
      const jsonLegacy = jsonObj as any;
      if (jsonLegacy.instrumentInfo) {
        const defs = SmoInstrument.defaults;
        defs.keyOffset = jsonLegacy.instrumentInfo.keyOffset;
        defs.clef = jsonLegacy.instrumentInfo.clef;
        defs.instrumentName = jsonLegacy.instrumentInfo.instrumentName;
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
        mod.associatedStaff = jsonObj.staffId;
        if (mod.ctor === 'SmoStaffTextBracket') {
          params.textBrackets!.push(mod as SmoStaffTextBracket);
        } else {
          params.modifiers.push(mod);
        }
      });
    }
    const rv = new SmoSystemStaff(params);
    return rv;
  }
  /**
   * We have created a score with staff mappings.  Update the selectors in staff modifiers so that
   * 'from' in the staff slot is 'to'
   */
  mapStaffFromTo(from: number, to: number) {
    if (from === to) {
      return;
    }
    this.modifiers.forEach((mod) => {
      if (mod.startSelector.staff === from) {
        mod.startSelector.staff = to;
      }
      if (mod.endSelector.staff === from) {
        mod.endSelector.staff = to;
      }
      mod.associatedStaff = to; // this.staffId will remap to 'to' value
    });
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
  getInstrumentList(): SmoInstrument[] {
    const rv: SmoInstrument[] = [];
    const keys = Object.keys(this.measureInstrumentMap);
    keys.forEach((key) => {
      rv.push(this.getStaffInstrument(parseInt(key)));
    });
    return rv;
  }
  updateInstrumentOffsets() {
    const ar = SmoSystemStaff.getStaffInstrumentArray(this.measureInstrumentMap);
    ar.forEach((entry) => {
      let i = entry.instrument.startSelector.measure;
      for (i; i <= entry.instrument.endSelector.measure && i < this.measures.length; ++i) {
        const measure = this.measures[i];
        const concertKey = SmoMusic.vexKeySigWithOffset(measure.keySignature, -1 * measure.transposeIndex);
        const targetKey = SmoMusic.vexKeySigWithOffset(concertKey, entry.instrument.keyOffset);
        measure.transposeToOffset(entry.instrument.keyOffset, targetKey, entry.instrument.clef);
        measure.transposeIndex = entry.instrument.keyOffset;
        measure.keySignature = targetKey;
        measure.setClef(entry.instrument.clef);
      }
    });
  }
  isRest(index: number) {
    return this.measures[index].isRest();
  }
  /**
   * for the purposes of breaking up multimeasure rests, isRepeat is true if
   * the next bar has a start repeat, or the current bar has an end repeat.
   * @param index 
   * @returns 
   */
  isRepeat(index: number) {
    if (index < this.measures.length - 1) {
      if (this.measures[index + 1].getStartBarline().barline !== SmoBarline.barlines.singleBar && 
      this.measures[index + 1].getStartBarline().barline !== SmoBarline.barlines.noBar) {
        return true;
      }
    }
    const specialBar = this.measures[index].getEndBarline().barline !== SmoBarline.barlines.singleBar &&
       this.measures[index].getStartBarline().barline !== SmoBarline.barlines.noBar;
    return specialBar || this.measures[index].repeatSymbol;
  }
  isRepeatSymbol(index: number) {
    return this.measures[index].repeatSymbol;
  }
  isRehearsal(index: number) {
    return !(typeof(this.measures[index].getRehearsalMark()) === 'undefined');
  }
  removeTabStaves(delList: SmoTabStave[]) {
    if (delList.length < 1) {
      return;
    }
    const newList: SmoTabStave[] = [];
    this.tabStaves.forEach((ts) => {
      if (delList.findIndex((xx:SmoTabStave) => xx.attrs.id === ts.attrs.id) < 0) {
        newList.push(ts);
      }
    });
    this.tabStaves = newList;
  }
  updateTabStave(ts: SmoTabStave) {
    if (ts.allMeasures) {
      ts.startSelector.measure = 0;
      ts.endSelector.measure = this.measures.length - 1;
      this.tabStaves = [ts];
      return;
    }
    if (!this.tabStaves.length) {
      this.tabStaves.push(ts);
      return;
    }
    const toRemove: SmoTabStave[] = [];
    for (var i = 0; i < this.tabStaves.length; ++i) {
      const ex = this.tabStaves[i];
      if (SmoTabStave.overlaps(ex, ts)) {
        const starts = SmoSelector.order(ex.startSelector, ts.startSelector);
        const ends = SmoSelector.order(ex.startSelector, ex.endSelector);
        // If the tabs are the same type and overlap, then just merge them
        if (SmoTabStave.featuresEqual(ex, ts)) {
          ts.startSelector = starts[0];
          ts.endSelector = ends[1];
        }
        toRemove.push(ex);
      }
    }
    this.removeTabStaves(toRemove);
    this.tabStaves.push(ts);
  }
  getTabStaveForMeasure(selector: SmoSelector): SmoTabStave | undefined {
    return this.tabStaves.find((ts) => 
      SmoSelector.sameStaff(ts.startSelector, selector) && ts.startSelector.measure <= selector.measure
        && ts.endSelector.measure >= selector.measure);
  }
  getTabStavesForMeasureRow(measures: SmoMeasure[]) {
    const rv: SmoTabStave[] = [];
    const added: Record<string, boolean> = {};
    measures.forEach((mm) => {
      const ts = this.getTabStaveForMeasure(SmoSelector.measureSelector(mm.measureNumber.staffId, mm.measureNumber.measureIndex));
      if (ts && !added[ts.attrs.id]) {
        added[ts.attrs.id] = true;
        rv.push(ts);
      }
    });
    return rv;
  }
  // ### addStaffModifier
  // add a staff modifier, or replace a modifier of same type
  // with same endpoints.
  addStaffModifier(modifier: StaffModifierBase) {
    this.removeStaffModifier(modifier);
    this.modifiers.push(modifier);
    modifier.associatedStaff = this.staffId;
  }

  // ### removeStaffModifier
  // Remove a modifier of given type and location
  removeStaffModifier(modifier: StaffModifierBase) {
    const mods: StaffModifierBase[] = [];
    const tbs: SmoStaffTextBracket[] = [];
    this.renderableModifiers.forEach((mod: StaffModifierBase) => {
      if (mod.attrs.type !== modifier.attrs.type ||
        SmoSelector.neq(mod.startSelector, modifier.startSelector) ||
        SmoSelector.neq(mod.endSelector, modifier.endSelector)) {
          if (mod.ctor === 'SmoStaffTextBracket') {
            tbs.push(mod as SmoStaffTextBracket);
          } else {
            mods.push(mod);
          }
      }
    });
    this.textBrackets = tbs;
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
  getVoltasForMeasure(ix: number) {
    const rv: SmoVolta[] = [];
    this.measures.forEach((measure) => {
      measure.getNthEndings().forEach((ending) => {
        if (ending.startSelector?.measure === ix ||  ending.endSelector?.measure === ix) {
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
    return this.renderableModifiers.find((mod) =>
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
  addTextBracket(bracketParams: SmoStaffTextBracket) {
    const nb = new SmoStaffTextBracket(bracketParams);
    const brackets = this.textBrackets.filter((tb) => SmoSelector.lteq(tb.startSelector, nb.startSelector)
      || SmoSelector.gteq(tb.endSelector, nb.startSelector) || tb.position !== nb.position);
   
    brackets.push(new SmoStaffTextBracket(bracketParams));
    
  }
  removeTextBracket(bracketParams: SmoStaffTextBracket) {    
    const nb = new SmoStaffTextBracket(bracketParams);
    const brackets = this.textBrackets.filter((tb) => SmoSelector.lteq(tb.startSelector, nb.startSelector)
      || SmoSelector.gteq(tb.endSelector, nb.startSelector) || tb.position !== nb.position);
      brackets.push(new SmoStaffTextBracket(bracketParams));
      this.textBrackets = brackets;
  }
  getTextBracketsStartingAt(selector: SmoSelector) {
    return this.textBrackets.filter((tb) => SmoSelector.eq(tb.startSelector, selector));
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

  getTiesStartingAt(selector: SmoSelector): SmoTie[] {
    return this.modifiers.filter((mod) =>
      SmoSelector.sameNote(mod.startSelector, selector) && mod.attrs.type === 'SmoTie'
    ) as SmoTie[];
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
      SmoBeamer.applyBeams(measure);
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
    this.measures[index].resetTempo();
  }

  addTempo(tempo: SmoTempoTextParams, index: number) {
    this.measures[index].setTempo(tempo);
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
    this.tabStaves.forEach((ts) => {
      ts.endSelector.measure = this.measures.length - 1;
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
    let localIndex = 0;
    for (i = 0; i < this.measures.length; ++i) {
      const measure = this.measures[i];
      if (typeof(this.renumberingMap[i]) === 'number') {
        localIndex = this.renumberingMap[i];
      } else {
        localIndex += 1;
      }
      // since systemIndex is a render-time decision, we don't update it here.
      const systemIndex = measure.measureNumber.systemIndex;
      // If this is the first full measure, call it '1'
      const numberObj: MeasureNumber = {
        localIndex,
        measureIndex: i,
        systemIndex,
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
    // If there is a tab stave, it should extend the length of the stave.
    this.tabStaves.forEach((ts) => {
        ts.endSelector.measure = this.measures.length - 1;
    });
    this.numberMeasures();
  }
}
