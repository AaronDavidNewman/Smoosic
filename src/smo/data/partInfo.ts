// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Classes to support partsInfo class, for part extraction.  
 * Parts is parts.
 * @module /smo/data/partInfo
 */
import { SmoMeasureFormat } from './measureModifiers';
import { SmoLayoutManager, SmoTextGroup } from './scoreModifiers';
import { StaffModifierBase } from './staffModifiers';

const VF = eval('Vex.Flow');

export type SmoPartInfoStringType = 'partName' | 'partAbbreviation';
export const SmoPartInfoStringTypes: SmoPartInfoStringType[] = ['partName', 'partAbbreviation'];
export type SmoPartInfoNumType = 'stavesAfter' | 'stavesBefore';
export const SmoPartInfoNumTypes: SmoPartInfoNumType[] = ['stavesAfter', 'stavesBefore'];
export type SmoPartInfoBooleanType = 'preserveTextGroups' | 'cueInScore' | 'expandMultimeasureRests';
export const SmoPartInfoBooleanTypes: SmoPartInfoBooleanType[] = ['preserveTextGroups', 'cueInScore', 'expandMultimeasureRests'];

/**
 * Data contained in a part.  A part has its own text, measure formatting and page layouts,
 * and contains the notes from the score.  It can be comprised of 1 or 2 adjacent staves.
 * Usually you will call
 * {@link PartInfo.defaults}, and modify the parameters you need to change.
 * @param partName Name of the part, can be used in headers
 * @param partAbbreviation
 * @param stavesAfter for multi-stave parts (e.g. piano), indicates the relative position in the full score.
 * @param stavesBefore
 * @param layoutManager page/layout settings for the part
 * @param measureFormatting a map of measure format to measures for the part
 * @param textGroups if preserveTextGroups is true, the part has its own text.
 * @param preseverTextGroups if false, we use the full score text
 * @param cueInScore indicates tiny notes, like for piano accompaniment
 * @category SmoModifier
 */
export interface SmoPartInfoParams {
  partName: string,
  partAbbreviation: string,
  stavesAfter: number,
  stavesBefore: number,
  layoutManager?: SmoLayoutManager;
  measureFormatting?: Record<number, SmoMeasureFormat>,
  textGroups: SmoTextGroup[],
  preserveTextGroups: boolean,
  cueInScore: boolean,
  expandMultimeasureRests: boolean // not persisted
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
  }
  serialize() {
    const rv : any = {};
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
      rv.textGroups.push(tg.serialize());
    });
    rv.measureFormatting = {};
    Object.keys(this.measureFormatting).forEach((key) => {
      const numKey = parseInt(key, 10);
      rv.measureFormatting[numKey] = this.measureFormatting[numKey];
    });
    return rv;
  }
}
