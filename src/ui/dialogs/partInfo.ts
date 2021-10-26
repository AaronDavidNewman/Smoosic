// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScore } from '../../smo/data/score';
import { GlobalLayoutAttributes, SmoLayoutManager, SmoGlobalLayout } from '../../smo/data/scoreModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { SmoPartInfo, SmoPartInfoParams } from '../../smo/data/systemStaff';
import { SmoSelection } from '../../smo/xform/selections';
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';

declare var $: any;

export class SuiPartInfoAdapter extends SuiComponentAdapter {
  partInfo: SmoPartInfo;
  backup: SmoPartInfo;
  selection: SmoSelection;
  changed: boolean = false;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.selection = this.view.tracker.selections[0];
    this.partInfo = this.selection.staff.partInfo;
    this.backup = new SmoPartInfo(this.selection.staff.partInfo);
    this.view.exposePart(this.selection.staff);
  }
  writeValue(attr: GlobalLayoutAttributes, value: number) {
    this.partInfo.globalLayout[attr] = value;
    this.view.updatePartInfo(this.partInfo);
    this.changed = true;
  }
  get noteSpacing() {
    return this.partInfo.globalLayout.noteSpacing;
  }
  set noteSpacing(value: number) {
    this.writeValue('noteSpacing', value);
  }
  get pageWidth() {
    return this.partInfo.globalLayout.pageWidth;
  }
  set pageWidth(value: number) {
    this.writeValue('pageWidth', value);
  }
  get pageHeight() {
    return this.partInfo.globalLayout.pageHeight;
  }
  set pageHeight(value: number) {
    this.writeValue('pageHeight', value);
  }
  get svgScale() {
    return this.partInfo.globalLayout.svgScale;
  }
  set svgScale(value: number) {
    this.writeValue('svgScale', value);
  }
  get zoomScale() {
    return this.partInfo.globalLayout.zoomScale;
  }
  set zoomScale(value: number) {
    this.writeValue('zoomScale', value);
  }
  get pageSize() {
    const sz = SmoScore.pageSizeFromDimensions(this.partInfo.globalLayout.pageWidth, this.partInfo.globalLayout.pageHeight);
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
      this.partInfo.globalLayout.pageWidth = dims.width;
      this.partInfo.globalLayout.pageHeight = dims.height;
    }
    this.view.updatePartInfo(this.partInfo);
  }
  get partName(): string {
    return this.partInfo.partName;
  }
  set partName(value: string) {
    this.partInfo.partName = value;
    this.view.updatePartInfo;
  }
  get partAbbreviation(): string {
    return this.partInfo.partName;
  }
  set partAbbreviation(value: string) {
    this.partInfo.partName = value;
    this.view.updatePartInfo;
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
    this.view.updatePartInfo(this.partInfo);;
  }
  commit() { }
  cancel() {
    if (this.changed) {
      this.view.updatePartInfo(this.backup);
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
