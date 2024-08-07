// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScore } from '../../smo/data/score';
import { GlobalLayoutAttributes, SmoLayoutManager } from '../../smo/data/scoreModifiers';
import { SmoTextGroup } from '../../smo/data/scoreText';
import { SmoPartInfo, SmoPartInfoStringType } from '../../smo/data/partInfo';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { SuiToggleComponent } from './components/toggle';
import { ViewMapEntry } from '../../render/sui/scoreView';
import { DialogDefinition, SuiDialogParams } from './dialog';

declare var $: any;

export class SuiPartInfoAdapter extends SuiComponentAdapter {
  partInfo: SmoPartInfo;
  backup: SmoPartInfo;
  selection: SmoSelection;
  changed: boolean = false;
  expandedMultimeasure: boolean = false;
  currentView: ViewMapEntry[] = [];
  resetPart: boolean = false;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.currentView = this.view.getView();
    const selector = SmoSelector.default;
    this.selection = SmoSelection.measureSelection(this.view.score, selector.staff, selector.measure)!;
    this.partInfo = new SmoPartInfo(this.selection.staff.partInfo);
    this.backup = new SmoPartInfo(this.selection.staff.partInfo);
  }
  async update() {
    this.changed = true;
    // Since update will change the displayed score, wait for any display change to complete first.
    await this.view.renderer.updatePromise();
    await this.view.updatePartInfo(this.partInfo);
    // If we are expanding rests, we need to reload the part after setting the 
    // part change.  So we update the part display a second time with the new value.
    if (this.resetPart) {
      this.view.resetPartView();
      await this.view.updatePartInfo(this.partInfo);
      this.resetPart = false;
    }
  }
  writeLayoutValue(attr: GlobalLayoutAttributes, value: number) {
    // no change?
    if (this.partInfo.layoutManager.globalLayout[attr] === value) {
      return;
    }
    this.partInfo.layoutManager.globalLayout[attr] = value;
    this.update();
  }
  writeStringValue(attr: SmoPartInfoStringType, value: string) {
    if (this.partInfo[attr] === value) {
      return;
    }
    this.partInfo[attr] = value;
    this.changed = true;
  }
  get expandMultimeasureRest() {
    return this.partInfo.expandMultimeasureRests;
  }
  set expandMultimeasureRest(value: boolean) {
    this.partInfo.expandMultimeasureRests = value;
    // If expanding rests, we need to re-read the score, so end
    if (value === true) {
      this.resetPart = true;
    }
    this.update();
  }
  get noteSpacing() {
    return this.partInfo.layoutManager.globalLayout.noteSpacing;
  }
  set noteSpacing(value: number) {
    this.writeLayoutValue('noteSpacing', value);
  }
  get pageWidth() {
    return this.partInfo.layoutManager.globalLayout.pageWidth;
  }
  set pageWidth(value: number) {
    this.writeLayoutValue('pageWidth', value);
  }
  get pageHeight() {
    return this.partInfo.layoutManager.globalLayout.pageHeight;
  }
  set pageHeight(value: number) {
    this.writeLayoutValue('pageHeight', value);
  }
  get svgScale() {
    return this.partInfo.layoutManager.globalLayout.svgScale;
  }
  set svgScale(value: number) {
    this.writeLayoutValue('svgScale', value);
  }
  get maxMeasureSystem() {
    return this.partInfo.layoutManager.globalLayout.maxMeasureSystem;
  }
  set maxMeasureSystem(value: number) {
    this.writeLayoutValue('maxMeasureSystem', value);
  }
  get zoomScale() {
    return this.partInfo.layoutManager.globalLayout.zoomScale;
  }
  set zoomScale(value: number) {
    this.writeLayoutValue('zoomScale', value);
  }
  get pageSize() {
    const sz = SmoScore.pageSizeFromDimensions(this.partInfo.layoutManager.globalLayout.pageWidth, this.partInfo.layoutManager.globalLayout.pageHeight);
    if (sz === null) {
      return 'custom';
    }
    return sz;
  }
  set pageSize(value: string) {
    if (value === 'custom') {
      return;
    }
    if (SmoScore.pageDimensions[value]) {
      const dims = SmoScore.pageDimensions[value];
      this.partInfo.layoutManager.globalLayout.pageWidth = dims.width;
      this.partInfo.layoutManager.globalLayout.pageHeight = dims.height;
    }
    this.update();
  }
  get partName(): string {
    return this.partInfo.partName;
  }
  set partName(value: string) {
    this.writeStringValue('partName', value);
  }
  get partAbbreviation(): string {
    return this.partInfo.partAbbreviation;
  }
  set partAbbreviation(value: string) {
    this.writeStringValue('partAbbreviation', value);
  }
  get includeNext(): boolean {
    return this.partInfo.stavesAfter === 1 && this.partInfo.stavesBefore === 0;
  }
  set includeNext(value: boolean) {
    const oldValue = this.partInfo.stavesAfter;
    if (value) {
      this.partInfo.stavesAfter = 1;
    } else {
      this.partInfo.stavesAfter = 0;
    }
    if (oldValue !== this.partInfo.stavesAfter) {
      // special case for a 2-stave score.  The score and the part are the same so we stick to 
      // score view.
      if (this.partInfo.stavesAfter === 1 && this.view.storeScore.staves.length === 2) {
        this.update().then(() => {
          this.view.viewAll();
        });
        return;
      }
    }
    this.update();
  }
  get cueInScore(): boolean {
    return this.partInfo.cueInScore;
  }
  set cueInScore(value: boolean) {
    this.partInfo.cueInScore = value;
    this.update();
  }
  get preserveTextGroups(): boolean {
    return this.partInfo.preserveTextGroups;
  }
  set preserveTextGroups(value: boolean) {
    if (value === true && this.partInfo.textGroups.length === 0) {
      this.view.score.textGroups.forEach((tg) => {
        const ngrp: SmoTextGroup = SmoTextGroup.deserializePreserveId(tg.serialize()) as SmoTextGroup;
        this.partInfo.textGroups.push(ngrp);
      });
    }
    this.partInfo.preserveTextGroups = value;
    this.update();
  }
  async commit() {
    if (this.changed) {
      await this.update();
    }
  }
  async cancel() {
    if (this.changed) {
      this.partInfo = this.backup;
      await this.update();
    }
  }
}
// ## SuiGlobalLayoutDialog
// change editor and formatting defaults for this score.
export class SuiPartInfoDialog extends SuiDialogAdapterBase<SuiPartInfoAdapter> {
  static dialogElements: DialogDefinition =
    {
      label: 'Part Settings', elements:
        [{
          smoName: 'partName',
          control: 'SuiTextInputComponent',
          label: 'Part Name'
        }, {
          smoName: 'partAbbreviation',
          control: 'SuiTextInputComponent',
          label: 'Part Abbrev.'
        }, {
          smoName: 'preserveTextGroups',
          control: 'SuiToggleComponent',
          label: 'Part-specific text'
        }, {
          smoName: 'cueInScore',
          control: 'SuiToggleComponent',
          label: 'Show as Cues in score'
        }, {
          smoName: 'includeNext',
          control: 'SuiToggleComponent',
          label: 'Include Next Staff in Part'
        },  {
          smoName: 'expandMultimeasureRest',
          control: 'SuiToggleComponent',
          label: 'Expand Multimeasure Rests'
        }, {
          smoName: 'noteSpacing',
          defaultValue: SmoLayoutManager.defaults.globalLayout.noteSpacing,
          control: 'SuiRockerComponent',
          dataType: 'percent',
          label: 'Note Spacing'
        }, {
          smoName: 'pageSize',
          defaultValue: SmoScore.pageSizes[0],
          control: 'SuiDropdownComponent',
          label: 'Page Size',
          options: [
            {
              value: 'letter',
              label: 'Letter (Portrait)'
            }, {
              value: 'letterLandscape',
              label: 'Letter (Landscape)'
            }, {
              value: 'tabloid',
              label: 'Tabloid (11x17)'
            }, {
              value: 'A4',
              label: 'A4'
            }, {
              value: 'custom',
              label: 'Custom'
            }]
        }, {
          smoName: 'pageWidth',
          defaultValue: SmoLayoutManager.defaults.globalLayout.pageWidth,
          control: 'SuiRockerComponent',
          label: 'Page Width (px)'
        }, {
          smoName: 'pageHeight',
          defaultValue: SmoLayoutManager.defaults.globalLayout.pageHeight,
          control: 'SuiRockerComponent',
          label: 'Page Height (px)'
        }, {
          smoName: 'zoomScale',
          defaultValue: SmoLayoutManager.defaults.globalLayout.zoomScale,
          control: 'SuiRockerComponent',
          label: '% Zoom',
          dataType: 'percent'
        }, {
          smoName: 'svgScale',
          defaultValue: SmoLayoutManager.defaults.globalLayout.svgScale,
          control: 'SuiRockerComponent',
          label: '% Note size',
          dataType: 'percent'
        }, {
          smoName: 'maxMeasureSystem',
          defaultValue: SmoLayoutManager.defaults.globalLayout.maxMeasureSystem,
          control: 'SuiRockerComponent',
          label: 'Max Measures/System (0=auto)',
          dataType: 'int'
        }],
      staticText: []
    };
  get dimensionControls() {
    return [this.cmap.pageSizeCtrl, this.cmap.pageWidthCtrl, this.cmap.pageHeightCtrl];
  }
  constructor(params: SuiDialogParams) {
    const adapter = new SuiPartInfoAdapter(params.view);
    super(SuiPartInfoDialog.dialogElements, { adapter, ...params });
  }
  async changed() {
    await super.changed();
    if (this.dimensionControls.find((x) => x.changeFlag)) {
      this.initialValue();
    }
    if (this.cmap.includeNextCtrl.changeFlag) {
      const includeNext = this.cmap.includeNextCtrl as SuiToggleComponent;
      if (includeNext.getValue()) {
        const partMap = this.view.getPartMap();
        if (this.view.storeScore.staves.length === 2) {
          this.complete();
        }
      }
    }
  }
}
