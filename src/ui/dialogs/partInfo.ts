// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScore } from '../../smo/data/score';
import { GlobalLayoutAttributes, SmoLayoutManager } from '../../smo/data/scoreModifiers';
import { SmoPartInfo, SmoPartInfoStringType } from '../../smo/data/partInfo';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { ViewMapEntry } from '../../render/sui/scoreView';
import { DialogDefinition, SuiDialogParams } from './dialog';

declare var $: any;

export class SuiPartInfoAdapter extends SuiComponentAdapter {
  partInfo: SmoPartInfo;
  backup: SmoPartInfo;
  selection: SmoSelection;
  changed: boolean = false;
  currentView: ViewMapEntry[] = [];
  restoreView: boolean = true;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.currentView = this.view.getView();
    const selection = this.view.tracker.selections[0];
    const selector = SmoSelector.default;

    // Note: this will change the score, need to reselect.  The new score will have the part as the 
    // 0th stave
    this.view.exposePart(selection.staff);
    this.selection = SmoSelection.measureSelection(this.view.score, selector.staff, selector.measure)!;
    this.partInfo = this.selection.staff.partInfo;
    this.backup = new SmoPartInfo(this.selection.staff.partInfo);
  }
  update() {
    const self = this;
    this.changed = true;
    this.view.renderer.updatePromise().then(() => {
      self.view.updatePartInfo(self.partInfo);
    })
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
  }
  get restoreScoreView() {
    return this.restoreView;
  }
  set restoreScoreView(value: boolean) {
    this.restoreView = value;
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
    if (value) {
      this.partInfo.stavesAfter = 1;
    } else {
      this.partInfo.stavesAfter = 0;
    }
    this.update();
  }
  restoreViewMap() {
    const current = this.currentView;
    const viewObj = this.view;
    this.view.renderer.updatePromise().then(() => {
      viewObj.setView(current);
    });
  }
  commit() {
    if (this.restoreView) {
      this.restoreViewMap();
    }
  }
  cancel() {
    if (this.changed) {
      this.update();
    }
    // restore previous view
    if (this.restoreView) {
      this.restoreViewMap();
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
          defaultValue: SmoLayoutManager.defaults.globalLayout.noteSpacing,
          control: 'SuiTextInputComponent',
          label: 'Part Name'
        }, {
          smoName: 'partAbbreviation',
          defaultValue: SmoLayoutManager.defaults.globalLayout.noteSpacing,
          control: 'SuiTextInputComponent',
          label: 'Part Abbrev.'
        }, {
          smoName: 'includeNext',
          defaultValue: SmoLayoutManager.defaults.globalLayout.noteSpacing,
          control: 'SuiToggleComponent',
          label: 'Include Next'
        }, {
          smoName: 'restoreScoreView',
          defaultValue: SmoLayoutManager.defaults.globalLayout.noteSpacing,
          control: 'SuiToggleComponent',
          label: 'Restore View on Close'
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
  changed() {
    super.changed();
    if (this.dimensionControls.find((x) => x.changeFlag)) {
      this.initialValue();
    }
  }
}
