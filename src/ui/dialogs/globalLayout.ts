// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScore } from '../../smo/data/score';
import { GlobalLayoutAttributes, SmoLayoutManager, SmoGlobalLayout } from '../../smo/data/scoreModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';

declare var $: any;

export class SuiGlobalLayoutAdapter extends SuiComponentAdapter {
  scoreLayout: SmoGlobalLayout;
  backup: SmoGlobalLayout;
  changed: boolean = false;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.scoreLayout = this.view.score.layoutManager!.globalLayout;
    this.backup = this.view.score.layoutManager!.getGlobalLayout();
    this.view = view;
  }
  writeValue(attr: GlobalLayoutAttributes, value: number) {
    this.scoreLayout[attr] = value;
    this.view.setGlobalLayout(this.scoreLayout)
    this.changed = true;
  }
  get noteSpacing() {
    return this.scoreLayout.noteSpacing;
  }
  set noteSpacing(value: number) {
    this.writeValue('noteSpacing', value);
  }
  get pageWidth() {
    return this.scoreLayout.pageWidth;
  }
  set pageWidth(value: number) {
    this.writeValue('pageWidth', value);
  }
  get pageHeight() {
    return this.scoreLayout.pageHeight;
  }
  set pageHeight(value: number) {
    this.writeValue('pageHeight', value);
  }
  get svgScale() {
    return this.scoreLayout.svgScale;
  }
  set svgScale(value: number) {
    this.writeValue('svgScale', value);
  }
  get zoomScale() {
    return this.scoreLayout.zoomScale;
  }
  set zoomScale(value: number) {
    this.writeValue('zoomScale', value);
  }
  get pageSize() {
    const sz = SmoScore.pageSizeFromDimensions(this.scoreLayout.pageWidth, this.scoreLayout.pageHeight);
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
      this.scoreLayout.pageWidth = dims.width;
      this.scoreLayout.pageHeight = dims.height;
    }
    this.view.setGlobalLayout(this.scoreLayout)
  }
  commit() { }
  cancel() {
    if (this.changed) {
      this.view.setGlobalLayout(this.backup);
    }
  }
}
// ## SuiGlobalLayoutDialog
// change editor and formatting defaults for this score.
export class SuiGlobalLayoutDialog extends SuiDialogAdapterBase<SuiGlobalLayoutAdapter> {
  static dialogElements: DialogDefinition =
    {
      label: 'Global Settings', elements:
        [{
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
  static createAndDisplay(parameters: SuiDialogParams) {
    const dg = new SuiGlobalLayoutDialog(parameters);
    dg.display();
  }
  get dimensionControls() {
    return [this.cmap.pageSizeCtrl, this.cmap.pageWidthCtrl, this.cmap.pageHeightCtrl];
  }
  constructor(params: SuiDialogParams) {
    const adapter = new SuiGlobalLayoutAdapter(params.view);
    super(SuiGlobalLayoutDialog.dialogElements, { adapter, ...params });
  }
  changed() {
    super.changed();
    if (this.dimensionControls.find((x) => x.changeFlag)) {
      this.initialValue();
    }
  }
}
