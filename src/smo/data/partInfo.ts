// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Classes to support partsInfo class, for part extraction.  
 * Parts is parts.
 * @module /smo/data/partInfo
 */
import { SmoMeasureFormat } from './measureModifiers';
import { SmoLayoutManager } from './scoreModifiers';
import { SmoTextGroup, SmoTextGroupParamsSer } from './scoreText';
import { StaffModifierBase } from './staffModifiers';

export type SmoPartInfoStringType = 'partName' | 'partAbbreviation';
export const SmoPartInfoStringTypes: SmoPartInfoStringType[] = ['partName', 'partAbbreviation'];
export type SmoPartInfoNumType = 'stavesAfter' | 'stavesBefore';
export const SmoPartInfoNumTypes: SmoPartInfoNumType[] = ['stavesAfter', 'stavesBefore'];
export type SmoPartInfoBooleanType = 'preserveTextGroups' | 'cueInScore' | 'expandMultimeasureRests';
export const SmoPartInfoBooleanTypes: SmoPartInfoBooleanType[] = ['preserveTextGroups', 'cueInScore', 'expandMultimeasureRests'];

export interface SmoMidiInstrument {
  channel: number,
  program: number,
  volume: number,
  pan: number
}
/**
 * Data contained in a part.  A part has its own text, measure formatting and page layouts,
 * and contains the notes from the score.  It can be comprised of 1 or 2 adjacent staves.
 * Usually you will call
 * {@link SmoPartInfo.defaults}, and modify the parameters you need to change.
 * @param partName 
 * @param partAbbreviation
 * @param stavesAfter for multi-stave parts (e.g. piano), indicates the relative position in the full score.
 * @param stavesBefore
 * @param layoutManager page/layout settings for the part
 * @param measureFormatting a map of measure format to measures for the part
 * @param textGroups if preserveTextGroups is true, the part has its own text.
 * @param preseverTextGroups if false, we use the full score text
 * @param cueInScore indicates tiny notes, like for piano accompaniment
 * @category SmoParameters
 */
export interface SmoPartInfoParams {
  /**
   * Name of the part, can be used in headers
   */
  partName: string,
  /**
   * abbrevation of part name
   */
  partAbbreviation: string,
  /**
   * indicates that this part include the next stave  (e.g. piano part)
   */
  stavesAfter: number,
  /**
   * indicates that this part include the previous stave  (e.g. piano part)
   */
  stavesBefore: number,
  /**
   * parts can have their own page settings, zoom settings, etc.
   */
  layoutManager?: SmoLayoutManager;
  /**
   * parts can have their own measure formatting
   */
  measureFormatting?: Record<number, SmoMeasureFormat>,
  /**
   * for part-specific text
   */
  textGroups: SmoTextGroup[],
  /**
   * indicates a part has its own text, not inherited from the score
   */
  preserveTextGroups: boolean,
  /**
   * indicates the part appears as cue size in the score
   */
  cueInScore: boolean,
  /**
   * future, for playback.  TODO: Note staves contain instruments that compete with this.
   * maybe this will be removed
   */
  midiDevice: string | null,
  /**
   * see midiDevice
   */
  midiInstrument: SmoMidiInstrument | null,
  /**
   * indicates multimeasure rests in parts should be expanded.
   */
  expandMultimeasureRests: boolean 
}

/**
 * Serialized part information
 * @category serialization
 */
export interface SmoPartInfoParamsSer  {
  /** constructor */
  ctor: string;
  /**
   * Name of the part, can be used in headers
   */
  partName: string,
  /**
   * abbrevation of part name
   */
  partAbbreviation: string,
  /**
   * indicates that this part include the next stave  (e.g. piano part)
   */
  stavesAfter: number,
  /**
   * indicates that this part include the previous stave  (e.g. piano part)
   */
  stavesBefore: number,
  /**
   * parts can have their own page settings, zoom settings, etc.
   */
  layoutManager?: SmoLayoutManager;
  /**
   * parts can have their own measure formatting
   */
  measureFormatting?: Record<number, SmoMeasureFormat>,
  /**
   * for part-specific text
   */
  textGroups: SmoTextGroupParamsSer[],
  /**
   * indicates a part has its own text, not inherited from the score
   */
  preserveTextGroups: boolean,
  /**
   * indicates the part appears as cue size in the score
   */
  cueInScore: boolean,
  /**
   * future, for playback.  TODO: Note staves contain instruments that compete with this.
   * maybe this will be removed
   */
  midiDevice: string | null,
  /**
   * see midiDevice
   */
  midiInstrument: SmoMidiInstrument | null,
  /**
   * indicates multimeasure rests in parts should be expanded.
   */
  expandMultimeasureRests: boolean   
}
function isSmoPartInfoParamsSer(params: Partial<SmoPartInfoParamsSer>): params is SmoPartInfoParamsSer {
  if (params.ctor && params.ctor === 'SmoPartInfo') {
    return true;
  }
  return false;
}
/**
 * Part info contains information that group 1 or 2 adjacent staves.
 * Parts can have formatting that is indepenedent of the score
 * @category SmoModifier
 */
export class SmoPartInfo extends StaffModifierBase {
  partName: string = '';
  partAbbreviation: string = '';
  layoutManager: SmoLayoutManager;
  measureFormatting: Record<number, SmoMeasureFormat> = {};
  textGroups: SmoTextGroup[] = [];
  stavesAfter: number = 0;
  stavesBefore: number = 0;
  preserveTextGroups: boolean = false;
  cueInScore: boolean = false;
  displayCues: boolean = false;
  expandMultimeasureRests: boolean = false;
  midiInstrument: SmoMidiInstrument| null;
  midiDevice: string | null;
  static get defaults(): SmoPartInfoParams {
    return JSON.parse(JSON.stringify({
      partName: 'Staff ',
      partAbbreviation: '',
      globalLayout: SmoLayoutManager.defaultLayout,
      textGroups: [],
      preserveTextGroups: false,
      pageLayoutMap: {},
      stavesAfter: 0,
      stavesBefore: 0,
      cueInScore: false,
      midiDevice: null,
      midiInstrument: null,
      expandMultimeasureRests: false
    }));
  }
  constructor(params: SmoPartInfoParams) {
    super('SmoPartInfo');
    if (!params.layoutManager) {
      this.layoutManager = new SmoLayoutManager(SmoLayoutManager.defaults);
    } else {
      this.layoutManager = new SmoLayoutManager(params.layoutManager);
    }
    if (typeof(params.measureFormatting) !== 'undefined') {
      const formatKeys = Object.keys(params.measureFormatting);
      formatKeys.forEach((key) => {
        const numKey = parseInt(key, 10);
        this.measureFormatting[numKey] = new SmoMeasureFormat(params.measureFormatting![numKey]);
      });
    }
    if (params.textGroups) {
      this.textGroups = params.textGroups;
    }
    SmoPartInfoStringTypes.forEach((st) => {
      this[st] = params[st];
    });
    SmoPartInfoNumTypes.forEach((st) => {
      this[st] = params[st];
    });
    SmoPartInfoBooleanTypes.forEach((st) => {
      this[st] = params[st] ?? false;
    });
    this.midiDevice = params.midiDevice;
    if (params.midiInstrument) {
      this.midiInstrument = JSON.parse(JSON.stringify(params.midiInstrument));
    } else {
      this.midiInstrument = null;
    }
  }
  serialize(): SmoPartInfoParamsSer {
    const rv: Partial<SmoPartInfoParamsSer> = { ctor: 'SmoPartInfo' };
    SmoPartInfoStringTypes.forEach((st) => {
      rv[st] = this[st];
    });
    SmoPartInfoNumTypes.forEach((st) => {
      rv[st] = this[st];
    });
    SmoPartInfoBooleanTypes.forEach((st) => {
      rv[st] = this[st];
    });
    rv.layoutManager = this.layoutManager.serialize();
    rv.textGroups = [];
    this.textGroups.forEach((tg) => {
      rv.textGroups!.push(tg.serialize());
    });
    rv.measureFormatting = {};
    if (this.midiInstrument) {
      rv.midiInstrument = JSON.parse(JSON.stringify(this.midiInstrument));
    }
    if (this.midiDevice) {
      rv.midiDevice = this.midiDevice;
    }
    Object.keys(this.measureFormatting).forEach((key) => {
      const numKey = parseInt(key, 10);
      rv.measureFormatting![numKey] = this.measureFormatting[numKey];
    });
    if (!isSmoPartInfoParamsSer(rv)) {
      throw 'bad part info ' + JSON.stringify(rv);
    }
    return rv;
  }
  updateTextGroup(textGroup: SmoTextGroup, toAdd: boolean) {
    const tgid = typeof (textGroup) === 'string' ? textGroup :
      textGroup.attrs.id;
    const ar = this.textGroups.filter((tg) => tg.attrs.id !== tgid);
    this.textGroups = ar;
    if (toAdd) {
      this.textGroups.push(textGroup);
    }
  }
}
