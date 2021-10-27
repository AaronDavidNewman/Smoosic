// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMeasureFormat } from './measureModifiers';
import { SmoGlobalLayout, SmoPageLayout, SmoLayoutManager, SmoTextGroup } from './scoreModifiers';

const VF = eval('Vex.Flow');

export interface SmoPartInfoParams {
  partName: string,
  partAbbreviation: string,
  globalLayout: SmoGlobalLayout,
  pageLayoutMap: Record<number, SmoPageLayout>,
  stavesAfter: number,
  stavesBefore: number,
  measureFormatting?: Record<number, SmoMeasureFormat>,
  textGroups?: SmoTextGroup[]
}
export class SmoPartInfo {
  partName: string;
  partAbbreviation: string;
  globalLayout: SmoGlobalLayout = SmoLayoutManager.defaultLayout;
  pageLayoutMap: Record<number, SmoPageLayout> = {};
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
    this.globalLayout = params.globalLayout;
    if (Object.keys(params.pageLayoutMap).length > 0) {
      this.pageLayoutMap = params.pageLayoutMap;
    } else {
      this.pageLayoutMap[0] = new SmoPageLayout(SmoPageLayout.defaults);
    }
    if (params.measureFormatting) {
      this.measureFormatting = params.measureFormatting;
    }
    if (params.textGroups) {
      this.textGroups = params.textGroups;
    }
    this.stavesAfter = params.stavesAfter;
    this.stavesBefore = params.stavesBefore;
    this.partName = params.partName;
    this.partAbbreviation = params.partAbbreviation;
  }
}
