// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMeasureFormat } from './measureModifiers';
import { SmoLayoutManager, SmoTextGroup } from './scoreModifiers';
import { StaffModifierBase } from './staffModifiers';

const VF = eval('Vex.Flow');

export type SmoPartInfoStringType = 'partName' | 'partAbbreviation';
export const SmoPartInfoStringTypes: SmoPartInfoStringType[] = ['partName', 'partAbbreviation'];
export type SmoPartInfoNumType = 'stavesAfter' | 'stavesBefore';
export const SmoPartInfoNumTypes: SmoPartInfoNumType[] = ['stavesAfter', 'stavesBefore'];

export interface SmoPartInfoParams {
  partName: string,
  partAbbreviation: string,
  stavesAfter: number,
  stavesBefore: number,
  layoutManager?: SmoLayoutManager;
  measureFormatting?: Record<number, SmoMeasureFormat>,
  textGroups?: SmoTextGroup[]
}
export class SmoPartInfo extends StaffModifierBase {
  partName: string;
  partAbbreviation: string;
  layoutManager: SmoLayoutManager;
  measureFormatting: Record<number, SmoMeasureFormat> = {};
  textGroups: SmoTextGroup[] = [];
  stavesAfter: number = 0;
  stavesBefore: number = 0;
  static get defaults(): SmoPartInfoParams {
    return JSON.parse(JSON.stringify({
      partName: 'Staff ',
      partAbbreviation: '',
      globalLayout: SmoLayoutManager.defaultLayout,
      pageLayoutMap: {},
      stavesAfter: 0,
      stavesBefore: 0
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
    this.stavesAfter = params.stavesAfter;
    this.stavesBefore = params.stavesBefore;
    this.partName = params.partName;
    this.partAbbreviation = params.partAbbreviation;
  }
  serialize() {
    const rv : any = {};
    SmoPartInfoStringTypes.forEach((st) => {
      rv[st] = this[st];
    });
    SmoPartInfoNumTypes.forEach((st) => {
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
